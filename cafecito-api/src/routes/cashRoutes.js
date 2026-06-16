import express from 'express';
import {
    getTurnoTotal,
    openCashSession,
    closeCashSession
} from '../controllers/cashSessionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validation.js';
import {
    cashCloseValidation,
    cashInitialValidation,
    cashOpenedAtValidation
} from '../middlewares/validators.js';

const router = express.Router();

router.get('/total-cash/orders', authMiddleware, [
    cashOpenedAtValidation()
], validate, getTurnoTotal);

router.post('/total-cash/open', authMiddleware, [
    cashInitialValidation()
], validate, openCashSession);

router.post('/total-cash/close', authMiddleware, [
    cashCloseValidation()
], validate, closeCashSession);

export default router;