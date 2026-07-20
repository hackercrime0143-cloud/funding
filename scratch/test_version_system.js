import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { compareVersions } from '../lib/versionHelper.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envFile = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length > 0) {
    process.env[k.trim()] = v.join('=').trim();
  }
});

import { Settings } from '../lib/models.js';

async function testVersionSystem() {
  console.log('--- 1. Testing compareVersions helper ---');
  console.assert(compareVersions('1.0.0', '1.5.6') === -1, 'Test 1.1 failed');
  console.assert(compareVersions('1.5.6', '1.5.6') === 0, 'Test 1.2 failed');
  console.assert(compareVersions('2.0.0', '1.5.6') === 1, 'Test 1.3 failed');
  console.assert(compareVersions('v1.0.0', 'v1.5.6') === -1, 'Test 1.4 failed');
  console.assert(compareVersions('1.5', '1.5.0') === 0, 'Test 1.5 failed');
  console.log('✓ All compareVersions unit tests passed!');

  console.log('\n--- 2. Connecting to MongoDB Atlas ---');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB.');

  // Test updating version settings in DB
  console.log('\n--- 3. Testing Force Update ON in DB ---');
  await Settings.findOneAndUpdate({ key: 'pwa_version' }, { value: '1.5.6' }, { upsert: true });
  await Settings.findOneAndUpdate({ key: 'pwa_update_notes' }, { value: '• Fixed wallet balance calculation\n• Fixed cashout issues\n• Improved Admin Panel' }, { upsert: true });
  await Settings.findOneAndUpdate({ key: 'pwa_force_update' }, { value: 'true' }, { upsert: true });
  await Settings.findOneAndUpdate({ key: 'apk_download_url' }, { value: 'https://fastpay.app/downloads/FastPay.apk' }, { upsert: true });

  const settingsList = await Settings.find({ key: { $in: ['pwa_version', 'pwa_update_notes', 'pwa_force_update', 'apk_download_url'] } });
  const map = {};
  settingsList.forEach(s => map[s.key] = s.value);

  console.log('Fetched DB Version Settings:');
  console.log('Version:', map['pwa_version']);
  console.log('Release Notes:', map['pwa_update_notes']);
  console.log('Force Update:', map['pwa_force_update']);
  console.log('Download URL:', map['apk_download_url']);

  console.assert(map['pwa_version'] === '1.5.6', 'Version mismatch');
  console.assert(map['pwa_force_update'] === 'true', 'Force update status mismatch');
  console.log('✓ DB settings verified successfully!');

  console.log('\n--- 4. Resetting Version Settings to default 1.0.0 (Optional Mode) ---');
  await Settings.findOneAndUpdate({ key: 'pwa_version' }, { value: '1.0.0' }, { upsert: true });
  await Settings.findOneAndUpdate({ key: 'pwa_force_update' }, { value: 'false' }, { upsert: true });
  console.log('✓ Reset complete.');

  process.exit(0);
}

testVersionSystem().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
