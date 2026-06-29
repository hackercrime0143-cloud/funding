import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, BankDetails, Transaction, Order, Scheme } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

// Helper to auto-cancel pending orders that are drafts (start with DRAFT-) older than 15 minutes
async function autoCancelPendingOrders() {
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  await Order.updateMany(
    {
      status: 'pending',
      utr: { $regex: /^DRAFT-/ },
      created_at: { $lt: fifteenMinutesAgo }
    },
    { status: 'cancelled' }
  );
}

export async function GET(request) {
  try {
    await connectDB();
    await autoCancelPendingOrders();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Secure check: verify that the user is the administrator via database role
    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }
    
    // 1. Get all users and map rich financial/account details
    const rawUsers = await User.find({ role: 'user' }).sort({ created_at: -1 });
    
    const users = await Promise.all(rawUsers.map(async (u) => {
      // Fetch bank details
      const bank = await BankDetails.findOne({ user_id: u._id });

      // Fetch transaction summaries
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

      // Fetch referred by username
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

    // 2. Get all transactions with user info
    const rawTransactions = await Transaction.find()
      .populate('user_id')
      .sort({ created_at: -1 });

    const transactions = rawTransactions.map(t => ({
      id: t._id.toString(),
      user_id: t.user_id ? t.user_id._id.toString() : null,
      user_name: t.user_id ? t.user_id.username : 'Unknown',
      user_phone: t.user_id ? t.user_id.phone : 'Unknown',
      user_support_id: t.user_id ? t.user_id.support_id : null,
      type: t.type,
      amount: t.amount,
      status: t.status,
      virtual_account_id: t.virtual_account_id ? t.virtual_account_id.toString() : null,
      created_at: t.created_at
    }));

    // 3. Get all orders with details
    const rawOrders = await Order.find()
      .populate('user_id')
      .populate('scheme_id')
      .populate('virtual_account_id')
      .sort({ created_at: -1 });

    const orders = rawOrders.map(o => ({
      id: o._id.toString(),
      user_id: o.user_id ? o.user_id._id.toString() : null,
      user_name: o.user_id ? o.user_id.username : 'Unknown',
      user_phone: o.user_id ? o.user_id.phone : 'Unknown',
      user_support_id: o.user_id ? o.user_id.support_id : null,
      scheme_id: o.scheme_id ? o.scheme_id._id.toString() : null,
      scheme_name: o.scheme_id ? o.scheme_id.name : 'Unknown Scheme',
      price: o.price,
      daily_income: o.daily_income,
      total_payout: o.total_payout,
      days_remaining: o.days_remaining,
      last_payout_at: o.last_payout_at,
      created_at: o.created_at,
      status: o.status,
      utr: o.utr,
      screenshot: o.screenshot,
      virtual_account: o.virtual_account_id ? o.virtual_account_id.account_number : null,
      virtual_bank: o.virtual_account_id ? o.virtual_account_id.bank_name : null,
      virtual_beneficiary: o.virtual_account_id ? o.virtual_account_id.beneficiary_name : null,
      virtual_ifsc: o.virtual_account_id ? o.virtual_account_id.ifsc : null,
      virtual_upi: o.virtual_account_id ? o.virtual_account_id.upi_id : null
    }));

    // 4. Get all schemes
    const rawSchemes = await Scheme.find().sort({ _id: -1 });
    const schemes = rawSchemes.map(s => ({
      id: s._id.toString(),
      name: s.name,
      price: s.price,
      daily_return_rate: s.daily_return_rate,
      days: s.days,
      total_return: s.total_return
    }));

    return NextResponse.json({
      success: true,
      users,
      transactions,
      orders,
      schemes
    });
  } catch (error) {
    console.error('Admin fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin details.' }, { status: 500 });
  }
}
