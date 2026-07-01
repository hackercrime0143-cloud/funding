import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Transaction, Order } from '@/lib/models';
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

    // 1. Total registered users
    const totalUsers = await User.countDocuments({ role: 'user' });

    // 1.5. Combined user balances
    const userBalancesSum = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$wallet_balance' } } }
    ]);
    const totalUserBalances = userBalancesSum[0] ? userBalancesSum[0].total : 0;

    // 2. Total Approved Deposits (completed)
    const approvedDepositsSum = await Transaction.aggregate([
      { $match: { type: 'deposit', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDeposits = approvedDepositsSum[0] ? approvedDepositsSum[0].total : 0;

    // 3. Pending Deposits
    const pendingDepositsAgg = await Transaction.aggregate([
      { $match: { type: 'deposit', status: { $in: ['pending', 'confirmation_pending'] } } },
      { 
        $group: { 
          _id: null, 
          count: { $sum: 1 }, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    const pendingDepositsCount = pendingDepositsAgg[0] ? pendingDepositsAgg[0].count : 0;
    const pendingDepositsTotal = pendingDepositsAgg[0] ? pendingDepositsAgg[0].total : 0;

    // 4. Total Approved Withdrawals (completed)
    const approvedWithdrawalsSum = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalWithdrawals = approvedWithdrawalsSum[0] ? Math.abs(approvedWithdrawalsSum[0].total) : 0;

    // 5. Pending Withdrawals
    const pendingWithdrawalsAgg = await Transaction.aggregate([
      { $match: { type: 'withdrawal', status: 'pending' } },
      { 
        $group: { 
          _id: null, 
          count: { $sum: 1 }, 
          total: { $sum: '$amount' } 
        } 
      }
    ]);
    const pendingWithdrawalsCount = pendingWithdrawalsAgg[0] ? pendingWithdrawalsAgg[0].count : 0;
    const pendingWithdrawalsTotal = pendingWithdrawalsAgg[0] ? Math.abs(pendingWithdrawalsAgg[0].total) : 0;

    // 6. Active Investments (active orders price sum)
    const activeInvestmentsSum = await Order.aggregate([
      { $match: { status: 'active', days_remaining: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const activeInvestments = activeInvestmentsSum[0] ? activeInvestmentsSum[0].total : 0;

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalUserBalances,
        totalDeposits,
        pendingDepositsCount,
        pendingDepositsTotal,
        totalWithdrawals,
        pendingWithdrawalsCount,
        pendingWithdrawalsTotal,
        activeInvestments
      }
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return NextResponse.json({ error: 'Failed to aggregate metrics.' }, { status: 500 });
  }
}
