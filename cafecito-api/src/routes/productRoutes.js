import express from 'express';
import {
    getProducts,
    getProductById,
    getProductByCategory,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import isAdmin from '../middlewares/isAdminMiddleware.js';
import {
    bodyMongoIdValidation,
    imageUrlValidation,
    mongoIdValidation,
    paginationValidation,
    priceOptionalValidation,
    priceValidation,
    productNameValidation,
    stockValidation
} from '../middlewares/validators.js';

const router = express.Router();

router.get('/products', [
    paginationValidation()
], validate, getProducts);

router.get('/products/:id', [
    mongoIdValidation('productId', 'Product ID')
], validate, getProductById);

router.get('/products/category/:idCategory', [
    mongoIdValidation('categoryId', 'Category ID')
], validate, getProductByCategory);

router.post('/products', authMiddleware, isAdmin, [
    productNameValidation(true),
    priceValidation('price'),
    stockValidation('stock'),
    imageUrlValidation('imageUrl', true),
    bodyMongoIdValidation('parentCategory', 'Parent category ID')
], validate, createProduct);

router.put('/products/:id', authMiddleware, isAdmin, [
    mongoIdValidation('productId', 'Product ID'),
    productNameValidation(false),
    priceOptionalValidation('price'),
    stockValidation('stock'),
    imageUrlValidation('imageUrl', false),
    bodyMongoIdValidation('parentCategory', 'Parent category ID', true)
], validate, updateProduct);

router.delete('/products/:productId', authMiddleware, isAdmin, [
    mongoIdValidation('productId', 'Product ID')
], validate, deleteProduct);

export default router;