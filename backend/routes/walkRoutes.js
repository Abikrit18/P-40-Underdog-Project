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

        // Create a new walk
        const newWalk = new Walk({ userid, marshall, date, time });
        const savedWalk = await newWalk.save();

        // Update the user's walk field with the newly created walk's ObjectId
        await User.findByIdAndUpdate(
            userid,
            { $push: { walks: savedWalk._id } },  // Push the new walk's ObjectId to the walks array
            { new: true, useFindAndModify: false }
        );
        res.status(201).json({ message: 'Walk scheduled successfully', walk: savedWalk });
    } catch (error) {
        console.error('Error scheduling walk:', error);
        res.status(500).json({ error: 'Failed to schedule walk' });
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