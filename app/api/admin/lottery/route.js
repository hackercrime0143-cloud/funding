import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User, LotteryTicket, LotteryDraw, Transaction, Notification } from '@/lib/models';
import { getOrCreateActiveDraw } from '@/lib/lotteryHelper';
import { getSessionFromCookies } from '@/lib/auth';
import mongoose from 'mongoose';

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

    // Get current active draw
    const activeDraw = await getOrCreateActiveDraw();

    // Query parameters
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const filterStatus = url.searchParams.get('status') || ''; // 'active', 'won', 'lost'
    const filterWeek = url.searchParams.get('week') || ''; // Week number

    // Build ticket query
    let ticketQuery = {};

    // 1. Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const users = await User.find({
        $or: [
          { username: searchRegex },
          { phone: searchRegex }
        ]
      });

      const userIds = users.map(u => u._id);
      
      let searchConditions = [
        { user_id: { $in: userIds } },
        { ticket_code: search }
      ];

      if (mongoose.Types.ObjectId.isValid(search)) {
        searchConditions.push({ user_id: new mongoose.Types.ObjectId(search) });
      }

      ticketQuery.$or = searchConditions;
    }

    // 2. Status filter
    if (filterStatus) {
      ticketQuery.status = filterStatus;
    }

    // 3. Week filter
    if (filterWeek) {
      ticketQuery.week_number = Number(filterWeek);
    }

    // Get filtered tickets
    const tickets = await LotteryTicket.find(ticketQuery)
      .sort({ created_at: -1 })
      .populate('user_id', 'username phone')
      .limit(200);

    // Global and historical statistics
    const allDraws = await LotteryDraw.find({}).sort({ week_number: -1 });

    const totalSoldTickets = await LotteryTicket.countDocuments();
    
    // Revenue calculations
    const revenueAggr = await LotteryTicket.aggregate([
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const totalRevenue = revenueAggr[0] ? revenueAggr[0].total : 0;

    // Paid prize calculations
    const prizeAggr = await LotteryTicket.aggregate([
      { $group: { _id: null, total: { $sum: '$prize_amount' } } }
    ]);
    const totalPrizesPaid = prizeAggr[0] ? prizeAggr[0].total : 0;

    // Unique participants calculation
    const totalParticipants = await LotteryTicket.distinct('user_id');

    // Unique weeks list
    const uniqueWeeks = await LotteryTicket.distinct('week_number');
    uniqueWeeks.sort((a, b) => b - a);

    return NextResponse.json({
      success: true,
      activeDraw: {
        id: activeDraw._id.toString(),
        week_number: activeDraw.week_number,
        status: activeDraw.status,
        ticket_price: activeDraw.ticket_price,
        multiplier: activeDraw.multiplier,
        winning_code: activeDraw.winning_code,
        draw_date: activeDraw.draw_date,
        total_tickets_sold: activeDraw.total_tickets_sold,
        total_revenue: activeDraw.total_revenue,
        total_prizes_paid: activeDraw.total_prizes_paid
      },
      stats: {
        totalSoldTickets,
        totalRevenue,
        totalPrizesPaid,
        totalParticipantsCount: totalParticipants.length,
        uniqueWeeksList: uniqueWeeks
      },
      draws: allDraws.map(d => ({
        id: d._id.toString(),
        week_number: d.week_number,
        sales_start_date: d.sales_start_date,
        sales_end_date: d.sales_end_date,
        draw_date: d.draw_date,
        winning_code: d.winning_code,
        status: d.status,
        ticket_price: d.ticket_price,
        multiplier: d.multiplier,
        total_tickets_sold: d.total_tickets_sold,
        total_revenue: d.total_revenue,
        total_prizes_paid: d.total_prizes_paid
      })),
      tickets: tickets.map(t => ({
        id: t._id.toString(),
        ticket_code: t.ticket_code,
        price: t.price,
        multiplier: t.multiplier,
        status: t.status,
        prize_amount: t.prize_amount,
        created_at: t.created_at,
        week_number: t.week_number,
        username: t.user_id ? t.user_id.username : 'Deleted User',
        phone: t.user_id ? t.user_id.phone : 'N/A',
        user_id_str: t.user_id ? t.user_id._id.toString() : 'N/A'
      }))
    });
  } catch (error) {
    console.error('Fetch admin lottery config/stats error:', error);
    return NextResponse.json({ error: 'Failed to retrieve admin lottery config.' }, { status: 500 });
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

    const body = await request.json();
    const { action } = body;

    // Load active draw using helper
    const activeDraw = await getOrCreateActiveDraw();

    if (action === 'update_config') {
      const { ticketPrice, multiplier, salesEnabled } = body;

      if (ticketPrice !== undefined) activeDraw.ticket_price = Number(ticketPrice);
      if (multiplier !== undefined) activeDraw.multiplier = Number(multiplier);
      if (salesEnabled !== undefined) {
        activeDraw.status = salesEnabled ? 'open' : 'closed';
      }

      await activeDraw.save();
      return NextResponse.json({ success: true, message: 'Lottery configurations updated.' });

    } else if (action === 'run_draw') {
      if (activeDraw.status === 'completed') {
        return NextResponse.json({ error: 'Lottery draw for this week is already completed.' }, { status: 400 });
      }

      // Check if there are tickets to draw
      const activeTickets = await LotteryTicket.find({ draw_id: activeDraw._id, status: 'active' });
      if (activeTickets.length === 0) {
        return NextResponse.json({ error: 'No active tickets exist for the current week.' }, { status: 400 });
      }

      // Pick winning code
      let winCode = body.winCode;
      if (!winCode || winCode.length !== 3 || isNaN(winCode)) {
        // Pick a random ticket code from the active pool as winner, or random 3 digits
        const randomIndex = Math.floor(Math.random() * activeTickets.length);
        winCode = activeTickets[randomIndex].ticket_code;
      }

      let prizesPaid = 0;

      // Update tickets status
      for (const ticket of activeTickets) {
        if (ticket.ticket_code === winCode) {
          ticket.status = 'won';
          ticket.prize_amount = ticket.price * ticket.multiplier;
          await ticket.save();

          prizesPaid += ticket.prize_amount;

          // Credit winner's wallet
          const winner = await User.findById(ticket.user_id);
          if (winner) {
            winner.wallet_balance += ticket.prize_amount;
            await winner.save();

            // Record winner ledger
            await Transaction.create({
              user_id: winner._id,
              type: 'lottery_win',
              amount: ticket.prize_amount,
              status: 'completed',
              referred_user_username: 'Lucky Lottery',
              scheme_name: `Ticket #${winCode} (Week ${activeDraw.week_number})`
            });

            // Create notification
            await Notification.create({
              user_id: winner._id,
              title: '🎉 Lottery Winner!',
              message: `Congratulations! Your lottery ticket #${winCode} won ₹${ticket.prize_amount} for Week ${activeDraw.week_number}!`
            });
          }
        } else {
          ticket.status = 'lost';
          await ticket.save();
        }
      }

      // Finalize current draw
      activeDraw.winning_code = winCode;
      activeDraw.draw_date = new Date();
      activeDraw.sales_end_date = new Date();
      activeDraw.status = 'completed';
      activeDraw.total_prizes_paid = prizesPaid;
      await activeDraw.save();

      // Automatically initialize next week's draw
      const nextWeek = activeDraw.week_number + 1;
      await LotteryDraw.create({
        week_number: nextWeek,
        sales_start_date: new Date(),
        status: 'open',
        ticket_price: activeDraw.ticket_price,
        multiplier: activeDraw.multiplier
      });

      return NextResponse.json({
        success: true,
        message: `Lottery Draw successfully completed for Week ${activeDraw.week_number}. Winning code: #${winCode}.`,
        winningCode: winCode
      });
    } else {
      return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin lottery action error:', error);
    return NextResponse.json({ error: 'Failed to process request.' }, { status: 500 });
  }
}
