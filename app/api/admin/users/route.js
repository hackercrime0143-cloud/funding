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
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.max(1, Math.min(500, parseInt(searchParams.get('limit')) || 20));
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all'; // 'all', 'active', 'suspended', 'admins'
    const sort = searchParams.get('sort') || 'date-desc'; // 'date-desc', 'date-asc', 'balance-desc', 'balance-asc', 'username-asc'

    const skip = (page - 1) * limit;

    // Filter construction
    const query = {};
    if (filter === 'admins') {
      query.role = 'admin';
    } else if (filter === 'active') {
      query.role = 'user';
      query.is_suspended = { $ne: true };
    } else if (filter === 'suspended') {
      query.role = 'user';
      query.is_suspended = true;
    } else {
      // 'all' -> return all registered standard users
      query.role = 'user';
    }

    if (search.trim() !== '') {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [
        { username: rx },
        { phone: rx },
        { email: rx },
        { support_id: rx },
        { referral_code: rx }
      ];
    }

    // Sort construction with deterministic _id tie-breaking
    let sortObj = { created_at: -1, _id: -1 };
    if (sort === 'date-asc') {
      sortObj = { created_at: 1, _id: 1 };
    } else if (sort === 'balance-desc' || sort === 'deposit-desc') {
      sortObj = { wallet_balance: -1, _id: -1 };
    } else if (sort === 'balance-asc') {
      sortObj = { wallet_balance: 1, _id: 1 };
    } else if (sort === 'username-asc') {
      sortObj = { username: 1, _id: 1 };
    }

    const total = await User.countDocuments(query);
    const rawUsers = await User.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const userIds = rawUsers.map(u => u._id);

    // Bulk fetch secondary data ONLY for the current page's user IDs
    const bankDetailsList = await BankDetails.find({ user_id: { $in: userIds } });
    const bankMap = {};
    bankDetailsList.forEach(b => {
      bankMap[b.user_id.toString()] = b;
    });

    const referralCounts = await User.aggregate([
      { $match: { referred_by_id: { $in: userIds } } },
      { $group: { _id: '$referred_by_id', count: { $sum: 1 } } }
    ]);
    const refCountMap = {};
    referralCounts.forEach(r => {
      refCountMap[r._id.toString()] = r.count;
    });

    const depositSums = await Transaction.aggregate([
      { $match: { user_id: { $in: userIds }, type: 'deposit', status: 'completed' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]);
    const depositMap = {};
    depositSums.forEach(d => {
      depositMap[d._id.toString()] = d.total;
    });

    const withdrawSums = await Transaction.aggregate([
      { $match: { user_id: { $in: userIds }, type: 'withdrawal', status: 'completed' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]);
    const withdrawMap = {};
    withdrawSums.forEach(w => {
      withdrawMap[w._id.toString()] = Math.abs(w.total);
    });

    const pendingWithdrawSums = await Transaction.aggregate([
      { $match: { user_id: { $in: userIds }, type: 'withdrawal', status: 'pending' } },
      { $group: { _id: '$user_id', total: { $sum: '$amount' } } }
    ]);
    const pendingWithdrawMap = {};
    pendingWithdrawSums.forEach(w => {
      pendingWithdrawMap[w._id.toString()] = Math.abs(w.total);
    });

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

    const activeInvestSums = await Order.aggregate([
      { $match: { user_id: { $in: userIds }, status: 'active', days_remaining: { $gt: 0 } } },
      { $group: { _id: '$user_id', total: { $sum: '$price' } } }
    ]);
    const activeInvestMap = {};
    activeInvestSums.forEach(i => {
      activeInvestMap[i._id.toString()] = i.total;
    });

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
        walletBalance: u.wallet_balance,
        role: u.role || 'user',
        is_suspended: u.is_suspended || false,
        isSuspended: u.is_suspended || false,
        referred_by_id: u.referred_by_id ? u.referred_by_id.toString() : null,
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

    const pages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        limit,
        pages
      }
    });
  } catch (error) {
    console.error('Fetch admin users error:', error);
    return NextResponse.json({ error: 'Failed to retrieve users.' }, { status: 500 });
  }
}
