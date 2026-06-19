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

router.post('/total-cash/open', authMiddleware, [
    cashInitialValidation()
], validate, openCashSession);

router.post('/total-cash/close', authMiddleware, validateSellerCashClose, validate, closeCashSession);

export default router;
