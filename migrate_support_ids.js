const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://hackercrime0143_db_user:FIAFsSY8ZtfktHBi@ac-zpjqcjo-shard-00-00.4jvzdl4.mongodb.net:27017,ac-zpjqcjo-shard-00-01.4jvzdl4.mongodb.net:27017,ac-zpjqcjo-shard-00-02.4jvzdl4.mongodb.net:27017/fastpay?ssl=true&replicaSet=atlas-eajcm6-shard-0&authSource=admin&appName=Cluster0";

// Define simplified User Schema for migration
const UserSchema = new mongoose.Schema({
  username: String,
  support_id: String
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function run() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const users = await User.find({
      $or: [
        { support_id: { $exists: false } },
        { support_id: null },
        { support_id: "" }
      ]
    });

    console.log(`Found ${users.length} users needing support_id migration.`);

    for (const user of users) {
      let unique = false;
      let supportId = '';
      
      while (!unique) {
        const candidate = Math.floor(100000 + Math.random() * 900000).toString();
        const existing = await User.findOne({ support_id: candidate });
        if (!existing) {
          supportId = candidate;
          unique = true;
        }
      }

      user.support_id = supportId;
      await user.save();
      console.log(`Successfully migrated user "${user.username}" with Support ID: ${supportId}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
}

run();
