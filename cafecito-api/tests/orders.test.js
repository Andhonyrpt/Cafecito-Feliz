import request from 'supertest';
import { app } from '../server.js';
import mongoose from 'mongoose';

describe('Orders Module Tests', () => {
    let empToken = '';
    let productId = '';
    let clientId = '';
    let orderId = '';

    beforeAll(async () => {
        // Setup employee
        await request(app).post('/api/auth/register').send({
            displayName: 'Emp Order',
            employeeId: 'EMP-ord',
            pin: '1234',
            avatar: 'http://example.com/emp.jpg'
        });
        // Convert to admin to create product
        const User = mongoose.model('User');
        await User.findOneAndUpdate({ employeeId: 'EMP-ord' }, { role: 'admin' });
        const resEmp = await request(app).post('/api/auth/login').send({ employeeId: 'EMP-ord', password: '1234' });
        empToken = resEmp.body.accessToken;

        // Setup product
        const resProd = await request(app).post('/api/products').set('Authorization', `Bearer ${empToken}`).send({
            name: 'Coffee',
            price: 20,
            stock: 100,
            imageUrl: 'http://example.com/coffee.jpg'
        });
        productId = resProd.body.product._id;

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
            expect(res.body).toHaveProperty('total', 40);
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
            expect(res.body.order).toHaveProperty('total', 40);
            orderId = res.body.order._id;
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
            expect(res.status).toBe(400);
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
                .send({ status: 'preparando' });
            expect(res.status).toBe(200);
            expect(res.body.order).toHaveProperty('status', 'preparando');
        });
    });
});
