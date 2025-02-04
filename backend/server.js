const express = require('express');
const cors = require('cors');
const multer = require('multer');
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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up Multer for file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

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

// Image Upload Endpoint
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ url: `http://localhost:${port}/uploads/${req.file.filename}` });
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
        newDog._id = result.insertedId;
        res.json(newDog);
    } catch (error) {
        console.error("Error adding dog:", error);
        res.status(500).json({ error: "Failed to add dog" });
    }
});

// Delete a dog
app.delete('/dogs/:id', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });
        if (result.deletedCount === 1) {
            res.json({ message: "Dog deleted successfully" });
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
        const updateResult = await collection.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { name: req.body.name, color: req.body.color, age: req.body.age } }
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
