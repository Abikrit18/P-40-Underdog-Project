const mongoose = require('mongoose');

const ShelterTimeSchema = new mongoose.Schema({
  date: { 
    type: String, 
    required: true,
    unique: true // Each date can only have one shelter time entry
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ShelterTime', ShelterTimeSchema);