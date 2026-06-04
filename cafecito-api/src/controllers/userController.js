import User from '../models/user.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

// Obtener perfil del usuario autenticado
const getUserProfile = async (req, res, next) => {
    try {
        const userId = req.user.userId // Middleware de autenticación

        const user = await User.findById(userId).select('-hashPassword');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json({
            message: 'User profile retrieved succesfully',
            user
        });

    } catch (error) {
        next(error);
    }
};

// Obtener todos los usuarios (solo admin)
async function getUsers(req, res, next) {
    try {
        const { page = 1, limit = 10, employeeId, role, isActive } = req.query;

        const filter = {};
        if (employeeId) filter.employeeId = employeeId;
        if (role) filter.role = role;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;

        const users = await User.find(filter)
            .select('-hashPassword')
            .limit(limitNum)
            .skip((pageNum - 1) * limitNum)
            .sort({ _id: -1 });

        const total = await User.countDocuments(filter);

        res.status(200).json({
            message: 'Users retrieved successfully',
            users,
            pagination: {
                total,
                totalPages: Math.ceil(total / limitNum) || 1,
                currentPage: pageNum,
                perPage: limitNum
            }
        });

    } catch (error) {
        next(error);
    }
}

// Obtener usuario por ID (solo admin)
async function getUserById(req, res, next) {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('-hashPassword');

        if (!user) {
            return res.status(404).json({ message: 'User not fouund' });
        }

        res.status(200).json({
            message: 'User retrieved succesfully',
            user
        });

    } catch (error) {
        next(error);
    }
};

// Actualizar usuario (solo admin)
async function updateUser(req, res, next) {
    try {
        const { userId } = req.params;
        const { displayName, role, avatar, isActive } = req.body;

        if (
            !displayName && !role &&
            avatar === undefined &&
            isActive === undefined
        ) {
            return res.status(400).json({
                message: 'At least one field must be provided to update'
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (displayName) user.displayName = displayName;
        if (role) user.role = role;
        if (avatar !== undefined) user.avatar = avatar;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        const updatedUser = await User.findById(userId).select('-hashPassword');

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        next(error);
    }
};

// Activar/Desactivar usuario (solo admin)
async function toggleUserStatus(req, res, next) {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        const updatedUser = await User.findById(userId).select('-hashPassword');
        res.status(200).json({
            message: `User ${user.isActive ? 'activated' : 'deactivated'}successfully`,
            user: updatedUser
        });

    } catch (error) {
        next(error);
    }
};

// Crear usuario (solo admin)
async function createUser(req, res, next) {
    try {
        const { displayName, employeeId, password, role, avatar, isActive } = req.body;

        const saltRounds = 10;
        const hashPassword = await bcrypt.hash(password, saltRounds);

        const newUser = new User({
            displayName,
            employeeId,
            hashPassword,
            role,
            avatar,
            isActive
        });

        await newUser.save();

        const created = await User.findById(newUser._id).select('-hashPassword');

        res.status(201).json({ message: 'User created successfully', user: created });
    } catch (error) {
        next(error);
    }
};

export {
    getUserProfile,
    getUsers, 
    getUserById,
    updateUser,
    toggleUserStatus,
    createUser
};