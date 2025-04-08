const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY || 'BLBz5U0-fJpXR9Qj0ldS4xMw9yv_FDQzXQEBgwC_Ze9IzY8RijVR0eHUQQBed4xOmyQwqzR_UESzj5aqNyFZpSM',
  privateKey: process.env.VAPID_PRIVATE_KEY || 'Fwn2rfpCXi0Qg9vMXX7Hou_9jGEXGZYTJO3eCQTYDVE'
};

webpush.setVapidDetails(
  'mailto:contact@p40underdogs.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

/**
 * Send a push notification to a specific user
 * @param {string} userId - User ID to send notification to
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {string} notification.icon - Notification icon URL (optional)
 * @param {string} notification.url - URL to open when notification is clicked (optional)
 * @returns {Promise<boolean>} - Whether the notification was sent successfully
 */
const sendPushNotification = async (userId, notification) => {
  try {
    // Find all subscriptions for this user
    const subscriptions = await PushSubscription.find({ userId });
    
    if (!subscriptions || subscriptions.length === 0) {
      console.log(`No push subscriptions found for user ${userId}`);
      return false;
    }
    
    // Send notification to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const parsedSubscription = JSON.parse(sub.subscription);
          await webpush.sendNotification(parsedSubscription, JSON.stringify(notification));
          return true;
        } catch (error) {
          console.error('Error sending push notification:', error);
          
          // If subscription is no longer valid, remove it
          if (error.statusCode === 410) {
            await PushSubscription.findByIdAndDelete(sub._id);
          }
          
          return false;
        }
      })
    );
    
    // Return true if at least one notification was sent successfully
    return results.some(result => result);
  } catch (error) {
    console.error('Error in sendPushNotification:', error);
    return false;
  }
};

/**
 * Get the VAPID public key
 * @returns {Object} - Object containing the VAPID public key
 */
const getVapidPublicKey = () => {
  return { vapidPublicKey: vapidKeys.publicKey };
};

module.exports = {
  sendPushNotification,
  getVapidPublicKey
};
