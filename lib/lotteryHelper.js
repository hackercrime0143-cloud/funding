import { LotteryDraw } from './models';

export async function getOrCreateActiveDraw() {
  let activeDraw = await LotteryDraw.findOne({ status: { $in: ['open', 'closed'] } });
  
  if (!activeDraw) {
    const highestDraw = await LotteryDraw.findOne().sort({ week_number: -1 });
    const nextWeek = highestDraw ? highestDraw.week_number + 1 : 1;
    
    activeDraw = await LotteryDraw.create({
      week_number: nextWeek,
      sales_start_date: new Date(),
      status: 'open',
      ticket_price: 100,
      multiplier: 2
    });
  }
  
  return activeDraw;
}
