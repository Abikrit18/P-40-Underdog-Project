const express = require('express');
const router = express.Router();
const ShelterTime = require('../models/ShelterTime');

// Get all shelter times
router.get('/', function(req, res) {
  ShelterTime.find().sort({ date: 1 })
    .then(shelterTimes => {
      res.status(200).json(shelterTimes);
    })
    .catch(error => {
      console.error('Error fetching shelter times:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Create new shelter time
router.post('/', function(req, res) {
  const { date, startTime, endTime } = req.body;
  
  // Create new shelter time
  const newShelterTime = new ShelterTime({
    date,
    startTime,
    endTime
  });
  
  newShelterTime.save()
    .then(savedShelterTime => {
      res.status(201).json(savedShelterTime);
    })
    .catch(error => {
      console.error('Error creating shelter time:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Delete shelter time
router.delete('/:id', function(req, res) {
  ShelterTime.findByIdAndDelete(req.params.id)
    .then(() => {
      res.status(200).json({ message: 'Shelter time deleted successfully' });
    })
    .catch(error => {
      console.error('Error deleting shelter time:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

module.exports = router;