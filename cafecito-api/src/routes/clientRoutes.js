import express from 'express';
import {
    getClients,
    createClient,
    updateClient,
    checkEmail
} from '../controllers/clientController';
import validate from '../middlewares/validation';
import isAdmin from '../middlewares/isAdminMiddleware';
import authMiddleware from '../middlewares/authMiddleware';
import {
    userDisplayNameValidation,
    paginationValidation,
    emailValidation,
    mongoIdValidation,
    queryEmailValidation,

} from '../middlewares/validators';

const router = express.Router();

router.get('/check-email', [queryEmailValidation()], validate, checkEmail);

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


export default router;