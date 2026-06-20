import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    client: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Client',
        default: null
    },
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
        price: {
            type: Number,
            required: true,
        },
        // Notas específicas que el cliente pidió en su orden
        notes: {
            type: String,
            trim: true,
            default: "" // Si no quiere ninguna modificación, se queda vacío
        }
    }],
    subtotal: {
        type: Number,
        required: true,
        default: 0,
    },
    discount: {
        type: Number,
        required: true,
        default: 0
    },
    tax: {
        type: Number,
        required: true,
        default: 0,
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['efectivo', 'tarjeta']
    },
    orderType: {
        type: String,
        required: true,
        enum: ['local', 'llevar']
    },
    status: {
        type: String,
        required: true,
        enum: ['pendiente', 'completado'],
        default: 'pendiente' // Toda orden nueva arranca en la cola de preparación
    },
    assignedBarista: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    assignedAt: {
        type: Date,
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    orderNumber: {
        type: Number,
        required: true,
        unique: true // Asegura que no se dupliquen números de comanda
    }

}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;
