import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order } from '@/lib/models';
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
    const status = searchParams.get('status') || ''; // '', 'pending', 'confirmation_pending', 'active', 'completed', 'rejected', 'cancelled', 'failed'

    const skip = (page - 1) * limit;

    const query = {};

    // Search by User credentials (username, phone, support ID, or User ID)
    if (search.trim() !== '') {
      const searchStr = search.trim();
      const rx = new RegExp(searchStr, 'i');
      
      const userQuery = {
        $or: [
          { username: rx },
          { phone: rx },
          { support_id: rx }
        ]
      };

      if (mongoose.Types.ObjectId.isValid(searchStr)) {
        userQuery.$or.push({ _id: searchStr });
      }

      const matchedUsers = await User.find(userQuery).select('_id');
      const userIds = matchedUsers.map(u => u._id);
      query.user_id = { $in: userIds };
      
      // The search works globally across all statuses, so ignore the status filter when searching
    } else if (status) {
      if (status === 'pending') {
        query.status = 'confirmation_pending';
      } else if (status === 'cancelled') {
        query.status = { $in: ['rejected', 'cancelled'] };
      } else {
        query.status = status;
      }
    }

    const total = await Order.countDocuments(query);
    const rawOrders = await Order.find(query)
      .populate('user_id', 'username phone support_id')
      .populate('scheme_id')
      .populate('virtual_account_id')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const orders = rawOrders.map(o => ({
      id: o._id.toString(),
      user_id: o.user_id ? o.user_id._id.toString() : null,
      user_name: o.user_id ? o.user_id.username : 'Unknown',
      user_phone: o.user_id ? o.user_id.phone : 'Unknown',
      user_support_id: o.user_id ? o.user_id.support_id : null,
      scheme_id: o.scheme_id ? o.scheme_id._id.toString() : null,
      scheme_name: o.scheme_id ? o.scheme_id.name : (o.price >= 100 && o.price <= 500 ? `Quick Deposit Scheme (₹${o.price})` : 'Quick Deposit Scheme'),
      price: o.price,
      daily_income: o.daily_income,
      total_payout: o.total_payout,
      days_remaining: o.days_remaining,
      last_payout_at: o.last_payout_at,
      created_at: o.created_at,
      status: o.status,
      utr: o.utr,
      screenshot: o.screenshot || null,
      virtual_account_id: o.virtual_account_id ? o.virtual_account_id._id.toString() : null,
      virtual_account: o.virtual_account_id ? {
        account_number: o.virtual_account_id.account_number,
        bank_name: o.virtual_account_id.bank_name,
        beneficiary_name: o.virtual_account_id.beneficiary_name,
        upi_id: o.virtual_account_id.upi_id || ''
      } : null,
      is_payout_matched: o.is_payout_matched || false,
      rejection_reason: o.rejection_reason || ''
    }));

    return NextResponse.json({
      success: true,
      orders,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch admin orders error:', error);
    return NextResponse.json({ error: 'Failed to retrieve orders.' }, { status: 500 });
  }
}
