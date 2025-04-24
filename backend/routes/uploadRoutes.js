const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { verifyToken } = require('../middleware/auth');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'profile_pictures',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
    }
});

// Configure multer
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Test route to verify the endpoint is working
router.get('/test', (req, res) => {
    res.json({ message: 'Upload route is working' });
});

// Upload route
router.post('/', verifyToken, upload.single('image'), (req, res) => {
    try {
        console.log('Upload request received');
        console.log('Request file:', req.file);
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        res.json({
            url: req.file.path,
            public_id: req.file.filename,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

module.exports = router;
