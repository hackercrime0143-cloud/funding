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
    enum: ['pending', 'active', 'expired_pending_match', 'completed', 'rejected', 'cancelled', 'failed'], 
    default: 'pending' 
  },
  utr: { type: String, required: true, unique: true, trim: true },
  screenshot: { type: String },
  virtual_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualAccount', default: null },
  is_payout_matched: { type: Boolean, default: false }
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
  locked_by_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
});

// 7. Transaction Schema
const TransactionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  virtual_account_id: { type: mongoose.Schema.Types.ObjectId, ref: 'VirtualAccount', default: null },
  utr: { type: String, trim: true, sparse: true },
  screenshot: { type: String },
  created_at: { type: Date, default: Date.now }
});

// 8. Settings Schema
const SettingsSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
});

// Export helper
export const User = mongoose.models.User || mongoose.model('User', UserSchema);
export const Otp = mongoose.models.Otp || mongoose.model('Otp', OtpSchema);
export const BankDetails = mongoose.models.BankDetails || mongoose.model('BankDetails', BankDetailsSchema);
export const Scheme = mongoose.models.Scheme || mongoose.model('Scheme', SchemeSchema);
export const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const VirtualAccount = mongoose.models.VirtualAccount || mongoose.model('VirtualAccount', VirtualAccountSchema);
export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
export const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
