const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');

// POST: Upload a single image to Cloudinary
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Cloudinary upload response:', req.file);

        // Cloudinary already uploaded the file, we just need to return the URL
        // Always use secure_url for HTTPS support
        const secureUrl = req.file.secure_url || req.file.path;
        const publicId = req.file.filename || req.file.public_id;

        // Return both URL and public ID for potential deletion
        res.json({
            url: secureUrl, // Use secure URL as the primary URL
            filename: publicId,
            public_id: publicId, // Include public_id explicitly
            original_filename: req.file.originalname
        });
    } catch (error) {
        console.error('Error uploading file to Cloudinary:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// DELETE: Remove an image from Cloudinary by public ID
router.delete('/', (req, res) => {
    try {
        const { filename } = req.body;
        if (!filename) {
            return res.status(400).json({ error: 'No public ID provided' });
        }

        // Delete the image from Cloudinary
        cloudinary.uploader.destroy(filename, (error, result) => {
            if (error) {
                console.error('Error deleting image from Cloudinary:', error);
                return res.status(500).json({ error: 'Error deleting image from Cloudinary' });
            }

            if (result.result === 'ok') {
                return res.json({ message: 'Image deleted successfully from Cloudinary' });
            } else {
                return res.status(404).json({ error: 'Image not found in Cloudinary' });
            }
        });
    } catch (error) {
        console.error('Error in delete route:', error);
        res.status(500).json({ error: 'Error processing delete request' });
    }
});

module.exports = router;