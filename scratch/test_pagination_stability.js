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

import { User } from '../lib/models.js';

async function testPaginationStability() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const totalCount = await User.countDocuments({ role: 'user' });
  console.log(`Total 'user' role documents in DB: ${totalCount}`);

  // Test 10 consecutive executions of Page 1 query
  console.log('\n--- Testing Page 1 stability across 10 repeated queries ---');
  let firstPage1Ids = null;
  let page1Stable = true;

  for (let i = 1; i <= 10; i++) {
    const rawUsers = await User.find({ role: 'user' })
      .sort({ created_at: -1, _id: -1 })
      .skip(0)
      .limit(20);

    const idsStr = rawUsers.map(u => u._id.toString()).join(',');
    if (i === 1) {
      firstPage1Ids = idsStr;
    } else if (idsStr !== firstPage1Ids) {
      page1Stable = false;
      console.error(`[ERROR] Page 1 shuffled on iteration ${i}!`);
    }
  }

  if (page1Stable) {
    console.log('✓ Page 1 is 100% STABLE across all 10 queries!');
  }

  // Test 10 consecutive executions of Page 2 query
  console.log('\n--- Testing Page 2 stability across 10 repeated queries ---');
  let firstPage2Ids = null;
  let page2Stable = true;

  for (let i = 1; i <= 10; i++) {
    const rawUsers = await User.find({ role: 'user' })
      .sort({ created_at: -1, _id: -1 })
      .skip(20)
      .limit(20);

    const idsStr = rawUsers.map(u => u._id.toString()).join(',');
    if (i === 1) {
      firstPage2Ids = idsStr;
    } else if (idsStr !== firstPage2Ids) {
      page2Stable = false;
      console.error(`[ERROR] Page 2 shuffled on iteration ${i}!`);
    }
  }

  if (page2Stable) {
    console.log('✓ Page 2 is 100% STABLE across all 10 queries!');
  }

  // Test overlaps between Page 1 and Page 2
  const set1 = new Set(firstPage1Ids.split(','));
  const set2 = new Set(firstPage2Ids.split(','));
  let overlapCount = 0;
  for (const id of set2) {
    if (set1.has(id)) overlapCount++;
  }

  console.log('\n========================================');
  console.log(`Stability Audit Complete:`);
  console.log(`Page 1 Items: ${set1.size}`);
  console.log(`Page 2 Items: ${set2.size}`);
  console.log(`Overlap Count: ${overlapCount}`);
  console.log(`Total User Count Reported: ${totalCount}`);
  console.log(`========================================\n`);

  process.exit(0);
}

testPaginationStability().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
