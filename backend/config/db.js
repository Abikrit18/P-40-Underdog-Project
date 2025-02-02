const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.uri;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let db;

async function connect() {
    try {
        await client.connect();
        db = client.db("dogDB");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Connection failed:", error);
        process.exit(1);
    }
}

function getDb() {
    if (!db) throw Error("Database not initialized");
    return db;
}

module.exports = { connect, getDb, ObjectId };