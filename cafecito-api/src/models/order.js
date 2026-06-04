import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        // Notas específicas que el cliente pidió en su orden
        notes: {
            type: String,
            trim: true,
            default: "" // Si no quiere ninguna modificación, se queda vacío
        }
    }],
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    } // Efectivo o Tarjeta

}, {
    timestamps: true
});