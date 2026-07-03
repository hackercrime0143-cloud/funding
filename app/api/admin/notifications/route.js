import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, Notification } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

// Fetch admin notifications
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

    const notifications = await Notification.find()
      .sort({ created_at: -1 })
      .limit(100);

    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to retrieve notifications.' }, { status: 500 });
  }
}

// Mark notifications as read
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

    const { notificationId, markAll } = await request.json();

    if (markAll) {
      await Notification.updateMany({ is_read: false }, { $set: { is_read: true } });
    } else if (notificationId) {
      await Notification.updateOne({ _id: notificationId }, { $set: { is_read: true } });
    } else {
      return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Notifications updated.' });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications.' }, { status: 500 });
  }
}
