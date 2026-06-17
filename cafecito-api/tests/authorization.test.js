import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createUserWithToken } from './helpers/auth.js';
import { api, authHeader } from './helpers/http.js';

describe('Authorization regression tests', () => {
    const objectId = () => new mongoose.Types.ObjectId().toString();
    let userToken = '';

    beforeAll(async () => {
        const user = await createUserWithToken({
            displayName: 'Authorization User',
            employeeId: 'EMP-401'
        });
        userToken = user.token;
    });

    const protectedEndpoints = [
        ['GET', '/api/users/profile', '/api/users/profile'],
        ['GET', '/api/users', '/api/users'],
        ['GET', '/api/users/:userId', () => `/api/users/${objectId()}`],
        ['POST', '/api/users', '/api/users'],
        ['PUT', '/api/users/:userId', () => `/api/users/${objectId()}`],
        ['PATCH', '/api/toggle-status/:userId', () => `/api/toggle-status/${objectId()}`],
        ['POST', '/api/categories', '/api/categories'],
        ['PUT', '/api/categories/:categoryId', () => `/api/categories/${objectId()}`],
        ['DELETE', '/api/categories/:categoryId', () => `/api/categories/${objectId()}`],
        ['POST', '/api/products', '/api/products'],
        ['PUT', '/api/products/:productId', () => `/api/products/${objectId()}`],
        ['DELETE', '/api/products/:productId', () => `/api/products/${objectId()}`],
        ['GET', '/api/clients', '/api/clients'],
        ['POST', '/api/clients', '/api/clients'],
        ['PUT', '/api/clients/:clientId', () => `/api/clients/${objectId()}`],
        ['GET', '/api/clients/search', '/api/clients/search'],
        ['GET', '/api/orders', '/api/orders'],
        ['GET', '/api/orders/:orderId', () => `/api/orders/${objectId()}`],
        ['GET', '/api/orders/client/:clientId', () => `/api/orders/client/${objectId()}`],
        ['POST', '/api/orders', '/api/orders'],
        ['POST', '/api/orders/preview', '/api/orders/preview'],
        ['PATCH', '/api/orders/:orderId/status', () => `/api/orders/${objectId()}/status`],
        ['GET', '/api/total-cash/orders', '/api/total-cash/orders'],
        ['POST', '/api/total-cash/open', '/api/total-cash/open'],
        ['POST', '/api/total-cash/close', '/api/total-cash/close']
    ];

    const adminOnlyEndpoints = [
        ['GET', '/api/users', '/api/users'],
        ['GET', '/api/users/:userId', () => `/api/users/${objectId()}`],
        ['POST', '/api/users', '/api/users'],
        ['PUT', '/api/users/:userId', () => `/api/users/${objectId()}`],
        ['PATCH', '/api/toggle-status/:userId', () => `/api/toggle-status/${objectId()}`],
        ['POST', '/api/categories', '/api/categories'],
        ['PUT', '/api/categories/:categoryId', () => `/api/categories/${objectId()}`],
        ['DELETE', '/api/categories/:categoryId', () => `/api/categories/${objectId()}`],
        ['POST', '/api/products', '/api/products'],
        ['PUT', '/api/products/:productId', () => `/api/products/${objectId()}`],
        ['DELETE', '/api/products/:productId', () => `/api/products/${objectId()}`],
        ['GET', '/api/clients', '/api/clients']
    ];

    const send = (method, path) => api()[method.toLowerCase()](typeof path === 'function' ? path() : path);

    it.each(protectedEndpoints)('returns 401 without token for %s %s', async (method, label, path) => {
        const res = await send(method, path);

        expect(res.status).toBe(401);
        expect(res.body).toHaveProperty('message', 'Unauthorized');
    });

    it('returns 403 for malformed bearer token', async () => {
        const res = await api()
            .get('/api/users/profile')
            .set(authHeader('invalid-token'));

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message', 'Forbidden');
    });

    it('returns 403 for expired bearer token', async () => {
        const expiredToken = jwt.sign(
            { userId: objectId(), role: 'vendedor' },
            process.env.JWT_SECRET,
            { algorithm: 'HS256', expiresIn: '-1s' }
        );

        const res = await api()
            .get('/api/users/profile')
            .set(authHeader(expiredToken));

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message', 'Forbidden');
    });

    it.each(adminOnlyEndpoints)('returns 403 for non-admin token on %s %s', async (method, label, path) => {
        const res = await send(method, path).set(authHeader(userToken));

        expect(res.status).toBe(403);
        expect(res.body).toHaveProperty('message', 'Admin access required');
    });
});
