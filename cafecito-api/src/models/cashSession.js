const mongoose = require('mongoose');

const cashSessionSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    openedAt: {
        type: Date,
        required: true, default:
            Date.now
    },
    closedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    initialCash: {
        type: Number,
        required: true
    },

    // Totales calculados por el sistema al momento del cierre
    totalSales: {
        type: Number,
        default: 0
    },
    expectedCash: {
        type: Number,
        default: 0
    },

    // Auditoría (Lo que responde el vendedor)
    isCashCorrect: {
        type: Boolean
    },
    discrepancyReason: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const CashSession = mongoose.model('CashSession', cashSessionSchema);

export default CashSession;