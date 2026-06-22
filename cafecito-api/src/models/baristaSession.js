import mongoose from "mongoose";

const baristaSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    openedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    closedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    }
}, {
    timestamps: true
});

const BaristaSession = mongoose.model('BaristaSession', baristaSessionSchema);

export default BaristaSession;
