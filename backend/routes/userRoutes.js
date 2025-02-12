const express = require('express');
const { registerUser, loginUser, getUsers } = require('../controllers/userController');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', getUsers); 

module.exports = router;