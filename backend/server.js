const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const cors = require('cors');
const dogsRouter = require('./routes/dogs');
const port = 3000;

const uri=process.env.uri;

// Create a MongoClient instance
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

// Middleware to parse JSON
app.use(express.json());
app.use(cors());

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

// API route to fetch data from a collection
app.get('/api/data', async (req, res) => {
    try {
        const collection = client.db("test").collection("example"); // Replace 'test' and 'example' with your DB and collection names
        const data = await collection.find().toArray();
        res.json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Failed to fetch data" });
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Express server with MongoDB integration!');
});

app.use('/api/dogs', dogsRouter);

// Start the server and connect to MongoDB
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    await connectToMongoDB(); // Connect to MongoDB when the server starts
});
