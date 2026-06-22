import express from 'express';
import {
    getUserProfile,
    getUsers,
    getUserById,
    updateUser,
    toggleUserStatus,
    createUser
} from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import isAdmin from '../middlewares/isAdminMiddleware.js';
import validate from '../middlewares/validation.js';
import {
    displayNameValidation,
    employeeIdValidation,
    passwordValidation,
    roleValidation,
    urlValidation,
    booleanValidation,
    mongoIdValidation,
    userDisplayNameValidation,
    fullPasswordValidation,
    sortFieldValidation,
    orderValidation,
    paginationValidation,
    queryRoleValidation,
    queryIsActiveValidation,
    pinValidation,
    employeeRoleValidation,
    optionalPinValidation
} from '../middlewares/validators.js';

const router = express.Router();

// Validaciones comunes para actualizar perfil
const profileValidations = [
    userDisplayNameValidation(false),
    employeeIdValidation(true),
    urlValidation('avatar')
];

router.get('/users/profile', authMiddleware, getUserProfile);

router.get('/users', authMiddleware, isAdmin, [
    ...paginationValidation(),
    queryRoleValidation(),
    queryIsActiveValidation()
], validate, getUsers);

router.get('/users/:userId', authMiddleware, isAdmin, [
    mongoIdValidation('userId', 'User ID')
], validate, getUserById);

router.post('/users', authMiddleware, isAdmin, [
    userDisplayNameValidation(true),
    employeeIdValidation(),
    pinValidation(),
    urlValidation('avatar'),
    employeeRoleValidation(true),
    booleanValidation('isActive')
], validate, createUser);

router.put('/users/:userId', authMiddleware, isAdmin, [
    mongoIdValidation('userId', 'User ID'),
    ...profileValidations,
    employeeRoleValidation(false),
    optionalPinValidation(),
    booleanValidation('isActive')
], validate, updateUser);

router.patch('/toggle-status/:userId', authMiddleware, isAdmin, [
    mongoIdValidation('userId', 'User ID')
], validate, toggleUserStatus);

export default router;
