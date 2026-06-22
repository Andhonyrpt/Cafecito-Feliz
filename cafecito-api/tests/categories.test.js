import { createAdminWithToken } from './helpers/auth.js';
import { makeCategoryPayload, makeProductPayload } from './helpers/factories.js';
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
            const updatePayload = makeCategoryPayload({
                name: 'Bebidas Calientes',
                imageUrl: '/img/categories/Cafes.png'
            });

            const res = await api()
                .put(`/api/categories/${categoryId}`)
                .set(authHeader(adminToken))
                .send({ name: updatePayload.name, imageUrl: updatePayload.imageUrl });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', updatePayload.name);
            expect(res.body).toHaveProperty('imageUrl', updatePayload.imageUrl);
        });
    });

    describe('DELETE /api/categories/:categoryId', () => {
        it('should not delete category with associated products', async () => {
            const categoryWithProduct = await api()
                .post('/api/categories')
                .set(authHeader(adminToken))
                .send(makeCategoryPayload({ name: 'Categoria con producto' }));

            await api()
                .post('/api/products')
                .set(authHeader(adminToken))
                .send(makeProductPayload(categoryWithProduct.body._id, {
                    name: 'Producto asociado',
                    imageUrl: 'http://example.com/producto-asociado.jpg'
                }));

            const res = await api()
                .delete(`/api/categories/${categoryWithProduct.body._id}`)
                .set(authHeader(adminToken));

            expect(res.status).toBe(400);
            expect(res.body.message).toMatch(/productos asociados/i);
        });

        it('should delete category if admin', async () => {
            const res = await api()
                .delete(`/api/categories/${categoryId}`)
                .set(authHeader(adminToken));
            
            expect(res.status).toBe(204);
        });
    });
});
