import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const generateToken = (userId, displayName, employeeId, role) => {
    return jwt.sign({ userId, displayName, employeeId, role },
        process.env.JWT_SECRET,
        { expiresIn: '1hr' }
    );
};

const generateRefreshToken = (userId, displayName, employeeId, role) => {
    return jwt.sign({ userId, displayName, employeeId, role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: '1d' }
    );
};

const checkUserExist = async (employeeId) => {
    const user = await User.findOne({ employeeId });
    return user;
}

const generatePassword = async (password) => {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               password:
 *                 type: string
 *               avatar:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 */
async function register(req, res, next) {
    try {
        const { displayName, employeeId, password, avatar } = req.body;
        const role = 'vendedor';

        const userExist = await checkUserExist(employeeId);

        if (userExist) {
            return res.status(201).json({ displayName, employeeId, role })
        }

        const hashPassword = await generatePassword(password);

        const newUser = new User({
            displayName,
            employeeId,
            hashPassword,
            role,
            avatar
        });

        await newUser.save();

        return res.status(201).json({ displayName, employeeId, role });

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión de usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       400:
 *         description: Credenciales inválidas
 */
async function login(req, res, next) {
    try {
        const { employeeId, password } = req.body;

        const userExist = await checkUserExist(employeeId);

        if (!userExist) {
            return res.status(400).json({ message: "User doesn't exist. You have to sign in" });
        }

        if (!userExist.isActive) {
            return res.status(403).json({ message: 'User is inactive' });
        }

        const isMatch = await bcrypt.compare(password, userExist.hashPassword);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const token = generateToken(
            userExist._id,
            userExist.displayName,
            userExist.employeeId,
            userExist.role
        );

        const refreshToken = generateRefreshToken(
            userExist._id,
            userExist.displayName,
            userExist.employeeId,
            userExist.role
        );

        res.status(200).json({
            token,
            refreshToken,
            user: {
                id: userExist._id,
                displayName: userExist.displayName,
                employeeId: userExist.employeeId,
                role: userExist.role,
                avatar: userExist.avatar
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresca el token de acceso
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refrescado exitosamente
 *       401:
 *         description: No se proporcionó token de refresco
 *       403:
 *         description: Token inválido o expirado
 */
async function refreshToken(req, res, next) {
    try {
        let token = req.body?.refreshToken;

        if (!token) {
            return res.status(401).json({ message: 'No refresh token provided' });
        }

        if (typeof token === 'string' && token.includes('refeshToken=')) {
            token = token.split('refreshToken=')[1].split(';')[0];
        }

        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                if (err) reject(err);
                else resolve(decoded);
            });
        });

        const activeUser = await User.findById(decoded.userId).select('displayName employeeId role isActive');

        if (!activeUser || !activeUser.isActive) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        const newAccessToken = generateToken(
            activeUser._id,
            activeUser.displayName,
            activeUser.employeeId,
            activeUser.role
        );

        res.status(200).json({ token: newAccessToken, refreshToken: token });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        next(error);
    }
};

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cierra sesión de usuario
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 */
async function logout(req, res, next) {
    res.status(200).json({ message: "Logged out successfully" });
}

/**
 * @openapi
 * /api/auth/verify-pin:
 *   post:
 *     summary: Verifica el PIN del usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: PIN verificado correctamente
 *       401:
 *         description: PIN incorrecto
 *       404:
 *         description: Usuario no encontrado o inactivo
 */
async function verifyPin(req, res, next) {
    try {
        const { employeeId, password } = req.body;

        const user = await User.findOne({ employeeId });

        if (!user || !user.isActive) {
            return res.status(404).json({ message: 'User not found ' });
        }

        const isMatch = await bcrypt.compare(password, user.hashPassword);

        if (!isMatch) {
            return res.status(401).json({ message: 'EL PIN es incorrecto' })
        }

        res.status(200).json({ success: true, message: "PIN verificado correctamente." });

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/auth/check-role/{employeeId}:
 *   get:
 *     summary: Comprueba el rol de un usuario
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rol del usuario obtenido
 */
async function checkRole(req, res, next) {
    try {
        const { employeeId } = req.params;
        const user = await User.findOne({ employeeId });

        if (!user || !user.isActive) {
            return res.status(200).json({ role: 'unknown' });
        }

        res.status(200).json({ role: user.role });
    } catch (error) {
        next(error);
    }
};

export { register, login, refreshToken, logout, verifyPin,checkRole };
