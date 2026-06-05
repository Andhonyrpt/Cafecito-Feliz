import express from 'express';
import {
    register,
    login,
    refreshToken,
    logout
} from '../controllers/authController.js';
import validate from '../middlewares/validation.js';
import {
    displayNameValidation,
    passwordValidation,
    passwordLoginValidation,
    employeeIdValidation,
    urlValidation
} from '../middlewares/validators.js';

const router = express.Router();

router.post('/register', [
    displayNameValidation(),
    employeeIdValidation(),
    passwordValidation(),
    urlValidation('avatar')
], validate, register);

router.post('/login', [
    employeeIdValidation(),
    passwordLoginValidation()
], validate, login);

router.post('/refresh', refreshToken);

router.post('/logout', logout);

export default router;