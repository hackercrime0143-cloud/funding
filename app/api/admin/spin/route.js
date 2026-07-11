import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, SpinLog, Settings } from '@/lib/models';
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

    // Get config
    let config = DEFAULT_CONFIG;
    const setting = await Settings.findOne({ key: 'spin_config' });
    if (setting) {
      config = JSON.parse(setting.value);
    }

    // Calculate Admin Stats
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const totalSpinsPurchased = await SpinLog.countDocuments({ is_free_spin: false });
    
    const todayLogs = await SpinLog.find({ created_at: { $gte: startOfToday } });
    const todayRevenue = todayLogs.reduce((sum, l) => sum + (l.amount_paid || 0), 0);
    const todayRewardsPaid = todayLogs.reduce((sum, l) => sum + (l.wallet_credit || 0), 0);
    const remainingRewardBudget = Math.max(0, config.daily_budget - todayRewardsPaid);

    // Active Spun Users today
    const distinctUsersToday = await SpinLog.distinct('user_id', { created_at: { $gte: startOfToday } });
    const activeUsersToday = distinctUsersToday.length;

    // Grand Prize Winners (iPhone 17)
    const prizeWinners = await SpinLog.find({ status: { $in: ['pending_fulfillment', 'fulfilled'] } })
      .populate('user_id', 'username phone')
      .sort({ created_at: -1 });

    const stats = {
      totalSpinsPurchased,
      todayRevenue,
      todayRewardsPaid,
      remainingRewardBudget,
      activeUsersToday,
      prizeWinners: prizeWinners.map(w => ({
        id: w._id.toString(),
        date: w.created_at,
        prizeWon: w.prize_won,
        status: w.status,
        username: w.user_id ? w.user_id.username : 'Deleted User',
        phone: w.user_id ? w.user_id.phone : 'N/A'
      }))
    };

    return NextResponse.json({
      success: true,
      config,
      stats
    });
  } catch (error) {
    console.error('Fetch admin spin stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin spin statistics.' }, { status: 500 });
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

    const adminCheck = await User.findById(session.id);
    if (!adminCheck || adminCheck.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied. Admins only.' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'update_config') {
      const { config } = body;
      if (!config) {
        return NextResponse.json({ error: 'Missing config payload.' }, { status: 400 });
      }

      await Settings.updateOne(
        { key: 'spin_config' },
        { $set: { value: JSON.stringify(config) } },
        { upsert: true }
      );

      return NextResponse.json({ success: true, message: 'Spin configurations saved successfully.' });
    } else if (action === 'fulfill_prize') {
      const { logId } = body;
      if (!logId) {
        return NextResponse.json({ error: 'Missing log ID.' }, { status: 400 });
      }

      const log = await SpinLog.findById(logId);
      if (!log) {
        return NextResponse.json({ error: 'Prize record not found.' }, { status: 404 });
      }

      log.status = 'fulfilled';
      await log.save();

      return NextResponse.json({ success: true, message: 'Grand prize marked as fulfilled.' });
    } else {
      return NextResponse.json({ error: 'Invalid operation.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin spin action error:', error);
    return NextResponse.json({ error: 'Failed to process operation.' }, { status: 500 });
  }
}
