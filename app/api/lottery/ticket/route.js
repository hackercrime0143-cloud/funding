import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, LotteryTicket, Transaction } from '@/lib/models';
import { getOrCreateActiveDraw } from '@/lib/lotteryHelper';
import { getSessionFromCookies } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
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

    if (user.is_suspended) {
      return NextResponse.json({ error: 'Your account is suspended.' }, { status: 403 });
    }

    // Load active draw using the helper
    const activeDraw = await getOrCreateActiveDraw();

    // Check if sales are open
    if (activeDraw.status !== 'open') {
      return NextResponse.json({ error: 'Lottery ticket sales are currently closed.' }, { status: 400 });
    }

    const ticketPrice = activeDraw.ticket_price;
    const multiplier = activeDraw.multiplier;

    // Balance verification
    if (user.wallet_balance < ticketPrice) {
      return NextResponse.json({ error: 'Insufficient Wallet Balance' }, { status: 400 });
    }

    // Generate unique 3-digit ticket code for the active pool
    const activeCodes = await LotteryTicket.find({ draw_id: activeDraw._id }).distinct('ticket_code');
    if (activeCodes.length >= 1000) {
      return NextResponse.json({ error: 'No more unique ticket codes are available for this week\'s draw.' }, { status: 400 });
    }

    let ticketCode;
    do {
      const num = Math.floor(Math.random() * 1000);
      ticketCode = num.toString().padStart(3, '0');
    } while (activeCodes.includes(ticketCode));

    // Save ticket and deduct balance
    user.wallet_balance -= ticketPrice;
    await user.save();

    const ticket = await LotteryTicket.create({
      user_id: user._id,
      draw_id: activeDraw._id,
      week_number: activeDraw.week_number,
      ticket_code: ticketCode,
      price: ticketPrice,
      multiplier: multiplier,
      status: 'active'
    });

    // Update draw aggregates
    activeDraw.total_tickets_sold += 1;
    activeDraw.total_revenue += ticketPrice;
    await activeDraw.save();

    // Record transaction
    await Transaction.create({
      user_id: user._id,
      type: 'lottery_purchase',
      amount: -ticketPrice,
      status: 'completed',
      referred_user_username: 'Lottery Ticket',
      scheme_name: `Ticket #${ticketCode} (Week ${activeDraw.week_number})`
    });

    return NextResponse.json({
      success: true,
      message: `Lottery ticket #${ticketCode} purchased successfully for Week ${activeDraw.week_number}.`,
      ticket: {
        id: ticket._id.toString(),
        ticket_code: ticket.ticket_code,
        price: ticket.price,
        multiplier: ticket.multiplier,
        status: ticket.status,
        created_at: ticket.created_at
      },
      walletBalance: user.wallet_balance
    });
  } catch (error) {
    console.error('Lottery purchase error:', error);
    return NextResponse.json({ error: 'Failed to complete ticket purchase.' }, { status: 500 });
  }
}
