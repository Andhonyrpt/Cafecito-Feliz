import { createAdminWithToken, createUserWithToken } from './helpers/auth.js';
import { makeCategoryPayload, makeClientPayload, makeProductPayload, makeUserPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Domain validation and duplicate regression tests', () => {
    let adminToken = '';
    let userToken = '';
    let categoryId = '';

    beforeAll(async () => {
        const admin = await createAdminWithToken({
            displayName: 'Domain Admin',
            employeeId: 'EMP-501'
        });
        adminToken = admin.token;

        const user = await createUserWithToken({
            displayName: 'Domain User',
            employeeId: 'EMP-502'
        });
        userToken = user.token;

        const category = await api()
            .post('/api/categories')
            .set(authHeader(adminToken))
            .send(makeCategoryPayload({ name: 'Domain Category' }));
        categoryId = category.body._id;
    });

    it('rejects duplicate users created by admin as the current error-handler behavior', async () => {
        const payload = makeUserPayload({
            displayName: 'Duplicate User',
            employeeId: 'EMP-503',
            role: 'barista',
            isActive: true
        });

        const created = await api()
            .post('/api/users')
            .set(authHeader(adminToken))
            .send(payload);
        expect(created.status).toBe(201);

        const duplicate = await api()
            .post('/api/users')
            .set(authHeader(adminToken))
            .send(payload);

        expect(duplicate.status).toBe(500);
        expect(duplicate.body).toHaveProperty('status', 'error');
    });

    it('rejects duplicate categories as the current error-handler behavior', async () => {
        const payload = makeCategoryPayload({ name: 'Duplicate Category' });

        const created = await api()
            .post('/api/categories')
            .set(authHeader(adminToken))
            .send(payload);
        expect(created.status).toBe(201);

        const duplicate = await api()
            .post('/api/categories')
            .set(authHeader(adminToken))
            .send(payload);

        expect(duplicate.status).toBe(500);
        expect(duplicate.body).toHaveProperty('status', 'error');
    });

    it('rejects products without required parent category', async () => {
        const { parentCategory, ...payloadWithoutCategory } = makeProductPayload(categoryId);

        const res = await api()
            .post('/api/products')
            .set(authHeader(adminToken))
            .send(payloadWithoutCategory);

        expect(res.status).toBe(422);
        expect(res.body).toHaveProperty('errors');
    });

    it('rejects duplicate products as the current error-handler behavior', async () => {
        const payload = makeProductPayload(categoryId, { name: 'Duplicate Product' });

        const created = await api()
            .post('/api/products')
            .set(authHeader(adminToken))
            .send(payload);
        expect(created.status).toBe(201);

        const duplicate = await api()
            .post('/api/products')
            .set(authHeader(adminToken))
            .send(payload);

        expect(duplicate.status).toBe(500);
        expect(duplicate.body).toHaveProperty('status', 'error');
    });

    it('checks available client emails and rejects duplicate clients as current behavior', async () => {
        const payload = makeClientPayload({
            displayName: 'Domain Client',
            email: 'domain-client@example.com'
        });

        const available = await api().get('/api/clients/check-email?email=available-domain@example.com');
        expect(available.status).toBe(200);
        expect(available.body).toHaveProperty('taken', false);

        const created = await api()
            .post('/api/clients')
            .set(authHeader(userToken))
            .send(payload);
        expect(created.status).toBe(201);

        const duplicate = await api()
            .post('/api/clients')
            .set(authHeader(userToken))
            .send(payload);

        expect(duplicate.status).toBe(500);
        expect(duplicate.body).toHaveProperty('status', 'error');
    });
});
