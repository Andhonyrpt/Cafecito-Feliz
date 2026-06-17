import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

// Usaremos datos en duro para crear un usuario directamente en Mongoose o llamando al endpoint.
// Como el entorno de pruebas está limpio, probaremos el registro primero.
describe('Auth Module Tests', () => {
    let authToken = '';
    let refreshToken = '';
    const employeeId = 'EMP-99';
    const testPin = '1234';

    describe('POST /api/auth/register', () => {
        it('should register a new employee successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    displayName: 'Test Employee',
                    employeeId: employeeId,
                    pin: testPin,
                    avatar: 'http://example.com/avatar.jpg'
                });
            
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user).toHaveProperty('employeeId', employeeId);
        });

        it('should fail to register if employeeId is missing', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    displayName: 'Test Employee',
                    pin: testPin,
                    avatar: 'http://example.com/avatar.jpg'
                });
            
            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('errors');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login the employee successfully', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    employeeId: employeeId,
                    password: testPin // the test validator checks this as password
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            
            authToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
        });

        it('should fail login with invalid credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    employeeId: employeeId,
                    password: 'wrong'
                });
            
            expect(res.status).toBe(401);
            expect(res.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/verify-pin', () => {
        it('should verify pin successfully', async () => {
            const res = await request(app)
                .post('/api/auth/verify-pin')
                .send({
                    employeeId: employeeId,
                    pin: testPin
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
            expect(res.body).toHaveProperty('user');
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should get a new access token using a valid refresh token', async () => {
            const res = await request(app)
                .post('/api/auth/refresh')
                .send({
                    token: refreshToken
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should logout successfully', async () => {
            const res = await request(app)
                .post('/api/auth/logout')
                .send({
                    token: refreshToken
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
        });
    });
});
