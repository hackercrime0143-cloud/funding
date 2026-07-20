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

import { User, Order, Transaction, SpinLog, LotteryTicket } from '../lib/models.js';

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const users = await User.find({});
  console.log(`Found ${users.length} users.`);

  for (const u of users) {
    console.log(`\n========================================`);
    console.log(`User: ${u.username} (${u.phone}) ID: ${u._id}`);
    console.log(`Current DB wallet_balance: ${u.wallet_balance}`);

    const orders = await Order.find({ user_id: u._id });
    console.log(`Orders count: ${orders.length}`);
    for (const o of orders) {
      console.log(`  Order ${o._id}: status=${o.status}, price=${o.price}, daily_income=${o.daily_income}, days_remaining=${o.days_remaining}`);
    }

    const txs = await Transaction.find({ user_id: u._id });
    console.log(`Transactions count: ${txs.length}`);
    for (const t of txs) {
      console.log(`  Tx ${t._id}: type=${t.type}, amount=${t.amount}, status=${t.status}`);
    }
  }

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
