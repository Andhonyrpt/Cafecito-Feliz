import jwt from 'jsonwebtoken';
import authMiddleware from '../../src/middlewares/authMiddleware.js';
import isAdmin from '../../src/middlewares/isAdminMiddleware.js';
import User from '../../src/models/user.js';
import { makeNext, makeReq, makeRes } from '../helpers/express.js';

describe('auth middlewares', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    describe('authMiddleware', () => {
        it('returns 401 when no bearer token is provided', async () => {
            const req = makeReq();
            const res = makeRes();
            const next = makeNext();

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 403 when token verification fails', async () => {
            const req = makeReq({ headers: { authorization: 'Bearer invalid-token' } });
            const res = makeRes();
            const next = makeNext();

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
            expect(next).not.toHaveBeenCalled();
        });

        it('attaches decoded user, marks admin, and calls next for valid admin token', async () => {
            const user = await User.create({
                displayName: 'Admin User',
                employeeId: 'EMP-700',
                hashPassword: 'hashed',
                role: 'admin',
                avatar: 'http://example.com/avatar.jpg',
                isActive: true
            });

            const token = jwt.sign({ userId: user._id.toString(), role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
            const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
            const res = makeRes();
            const next = makeNext();

            await authMiddleware(req, res, next);

            expect(req.user).toEqual(expect.objectContaining({ userId: user._id.toString(), role: 'admin' }));
            expect(req.userIsAdmin).toBe(true);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });

        it('returns 403 when token belongs to an inactive user', async () => {
            const user = await User.create({
                displayName: 'Inactive User',
                employeeId: 'EMP-701',
                hashPassword: 'hashed',
                role: 'vendedor',
                avatar: 'http://example.com/avatar.jpg',
                isActive: false
            });

            const token = jwt.sign({ userId: user._id.toString(), role: 'vendedor' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
            const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
            const res = makeRes();
            const next = makeNext();

            await authMiddleware(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden' });
            expect(next).not.toHaveBeenCalled();
        });
    });

    describe('isAdmin', () => {
        it('returns 401 when auth user is missing', async () => {
            const req = makeReq();
            const res = makeRes();
            const next = makeNext();

            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ message: 'Authentication required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('returns 403 when user is not admin', async () => {
            const req = makeReq({ user: { role: 'vendedor' } });
            const res = makeRes();
            const next = makeNext();

            await isAdmin(req, res, next);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ message: 'Admin access required' });
            expect(next).not.toHaveBeenCalled();
        });

        it('calls next when user is admin', async () => {
            const req = makeReq({ user: { role: 'admin' } });
            const res = makeRes();
            const next = makeNext();

            await isAdmin(req, res, next);

            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
        });
    });
});
