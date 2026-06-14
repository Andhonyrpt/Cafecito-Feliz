import express from "express";
import {
    getOrders,
    getOrderById,
    getOrdersByClient,
    createOrder,
    updateOrderStatus,
    previewOrder
} from '../controllers/orderController.js';
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get('/orders', getOrders);
router.get('/orders/:orderId', getOrderById);
router.get('/orders/:clientId', getOrdersByClient);
router.post('/orders', authMiddleware, createOrder);
router.post('/orders/preview', previewOrder)
router.patch('/orders/:orderId/status', updateOrderStatus);

export default router;