const express = require('express');
const router = express.Router();
const Walk = require('../models/walk'); // Import the Walk model
const User = require('../models/User');
// POST request to schedule a walk
router.post('/', async (req, res) => {
    try {
        const { userid, marshall, date, time } = req.body;

        if (!userid || !marshall || !date || !time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Ensure user and marshall exist before scheduling the walk
        const user = await User.findById(userid);
        const assignedMarshall = await User.findById(marshall);

        if (!user || !assignedMarshall) {
            return res.status(404).json({ error: 'User or Marshall not found' });
        }

        // Remove the selected time slot from available times for that Marshall
        await Walk.updateOne(
            { marshall, date },
            { $pull: { availableTimes: time } }
        );

        // Create and save the scheduled walk
        const newWalk = new Walk({ userid, marshall, date, time });
        const savedWalk = await newWalk.save();

        // Add scheduled walk to both User and Marshall
        await User.findByIdAndUpdate(userid, { $push: { walks: savedWalk._id } });
        await User.findByIdAndUpdate(marshall, { $push: { walks: savedWalk._id } });

        res.status(201).json({ message: 'Walk scheduled successfully', walk: savedWalk });
    } catch (error) {
        console.error('Error scheduling walk:', error);
        res.status(500).json({ error: 'Failed to schedule walk' });
    }
});

router.post('/complete/:walkId', async (req, res) => {
    try {
        const { userId } = req.body;
        const walk = await Walk.findById(req.params.walkId);
        if (!walk) return res.status(404).json({ error: "Walk not found" });

        // Check if the user completing the walk is either the scheduled user or the Marshall
        if (walk.userid.toString() !== userId && walk.marshall.toString() !== userId) {
            return res.status(403).json({ error: "Unauthorized to complete this walk" });
        }

        // Increment total walks for both user and Marshall
        await User.findByIdAndUpdate(walk.userid, { $inc: { totalWalks: 1 } });
        await User.findByIdAndUpdate(walk.marshall, { $inc: { totalWalks: 1 } });

        // Remove walk from user's scheduled walks
        await User.findByIdAndUpdate(walk.userid, { $pull: { walks: req.params.walkId } });

        // Remove walk from Marshall's assigned walks
        await User.findByIdAndUpdate(walk.marshall, { $pull: { walks: req.params.walkId } });

        // Delete the walk record
        await Walk.findByIdAndDelete(req.params.walkId);

        res.status(200).json({ message: "Walk marked as completed" });
    } catch (error) {
        console.error("Error completing walk:", error);
        res.status(500).json({ error: "Failed to complete walk" });
    }
});
router.post("/add-time", async (req, res) => {
    try {
        const { marshall, date, time } = req.body;

        //console.log("Received request to add time:", { marshall, date, time });

        if (!marshall || !date || !time) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Find the walk document where the marshall has added available times
        let walk = await Walk.findOne({ marshall, date });

        if (walk) {
            if (walk.availableTimes && walk.availableTimes.includes(time)) {
                return res.status(400).json({ error: "This time slot already exists." });
            }
            walk.availableTimes.push(time);
        } else {
            walk = new Walk({ marshall, date, availableTimes: [time] });
        }

        await walk.save();

        res.status(201).json({ message: "Time slot added successfully", walk });
    } catch (error) {
        console.error("Error adding time slot:", error);
        res.status(500).json({ error: "Failed to add time slot." });
    }
});
// GET request to retrieve all scheduled walks
router.get('/', async (req, res) => {
    try {
        const walks = await Walk.find();
        res.json(walks);
    } catch (error) {
        console.error('Error fetching walks:', error);
        res.status(500).json({ error: 'Failed to fetch walks' });
    }
});
// Get available time slots for a specific marshall on a selected date
router.get("/available-times/:marshall/:date", async (req, res) => {
    try {
        const { marshall, date } = req.params;

        const walk = await Walk.findOne({ marshall, date });

        if (!walk) {
            return res.json([]);
        }

        res.json(walk.availableTimes);
    } catch (error) {
        console.error("Error fetching time slots:", error);
        res.status(500).json({ error: "Failed to fetch time slots." });
    }
});
// DELETE request to remove a walk and update the associated user's walks array
router.delete('/:id', async (req, res) => {
    try {
        const walkId = req.params.id;

        // Find the walk and get the associated user ID
        const walk = await Walk.findById(walkId);
        if (!walk) {
            return res.status(404).json({ error: 'Walk not found' });
        }

        // Remove the walk from the Walk collection
        await Walk.findByIdAndDelete(walkId);

        // Remove the walk reference from the associated user's walks array
        await User.findByIdAndUpdate(
            walk.userid,
            { $pull: { walks: walkId } },
            { new: true, useFindAndModify: false }
        );

        res.status(200).json({ message: 'Walk deleted successfully' });
    } catch (error) {
        console.error('Error deleting walk:', error);
        res.status(500).json({ error: 'Failed to delete walk' });
    }
});

module.exports = router;