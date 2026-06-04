import express from 'express';
import {
    getUserProfile,
    getUsers,
    getUserById,
    updateUser,
    toggleUserStatus,
    createUser
} from '../controllers/userController.js';
// middlewares de validacion

const router = express.Router();

router.get('/users/profile', getUserProfile);
router.get('/users', getUsers);
router.get('/users/:userId', getUserById);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.patch('/toggle-status/:userId', toggleUserStatus);

export default router;