const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true,
        default: "user"
    },
    walks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Walk' }],
    totalWalks: { type: Number, default: 0 },
    waiverSigned: { type: Boolean, default: false }, 
});

userSchema.methods.hasSignedWaiver = function() {
    return this.waiverSigned;
};

userSchema.methods.signWaiver = function() {
    this.waiverSigned = true;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);