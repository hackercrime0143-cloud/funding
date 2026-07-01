const mongoose = require('mongoose');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const envPath = path.join(__dirname, '../.env.local');
let MONGODB_URI = 'mongodb://localhost:27017/fastpay';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.+)$/m);
  if (match) {
    MONGODB_URI = match[1].trim();
  }
}

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const collection = mongoose.connection.db.collection('bankdetails');
    
    console.log('Fetching bankdetails indexes...');
    const indexes = await collection.indexes();
    console.log('Current bankdetails indexes:', indexes);

    // Let's drop userId_1 if it exists
    const hasUserIdIndex = indexes.some(idx => idx.name === 'userId_1');
    if (hasUserIdIndex) {
      console.log('Dropping stale unique index "userId_1"...');
      await collection.dropIndex('userId_1');
      console.log('Stale index "userId_1" dropped successfully!');
    } else {
      console.log('No index named "userId_1" found.');
    }

    console.log('Bankdetails indexes after check:', await collection.indexes());

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
