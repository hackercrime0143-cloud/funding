import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function POST(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { type } = await request.json(); // 'channel' or 'group'

    if (!type || (type !== 'channel' && type !== 'group')) {
      return NextResponse.json({ error: 'Invalid join type.' }, { status: 400 });
    }

    const updateFields = {};
    if (type === 'channel') {
      updateFields.is_telegram_channel_joined = true;
    } else {
      updateFields.is_telegram_group_joined = true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      session.id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully joined Telegram ${type}.`,
      isTelegramChannelJoined: updatedUser.is_telegram_channel_joined,
      isTelegramGroupJoined: updatedUser.is_telegram_group_joined
    });
  } catch (error) {
    console.error('Telegram join route error:', error);
    return NextResponse.json({ error: 'Failed to update Telegram join status.' }, { status: 500 });
  }
}
