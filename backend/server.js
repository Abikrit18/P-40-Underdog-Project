const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
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
        const result = await collection.insertOne(newDog, { writeConcern: { w: 1 } });

        // Instead of result.ops[0], use result.insertedId or return the inserted dog data
        const insertedDog = await collection.findOne({ _id: result.insertedId });
        res.json(insertedDog);
    } catch (error) {
        console.error("Error adding dog:", error);
        res.status(500).json({ error: "Failed to add dog" });
    }
});


// Start server and connect to MongoDB
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    await connectToMongoDB();
});
