import express from "express";
import {
    getOrders,
    getOrderById,
    getOrdersByClient,
    getMyShiftOrders,
    createOrder,
    updateOrderStatus,
    previewOrder
} from '../controllers/orderController.js';
import authMiddleware from "../middlewares/authMiddleware.js";
import validate from "../middlewares/validation.js";
import {
    bodyMongoIdValidation,
    mongoIdValidation,
    orderStatusValidation,
    priceValidation,
    quantityValidation
} from "../middlewares/validators.js";
import { body } from "express-validator";

const router = express.Router();

router.get('/orders', authMiddleware, getOrders);

router.get('/orders/my-shift', authMiddleware, getMyShiftOrders);

router.get('/orders/:orderId', authMiddleware, [
    mongoIdValidation('orderId', 'Order ID')
], validate, getOrderById);

router.get('/orders/client/:clientId', authMiddleware, [
    mongoIdValidation('clientId', 'Client ID')
], validate, getOrdersByClient);

router.post('/orders', authMiddleware, [
    bodyMongoIdValidation('client', 'Client ID', true),
    body('products').notEmpty()
        .withMessage('Products are required')
        .isArray({ min: 1 })
        .withMessage("Products must be a non-empty array"),
    bodyMongoIdValidation('products.*.productId', 'Product ID'),
    quantityValidation('products.*.quantity'),
    body("paymentMethod")
        .notEmpty()
        .withMessage("El método de pago es obligatorio.")
        .isIn(["efectivo", "tarjeta"])
        .withMessage("El método de pago debe ser 'efectivo' o 'tarjeta'."),
    body("orderType")
        .notEmpty()
        .withMessage("El tipo de orden es obligatorio.")
        .isIn(["local", "llevar"])
        .withMessage("El tipo de orden debe ser 'local' o 'llevar'."),
], validate, createOrder);

router.post('/orders/preview', authMiddleware, [
    bodyMongoIdValidation('client', 'Client ID', true),
    body('products').notEmpty()
        .withMessage('Products are required')
        .isArray({ min: 1 })
        .withMessage("Products must be a non-empty array"),
    bodyMongoIdValidation('products.*.productId', 'Product ID'),
    quantityValidation('products.*.quantity'),
], validate, previewOrder)

router.patch('/orders/:orderId/status', authMiddleware, [
    mongoIdValidation('orderId', 'Order ID'),
    orderStatusValidation()
], validate, updateOrderStatus);

export default router;
