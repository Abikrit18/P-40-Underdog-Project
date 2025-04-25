import pkg from 'bcryptjs';
const { hash, compare } = pkg;
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Walk from '../models/walk.js';

// Import the notification controller for sending welcome notifications
import { createSystemNotification } from '../controllers/notificationController.js';

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

        // Send welcome notification with email
        try {
            await createSystemNotification(
                newUser._id,
                `Welcome to P-40 Underdogs, ${firstName}! We're excited to have you join our community.`,
                'user',
                newUser._id,
                'User',
                null,
                true, // Send email
                { action: 'welcome' }
            );
        } catch (notificationError) {
            console.error('Error sending welcome notification:', notificationError);
            // Continue even if notification fails
        }

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

        // Send login notification (in-app only, no email)
        try {
            await createSystemNotification(
                user._id,
                `You have successfully logged in to your account.`,
                'user',
                user._id,
                'User'
            );
        } catch (notificationError) {
            console.error('Error sending login notification:', notificationError);
            // Continue even if notification fails
        }

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
        // Import the UserWalk model
        const UserWalk = await import('../models/UserWalk.js').then(module => module.default);
        const WalkLog = await import('../models/walkLog.js').then(module => module.default);

        // Find the user without populating walks yet
        let user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get the user's walks from the walks array
        const userWalks = [];

        // Populate each walk individually to handle both Walk and UserWalk models
        if (user.walks && user.walks.length > 0) {
            for (const walkId of user.walks) {
                try {
                    // First try to find it as a UserWalk
                    let walk = await UserWalk.findById(walkId)
                        .populate('userid', 'firstName lastName email')
                        .populate('marshall', 'firstName lastName email')
                        .populate('walkId');

                    if (walk) {
                        userWalks.push(walk);
                    } else {
                        // If not found as UserWalk, try as a regular Walk
                        walk = await Walk.findById(walkId)
                            .populate('userid', 'firstName lastName email')
                            .populate('marshall', 'firstName lastName email');

                        if (walk) {
                            userWalks.push(walk);
                        }
                    }
                } catch (err) {
                    console.error(`Error populating walk ${walkId}:`, err);
                    // Continue with the next walk
                }
            }
        }

        // Convert user to a plain object so we can modify it
        user = user.toObject();
        user.walks = userWalks;

        // For admin users, get all walks
        if (user.role === 'admin') {
            // Get all UserWalk records
            const userWalks = await UserWalk.find()
                .populate('userid', 'firstName lastName email')
                .populate('marshall', 'firstName lastName email')
                .populate('walkId');

            // Get all regular Walk records (for backward compatibility)
            const regularWalks = await Walk.find()
                .populate('userid', 'firstName lastName email')
                .populate('marshall', 'firstName lastName email');

            // Combine both types of walks
            user.walks = [...userWalks, ...regularWalks];
        } else if (user.role === 'Marshall') {
            // For marshals, get only scheduled walks where they are the marshal
            // First get all UserWalk records where they are the marshal and status is 'scheduled'
            const marshallUserWalks = await UserWalk.find({
                marshall: user._id,
                status: 'scheduled'
            })
                .populate('userid', 'firstName lastName email')
                .populate('marshall', 'firstName lastName email')
                .populate('walkId');

            // Then get all regular Walk records where they are the marshal and status is 'scheduled'
            // We don't want to include 'available' walks that don't have a user assigned
            const marshallRegularWalks = await Walk.find({
                marshall: user._id,
                status: 'scheduled',
                userid: { $exists: true, $ne: null } // Only include walks with a user assigned
            })
                .populate('userid', 'firstName lastName email')
                .populate('marshall', 'firstName lastName email');

            // Get today's date in YYYY-MM-DD format
            const today = new Date().toISOString().split('T')[0];

            // Combine all scheduled walks and filter for future walks only
            // Don't include userWalks to avoid duplication
            const allMarshallWalks = [...marshallUserWalks, ...marshallRegularWalks]
                .filter(walk => walk.date >= today);

            // For marshals, we want to show all individual user walks
            // Don't group by date and time - show one card per user
            // But filter out any duplicate walks based on their IDs
            const uniqueWalkIds = new Set();
            const uniqueWalks = allMarshallWalks.filter(walk => {
                if (uniqueWalkIds.has(walk._id.toString())) {
                    return false;
                }
                uniqueWalkIds.add(walk._id.toString());
                return true;
            });

            console.log(`Found ${uniqueWalks.length} unique scheduled walks for marshal ${user._id}`);
            user.walks = uniqueWalks;
        }

        // Also get completed walks from walk logs - only include walks that have been explicitly marked as completed or incomplete
        const completedWalks = await WalkLog.find({
            $or: [
                { userId: user._id },
                { marshallId: user._id }
            ],
            status: { $in: ['completed', 'incomplete'] }
        })
        .populate('userId', 'firstName lastName email')
        .populate('marshallId', 'firstName lastName email');

        // Add completed walks to the response
        user.completedWalks = completedWalks;

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

        let isNewUser = false;

        if (!user) {
            // Create new user if doesn't exist
            user = await User.create({
                firstName,
                lastName,
                email,
                password: `google_${googleId}`, // You might want to handle this differently
                googleId
            });
            isNewUser = true;
        }

        const token = generateToken(user);

        // If this is a new user, send a welcome notification with email
        if (isNewUser) {
            try {
                await createSystemNotification(
                    user._id,
                    `Welcome to P-40 Underdogs, ${firstName}! We're excited to have you join our community.`,
                    'user',
                    user._id,
                    'User',
                    null,
                    true, // Send email
                    { action: 'welcome' }
                );
            } catch (notificationError) {
                console.error('Error sending welcome notification:', notificationError);
                // Continue even if notification fails
            }
        } else {
            // Send login notification (in-app only, no email)
            try {
                await createSystemNotification(
                    user._id,
                    `You have successfully logged in to your account with Google.`,
                    'user',
                    user._id,
                    'User'
                );
            } catch (notificationError) {
                console.error('Error sending login notification:', notificationError);
                // Continue even if notification fails
            }
        }

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
