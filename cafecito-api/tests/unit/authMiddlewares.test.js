import jwt from 'jsonwebtoken';
import authMiddleware from '../../src/middlewares/authMiddleware.js';
import isAdmin from '../../src/middlewares/isAdminMiddleware.js';
import { makeNext, makeReq, makeRes } from '../helpers/express.js';

describe('auth middlewares', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
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
            const token = jwt.sign({ userId: 'user-1', role: 'admin' }, process.env.JWT_SECRET, { algorithm: 'HS256' });
            const req = makeReq({ headers: { authorization: `Bearer ${token}` } });
            const res = makeRes();
            const next = makeNext();

            await authMiddleware(req, res, next);

            expect(req.user).toEqual(expect.objectContaining({ userId: 'user-1', role: 'admin' }));
            expect(req.userIsAdmin).toBe(true);
            expect(next).toHaveBeenCalledTimes(1);
            expect(res.status).not.toHaveBeenCalled();
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
