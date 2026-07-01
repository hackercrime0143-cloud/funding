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

// Recreate BankDetailsSchema
const BankDetailsSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  account_number: { type: String, required: true, trim: true },
  account_name: { type: String, required: true, trim: true },
  ifsc: { type: String, required: true, uppercase: true, trim: true },
  upi_id: { type: String, required: true, lowercase: true, trim: true },
  updated_at: { type: Date, default: Date.now }
});

const BankDetails = mongoose.models.BankDetails || mongoose.model('BankDetails', BankDetailsSchema);

async function test() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const testUserId = '6a413c6a70a97547bf8173f1'; // dummy valid object id
    console.log(`Running upsert for user_id: ${testUserId}`);

    const result = await BankDetails.findOneAndUpdate(
      { user_id: testUserId },
      { 
        account_number: '1234567890', 
        account_name: 'Test Account', 
        ifsc: 'SBIN0012345', 
        upi_id: 'test@upi',
        updated_at: new Date()
      },
      { upsert: true, new: true }
    );

    console.log('Upsert result:', result);

  } catch (error) {
    console.error('Upsert failed with error:');
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

test();
