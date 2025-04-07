const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import the User model
const { registerUser, loginUser, handleGoogleLogin, getUsers, userProfile } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google-login', handleGoogleLogin);
router.get('/', getUsers);
router.get('/profile/:id', userProfile);

router.post('/waiver/sign', async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Update the waiverSigned field to true
        user.waiverSigned = true;
        await user.save();

        res.status(200).json({ message: "Waiver signed successfully!" });
    } catch (error) {
        console.error("Error signing waiver:", error);
        res.status(500).json({ message: "Failed to sign waiver. Please try again later." });
    }
});

router.put('/:id/role', async (req, res) => {
    try {
        const { role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ message: "User role updated successfully", user: updatedUser });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Failed to update user role" });
    }
});
// **Delete User Route**
router.delete('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(403).json({ error: "Admins cannot be deleted." });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "User deleted successfully" });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

module.exports = router;
router.get('/waiver/status/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        res.status(200).json({ signed: user.waiverSigned });
    } catch (error) {
        console.error("Error fetching waiver status:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});
