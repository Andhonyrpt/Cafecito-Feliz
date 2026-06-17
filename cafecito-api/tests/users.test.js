import { createAdminWithToken, createUserWithToken } from './helpers/auth.js';
import { makeUserPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Users Module Tests', () => {
    let adminToken = '';
    let userToken = '';
    let testUserId = '';
    let normalUserPayload;

    beforeAll(async () => {
        const admin = await createAdminWithToken({
            displayName: 'Admin User',
            employeeId: 'EMP-01'
        });
        adminToken = admin.token;

        const normalUser = await createUserWithToken({
            displayName: 'Normal User',
            employeeId: 'EMP-02'
        });
        normalUserPayload = normalUser.payload;
        userToken = normalUser.token;
    });

    describe('GET /api/users/profile', () => {
        it('should get current user profile', async () => {
            const res = await api()
                .get('/api/users/profile')
                .set(authHeader(userToken));
            
            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('employeeId', normalUserPayload.employeeId);
            testUserId = res.body.user._id;
        });

        it('should fail if no token provided', async () => {
            const res = await api()
                .get('/api/users/profile');
            
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/users', () => {
        it('should get list of users if admin', async () => {
            const res = await api()
                .get('/api/users')
                .set(authHeader(adminToken));
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('users');
            expect(Array.isArray(res.body.users)).toBe(true);
        });

        it('should fail if normal user tries to get list', async () => {
            const res = await api()
                .get('/api/users')
                .set(authHeader(userToken));
            
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/users/:userId', () => {
        it('should get user by id if admin', async () => {
            const res = await api()
                .get(`/api/users/${testUserId}`)
                .set(authHeader(adminToken));
            
            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('_id', testUserId);
        });
    });

    describe('PUT /api/users/:userId', () => {
        it('should update user if admin', async () => {
            const updatePayload = makeUserPayload({
                displayName: 'Updated User',
                employeeId: normalUserPayload.employeeId,
                role: 'vendedor',
                isActive: true,
                avatar: 'http://example.com/new.jpg'
            });

            const res = await api()
                .put(`/api/users/${testUserId}`)
                .set(authHeader(adminToken))
                .send(updatePayload);
            
            expect(res.status).toBe(200);
            expect(res.body.user).toHaveProperty('displayName', updatePayload.displayName);
        });
    });

    describe('PATCH /api/toggle-status/:userId', () => {
        it('should toggle user status if admin', async () => {
            const res = await api()
                .patch(`/api/toggle-status/${testUserId}`)
                .set(authHeader(adminToken));
            
            expect(res.status).toBe(200);
            expect(res.body.user.isActive).toBe(false);
        });
    });
});
