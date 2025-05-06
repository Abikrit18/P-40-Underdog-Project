const express = require('express');
const mongoose = require('mongoose');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const { cloudinary } = require('../config/cloudinary');

const router = express.Router();

// Helper: Delete the image from Cloudinary
async function deleteImageFile(imageUrl) {
  try {
    if (!imageUrl) return false;

    // Extract the public ID from the Cloudinary URL
    // Cloudinary URLs typically look like:
    // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/public_id.jpg
    let publicId;
    try {
      // Check if the URL is a Cloudinary URL
      if (imageUrl.includes('cloudinary.com')) {
        // Parse the URL to extract the public ID
        const urlParts = imageUrl.split('/upload/');
        if (urlParts.length > 1) {
          // Get everything after the version number (v1234567890/)
          const afterVersion = urlParts[1].replace(/^v\d+\//, '');
          // Remove file extension
          publicId = afterVersion.replace(/\.\w+$/, '');
        }
      } else if (imageUrl.includes('/p40-underdogs/')) {
        // Handle the case where we might have stored just the public ID path
        const folderPath = imageUrl.split('/p40-underdogs/')[1];
        publicId = 'p40-underdogs/' + folderPath.replace(/\.\w+$/, '');
      } else {
        // If it's just a filename or public ID
        const filename = imageUrl.split('/').pop();
        publicId = filename.replace(/\.\w+$/, '');
      }

      // If we couldn't extract a public ID, log and return
      if (!publicId) {
        console.error('Could not extract public ID from URL:', imageUrl);
        return false;
      }
    } catch (urlError) {
      console.error('Invalid Cloudinary URL format:', urlError, imageUrl);
      return false;
    }

    console.log('Attempting to delete image with public ID:', publicId);

    // Delete the image from Cloudinary
    const result = await new Promise((resolve) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error('Error deleting image from Cloudinary:', error);
          resolve(false);
        } else {
          resolve(result.result === 'ok');
        }
      });
    });

    if (result) {
      console.log('Successfully deleted image from Cloudinary:', publicId);
      return true;
    } else {
      console.log('Failed to delete image from Cloudinary or image not found:', publicId);
      return false;
    }
  } catch (error) {
    console.error('Error in deleteImageFile:', error);
    return false;
  }
}

// GET: Fetch all dogs (public)
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

// Add a route to get all dog names
router.get('/names', async (req, res) => {
  try {
    // Assuming your dog model has a name field
    const dogs = await Dog.find({}, 'name');
    const dogNames = dogs.map(dog => dog.name);
    res.status(200).json(dogNames);
  } catch (error) {
    console.error('Error fetching dog names:', error);
    res.status(500).json({ error: 'Failed to fetch dog names' });
  }
});

// POST: Add a new dog (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection('dogs');

    // Destructure dog info from request body
    const { name, age, color, picture, additionalImages } = req.body;
    if (!name || !age || !color || !picture)
      return res.status(400).json({ error: 'All fields are required.' });

    // Create new dog object with additionalImages if provided
    const newDog = {
      name,
      age,
      color,
      picture,
      additionalImages: additionalImages || []
    };

    const result = await collection.insertOne(newDog);

    res.json({ ...newDog, _id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error adding dog:', error);
    res.status(500).json({ error: 'Failed to add dog.' });
  }
});

// --------------------------
// DELETE: Remove a dog by ID (admin only)
// --------------------------
router.delete('/:id', verifyToken, async (req, res) => {
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

    // Delete the image from Cloudinary if the dog has a picture
    let imageDeleted = false;
    if (dog.picture) {
      imageDeleted = await deleteImageFile(dog.picture);
    }

    // Delete additional images if they exist
    if (dog.additionalImages && dog.additionalImages.length > 0) {
      for (const imageUrl of dog.additionalImages) {
        await deleteImageFile(imageUrl);
      }
    }

    // Delete the document from DB
    await collection.deleteOne({ _id: dogId });

    res.json({
      message: 'Dog and associated images deleted successfully',
      imageDeleted
    });
  } catch (error) {
    console.error('Error deleting dog:', error);
    res.status(500).json({ error: 'Failed to delete dog' });
  }
});

// --------------------------
// PUT: Update an existing dog (admin only)
// --------------------------
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Dog ID' });
    }

    const dogId = new mongoose.Types.ObjectId(req.params.id);
    const collection = mongoose.connection.db.collection('dogs');

    // Destructure updated fields from request body
    const { name, age, color, picture, additionalImages } = req.body;

    // Find the existing dog
    const oldDog = await collection.findOne({ _id: dogId });
    if (!oldDog) {
      return res.status(404).json({ error: 'Dog not found' });
    }

    // Build object of new fields
    const updateFields = {};
    if (typeof name !== 'undefined') updateFields.name = name;
    if (typeof age !== 'undefined') updateFields.age = age;
    if (typeof color !== 'undefined') updateFields.color = color;
    if (typeof picture !== 'undefined') updateFields.picture = picture;
    if (typeof additionalImages !== 'undefined') updateFields.additionalImages = additionalImages;

    // If no valid fields, return
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No valid update fields provided' });
    }

    // Update the dog
    const updateResult = await collection.updateOne(
      { _id: dogId },
      { $set: updateFields }
    );

    // If the picture changed successfully, delete the old image from Cloudinary
    if (
      updateResult.modifiedCount === 1 &&
      picture &&
      oldDog.picture &&
      oldDog.picture !== picture
    ) {
      await deleteImageFile(oldDog.picture);
    }

    // Handle additional images changes
    if (
      updateResult.modifiedCount === 1 &&
      additionalImages &&
      oldDog.additionalImages
    ) {
      // Find images that were removed
      const oldImages = oldDog.additionalImages || [];
      const newImages = additionalImages || [];

      // Delete images that are no longer in the array
      for (const oldImage of oldImages) {
        if (!newImages.includes(oldImage)) {
          await deleteImageFile(oldImage);
        }
      }
    }

    res.json({ message: 'Dog updated successfully' });
  } catch (error) {
    console.error('Error updating dog:', error);
    res.status(500).json({ error: 'Failed to update dog' });
  }
});

module.exports = router;
