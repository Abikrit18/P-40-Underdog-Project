const express = require('express');
const router = express.Router();
const Walk = require('../models/walk'); // Import the Walk model

// POST request to schedule a walk
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, marshall, date, time } = req.body;
        if (!firstName || !lastName || !email || !marshall || !date || !time) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newWalk = new Walk({ firstName, lastName, email, marshall, date, time });
        await newWalk.save();
        res.status(201).json({ message: 'Walk scheduled successfully', walk: newWalk });
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

module.exports = router;