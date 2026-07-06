const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fastpay';

// Define schemas inline to avoid ES module import conflicts
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  wallet_balance: { type: Number, default: 0 },
  support_id: { type: String, unique: true },
  referral_code: { type: String, unique: true },
  referred_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  is_telegram_channel_joined: { type: Boolean, default: false },
  is_telegram_group_joined: { type: Boolean, default: false },
  claimed_tasks: { type: [String], default: [] },
  is_suspended: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

const SchemeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  daily_return_rate: { type: Number, required: true },
  days: { type: Number, required: true },
  total_return: { type: Number, required: true },
  created_at: { type: Date, default: Date.now }
});

const OrderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheme_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', default: null },
  price: { type: Number, required: true },
  daily_income: { type: Number, default: 0 },
  total_payout: { type: Number, default: 0 },
  days_remaining: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  utr: { type: String, trim: true },
  screenshot: { type: String },
  last_payout_at: { type: Date },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  is_demo: { type: Boolean, default: false }
});

const TransactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, default: 'pending' },
  virtual_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualAccount', default: null },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  utr: { type: String, trim: true, sparse: true },
  screenshot: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
  
  // Resolution metadata
  approved_by_admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approved_by_admin_username: { type: String, default: null },
  resolved_at: { type: Date },
  rejection_reason: { type: String, default: '' },
  wallet_balance_at_request: { type: Number },

  // Referral metadata
  referred_user_username: { type: String, default: null },
  referred_user_phone: { type: String, default: null },
  scheme_name: { type: String, default: null },
  is_demo: { type: Boolean, default: false }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

