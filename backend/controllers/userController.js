const User = require('../models/User');
const bcrypt = require('bcrypt');

const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ firstName, lastName, email, password: hashedPassword });

        res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
    } catch (error) {
        console.error('Error during user registration:', error);  // Log the full error for debugging
        res.status(500).json({ error: 'Failed to register user. Please try again later.' });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ error: 'Invalid email or password' });

        res.json({ message: 'Login successful', userId: user._id });
    } catch (error) {
        console.error('Error during login:', error);  // Log the full error for debugging
        res.status(500).json({ error: 'Failed to log in. Please try again later.' });
    }
};

module.exports = { registerUser, loginUser };