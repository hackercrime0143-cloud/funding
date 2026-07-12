import mongoose from 'mongoose';

// 1. User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  referral_code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  support_id: { type: String, unique: true, sparse: true, trim: true },
  referred_by_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  wallet_balance: { type: Number, default: 0.0 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  is_telegram_channel_joined: { type: Boolean, default: false },
  is_telegram_group_joined: { type: Boolean, default: false },
  claimed_tasks: { type: [String], default: [] },
  referral_milestones_claimed: { type: [Number], default: [] },
  free_spins: { type: Number, default: 0 },
  is_suspended: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

// 2. OTP Schema
const OtpSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true },
  expires_at: { type: Date, required: true },
  otp_requests: [{ type: Date }] // Track timestamps of OTP requests in the last 24h
});

// 3. Bank Details Schema
const BankDetailsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  account_number: { type: String, required: true, trim: true },
  account_name: { type: String, required: true, trim: true },
  ifsc: { type: String, required: true, uppercase: true, trim: true },
  upi_id: { type: String, required: true, lowercase: true, trim: true },
  updated_at: { type: Date, default: Date.now }
});

// 4. Scheme Schema
const SchemeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  daily_return_rate: { type: Number, required: true },
  days: { type: Number, required: true },
  total_return: { type: Number, required: true }
});

// 5. Order Schema
const OrderSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  scheme_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: false },
  price: { type: Number, required: true },
  daily_income: { type: Number, required: true },
  total_payout: { type: Number, required: true },
  days_remaining: { type: Number, required: true },
  last_payout_at: { type: Date, default: Date.now },
  created_at: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'confirmation_pending', 'active', 'expired_pending_match', 'completed', 'rejected', 'cancelled', 'failed'], 
    default: 'pending' 
  },
  utr: { type: String, required: true, unique: true, trim: true },
  screenshot: { type: String },
  virtual_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualAccount', default: null },
  is_payout_matched: { type: Boolean, default: false },
  rejection_reason: { type: String, default: '' }
});

// 6. Virtual Account Schema
const VirtualAccountSchema = new mongoose.Schema({
  account_number: { type: String, required: true, unique: true, trim: true },
  bank_name: { type: String, required: true, trim: true },
  beneficiary_name: { type: String, required: true, trim: true },
  ifsc: { type: String, required: true, uppercase: true, trim: true },
  upi_id: { type: String, default: '', trim: true },
  is_locked: { type: Boolean, default: false },
  locked_until: { type: Date, default: null },
  locked_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  is_enabled: { type: Boolean, default: true },
  qr_code: { type: String, default: '' },
  qr_code_data: { type: String, default: '' },
  allow_concurrent: { type: Boolean, default: false },
  last_assigned_at: { type: Date, default: Date.now }
});

// 7. Transaction Schema
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

  // Deposit-specific snapshots
  deposit_bank_name: { type: String },
  deposit_account_number: { type: String },
  deposit_beneficiary_name: { type: String },
  deposit_upi_id: { type: String },
  deposit_qr_code: { type: String },

  // Withdrawal-specific snapshots
  user_username: { type: String },
  user_phone: { type: String },
  withdrawal_bank_name: { type: String },
  withdrawal_account_name: { type: String },
  withdrawal_account_number: { type: String },
  withdrawal_ifsc: { type: String },
  withdrawal_upi_id: { type: String },

  // Referral metadata
  referred_user_username: { type: String, default: null },
  referred_user_phone: { type: String, default: null },
  scheme_name: { type: String, default: null }
});

// Configure Database Indexes for Query Optimization
UserSchema.index({ referred_by_id: 1, created_at: -1 });
UserSchema.index({ created_at: -1 });
OrderSchema.index({ user_id: 1, created_at: -1 });
OrderSchema.index({ status: 1, created_at: -1 });
TransactionSchema.index({ user_id: 1, created_at: -1 });
TransactionSchema.index({ type: 1, status: 1, created_at: -1 });

// 8. Settings Schema
const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

// 9. Notification Schema
const NotificationSchema = new mongoose.Schema({
  username: { type: String, required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  action: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
  is_read: { type: Boolean, default: false }
});

NotificationSchema.index({ is_read: 1, created_at: -1 });
NotificationSchema.index({ user_id: 1, created_at: -1 });

// 10. Push Subscription Schema
const PushSubscriptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subscription: { type: mongoose.Schema.Types.Mixed, required: true },
  created_at: { type: Date, default: Date.now }
});

// 11. Spin Log Schema
const SpinLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount_paid: { type: Number, required: true },
  prize_won: { type: String, required: true },
  wallet_credit: { type: Number, default: 0 },
  is_free_spin: { type: Boolean, default: false },
  status: { type: String, enum: ['credited', 'none', 'pending_fulfillment', 'fulfilled'], default: 'none' },
  created_at: { type: Date, default: Date.now }
});

SpinLogSchema.index({ user_id: 1, created_at: -1 });

// 12. Lottery Ticket Schema
const LotteryTicketSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  draw_id: { type: mongoose.Schema.Types.ObjectId, ref: 'LotteryDraw' },
  week_number: { type: Number },
  ticket_code: { type: String, required: true },
  price: { type: Number, required: true },
  multiplier: { type: Number, required: true },
  status: { type: String, enum: ['active', 'won', 'lost'], default: 'active' },
  prize_amount: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

