import { createAdminWithToken } from './helpers/auth.js';
import { makeCategoryPayload, makeProductPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Products Module Tests', () => {
    let adminToken = '';
    let categoryId = '';
    let productId = '';
    let productPayload;

    beforeAll(async () => {
        const admin = await createAdminWithToken({
            displayName: 'Admin Prod',
            employeeId: 'EMP-04'
        });
        adminToken = admin.token;

        const resCat = await api()
            .post('/api/categories')
            .set(authHeader(adminToken))
            .send(makeCategoryPayload({ name: 'Postres' }));
        categoryId = resCat.body._id;
    });

    describe('POST /api/products', () => {
        it('should create a product if admin', async () => {
            productPayload = makeProductPayload(categoryId, {
                name: 'Cheesecake',
                price: 45.50,
                stock: 10,
                imageUrl: 'http://example.com/cake.jpg'
            });

            const res = await api()
                .post('/api/products')
                .set(authHeader(adminToken))
                .send(productPayload);
            
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('name', productPayload.name);
            productId = res.body._id;
        });

        it('should fail if price is negative', async () => {
            const res = await api()
                .post('/api/products')
                .set(authHeader(adminToken))
                .send(makeProductPayload(categoryId, {
                    price: -10,
                }));
            expect(res.status).toBe(422);
        });
    });

    describe('GET /api/products', () => {
        it('should list products', async () => {
            const res = await api().get('/api/products');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('products');
            expect(Array.isArray(res.body.products)).toBe(true);
            expect(res.body.products.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/products/:id', () => {
        it('should get product by id', async () => {
            const res = await api().get(`/api/products/${productId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', productId);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product', async () => {
            const res = await api()
                .put(`/api/products/${productId}`)
                .set(authHeader(adminToken))
                .send({
                    price: 50.00
                });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('price', 50);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete product', async () => {
            const res = await api()
                .delete(`/api/products/${productId}`)
                .set(authHeader(adminToken));
            expect(res.status).toBe(204);
        });
    });
});
