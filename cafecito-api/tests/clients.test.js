import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

describe('Clients Module Tests', () => {
    let empToken = '';
    let clientId = '';

    beforeAll(async () => {
        await request(app).post('/api/auth/register').send({
            displayName: 'Emp Client',
            employeeId: 'EMP-cli',
            pin: '1234',
            avatar: 'http://example.com/emp.jpg'
        });
        const resEmp = await request(app).post('/api/auth/login').send({ employeeId: 'EMP-cli', password: '1234' });
        empToken = resEmp.body.accessToken;
    });

    describe('POST /api/clients', () => {
        it('should create a client', async () => {
            const res = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    displayName: 'John Doe',
                    email: 'john@example.com'
                });
            
            expect(res.status).toBe(201);
            expect(res.body.client).toHaveProperty('email', 'john@example.com');
            clientId = res.body.client._id;
        });

        it('should fail if email is invalid', async () => {
            const res = await request(app)
                .post('/api/clients')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    displayName: 'Jane Doe',
                    email: 'invalid-email'
                });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/clients/check-email', () => {
        it('should check if email exists', async () => {
            const res = await request(app).get('/api/clients/check-email?email=john@example.com');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('exists');
        });
    });

    describe('GET /api/clients/search', () => {
        it('should search clients', async () => {
            const res = await request(app)
                .get('/api/clients/search?query=john')
                .set('Authorization', `Bearer ${empToken}`);
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });
    });

    describe('PUT /api/clients/:clientId', () => {
        it('should update client', async () => {
            const res = await request(app)
                .put(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    displayName: 'John Updated',
                    email: 'john2@example.com'
                });
            expect(res.status).toBe(200);
            expect(res.body.client).toHaveProperty('displayName', 'John Updated');
        });
    });
});
