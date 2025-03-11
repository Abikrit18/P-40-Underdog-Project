const mongoose = require('mongoose');

const walkSchema = new mongoose.Schema({
  userid: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  },
  marshall: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true
  },
  date: { 
    type: String, required: true
  },
  time: { 
    type: String 
  },
  availableTimes: [{ type: String }], // Stores available times per marshall for a date
  availableSlots: {
    type: Number,
    default: 4
  },
  status: { 
    type: String, 
    enum: ['available', 'scheduled'], 
    default: 'available' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Walk', walkSchema);