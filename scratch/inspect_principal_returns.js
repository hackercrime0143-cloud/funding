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

async function checkPrincipalReturns() {
  await mongoose.connect(process.env.MONGODB_URI);

  const prTxs = await Transaction.find({ type: 'principal_return', status: 'completed' });
  console.log(`Found ${prTxs.length} completed principal_return transactions.`);

  const userIds = [...new Set(prTxs.map(t => t.user_id.toString()))];
  for (const uid of userIds) {
    const user = await User.findById(uid);
    const txs = await Transaction.find({ user_id: uid, status: 'completed' });
    const orders = await Order.find({ user_id: uid });

    console.log(`\nUser: ${user.username} (${user.phone}) | DB wallet_balance: ${user.wallet_balance}`);
    console.log('Orders:');
    for (const o of orders) {
      console.log(`  Order ${o._id}: status=${o.status}, price=${o.price}, days_rem=${o.days_remaining}`);
    }
    console.log('Transactions:');
    for (const t of txs) {
      console.log(`  Tx ${t._id}: type=${t.type}, amount=${t.amount}`);
    }
  }

  process.exit(0);
}

checkPrincipalReturns().catch(err => {
  console.error(err);
  process.exit(1);
});
