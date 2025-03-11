const mongoose = require('mongoose');

const walkLogSchema = new mongoose.Schema({
  walkId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Walk' 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
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
  notes: { 
    type: String 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed'], 
    default: 'pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('WalkLog', walkLogSchema);