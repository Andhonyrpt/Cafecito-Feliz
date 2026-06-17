import { createAdminWithToken } from './helpers/auth.js';
import { makeCategoryPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Categories Module Tests', () => {
    let adminToken = '';
    let categoryId = '';
    let categoryPayload;

    beforeAll(async () => {
        const admin = await createAdminWithToken({
            displayName: 'Admin Category',
            employeeId: 'EMP-03'
        });
        adminToken = admin.token;
    });

    describe('POST /api/categories', () => {
        it('should create a category if admin', async () => {
            categoryPayload = makeCategoryPayload({ name: 'Bebidas' });

            const res = await api()
                .post('/api/categories')
                .set(authHeader(adminToken))
                .send(categoryPayload);
            
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('name', categoryPayload.name);
            categoryId = res.body._id;
        });

        it('should fail if name is missing', async () => {
            const res = await api()
                .post('/api/categories')
                .set(authHeader(adminToken))
                .send(makeCategoryPayload({ name: undefined }));
            
            expect(res.status).toBe(422);
        });
    });

    describe('GET /api/categories', () => {
        it('should get all categories', async () => {
            const res = await api().get('/api/categories');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.categories)).toBe(true);
            expect(res.body.categories.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/categories/:categoryId', () => {
        it('should get category by id', async () => {
            const res = await api().get(`/api/categories/${categoryId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', categoryId);
        });
    });

    describe('PUT /api/categories/:categoryId', () => {
        it('should update category if admin', async () => {
            const updatePayload = makeCategoryPayload({ name: 'Bebidas Calientes' });

            const res = await api()
                .put(`/api/categories/${categoryId}`)
                .set(authHeader(adminToken))
                .send({ name: updatePayload.name });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', updatePayload.name);
        });
    });

    describe('DELETE /api/categories/:categoryId', () => {
        it('should delete category if admin', async () => {
            const res = await api()
                .delete(`/api/categories/${categoryId}`)
                .set(authHeader(adminToken));
            
            expect(res.status).toBe(204);
        });
    });
});
