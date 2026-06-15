import express from 'express';
import {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    searchCategories
} from '../controllers/categoryController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import isAdmin from '../middlewares/isAdminMiddleware.js';
import validate from '../middlewares/validation.js';
import {
    bodyMongoIdValidation,
    generalNameValidation,
    mongoIdValidation,
    urlValidation
} from '../middlewares/validators.js';

const router = express.Router();

router.get('/categories/search', searchCategories); // Ruta pendiente a revision de funcionalidad

router.get('/categories', getCategories);

router.get('/categories/:categoryId', [
    mongoIdValidation('categoryId', 'Category ID')
], validate, getCategoryById);

router.post('/categories', authMiddleware, isAdmin, [
    generalNameValidation('name', true, 100),
    urlValidation('imageUrl'),
    bodyMongoIdValidation('parentCategory', 'Parent category ID', true)
], validate, createCategory);

router.put('/categories/:categoryId', authMiddleware, isAdmin, [
    mongoIdValidation('categoryId', 'Category ID'),
    generalNameValidation('name', false, 100),
    urlValidation('imageUrl'),
    bodyMongoIdValidation('parentCategory', 'Parent category ID', true)
], validate, updateCategory);

router.delete('/categories/:categoryId', authMiddleware, isAdmin, [
    mongoIdValidation('categoryId', 'Category ID')
], validate, deleteCategory);

export default router;