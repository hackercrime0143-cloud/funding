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

    const statusCounts = await mongoose.connection.db.collection('orders').aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]).toArray();

    console.log('Order Status Counts:', statusCounts);

    const nonFailedOrders = await mongoose.connection.db.collection('orders')
      .find({ status: { $nin: ['failed', 'cancelled', 'rejected'] } })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();

    console.log('Recent Non-failed/Non-cancelled Orders:');
    for (const o of nonFailedOrders) {
      const user = await mongoose.connection.db.collection('users').findOne({ _id: o.user_id });
      let va = null;
      if (o.virtual_account_id) {
        va = await mongoose.connection.db.collection('virtualaccounts').findOne({ _id: o.virtual_account_id });
      }
      console.log(`Order ID: ${o._id}`);
      console.log(`  User: ${user ? `${user.username} (${user.phone})` : 'Unknown'}`);
      console.log(`  Price: ₹${o.price}`);
      console.log(`  UTR: ${o.utr}`);
      console.log(`  Status: ${o.status}`);
      console.log(`  VA ID: ${o.virtual_account_id || 'None (Fallback)'}`);
      console.log(`  VA UPI ID: ${va ? va.upi_id : 'None (Fallback fastpay@upi)'}`);
      console.log(`  Created At: ${o.created_at}`);
      console.log('------------------------------------');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
