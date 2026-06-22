import { createAdminWithToken, createBaristaWithToken, createUserWithToken } from './helpers/auth.js';
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
