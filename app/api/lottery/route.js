import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, LotteryTicket } from '@/lib/models';
import { getOrCreateActiveDraw } from '@/lib/lotteryHelper';
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

    const user = await User.findById(session.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Load active draw using helper
    const activeDraw = await getOrCreateActiveDraw();

    // Retrieve user's tickets
    const tickets = await LotteryTicket.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .limit(100);

    return NextResponse.json({
      success: true,
      config: {
        ticketPrice: activeDraw.ticket_price,
        multiplier: activeDraw.multiplier,
        salesEnabled: activeDraw.status === 'open'
      },
      activeDraw: {
        week_number: activeDraw.week_number,
        status: activeDraw.status,
        winning_code: activeDraw.winning_code,
        draw_date: activeDraw.draw_date
      },
      tickets: tickets.map(t => ({
        id: t._id.toString(),
        ticket_code: t.ticket_code,
        price: t.price,
        multiplier: t.multiplier,
        status: t.status,
        prize_amount: t.prize_amount,
        created_at: t.created_at,
        week_number: t.week_number
      }))
    });
  } catch (error) {
    console.error('Fetch lottery details error:', error);
    return NextResponse.json({ error: 'Failed to retrieve lottery details.' }, { status: 500 });
  }
}
