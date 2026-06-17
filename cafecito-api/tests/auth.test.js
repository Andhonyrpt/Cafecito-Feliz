import { makeUserPayload } from './helpers/factories.js';
import { api } from './helpers/http.js';

describe('Auth Module Tests', () => {
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
    });

    describe('POST /api/auth/verify-pin', () => {
        it('should verify pin successfully', async () => {
            const res = await api()
                .post('/api/auth/verify-pin')
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
