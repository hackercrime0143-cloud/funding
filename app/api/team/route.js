import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Transaction } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    // Get Level A Users (Directly referred by this user)
    const levelA = await User.find({ referred_by_id: session.id })
      .sort({ created_at: -1 });

    // Get Level B Users (Referred by Level A users)
    let levelB = [];
    if (levelA.length > 0) {
      const levelAIds = levelA.map(u => u._id);
      levelB = await User.find({ referred_by_id: { $in: levelAIds } })
        .sort({ created_at: -1 });
    }

    // Calculate Referral Commissions Earned
    const commissionsResult = await Transaction.aggregate([
      { 
        $match: { 
          user_id: new mongoose.Types.ObjectId(session.id), 
          type: { $in: ['referral_commission_l1', 'referral_commission_l2', 'referral_bonus_invited'] } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalCommissions = commissionsResult[0] ? commissionsResult[0].total : 0;

    const currentUser = await User.findById(session.id);

    return NextResponse.json({
      success: true,
      referralCode: currentUser ? currentUser.referral_code : '',
      stats: {
        levelACount: levelA.length,
        levelBCount: levelB.length,
        totalTeam: levelA.length + levelB.length,
        totalCommissions
      },
      levelA: levelA.map(u => ({ username: u.username, phone: u.phone.slice(0, 3) + '****' + u.phone.slice(-3), joinedAt: u.created_at })),
      levelB: levelB.map(u => ({ username: u.username, phone: u.phone.slice(0, 3) + '****' + u.phone.slice(-3), joinedAt: u.created_at }))
    });
  } catch (error) {
    console.error('Fetch team error:', error);
    return NextResponse.json({ error: 'Failed to fetch team details.' }, { status: 500 });
  }
}
