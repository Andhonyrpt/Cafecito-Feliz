import mongoose from 'mongoose';
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

        it('should get paginated categories', async () => {
            const res = await api().get('/api/categories?page=1&limit=5');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('categories');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.pagination).toHaveProperty('currentPage', 1);
        });
    });

    describe('GET /api/categories/:categoryId', () => {
        it('should get category by id', async () => {
            const res = await api().get(`/api/categories/${categoryId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', categoryId);
        });

        it('should return 404 for missing category', async () => {
            const missingId = new mongoose.Types.ObjectId().toString();

            const res = await api().get(`/api/categories/${missingId}`);

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Category not found');
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

        it('should update category parent when provided', async () => {
            const parent = await api()
                .post('/api/categories')
                .set(authHeader(adminToken))
                .send(makeCategoryPayload({ name: 'Categoria padre' }));

            const child = await api()
                .post('/api/categories')
                .set(authHeader(adminToken))
                .send(makeCategoryPayload({ name: 'Categoria hija' }));

            const res = await api()
                .put(`/api/categories/${child.body._id}`)
                .set(authHeader(adminToken))
                .send({ parentCategory: parent.body._id });

            expect(res.status).toBe(200);
            expect(res.body.parentCategory).toHaveProperty('_id', parent.body._id);
        });

        it('should reject empty category updates', async () => {
            const res = await api()
                .put(`/api/categories/${categoryId}`)
                .set(authHeader(adminToken))
                .send({});

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'At least one field must be provided for update');
        });

        it('should return 404 when updating a missing category', async () => {
            const missingId = new mongoose.Types.ObjectId().toString();

            const res = await api()
                .put(`/api/categories/${missingId}`)
                .set(authHeader(adminToken))
                .send({ name: 'No existe' });

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Category not found');
        });
    });

    describe('GET /api/categories/search', () => {
        it('should search and sort categories without pagination', async () => {
            const res = await api().get('/api/categories/search?q=Bebidas&sort=name&order=asc');

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('categories');
            expect(Array.isArray(res.body.categories)).toBe(true);
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

        it('should return 404 when deleting a missing category', async () => {
            const missingId = new mongoose.Types.ObjectId().toString();

            const res = await api()
                .delete(`/api/categories/${missingId}`)
                .set(authHeader(adminToken));

            expect(res.status).toBe(404);
            expect(res.body).toHaveProperty('message', 'Category not found');
        });
    });
});
