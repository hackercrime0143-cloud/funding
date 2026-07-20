import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length > 0) {
    process.env[k.trim()] = v.join('=').trim();
  }
});

import { User, Order, Transaction } from '../lib/models.js';

async function inspectSampleUsers() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Find users with active or completed orders
  const orders = await Order.find({ status: { $in: ['active', 'completed', 'expired_pending_match'] } }).populate('user_id');
  
  const userIds = [...new Set(orders.map(o => o.user_id._id.toString()))];
  console.log(`Found ${userIds.length} users with active/completed/expired orders.`);

  for (const uid of userIds.slice(0, 10)) {
    const user = await User.findById(uid);
    const userOrders = await Order.find({ user_id: uid });
    const userTxs = await Transaction.find({ user_id: uid, status: 'completed' });

    console.log(`\n--------------------------------------------------`);
    console.log(`User: ${user.username} | Phone: ${user.phone}`);
    console.log(`DB wallet_balance: ${user.wallet_balance}`);

    console.log(`Orders:`);
    for (const o of userOrders) {
      console.log(`  Order: status=${o.status}, price=${o.price}, daily_income=${o.daily_income}, days_rem=${o.days_remaining}`);
    }

    console.log(`Completed Transactions:`);
    let txSum = 0;
    for (const t of userTxs) {
      console.log(`  Tx: type=${t.type}, amount=${t.amount}`);
      txSum += t.amount;
    }
    console.log(`Sum of completed txs: ${txSum}`);
  }

  process.exit(0);
}

inspectSampleUsers().catch(err => {
  console.error(err);
  process.exit(1);
});
