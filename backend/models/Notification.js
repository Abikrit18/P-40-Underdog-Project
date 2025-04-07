const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User'
  },
  content: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['walk', 'user', 'system', 'dog'],
    required: true 
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  entityId: { 
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityModel'
  },
  entityModel: {
    type: String,
    enum: ['Walk', 'User', 'WalkLog', 'Dog']
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 2592000 // Automatically delete after 30 days (in seconds)
  }
});

// Index for efficiently retrieving notifications for a user
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
