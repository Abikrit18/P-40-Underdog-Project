const express = require('express');
const router = express.Router();
const ShelterTime = require('../models/ShelterTime');
const User = require('../models/User');
const { createSystemNotification } = require('../controllers/notificationController');

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

// Get default shelter hours
router.get('/defaults', function(req, res) {
  ShelterTime.find({ isDefault: true }).sort({ dayOfWeek: 1 })
    .then(defaultTimes => {
      res.status(200).json(defaultTimes);
    })
    .catch(error => {
      console.error('Error fetching default shelter times:', error);
      res.status(500).json({ message: 'Server error' });
    });
});

// Get shelter hours for a specific date
router.get('/date/:date', async function(req, res) {
  try {
    const date = req.params.date;

    // Try to get or create shelter hours for this date
    const shelterTime = await ShelterTime.getOrCreateForDate(date);

    if (!shelterTime) {
      return res.status(404).json({ message: 'No shelter hours available for this date' });
    }

    res.status(200).json(shelterTime);
  } catch (error) {
    console.error('Error fetching shelter time for date:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new shelter time
router.post('/', async function(req, res) {
  try {
    const { date, startTime, endTime, createdBy, isClosed } = req.body;

    // Create new shelter time
    const newShelterTime = new ShelterTime({
      date,
      startTime,
      endTime,
      createdBy,
      isClosed: isClosed || false
    });

    // Calculate day of week if not provided
    if (!newShelterTime.dayOfWeek && date) {
      const dateObj = new Date(date);
      newShelterTime.dayOfWeek = dateObj.getDay();
    }

    const savedShelterTime = await newShelterTime.save();

    // Notify marshals about the new shelter hours
    if (createdBy) {
      // Find all marshals
      const marshals = await User.find({ role: 'Marshall' });

      // Create notifications for each marshal
      for (const marshal of marshals) {
        await createSystemNotification(
          marshal._id,
          `New shelter hours have been set for ${date}: ${startTime} to ${endTime}`,
          'system',
          savedShelterTime._id,
          'ShelterTime',
          createdBy,
          true, // Send email
          {
            subject: 'New Shelter Hours Set',
            action: 'shelter_hours_set'
          }
        );
      }
    }

    res.status(201).json(savedShelterTime);
  } catch (error) {
    console.error('Error creating shelter time:', error);
    if (error.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'Shelter hours already exist for this date' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Set default shelter hours for a day of the week
router.post('/defaults', async function(req, res) {
  try {
    const { dayOfWeek, startTime, endTime, createdBy, isClosed } = req.body;

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ message: 'Invalid day of week. Must be 0-6 (Sunday-Saturday)' });
    }

    // Check if default hours already exist for this day
    const existingDefault = await ShelterTime.findOne({ isDefault: true, dayOfWeek });

    if (existingDefault) {
      // Update existing default hours
      existingDefault.startTime = startTime;
      existingDefault.endTime = endTime;
      existingDefault.isClosed = isClosed || false;
      if (createdBy) existingDefault.createdBy = createdBy;

      const updatedDefault = await existingDefault.save();
      return res.status(200).json(updatedDefault);
    }

    // Create new default shelter time
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[dayOfWeek];

    const newDefaultTime = new ShelterTime({
      date: `Default-${dayName}`, // Use a special format for default times
      dayOfWeek,
      startTime,
      endTime,
      isDefault: true,
      createdBy,
      isClosed: isClosed || false
    });

    const savedDefaultTime = await newDefaultTime.save();

    // Notify marshals about the new default shelter hours
    if (createdBy) {
      // Find all marshals
      const marshals = await User.find({ role: 'Marshall' });

      // Create notifications for each marshal
      for (const marshal of marshals) {
        await createSystemNotification(
          marshal._id,
          `Default shelter hours for ${dayName} have been set to ${startTime} to ${endTime}`,
          'system',
          savedDefaultTime._id,
          'ShelterTime',
          createdBy,
          true, // Send email
          {
            subject: 'Default Shelter Hours Updated',
            action: 'default_shelter_hours_set'
          }
        );
      }
    }

    res.status(201).json(savedDefaultTime);
  } catch (error) {
    console.error('Error setting default shelter time:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Initialize default shelter hours (10AM-3PM Monday-Friday, closed on weekends)
router.post('/initialize-defaults', async function(req, res) {
  try {
    const { createdBy } = req.body;
    const results = [];

    // Define default hours
    const defaultHours = [
      { dayOfWeek: 0, isClosed: true }, // Sunday - closed
      { dayOfWeek: 1, startTime: '10:00', endTime: '15:00' }, // Monday
      { dayOfWeek: 2, startTime: '10:00', endTime: '15:00' }, // Tuesday
      { dayOfWeek: 3, startTime: '10:00', endTime: '15:00' }, // Wednesday
      { dayOfWeek: 4, startTime: '10:00', endTime: '15:00' }, // Thursday
      { dayOfWeek: 5, startTime: '10:00', endTime: '15:00' }, // Friday
      { dayOfWeek: 6, isClosed: true } // Saturday - closed
    ];

    // Create or update default hours for each day
    for (const defaultHour of defaultHours) {
      const { dayOfWeek, startTime, endTime, isClosed } = defaultHour;

      // Check if default hours already exist for this day
      let existingDefault = await ShelterTime.findOne({ isDefault: true, dayOfWeek });

      if (existingDefault) {
        // Update existing default hours
        if (isClosed) {
          existingDefault.isClosed = true;
          existingDefault.startTime = '00:00';
          existingDefault.endTime = '00:00';
        } else {
          existingDefault.startTime = startTime;
          existingDefault.endTime = endTime;
          existingDefault.isClosed = false;
        }
        if (createdBy) existingDefault.createdBy = createdBy;

        const updatedDefault = await existingDefault.save();
        results.push(updatedDefault);
      } else {
        // Create new default shelter time
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[dayOfWeek];

        const newDefaultTime = new ShelterTime({
          date: `Default-${dayName}`,
          dayOfWeek,
          startTime: isClosed ? '00:00' : startTime,
          endTime: isClosed ? '00:00' : endTime,
          isDefault: true,
          createdBy,
          isClosed: isClosed || false
        });

        const savedDefaultTime = await newDefaultTime.save();
        results.push(savedDefaultTime);
      }
    }

    // Notify marshals about the initialization of default shelter hours
    if (createdBy) {
      // Find all marshals
      const marshals = await User.find({ role: 'Marshall' });

      // Create notifications for each marshal
      for (const marshal of marshals) {
        await createSystemNotification(
          marshal._id,
          `Default shelter hours have been initialized: 10AM-3PM Monday-Friday, closed on weekends`,
          'system',
          null,
          'ShelterTime',
          createdBy,
          true, // Send email
          {
            subject: 'Default Shelter Hours Initialized',
            action: 'default_shelter_hours_initialized'
          }
        );
      }
    }

    res.status(200).json({
      message: 'Default shelter hours initialized successfully',
      results
    });
  } catch (error) {
    console.error('Error initializing default shelter hours:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shelter time
router.put('/:id', async function(req, res) {
  try {
    const { startTime, endTime, isClosed } = req.body;

    const shelterTime = await ShelterTime.findById(req.params.id);
    if (!shelterTime) {
      return res.status(404).json({ message: 'Shelter time not found' });
    }

    // Update fields
    if (startTime) shelterTime.startTime = startTime;
    if (endTime) shelterTime.endTime = endTime;
    if (isClosed !== undefined) shelterTime.isClosed = isClosed;

    const updatedShelterTime = await shelterTime.save();

    res.status(200).json(updatedShelterTime);
  } catch (error) {
    console.error('Error updating shelter time:', error);
    res.status(500).json({ message: 'Server error' });
  }
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