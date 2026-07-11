import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Order, Transaction, createAdminNotification } from '@/lib/models';
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
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    const query = { role: 'user' };
    if (search.trim() !== '') {
      const rx = new RegExp(search.trim(), 'i');
      query.$or = [{ username: rx }, { phone: rx }];
    }

    const total = await User.countDocuments(query);
    const usersList = await User.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    const taskStats = [];
    for (const u of usersList) {
      // Get completed tasks
      const referrals = await User.find({ referred_by_id: u._id }).select('_id');
      const totalReferred = referrals.length;
      let completedReferralTasks = 0;
      
      if (totalReferred > 0) {
        const referralIds = referrals.map(r => r._id);
        const distinctPurchasers = await Order.distinct('user_id', {
          user_id: { $in: referralIds },
          status: { $in: ['active', 'completed', 'expired_pending_match'] }
        });
        completedReferralTasks = distinctPurchasers.length;
      }

      const claimed = u.referral_milestones_claimed || [];
      const totalRewardPaid = claimed.length * 500;
      const remainingReward = 1500 - totalRewardPaid;
      const progressPercentage = Math.min(100, Math.round((completedReferralTasks / 30) * 100));

      let currentMilestone = 'None';
      if (claimed.includes(3)) {
        currentMilestone = 'Milestone 3 (Completed)';
      } else if (claimed.includes(2)) {
        currentMilestone = 'Milestone 2';
      } else if (claimed.includes(1)) {
        currentMilestone = 'Milestone 1';
      }

      taskStats.push({
        id: u._id.toString(),
        username: u.username,
        referralCode: u.referral_code,
        totalReferredUsers: totalReferred,
        completedReferralTasks,
        claimedMilestones: claimed,
        currentMilestone,
        totalRewardPaid,
        remainingReward,
        progressPercentage
      });
    }

    return NextResponse.json({
      success: true,
      stats: taskStats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Fetch referral task stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve referral task stats.' }, { status: 500 });
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

    const { action, userId, milestone } = await request.json();
    if (!userId || !milestone || ![1, 2, 3].includes(Number(milestone))) {
      return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const milestoneNum = Number(milestone);
    const currentClaimed = targetUser.referral_milestones_claimed || [];

    if (action === 'approve') {
      if (currentClaimed.includes(milestoneNum)) {
        return NextResponse.json({ error: `Milestone ${milestoneNum} is already claimed by this user.` }, { status: 400 });
      }

      // Add to claimed
      targetUser.wallet_balance += 500;
      targetUser.referral_milestones_claimed = [...currentClaimed, milestoneNum];
      await targetUser.save();

      // Create transaction log
      await Transaction.create({
        user_id: targetUser._id,
        type: `referral_reward_milestone_${milestoneNum}`,
        amount: 500,
        status: 'completed',
        referred_user_username: `Milestone ${milestoneNum} (Manual Approval)`,
        scheme_name: 'Referral Reward Task'
      });

      // Admin notification
      await createAdminNotification(targetUser._id, 500, `Manually Approved Referral Reward Milestone ${milestoneNum}`);

      return NextResponse.json({ success: true, message: `Milestone ${milestoneNum} successfully approved and ₹500 credited.` });
    } else if (action === 'revoke') {
      if (!currentClaimed.includes(milestoneNum)) {
        return NextResponse.json({ error: `Milestone ${milestoneNum} is not claimed by this user.` }, { status: 400 });
      }

      // Remove from claimed
      targetUser.wallet_balance -= 500;
      targetUser.referral_milestones_claimed = currentClaimed.filter(m => m !== milestoneNum);
      await targetUser.save();

      // Create transaction log (negative amount to represent deduction)
      await Transaction.create({
        user_id: targetUser._id,
        type: `referral_reward_milestone_${milestoneNum}_revoked`,
        amount: -500,
        status: 'completed',
        referred_user_username: `Milestone ${milestoneNum} (Manual Revocation)`,
        scheme_name: 'Referral Reward Task'
      });

      // Admin notification
      await createAdminNotification(targetUser._id, -500, `Manually Revoked Referral Reward Milestone ${milestoneNum}`);

      return NextResponse.json({ success: true, message: `Milestone ${milestoneNum} successfully revoked and ₹500 deducted.` });
    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Process manual milestone error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
