const { getDb, ObjectId } = require('../config/db');

const collectionName = 'dogs';

const dogModel = {
    getAllDogs: async () => {
        return await getDb().collection(collectionName).find().toArray();
    },

    getDogById: async (id) => {
        return await getDb().collection(collectionName).findOne({ _id: new ObjectId(id) });
    },

    createDog: async (dogData) => {
        const result = await getDb().collection(collectionName).insertOne({
            ...dogData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return { _id: result.insertedId, ...dogData };
    },

    updateDog: async (id, dogData) => {
        return await getDb().collection(collectionName).updateOne(
            { _id: new ObjectId(id) },
            { $set: { ...dogData, updatedAt: new Date() } }
        );
    },

    deleteDog: async (id) => {
        return await getDb().collection(collectionName).deleteOne({ _id: new ObjectId(id) });
    }
};

module.exports = dogModel;