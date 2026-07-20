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
  
  const txTypes = await Transaction.distinct('type');
  const txStatuses = await Transaction.distinct('status');
  const orderStatuses = await Order.distinct('status');

  console.log('Transaction Types:', txTypes);
  console.log('Transaction Statuses:', txStatuses);
  console.log('Order Statuses:', orderStatuses);

  const txCountsByTypeAndStatus = {};
  const allTxs = await Transaction.find({});
  for (const t of allTxs) {
    const key = `${t.type} | ${t.status}`;
    txCountsByTypeAndStatus[key] = (txCountsByTypeAndStatus[key] || 0) + 1;
  }
  console.log('\nTransaction Counts by (Type | Status):', txCountsByTypeAndStatus);

  const orderCountsByStatus = {};
  const allOrders = await Order.find({});
  for (const o of allOrders) {
    orderCountsByStatus[o.status] = (orderCountsByStatus[o.status] || 0) + 1;
  }
  console.log('\nOrder Counts by Status:', orderCountsByStatus);

  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
