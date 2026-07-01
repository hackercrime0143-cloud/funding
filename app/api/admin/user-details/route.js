import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, BankDetails, Transaction, Order, Scheme } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Verify session user exists and is an admin
    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    // Get userId from URL query param
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Get Bank details
    const bank = await BankDetails.findOne({ user_id: userId });

    // Fetch transactions
    const allTxs = await Transaction.find({ user_id: userId }).sort({ created_at: -1 });
    const deposits = allTxs.filter(t => t.type === 'deposit');
    const withdrawals = allTxs.filter(t => t.type === 'withdrawal');

    // Fetch orders
    const allOrders = await Order.find({ user_id: userId }).populate('scheme_id').sort({ created_at: -1 });

    // Referrals
    const invitedUsers = await User.find({ referred_by_id: userId }).select('username phone created_at wallet_balance').sort({ created_at: -1 });

    // Referred by username
    let referrerName = 'Direct Sign Up';
    if (user.referred_by_id) {
      const ref = await User.findById(user.referred_by_id);
      if (ref) referrerName = ref.username;
    }

    // Wallet statistics
    const completedDepositsSum = deposits.filter(d => d.status === 'completed').reduce((acc, d) => acc + d.amount, 0);
    const completedWithdrawalsSum = withdrawals.filter(w => w.status === 'completed').reduce((acc, w) => acc + Math.abs(w.amount), 0);
    const activeInvestmentSum = allOrders.filter(o => o.status === 'active' && o.days_remaining > 0).reduce((acc, o) => acc + o.price, 0);

    const referralCommissionsSum = allTxs
      .filter(t => t.status === 'completed' && ['referral_commission_l1', 'referral_commission_l2', 'referral_bonus_invited'].includes(t.type))
      .reduce((acc, t) => acc + t.amount, 0);

    const dailyReturnsSum = allTxs
      .filter(t => t.status === 'completed' && t.type === 'scheme_payout')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalProfit = dailyReturnsSum + referralCommissionsSum;

    // Build user detail response object
    const details = {
      basic: {
        id: user._id.toString(),
        username: user.username,
        phone: user.phone,
        email: user.email,
        referralCode: user.referral_code,
        referredBy: referrerName,
        createdAt: user.created_at,
        lastLogin: user.created_at, // registration fallback
        status: user.is_suspended ? 'Suspended' : 'Active'
      },
      wallet: {
        balance: user.wallet_balance,
        totalDeposit: completedDepositsSum,
        totalWithdrawal: completedWithdrawalsSum,
        totalProfit: totalProfit,
        activeInvestment: activeInvestmentSum,
        referralIncome: referralCommissionsSum,
        pendingIncome: allOrders.filter(o => o.status === 'pending' || o.status === 'confirmation_pending').reduce((acc, o) => acc + o.price, 0)
      },
      ordersCount: {
        total: allOrders.length,
        active: allOrders.filter(o => o.status === 'active').length,
        pending: allOrders.filter(o => o.status === 'pending' || o.status === 'confirmation_pending').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length,
        failed: allOrders.filter(o => o.status === 'failed').length
      },
      deposits: deposits.map(t => ({
        id: t._id.toString(),
        amount: t.amount,
        status: t.status,
        utr: t.utr || null,
        screenshot: t.screenshot || null,
        created_at: t.created_at
      })),
      withdrawals: withdrawals.map(t => ({
        id: t._id.toString(),
        amount: t.amount,
        status: t.status,
        created_at: t.created_at
      })),
      investments: allOrders.map(o => ({
        id: o._id.toString(),
        name: o.scheme_id ? o.scheme_id.name : 'Quick Deposit Scheme',
        scheme_id: o.scheme_id ? o.scheme_id._id.toString() : null,
        price: o.price,
        daily_income: o.daily_income,
        days_remaining: o.days_remaining,
        status: o.status,
        created_at: o.created_at,
        utr: o.utr,
        screenshot: o.screenshot || null,
        virtual_account: o.virtual_account_id ? o.virtual_account_id.account_number : null,
        virtual_bank: o.virtual_account_id ? o.virtual_account_id.bank_name : null,
        virtual_beneficiary: o.virtual_account_id ? o.virtual_account_id.beneficiary_name : null,
        virtual_ifsc: o.virtual_account_id ? o.virtual_account_id.ifsc : null,
        virtual_upi: o.virtual_account_id ? o.virtual_account_id.upi_id : null,
        virtual_qr_code: o.virtual_account_id ? o.virtual_account_id.qr_code : null,
        rejection_reason: o.rejection_reason || ''
      })),
      referrals: {
        count: invitedUsers.length,
        earnings: referralCommissionsSum,
        list: invitedUsers.map(u => ({
          username: u.username,
          phone: u.phone,
          created_at: u.created_at,
          balance: u.wallet_balance
        }))
      },
      bankDetails: bank ? {
        accountNumber: bank.account_number,
        accountName: bank.account_name,
        ifsc: bank.ifsc,
        upiId: bank.upi_id
      } : null,
      activityLogs: [
        { type: 'Account Created', date: user.created_at, desc: 'Registered on the FastPay Platform' },
        ...allTxs.filter(t => t.screenshot).map(t => ({ type: 'Screenshot Upload', date: t.created_at, desc: `Uploaded deposit payment receipt for ₹${t.amount}` })),
        ...allOrders.filter(o => o.screenshot).map(o => ({ type: 'Screenshot Upload', date: o.created_at, desc: `Uploaded scheme subscription payment receipt for ₹${o.price}` }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
    };

    return NextResponse.json({ success: true, details });
  } catch (error) {
    console.error('User details route error:', error);
    return NextResponse.json({ error: 'Failed to retrieve user details.' }, { status: 500 });
  }
}
