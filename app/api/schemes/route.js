import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Scheme } from '@/lib/models';
import { getSessionFromCookies } from '@/lib/auth';

export async function GET(request) {
  try {
    await connectDB();
    const cookieHeader = request.headers.get('cookie');
    const session = getSessionFromCookies(cookieHeader);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const rawSchemes = await Scheme.find();
    
    // Shuffle the schemes array randomly so their order changes on refresh
    const shuffledSchemes = rawSchemes.sort(() => Math.random() - 0.5);

    const schemes = shuffledSchemes.map(s => ({
      id: s._id.toString(),
      name: s.name,
      price: s.price,
      daily_return_rate: s.daily_return_rate,
      days: s.days,
      total_return: s.total_return
    }));

    return NextResponse.json({ success: true, schemes });
  } catch (error) {
    console.error('Fetch schemes error:', error);
    return NextResponse.json({ error: 'Failed to fetch schemes.' }, { status: 500 });
  }
}
