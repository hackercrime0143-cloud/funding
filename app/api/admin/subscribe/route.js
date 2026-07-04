import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, PushSubscription } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

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

    const { subscription } = await request.json();
    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription object.' }, { status: 400 });
    }

    // Check if subscription already exists for this admin
    const existing = await PushSubscription.findOne({
      user_id: session.id,
      'subscription.endpoint': subscription.endpoint
    });

    if (!existing) {
      await PushSubscription.create({
        user_id: session.id,
        subscription
      });
    }

    return NextResponse.json({ success: true, message: 'Subscription saved successfully.' });
  } catch (err) {
    console.error('[FastPay Push Subscribe API Error]', err);
    return NextResponse.json({ error: 'Failed to save push subscription.' }, { status: 500 });
  }
}