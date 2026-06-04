import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    displayName: {
        type: String,
        required: true,
        trim: true
    },
    employeeId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    hashPassword: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ['admin', 'vendedor', 'barista'],
        default: 'vendedor'
    },
    avatar: {
        type: String,
        required: true,
        default: 'https://placehold.co/100x100.png'
    },
    isActive: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;