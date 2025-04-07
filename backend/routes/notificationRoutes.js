const express = require('express');
const router = express.Router();
const { 
  createNotification, 
  getUserNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/auth');

// Apply authentication middleware to all notification routes
router.use(verifyToken);

// Create a new notification
router.post('/', createNotification);

// Get all notifications for a user
router.get('/user/:userId', getUserNotifications);

// Mark a notification as read
router.put('/:id/read', markAsRead);

// Mark all notifications as read for a user
router.put('/user/:userId/read-all', markAllAsRead);

// Delete a notification
router.delete('/:id', deleteNotification);

module.exports = router;
