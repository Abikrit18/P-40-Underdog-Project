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
  isDefault: {
    type: Boolean,
    default: false // Indicates if this is a default shelter time
  },
  dayOfWeek: {
    type: Number, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    required: function() { return this.isDefault; } // Only required for default times
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isClosed: {
    type: Boolean,
    default: false // Indicates if the shelter is closed on this date
  }
});

// Static method to get default hours for a specific day of week
ShelterTimeSchema.statics.getDefaultHoursForDay = async function(dayOfWeek) {
  return await this.findOne({ isDefault: true, dayOfWeek: dayOfWeek });
};

// Static method to get or create shelter hours for a specific date
ShelterTimeSchema.statics.getOrCreateForDate = async function(date) {
  // First, check if we already have a specific entry for this date
  let shelterTime = await this.findOne({ date: date });

  if (shelterTime) {
    return shelterTime;
  }

  // If not, determine the day of week for this date
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

  // Get the default hours for this day of week
  const defaultHours = await this.findOne({ isDefault: true, dayOfWeek: dayOfWeek });

  if (!defaultHours) {
    // No default hours for this day, return null or a closed shelter time
    return null;
  }

  // Create a new shelter time entry based on the default hours
  shelterTime = new this({
    date: date,
    startTime: defaultHours.startTime,
    endTime: defaultHours.endTime,
    isDefault: false, // This is a specific date entry, not a default
    dayOfWeek: dayOfWeek,
    isClosed: defaultHours.isClosed
  });

  // Save the new entry
  await shelterTime.save();

  return shelterTime;
};

module.exports = mongoose.model('ShelterTime', ShelterTimeSchema);