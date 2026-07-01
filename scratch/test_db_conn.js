const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

// Let's load .env.local manually if it exists
const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '../.env.local');

let MONGODB_URI = 'mongodb://localhost:27017/fastpay';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/^MONGODB_URI=(.+)$/m);
  if (match) {
    MONGODB_URI = match[1].trim();
  }
}

console.log('Connecting to URI:', MONGODB_URI.substring(0, 50) + '...');

async function test() {
  try {
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('MongoDB connection successful!');

    // Get collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:', collections.map(c => c.name));

    // Try finding one user
    const usersColl = mongoose.connection.db.collection('users');
    const user = await usersColl.findOne({});
    console.log('Found user:', user ? { id: user._id, username: user.username } : 'No users');

    // Try finding a bank details doc
    const bankDetailsColl = mongoose.connection.db.collection('bankdetails');
    const bankDoc = await bankDetailsColl.findOne({});
    console.log('Found bank detail:', bankDoc);

  } catch (error) {
    console.error('Error connecting/querying DB:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

test();
