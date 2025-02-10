const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); 
const fs = require('fs');     
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection('dogs');
        const dogs = await collection.find().toArray();
        res.json(dogs.map(d => ({ ...d, _id: d._id.toString() })));
    } catch (error) {
        console.error('Error fetching dogs:', error);
        res.status(500).json({ error: 'Failed to fetch dogs' });
    }
});

router.post('/', async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection('dogs');
        const newDog = req.body;
        const result = await collection.insertOne(newDog);
        res.json({ ...newDog, _id: result.insertedId.toString() });
    } catch (error) {
        console.error('Error adding dog:', error);
        res.status(500).json({ error: 'Failed to add dog' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection('dogs');
        const dog = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!dog) return res.status(404).json({ error: 'Dog not found' });

        if (dog.picture) {
            const filename = path.basename(new URL(dog.picture).pathname);
            const imagePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        res.json({ message: 'Dog and associated image deleted successfully' });
    } catch (error) {
        console.error('Error deleting dog:', error);
        res.status(500).json({ error: 'Failed to delete dog' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection('dogs');
        const { name, age, color, image } = req.body;
        const updateFields = {};
        if (name) updateFields.name = name;
        if (age) updateFields.age = age;
        if (color) updateFields.color = color;
        if (image) updateFields.image = image;

        const updateResult = await collection.updateOne(
            { _id: new mongoose.Types.ObjectId(req.params.id) },
            { $set: updateFields }
        );

        if (updateResult.modifiedCount === 1) {
            res.json({ message: 'Dog updated successfully' });
        } else {
            res.status(404).json({ error: 'Dog not found or no changes made' });
        }
    } catch (error) {
        console.error('Error updating dog:', error);
        res.status(500).json({ error: 'Failed to update dog' });
    }
});

module.exports = router;