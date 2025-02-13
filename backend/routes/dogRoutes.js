const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// --------------------------
// HELPER: Delete the image file
// --------------------------
function deleteImageFile(imageUrl) {
  try {
    if (!imageUrl) return false;

    let filename;
    try {
      filename = path.basename(new URL(imageUrl).pathname);
    } catch (urlError) {
      console.error('Invalid image URL format:', urlError);
      return false;
    }

    const imagePath = path.join(__dirname, '../uploads', filename);
    console.log('Attempting to delete image at:', imagePath);

    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('Successfully deleted image file:', filename);
      return true;
    } else {
      console.log('Image file not found:', filename);
      return false;
    }
  } catch (error) {
    console.error('Error deleting image file:', error);
    return false;
  }
}

// --------------------------
// GET: Fetch all dogs
// --------------------------
router.get('/', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('dogs');
    const dogs = await collection.find().toArray();

    // Convert ObjectId to string for frontend compatibility
    const responseDogs = dogs.map(d => ({ ...d, _id: d._id.toString() }));
    res.json(responseDogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// --------------------------
// POST: Add a new dog
// --------------------------
router.post('/', async (req, res) => {
  try {
    console.log('Request Body:', req.body);  // Debug request body
    const collection = mongoose.connection.db.collection('dogs');
    
    const { name, age, color, picture } = req.body;
    if (!name || !age || !color || !picture) {
      return res.status(400).json({ error: 'All fields are required, including the picture.' });
    }

    const newDog = { name, age, color, picture };
    const result = await collection.insertOne(newDog);

    console.log('Dog added:', result.ops[0]);  // Log the added dog
    res.json({ ...newDog, _id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error adding dog:', error);
    res.status(500).json({ error: 'Failed to add dog.' });
  }
});

// --------------------------
// DELETE: Delete a dog
// --------------------------
router.delete('/:id', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('dogs');

    const dog = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Delete the image file if it exists
    if (dog.picture) {
      const deleted = deleteImageFile(dog.picture);
      if (deleted) {
        console.log('Image deleted successfully');
      } else {
        console.log('No image deleted or image not found');
      }
    }

    await collection.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
    res.json({ message: 'Dog and associated image deleted successfully' });
  } catch (error) {
    console.error('Error deleting dog:', error);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
});

// --------------------------
// PUT: Update a dog
// --------------------------
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Dog ID' });
    }

    const dogId = new mongoose.Types.ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('dogs');

    const { name, age, color, picture } = req.body;
    
    const oldDog = await collection.findOne({ _id: dogId });
    if (!oldDog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const updateFields = {};
    if (typeof name !== 'undefined') updateFields.name = name;
    if (typeof age !== 'undefined') updateFields.age = age;
    if (typeof color !== 'undefined') updateFields.color = color;
    if (typeof picture !== 'undefined') updateFields.picture = picture;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    const updateResult = await collection.updateOne(
      { _id: dogId },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 1 && picture && oldDog.picture !== picture) {
      deleteImageFile(oldDog.picture);
    }

    res.json({ message: 'Dog updated successfully' });
  } catch (error) {
    console.error('Error updating dog:', error);
    res.status(500).json({ error: 'Failed to update dog' });
  }
});

module.exports = router;