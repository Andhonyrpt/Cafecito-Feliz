import express from "express";
import {
    getOrders,
    getOrderById,
    getOrdersByClient,
    createOrder,
    updateOrderStatus,
    previewOrder
} from '../controllers/orderController.js';

const router = express.Router();

router.get('/orders', getOrders);
router.get('/orders/:orderId',getOrderById);
router.get('/orders/:clientId',getOrdersByClient);