import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Transaction } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all'; // 'all', 'pending', 'approved', 'rejected'
    const dateRange = searchParams.get('dateRange') || 'all'; // 'all', 'today', 'week', 'month', 'custom'
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const sort = searchParams.get('sort') || 'date-desc';

    const skip = (page - 1) * limit;

    const query = { type: 'withdrawal' };

    // Status filter
    if (status === 'pending') {
      query.status = 'pending';
    } else if (status === 'approved') {
      query.status = 'completed';
    } else if (status === 'rejected') {
      query.status = { $in: ['failed', 'rejected', 'cancelled'] };
    }

    // Search query filter (Username, User ID, Phone, Amount, Date)
    if (search.trim() !== '') {
      const searchTrim = search.trim();
      const rx = new RegExp(searchTrim, 'i');

      const matchedUsers = await User.find({
        $or: [
          { username: rx },
          { phone: rx }
        ]
      }).select('_id');
      const userIds = matchedUsers.map(u => u._id);

      const orConditions = [
        { user_id: { $in: userIds } },
        { user_username: rx },
        { user_phone: rx }
      ];

      // If search is a valid ObjectId, search by user_id directly
      if (mongoose.Types.ObjectId.isValid(searchTrim)) {
        orConditions.push({ user_id: new mongoose.Types.ObjectId(searchTrim) });
      }

      // If search is a number, search by amount (either positive or negative)
      const numAmount = parseFloat(searchTrim);
      if (!isNaN(numAmount)) {
        orConditions.push({ amount: numAmount });
        orConditions.push({ amount: -numAmount });
      }

      query.$or = orConditions;
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      if (dateRange === 'today') {
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        query.created_at = { $gte: startOfToday };
      } else if (dateRange === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.created_at = { $gte: oneWeekAgo };
      } else if (dateRange === 'month') {
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        query.created_at = { $gte: oneMonthAgo };
      } else if (dateRange === 'custom') {
        const dateConditions = {};
        if (startDateStr) {
          dateConditions.$gte = new Date(startDateStr);
        }
        if (endDateStr) {
          const endOfDay = new Date(endDateStr);
          endOfDay.setHours(23, 59, 59, 999);
          dateConditions.$lte = endOfDay;
        }
        if (Object.keys(dateConditions).length > 0) {
          query.created_at = dateConditions;
        }
      }
    }

    // Sort options
    let sortObj = { created_at: -1 };
    if (sort === 'date-asc') {
      sortObj = { created_at: 1 };
    } else if (sort === 'amount-desc') {
      sortObj = { amount: 1 }; // negative amount, so sorting ascending by raw value gives the largest absolute withdrawal
    } else if (sort === 'amount-asc') {
      sortObj = { amount: -1 }; // sorting descending gives the smallest absolute withdrawal
    }

    const total = await Transaction.countDocuments(query);
    const rawWithdrawals = await Transaction.find(query)
      .populate('user_id', 'username phone support_id wallet_balance')
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const withdrawalsList = rawWithdrawals.map(t => ({
      id: t._id.toString(),
      user_id: t.user_id ? t.user_id._id.toString() : null,
      user_name: t.user_username || (t.user_id ? t.user_id.username : 'Unknown'),
      user_phone: t.user_phone || (t.user_id ? t.user_id.phone : 'Unknown'),
      type: t.type,
      amount: t.amount,
      status: t.status,
      utr: t.utr || null,
      created_at: t.created_at,
      resolved_at: t.resolved_at || t.updated_at || t.created_at,
      approved_by_admin_username: t.approved_by_admin_username || null,
      rejection_reason: t.rejection_reason || '',
      withdrawal_bank_name: t.withdrawal_bank_name || null,
      withdrawal_account_name: t.withdrawal_account_name || null,
      withdrawal_account_number: t.withdrawal_account_number || null,
      withdrawal_ifsc: t.withdrawal_ifsc || null,
      withdrawal_upi_id: t.withdrawal_upi_id || null,
      wallet_balance_at_request: t.wallet_balance_at_request || (t.user_id ? t.user_id.wallet_balance : 0)
    }));

    // Aggregate statistics
    const totalPendingCount = await Transaction.countDocuments({ type: 'withdrawal', status: 'pending' });
    const totalApprovedCount = await Transaction.countDocuments({ type: 'withdrawal', status: 'completed' });
    const totalRejectedCount = await Transaction.countDocuments({ type: 'withdrawal', status: { $in: ['failed', 'rejected', 'cancelled'] } });

    const totalPaidAgg = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalPaidAmount = totalPaidAgg[0] ? Math.abs(totalPaidAgg[0].total) : 0;

    const uniqueUsersWithdrawn = await Transaction.distinct('user_id', { type: 'withdrawal', status: 'completed' });
    const totalUsersWithdrawn = uniqueUsersWithdrawn.length;

    return NextResponse.json({
      success: true,
      withdrawals: withdrawalsList,
      stats: {
        totalPendingCount,
        totalApprovedCount,
        totalRejectedCount,
        totalPaidAmount,
        totalUsersWithdrawn
      },
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Fetch admin withdrawals error:', error);
    return NextResponse.json({ error: 'Failed to retrieve withdrawal history.' }, { status: 500 });
  }
}
