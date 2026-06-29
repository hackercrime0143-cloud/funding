const mongoose = require('mongoose');
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = "mongodb+srv://hackercrime0143_db_user:FIAFsSY8ZtfktHBi@cluster0.4jvzdl4.mongodb.net/fastpay?authSource=admin&retryWrites=true&w=majority";

async function run() {
  try {
    console.log('Connecting to database with authSource=admin...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const collection = mongoose.connection.db.collection('virtualaccounts');
    
    console.log('Fetching current indexes...');
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes);

    // Find and drop the stale accountNumber index
    const hasStaleIndex = indexes.some(idx => idx.name === 'accountNumber_1');
    if (hasStaleIndex) {
      console.log('Dropping stale index "accountNumber_1"...');
      await collection.dropIndex('accountNumber_1');
      console.log('Stale index dropped successfully!');
    } else {
      console.log('No index named "accountNumber_1" found.');
    }

    console.log('Final Index List:');
    const finalIndexes = await collection.indexes();
    console.log(finalIndexes);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

run();
