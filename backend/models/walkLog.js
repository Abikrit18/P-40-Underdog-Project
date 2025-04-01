const mongoose = require('mongoose');

const walkLogSchema = new mongoose.Schema({
  walkId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Walk' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  marshallId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  date: { 
    type: String, 
    required: true 
  },
  time: { 
    type: String, 
    required: true 
  },
  dogs: [{ 
    type: String 
  }],
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'incomplete'], 
    default: 'pending' 
  },
  isTimeSlotFullyBooked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Create a compound index for efficiently checking if a user has completed a walk for a specific date and time
walkLogSchema.index({ userId: 1, date: 1, time: 1 });

module.exports = mongoose.model('WalkLog', walkLogSchema);