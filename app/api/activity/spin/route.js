import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, SpinLog, Settings, Transaction, createAdminNotification } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const DEFAULT_CONFIG = {
  price: 50,
  daily_limit: 10,
  daily_budget: 500,
  iphone_enabled: true,
  start_date: '',
  end_date: '',
  rewards: {
    "50": { "enabled": true, "weight": 10, "type": "cash", "value": 50, "label": "₹50" },
    "100": { "enabled": true, "weight": 5, "type": "cash", "value": 100, "label": "₹100" },
    "200": { "enabled": true, "weight": 2, "type": "cash", "value": 200, "label": "₹200" },
    "500": { "enabled": true, "weight": 1, "type": "cash", "value": 500, "label": "₹500" },
    "bonus": { "enabled": true, "weight": 15, "type": "bonus", "value": 1, "label": "Bonus Spin" },
    "try_again": { "enabled": true, "weight": 40, "type": "nothing", "value": 0, "label": "Try Again" },
    "good_luck": { "enabled": true, "weight": 27, "type": "nothing", "value": 0, "label": "Good Luck" },
    "iphone": { "enabled": true, "weight": 0.1, "type": "grand_prize", "value": "iPhone 17", "label": "iPhone 17" }
  }
};

async function getSpinConfig() {
  try {
    const setting = await Settings.findOne({ key: 'spin_config' });
    if (setting) {
      return JSON.parse(setting.value);
    }
  } catch (err) {
    console.error('Error reading spin_config setting:', err);
  }
  return DEFAULT_CONFIG;
}

