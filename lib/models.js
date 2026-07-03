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
  withdrawal_upi_id: { type: String }
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
  } catch (err) {
    console.error('Error creating admin notification:', err);
  }
}

