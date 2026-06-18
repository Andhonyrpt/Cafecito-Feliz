import express from 'express';
import {
    register,
    login,
    refreshToken,
    logout,
    verifyPin,
    checkRole
} from '../controllers/authController.js';
import validate from '../middlewares/validation.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { loginRateLimit, refreshRateLimit, verifyPinRateLimit } from '../middlewares/rateLimit.js';
import {
    displayNameValidation,
    passwordLoginValidation,
    employeeIdValidation,
    employeeIdParamValidation,
    urlValidation
    , pinValidation
} from '../middlewares/validators.js';

const router = express.Router();

router.post('/register', [
    displayNameValidation(),
    employeeIdValidation(),
    pinValidation(),
    urlValidation('avatar')
], validate, register);

router.post('/login', [
    employeeIdValidation(),
    passwordLoginValidation()
], validate, loginRateLimit, login);

router.post('/refresh', refreshRateLimit, refreshToken);

router.post('/logout', logout);

router.post('/verify-pin', authMiddleware, [
    employeeIdValidation(), // Valida formato EMP-XX
    pinValidation()         // Valida que sean exactamente 4 números (enviado como 'password' o 'pin' según tu validador)
], validate, verifyPinRateLimit, verifyPin);

router.get('/check-role/:employeeId', authMiddleware, [
    employeeIdParamValidation()
], validate, checkRole);

export default router;
