import { makeUserPayload } from './helpers/factories.js';
import { api } from './helpers/http.js';
import mongoose from 'mongoose';

describe('Auth Module Tests', () => {
    let accessToken = '';
    let refreshToken = '';
    const userPayload = makeUserPayload({
        displayName: 'Test Employee',
        employeeId: 'EMP-99'
    });

    describe('POST /api/auth/register', () => {
        it('should register a new employee successfully', async () => {
            const res = await api()
                .post('/api/auth/register')
                .send(userPayload);
            
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('employeeId', userPayload.employeeId);
        });

        it('should fail to register if employeeId is missing', async () => {
            const { employeeId, ...payloadWithoutEmployeeId } = makeUserPayload();

            const res = await api()
                .post('/api/auth/register')
                .send(payloadWithoutEmployeeId);
            
            expect(res.status).toBe(422);
            expect(res.body).toHaveProperty('errors');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login the employee successfully', async () => {
            const res = await api()
                .post('/api/auth/login')
                .send({
                    employeeId: userPayload.employeeId,
                    password: userPayload.password
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body).toHaveProperty('refreshToken');
            
            accessToken = res.body.token;
            refreshToken = res.body.refreshToken;
        });

        it('should fail login with invalid credentials', async () => {
            const res = await api()
                .post('/api/auth/login')
                .send({
                    employeeId: userPayload.employeeId,
                    password: 'wrong'
                });
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message');
        });

        it('should reject login when the user is inactive', async () => {
            const User = mongoose.model('User');
            await User.findOneAndUpdate({ employeeId: userPayload.employeeId }, { isActive: false });

            const res = await api()
                .post('/api/auth/login')
                .send({
                    employeeId: userPayload.employeeId,
                    password: userPayload.password
                });

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message', 'User is inactive');

            await User.findOneAndUpdate({ employeeId: userPayload.employeeId }, { isActive: true });
        });
    });

    describe('POST /api/auth/verify-pin', () => {
        it('should verify pin successfully', async () => {
            const res = await api()
                .post('/api/auth/verify-pin')
                .set('Authorization', `Bearer ${accessToken}`)
                .send({
                    employeeId: userPayload.employeeId,
                    password: userPayload.password
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('success', true);
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should get a new access token using a valid refresh token', async () => {
            const res = await api()
                .post('/api/auth/refresh')
                .send({
                    refreshToken: refreshToken
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('token');
        });

        it('should reject refresh when the user is inactive', async () => {
            const User = mongoose.model('User');
            await User.findOneAndUpdate({ employeeId: userPayload.employeeId }, { isActive: false });

            const res = await api()
                .post('/api/auth/refresh')
                .send({
                    refreshToken: refreshToken
                });

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message', 'Invalid or expired refresh token');

            await User.findOneAndUpdate({ employeeId: userPayload.employeeId }, { isActive: true });
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const res = await api()
                .post('/api/auth/logout')
                .send({
                    token: refreshToken
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
        });
    });
});
