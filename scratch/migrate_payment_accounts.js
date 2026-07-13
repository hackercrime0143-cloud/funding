const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://hackercrime0143_db_user:650GTSHOW2026@ac-zpjqcjo-shard-00-00.4jvzdl4.mongodb.net:27017,ac-zpjqcjo-shard-00-01.4jvzdl4.mongodb.net:27017,ac-zpjqcjo-shard-00-02.4jvzdl4.mongodb.net:27017/fastpay?authSource=admin&replicaSet=atlas-eajcm6-shard-0&ssl=true&w=majority";

// Define Virtual Account Schema
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

const VirtualAccount = mongoose.models.VirtualAccount || mongoose.model('VirtualAccount', VirtualAccountSchema);

// Helper to download files over HTTPS
function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (Status Code: ${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => reject(err));
    });
  });
}

async function migrate() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created public/uploads directory.');
    }

    const accounts = await VirtualAccount.find({});
    console.log(`Found ${accounts.length} payment accounts to check.`);

    for (const acc of accounts) {
      console.log(`Checking account: ${acc.bank_name} | Account Number: ${acc.account_number}`);
      let updated = false;

      // 1. Check if UPI ID is wrongly mapped inside the account_number field
      if (acc.account_number.includes('@')) {
        const upiValue = acc.account_number.trim();
        console.log(`> Detected UPI ID "${upiValue}" in Account Number field. Moving to upi_id...`);
        
        acc.upi_id = upiValue;
        
        // Generate a random unique bank account number to satisfy unique and required constraints
        let isUnique = false;
        let candidateAcc = '';
        while (!isUnique) {
          candidateAcc = '919' + Math.floor(100000000 + Math.random() * 900000000).toString();
          const existing = await VirtualAccount.findOne({ account_number: candidateAcc });
          if (!existing) {
            isUnique = true;
          }
        }
        
        acc.account_number = candidateAcc;
        console.log(`> Assigned new random bank account number: "${candidateAcc}"`);
        updated = true;
      }

      // 2. Verify that the account has a valid QR image path
      if (!acc.qr_code || acc.qr_code.trim() === '') {
        const upi = acc.upi_id || 'fastpay@upi'; // fallback if no UPI ID is available
        const qrFilename = `qr-${acc._id}.png`;
        const qrLocalPath = path.join(uploadsDir, qrFilename);
        const qrUrlPath = `/api/uploads/${qrFilename}`;

        // Fetch QR image from API
        const apiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${upi}&pn=FastPay`)}`;
        console.log(`> Missing QR image. Downloading from: ${apiQrUrl}`);
        
        try {
          await downloadImage(apiQrUrl, qrLocalPath);
          console.log(`> QR image saved to: ${qrLocalPath}`);
          acc.qr_code = qrUrlPath;
          acc.qr_code_data = `upi://pay?pa=${upi}&pn=FastPay`;
          updated = true;
        } catch (downloadErr) {
          console.error(`> Error downloading QR image for account ${acc._id}:`, downloadErr.message);
        }
      }

      if (updated) {
        await acc.save();
        console.log(`Successfully updated and saved payment account ${acc._id}!`);
      } else {
        console.log(`Account ${acc._id} is already in a valid state.`);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

migrate();
