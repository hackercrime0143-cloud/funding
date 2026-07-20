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

async function testLargeDataset() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas...');

  const initialCount = await User.countDocuments({ role: 'user' });
  console.log(`Initial user count: ${initialCount}`);

  // Create 400 temporary mock users for stress testing pagination
  console.log('Inserting 400 temporary test users...');
  const mockUsers = [];
  const timestamp = Date.now();
  for (let i = 1; i <= 400; i++) {
    mockUsers.push({
      username: `testuser_${timestamp}_${i}`,
      phone: `900000${String(i).padStart(4, '0')}`,
      email: `testuser_${timestamp}_${i}@test.com`,
      password: 'HashedTestPassword123!',
      referral_code: `TEST${timestamp}${i}`,
      wallet_balance: Math.floor(Math.random() * 5000),
      role: 'user',
      is_suspended: i % 10 === 0,
      created_at: new Date(timestamp - i * 60000)
    });
  }

  await User.insertMany(mockUsers);
  const totalCount = await User.countDocuments({ role: 'user' });
  console.log(`New total user count: ${totalCount}`);

  // Test server-side pagination with 500+ users (26 pages with limit=20)
  const limit = 20;
  const totalPages = Math.ceil(totalCount / limit);
  console.log(`Testing pagination across ${totalPages} pages...`);

  const seenIds = new Set();
  let duplicates = 0;
  const startTime = Date.now();

  for (let p = 1; p <= totalPages; p++) {
    const skip = (p - 1) * limit;
    const users = await User.find({ role: 'user' })
      .sort({ created_at: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    for (const u of users) {
      if (seenIds.has(u._id.toString())) {
        duplicates++;
      } else {
        seenIds.add(u._id.toString());
      }
    }
  }

  const duration = Date.now() - startTime;
  console.log(`\n========================================`);
  console.log(`Large Dataset Test Results:`);
  console.log(`Total Users Fetched: ${seenIds.size} / ${totalCount}`);
  console.log(`Duplicates Found: ${duplicates}`);
  console.log(`Time to Traverse ${totalPages} Pages: ${duration}ms (Avg: ${(duration / totalPages).toFixed(1)}ms per page)`);
  console.log(`========================================\n`);

  // Cleanup temporary mock users
  console.log('Cleaning up temporary mock users...');
  await User.deleteMany({ username: { $regex: `^testuser_${timestamp}_` } });
  const finalCount = await User.countDocuments({ role: 'user' });
  console.log(`Cleanup complete. Final user count: ${finalCount}`);

  process.exit(0);
}

testLargeDataset().catch(err => {
  console.error('Large dataset test error:', err);
  process.exit(1);
});