async function run() {
  console.log('Connecting to database...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // 1. Seed the custom/micro schemes if they do not exist
  const microSchemes = [
    { name: 'Bronze Micro Scheme', price: 100, daily_return_rate: 0.04, days: 1, total_return: 104 },
    { name: 'Copper Micro Scheme', price: 200, daily_return_rate: 0.04, days: 3, total_return: 224 }
  ];

  for (const ms of microSchemes) {
    const existing = await Scheme.findOne({ name: ms.name });
    if (!existing) {
      await Scheme.create(ms);
      console.log(`Created scheme: ${ms.name}`);
    }
  }

  // 2. Fetch all schemes to build scheme templates
  const allSchemes = await Scheme.find({});
  const schemeMap = {};
  allSchemes.forEach(s => {
    schemeMap[s.price] = s;
  });

  // Target schemes list
  const targetPrices = [100, 200, 500, 1000, 2000, 5000];

  // 3. Find or create users
  console.log('Finding/creating test users...');
  // Clean up any old created official_jangid_g with the wrong phone numbers
  await User.deleteMany({ username: 'official_jangid_g', phone: { $ne: '9999138494' } });

  let u1 = await User.findOne({ phone: '9999138494' });
  if (!u1) {
    const hp = await bcrypt.hash('md786786', 10);
    u1 = await User.create({
      username: 'official_jangid_g',
      email: 'official_jangid_g@test.com',
      phone: '9999138494',
      password: hp,
      role: 'user',
      support_id: '311962',
      referral_code: 'REF311962'
    });
    console.log('Created user: official_jangid_g with phone 9999138494');
  } else {
    console.log('User official_jangid_g with phone 9999138494 already exists.');
    // Make sure support_id is set to 311962 and username is official_jangid_g
    u1.username = 'official_jangid_g';
    u1.support_id = '311962';
    await u1.save();
  }

  let u2 = await User.findOne({ username: 'john' });
  if (!u2) {
    const hp = await bcrypt.hash('Password123!', 10);
    u2 = await User.create({
      username: 'john',
      email: 'john@test.com',
      phone: '9876543211',
      password: hp,
      role: 'user',
      support_id: '365336',
      referral_code: 'REF365336',
      referred_by_id: u1._id // Set u1 as referrer for u2
    });
    console.log('Created user: john (referred by official_jangid_g)');
  } else {
    console.log('User john already exists.');
    u2.referred_by_id = u1._id;
    await u2.save();
    console.log('Force-linked john to be referred by official_jangid_g.');
  }

  // 4. Delete existing demo transactions/orders for these users
  console.log('Clearing old demo data...');
  const delTx = await Transaction.deleteMany({ user_id: { $in: [u1._id, u2._id] }, is_demo: true });
  const delOrders = await Order.deleteMany({ user_id: { $in: [u1._id, u2._id] }, is_demo: true });
  console.log(`Deleted ${delTx.deletedCount} transactions and ${delOrders.deletedCount} orders.`);

  // Initialize simulation parameters
  let balances = {
    [u1._id.toString()]: 0,
    [u2._id.toString()]: 0
  };

  // Keep track of active schemes per user
  let userActiveOrders = {
    [u1._id.toString()]: [],
    [u2._id.toString()]: []
  };

  const users = [u1, u2];

  // Helper to get random item from array
  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  // Helper to generate UTR
  const genUtr = (prefix) => `${prefix}-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Simulating 7 days of timeline
  // Day -7 to Day 0 (today)
  const now = new Date();
  const timeOffset = 5.5 * 60 * 60 * 1000; // GMT+5:30
  
  console.log('Simulating 7 days of timeline...');
  for (let dayOffset = -7; dayOffset <= 0; dayOffset++) {
    // Current date for this step in simulation
    const currentDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dateStr = currentDate.toDateString();
    console.log(`\n--- DayOffset ${dayOffset} (${dateStr}) ---`);

    // STEP A: Daily Return Yield payouts for active schemes (running from previous days)
    for (const user of users) {
      const userIdStr = user._id.toString();
      const activeList = userActiveOrders[userIdStr];
      const updatedActiveList = [];

      for (const order of activeList) {
        // Yield payout
        balances[userIdStr] += order.daily_income;

        // Record payout transaction
        await Transaction.create({
          user_id: user._id,
          order_id: order._id,
          type: 'scheme_payout',
          amount: order.daily_income,
          status: 'completed',
          created_at: currentDate,
          updated_at: currentDate,
          is_demo: true
        });

        // Decrement days remaining
        order.days_remaining -= 1;
        if (order.days_remaining <= 0) {
          // Completed
          await Order.updateOne(
            { _id: order._id },
            { $set: { days_remaining: 0, status: 'completed', updated_at: currentDate } }
          );
          console.log(`Scheme ${order.scheme_name} completed for user ${user.username}`);
        } else {
          // Still active
          await Order.updateOne(
            { _id: order._id },
            { $set: { days_remaining: order.days_remaining, updated_at: currentDate } }
          );
          updatedActiveList.push(order);
        }
      }
      userActiveOrders[userIdStr] = updatedActiveList;
    }

    // STEP B: Deposits (2-3 per user per day)
    for (const user of users) {
      const userIdStr = user._id.toString();
      const numDeposits = randomChoice([2, 3]);

      for (let i = 0; i < numDeposits; i++) {
        const depositAmt = randomChoice([1000, 2000, 3000, 5000, 10000]);
        balances[userIdStr] += depositAmt;

        await Transaction.create({
          user_id: user._id,
          type: 'deposit',
          amount: depositAmt,
          status: 'completed',
          utr: genUtr('DEP'),
          screenshot: '/api/uploads/placeholder.png',
          created_at: currentDate,
          updated_at: currentDate,
          resolved_at: currentDate,
          is_demo: true
        });
        console.log(`User ${user.username} deposited ₹${depositAmt}`);
      }
    }

    // STEP C: Scheme Purchases (2-4 per user per day)
    for (const user of users) {
      const userIdStr = user._id.toString();
      const numPurchases = randomChoice([2, 3, 4]);

      for (let i = 0; i < numPurchases; i++) {
        const targetPrice = randomChoice(targetPrices);
        const schemeInfo = schemeMap[targetPrice];

        if (balances[userIdStr] >= targetPrice && schemeInfo) {
          balances[userIdStr] -= targetPrice;

          // Create purchase transaction log
          const purchaseTx = await Transaction.create({
            user_id: user._id,
            type: 'wallet_purchase',
            amount: -targetPrice,
            status: 'completed',
            utr: genUtr('WAL'),
            screenshot: 'wallet_purchase',
            created_at: currentDate,
            updated_at: currentDate,
            is_demo: true
          });

          // Payout first day yield immediately
          const dailyYield = targetPrice * schemeInfo.daily_return_rate;
          balances[userIdStr] += dailyYield;

          // Create active scheme order
          const newOrder = await Order.create({
            user_id: user._id,
            scheme_id: schemeInfo._id,
            price: targetPrice,
            daily_income: dailyYield,
            total_payout: schemeInfo.total_return,
            days_remaining: Math.max(0, schemeInfo.days - 1),
            status: schemeInfo.days - 1 <= 0 ? 'completed' : 'active',
            utr: purchaseTx.utr,
            screenshot: 'wallet_purchase',
            last_payout_at: currentDate,
            created_at: currentDate,
            updated_at: currentDate,
            is_demo: true
          });

          // Link order to purchase transaction
          purchaseTx.order_id = newOrder._id;
          purchaseTx.scheme_name = schemeInfo.name;
          await purchaseTx.save();

          // Create payout transaction log
          await Transaction.create({
            user_id: user._id,
            order_id: newOrder._id,
            type: 'scheme_payout',
            amount: dailyYield,
            status: 'completed',
            created_at: currentDate,
            updated_at: currentDate,
            is_demo: true
          });

          console.log(`User ${user.username} purchased scheme: ${schemeInfo.name} for ₹${targetPrice}`);

          // If still active, add to tracking list
          if (newOrder.status === 'active') {
            userActiveOrders[userIdStr].push({
              _id: newOrder._id,
              scheme_name: schemeInfo.name,
              price: targetPrice,
              daily_income: dailyYield,
              days_remaining: newOrder.days_remaining
            });
          }

          // Distribute referral commission if they have a referrer
          if (user.referred_by_id) {
            const l1Referrer = await User.findById(user.referred_by_id);
            if (l1Referrer) {
              const commL1 = targetPrice * 0.003;
              const refIdStr = l1Referrer._id.toString();
              balances[refIdStr] += commL1;

              await Transaction.create({
                user_id: l1Referrer._id,
                order_id: newOrder._id,
                type: 'referral_commission_l1',
                amount: commL1,
                status: 'completed',
                referred_user_username: user.username,
                referred_user_phone: user.phone,
                scheme_name: schemeInfo.name,
                created_at: currentDate,
                updated_at: currentDate,
                is_demo: true
              });
              console.log(`Referrer ${l1Referrer.username} earned L1 commission ₹${commL1} from ${user.username}`);
            }
          }
        }
      }
    }

    // STEP D: Withdrawals (1 per user per day if sufficient balance)
    for (const user of users) {
      const userIdStr = user._id.toString();
      
      // Let's check if the user has matured/active schemes to be eligible
      // Since they purchased schemes on this day or previous days, they are eligible.
      // Withdraw ₹500 to ₹2000 if balance is high
      if (balances[userIdStr] >= 1000) {
        const withdrawAmt = randomChoice([500, 1000, 1500, 2000]);
        balances[userIdStr] -= withdrawAmt;

        await Transaction.create({
          user_id: user._id,
          type: 'withdrawal',
          amount: withdrawAmt,
          status: 'completed',
          utr: genUtr('WTH'),
          created_at: currentDate,
          updated_at: currentDate,
          resolved_at: currentDate,
          is_demo: true
        });
        console.log(`User ${user.username} withdrew ₹${withdrawAmt}`);
      }
    }
  }

  // 5. Update final user wallet balances in database
  console.log('\nUpdating final user wallet balances...');
  for (const user of users) {
    const userIdStr = user._id.toString();
    const finalBalance = balances[userIdStr];
    await User.updateOne(
      { _id: user._id },
      { $set: { wallet_balance: finalBalance } }
    );
    console.log(`User ${user.username} final wallet balance updated to ₹${finalBalance.toFixed(2)}`);
  }

  console.log('Demo data generation complete!');
  mongoose.connection.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
