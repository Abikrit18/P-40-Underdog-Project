const express = require('express');
const router = express.Router();
const Walk = require('../models/walk'); // Import the Walk model
const User = require('../models/User');
const WalkLog = require('../models/walkLog'); // Import the WalkLog model


// Endpoint to add time for a walk
router.post('/add-time', async (req, res) => {
    try {
        const { marshall, date, time } = req.body;

        if (!marshall || !date || !time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Get the current date in yyyy-mm-dd format to match the incoming date format
        const nowDate = new Date();
        const todayFormatted = nowDate.toISOString().split('T')[0];
        
        // Check if the date is in the past
        if (date < todayFormatted) {
            return res.status(400).json({ error: 'Cannot add time for past dates.' });
        }

        // If it's today, check if the time has already passed
        if (date === todayFormatted) {
            const currentHour = nowDate.getHours();
            const currentMinute = nowDate.getMinutes();
            const [selectedHour, selectedMinute] = time.split(':').map(Number);
            
            // Create time values in minutes for easy comparison
            const currentTimeValue = (currentHour * 60) + currentMinute;
            const selectedTimeValue = (selectedHour * 60) + selectedMinute;
            
            // Add a 5-minute buffer to allow for scheduling near the current time
            if (selectedTimeValue <= currentTimeValue + 5) {
                return res.status(400).json({ 
                    error: 'Cannot add time slots that have already passed or are too close to the current time.'
                });
            }
        }
        
        let walk = await Walk.findOne({ marshall, date });

        if (!walk) {
            // Create a new walk record with the time slot and initialize booking count
            walk = new Walk({ 
                marshall, 
                date, 
                availableTimes: [time],
                timeSlots: [{ time, bookedCount: 0, maxBookings: 4 }],
                status: 'available'
            });
        } else {
            // Check if this time slot already exists
            if (!walk.availableTimes.includes(time)) {
                walk.availableTimes.push(time);
                
                // Add to timeSlots tracking array
                if (!walk.timeSlots) {
                    walk.timeSlots = [];
                }
                
                walk.timeSlots.push({ 
                    time, 
                    bookedCount: 0,
                    maxBookings: 4
                });
            }
        }

        await walk.save();

        res.status(201).json({ message: 'Time added successfully', walk });
    } catch (error) {
        console.error('Error adding time:', error);
        res.status(500).json({ error: 'Failed to add time' });
    }
});
// Endpoint to get all available times with Marshall details
router.get('/available-times', async (req, res) => {
    try {
        const availableTimes = await Walk.find({ availableTimes: { $exists: true, $ne: [] } })
            .populate('marshall', 'firstName'); // Populate the firstName of the Marshall

        res.status(200).json(availableTimes);
    } catch (error) {
        console.error("Error fetching available times:", error);
        res.status(500).json({ error: "Failed to fetch available times" });
    }
});

// Route to update a specific time for a walk
router.put('/update-time/:walkId', async (req, res) => {
    try {
        const { walkId } = req.params;
        const { oldTime, newTime } = req.body;

        const walk = await Walk.findById(walkId);
        if (!walk) {
            return res.status(404).json({ error: "Walk not found" });
        }

        const timeIndex = walk.availableTimes.indexOf(oldTime);
        if (timeIndex === -1) {
            return res.status(404).json({ error: "Time slot not found" });
        }

        walk.availableTimes[timeIndex] = newTime;
        await walk.save();

        res.status(200).json({ message: "Time updated successfully", walk });
    } catch (error) {
        console.error("Error updating time:", error);
        res.status(500).json({ error: "Failed to update time" });
    }
});

// Route to select a walk
router.post('/select-walk/:walkId', async (req, res) => {
    try {
        const { walkId } = req.params;
        const { userId, timeSlot } = req.body;
        
        // Check if the user already has any active scheduled walks
        const user = await User.findById(userId).populate('walks');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // If user has any active scheduled walks, prevent them from scheduling another
        if (user.walks && user.walks.length > 0) {
            const activeWalks = user.walks.filter(walk => walk.status === 'scheduled');
            if (activeWalks.length > 0) {
                return res.status(400).json({ 
                    error: "You already have an active scheduled walk. Please complete your current walk before scheduling another one." 
                });
            }
        }
        
        // Find the walk record
        const walk = await Walk.findById(walkId);
        if (!walk) {
            return res.status(404).json({ error: "Walk not found" });
        }
        
        // Check if the user has already completed a walk for this specific date and time
        const completedWalk = await WalkLog.findOne({
            userId: userId,
            date: walk.date,
            time: timeSlot,
            status: { $in: ['pending', 'completed'] } // Check for both pending and completed walks
        });
        
        if (completedWalk) {
            return res.status(400).json({ 
                error: "You have already completed a walk at this time slot. Please select a different time." 
            });
        }
        
        // Check if the requested time slot exists
        if (!walk.availableTimes.includes(timeSlot)) {
            return res.status(400).json({ error: "Time slot does not exist for this walk" });
        }
        
        // Find the time slot in the timeSlots array
        const timeSlotInfo = walk.timeSlots ? 
            walk.timeSlots.find(ts => ts.time === timeSlot) : null;
        
        // Initialize timeSlots array if it doesn't exist
        if (!walk.timeSlots) {
            walk.timeSlots = [];
        }
        
        // If we don't have this time slot in the tracking array, add it
        if (!timeSlotInfo) {
            walk.timeSlots.push({
                time: timeSlot,
                bookedCount: 0,
                maxBookings: 4
            });
        }
        
        // Get the updated time slot info
        const updatedTimeSlot = walk.timeSlots.find(ts => ts.time === timeSlot);
        
        // Check if this time slot is already fully booked
        if (updatedTimeSlot.bookedCount >= updatedTimeSlot.maxBookings) {
            return res.status(400).json({ error: "This time slot is already fully booked" });
        }
        
        // Increment the booking count
        updatedTimeSlot.bookedCount += 1;
        
        // Create a new walk record for this specific booking
        const bookedWalk = new Walk({
            userid: userId,
            marshall: walk.marshall,
            date: walk.date,
            time: timeSlot,
            status: 'scheduled'
        });
        
        await bookedWalk.save();
        
        // Add the walk to the user's profile
        user.walks.push(bookedWalk._id);
        await user.save();
        
        // Add the walk to the marshall's profile too
        const marshall = await User.findById(walk.marshall);
        if (!marshall.walks.includes(bookedWalk._id)) {
            marshall.walks.push(bookedWalk._id);
            await marshall.save();
        }
        
        // If this time slot is now fully booked, remove it from available times
        if (updatedTimeSlot.bookedCount >= updatedTimeSlot.maxBookings) {
            walk.availableTimes = walk.availableTimes.filter(t => t !== timeSlot);
        }
        
        // Save the walk with updated booking count and available times
        await walk.save();
        
        // If there are no more available times, update the status
        if (walk.availableTimes.length === 0) {
            walk.status = 'filled';
            await walk.save();
        }
        
        res.status(200).json({ 
            message: "Walk successfully scheduled", 
            walk: bookedWalk,
            availableSlots: updatedTimeSlot.maxBookings - updatedTimeSlot.bookedCount
        });
    } catch (error) {
        console.error("Error selecting walk:", error);
        res.status(500).json({ error: "Failed to select walk" });
    }
});

// Route to complete a walk - remove notes references
router.post('/complete/:walkId', async (req, res) => {
    try {
        const { userId } = req.body;
        const walk = await Walk.findById(req.params.walkId).populate('userid', 'firstName lastName');
        if (!walk) return res.status(404).json({ error: "Walk not found" });

        if (walk.userid.toString() !== userId && walk.marshall.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized to complete this walk" });
        }

        // Check if this time slot was fully booked before allowing it to be added back
        let isSlotFullyBooked = false;
        if (walk.date && walk.time && walk.marshall) {
            const originalWalk = await Walk.findOne({ 
                marshall: walk.marshall,
                date: walk.date,
                status: { $in: ['available', 'filled'] }
            });
            
            if (originalWalk && originalWalk.timeSlots && originalWalk.timeSlots.length > 0) {
                const timeSlot = originalWalk.timeSlots.find(ts => ts.time === walk.time);
                if (timeSlot && timeSlot.bookedCount >= 4) {
                    isSlotFullyBooked = true;
                }
            }
        }

        // Create walk log entry
        const walkLog = new WalkLog({
            walkId: walk._id,
            userId: walk.userid,
            marshallId: walk.marshall,
            date: walk.date,
            time: walk.time,
            status: 'pending',
            isTimeSlotFullyBooked: isSlotFullyBooked // Track if the slot was fully booked
        });
        await walkLog.save();

        // Increment total walks for both the user and the marshall
        await User.findByIdAndUpdate(walk.userid, { $inc: { totalWalks: 1 }, $pull: { walks: req.params.walkId } });
        await User.findByIdAndUpdate(walk.marshall, { $inc: { totalWalks: 1 }, $pull: { walks: req.params.walkId } });

        // Remove walk from administrators' profiles
        await User.updateMany({ role: 'admin' }, { $pull: { walks: req.params.walkId } });

        // Remove walk from Walk collection
        await Walk.findByIdAndDelete(req.params.walkId);

        res.status(200).json({ 
            message: "Walk marked as completed and log created",
            logId: walkLog._id,
            isTimeSlotFullyBooked: isSlotFullyBooked
        });
    } catch (error) {
        console.error("Error completing walk:", error);
        res.status(500).json({ error: "Failed to complete walk" });
    }
});
router.delete('/delete-time/:walkId', async (req, res) => {
    try {
        const { walkId } = req.params;
        const { time } = req.body;

        const walk = await Walk.findById(walkId);
        if (!walk) {
            return res.status(404).json({ error: "Walk not found" });
        }

        walk.availableTimes = walk.availableTimes.filter(t => t !== time);
        await walk.save();

        res.status(200).json({ message: "Time deleted successfully", walk });
    } catch (error) {
        console.error("Error deleting time:", error);
        res.status(500).json({ error: "Failed to delete time" });
    }
});

// Route to delete a scheduled walk
router.delete('/delete/:walkId', async (req, res) => {
    try {
        const { walkId } = req.params;
        const { userId, notifyUser, affectedUsers } = req.body;
        
        // First, get the walk details before deletion to use for updating booking count
        const walkToDelete = await Walk.findById(walkId).populate('userid', 'firstName lastName');
        if (!walkToDelete) {
            return res.status(404).json({ error: "Walk not found" });
        }
        
        // Get the user who initiated the deletion
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        
        // Admin deletion case - ensure we handle it properly
        if (notifyUser && affectedUsers && walkToDelete.userid) {
            // Remove the walk from the affected user's profile
            await User.findByIdAndUpdate(walkToDelete.userid, { $pull: { walks: walkId } });
            
            // Remove from marshall's profile too
            if (walkToDelete.marshall) {
                await User.findByIdAndUpdate(walkToDelete.marshall, { $pull: { walks: walkId } });
            }
        } else {
            // Regular deletion - initiated by the walk owner
            // Remove the walk reference from the user's profile using $pull operator
            await User.findByIdAndUpdate(userId, { $pull: { walks: walkId } });
            
            // If this is a marshall, remove from their profile as well
            if (walkToDelete.marshall && walkToDelete.marshall.toString() !== userId) {
                await User.findByIdAndUpdate(walkToDelete.marshall, { $pull: { walks: walkId } });
            }
        }
        
        // Find the original walk card with available times and decrement booking count
        if (walkToDelete.date && walkToDelete.time && walkToDelete.marshall) {
            const originalWalk = await Walk.findOne({ 
                marshall: walkToDelete.marshall,
                date: walkToDelete.date,
                status: { $in: ['available', 'filled'] }
            });
            
            if (originalWalk) {
                // Find the time slot and decrement booking count
                if (originalWalk.timeSlots && originalWalk.timeSlots.length > 0) {
                    const timeSlot = originalWalk.timeSlots.find(ts => ts.time === walkToDelete.time);
                    
                    if (timeSlot) {
                        // Decrement booking count and make sure it doesn't go below 0
                        timeSlot.bookedCount = Math.max(0, timeSlot.bookedCount - 1);
                        
                        // If the time was removed from available times because it was fully booked,
                        // add it back if it's no longer fully booked
                        if (timeSlot.bookedCount < timeSlot.maxBookings && 
                            !originalWalk.availableTimes.includes(walkToDelete.time)) {
                            originalWalk.availableTimes.push(walkToDelete.time);
                        }
                        
                        // Update status if needed
                        if (originalWalk.status === 'filled' && originalWalk.availableTimes.length > 0) {
                            originalWalk.status = 'available';
                        }
                        
                        // Save the updated walk with decremented booking count
                        await originalWalk.save();
                    }
                }
            }
        }
        
        // Delete the walk card from the Walk collection
        await Walk.findByIdAndDelete(walkId);
        
        // Create a more specific response for admin deletions
        const responseMessage = notifyUser 
            ? `Walk canceled for ${walkToDelete.userid?.firstName} ${walkToDelete.userid?.lastName}` 
            : "Walk card successfully removed from profile and deleted.";
            
        res.status(200).json({ message: responseMessage });
    } catch (error) {
        console.error("Error removing walk from profile:", error);
        res.status(500).json({ error: "Failed to remove walk from profile" });
    }
});

// Route to mark a walk as incomplete
router.post('/incomplete/:walkId', async (req, res) => {
    try {
        const { userId } = req.body;
        const walk = await Walk.findById(req.params.walkId).populate('userid', 'firstName lastName');
        if (!walk) return res.status(404).json({ error: "Walk not found" });

        if (walk.marshall.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized to mark this walk as incomplete" });
        }

        // Create walk log entry with status "incomplete"
        const walkLog = new WalkLog({
            walkId: walk._id,
            userId: walk.userid,
            marshallId: walk.marshall,
            date: walk.date,
            time: walk.time,
            dogs: ["N/A"],
            status: 'incomplete'
        });
        await walkLog.save();

        // Remove walk from both user and marshall
        await User.findByIdAndUpdate(walk.userid, { $pull: { walks: req.params.walkId } });
        await User.findByIdAndUpdate(walk.marshall, { $pull: { walks: req.params.walkId } });

        // Remove from admins
        await User.updateMany({ role: 'admin' }, { $pull: { walks: req.params.walkId } });

        // Remove walk from Walk collection
        await Walk.findByIdAndDelete(req.params.walkId);

        res.status(200).json({ message: "Walk marked as incomplete and removed from profiles", logId: walkLog._id });
    } catch (error) {
        console.error("Error marking walk as incomplete:", error);
        res.status(500).json({ error: "Failed to mark walk as incomplete" });
    }
});

// Route to create a walk log entry
router.post('/logs', async (req, res) => {
  try {
    const { walkId, userId, marshallId, date, time, dogs } = req.body;

    const walkLog = new WalkLog({
      walkId,
      userId,
      marshallId,
      date,
      time,
      dogs,
      status: 'pending'
    });

    await walkLog.save();
    res.status(201).json({ message: 'Walk log created successfully', walkLog });
  } catch (error) {
    console.error('Error creating walk log:', error);
    res.status(500).json({ error: 'Failed to create walk log' });
  }
});

// Route to get all walk logs
router.get('/logs', async (req, res) => {
  try {
    const walkLogs = await WalkLog.find()
      .populate('userId', 'firstName lastName')
      .populate('marshallId', 'firstName lastName')
      .sort({ date: -1 });
    
    res.status(200).json(walkLogs);
  } catch (error) {
    console.error('Error fetching walk logs:', error);
    res.status(500).json({ error: 'Failed to fetch walk logs' });
  }
});

// Route to get logs by marshall ID
router.get('/logs/marshall/:marshallId', async (req, res) => {
  try {
    const walkLogs = await WalkLog.find({ marshallId: req.params.marshallId })
      .populate('userId', 'firstName lastName')
      .populate('marshallId', 'firstName lastName')
      .sort({ date: -1 });
    
    res.status(200).json(walkLogs);
  } catch (error) {
    console.error('Error fetching marshall walk logs:', error);
    res.status(500).json({ error: 'Failed to fetch walk logs' });
  }
});

// Route to update a walk log
router.put('/logs/:logId', async (req, res) => {
  try {
    const { dogs, status } = req.body;
    
    const walkLog = await WalkLog.findById(req.params.logId);
    if (!walkLog) {
      return res.status(404).json({ error: 'Walk log not found' });
    }

    if (dogs) walkLog.dogs = dogs;
    if (status) walkLog.status = status;

    await walkLog.save();
    res.status(200).json({ message: 'Walk log updated successfully', walkLog });
  } catch (error) {
    console.error('Error updating walk log:', error);
    res.status(500).json({ error: 'Failed to update walk log' });
  }
});

// Route to add an available time after a walk is completed
router.post('/restore-available-time', async (req, res) => {
    try {
        const { marshallId, date, time, isTimeSlotFullyBooked } = req.body;

        if (!marshallId || !date || !time) {
            return res.status(400).json({ error: 'Marshall ID, date, and time are required' });
        }

        // If the time slot was fully booked (reached 4 users), don't restore it
        if (isTimeSlotFullyBooked) {
            return res.status(200).json({ 
                message: 'Time slot was fully booked (4 users) and will remain unavailable',
                wasRestored: false
            });
        }

        // Check if there's already a walk record for this marshall and date
        let walk = await Walk.findOne({ marshall: marshallId, date });

        if (!walk) {
            // Create a new walk record if one doesn't exist
            walk = new Walk({ 
                marshall: marshallId, 
                date, 
                availableTimes: [time],
                timeSlots: [{ time, bookedCount: 0, maxBookings: 4 }],
                status: 'available'
            });
        } else {
            // Add the time to the existing walk's available times if it doesn't already exist
            if (!walk.availableTimes.includes(time)) {
                walk.availableTimes.push(time);
                
                // Find if this time slot already exists in the timeSlots array
                const existingTimeSlot = walk.timeSlots ? 
                    walk.timeSlots.find(ts => ts.time === time) : null;
                
                if (existingTimeSlot) {
                    // Reset the booking count for this time slot
                    existingTimeSlot.bookedCount = 0;
                } else {
                    // Initialize the timeSlots array if needed
                    if (!walk.timeSlots) {
                        walk.timeSlots = [];
                    }
                    
                    // Add a new time slot entry
                    walk.timeSlots.push({
                        time,
                        bookedCount: 0,
                        maxBookings: 4
                    });
                }
            }
            
            // Update the walk status if it was previously filled
            if (walk.status === 'filled' && walk.availableTimes.length > 0) {
                walk.status = 'available';
            }
        }

        await walk.save();

        res.status(201).json({ 
            message: 'Time slot restored successfully', 
            walk,
            wasRestored: true
        });
    } catch (error) {
        console.error('Error restoring available time:', error);
        res.status(500).json({ error: 'Failed to restore available time' });
    }
});

// Route to get all active scheduled walks (for admin view)
router.get('/active', async (req, res) => {
  try {
    // Find all walks with status 'scheduled' that have both userid and marshall populated
    const activeWalks = await Walk.find({ 
      status: 'scheduled',
      userid: { $exists: true, $ne: null } // Only walks that have a user assigned
    })
    .populate('userid', 'firstName lastName')
    .populate('marshall', 'firstName lastName')
    .sort({ date: 1, time: 1 }); // Sort by date and time
    
    res.status(200).json(activeWalks);
  } catch (error) {
    console.error('Error fetching active walks:', error);
    res.status(500).json({ error: 'Failed to fetch active walks' });
  }
});

module.exports = router;