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
  timeSlots: [{
    time: String,
    bookedCount: { type: Number, default: 0 },
    maxBookings: { type: Number, default: 4 },
    permanentlyRemoved: { type: Boolean, default: false } // Track if a slot has been permanently removed
  }],
  status: {
    type: String,
    enum: ['available', 'scheduled', 'filled'],
    default: 'available'
  },
  // Track permanently removed time slots to ensure they don't get re-added
  permanentlyRemovedTimeSlots: [{ type: String }]
}, { timestamps: true });

// Method to check if a time slot is permanently removed
walkSchema.methods.isTimeSlotPermanentlyRemoved = function(timeSlot) {
  // Check in the permanentlyRemovedTimeSlots array
  if (this.permanentlyRemovedTimeSlots && this.permanentlyRemovedTimeSlots.includes(timeSlot)) {
    return true;
  }

  // Also check in the timeSlots array
  if (this.timeSlots && this.timeSlots.length > 0) {
    const slot = this.timeSlots.find(ts => ts.time === timeSlot);
    return slot && slot.permanentlyRemoved;
  }

  return false;
};

// Method to permanently remove a time slot
walkSchema.methods.permanentlyRemoveTimeSlot = function(timeSlot) {
  // Add to the permanently removed list if not already there
  if (!this.permanentlyRemovedTimeSlots) {
    this.permanentlyRemovedTimeSlots = [];
  }

  if (!this.permanentlyRemovedTimeSlots.includes(timeSlot)) {
    this.permanentlyRemovedTimeSlots.push(timeSlot);
  }

  // Remove from available times
  this.availableTimes = this.availableTimes.filter(t => t !== timeSlot);

  // Mark as permanently removed in the timeSlots array
  if (this.timeSlots && this.timeSlots.length > 0) {
    const slot = this.timeSlots.find(ts => ts.time === timeSlot);
    if (slot) {
      slot.permanentlyRemoved = true;
    }
  }

  return this;
};

// Method to restore a time slot when a user cancels a walk
walkSchema.methods.restoreTimeSlot = function(timeSlot) {
  // Remove from the permanently removed list if it exists there
  if (this.permanentlyRemovedTimeSlots && this.permanentlyRemovedTimeSlots.includes(timeSlot)) {
    this.permanentlyRemovedTimeSlots = this.permanentlyRemovedTimeSlots.filter(t => t !== timeSlot);
  }

  // Add back to available times if not already there
  if (!this.availableTimes.includes(timeSlot)) {
    this.availableTimes.push(timeSlot);
  }

  // Mark as not permanently removed in the timeSlots array
  if (this.timeSlots && this.timeSlots.length > 0) {
    const slot = this.timeSlots.find(ts => ts.time === timeSlot);
    if (slot) {
      slot.permanentlyRemoved = false;
    }
  }

  return this;
};

module.exports = mongoose.model('Walk', walkSchema);