export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const config = await getSpinConfig();

    // Calculate daily limits
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const spinsPlayedToday = await SpinLog.countDocuments({
      user_id: user._id,
      created_at: { $gte: startOfToday }
    });

    const recentLogs = await SpinLog.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .limit(20);

    return NextResponse.json({
      success: true,
      freeSpins: user.free_spins || 0,
      spinsPlayedToday,
      dailyLimit: config.daily_limit,
      spinPrice: config.price,
      history: recentLogs.map(l => ({
        id: l._id.toString(),
        date: l.created_at,
        amountPaid: l.amount_paid,
        prizeWon: l.prize_won,
        walletCredit: l.wallet_credit,
        isFreeSpin: l.is_free_spin,
        status: l.status
      }))
    });
  } catch (error) {
    console.error('Get spin status error:', error);
    return NextResponse.json({ error: 'Failed to retrieve spin details.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    if (user.is_suspended) {
      return NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 });
    }

    const config = await getSpinConfig();

    // Event Date check
    const now = new Date();
    if (config.start_date && new Date(config.start_date) > now) {
      return NextResponse.json({ error: 'Spin event has not started yet.' }, { status: 400 });
    }
    if (config.end_date && new Date(config.end_date) < now) {
      return NextResponse.json({ error: 'Spin event has ended.' }, { status: 400 });
    }

    // Daily Limit check
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const spinsPlayedToday = await SpinLog.countDocuments({
      user_id: user._id,
      created_at: { $gte: startOfToday }
    });

    if (spinsPlayedToday >= config.daily_limit) {
      return NextResponse.json({ error: 'Daily Spin Limit Reached. Please try again tomorrow.' }, { status: 400 });
    }

    // Deduct cost or consume free spin
    let isFree = false;
    let cost = config.price;

    if (user.free_spins > 0) {
      user.free_spins -= 1;
      isFree = true;
      cost = 0;
    } else {
      if (user.wallet_balance < config.price) {
        return NextResponse.json({ error: 'Insufficient Wallet Balance' }, { status: 400 });
      }
      user.wallet_balance -= config.price;
    }

    // Log the fee transaction if spent cash
    if (!isFree && cost > 0) {
      await Transaction.create({
        user_id: user._id,
        type: 'spin_fee',
        amount: -cost,
        status: 'completed',
        referred_user_username: 'Lucky Spin Fee',
        scheme_name: 'Spin Wheel Play'
      });
    }

    // Calculate today's distributed rewards (budget constraint)
    const todayLogs = await SpinLog.find({
      created_at: { $gte: startOfToday }
    });
    const todayRewardsPaid = todayLogs.reduce((sum, l) => sum + (l.wallet_credit || 0), 0);
    const budgetRemaining = config.daily_budget - todayRewardsPaid;

    // Filter eligible rewards
    const eligibleRewards = [];
    const rewardsMap = config.rewards || DEFAULT_CONFIG.rewards;

    for (const [key, item] of Object.entries(rewardsMap)) {
      if (!item.enabled || item.weight <= 0) continue;

      // Budget Enforcement: If cash reward value exceeds remaining budget, exclude it.
      if (item.type === 'cash' && item.value > budgetRemaining) {
        continue;
      }

      // iPhone exclusion (if disabled globally or config is set to false)
      if (item.type === 'grand_prize' && !config.iphone_enabled) {
        continue;
      }

      eligibleRewards.push({ key, ...item });
    }

    // Fallback: If no eligible rewards are left (e.g. budget exceeded), make sure try_again and good_luck are present
    if (eligibleRewards.length === 0) {
      eligibleRewards.push({ key: 'try_again', enabled: true, weight: 50, type: 'nothing', value: 0, label: 'Try Again' });
      eligibleRewards.push({ key: 'good_luck', enabled: true, weight: 50, type: 'nothing', value: 0, label: 'Good Luck' });
    }

    // Select reward by weighted random distribution
    const totalWeight = eligibleRewards.reduce((sum, item) => sum + item.weight, 0);
    let randomVal = Math.random() * totalWeight;
    let selectedReward = eligibleRewards[eligibleRewards.length - 1];

    for (const item of eligibleRewards) {
      if (randomVal < item.weight) {
        selectedReward = item;
        break;
      }
      randomVal -= item.weight;
    }

    // Apply Reward
    let walletCredit = 0;
    let status = 'none';

    if (selectedReward.type === 'cash') {
      walletCredit = selectedReward.value;
      user.wallet_balance += walletCredit;
      status = 'credited';

      // Create transaction log
      await Transaction.create({
        user_id: user._id,
        type: 'spin_win',
        amount: walletCredit,
        status: 'completed',
        referred_user_username: 'Lucky Spin Win',
        scheme_name: 'Spin Wheel Reward'
      });
    } else if (selectedReward.type === 'bonus') {
      user.free_spins += selectedReward.value;
      status = 'none';
    } else if (selectedReward.type === 'grand_prize') {
      status = 'pending_fulfillment';
      // Notify Admin
      await createAdminNotification(user._id, 0, `Won grand prize: ${selectedReward.value}`);
    }

    // Save User updates
    await user.save();

    // Create SpinLog entry
    const spinLogEntry = await SpinLog.create({
      user_id: user._id,
      amount_paid: cost,
      prize_won: selectedReward.label,
      wallet_credit: walletCredit,
      is_free_spin: isFree,
      status
    });

    return NextResponse.json({
      success: true,
      prize: selectedReward.label,
      rewardType: selectedReward.type,
      rewardValue: selectedReward.value,
      freeSpins: user.free_spins,
      walletBalance: user.wallet_balance,
      newLog: {
        id: spinLogEntry._id.toString(),
        date: spinLogEntry.created_at,
        amountPaid: spinLogEntry.amount_paid,
        prizeWon: spinLogEntry.prize_won,
        walletCredit: spinLogEntry.wallet_credit,
        isFreeSpin: spinLogEntry.is_free_spin,
        status: spinLogEntry.status
      }
    });
  } catch (error) {
    console.error('Spin action error:', error);
    return NextResponse.json({ error: 'Failed to process spin.' }, { status: 500 });
  }
}
