import pkg from 'bcryptjs';
const { hash, compare } = pkg;
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Walk from '../models/walk.js';

const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role, userName: `${user.firstName} ${user.lastName}` }, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const registerUser = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await hash(password, 10);
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
        //console.log(user);
        if (!user) return res.status(400).json({ error: 'Invalid email or password' });

        const isPasswordValid = await compare(password, user.password);
        if (!isPasswordValid) return res.status(400).json({ error: 'Invalid email or password' });

        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error('Error during login:', error);  // Log the full error for debugging
        res.status(500).json({ error: 'Failed to log in. Please try again later.' });
    }
};

const getUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude passwords
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};
const userProfile = async (req, res) => {
    try {
        let user = await User.findById(req.params.id)
            .select('-password')
            .populate({
                path: 'walks',
                populate: [
                    { path: 'userid', select: 'firstName lastName email' },  // User who scheduled the walk
                    { path: 'marshall', select: 'firstName lastName email' }  // Marshall assigned to the walk
                ]
            });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.role === 'admin') {
            const allWalks = await Walk.find()
                .populate('userid', 'firstName lastName email')
                .populate('marshall', 'firstName lastName email');
            user = user.toObject();
            user.walks = allWalks;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
};

const handleGoogleLogin = async (req, res) => {
    const { email, firstName, lastName, googleId } = req.body;
    
    try {
        // Check if user exists
        let user = await User.findOne({ email });
        
        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                firstName,
                lastName,
                email,
                password: `google_${googleId}`, // You might want to handle this differently
                googleId
            });
        }
        
        const token = generateToken(user);
        res.status(200).json({
            message: 'Login successful',
            token,
            userId: user._id,
            email: user.email,
            role: user.role,
        });
    } catch (error) {
        console.error('Error during Google login:', error);
        res.status(500).json({ error: 'Failed to process Google login' });
    }
};

export { registerUser, loginUser, handleGoogleLogin, getUsers, userProfile };
