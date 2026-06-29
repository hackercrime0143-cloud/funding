import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order, Transaction, BankDetails } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized session.' }, { status: 401 });
    }

    // Process daily payouts automatically when checking profile
    const now = new Date();
    const activeOrders = await Order.find({ user_id: session.id, status: 'active', days_remaining: { $gt: 0 } });

    let balanceChange = 0;
    for (const order of activeOrders) {
      const lastPayout = new Date(order.last_payout_at);
      
      // Calculate calendar days difference (triggers daily payout immediately after 12:00 midnight)
      const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const lastPayoutMidnight = new Date(lastPayout.getFullYear(), lastPayout.getMonth(), lastPayout.getDate());
      const diffMs = todayMidnight - lastPayoutMidnight;
      const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

      if (diffDays > 0) {
        const daysToPay = Math.min(diffDays, order.days_remaining);
        const newDaysRemaining = order.days_remaining - daysToPay;
        const creditAmount = order.daily_income * daysToPay;

        const updateFields = {
          days_remaining: newDaysRemaining,
          last_payout_at: now
        };

        // If scheme completes, set status to expired_pending_match
        if (newDaysRemaining === 0) {
          updateFields.status = 'expired_pending_match';
          // NOTE: We do not add the principal return amount here automatically.
          // It must be funded and matched by a new purchase.
        }

        await Order.updateOne({ _id: order._id }, { $set: updateFields });

        // Log daily return payout
        await Transaction.create({
          user_id: session.id,
          type: 'scheme_payout',
          amount: order.daily_income * daysToPay,
          status: 'completed'
        });

        balanceChange += creditAmount;
      }
    }

    if (balanceChange > 0) {
      await User.updateOne({ _id: session.id }, { $inc: { wallet_balance: balanceChange } });
    }

    // Fetch fresh user data
    const user = await User.findById(session.id);
    if (!user) {
      // User was deleted from DB — force logout
      return NextResponse.json({ error: 'Account not found. Please contact support.' }, { status: 401 });
    }

    if (user.is_suspended) {
      // User is suspended — force logout
      return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
    }

    // Get linking status
    const bankDetails = await BankDetails.findOne({ user_id: session.id });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        phone: user.phone,
        email: user.email,
        role: user.role || 'user',
        supportId: user.support_id || null,
        referralCode: user.referral_code,
        walletBalance: user.wallet_balance,
        isBankLinked: !!bankDetails,
        isTelegramChannelJoined: user.is_telegram_channel_joined || false,
        isTelegramGroupJoined: user.is_telegram_group_joined || false,
        claimedTasks: user.claimed_tasks || [],
        bankDetails: bankDetails ? {
          account_number: bankDetails.account_number,
          account_name: bankDetails.account_name,
          ifsc: bankDetails.ifsc,
          upi_id: bankDetails.upi_id
        } : null
      }
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ error: 'Server error retrieving session.' }, { status: 500 });
  }
}
