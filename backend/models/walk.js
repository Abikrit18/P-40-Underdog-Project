const mongoose = require('mongoose');

const walkSchema = new mongoose.Schema({
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    marshall: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'completed', 'cancelled'],
        default: 'available'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Walk || mongoose.model('Walk', walkSchema);