import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, BankDetails, Transaction, Order } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

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

    const skip = (page - 1) * limit;

    const query = { role: 'user' };
    if (search.trim() !== '') {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [
        { username: rx },
        { phone: rx },
        { support_id: rx }
      ];
    }

    const total = await User.countDocuments(query);
    const rawUsers = await User.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const users = await Promise.all(rawUsers.map(async (u) => {
      // Fetch bank details
      const bank = await BankDetails.findOne({ user_id: u._id });

      // Fetch financial summaries
      const depositTxSum = await Transaction.aggregate([
        { $match: { user_id: u._id, type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const depositTotal = depositTxSum[0] ? depositTxSum[0].total : 0;

      const withdrawTxSum = await Transaction.aggregate([
        { $match: { user_id: u._id, type: 'withdrawal', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const withdrawalTotal = withdrawTxSum[0] ? Math.abs(withdrawTxSum[0].total) : 0;

      const pendingWithdrawTxSum = await Transaction.aggregate([
        { $match: { user_id: u._id, type: 'withdrawal', status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const pendingWithdrawal = pendingWithdrawTxSum[0] ? Math.abs(pendingWithdrawTxSum[0].total) : 0;

      const commissionTxSum = await Transaction.aggregate([
        { 
          $match: { 
            user_id: u._id, 
            type: { $in: ['referral_commission_l1', 'referral_commission_l2', 'referral_bonus_invited'] } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const commissionTotal = commissionTxSum[0] ? commissionTxSum[0].total : 0;

      const activeInvestSum = await Order.aggregate([
        { $match: { user_id: u._id, status: 'active', days_remaining: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$price' } } }
      ]);
      const activeInvestment = activeInvestSum[0] ? activeInvestSum[0].total : 0;

      const referralCount = await User.countDocuments({ referred_by_id: u._id });

      let referrerName = null;
      if (u.referred_by_id) {
        const refUser = await User.findById(u.referred_by_id);
        if (refUser) referrerName = refUser.username;
      }

      return {
        id: u._id.toString(),
        username: u.username,
        phone: u.phone,
        email: u.email,
        support_id: u.support_id || null,
        referral_code: u.referral_code,
        wallet_balance: u.wallet_balance,
        referred_by_id: u.referred_by_id ? u.referred_by_id.toString() : null,
        is_suspended: u.is_suspended || false,
        created_at: u.created_at,
        bankDetails: bank ? {
          accountNumber: bank.account_number,
          accountName: bank.account_name,
          ifsc: bank.ifsc,
          upiId: bank.upi_id
        } : null,
        stats: {
          depositTotal,
          withdrawalTotal,
          pendingWithdrawal,
          commissionTotal,
          activeInvestment,
          referralCount
        },
        referrerName
      };
    }));

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json({ error: 'Failed to retrieve users.' }, { status: 500 });
  }
}
