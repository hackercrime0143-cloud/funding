import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getVapidKeys } from '@/lib/vapid';
import { getSessionFromCookies } from '@/lib/auth';
import { User } from '@/lib/models';

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

    const keys = await getVapidKeys();
    return NextResponse.json({ publicKey: keys.publicKey });
  } catch (err) {
    console.error('[FastPay VAPID Key API Error]', err);
    return NextResponse.json({ error: 'Failed to retrieve vapid key.' }, { status: 500 });
  }
}