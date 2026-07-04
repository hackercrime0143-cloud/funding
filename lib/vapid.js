import webpush from 'web-push';
import { Settings } from './models';
import connectDB from './db';

export async function getVapidKeys() {
  await connectDB();
  let publicKeySetting = await Settings.findOne({ key: 'vapid_public_key' });
  let privateKeySetting = await Settings.findOne({ key: 'vapid_private_key' });

  if (!publicKeySetting || !privateKeySetting) {
    console.log('[FastPay VAPID] Generating new VAPID keys...');
    const keys = webpush.generateVAPIDKeys();
    publicKeySetting = await Settings.findOneAndUpdate(
      { key: 'vapid_public_key' },
      { value: keys.publicKey },
      { upsert: true, new: true }
    );
    privateKeySetting = await Settings.findOneAndUpdate(
      { key: 'vapid_private_key' },
      { value: keys.privateKey },
      { upsert: true, new: true }
    );
  }

  return {
    publicKey: publicKeySetting.value,
    privateKey: privateKeySetting.value
  };
}

export async function sendPushNotification(subscription, payload) {
  try {
    const keys = await getVapidKeys();
    webpush.setVapidDetails(
      'mailto:support@fastpay.com',
      keys.publicKey,
      keys.privateKey
    );
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    console.log('[FastPay Push] Push notification sent successfully!');
  } catch (err) {
    console.error('[FastPay Push] Error sending push notification:', err);
  }
}