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
    googleId: {
        type: String,
        sparse: true
    },
    profilePicture: {
        url: { type: String, default: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1/profile_pictures/default-avatar' },
        public_id: { type: String }
    }
});

userSchema.methods.hasSignedWaiver = function() {
    return this.waiverSigned;
};

userSchema.methods.signWaiver = function() {
    this.waiverSigned = true;
    return this.save();
};

module.exports = mongoose.model('User', userSchema);
