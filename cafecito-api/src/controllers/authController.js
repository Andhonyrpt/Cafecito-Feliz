import bcrypt from 'bcrypt';
import jwt, { decode } from 'jsonwebtoken';
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
        { expiresIn: '8h' }
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

async function register(req, res, next) {
    try {
        const { displayName, employeeId, password, role, avatar } = req.body;

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

async function login(req, res, next) {
    try {
        const { employeeId, password } = req.body;

        const userExist = await checkUserExist(employeeId);

        if (!userExist) {
            return res.status(400).json({ message: "User doesn't exist. You have to sign in" });
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
                role: userExist.role
            }
        });

    } catch (error) {
        next(error);
    }
};

// async function checkEmail(req, res, next) {
//     try {
//         const email = String(req.query.email || "")
//             .trim()
//             .toLowerCase();

//         const user = await User.findOne({ email });
//         res.json({ taken: !!user });
//     } catch (err) {
//         next(err);
//     }
// }

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

        const newAccessToken = generateToken(
            decoded.userId,
            decoded.displayName,
            decoded.employeeId,
            decoded.role
        );

        res.status(200).json({ token: newAccessToken, refreshToken: token });
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        }

        next(error);
    }
};

async function logout(req, res) {
    res.status(200).json({ message: "Logged out successfully" });
}

export { register, login, refreshToken, logout };