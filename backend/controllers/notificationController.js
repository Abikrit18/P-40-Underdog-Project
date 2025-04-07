const Notification = require('../models/Notification');
const User = require('../models/User');

// Create a new notification
const createNotification = async (req, res) => {
  try {
    const { recipient, sender, content, type, entityId, entityModel } = req.body;
    
    // Validate recipient exists
    const recipientExists = await User.findById(recipient);
    if (!recipientExists) {
      return res.status(404).json({ error: 'Recipient user not found' });
    }
    
    // Create notification
    const notification = await Notification.create({
      recipient,
      sender,
      content,
      type,
      entityId,
      entityModel
    });
    
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
};

// Get notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get notifications for the user, sorted by creation date (newest first)
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .populate('sender', 'firstName lastName')
      .limit(50); // Limit to 50 most recent notifications
    
    // Count unread notifications
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId,
      read: false
    });
    
    res.status(200).json({ 
      notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
};

// Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );
    
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

// Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    
    const notification = await Notification.findByIdAndDelete(notificationId);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};

// Helper function to create notifications from other controllers
const createSystemNotification = async (recipientId, content, type, entityId = null, entityModel = null, senderId = null) => {
  try {
    await Notification.create({
      recipient: recipientId,
      sender: senderId,
      content,
      type,
      entityId,
      entityModel
    });
    return true;
  } catch (error) {
    console.error('Error creating system notification:', error);
    return false;
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createSystemNotification
};
