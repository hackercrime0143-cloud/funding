import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order, Transaction } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

// Get user's dynamic progress on all tasks
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

    // 1. Task 1: Check completed deposits
    const hasDeposit = await Transaction.exists({ user_id: session.id, type: 'deposit', status: 'completed' });

    // 2. Fetch active/completed orders
    const orders = await Order.find({ 
      user_id: session.id, 
      status: { $in: ['active', 'completed', 'expired_pending_match'] } 
    });
    const totalSpent = orders.reduce((acc, o) => acc + o.price, 0);
    const totalCount = orders.length;

    const count5000 = orders.filter(o => o.price === 5000).length;
    const count10000 = orders.filter(o => o.price === 10000).length;

    const claimedTasks = user.claimed_tasks || [];

    const taskProgress = {
      task_first_deposit: {
        current: hasDeposit ? 1 : 0,
        target: 1,
        isCompleted: !!hasDeposit,
        claimed: claimedTasks.includes('task_first_deposit')
      },
      task_vol_5000: {
        spentCurrent: totalSpent,
        spentTarget: 5000,
        countCurrent: totalCount,
        countTarget: 10,
        isCompleted: totalSpent >= 5000 || totalCount >= 10,
        claimed: claimedTasks.includes('task_vol_5000')
      },
      task_vol_10000: {
        spentCurrent: totalSpent,
        spentTarget: 10000,
        countCurrent: totalCount,
        countTarget: 25,
        isCompleted: totalSpent >= 10000 || totalCount >= 25,
        claimed: claimedTasks.includes('task_vol_10000')
      },
      task_two_5000_orders: {
        current: count5000,
        target: 2,
        isCompleted: count5000 >= 2,
        claimed: claimedTasks.includes('task_two_5000_orders')
      },
      task_four_10000_orders: {
        current: count10000,
        target: 4,
        isCompleted: count10000 >= 4,
        claimed: claimedTasks.includes('task_four_10000_orders')
      }
    };

    return NextResponse.json({ success: true, taskProgress });
  } catch (error) {
    console.error('Fetch tasks progress error:', error);
    return NextResponse.json({ error: 'Failed to fetch task progress.' }, { status: 500 });
  }
}

// Process task reward claim
export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { taskId } = await request.json();
    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required.' }, { status: 400 });
    }

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const claimedTasks = user.claimed_tasks || [];

    // Verify if already claimed
    if (claimedTasks.includes(taskId)) {
      return NextResponse.json({ error: 'Task reward has already been claimed.' }, { status: 400 });
    }

    let isCompleted = false;
    let rewardAmount = 0;

    // Fetch required records to check completion status
    if (taskId === 'task_first_deposit') {
      const hasDeposit = await Transaction.exists({ user_id: session.id, type: 'deposit', status: 'completed' });
      isCompleted = !!hasDeposit;
      rewardAmount = 50.0;
    } else if (taskId === 'task_vol_5000') {
      const orders = await Order.find({ 
        user_id: session.id, 
        status: { $in: ['active', 'completed', 'expired_pending_match'] } 
      });
      const totalSpent = orders.reduce((acc, o) => acc + o.price, 0);
      const totalCount = orders.length;
      isCompleted = totalSpent >= 5000 || totalCount >= 10;
      rewardAmount = 150.0;
    } else if (taskId === 'task_vol_10000') {
      const orders = await Order.find({ 
        user_id: session.id, 
        status: { $in: ['active', 'completed', 'expired_pending_match'] } 
      });
      const totalSpent = orders.reduce((acc, o) => acc + o.price, 0);
      const totalCount = orders.length;
      isCompleted = totalSpent >= 10000 || totalCount >= 25;
      rewardAmount = 500.0;
    } else if (taskId === 'task_two_5000_orders') {
      const orders = await Order.find({ 
        user_id: session.id, 
        status: { $in: ['active', 'completed', 'expired_pending_match'] } 
      });
      const count5000 = orders.filter(o => o.price === 5000).length;
      isCompleted = count5000 >= 2;
      rewardAmount = 200.0;
    } else if (taskId === 'task_four_10000_orders') {
      const orders = await Order.find({ 
        user_id: session.id, 
        status: { $in: ['active', 'completed', 'expired_pending_match'] } 
      });
      const count10000 = orders.filter(o => o.price === 10000).length;
      isCompleted = count10000 >= 4;
      rewardAmount = 1000.0;
    } else {
      return NextResponse.json({ error: 'Unknown Task ID.' }, { status: 400 });
    }

    if (!isCompleted) {
      return NextResponse.json({ error: 'Task requirements have not been fully completed yet.' }, { status: 400 });
    }

    // Process reward transaction & credit wallet
    user.wallet_balance += rewardAmount;
    if (!user.claimed_tasks) {
      user.claimed_tasks = [];
    }
    user.claimed_tasks.push(taskId);
    await user.save();

    // Log the task reward as a completed transaction
    await Transaction.create({
      user_id: session.id,
      type: 'task_reward',
      amount: rewardAmount,
      status: 'completed'
    });

    return NextResponse.json({
      success: true,
      message: `Successfully claimed ₹${rewardAmount.toFixed(2)} reward!`,
      walletBalance: user.wallet_balance,
      claimedTasks: user.claimed_tasks
    });
  } catch (error) {
    console.error('Task claim error:', error);
    return NextResponse.json({ error: 'Failed to process task claim.' }, { status: 500 });
  }
}
