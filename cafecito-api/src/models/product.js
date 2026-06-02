import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
    },
    imageUrl: {
        type: String,
        default: 'https://placehold.co/800x600.png',
        trim: true
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);

export default Product;