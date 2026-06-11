import express from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import userRoutes from './userRoutes.js';
import clientRoutes from './clientRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use(userRoutes);
router.use(categoryRoutes);
router.use(productRoutes);
router.use(clientRoutes);

export default router;