import express from 'express';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';

const router = express.Router();

router.use(categoryRoutes);
router.use(productRoutes);

export default router;