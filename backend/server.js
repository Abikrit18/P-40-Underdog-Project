const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes'); // Import user routes

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB using Mongoose
mongoose.connect(process.env.uri)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => console.error('MongoDB connection failed:', error));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

// Set up Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Not an image! Please upload an image.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Image Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// Dog-related routes
app.get('/dogs', async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection('dogs');
        const dogs = await collection.find().toArray();
        res.json(dogs.map(d => ({ ...d, _id: d._id.toString() })));
    } catch (error) {
        console.error('Error fetching dogs:', error);
        res.status(500).json({ error: "Failed to fetch dogs" });
    }
});

app.post('/dogs', async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection('dogs');
        const newDog = req.body;
        const result = await collection.insertOne(newDog);
        res.json({ ...newDog, _id: result.insertedId.toString() });
    } catch (error) {
        console.error('Error adding dog:', error);
        res.status(500).json({ error: "Failed to add dog" });
    }
});

app.delete('/dogs/:id', async (req, res) => {
    try {
        const collection = mongoose.connection.db.collection('dogs');
        const dog = await collection.findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (!dog) return res.status(404).json({ error: "Dog not found" });

        if (dog.picture) {
            const filename = path.basename(new URL(dog.picture).pathname);
            const imagePath = path.join(__dirname, 'uploads', filename);
            if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }

        const result = await collection.deleteOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        res.json({ message: "Dog and associated image deleted successfully" });
    } catch (error) {
        console.error('Error deleting dog:', error);
        res.status(500).json({ error: "Failed to delete dog" });
    }
});

app.put('/dogs/:id', async (req, res) => {
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
            res.json({ message: "Dog updated successfully" });
        } else {
            res.status(404).json({ error: "Dog not found or no changes made" });
        }
    } catch (error) {
        console.error('Error updating dog:', error);
        res.status(500).json({ error: "Failed to update dog" });
    }
});

// Use user routes
app.use('/users', userRoutes);

// 404 Not Found Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});
app.use("/apple", (req, res) => {
    res.send("404");
})

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});