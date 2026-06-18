import jwt from 'jsonwebtoken';
import User from '../models/user.js';

async function authMiddleware(req, res, next) {
    const token = req.headers['authorization']?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
        const user = await User.findById(decoded.userId).select('displayName employeeId role isActive');

        if (!user || !user.isActive) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.user = {
            ...decoded,
            userId: user._id.toString(),
            displayName: user.displayName,
            employeeId: user.employeeId,
            role: user.role,
            isActive: user.isActive
        };

        if (user.role === 'admin') {
            req.userIsAdmin = true;
        }

        next();
    } catch (error) {
        return res.status(403).json({ message: 'Forbidden' });
    }
};

export default authMiddleware;
