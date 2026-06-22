import express from "express";
import {
    getOrders,
    getOrderById,
    getOrdersByClient,
    getMyShiftOrders,
    getAdminSalesSummary,
    getAdminOrders,
    createOrder,
    updateOrderStatus,
    previewOrder
} from '../controllers/orderController.js';
import authMiddleware from "../middlewares/authMiddleware.js";
import isAdmin from "../middlewares/isAdminMiddleware.js";
import validate from "../middlewares/validation.js";
import {
    bodyMongoIdValidation,
    mongoIdValidation,
    orderStatusValidation,
    priceValidation,
    quantityValidation
} from "../middlewares/validators.js";
import { body } from "express-validator";
import { query } from "express-validator";

const router = express.Router();

router.get('/orders', authMiddleware, getOrders);

router.get('/orders/my-shift', authMiddleware, getMyShiftOrders);

router.get('/orders/admin/sales-summary', authMiddleware, isAdmin, [
    query('range')
        .optional()
        .isIn(['day', 'week', 'month', 'year'])
        .withMessage("El rango debe ser 'day', 'week', 'month' o 'year'.")
], validate, getAdminSalesSummary);

router.get('/orders/admin/list', authMiddleware, isAdmin, [
    query('range')
        .optional()
        .isIn(['day', 'week', 'month', 'year'])
        .withMessage("El rango debe ser 'day', 'week', 'month' o 'year'."),
    query('from').optional().isISO8601().withMessage('From must be a valid ISO8601 date'),
    query('to').optional().isISO8601().withMessage('To must be a valid ISO8601 date'),
    query('sellerEmployeeId').optional({ checkFalsy: true }).trim().toUpperCase().matches(/^EMP-\d+$/).withMessage('El vendedor debe tener formato EMP-##'),
    query('baristaEmployeeId').optional({ checkFalsy: true }).trim().toUpperCase().matches(/^EMP-\d+$/).withMessage('El barista debe tener formato EMP-##'),
    query('paymentMethod').optional({ checkFalsy: true }).isIn(['efectivo', 'tarjeta']).withMessage('Método de pago inválido'),
    query('status').optional({ checkFalsy: true }).isIn(['pendiente', 'completado']).withMessage('Estado inválido'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000')
], validate, getAdminOrders);

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
