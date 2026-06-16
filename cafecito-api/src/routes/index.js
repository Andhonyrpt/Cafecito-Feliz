import express from 'express';
import authRoutes from './authRoutes.js';
import categoryRoutes from './categoryRoutes.js';
import productRoutes from './productRoutes.js';
import userRoutes from './userRoutes.js';
import clientRoutes from './clientRoutes.js';
import orderRoutes from './orderRoutes.js';
import cashRoutes from './cashRoutes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use(userRoutes);
router.use(categoryRoutes);
router.use(productRoutes);
router.use(clientRoutes);
router.use(orderRoutes);
router.use(cashRoutes);

export default router;