LotteryTicketSchema.index({ user_id: 1, created_at: -1 });
LotteryTicketSchema.index({ status: 1 });
LotteryTicketSchema.index({ draw_id: 1 });
LotteryTicketSchema.index({ week_number: 1 });

// 13. Lottery Draw Schema
const LotteryDrawSchema = new mongoose.Schema({
  week_number: { type: Number, required: true, unique: true },
  sales_start_date: { type: Date, required: true },
  sales_end_date: { type: Date },
  draw_date: { type: Date },
  winning_code: { type: String },
  status: { type: String, enum: ['open', 'closed', 'completed'], default: 'open' },
  ticket_price: { type: Number, default: 100 },
  multiplier: { type: Number, default: 2 },
  total_tickets_sold: { type: Number, default: 0 },
  total_revenue: { type: Number, default: 0 },
  total_prizes_paid: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now }
});

LotteryDrawSchema.index({ week_number: -1 });

// 14. Used QR Code Schema
const UsedQrCodeSchema = new mongoose.Schema({
  qr_code_content: { type: String, required: true, unique: true, trim: true },
  virtual_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualAccount', default: null },
  order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  created_at: { type: Date, default: Date.now }
});

UsedQrCodeSchema.index({ qr_code_content: 1 });

// Export helper
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Otp = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
export const BankDetails = mongoose.models.BankDetails || mongoose.model('BankDetails', BankDetailsSchema);
export const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const VirtualAccount = mongoose.models.VirtualAccount || mongoose.model('VirtualAccount', VirtualAccountSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
export const Notification = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
export const PushSubscription = mongoose.models.PushSubscription || mongoose.model('PushSubscription', PushSubscriptionSchema);
export const SpinLog = mongoose.models.SpinLog || mongoose.model('SpinLog', SpinLogSchema);
export const LotteryTicket = mongoose.models.LotteryTicket || mongoose.model('LotteryTicket', LotteryTicketSchema);
export const LotteryDraw = mongoose.models.LotteryDraw || mongoose.model('LotteryDraw', LotteryDrawSchema);
export const UsedQrCode = mongoose.models.UsedQrCode || mongoose.model('UsedQrCode', UsedQrCodeSchema);

export async function createAdminNotification(userId, amount, action) {
  try {
    const user = await User.findById(userId);
    if (!user) return;
    await Notification.create({
      username: user.username,
      user_id: userId,
      amount,
      action
    });

    // If it's a deposit or withdrawal request, send real mobile push notifications to all admins
    if (action === 'Submitted new deposit' || action === 'Submitted withdrawal request') {
      const isDeposit = action === 'Submitted new deposit';
      const actionName = isDeposit ? 'Deposit' : 'Withdrawal';
      
      const subs = await mongoose.model('PushSubscription').find({});
      const { sendPushNotification } = await import('./vapid');

      const payload = {
        title: `⚠️ New ${actionName} Request`,
        body: `Username: ${user.username}\nID: ${user._id}\nAmount: ₹${Math.abs(amount).toFixed(2)}\nAction: ${actionName}\nTime: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      };

      for (const sub of subs) {
        await sendPushNotification(sub.subscription, payload);
      }
    }
  } catch (err) {
    console.error('Error creating admin notification:', err);
  }
}

export async function checkAndAwardReferralMilestones(referrerId) {
  if (!referrerId) return;
  try {
    const referrer = await User.findById(referrerId);
    if (!referrer) return;

    // Find direct referrals
    const levelA = await User.find({ referred_by_id: referrerId }).select('_id');
    if (levelA.length === 0) return;
    const levelAIds = levelA.map(u => u._id);

    // Find purchasers
    const distinctPurchasers = await Order.distinct('user_id', {
      user_id: { $in: levelAIds },
      status: { $in: ['active', 'completed', 'expired_pending_match'] }
    });
    const completedReferralTasks = distinctPurchasers.length;

    const milestones = [
      { number: 1, target: 10, reward: 500 },
      { number: 2, target: 20, reward: 500 },
      { number: 3, target: 30, reward: 500 }
    ];

    let walletUpdated = false;
    let newClaimed = [...(referrer.referral_milestones_claimed || [])];

    for (const m of milestones) {
      if (completedReferralTasks >= m.target && !newClaimed.includes(m.number)) {
        // Award Milestone!
        referrer.wallet_balance += m.reward;
        newClaimed.push(m.number);
        walletUpdated = true;

        // Create transaction log
        await Transaction.create({
          user_id: referrerId,
          type: `referral_reward_milestone_${m.number}`,
          amount: m.reward,
          status: 'completed',
          referred_user_username: `Milestone ${m.number}`,
          scheme_name: 'Referral Reward Task'
        });

        // Notify admins
        await createAdminNotification(referrerId, m.reward, `Earned Referral Reward Milestone ${m.number}`);
      }
    }

    if (walletUpdated) {
      referrer.referral_milestones_claimed = newClaimed;
      await referrer.save();
    }
  } catch (err) {
    console.error('Error checking referral milestones:', err);
  }
}

