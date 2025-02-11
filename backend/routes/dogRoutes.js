const express = require('express');
const mongoose = require('mongoose');

const path = require('path'); 
const fs = require('fs');

const path = require("path");

const router = express.Router();
const fs = require("fs");

// --------------------------
// HELPER: Delete the image file
// --------------------------
function deleteImageFile(imageUrl) {
  try {
    if (!imageUrl) {
      console.log('No image URL provided');
      return false;
    }

    let filename;
    try {
      // Extract filename from the URL
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

    // Convert ObjectId to string
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
    const collection = mongoose.connection.db.collection('dogs');

    // Destructure dog info from request body
    const { name, age, color, picture } = req.body;
    const newDog = { name, age, color, picture };

    const result = await collection.insertOne(newDog);

    res.json({ ...newDog, _id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error adding dog:', error);
    res.status(500).json({ error: 'Failed to add dog' });
  }
});


// --------------------------
// DELETE: Remove a dog by ID
// --------------------------

/** 

router.delete('/:id', async (req, res) => {
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Dog ID' });
    }

    const dogId = new mongoose.Types.ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('dogs');

    // Find the dog
    const dog = await collection.findOne({ _id: dogId });
    if (!dog) {
      return res.status(404).json({ error: 'Dog not found' });
    }


    // Delete the image file if the dog has a picture
    let imageDeleted = false;
    if (dog.picture) {
      imageDeleted = deleteImageFile(dog.picture);
    }

    // Delete the document from DB
    await collection.deleteOne({ _id: dogId });

    res.json({ 
      message: 'Dog and associated image deleted successfully',
      imageDeleted
    });
  } catch (error) {
    console.error('Error deleting dog:', error);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
});

// --------------------------
// PUT: Update an existing dog
// --------------------------

});*/

router.delete('/:id', async (req, res) => {
    try {
        if (!mongoose.connection.readyState) {
            return res.status(500).json({ error: 'Database not connected' });
        }

        const db = mongoose.connection.db;
        if (!db) {
            return res.status(500).json({ error: 'Database instance is undefined' });
        }

        const collection = db.collection('dogs');
        const dog = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

        if (!dog) {
            return res.status(404).json({ error: 'Dog not found' });
        }

        if (dog.picture && !dog.picture.startsWith("http")) {
            const filename = path.basename(dog.picture);
            const imagePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
                console.log(`Deleted file: ${imagePath}`);
            }
        }

        await collection.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });

        res.json({ message: 'Dog and associated image deleted successfully' });
    } catch (error) {
        console.error('Error deleting dog:', error);
        res.status(500).json({ error: 'Failed to delete dog' });
    }
});




router.put('/:id', async (req, res) => {
  try {
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Dog ID' });
    }

    const dogId = new mongoose.Types.ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('dogs');

    // Destructure updated fields from request body
    const { name, age, color, picture } = req.body;
    
    // Find the existing dog
    const oldDog = await collection.findOne({ _id: dogId });
    if (!oldDog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Build object of new fields
    const updateFields = {};
    if (typeof name    !== 'undefined') updateFields.name    = name;
    if (typeof age     !== 'undefined') updateFields.age     = age;
    if (typeof color   !== 'undefined') updateFields.color   = color;
    if (typeof picture !== 'undefined') updateFields.picture = picture;

    // If no valid fields, return
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    // Update the dog
    const updateResult = await collection.updateOne(
      { _id: dogId },
      { $set: updateFields }
    );

    // If the picture changed successfully, delete the old image
    if (
      updateResult.modifiedCount === 1 &&
      picture &&
      oldDog.picture &&
      oldDog.picture !== picture
    ) {
      deleteImageFile(oldDog.picture);
    }

    res.json({ message: 'Dog updated successfully' });
  } catch (error) {
    console.error('Error updating dog:', error);
    res.status(500).json({ error: 'Failed to update dog' });
  }
});

module.exports = router;