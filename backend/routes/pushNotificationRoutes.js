const express = require('express');
const router = express.Router();
const { 
  getVapidPublicKey, 
  savePushSubscription, 
  deletePushSubscription 
} = require('../controllers/pushNotificationController');
const { verifyToken } = require('../middleware/auth');

// Get VAPID public key (no authentication required)
router.get('/vapid-public-key', getVapidPublicKey);

// Save push subscription (authentication required)
router.post('/push-subscription', verifyToken, savePushSubscription);

// Delete push subscription (authentication required)
router.delete('/push-subscription/:userId', verifyToken, deletePushSubscription);

module.exports = router;
