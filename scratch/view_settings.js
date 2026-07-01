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

    const collection = mongoose.connection.db.collection('settings');
    const settings = await collection.find({}).toArray();
    console.log('Current Settings:', settings);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
