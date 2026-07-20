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

import { User, BankDetails, Transaction, Order } from '../lib/models.js';

async function testAdminUsersApi() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const totalRegisteredUsers = await User.countDocuments({ role: 'user' });
  console.log(`Total 'user' role documents in DB: ${totalRegisteredUsers}`);

  // Test pagination across all pages
  const limit = 20;
  const totalPages = Math.ceil(totalRegisteredUsers / limit);
  console.log(`Expected total pages for limit=${limit}: ${totalPages}`);

  const seenUserIds = new Set();
  let duplicatesFound = 0;

  const startTime = Date.now();

  for (let page = 1; page <= totalPages; page++) {
    const skip = (page - 1) * limit;
    const pageStartTime = Date.now();

    const rawUsers = await User.find({ role: 'user' })
      .sort({ created_at: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    const pageDuration = Date.now() - pageStartTime;

    for (const u of rawUsers) {
      const idStr = u._id.toString();
      if (seenUserIds.has(idStr)) {
        duplicatesFound++;
        console.error(`[ERROR] Duplicate user ${u.username} (${idStr}) found on page ${page}!`);
      } else {
        seenUserIds.add(idStr);
      }
    }

    console.log(`Page ${page}/${totalPages}: fetched ${rawUsers.length} users in ${pageDuration}ms`);
  }

  const totalTime = Date.now() - startTime;
  console.log(`\n========================================`);
  console.log(`Pagination Audit Complete!`);
  console.log(`Total Unique Users Fetched: ${seenUserIds.size} / ${totalRegisteredUsers}`);
  console.log(`Duplicates Found: ${duplicatesFound}`);
  console.log(`Total Time to Traverse All ${totalPages} Pages: ${totalTime}ms (Avg: ${(totalTime / totalPages).toFixed(1)}ms per page)`);
  console.log(`========================================\n`);

  process.exit(0);
}

testAdminUsersApi().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
