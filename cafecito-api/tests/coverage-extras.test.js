import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../server.js';

describe('Coverage extra integration paths', () => {
    let adminToken = '';
    let empToken = '';
    let categoryId = '';
    let productId = '';
    let clientId = '';
    let orderId = '';

    const missingId = () => new mongoose.Types.ObjectId().toString();

    beforeAll(async () => {
        await request(app).post('/api/auth/register').send({
            displayName: 'Coverage Admin',
            employeeId: 'EMP-80',
            password: '12345',
            avatar: 'http://example.com/admin.jpg'
        });

        const User = mongoose.model('User');
        await User.findOneAndUpdate({ employeeId: 'EMP-80' }, { role: 'admin' });

        const adminLogin = await request(app).post('/api/auth/login').send({
            employeeId: 'EMP-80',
            password: '12345'
        });
        adminToken = adminLogin.body.token;

        await request(app).post('/api/auth/register').send({
            displayName: 'Coverage Employee',
            employeeId: 'EMP-81',
            password: '12345',
            avatar: 'http://example.com/employee.jpg'
        });

        const empLogin = await request(app).post('/api/auth/login').send({
            employeeId: 'EMP-81',
            password: '12345'
        });
        empToken = empLogin.body.token;

        const category = await request(app)
            .post('/api/categories')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ name: 'Coverage Drinks', imageUrl: 'http://example.com/drinks.jpg' });
        categoryId = category.body._id;

        const product = await request(app)
            .post('/api/products')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'Coverage Latte',
                price: 30,
                stock: 5,
                imageUrl: 'http://example.com/latte.jpg',
                parentCategory: categoryId
            });
        productId = product.body._id;

        const client = await request(app)
            .post('/api/clients')
            .set('Authorization', `Bearer ${empToken}`)
            .send({ displayName: 'Coverage Client', email: 'coverage@example.com' });
        clientId = client.body.client._id;

        const order = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${empToken}`)
            .send({
                client: clientId,
                products: [{ productId, quantity: 1 }],
                paymentMethod: 'efectivo',
                orderType: 'local'
            });
        orderId = order.body._id;
    });

    describe('server endpoints', () => {
        it('returns health, root metadata, and 404 payloads', async () => {
            const health = await request(app).get('/health');
            expect(health.status).toBe(200);
            expect(health.body).toHaveProperty('status', 'OK');

            const root = await request(app).get('/');
            expect(root.status).toBe(200);
            expect(root.body.endpoints).toHaveProperty('api', '/api');

            const notFound = await request(app).get('/missing-route');
            expect(notFound.status).toBe(404);
            expect(notFound.body).toHaveProperty('error', 'Ruta no encontrada');
        });
    });

    describe('auth branches', () => {
        it('handles duplicate register, role checks, missing refresh token, bad pin, and inactive pin', async () => {
            const duplicate = await request(app).post('/api/auth/register').send({
                displayName: 'Coverage Admin',
                employeeId: 'EMP-80',
                password: '12345',
                avatar: 'http://example.com/admin.jpg'
            });
            expect(duplicate.status).toBe(201);

            const knownRole = await request(app)
                .get('/api/auth/check-role/EMP-80')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(knownRole.status).toBe(200);
            expect(knownRole.body).toHaveProperty('role', 'admin');

            const role = await request(app)
                .get('/api/auth/check-role/EMP-404')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(role.status).toBe(200);
            expect(role.body).toHaveProperty('role', 'unknown');

            const refresh = await request(app).post('/api/auth/refresh').send({});
            expect(refresh.status).toBe(401);

            const pin = await request(app)
                .post('/api/auth/verify-pin')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    employeeId: 'EMP-81',
                    password: '99999'
                });
            expect(pin.status).toBe(401);

            const User = mongoose.model('User');
            await User.findOneAndUpdate({ employeeId: 'EMP-81' }, { isActive: false });
            const inactivePin = await request(app)
                .post('/api/auth/verify-pin')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    employeeId: 'EMP-81',
                    password: '12345'
                });
            expect(inactivePin.status).toBe(403);
            await User.findOneAndUpdate({ employeeId: 'EMP-81' }, { isActive: true });
        });
    });

    describe('user branches', () => {
        it('covers user creation, filters, missing user, empty update, and missing toggle', async () => {
            const created = await request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    displayName: 'Coverage Barista',
                    employeeId: 'EMP-82',
                    password: '12345',
                    role: 'barista',
                    avatar: 'http://example.com/barista.jpg',
                    isActive: true
                });
            expect(created.status).toBe(201);

            const filtered = await request(app)
                .get('/api/users?page=1&limit=5&role=barista&isActive=true')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(filtered.status).toBe(200);
            expect(filtered.body).toHaveProperty('pagination');

            const notFound = await request(app)
                .get(`/api/users/${missingId()}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(notFound.status).toBe(404);

            const emptyUpdate = await request(app)
                .put(`/api/users/${created.body.user._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(emptyUpdate.status).toBe(400);

            const toggleMissing = await request(app)
                .patch(`/api/toggle-status/${missingId()}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(toggleMissing.status).toBe(404);
        });
    });

    describe('category branches', () => {
        it('covers paginated list, search, missing category, empty update, and missing delete', async () => {
            const paginated = await request(app).get('/api/categories?page=1&limit=5');
            expect(paginated.status).toBe(200);
            expect(paginated.body).toHaveProperty('pagination');

            const search = await request(app).get('/api/categories/search');
            expect(search.status).toBe(200);
            expect(search.body).toHaveProperty('categories');

            const notFound = await request(app).get(`/api/categories/${missingId()}`);
            expect(notFound.status).toBe(404);

            const emptyUpdate = await request(app)
                .put(`/api/categories/${categoryId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(emptyUpdate.status).toBe(400);

            const deleteMissing = await request(app)
                .delete(`/api/categories/${missingId()}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(deleteMissing.status).toBe(404);
        });
    });

    describe('product branches', () => {
        it('covers pagination, category lookup, missing product, empty update, and missing delete', async () => {
            const paginated = await request(app).get(`/api/products?page=1&limit=5&category=${categoryId}`);
            expect(paginated.status).toBe(200);
            expect(paginated.body).toHaveProperty('pagination');

            const byCategory = await request(app).get(`/api/products/category/${categoryId}`);
            expect(byCategory.status).toBe(200);
            expect(Array.isArray(byCategory.body)).toBe(true);

            const notFound = await request(app).get(`/api/products/${missingId()}`);
            expect(notFound.status).toBe(404);

            const emptyUpdate = await request(app)
                .put(`/api/products/${productId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({});
            expect(emptyUpdate.status).toBe(400);

            const deleteMissing = await request(app)
                .delete(`/api/products/${missingId()}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(deleteMissing.status).toBe(404);
        });
    });

    describe('client branches', () => {
        it('covers list, pagination, taken email, missing search, empty update, and missing update', async () => {
            const list = await request(app)
                .get('/api/clients')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(list.status).toBe(200);
            expect(list.body).toHaveProperty('clients');

            const paginated = await request(app)
                .get('/api/clients?page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(paginated.status).toBe(200);
            expect(paginated.body).toHaveProperty('pagination');

            const email = await request(app).get('/api/clients/check-email?email=coverage@example.com');
            expect(email.status).toBe(200);
            expect(email.body).toHaveProperty('taken', true);

            const missingSearch = await request(app)
                .get('/api/clients/search')
                .set('Authorization', `Bearer ${empToken}`);
            expect(missingSearch.status).toBe(400);

            const emptyUpdate = await request(app)
                .put(`/api/clients/${clientId}`)
                .set('Authorization', `Bearer ${empToken}`)
                .send({});
            expect(emptyUpdate.status).toBe(422);

            const updateMissing = await request(app)
                .put(`/api/clients/${missingId()}`)
                .set('Authorization', `Bearer ${empToken}`)
                .send({ displayName: 'Missing Client', email: 'missing-client@example.com' });
            expect(updateMissing.status).toBe(404);
        });
    });

    describe('order branches', () => {
        it('covers order detail, client history, preview not found, insufficient stock, and terminal status guard', async () => {
            const detail = await request(app)
                .get(`/api/orders/${orderId}`)
                .set('Authorization', `Bearer ${empToken}`);
            expect(detail.status).toBe(200);
            expect(detail.body).toHaveProperty('_id', orderId);

            const byClient = await request(app)
                .get(`/api/orders/client/${clientId}`)
                .set('Authorization', `Bearer ${empToken}`);
            expect(byClient.status).toBe(500);
            expect(byClient.body).toHaveProperty('status', 'error');

            const previewMissing = await request(app)
                .post('/api/orders/preview')
                .set('Authorization', `Bearer ${empToken}`)
                .send({ products: [{ productId: missingId(), quantity: 1 }] });
            expect(previewMissing.status).toBe(404);

            const insufficient = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    client: clientId,
                    products: [{ productId, quantity: 999 }],
                    paymentMethod: 'efectivo',
                    orderType: 'local'
                });
            expect(insufficient.status).toBe(400);

            const completed = await request(app)
                .patch(`/api/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${empToken}`)
                .send({ status: 'completado' });
            expect(completed.status).toBe(200);

            const terminalGuard = await request(app)
                .patch(`/api/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${empToken}`)
                .send({ status: 'pendiente' });
            expect(terminalGuard.status).toBe(400);
        });
    });

    describe('cash branches', () => {
        it('covers missing openedAt and admin open/close branches', async () => {
            const missingOpenedAt = await request(app)
                .get('/api/total-cash/orders')
                .set('Authorization', `Bearer ${empToken}`);
            expect(missingOpenedAt.status).toBe(422);

            const openAdmin = await request(app)
                .post('/api/total-cash/open')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ initialCash: 0 });
            expect(openAdmin.status).toBe(200);

            const closeAdmin = await request(app)
                .post('/api/total-cash/close')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ pin: '12345', isCashCorrect: true });
            expect(closeAdmin.status).toBe(200);
        });
    });
});
