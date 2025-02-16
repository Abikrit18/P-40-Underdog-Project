const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { registerUser, loginUser, getUsers, userProfile } = require('../controllers/userController');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/', getUsers);
router.get('/profile/:id', userProfile);
module.exports = router;