import User from '../models/user.js';
import bcrypt from 'bcrypt';

/**
 * @openapi
 * /api/users/profile:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Perfil de usuario obtenido
 */
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

/**
 * @openapi
 * /api/users:
 *   get:
 *     summary: Obtiene todos los usuarios
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 */
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

/**
 * @openapi
 * /api/users/{userId}:
 *   get:
 *     summary: Obtiene un usuario por su ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario obtenido
 *       404:
 *         description: Usuario no encontrado
 */
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

/**
 * @openapi
 * /api/users/{userId}:
 *   put:
 *     summary: Actualiza un usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
async function updateUser(req, res, next) {
    try {
        const { userId } = req.params;
        const { displayName, employeeId, role, avatar, isActive, password } = req.body;

        if (
            !displayName && !role &&
            !employeeId &&
            avatar === undefined &&
            isActive === undefined &&
            !password
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
        if (employeeId) user.employeeId = employeeId;
        if (role) user.role = role;
        if (avatar !== undefined) user.avatar = avatar;
        if (isActive !== undefined) user.isActive = isActive;
        if (password) user.hashPassword = await bcrypt.hash(password, 10);

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

/**
 * @openapi
 * /api/users/toggle-status/{userId}:
 *   patch:
 *     summary: Activa/Desactiva un usuario
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado del usuario actualizado
 *       404:
 *         description: Usuario no encontrado
 */
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

/**
 * @openapi
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Users]
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */
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
