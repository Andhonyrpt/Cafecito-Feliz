import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

describe('Users Module Tests', () => {
    let adminToken = '';
    let userToken = '';
    let testUserId = '';

    beforeAll(async () => {
        // Register an admin
        let res = await request(app).post('/api/auth/register').send({
            displayName: 'Admin User',
            employeeId: 'EMP-01',
            pin: '1234',
            avatar: 'http://example.com/admin.jpg'
        });
        
        // Let's assume there is a way to make them admin or we can mock the isAdmin middleware later.
        // Actually, we must manually update the user to admin in the DB for integration testing.
        const User = mongoose.model('User');
        await User.findOneAndUpdate({ employeeId: 'EMP-01' }, { role: 'admin' });

        res = await request(app).post('/api/auth/login').send({
            employeeId: 'EMP-01',
            password: '1234'
        });
        adminToken = res.body.accessToken;

        // Register a normal user
        res = await request(app).post('/api/auth/register').send({
            displayName: 'Normal User',
            employeeId: 'EMP-02',
            pin: '1234',
            avatar: 'http://example.com/user.jpg'
        });
        
        res = await request(app).post('/api/auth/login').send({
            employeeId: 'EMP-02',
            password: '1234'
        });
        userToken = res.body.accessToken;
    });

    describe('GET /api/users/profile', () => {
        it('should get current user profile', async () => {
            const res = await request(app)
                .get('/api/users/profile')
                .set('Authorization', `Bearer ${userToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('employeeId', 'EMP-02');
            testUserId = res.body._id;
        });

        it('should fail if no token provided', async () => {
            const res = await request(app)
                .get('/api/users/profile');
            
            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/users', () => {
        it('should get list of users if admin', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('users');
            expect(Array.isArray(res.body.users)).toBe(true);
        });

        it('should fail if normal user tries to get list', async () => {
            const res = await request(app)
                .get('/api/users')
                .set('Authorization', `Bearer ${userToken}`);
            
            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/users/:userId', () => {
        it('should get user by id if admin', async () => {
            const res = await request(app)
                .get(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', testUserId);
        });
    });

    describe('PUT /api/users/:userId', () => {
        it('should update user if admin', async () => {
            const res = await request(app)
                .put(`/api/users/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    displayName: 'Updated User',
                    employeeId: 'EMP-02',
                    role: 'empleado',
                    isActive: true,
                    avatar: 'http://example.com/new.jpg'
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('displayName', 'Updated User');
        });
    });

    describe('PATCH /api/toggle-status/:userId', () => {
        it('should toggle user status if admin', async () => {
            const res = await request(app)
                .patch(`/api/toggle-status/${testUserId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body.isActive).toBe(false);
        });
    });
});
