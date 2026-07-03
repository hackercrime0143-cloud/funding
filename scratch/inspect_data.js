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

    const txs = await mongoose.connection.db.collection('transactions').find({ type: 'deposit' }).limit(10).toArray();
    console.log('Recent Deposit Transactions:', txs.map(t => ({
      _id: t._id,
      amount: t.amount,
      utr: t.utr,
      screenshot: t.screenshot,
      status: t.status,
      order_id: t.order_id
    })));

    const orders = await mongoose.connection.db.collection('orders').find({}).limit(10).toArray();
    console.log('Recent Orders:', orders.map(o => ({
      _id: o._id,
      price: o.price,
      utr: o.utr,
      screenshot: o.screenshot,
      status: o.status
    })));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
