const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const dogRoutes = require('./routes/dogRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const walkRoutes = require('./routes/walkRoutes');
const shelterTimeRoutes = require('./routes/shelterTimeRoutes');
const dogStatsRoutes = require('./routes/dogStatsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const pushNotificationRoutes = require('./routes/pushNotificationRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.uri)
    .then(() => console.log('MongoDB connected successfully'))
    .catch((error) => console.error('MongoDB connection failed:', error));

// Serve uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

// Routes
app.use('/users', userRoutes);
app.use('/dogs', dogRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/walks', walkRoutes);
app.use('/shelter-times', shelterTimeRoutes);
app.use('/stats', dogStatsRoutes);
app.use('/notifications', notificationRoutes);
app.use('/notifications', pushNotificationRoutes); // Using the same base path for push notifications
app.use('/api/email', emailRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});