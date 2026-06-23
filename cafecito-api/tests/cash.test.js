import mongoose from 'mongoose';
import { createAdminWithToken, createBaristaWithToken, createUserWithToken } from './helpers/auth.js';
import { makeCategoryPayload, makeClientPayload, makeOrderPayload, makeProductPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Cash Module Tests', () => {
    let empToken = '';
    let adminToken = '';

    beforeAll(async () => {
        const admin = await createAdminWithToken({
            displayName: 'Admin Cash',
            employeeId: 'EMP-070'
        });
        adminToken = admin.token;

        const employee = await createUserWithToken({
            displayName: 'Emp Cash',
            employeeId: 'EMP-07'
        });
        empToken = employee.token;
    });

    describe('GET /api/total-cash/admin/sessions', () => {
        it('should list cash sessions if admin', async () => {
            const res = await api()
                .get('/api/total-cash/admin/sessions')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('sessions');
            expect(res.body).toHaveProperty('summary');
            expect(res.body).toHaveProperty('pagination');
            expect(Array.isArray(res.body.sessions)).toBe(true);
        });

        it('should filter sessions by status if admin', async () => {
            const res = await api()
                .get('/api/total-cash/admin/sessions?status=open')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.sessions.every((session) => session.status === 'open')).toBe(true);
        });

        it('should filter sessions by explicit date range and employee id', async () => {
            const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const to = new Date().toISOString().slice(0, 10);

            const res = await api()
                .get(`/api/total-cash/admin/sessions?from=${from}&to=${to}&employeeId=EMP-07&page=1&limit=5`)
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('sessions');
            expect(res.body).toHaveProperty('pagination');
        });

        it('should not include barista operational sessions in cash sessions', async () => {
            const barista = await createBaristaWithToken({
                displayName: 'Barista Shift Metrics',
                employeeId: 'EMP-074'
            });

            const opened = await api()
                .post('/api/total-cash/open')
                .set(authHeader(barista.token))
                .send({ initialCash: 0 });

            expect(opened.status).toBe(200);
            expect(opened.body).toHaveProperty('session', null);
            expect(opened.body).toHaveProperty('baristaSession');

            const res = await api()
                .get('/api/total-cash/admin/sessions')
                .set(authHeader(adminToken));

            const session = res.body.sessions.find((session) => session.user?.employeeId === 'EMP-074');

            expect(res.status).toBe(200);
            expect(session).toBeUndefined();
        });

        it('should fail if seller tries to list cash sessions', async () => {
            const res = await api()
                .get('/api/total-cash/admin/sessions')
                .set(authHeader(empToken));

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/total-cash/active', () => {
        it('should get null session when none is active', async () => {
            const user = await createUserWithToken({
                displayName: 'Active Session User',
                employeeId: 'EMP-078'
            });

            const res = await api()
                .get('/api/total-cash/active')
                .set(authHeader(user.token));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('session', null);
        });

        it('should get the active session when open', async () => {
            const user = await createUserWithToken({
                displayName: 'Active Session User 2',
                employeeId: 'EMP-079'
            });

            await api()
                .post('/api/total-cash/open')
                .set(authHeader(user.token))
                .send({ initialCash: 100 });

            const res = await api()
                .get('/api/total-cash/active')
                .set(authHeader(user.token));

            expect(res.status).toBe(200);
            expect(res.body.session).not.toBeNull();
            expect(res.body.session.initialCash).toBe(100);
        });
    });

    describe('POST /api/total-cash/open', () => {
        it('should open cash session', async () => {
            const res = await api()
                .post('/api/total-cash/open')
                .set(authHeader(empToken))
                .send({
                    initialCash: 500
                });
            // Depending on logic, it might return 200 or 201
            expect([200, 201]).toContain(res.status);
            expect(res.body).toHaveProperty('session');
        });

        it('should fail if initial amount is negative', async () => {
            const res = await api()
                .post('/api/total-cash/open')
                .set(authHeader(empToken))
                .send({
                    initialCash: -100
                });
            expect(res.status).toBe(422);
        });

        it('should assign unassigned pending orders when a barista opens a session', async () => {
            const BaristaSession = mongoose.model('BaristaSession');
            await BaristaSession.deleteMany({ status: 'open' });

            const seller = await createUserWithToken({
                displayName: 'Cash Assignment Seller',
                employeeId: 'EMP-076'
            });
            const barista = await createBaristaWithToken({
                displayName: 'Cash Assignment Barista',
                employeeId: 'EMP-077'
            });

            await api()
                .post('/api/total-cash/open')
                .set(authHeader(seller.token))
                .send({ initialCash: 100 });

            const category = await api()
                .post('/api/categories')
                .set(authHeader(adminToken))
                .send(makeCategoryPayload({ name: 'Cash Assignment Category' }));

            const product = await api()
                .post('/api/products')
                .set(authHeader(adminToken))
                .send(makeProductPayload(category.body._id, {
                    name: 'Cash Assignment Product',
                    stock: 10,
                    price: 25
                }));

            const client = await api()
                .post('/api/clients')
                .set(authHeader(seller.token))
                .send(makeClientPayload({ displayName: 'Cash Assignment Client' }));

            const order = await api()
                .post('/api/orders')
                .set(authHeader(seller.token))
                .send(makeOrderPayload({
                    client: client.body.client._id,
                    productId: product.body._id
                }));

            expect(order.status).toBe(201);
            expect(order.body.assignedBarista).toBeNull();

            const opened = await api()
                .post('/api/total-cash/open')
                .set(authHeader(barista.token))
                .send({ initialCash: 0 });

            expect(opened.status).toBe(200);

            const orders = await api()
                .get('/api/orders')
                .set(authHeader(barista.token));

            expect(orders.status).toBe(200);
            expect(orders.body.orders.some((pendingOrder) => pendingOrder._id === order.body._id)).toBe(true);
        });
    });

    describe('GET /api/total-cash/orders', () => {
        it('should get total cash for a shift', async () => {
            const openedAt = new Date().toISOString();
            const res = await api()
                .get(`/api/total-cash/orders?openedAt=${openedAt}`)
                .set(authHeader(empToken));
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('cashSales');
        });
    });

    describe('POST /api/total-cash/close', () => {
        it('should close admin session without creating an operational cash shift', async () => {
            const admin = await createAdminWithToken({
                displayName: 'Admin Cash Close',
                employeeId: 'EMP-073'
            });

            const opened = await api()
                .post('/api/total-cash/open')
                .set(authHeader(admin.token))
                .send({ initialCash: 0 });

            expect(opened.status).toBe(200);
            expect(opened.body).toHaveProperty('session', null);

            const res = await api()
                .post('/api/total-cash/close')
                .set(authHeader(admin.token))
                .send({
                    pin: '12345',
                    isCashCorrect: null,
                    discrepancyReason: ''
                });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Sesión admin finalizada sin caja.');
            expect(res.body).toHaveProperty('session', null);
        });

        it('should close a barista operational session', async () => {
            const barista = await createBaristaWithToken({
                displayName: 'Barista Cash Close',
                employeeId: 'EMP-075'
            });

            const opened = await api()
                .post('/api/total-cash/open')
                .set(authHeader(barista.token))
                .send({ initialCash: 0 });

            expect(opened.status).toBe(200);
            expect(opened.body).toHaveProperty('baristaSession');

            const res = await api()
                .post('/api/total-cash/close')
                .set(authHeader(barista.token))
                .send({ pin: '12345' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message', 'Sesión operativa de barista finalizada.');
            expect(res.body.baristaSession).toHaveProperty('status', 'closed');
        });

        it('should close cash session', async () => {
            const res = await api()
                .post('/api/total-cash/close')
                .set(authHeader(empToken))
                .send({
                    pin: '12345',
                    isCashCorrect: true
            });
            expect([200, 201]).toContain(res.status);
        });

        it('should fail when closing without an open session', async () => {
            const employee = await createUserWithToken({
                displayName: 'Emp Cash No Session',
                employeeId: 'EMP-071'
            });

            const res = await api()
                .post('/api/total-cash/close')
                .set(authHeader(employee.token))
                .send({
                    pin: '12345',
                    isCashCorrect: true
                });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'No se encontró ninguna sesión de caja abierta para este usuario.');
        });

        it('should close cash session with discrepancy reason', async () => {
            const employee = await createUserWithToken({
                displayName: 'Emp Cash Discrepancy',
                employeeId: 'EMP-072'
            });

            const opened = await api()
                .post('/api/total-cash/open')
                .set(authHeader(employee.token))
                .send({ initialCash: 300 });
            expect(opened.status).toBe(201);

            const res = await api()
                .post('/api/total-cash/close')
                .set(authHeader(employee.token))
                .send({
                    pin: '12345',
                    isCashCorrect: false,
                    discrepancyReason: 'Faltan 20 pesos'
                });

            expect(res.status).toBe(200);
            expect(res.body.session).toHaveProperty('isCashCorrect', false);
            expect(res.body.session).toHaveProperty('discrepancyReason', 'Faltan 20 pesos');
        });
    });
});
