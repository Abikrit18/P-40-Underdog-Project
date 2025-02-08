const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = 3000;

const uri = process.env.uri;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadDir)) {
    require('fs').mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

// Set up Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter to only allow images
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

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Successfully connected to MongoDB!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

// Image Upload Endpoint - Changed to match frontend expectation
app.post('/api/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        // Return URL in the format expected by frontend
        const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: "Failed to upload file" });
    }
});

// Get all dogs
app.get('/dogs', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        const dogs = await collection.find().toArray();
        res.json(dogs.map(d => ({ ...d, _id: d._id.toString() })));
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch dogs" });
    }
});

// Add new dog
app.post('/dogs', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        const newDog = req.body;
        const result = await collection.insertOne(newDog);
        res.json({ ...newDog, _id: result.insertedId.toString() });
    } catch (error) {
        console.error("Error adding dog:", error);
        res.status(500).json({ error: "Failed to add dog" });
    }
});

// Delete a dog

// Update the delete endpoint
app.delete('/dogs/:id', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        
        // First get the dog document to get the image URL
        const dog = await collection.findOne({ _id: new ObjectId(req.params.id) });
        
        if (!dog) {
            return res.status(404).json({ error: "Dog not found" });
        }

        // Delete the image file if it exists
        if (dog.picture) {
            const imageUrl = new URL(dog.picture);
            const filename = path.basename(imageUrl.pathname);
            const imagePath = path.join(__dirname, 'uploads', filename);
            
            // Delete file if it exists
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        // Delete the dog document from database
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
        
        if (result.deletedCount === 1) {
            res.json({ message: "Dog and associated image deleted successfully" });
        } else {
            res.status(404).json({ error: "Dog not found" });
        }
    } catch (error) {
        console.error("Error deleting dog:", error);
        res.status(500).json({ error: "Failed to delete dog" });
    }
});

// Edit a dog
app.put('/dogs/:id', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        const { name, age, color, image } = req.body;
        const updateFields = {};

        if (name) updateFields.name = name;
        if (age) updateFields.age = age;
        if (color) updateFields.color = color;
        if (image) updateFields.image = image;

        const updateResult = await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: updateFields }
        );

        if (updateResult.modifiedCount === 1) {
            res.json({ message: "Dog updated successfully" });
        } else {
            res.status(404).json({ error: "Dog not found or no changes made" });
        }
    } catch (error) {
        console.error("Error updating dog:", error);
        res.status(500).json({ error: "Failed to update dog" });
    }
});

// Start server and connect to MongoDB
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    await connectToMongoDB();
});