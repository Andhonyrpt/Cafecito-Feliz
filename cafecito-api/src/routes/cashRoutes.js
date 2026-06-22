import express from 'express';
import {
    getTurnoTotal,
    getAdminCashSessions,
    openCashSession,
    closeCashSession
} from '../controllers/cashSessionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import isAdmin from '../middlewares/isAdminMiddleware.js';
import validate from '../middlewares/validation.js';
import {
    cashSessionsAdminQueryValidation,
    cashCloseValidation,
    cashInitialValidation,
    cashOpenedAtValidation
} from '../middlewares/validators.js';

const router = express.Router();

const validateSellerCashClose = async (req, res, next) => {
    if (req.user?.role !== 'vendedor') {
        return next();
    }

    await Promise.all(cashCloseValidation().map((validation) => validation.run(req)));
    next();
};

router.get('/total-cash/orders', authMiddleware, [
    cashOpenedAtValidation()
], validate, getTurnoTotal);

router.get('/total-cash/admin/sessions', authMiddleware, isAdmin, [
    ...cashSessionsAdminQueryValidation()
], validate, getAdminCashSessions);

router.post('/total-cash/open', authMiddleware, [
    cashInitialValidation()
], validate, openCashSession);

router.post('/total-cash/close', authMiddleware, validateSellerCashClose, validate, closeCashSession);

export default router;
