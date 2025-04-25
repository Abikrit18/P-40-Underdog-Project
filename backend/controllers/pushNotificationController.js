const PushSubscription = require('../models/PushSubscription');
const pushService = require('../services/pushNotificationService');

// Get VAPID public key
const getVapidPublicKey = (req, res) => {
  try {
    const publicKey = pushService.getVapidPublicKey();
    res.status(200).json(publicKey);
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({ error: 'Failed to get VAPID public key' });
  }
};

// Save push subscription
const savePushSubscription = async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    // Check if subscription already exists
    const existingSubscription = await PushSubscription.findOne({
      userId,
      subscription
    });
    
    if (existingSubscription) {
      return res.status(200).json({ message: 'Subscription already exists' });
    }
    
    // Create new subscription
    await PushSubscription.create({
      userId,
      subscription
    });
    
    res.status(201).json({ message: 'Push subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
};

// Delete push subscription
const deletePushSubscription = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Delete all subscriptions for this user
    await PushSubscription.deleteMany({ userId });
    
    res.status(200).json({ message: 'Push subscriptions deleted successfully' });
  } catch (error) {
    console.error('Error deleting push subscription:', error);
    res.status(500).json({ error: 'Failed to delete push subscription' });
  }
};

// Send push notification to a user
const sendPushNotification = async (userId, notification) => {
  try {
    return await pushService.sendPushNotification(userId, notification);
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

module.exports = {
  getVapidPublicKey,
  savePushSubscription,
  deletePushSubscription,
  sendPushNotification
};
