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
import {
    displayNameValidation,
    passwordValidation,
    passwordLoginValidation,
    employeeIdValidation,
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
], validate, login);

router.post('/refresh', refreshToken);

router.post('/logout', logout);

router.post('/verify-pin', [
    employeeIdValidation(), // Valida formato EMP-XX
    pinValidation()         // Valida que sean exactamente 4 números (enviado como 'password' o 'pin' según tu validador)
], validate, verifyPin);

router.get('/check-role/:employeeId', checkRole);

export default router;