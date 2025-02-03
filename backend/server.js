const express = require('express');
const cors = require('cors');const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

// Get all dogs
app.get('/dogs', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        const dogs = await collection.find().toArray();
        res.json(dogs);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch dogs" });
    }
});

/*
// Add new dog
app.post('/dogs', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        const newDog = req.body;
        const result = await collection.insertOne(newDog, { writeConcern: { w: 1 } }); // Specify w: 1 for write concern
        res.json(result.ops[0]);
    } catch (error) {
        console.error("Error adding dog:", error);
        res.status(500).json({ error: "Failed to add dog" });
    }
});
*/


app.post('/dogs', async (req, res) => {
    try {
        const collection = client.db("underdogs").collection("dogs");
        const newDog = req.body;
        const result = await collection.deleteOne({ _id: new ObjectId(req.params.id) });


        // Instead of result.ops[0], use result.insertedId or return the inserted dog data
        const insertedDog = await collection.findOne({ _id: result.insertedId });
        res.json(insertedDog);
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
            { $set: req.body }
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
