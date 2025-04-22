const express = require('express');
const router = express.Router();
const Walk = require('../models/walk'); // Import the Walk model
const User = require('../models/User');
const WalkLog = require('../models/walkLog'); // Import the WalkLog model
const UserWalk = require('../models/UserWalk'); // Import the UserWalk model
const { createSystemNotification } = require('../controllers/notificationController'); // Import notification controller


// Endpoint to add time for a walk
router.post('/add-time', async (req, res) => {
    try {
        const { marshall, date, time } = req.body;

        if (!marshall || !date || !time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Parse the date string (YYYY-MM-DD format)
        const [year, month, day] = date.split('-').map(Number);

        // Get current date in local timezone
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Create the selected date in local timezone
        // Month is 0-indexed in JavaScript Date
        const selectedDate = new Date(year, month - 1, day);

        // Compare dates (both in local timezone)
        if (selectedDate < today) {
            return res.status(400).json({ error: 'Cannot add time for past dates.' });
        }

        // If it's today, check if the time has already passed
        if (selectedDate.getTime() === today.getTime()) {
            // Get current time
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
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
    // Get all walks with available times, excluding past dates
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const availableTimes = await Walk.find({
        availableTimes: { $exists: true, $ne: [] },
        date: { $gte: today.toISOString().split('T')[0] }
    }).populate('marshall', 'firstName'); // Populate the firstName of the Marshall

        // For each walk, filter out any time slots that were ever fully booked
        const filteredAvailableTimes = [];

        for (const walk of availableTimes) {
            // Get all fully booked time slots for this marshall and date
            const fullyBookedSlots = await WalkLog.distinct('time', {
                marshallId: walk.marshall._id,
                date: walk.date,
                isTimeSlotFullyBooked: true
            });

            // Also check the walk's permanently removed time slots
            const permanentlyRemovedSlots = walk.permanentlyRemovedTimeSlots || [];

            // Combine both lists of unavailable slots
            const unavailableSlots = [...new Set([...fullyBookedSlots, ...permanentlyRemovedSlots])];

            // Update booking counts for each time slot
            if (walk.timeSlots && walk.timeSlots.length > 0) {
                for (const timeSlot of walk.timeSlots) {
                    // Count actual bookings for this time slot
                    const actualBookings = await UserWalk.countDocuments({
                        walkId: walk._id,
                        date: walk.date,
                        time: timeSlot.time,
                        status: 'scheduled'
                    });

                    // Update the booking count
                    if (timeSlot.bookedCount !== actualBookings) {
                        console.log(`Updating booking count for ${walk.date} at ${timeSlot.time} from ${timeSlot.bookedCount} to ${actualBookings}`);
                        timeSlot.bookedCount = actualBookings;
                        await walk.save();
                    }
                }
            }

            // Filter out fully booked and permanently removed time slots
            if (unavailableSlots.length > 0) {
                walk.availableTimes = walk.availableTimes.filter(time => !unavailableSlots.includes(time));

                // If there are still available times after filtering, add to result
                if (walk.availableTimes.length > 0) {
                    filteredAvailableTimes.push(walk);
                }
            } else {
                // Also check if any time slots are marked as permanently removed in the timeSlots array
                if (walk.timeSlots && walk.timeSlots.length > 0) {
                    const permanentlyRemovedTimes = walk.timeSlots
                        .filter(slot => slot.permanentlyRemoved)
                        .map(slot => slot.time);

                    if (permanentlyRemovedTimes.length > 0) {
                        walk.availableTimes = walk.availableTimes.filter(time => !permanentlyRemovedTimes.includes(time));
                    }

                    // Also filter out time slots that are fully booked
                    const fullyBookedTimes = walk.timeSlots
                        .filter(slot => slot.bookedCount >= slot.maxBookings)
                        .map(slot => slot.time);

                    if (fullyBookedTimes.length > 0) {
                        walk.availableTimes = walk.availableTimes.filter(time => !fullyBookedTimes.includes(time));
                    }
                }

                // Only add if there are still available times
                if (walk.availableTimes.length > 0) {
                    filteredAvailableTimes.push(walk);
                }
            }
        }
        console.log(filteredAvailableTimes);
        res.status(200).json(filteredAvailableTimes);
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
        // Use exact matching for date and time to avoid timezone issues
        const completedWalk = await WalkLog.findOne({
            userId: userId,
            date: walk.date,
            time: timeSlot,
            status: { $in: ['completed', 'incomplete'] } // Only check for explicitly completed or incomplete walks
        });

        if (completedWalk) {
            return res.status(400).json({
                error: "You have already completed a walk at this time slot. Please select a different time."
            });
        }

        // Check if the user already has a scheduled walk for this specific date and time
        const scheduledWalk = await UserWalk.findOne({
            userid: userId,
            date: walk.date,
            time: timeSlot,
            status: 'scheduled'
        });

        if (scheduledWalk) {
            return res.status(400).json({
                error: "You already have a scheduled walk at this time slot. Please select a different time."
            });
        }

        // Parse the date string (YYYY-MM-DD format)
        const [year, month, day] = walk.date.split('-').map(Number);

        // Get current date in local timezone
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Create the walk date in local timezone
        // Month is 0-indexed in JavaScript Date
        const walkDate = new Date(year, month - 1, day);

        // Compare dates (both in local timezone)
        if (walkDate < today) {
            return res.status(400).json({ error: "Cannot schedule walks for past dates." });
        }

        // If it's today, check if the time has already passed
        if (walkDate.getTime() === today.getTime()) {
            const [hours, minutes] = timeSlot.split(':').map(Number);

            // Create time values in minutes for easy comparison
            const currentTimeValue = (now.getHours() * 60) + now.getMinutes();
            const selectedTimeValue = (hours * 60) + minutes;

            if (selectedTimeValue < currentTimeValue) {
                return res.status(400).json({ error: "Cannot schedule walks for times that have already passed." });
            }
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

        // Count how many UserWalk records already exist for this time slot
        const existingBookings = await UserWalk.countDocuments({
            walkId: walk._id,
            date: walk.date,
            time: timeSlot,
            status: 'scheduled'
        });

        console.log(`Found ${existingBookings} existing bookings for ${walk.date} at ${timeSlot}`);

        // Set the booking count to match the actual number of bookings
        updatedTimeSlot.bookedCount = existingBookings;

        // Increment the booking count for the new booking
        updatedTimeSlot.bookedCount += 1;

        console.log(`Updated booking count for ${walk.date} at ${timeSlot} to ${updatedTimeSlot.bookedCount}/${updatedTimeSlot.maxBookings}`);

        // Create a new UserWalk record for this specific booking
        const userWalk = new UserWalk({
            userid: userId,
            marshall: walk.marshall,
            walkId: walk._id,
            date: walk.date,
            time: timeSlot,
            status: 'scheduled'
        });

        await userWalk.save();

        // Add the walk to the user's profile
        user.walks.push(userWalk._id);
        await user.save();

        // Add the walk to the marshall's profile too
        const marshall = await User.findById(walk.marshall);
        if (!marshall.walks.includes(userWalk._id)) {
            marshall.walks.push(userWalk._id);
            await marshall.save();
        }

        // If this time slot is now fully booked, permanently remove it from available times
        if (updatedTimeSlot.bookedCount >= updatedTimeSlot.maxBookings) {
            // Use the permanentlyRemoveTimeSlot method to ensure it's properly tracked
            walk.permanentlyRemoveTimeSlot(timeSlot);
            console.log(`Time slot ${timeSlot} on ${walk.date} has been permanently removed due to being fully booked`);
        } else {
            // Keep the time slot in available times until it's fully booked
            // This ensures it remains visible to other users who can still book it
            console.log(`Time slot ${timeSlot} on ${walk.date} has ${updatedTimeSlot.bookedCount}/${updatedTimeSlot.maxBookings} bookings - keeping available`);
        }

        // Save the walk with updated booking count and available times
        await walk.save();

        // If there are no more available times, update the status
        if (walk.availableTimes.length === 0) {
            walk.status = 'filled';
            await walk.save();
        }

        // Create notifications for both user and marshall
        // Get marshall's name for the notification
        const marshallData = await User.findById(walk.marshall, 'firstName lastName');
        const userNotificationContent = `You have scheduled a walk on ${walk.date} at ${timeSlot}.`;
        const marshallNotificationContent = `${user.firstName} ${user.lastName} has scheduled a walk with you on ${walk.date} at ${timeSlot}.`;

        // Send notification to user with email
        await createSystemNotification(
            userId,
            userNotificationContent,
            'walk',
            walk._id,
            'Walk',
            null,
            true, // Send email
            {
                action: 'scheduled',
                walk: { date: walk.date, time: timeSlot },
                marshall: marshallData
            }
        );

        // Send notification to marshall with email
        await createSystemNotification(
            walk.marshall,
            marshallNotificationContent,
            'walk',
            walk._id,
            'Walk',
            userId,
            true, // Send email
            {
                action: 'scheduled',
                walk: { date: walk.date, time: timeSlot },
                marshall: marshallData
            }
        );

        // Count how many UserWalk records exist for this time slot after booking
        const actualBookings = await UserWalk.countDocuments({
            walkId: walk._id,
            date: walk.date,
            time: timeSlot,
            status: 'scheduled'
        });

        // Update the booking count to match the actual number of bookings
        updatedTimeSlot.bookedCount = actualBookings;
        await walk.save();

        // Calculate the correct number of available slots
        const availableSlots = updatedTimeSlot.maxBookings - updatedTimeSlot.bookedCount;

        console.log(`Actual bookings for ${walk.date} at ${timeSlot}: ${actualBookings}`);
        console.log(`Available slots for ${walk.date} at ${timeSlot}: ${availableSlots}`);

        res.status(200).json({
            message: "Walk successfully scheduled",
            walk: userWalk,
            availableSlots: availableSlots
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

        // First check if this is a UserWalk record
        let userWalk = await UserWalk.findById(req.params.walkId);
        let walk;

        if (userWalk) {
            // This is a UserWalk record
            walk = await Walk.findById(userWalk.walkId);
            if (!walk) {
                // If the main Walk record doesn't exist, try to get user details directly
                const user = await User.findById(userWalk.userid, 'firstName lastName');
                userWalk.userid = user; // Populate the userid field manually
            }
        } else {
            // Try to find it as a regular Walk record (for backward compatibility)
            walk = await Walk.findById(req.params.walkId).populate('userid', 'firstName lastName');
        }

        if (!walk && !userWalk) return res.status(404).json({ error: "Walk not found" });

        // Use either the UserWalk or the Walk record for the rest of the function
        const walkRecord = userWalk || walk;

        // Check authorization based on the record type
        if (userWalk) {
            if (userWalk.userid.toString() !== userId && userWalk.marshall.toString() !== userId) {
                return res.status(403).json({ error: "Unauthorized to complete this walk" });
            }
        } else if (walk) {
            if (walk.userid.toString() !== userId && walk.marshall.toString() !== userId) {
                return res.status(403).json({ error: "Unauthorized to complete this walk" });
            }
        }

        // Check if this time slot was fully booked before allowing it to be added back
        let isSlotFullyBooked = false;
        if (walkRecord.date && walkRecord.time && walkRecord.marshall) {
            console.log(`Checking if time slot ${walkRecord.date} ${walkRecord.time} is fully booked`);

            // First check if this time slot was ever marked as fully booked in any walk log
            const fullyBookedLog = await WalkLog.findOne({
                marshallId: walkRecord.marshall,
                date: walkRecord.date,
                time: walkRecord.time,
                isTimeSlotFullyBooked: true
            });

            if (fullyBookedLog) {
                console.log(`Time slot ${walkRecord.date} ${walkRecord.time} was previously marked as fully booked`);
                isSlotFullyBooked = true;
            } else {
                // Check if the time slot is marked as permanently removed in the Walk model
                const originalWalk = await Walk.findOne({
                    marshall: walkRecord.marshall,
                    date: walkRecord.date,
                    status: { $in: ['available', 'filled'] }
                });

                if (originalWalk) {
                    // Check if the time slot is permanently removed
                    if (originalWalk.isTimeSlotPermanentlyRemoved(walkRecord.time)) {
                        console.log(`Time slot ${walkRecord.date} ${walkRecord.time} is marked as permanently removed`);
                        isSlotFullyBooked = true;
                    } else if (originalWalk.timeSlots && originalWalk.timeSlots.length > 0) {
                        const timeSlot = originalWalk.timeSlots.find(ts => ts.time === walkRecord.time);
                        if (timeSlot) {
                            console.log(`Current booking count for ${walkRecord.date} ${walkRecord.time}: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
                            if (timeSlot.bookedCount >= timeSlot.maxBookings) {
                                console.log(`Time slot ${walkRecord.date} ${walkRecord.time} is fully booked based on booking count`);
                                isSlotFullyBooked = true;

                                // Permanently remove the time slot since it's fully booked
                                originalWalk.permanentlyRemoveTimeSlot(walkRecord.time);
                                await originalWalk.save();
                                console.log(`Time slot ${walkRecord.time} on ${walkRecord.date} has been permanently removed due to being fully booked`);
                            }
                        }
                    }
                }

                // Also check if there are already 4 or more walk logs for this time slot
                const walkLogsCount = await WalkLog.countDocuments({
                    marshallId: walkRecord.marshall,
                    date: walkRecord.date,
                    time: walkRecord.time
                });

                console.log(`Walk logs count for ${walkRecord.date} ${walkRecord.time}: ${walkLogsCount}`);
                if (walkLogsCount >= 3) { // 3 existing logs + this new one = 4 total
                    console.log(`Time slot ${walkRecord.date} ${walkRecord.time} is fully booked based on walk logs count`);
                    isSlotFullyBooked = true;

                    // Also permanently remove the time slot in the Walk model
                    if (originalWalk && !originalWalk.isTimeSlotPermanentlyRemoved(walkRecord.time)) {
                        originalWalk.permanentlyRemoveTimeSlot(walkRecord.time);
                        await originalWalk.save();
                        console.log(`Time slot ${walkRecord.time} on ${walkRecord.date} has been permanently removed due to walk logs count`);
                    }
                }
            }

            console.log(`Final determination for ${walkRecord.date} ${walkRecord.time}: isSlotFullyBooked = ${isSlotFullyBooked}`);
        }

        // Create walk log entry
        const walkLog = new WalkLog({
            walkId: userWalk ? userWalk.walkId : walkRecord._id,
            userId: userWalk ? userWalk.userid : walkRecord.userid,
            marshallId: walkRecord.marshall,
            date: walkRecord.date,
            time: walkRecord.time,
            status: 'completed', // Set status to completed immediately
            isTimeSlotFullyBooked: isSlotFullyBooked // Track if the slot was fully booked
        });
        await walkLog.save();

        // Increment total walks for both the user and the marshall
        const userIdToUpdate = userWalk ? userWalk.userid : walkRecord.userid;
        await User.findByIdAndUpdate(userIdToUpdate, { $inc: { totalWalks: 1 }, $pull: { walks: req.params.walkId } });
        await User.findByIdAndUpdate(walkRecord.marshall, { $inc: { totalWalks: 1 }, $pull: { walks: req.params.walkId } });

        // Remove walk from administrators' profiles
        await User.updateMany({ role: 'admin' }, { $pull: { walks: req.params.walkId } });

        // Remove walk from appropriate collection
        if (userWalk) {
            await UserWalk.findByIdAndDelete(req.params.walkId);
        } else {
            await Walk.findByIdAndDelete(req.params.walkId);
        }

        // Create completion notifications
        const userData = await User.findById(userWalk ? userWalk.userid : walkRecord.userid, 'firstName lastName');
        const marshallData = await User.findById(walkRecord.marshall, 'firstName lastName');

        // Notification for user with email
        await createSystemNotification(
            userWalk ? userWalk.userid : walkRecord.userid,
            `Your walk on ${walkRecord.date} at ${walkRecord.time} has been marked as completed.`,
            'walk',
            walkLog._id,
            'WalkLog',
            null,
            true, // Send email
            {
                action: 'completed',
                walk: { date: walkRecord.date, time: walkRecord.time }
            }
        );

        // Notification for marshall with email
        await createSystemNotification(
            walkRecord.marshall,
            `The walk with ${userData.firstName} ${userData.lastName} on ${walkRecord.date} at ${walkRecord.time} has been marked as completed.`,
            'walk',
            walkLog._id,
            'WalkLog',
            null,
            true, // Send email
            {
                action: 'completed',
                walk: { date: walkRecord.date, time: walkRecord.time }
            }
        );

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

        // First check if this is a UserWalk record
        let userWalk = await UserWalk.findById(walkId);
        let walkToDelete;

        if (userWalk) {
            // This is a UserWalk record
            walkToDelete = await Walk.findById(userWalk.walkId);
            if (!walkToDelete) {
                // If the main Walk record doesn't exist, use the UserWalk record
                const user = await User.findById(userWalk.userid, 'firstName lastName');
                userWalk.userid = user; // Populate the userid field manually
                walkToDelete = userWalk;
            }
        } else {
            // Try to find it as a regular Walk record (for backward compatibility)
            walkToDelete = await Walk.findById(walkId).populate('userid', 'firstName lastName');
        }

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
            // First, check if this time slot was ever fully booked and completed
            // We need to check both the WalkLog and the Walk model
            const wasEverFullyBookedAndCompleted = await WalkLog.findOne({
                marshallId: walkToDelete.marshall,
                date: walkToDelete.date,
                time: walkToDelete.time,
                isTimeSlotFullyBooked: true,
                status: 'completed'
            });

            // Also check if the time slot is permanently removed in the Walk model
            const originalWalkCheck = await Walk.findOne({
                marshall: walkToDelete.marshall,
                date: walkToDelete.date
            });

            const isPermanentlyRemoved = originalWalkCheck &&
                originalWalkCheck.isTimeSlotPermanentlyRemoved(walkToDelete.time);

            // If the time slot was ever fully booked and completed or is permanently removed, don't reinstate it
            if (wasEverFullyBookedAndCompleted || isPermanentlyRemoved) {
                console.log(`Time slot ${walkToDelete.date} ${walkToDelete.time} was fully booked and completed or permanently removed. Not reinstating.`);
            } else {
                // Otherwise, proceed with normal cancellation logic
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
                            // Count how many UserWalk records still exist for this time slot
                            const remainingBookings = await UserWalk.countDocuments({
                                walkId: originalWalk._id,
                                date: walkToDelete.date,
                                time: walkToDelete.time,
                                status: 'scheduled'
                            });

                            console.log(`Found ${remainingBookings} remaining bookings for ${walkToDelete.date} at ${walkToDelete.time}`);

                            // Set the booking count to match the actual number of bookings
                            timeSlot.bookedCount = remainingBookings;

                            console.log(`Updated booking count for ${walkToDelete.date} ${walkToDelete.time} to ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);

                            // Check if this time slot was ever fully booked (reached 4 users)
                            const wasEverFullyBooked = timeSlot.bookedCount >= timeSlot.maxBookings;

                            // If the time was removed from available times because it was fully booked,
                            // add it back ONLY if it was never fully booked with completed walks
                            // Also check if the time slot is not permanently removed
                            if (!originalWalk.isTimeSlotPermanentlyRemoved(walkToDelete.time) &&
                                !originalWalk.availableTimes.includes(walkToDelete.time)) {
                                originalWalk.availableTimes.push(walkToDelete.time);
                                console.log(`Added time ${walkToDelete.time} back to available times`);

                                // Also make sure the permanentlyRemoved flag is set to false
                                if (timeSlot.permanentlyRemoved) {
                                    timeSlot.permanentlyRemoved = false;
                                    console.log(`Marked time slot ${walkToDelete.time} as not permanently removed`);
                                }
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
        }

        // Delete the walk from the appropriate collection
        if (userWalk) {
            await UserWalk.findByIdAndDelete(walkId);
        } else {
            await Walk.findByIdAndDelete(walkId);
        }

        // Create a more specific response for admin deletions
        const responseMessage = notifyUser
            ? `Walk canceled for ${walkToDelete.userid?.firstName} ${walkToDelete.userid?.lastName}`
            : "Walk card successfully removed from profile and deleted.";

        // Return the updated booking count and time slot information
        res.status(200).json({
            message: responseMessage,
            date: walkToDelete.date,
            time: walkToDelete.time,
            marshall: walkToDelete.marshall
        });
    } catch (error) {
        console.error("Error removing walk from profile:", error);
        res.status(500).json({ error: "Failed to remove walk from profile" });
    }
});

// Route to mark a walk as incomplete
router.post('/incomplete/:walkId', async (req, res) => {
    try {
        const { userId } = req.body;

        // First check if this is a UserWalk record
        let userWalk = await UserWalk.findById(req.params.walkId);
        let walk;

        if (userWalk) {
            // This is a UserWalk record
            walk = await Walk.findById(userWalk.walkId);
            if (!walk) {
                // If the main Walk record doesn't exist, try to get user details directly
                const user = await User.findById(userWalk.userid, 'firstName lastName');
                userWalk.userid = user; // Populate the userid field manually
            }
        } else {
            // Try to find it as a regular Walk record (for backward compatibility)
            walk = await Walk.findById(req.params.walkId).populate('userid', 'firstName lastName');
        }

        if (!walk && !userWalk) return res.status(404).json({ error: "Walk not found" });

        // Use either the UserWalk or the Walk record for the rest of the function
        const walkRecord = userWalk || walk;

        // Check authorization based on the record type
        if (userWalk) {
            if (userWalk.marshall.toString() !== userId) {
                return res.status(403).json({ error: "Unauthorized to mark this walk as incomplete" });
            }
        } else if (walk) {
            if (walk.marshall.toString() !== userId) {
                return res.status(403).json({ error: "Unauthorized to mark this walk as incomplete" });
            }
        }

        // Create walk log entry with status "incomplete"
        const walkLog = new WalkLog({
            walkId: userWalk ? userWalk.walkId : walkRecord._id,
            userId: userWalk ? userWalk.userid : walkRecord.userid,
            marshallId: walkRecord.marshall,
            date: walkRecord.date,
            time: walkRecord.time,
            dogs: ["N/A"],
            status: 'incomplete'
        });
        await walkLog.save();

        // Remove walk from both user and marshall
        const userIdToUpdate = userWalk ? userWalk.userid : walkRecord.userid;
        await User.findByIdAndUpdate(userIdToUpdate, { $pull: { walks: req.params.walkId } });
        await User.findByIdAndUpdate(walkRecord.marshall, { $pull: { walks: req.params.walkId } });

        // Remove from admins
        await User.updateMany({ role: 'admin' }, { $pull: { walks: req.params.walkId } });

        // Remove walk from appropriate collection
        if (userWalk) {
            await UserWalk.findByIdAndDelete(req.params.walkId);
        } else {
            await Walk.findByIdAndDelete(req.params.walkId);
        }

        // Create incomplete walk notifications
        const userData = await User.findById(userWalk ? userWalk.userid : walkRecord.userid, 'firstName lastName');
        const marshallData = await User.findById(walkRecord.marshall, 'firstName lastName');

        // Notification for user with email
        await createSystemNotification(
            userWalk ? userWalk.userid : walkRecord.userid,
            `Your walk on ${walkRecord.date} at ${walkRecord.time} has been marked as incomplete by the marshall.`,
            'walk',
            walkLog._id,
            'WalkLog',
            null,
            true, // Send email
            {
                action: 'canceled',
                walk: { date: walkRecord.date, time: walkRecord.time }
            }
        );

        // Notification for marshall with email
        await createSystemNotification(
            walkRecord.marshall,
            `You have marked the walk with ${userData.firstName} ${userData.lastName} on ${walkRecord.date} at ${walkRecord.time} as incomplete.`,
            'walk',
            walkLog._id,
            'WalkLog',
            null,
            true, // Send email
            {
                action: 'canceled',
                walk: { date: walkRecord.date, time: walkRecord.time }
            }
        );

        res.status(200).json({ message: "Walk marked as incomplete and removed from profiles", logId: walkLog._id });
    } catch (error) {
        console.error("Error marking walk as incomplete:", error);
        res.status(500).json({ error: "Failed to mark walk as incomplete" });
    }
});

// Route to get all walk logs
router.get('/logs', async (req, res) => {
    try {
        const walkLogs = await WalkLog.find()
            .populate('userId', 'firstName lastName')
            .populate('marshallId', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json(walkLogs);
    } catch (error) {
        console.error('Error fetching walk logs:', error);
        res.status(500).json({ error: 'Failed to fetch walk logs' });
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
      status: 'completed'
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

        // Check if this time slot was ever fully booked AND completed by looking at walk logs
        const wasEverFullyBookedAndCompleted = await WalkLog.findOne({
            marshallId,
            date,
            time,
            isTimeSlotFullyBooked: true,
            status: 'completed'
        });

        // Check if there's already a walk record for this marshall and date
        let walk = await Walk.findOne({ marshall: marshallId, date });

        // Check if the time slot is permanently removed
        const isPermanentlyRemoved = walk && walk.isTimeSlotPermanentlyRemoved(time);

        // If the time slot was ever fully booked AND completed (reached 4 users and walks were completed), don't restore it
        if (isTimeSlotFullyBooked || wasEverFullyBookedAndCompleted || isPermanentlyRemoved) {
            console.log(`Time slot ${date} ${time} was fully booked and completed or permanently removed. Not restoring.`);
            return res.status(200).json({
                message: 'Time slot was fully booked (4 users) and will remain unavailable',
                wasRestored: false
            });
        }

        console.log(`Restoring time slot ${date} ${time} - not fully booked or not completed.`);

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
            // Add the time to the existing walk's available times if it doesn't already exist and isn't permanently removed
            if (!walk.availableTimes.includes(time) && !walk.isTimeSlotPermanentlyRemoved(time)) {
                walk.availableTimes.push(time);

                // Find if this time slot already exists in the timeSlots array
                const existingTimeSlot = walk.timeSlots ?
                    walk.timeSlots.find(ts => ts.time === time) : null;

                if (existingTimeSlot) {
                    // Reset the booking count for this time slot and ensure it's not marked as permanently removed
                    existingTimeSlot.bookedCount = 0;
                    existingTimeSlot.permanentlyRemoved = false;
                } else {
                    // Initialize the timeSlots array if needed
                    if (!walk.timeSlots) {
                        walk.timeSlots = [];
                    }

                    // Add a new time slot entry
                    walk.timeSlots.push({
                        time,
                        bookedCount: 0,
                        maxBookings: 4,
                        permanentlyRemoved: false
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
    // Find all UserWalk records with status 'scheduled'
    const activeUserWalks = await UserWalk.find({
      status: 'scheduled'
    })
    .populate('userid', 'firstName lastName')
    .populate('marshall', 'firstName lastName')
    .populate('walkId')
    .sort({ date: 1, time: 1 }); // Sort by date and time

    // For backward compatibility, also find old Walk records with status 'scheduled'
    const activeWalks = await Walk.find({
      status: 'scheduled',
      userid: { $exists: true, $ne: null } // Only walks that have a user assigned
    })
    .populate('userid', 'firstName lastName')
    .populate('marshall', 'firstName lastName')
    .sort({ date: 1, time: 1 }); // Sort by date and time

    // Combine both results
    const allActiveWalks = [...activeUserWalks, ...activeWalks];

    // Sort the combined results by date and time
    allActiveWalks.sort((a, b) => {
      // First compare dates
      const dateComparison = new Date(a.date) - new Date(b.date);
      if (dateComparison !== 0) return dateComparison;

      // If dates are the same, compare times
      const [aHour, aMinute] = a.time.split(':').map(Number);
      const [bHour, bMinute] = b.time.split(':').map(Number);
      const aTimeValue = (aHour * 60) + aMinute;
      const bTimeValue = (bHour * 60) + bMinute;
      return aTimeValue - bTimeValue;
    });

    res.status(200).json(allActiveWalks);
  } catch (error) {
    console.error('Error fetching active walks:', error);
    res.status(500).json({ error: 'Failed to fetch active walks' });
  }
});

// Helper function to recalculate booking counts for a walk
async function recalculateBookingCounts(walkId) {
    try {
        const walk = await Walk.findById(walkId);
        if (!walk || !walk.timeSlots || walk.timeSlots.length === 0) {
            console.log(`No walk found with ID ${walkId} or no time slots`);
            return null;
        }

        console.log(`Recalculating booking counts for walk ${walkId} on ${walk.date}`);

        // For each time slot, count the actual number of bookings
        for (const timeSlot of walk.timeSlots) {
            const bookingCount = await UserWalk.countDocuments({
                walkId: walk._id,
                date: walk.date,
                time: timeSlot.time,
                status: 'scheduled'
            });

            // Update the booking count
            timeSlot.bookedCount = bookingCount;
            console.log(`Updated booking count for ${walk.date} at ${timeSlot.time} to ${bookingCount}/${timeSlot.maxBookings}`);

            // Check if this time slot should be in availableTimes
            if (bookingCount < timeSlot.maxBookings && !timeSlot.permanentlyRemoved) {
                // Add to availableTimes if not already there
                if (!walk.availableTimes.includes(timeSlot.time)) {
                    walk.availableTimes.push(timeSlot.time);
                    console.log(`Added time ${timeSlot.time} back to available times`);
                }
            } else if (bookingCount >= timeSlot.maxBookings) {
                // Remove from availableTimes if fully booked
                walk.availableTimes = walk.availableTimes.filter(t => t !== timeSlot.time);
                console.log(`Removed time ${timeSlot.time} from available times (fully booked)`);
            }
        }

        // Save the updated walk
        await walk.save();
        console.log(`Saved updated booking counts for walk ${walkId}`);

        return walk;
    } catch (error) {
        console.error(`Error recalculating booking counts for walk ${walkId}:`, error);
        return null;
    }
}

// Route to recalculate booking counts for all walks
router.post('/recalculate-booking-counts', async (req, res) => {
    try {
        // Get all walks with time slots
        const walks = await Walk.find({ timeSlots: { $exists: true, $ne: [] } });
        console.log(`Found ${walks.length} walks with time slots`);

        // Recalculate booking counts for each walk
        const results = [];
        for (const walk of walks) {
            const updatedWalk = await recalculateBookingCounts(walk._id);
            if (updatedWalk) {
                results.push({
                    walkId: updatedWalk._id,
                    date: updatedWalk.date,
                    timeSlots: updatedWalk.timeSlots.map(ts => ({
                        time: ts.time,
                        bookedCount: ts.bookedCount,
                        maxBookings: ts.maxBookings
                    }))
                });
            }
        }

        res.status(200).json({
            message: `Recalculated booking counts for ${results.length} walks`,
            results
        });
    } catch (error) {
        console.error('Error recalculating booking counts:', error);
        res.status(500).json({ error: 'Failed to recalculate booking counts' });
    }
});

module.exports = router;