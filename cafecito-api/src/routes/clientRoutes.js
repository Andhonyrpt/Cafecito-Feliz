import express from 'express';
import {
    getClients,
    createClient,
    updateClient,
    checkEmail,
    searchClient
} from '../controllers/clientController.js';
import validate from '../middlewares/validation.js';
import isAdmin from '../middlewares/isAdminMiddleware.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
    userDisplayNameValidation,
    paginationValidation,
    emailValidation,
    mongoIdValidation,
    queryEmailValidation,

} from '../middlewares/validators.js';

const router = express.Router();

router.get('/clients/check-email', [queryEmailValidation()], validate, checkEmail);

router.get('/clients', authMiddleware, isAdmin, [
    ...paginationValidation()
], validate, getClients);

router.post('/clients', authMiddleware, [
    userDisplayNameValidation(true),
    emailValidation(),
], validate, createClient);

router.put('/clients/:clientId', authMiddleware, [
    mongoIdValidation('clientId', 'Client ID'),
    userDisplayNameValidation(false),
    emailValidation()
], validate, updateClient);

router.get('/clients/search', authMiddleware, searchClient);

export default router;