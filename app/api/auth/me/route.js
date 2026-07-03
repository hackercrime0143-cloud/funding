import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order, Transaction, BankDetails, Settings } from '@/lib/models';
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
          status: 'completed',
          order_id: order._id
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

    // Calculate smart withdrawal limits
    // Rules:
    //  - Active orders (days_remaining > 0) → principal is LOCKED
    //  - Matured orders (days_remaining == 0, or status expired_pending_match/completed) → principal UNLOCKED
    //  - ₹200 minimum waived if ANY scheme has matured
    //  - ₹200 minimum also waived for users whose only schemes are small (<₹200) active ones
    const freshOrders = await Order.find({ user_id: session.id, status: { $in: ['active', 'expired_pending_match', 'completed'] } });

    let lockedBalance = 0;
    let hasActiveBigScheme = false;
    let hasMaturedScheme = false;

    for (const order of freshOrders) {
      const isCurrentlyRunning = order.status === 'active' && order.days_remaining > 0;
      const hasMatureStatus = order.days_remaining === 0 || order.status === 'expired_pending_match' || order.status === 'completed';

      if (hasMatureStatus) {
        hasMaturedScheme = true;
        // Principal is unlocked — do NOT add to lockedBalance
      } else if (isCurrentlyRunning) {
        lockedBalance += order.price;
        if (order.price >= 200) {
          hasActiveBigScheme = true;
        }
      }
    }

    const withdrawableBalance = Math.max(0, user.wallet_balance - lockedBalance);

    let minWithdrawal = 200; // default
    if (hasMaturedScheme) {
      minWithdrawal = 0; // Any matured scheme → full withdrawal allowed at any amount
    } else if (freshOrders.length === 0) {
      minWithdrawal = 200; // No schemes at all → standard minimum
    } else if (!hasActiveBigScheme) {
      minWithdrawal = 0; // Only small (<₹200) active schemes → waive the minimum
    }

    // Get linking status
    const bankDetails = await BankDetails.findOne({ user_id: session.id });

    // Get PWA and APK settings
    const settingsList = await Settings.find({
      key: { $in: [
        'apk_download_url',
        'pwa_name',
        'pwa_short_name',
        'pwa_theme_color',
        'pwa_background_color',
        'pwa_icon',
        'pwa_splash_screen',
        'pwa_install_prompt_text',
        'pwa_version'
      ] }
    });

    const settingsMap = {};
    settingsList.forEach(s => {
      settingsMap[s.key] = s.value;
    });

    const apkDownloadUrl = settingsMap['apk_download_url'] || '';
    const pwaSettings = {
      name: settingsMap['pwa_name'] || 'FastPay',
      shortName: settingsMap['pwa_short_name'] || 'FastPay',
      themeColor: settingsMap['pwa_theme_color'] || '#000000',
      backgroundColor: settingsMap['pwa_background_color'] || '#000000',
      icon: settingsMap['pwa_icon'] || '/icon-192.png',
      splashScreen: settingsMap['pwa_splash_screen'] || '/icon-512.png',
      installPromptText: settingsMap['pwa_install_prompt_text'] || 'Install FastPay to your device home screen for a native, fast, and full-screen mobile app experience.',
      version: settingsMap['pwa_version'] || '1.0.0'
    };

    return NextResponse.json({
      success: true,
      apkDownloadUrl,
      pwaSettings,
      user: {
        id: user._id.toString(),
        username: user.username,
        phone: user.phone,
        email: user.email,
        role: user.role || 'user',
        supportId: user.support_id || null,
        referralCode: user.referral_code,
        walletBalance: user.wallet_balance,
        lockedBalance,
        withdrawableBalance,
        minWithdrawal,
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
