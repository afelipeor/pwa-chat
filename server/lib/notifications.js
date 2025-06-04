const webpush = require('web-push');
const { ObjectId } = require('mongodb');
const { getUsersCollection } = require('./mongodb');

// Check environment variables
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;

console.log('🔑 VAPID Configuration Status:');
console.log(
  'Public Key:',
  publicKey ? `✅ Present (${publicKey.substring(0, 20)}...)` : '❌ Missing'
);
console.log(
  'Private Key:',
  privateKey ? `✅ Present (${privateKey.substring(0, 20)}...)` : '❌ Missing'
);

let vapidConfigured = false;

if (
  publicKey &&
  privateKey &&
  publicKey !== 'your-public-key' &&
  privateKey !== 'your-private-key' &&
  publicKey !== 'PASTE_YOUR_GENERATED_PUBLIC_KEY_HERE' &&
  privateKey !== 'PASTE_YOUR_GENERATED_PRIVATE_KEY_HERE'
) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@yourdomain.com',
      publicKey,
      privateKey
    );
    vapidConfigured = true;
    console.log(
      '✅ VAPID configured successfully - Push notifications enabled'
    );
  } catch (error) {
    console.error('❌ Invalid VAPID keys:', error.message);
    console.log('🔧 Generate new keys with: npm run generate-vapid');
  }
} else {
  console.warn('⚠️  VAPID keys not configured properly');
  console.log('🔧 Generate VAPID keys with: npm run generate-vapid');
  console.log('📝 Then update your .env.local file with the generated keys');
}

async function sendNotificationToAll(message, excludeUserId) {
  if (!vapidConfigured) {
    console.log('📱 Push notification skipped - VAPID not configured');
    return;
  }

  try {
    const users = await getUsersCollection();
    const query = excludeUserId
      ? {
          pushSubscription: { $exists: true },
          _id: { $ne: new ObjectId(excludeUserId) },
        }
      : { pushSubscription: { $exists: true } };

    const usersWithSubscriptions = await users.find(query).toArray();

    if (usersWithSubscriptions.length === 0) {
      console.log('📱 No users with push subscriptions found');
      return;
    }

    const notifications = usersWithSubscriptions.map((user) => {
      return webpush
        .sendNotification(
          user.pushSubscription,
          JSON.stringify({
            title: 'New Message',
            body: message,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [100, 50, 100],
            data: { url: '/' },
          })
        )
        .catch((error) => {
          console.error(
            `Failed to send notification to user ${user._id}:`,
            error.message
          );
          if (error.statusCode === 410) {
            users.updateOne(
              { _id: user._id },
              { $unset: { pushSubscription: '' } }
            );
          }
        });
    });

    await Promise.allSettled(notifications);
    console.log(`📱 Sent ${notifications.length} push notifications`);
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
  }
}

module.exports = {
  sendNotificationToAll,
  isConfigured: () => vapidConfigured,
};
