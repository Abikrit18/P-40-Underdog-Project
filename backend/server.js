const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const cors = require('cors');
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

app.get('/api/dogs', (req, res) => {
    const dogs = [
        {
            id: 1,
            name: 'Buddy',
            breed: 'Golden Retriever',
            age: 3,
            color: 'Golden',
            label: 'Friendly',
            notes: 'Good with children, needs moderate exercise',
            numberOfWalks: 23,
            lastUpdated: '2024-03-15T10:30:00Z',
            isAlive: true,
            size: 'Large',
            walkingRequirements: '30 minutes twice daily',
            healthConditions: 'None',
            availableForWalk: true,
            currentWalker: null,
            nextScheduledWalk: '2024-03-16T14:00:00Z',
            temperament: 'Gentle',
            energyLevel: 'Moderate',
            image: 'https://picsum.photos/id/237/200/300'
        },
        {
            id: 2,
            name: 'Max',
            breed: 'Labrador Retriever',
            age: 5,
            color: 'Chocolate',
            label: 'Senior',
            notes: 'Loves water, experienced walker needed',
            numberOfWalks: 45,
            lastUpdated: '2024-03-15T09:15:00Z',
            isAlive: true,
            size: 'Large',
            walkingRequirements: '45 minutes daily',
            healthConditions: 'Hip dysplasia - gentle walks only',
            availableForWalk: true,
            currentWalker: 'John Smith',
            nextScheduledWalk: '2024-03-16T16:00:00Z',
            temperament: 'Energetic',
            energyLevel: 'High',
            image: 'https://picsum.photos/id/237/200/300'
        },
        {
            id: 3,
            name: 'Daisy',
            breed: 'Dalmatian',
            age: 2,
            color: 'White & Black',
            label: 'Young',
            notes: 'Needs leash training, good with other dogs',
            numberOfWalks: 10,
            lastUpdated: '2024-03-15T11:45:00Z',
            isAlive: true,
            size: 'Medium',
            walkingRequirements: '20 minutes twice daily',
            healthConditions: 'Deaf - hand signals only',
            availableForWalk: false,
            currentWalker: null,
            nextScheduledWalk: '2024-03-17T10:00:00Z',
            temperament: 'Playful',
            energyLevel: 'High',
            image: 'https://picsum.photos/id/237/200/300'
        },
        {
            id: 4,
            name: 'Rocky',
            breed: 'German Shepherd',
            age: 4,
            color: 'Black & Tan',
            label: 'Active',
            notes: 'Needs experienced handler, not good with other dogs',
            numberOfWalks: 30,
            lastUpdated: '2024-03-15T12:00:00Z',
            isAlive: true,
            size: 'Large',
            walkingRequirements: '60 minutes daily',
            healthConditions: 'None',
            availableForWalk: true,
            currentWalker: 'Jane Doe',
            nextScheduledWalk: '2024-03-16T17:30:00Z',
            temperament: 'Protective',
            energyLevel: 'Very High',
            image: 'https://picsum.photos/id/237/200/300'
        }
    ];
    res.json(dogs);
});

// Start the server and connect to MongoDB
app.listen(port, async () => {
    console.log(`Server is running on http://localhost:${port}`);
    await connectToMongoDB(); // Connect to MongoDB when the server starts
});
