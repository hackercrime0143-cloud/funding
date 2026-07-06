import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, BankDetails, Transaction, Order } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

    const userIds = rawUsers.map(u => u._id);

    // Fetch bank details in bulk
    const bankDetailsList = await BankDetails.find({ user_id: { $in: userIds } });
    const bankMap = {};
    bankDetailsList.forEach(b => {
      bankMap[b.user_id.toString()] = b;
    });

    // Fetch referral counts in bulk
    const referralCounts = await User.aggregate([
      { $match: { referred_by_id: { $in: userIds } } },
      { $group: { _id: '$referred_by_id', count: { $sum: 1 } } }
    ]);
    const refCountMap = {};
    referralCounts.forEach(r => {
      refCountMap[r._id.toString()] = r.count;
    });

    // Fetch deposit sums in bulk
    const depositSums = await Transaction.aggregate([
      { $match: { user_id: { $in: userIds }, type: 'deposit', status: 'completed' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]);
    const depositMap = {};
    depositSums.forEach(d => {
      depositMap[d._id.toString()] = d.total;
    });

    // Fetch withdrawal sums in bulk
    const withdrawSums = await Transaction.aggregate([
      { $match: { user_id: { $in: userIds }, type: 'withdrawal', status: 'completed' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]);
    const withdrawMap = {};
    withdrawSums.forEach(w => {
      withdrawMap[w._id.toString()] = Math.abs(w.total);
    });

    // Fetch pending withdrawal sums in bulk
    const pendingWithdrawSums = await Transaction.aggregate([
      { $match: { user_id: { $in: userIds }, type: 'withdrawal', status: 'pending' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]);
    const pendingWithdrawMap = {};
    pendingWithdrawSums.forEach(w => {
      pendingWithdrawMap[w._id.toString()] = Math.abs(w.total);
    });

    // Fetch commission sums in bulk
    const commissionSums = await Transaction.aggregate([
      { 
        $match: { 
          user_id: { $in: userIds }, 
          type: { $in: ['referral_commission_l1', 'referral_commission_l2', 'referral_bonus_invited'] } 
        } 
      },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]);
    const commissionMap = {};
    commissionSums.forEach(c => {
      commissionMap[c._id.toString()] = c.total;
    });

    // Fetch active investment sums in bulk
    const activeInvestSums = await Order.aggregate([
      { $match: { user_id: { $in: userIds }, status: 'active', days_remaining: { $gt: 0 } } },
      { $group: { _id: '$user_id', total: { $sum: '$price' } } }
    ]);
    const activeInvestMap = {};
    activeInvestSums.forEach(i => {
      activeInvestMap[i._id.toString()] = i.total;
    });

    // Fetch referrers in bulk
    const referrerIds = rawUsers.map(u => u.referred_by_id).filter(Boolean);
    const referrers = await User.find({ _id: { $in: referrerIds } }).select('username');
    const referrerMap = {};
    referrers.forEach(r => {
      referrerMap[r._id.toString()] = r.username;
    });

    const users = rawUsers.map((u) => {
      const bank = bankMap[u._id.toString()];
      const depositTotal = depositMap[u._id.toString()] || 0;
      const withdrawalTotal = withdrawMap[u._id.toString()] || 0;
      const pendingWithdrawal = pendingWithdrawMap[u._id.toString()] || 0;
      const commissionTotal = commissionMap[u._id.toString()] || 0;
      const activeInvestment = activeInvestMap[u._id.toString()] || 0;
      const referralCount = refCountMap[u._id.toString()] || 0;
      const referrerName = u.referred_by_id ? referrerMap[u.referred_by_id.toString()] : null;

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
    });

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
