const express = require('express');
const router = express.Router();
const dogsController = require('../controllers/dogsController');

// CRUD Routes
router.get('/', dogsController.getAllDogs);
router.get('/:id', dogsController.getDog);
router.post('/', dogsController.createDog);
router.put('/:id', dogsController.updateDog);    // Admin edit route
router.delete('/:id', dogsController.deleteDog); // Admin delete route

module.exports = router;