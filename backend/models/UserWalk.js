const mongoose = require('mongoose');

const userWalkSchema = new mongoose.Schema({
  userid: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  marshall: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true
  },
  walkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Walk',
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
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'canceled', 'incomplete'], 
    default: 'scheduled' 
  }
}, { timestamps: true });

module.exports = mongoose.model('UserWalk', userWalkSchema);
