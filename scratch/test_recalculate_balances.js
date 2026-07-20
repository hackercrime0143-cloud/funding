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

export function calculateUserWalletBalance(userTxs, userOrders) {
  let balance = 0;

  // Track order IDs that have a completed deposit transaction
  const depositOrderIds = new Set();
  for (const t of userTxs) {
    if (t.type === 'deposit' && t.status === 'completed' && t.order_id) {
      depositOrderIds.add(t.order_id.toString());
    }
  }

  for (const t of userTxs) {
    // Ignore cancelled or failed transactions
    if (['cancelled', 'failed', 'rejected'].includes(t.status)) {
      continue;
    }

    if (t.type === 'withdrawal') {
      // Pending or completed withdrawals deduct from balance
      if (['completed', 'pending'].includes(t.status)) {
        balance += t.amount; // t.amount is negative for withdrawal
      }
    } else if (t.type === 'principal_return') {
      if (t.status === 'completed') {
        // Only count principal_return if it was NOT already credited via a deposit transaction for the same order
        const isFromDepositOrder = t.order_id && depositOrderIds.has(t.order_id.toString());
        if (!isFromDepositOrder) {
          balance += t.amount;
        }
      }
    } else if (t.status === 'completed') {
      balance += t.amount;
    }
  }

  return Math.max(0, balance);
}

async function testRecalculate() {
  await mongoose.connect(process.env.MONGODB_URI);

  const users = await User.find({});
  console.log(`Inspecting ${users.length} users...`);

  let mismatches = 0;

  for (const u of users) {
    const userTxs = await Transaction.find({ user_id: u._id });
    const userOrders = await Order.find({ user_id: u._id });

    const computedBalance = calculateUserWalletBalance(userTxs, userOrders);
    const dbBalance = u.wallet_balance || 0;

    const diff = Math.abs(computedBalance - dbBalance);
    if (diff > 0.01) {
      mismatches++;
      console.log(`\n[MISMATCH] User: ${u.username} (${u.phone})`);
      console.log(`  Current DB balance: ${dbBalance.toFixed(2)}`);
      console.log(`  Computed balance:   ${computedBalance.toFixed(2)}`);
      console.log(`  Difference:         ${(computedBalance - dbBalance).toFixed(2)}`);

      // Active schemes
      const activeRunning = userOrders.filter(o => o.status === 'active' && o.days_remaining > 0);
      const activeRunningInvested = activeRunning.reduce((sum, o) => sum + o.price, 0);
      console.log(`  Active Running Schemes Invested: ₹${activeRunningInvested.toFixed(2)} (${activeRunning.length} schemes)`);
      console.log(`  Withdrawable Balance: ₹${Math.max(0, computedBalance - activeRunningInvested).toFixed(2)}`);
    }
  }

  console.log(`\nTotal Users: ${users.length}`);
  console.log(`Total Mismatches Found: ${mismatches}`);

  process.exit(0);
}

testRecalculate().catch(err => {
  console.error(err);
  process.exit(1);
});
