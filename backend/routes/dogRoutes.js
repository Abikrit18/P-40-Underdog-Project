const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const fs = require('fs');
const router = express.Router();

// Helper: Delete the image file
function deleteImageFile(imageUrl) {
  try {
    if (!imageUrl) {
      console.log('No image URL provided');
      return false;
    }

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

// GET: Fetch all dogs
router.get('/', async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('dogs');
    const dogs = await collection.find().toArray();
    const responseDogs = dogs.map(d => ({ ...d, _id: d._id.toString() }));
    res.json(responseDogs);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// POST: Add a new dog
router.post('/', async (req, res) => {
  try {
    const { name, age, color, picture } = req.body;
    if (!name || !age || !color || !picture) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate picture URL
    try {
      new URL(picture);
    } catch (urlError) {
      return res.status(400).json({ error: 'Invalid picture URL format' });
    }

    const collection = mongoose.connection.db.collection('dogs');
    const newDog = { name, age, color, picture };
    const result = await collection.insertOne(newDog);
    res.json({ ...newDog, _id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error adding dog:', error);
    res.status(500).json({ error: 'Failed to add dog' });
  }
});

// DELETE: Remove a dog by ID
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Dog ID' });
    }

    const dogId = new mongoose.Types.ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('dogs');
    const dog = await collection.findOne({ _id: dogId });
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    let imageDeleted = false;
    if (dog.picture) {
      imageDeleted = deleteImageFile(dog.picture);
    }

    await collection.deleteOne({ _id: dogId });
    res.json({ message: 'Dog and associated image deleted successfully', imageDeleted });
  } catch (error) {
    console.error('Error deleting dog:', error);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
});

// PUT: Update an existing dog
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Dog ID' });
    }

    const dogId = new mongoose.Types.ObjectId(req.params.id);
    const { name, age, color, picture } = req.body;
    const updateFields = {};
    if (name) updateFields.name = name;
    if (age) updateFields.age = age;
    if (color) updateFields.color = color;
    if (picture) updateFields.picture = picture;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    // Validate picture URL
    if (picture) {
      try {
        new URL(picture);
      } catch (urlError) {
        return res.status(400).json({ error: 'Invalid picture URL format' });
      }
    }

    const collection = mongoose.connection.db.collection('dogs');
    const oldDog = await collection.findOne({ _id: dogId });
    if (!oldDog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    const updateResult = await collection.updateOne({ _id: dogId }, { $set: updateFields });
    if (updateResult.modifiedCount === 1 && picture && oldDog.picture && oldDog.picture !== picture) {
      deleteImageFile(oldDog.picture);
    }

    res.json({ message: 'Dog updated successfully' });
  } catch (error) {
    console.error('Error updating dog:', error);
    res.status(500).json({ error: 'Failed to update dog' });
  }
});

module.exports = router;