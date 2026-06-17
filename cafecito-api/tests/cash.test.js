import request from 'supertest';
import { app } from '../server.js';

describe('Cash Module Tests', () => {
    let empToken = '';

    beforeAll(async () => {
        await request(app).post('/api/auth/register').send({
            displayName: 'Emp Cash',
            employeeId: 'EMP-07',
            password: '12345',
            avatar: 'http://example.com/emp.jpg'
        });
        const resEmp = await request(app).post('/api/auth/login').send({ employeeId: 'EMP-07', password: '12345' });
        empToken = resEmp.body.token;
    });

    describe('POST /api/total-cash/open', () => {
        it('should open cash session', async () => {
            const res = await request(app)
                .post('/api/total-cash/open')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    initialCash: 500
                });
            // Depending on logic, it might return 200 or 201
            expect([200, 201]).toContain(res.status);
            expect(res.body).toHaveProperty('session');
        });

        it('should fail if initial amount is negative', async () => {
            const res = await request(app)
                .post('/api/total-cash/open')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    initialCash: -100
                });
            expect(res.status).toBe(422);
        });
    });

    describe('GET /api/total-cash/orders', () => {
        it('should get total cash for a shift', async () => {
            const openedAt = new Date().toISOString();
            const res = await request(app)
                .get(`/api/total-cash/orders?openedAt=${openedAt}`)
                .set('Authorization', `Bearer ${empToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('cashSales');
        });
    });

    describe('POST /api/total-cash/close', () => {
        it('should close cash session', async () => {
            const res = await request(app)
                .post('/api/total-cash/close')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    pin: '12345',
                    isCashCorrect: true
                });
            expect([200, 201]).toContain(res.status);
        });
    });
});
