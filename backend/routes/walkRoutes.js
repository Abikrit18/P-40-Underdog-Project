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

        // Convert date to start of the day for consistent comparison
        const selectedDate = new Date(date).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);

        // Check if the date is in the past
        if (selectedDate < today) {
            return res.status(400).json({ error: 'Cannot add time for past dates.' });
        }

        let walk = await Walk.findOne({ marshall, date });

        if (!walk) {
            walk = new Walk({ marshall, date, availableTimes: [time], availableSlots: 4 });
        } else {
            if (!walk.availableTimes.includes(time)) {
                walk.availableTimes.push(time);
            }
        }
        walk.status = 'available';

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

        const walk = await Walk.findById(walkId);
        if (!walk || !walk.availableTimes.includes(timeSlot)) {
            return res.status(400).json({ error: "Time slot does not exist for this walk" });
        }

        if (walk.userid) {
            return res.status(400).json({ error: "This walk has already been selected by another user." });
        }

        walk.userid = userId;
        walk.time = timeSlot;
        walk.status = 'scheduled';
        walk.availableTimes = [];
        await walk.save();

        const user = await User.findById(userId);
        user.walks.push(walkId);
        await user.save();

        const marshall = await User.findById(walk.marshall);
        if (!marshall.walks.includes(walkId)) {
            marshall.walks.push(walkId);
            await marshall.save();
        }

        res.status(200).json({ message: "Walk successfully selected and hidden from user profiles", walk });
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

        // Create walk log entry
        const walkLog = new WalkLog({
            walkId: walk._id,
            userId: walk.userid,
            marshallId: walk.marshall,
            date: walk.date,
            time: walk.time,
            status: 'pending'
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
            logId: walkLog._id 
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
// Route to remove walk reference from user's profile without deleting the main walk card
router.delete('/delete/:walkId', async (req, res) => {
    try {
        const { walkId } = req.params;
        const { userId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove the walk reference from the user's profile using $pull operator
        await User.findByIdAndUpdate(userId, { $pull: { walks: walkId } });

        // Delete the walk card from the Walk collection
        await Walk.findByIdAndDelete(walkId);

        res.status(200).json({ message: "Walk card successfully removed from profile and deleted." });
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

// Add these endpoints to support date filtering

// Route to get logs with date filtering
router.get('/logs/filter', async (req, res) => {
  try {
    const { days, userId, role } = req.query;
    
    let query = {};
    
    // Apply date filter if specified
    if (days) {
      const compareDate = new Date();
      compareDate.setDate(compareDate.getDate() - parseInt(days));
      
      // Convert to same format as stored in database
      const formattedDate = compareDate.toISOString().split('T')[0];
      
      // This assumes date is stored in format YYYY-MM-DD
      query.date = { $gte: formattedDate };
    }
    
    // Apply user filter for marshall
    if (role === 'Marshall' && userId) {
      query.marshallId = userId;
    }
    
    const walkLogs = await WalkLog.find(query)
      .populate('userId', 'firstName lastName')
      .populate('marshallId', 'firstName lastName')
      .sort({ date: -1 });
    
    res.status(200).json(walkLogs);
  } catch (error) {
    console.error('Error fetching filtered walk logs:', error);
    res.status(500).json({ error: 'Failed to fetch walk logs' });
  }
});

module.exports = router;