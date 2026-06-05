import jwt, { decode } from 'jsonwebtoken';

async function authMiddleware(req, res, next) {
    const token = req.headers['authorization']?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {

        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        req.user = decoded;

        if (decoded.role === 'admin') {
            req.userIsAdmin = true;
        }

        next();
    });
};

export default authMiddleware;