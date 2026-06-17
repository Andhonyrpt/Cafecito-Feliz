import { createAdminWithToken } from './helpers/auth.js';
import { makeCategoryPayload, makeClientPayload, makeOrderPayload, makeProductPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Orders Module Tests', () => {
    let empToken = '';
    let productId = '';
    let clientId = '';
    let orderId = '';
    let categoryId = '';

    beforeAll(async () => {
        const admin = await createAdminWithToken({
            displayName: 'Emp Order',
            employeeId: 'EMP-06'
        });
        empToken = admin.token;

        const resCat = await api()
            .post('/api/categories')
            .set(authHeader(empToken))
            .send(makeCategoryPayload({ name: 'Ordenes' }));
        categoryId = resCat.body._id;

        const resProd = await api()
            .post('/api/products')
            .set(authHeader(empToken))
            .send(makeProductPayload(categoryId, {
                name: 'Coffee',
                price: 20,
                stock: 100,
                imageUrl: 'http://example.com/coffee.jpg'
            }));
        productId = resProd.body._id;

        const resCli = await api()
            .post('/api/clients')
            .set(authHeader(empToken))
            .send(makeClientPayload({ displayName: 'Order Client' }));
        clientId = resCli.body.client._id;
    });

    describe('POST /api/orders/preview', () => {
        it('should preview order total', async () => {
            const res = await api()
                .post('/api/orders/preview')
                .set(authHeader(empToken))
                .send({
                    products: [{ productId, quantity: 2 }]
            });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('total', 46.4);
        });
    });

    describe('POST /api/orders', () => {
        it('should create an order', async () => {
            const res = await api()
                .post('/api/orders')
                .set(authHeader(empToken))
                .send(makeOrderPayload({
                    client: clientId,
                    productId,
                    quantity: 2
                }));
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('totalPrice', 46.4);
            orderId = res.body._id;
        });

        it('should fail if products array is empty', async () => {
            const res = await api()
                .post('/api/orders')
                .set(authHeader(empToken))
                .send(makeOrderPayload({
                    client: clientId,
                    products: [],
                    productId
                }));
            expect(res.status).toBe(422);
        });
    });

    describe('GET /api/orders', () => {
        it('should list orders', async () => {
            const res = await api()
                .get('/api/orders')
                .set(authHeader(empToken));
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('orders');
        });
    });

    describe('PATCH /api/orders/:orderId/status', () => {
        it('should update order status', async () => {
            const res = await api()
                .patch(`/api/orders/${orderId}/status`)
                .set(authHeader(empToken))
                .send({ status: 'completado' });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('status', 'completado');
        });
    });
});
