import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

describe('Categories Module Tests', () => {
    let adminToken = '';
    let categoryId = '';

    beforeAll(async () => {
        // Register an admin
        let res = await request(app).post('/api/auth/register').send({
            displayName: 'Admin Category',
            employeeId: 'EMP-cat',
            pin: '1234',
            avatar: 'http://example.com/admin.jpg'
        });
        
        const User = mongoose.model('User');
        await User.findOneAndUpdate({ employeeId: 'EMP-cat' }, { role: 'admin' });

        res = await request(app).post('/api/auth/login').send({
            employeeId: 'EMP-cat',
            password: '1234'
        });
        adminToken = res.body.accessToken;
    });

    describe('POST /api/categories', () => {
        it('should create a category if admin', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Bebidas',
                    imageUrl: 'http://example.com/bebidas.jpg'
                });
            
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('name', 'Bebidas');
            categoryId = res.body._id;
        });

        it('should fail if name is missing', async () => {
            const res = await request(app)
                .post('/api/categories')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    imageUrl: 'http://example.com/bebidas.jpg'
                });
            
            expect(res.status).toBe(400);
        });
    });

    describe('GET /api/categories', () => {
        it('should get all categories', async () => {
            const res = await request(app).get('/api/categories');
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/categories/:categoryId', () => {
        it('should get category by id', async () => {
            const res = await request(app).get(`/api/categories/${categoryId}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('_id', categoryId);
        });
    });

    describe('PUT /api/categories/:categoryId', () => {
        it('should update category if admin', async () => {
            const res = await request(app)
                .put(`/api/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'Bebidas Calientes'
                });
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('name', 'Bebidas Calientes');
        });
    });

    describe('DELETE /api/categories/:categoryId', () => {
        it('should delete category if admin', async () => {
            const res = await request(app)
                .delete(`/api/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('message');
        });
    });
});
