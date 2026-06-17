import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

describe('Orders Module Tests', () => {
    let empToken = '';
    let productId = '';
    let clientId = '';
    let orderId = '';
    let categoryId = '';

    beforeAll(async () => {
        // Setup employee
        await request(app).post('/api/auth/register').send({
            displayName: 'Emp Order',
            employeeId: 'EMP-06',
            password: '12345',
            avatar: 'http://example.com/emp.jpg'
        });
        // Convert to admin to create product
        const User = mongoose.model('User');
        await User.findOneAndUpdate({ employeeId: 'EMP-06' }, { role: 'admin' });
        const resEmp = await request(app).post('/api/auth/login').send({ employeeId: 'EMP-06', password: '12345' });
        empToken = resEmp.body.token;

        const resCat = await request(app).post('/api/categories').set('Authorization', `Bearer ${empToken}`).send({
            name: 'Ordenes',
            imageUrl: 'http://example.com/orders.jpg'
        });
        categoryId = resCat.body._id;

        // Setup product
        const resProd = await request(app).post('/api/products').set('Authorization', `Bearer ${empToken}`).send({
            name: 'Coffee',
            price: 20,
            stock: 100,
            imageUrl: 'http://example.com/coffee.jpg',
            parentCategory: categoryId
        });
        productId = resProd.body._id;

        // Setup client
        const resCli = await request(app).post('/api/clients').set('Authorization', `Bearer ${empToken}`).send({
            displayName: 'Order Client',
            email: 'order@example.com'
        });
        clientId = resCli.body.client._id;
    });

    describe('POST /api/orders/preview', () => {
        it('should preview order total', async () => {
            const res = await request(app)
                .post('/api/orders/preview')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    products: [{ productId, quantity: 2 }]
            });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total', 46.4);
        });
    });

    describe('POST /api/orders', () => {
        it('should create an order', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    client: clientId,
                    products: [{ productId, quantity: 2 }],
                    paymentMethod: 'efectivo',
                    orderType: 'local'
            });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('totalPrice', 46.4);
            orderId = res.body._id;
        });

        it('should fail if products array is empty', async () => {
            const res = await request(app)
                .post('/api/orders')
                .set('Authorization', `Bearer ${empToken}`)
                .send({
                    client: clientId,
                    products: [],
                    paymentMethod: 'efectivo',
                    orderType: 'local'
                });
            expect(res.status).toBe(422);
        });
    });

    describe('GET /api/orders', () => {
        it('should list orders', async () => {
            const res = await request(app)
                .get('/api/orders')
                .set('Authorization', `Bearer ${empToken}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('orders');
        });
    });

    describe('PATCH /api/orders/:orderId/status', () => {
        it('should update order status', async () => {
            const res = await request(app)
                .patch(`/api/orders/${orderId}/status`)
                .set('Authorization', `Bearer ${empToken}`)
                .send({ status: 'completado' });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'completado');
        });
    });
});
