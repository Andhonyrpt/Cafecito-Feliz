import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

describe('Products Module Tests', () => {
    let adminToken = '';
    let categoryId = '';
    let productId = '';

    beforeAll(async () => {
        // Setup admin
        await request(app).post('/api/auth/register').send({
            displayName: 'Admin Prod',
            employeeId: 'EMP-prod',
            pin: '1234',
            avatar: 'http://example.com/admin.jpg'
        });
        const User = mongoose.model('User');
        await User.findOneAndUpdate({ employeeId: 'EMP-prod' }, { role: 'admin' });
        const resAdmin = await request(app).post('/api/auth/login').send({ employeeId: 'EMP-prod', password: '1234' });
        adminToken = resAdmin.body.accessToken;

        // Setup category
        const resCat = await request(app).post('/api/categories').set('Authorization', `Bearer ${adminToken}`).send({
            name: 'Postres',
            imageUrl: 'http://example.com/postres.jpg'
        });
        categoryId = resCat.body._id;
    });

    describe('POST /api/products', () => {
        it('should create a product if admin', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Cheesecake',
                    price: 45.50,
                    stock: 10,
                    imageUrl: 'http://example.com/cake.jpg',
                    parentCategory: categoryId
                });
            
            expect(res.status).toBe(201);
            expect(res.body.product).toHaveProperty('name', 'Cheesecake');
            productId = res.body.product._id;
        });

        it('should fail if price is negative', async () => {
            const res = await request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Cheesecake 2',
                    price: -10,
                    stock: 10,
                    imageUrl: 'http://example.com/cake.jpg'
                });
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/products', () => {
        it('should list products', async () => {
            const res = await request(app).get('/api/products');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('products');
            expect(Array.isArray(res.body.products)).toBe(true);
            expect(res.body.products.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/products/:id', () => {
        it('should get product by id', async () => {
            const res = await request(app).get(`/api/products/${productId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', productId);
        });
    });

    describe('PUT /api/products/:id', () => {
        it('should update product', async () => {
            const res = await request(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    price: 50.00
                });
            expect(res.status).toBe(200);
            expect(res.body.product).toHaveProperty('price', 50);
        });
    });

    describe('DELETE /api/products/:id', () => {
        it('should delete product', async () => {
            const res = await request(app)
                .delete(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
        });
    });
});
