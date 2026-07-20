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
    // Ignore cancelled, failed, or rejected transactions
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

async function restoreUserBalances() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const users = await User.find({});
  console.log(`Starting balance recalculation & restoration for ${users.length} users...\n`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const u of users) {
    const userTxs = await Transaction.find({ user_id: u._id });
    const userOrders = await Order.find({ user_id: u._id });

    const newBalance = calculateUserWalletBalance(userTxs, userOrders);
    const oldBalance = u.wallet_balance || 0;

    const diff = Math.abs(newBalance - oldBalance);
    if (diff > 0.001) {
      await User.updateOne({ _id: u._id }, { $set: { wallet_balance: newBalance } });
      updatedCount++;
      console.log(`[RESTORED] User "${u.username}" (${u.phone}): ₹${oldBalance.toFixed(2)} -> ₹${newBalance.toFixed(2)} (Diff: +₹${(newBalance - oldBalance).toFixed(2)})`);
    } else {
      skippedCount++;
    }
  }

  console.log(`\n========================================`);
  console.log(`Restoration Complete!`);
  console.log(`Total Users Processed: ${users.length}`);
  console.log(`Users Restored & Updated: ${updatedCount}`);
  console.log(`Users Already Correct:   ${skippedCount}`);
  console.log(`========================================\n`);

  process.exit(0);
}

restoreUserBalances().catch(err => {
  console.error('Restoration error:', err);
  process.exit(1);
});
