const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  subscription: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now
  }
});

// Create a compound index for userId to ensure fast lookups
pushSubscriptionSchema.index({ userId: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
