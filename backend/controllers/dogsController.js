const dogModel = require('../models/dogModel');
const { ObjectId } = require('../config/db');

const dummyDogs = [
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
        image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
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
        image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        id: 3,
        name: 'Bella',
        breed: 'Beagle',
        age: 2,
        color: 'Tri-color',
        label: 'Playful',
        notes: 'Loves to play fetch, good with other dogs',
        numberOfWalks: 30,
        lastUpdated: '2024-03-15T11:00:00Z',
        isAlive: true,
        size: 'Medium',
        walkingRequirements: '20 minutes twice daily',
        healthConditions: 'None',
        availableForWalk: true,
        currentWalker: null,
        nextScheduledWalk: '2024-03-16T15:00:00Z',
        temperament: 'Friendly',
        energyLevel: 'High',
        image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    },
    {
        id: 4,
        name: 'Charlie',
        breed: 'Poodle',
        age: 4,
        color: 'White',
        label: 'Calm',
        notes: 'Good with elderly, needs regular grooming',
        numberOfWalks: 40,
        lastUpdated: '2024-03-15T12:00:00Z',
        isAlive: true,
        size: 'Small',
        walkingRequirements: '15 minutes twice daily',
        healthConditions: 'None',
        availableForWalk: true,
        currentWalker: 'Jane Doe',
        nextScheduledWalk: '2024-03-16T17:00:00Z',
        temperament: 'Calm',
        energyLevel: 'Low',
        image: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D'
    }
];

const dogsController = {
    getAllDogs: async (req, res) => {
        try {
            const dogs = await dogModel.getAllDogs();
            res.json(dogs);
        } catch (error) {
            res.json(dummyDogs);
            // res.status(500).json({ error: error.message });
        }
    },

    getDog: async (req, res) => {
        try {
            const dog = await dogModel.getDogById(req.params.id);
            dog ? res.json(dog) : res.status(404).json({ error: 'Dog not found' });
        } catch (error) {
            res.status(400).json({ error: 'Invalid ID format' });
        }
    },

    createDog: async (req, res) => {
        try {
            const newDog = await dogModel.createDog(req.body);
            res.status(201).json(newDog);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateDog: async (req, res) => {
        try {
            const result = await dogModel.updateDog(req.params.id, req.body);
            result.matchedCount > 0 
                ? res.json({ message: 'Dog updated successfully' })
                : res.status(404).json({ error: 'Dog not found' });
        } catch (error) {
            res.status(400).json({ error: 'Invalid ID format or data' });
        }
    },

    deleteDog: async (req, res) => {
        try {
            const result = await dogModel.deleteDog(req.params.id);
            result.deletedCount > 0 
                ? res.json({ message: 'Dog deleted successfully' })
                : res.status(404).json({ error: 'Dog not found' });
        } catch (error) {
            res.status(400).json({ error: 'Invalid ID format' });
        }
    }
};

module.exports = dogsController;