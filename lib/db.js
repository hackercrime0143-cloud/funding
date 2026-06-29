import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dns from 'dns';
import { Scheme, VirtualAccount, User } from './models';

// Configure DNS to resolve MongoDB Atlas SRV querySrv issues on local networks
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastpay';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB connected successfully');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  // Run Seed logic once connection is verified
  await seedDB();

  return cached.conn;
}

async function seedDB() {
  try {
    // Drop the conflicting stale index 'accountNumber_1' if it exists in 'virtualaccounts'
    try {
      const collection = mongoose.connection.db.collection('virtualaccounts');
      const indexes = await collection.indexes();
      const hasStaleIndex = indexes.some(idx => idx.name === 'accountNumber_1');
      if (hasStaleIndex) {
        console.log('Dropping stale unique index "accountNumber_1"...');
        await collection.dropIndex('accountNumber_1');
        console.log('Stale unique index "accountNumber_1" dropped successfully!');
      }
    } catch (idxErr) {
      console.error('Error checking or dropping index "accountNumber_1":', idxErr);
    }

    // 1. Seed Schemes if empty
    const schemeCount = await Scheme.countDocuments();
    if (schemeCount === 0) {
      console.log('Seeding investment schemes into MongoDB...');
      await Scheme.insertMany([
        { name: 'Fast Starter Scheme', price: 500, daily_return_rate: 0.04, days: 7, total_return: 520 },
        { name: 'Silver Yield Scheme', price: 1000, daily_return_rate: 0.035, days: 10, total_return: 1350 },
        { name: 'Gold Wealth Plan', price: 5000, daily_return_rate: 0.035, days: 15, total_return: 7625 },
        { name: 'Platinum Profit Plan', price: 10000, daily_return_rate: 0.035, days: 30, total_return: 20500 },
        { name: 'Bronze Mini Plan', price: 300, daily_return_rate: 0.04, days: 5, total_return: 360 },
        { name: 'Copper Basic Scheme', price: 800, daily_return_rate: 0.038, days: 8, total_return: 1043 },
        { name: 'Apex Starter Plus', price: 1500, daily_return_rate: 0.036, days: 12, total_return: 2148 },
        { name: 'VIP Elite Venture', price: 12000, daily_return_rate: 0.037, days: 20, total_return: 20880 },
        { name: 'Quantum High Yield', price: 25000, daily_return_rate: 0.042, days: 25, total_return: 51250 },
        { name: 'Alpha Growth Yield', price: 2000, daily_return_rate: 0.035, days: 10, total_return: 2700 },
        { name: 'Beta Wealth Booster', price: 3500, daily_return_rate: 0.036, days: 14, total_return: 5264 },
        { name: 'Titanium VIP Pool', price: 15000, daily_return_rate: 0.039, days: 18, total_return: 25530 }
      ]);
    }

    // 2. Seed Virtual Accounts if empty
    const vaCount = await VirtualAccount.countDocuments();
    if (vaCount === 0) {
      console.log('Seeding virtual bank accounts into MongoDB...');
      await VirtualAccount.insertMany([
        { account_number: '912010087654321', bank_name: 'Axis Bank', beneficiary_name: 'FastPay Settlement A', ifsc: 'UTIB0000123' },
        { account_number: '1009876543210', bank_name: 'State Bank of India', beneficiary_name: 'FastPay Settlement B', ifsc: 'SBIN0000300' },
        { account_number: '50200001234567', bank_name: 'HDFC Bank', beneficiary_name: 'FastPay Settlement C', ifsc: 'HDFC0000060' },
        { account_number: '000701509999', bank_name: 'ICICI Bank', beneficiary_name: 'FastPay Settlement D', ifsc: 'ICIC0000007' },
        { account_number: '3012903829012', bank_name: 'Punjab National Bank', beneficiary_name: 'FastPay Settlement E', ifsc: 'PUNB0122200' },
        { account_number: '8819203849102', bank_name: 'Kotak Mahindra Bank', beneficiary_name: 'FastPay Settlement F', ifsc: 'KKBK0000958' },
        { account_number: '1102938492019', bank_name: 'Yes Bank', beneficiary_name: 'FastPay Settlement G', ifsc: 'YESB0000001' },
        { account_number: '4920192038492', bank_name: 'IndusInd Bank', beneficiary_name: 'FastPay Settlement H', ifsc: 'INDB0000018' },
        { account_number: '7281920384920', bank_name: 'Bank of Baroda', beneficiary_name: 'FastPay Settlement I', ifsc: 'BARB0COLABA' },
        { account_number: '5529102839201', bank_name: 'Canara Bank', beneficiary_name: 'FastPay Settlement J', ifsc: 'CNRB0000002' }
      ]);
    }

    // 3. Seed secure Admin Account if not exists
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('Seeding default administrator account...');
      const hashedPassword = await bcrypt.hash('AdminSecurePassword123!', 10);
      await User.create({
        username: 'admin',
        phone: '9999999999',
        email: 'admin@fastpay.com',
        password: hashedPassword,
        referral_code: 'FPADMIN',
        role: 'admin',
        wallet_balance: 0.0
      });
      console.log('Default admin seeded with username: "admin" and password: "AdminSecurePassword123!"');
    }
  } catch (error) {
    console.error('Database seeding error:', error);
  }
}

// Automatically trigger connection
connectDB().catch(err => console.error('Initial MongoDB connection error:', err));

export default connectDB;
