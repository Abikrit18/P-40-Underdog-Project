const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'p40-underdogs', // The folder in Cloudinary where images will be stored
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], // Allowed image formats
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }], // Optional image transformations
    format: 'jpg', // Force a specific format
    resource_type: 'auto', // Automatically detect resource type
    use_filename: true, // Use original filename as part of the public ID
    unique_filename: true, // Add a unique suffix to avoid name collisions
    overwrite: true, // Overwrite existing files with the same name
    secure: true // Force HTTPS URLs
  }
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

module.exports = {
  cloudinary,
  upload
};
