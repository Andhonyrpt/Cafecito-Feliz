import mongoose from 'mongoose';
import { createAdminWithToken, createBaristaWithToken, createUserWithToken } from './helpers/auth.js';
import { makeCategoryPayload, makeClientPayload, makeOrderPayload, makeProductPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Orders Module Tests', () => {
    let empToken = '';
    let productId = '';
    let clientId = '';
    let orderId = '';
    let categoryId = '';
    let baristaToken = '';
    let baristaId = '';
    let adminToken = '';

    beforeAll(async () => {
        const admin = await createAdminWithToken({
            displayName: 'Emp Order',
            employeeId: 'EMP-06'
        });
        adminToken = admin.token;
        const seller = await createUserWithToken({
            displayName: 'Order Seller',
            employeeId: 'EMP-060'
        });
        empToken = seller.token;

        await api()
            .post('/api/total-cash/open')
            .set(authHeader(empToken))
            .send({ initialCash: 100 });

        const barista = await createBaristaWithToken({
            displayName: 'Order Barista',
            employeeId: 'EMP-061'
        });
        baristaToken = barista.token;
        baristaId = barista.user.id;

        await api()
            .post('/api/total-cash/open')
            .set(authHeader(baristaToken))
            .send({ initialCash: 0 });

        const resCat = await api()
            .post('/api/categories')
            .set(authHeader(admin.token))
            .send(makeCategoryPayload({ name: 'Ordenes' }));
        categoryId = resCat.body._id;

        const resProd = await api()
            .post('/api/products')
            .set(authHeader(admin.token))
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

        it('should reject preview for baristas', async () => {
            const res = await api()
                .post('/api/orders/preview')
                .set(authHeader(baristaToken))
                .send({
                    products: [{ productId, quantity: 1 }]
                });

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message', 'Solo los vendedores pueden simular ventas.');
        });

        it('should apply loyalty discounts by purchase count', async () => {
            const Client = mongoose.model('Client');

            const discountCases = [
                { purchases: 1, expectedDiscount: 1 },
                { purchases: 5, expectedDiscount: 2 },
                { purchases: 10, expectedDiscount: 3 }
            ];

            for (const discountCase of discountCases) {
                const client = await Client.create({
                    displayName: `Discount Client ${discountCase.purchases}`,
                    email: `discount-${discountCase.purchases}@example.com`,
                    totalPurchaseCount: discountCase.purchases
                });

                const res = await api()
                    .post('/api/orders/preview')
                    .set(authHeader(empToken))
                    .send({
                        client: client._id,
                        products: [{ productId, quantity: 1 }]
                    });

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('discount', discountCase.expectedDiscount);
            }
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
            expect(res.body.assignedBarista._id).toBe(baristaId);
            orderId = res.body._id;
        });

        it('should assign sequential order numbers and update related records atomically', async () => {
            const Product = mongoose.model('Product');
            const Client = mongoose.model('Client');
            const stockBefore = (await Product.findById(productId)).stock;

            const first = await api()
                .post('/api/orders')
                .set(authHeader(empToken))
                .send(makeOrderPayload({
                    client: clientId,
                    productId,
                    quantity: 1
                }));
            const second = await api()
                .post('/api/orders')
                .set(authHeader(empToken))
                .send(makeOrderPayload({
                    client: clientId,
                    productId,
                    quantity: 1
                }));

            expect(first.status).toBe(201);
            expect(second.status).toBe(201);
            expect(second.body.orderNumber).toBe(first.body.orderNumber + 1);

            const productAfter = await Product.findById(productId);
            const clientAfter = await Client.findById(clientId);

            expect(productAfter.stock).toBe(stockBefore - 2);
            expect(clientAfter.purchaseHistory.map(String)).toEqual(
                expect.arrayContaining([first.body._id, second.body._id])
            );
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

        it('should reject order creation for baristas', async () => {
            const res = await api()
                .post('/api/orders')
                .set(authHeader(baristaToken))
                .send(makeOrderPayload({
                    client: clientId,
                    productId,
                    quantity: 1
                }));

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message', 'Solo los vendedores pueden registrar ventas.');
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

        it('should list only orders assigned to the active barista', async () => {
            const res = await api()
                .get('/api/orders')
                .set(authHeader(baristaToken));

            expect(res.status).toBe(200);
            expect(res.body.orders.length).toBeGreaterThan(0);
            expect(res.body.orders.every((order) => order.assignedBarista._id === baristaId)).toBe(true);
        });
    });

    describe('GET /api/orders/my-shift', () => {
        it('should list seller shift orders and summary', async () => {
            const res = await api()
                .get('/api/orders/my-shift')
                .set(authHeader(empToken));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('summary');
            expect(res.body.summary.orderCount).toBeGreaterThan(0);
            expect(res.body.summary.totalSales).toBeGreaterThan(0);
            expect(res.body.orders.length).toBeGreaterThan(0);
        });

        it('should reject shift orders for non-sellers', async () => {
            const res = await api()
                .get('/api/orders/my-shift')
                .set(authHeader(baristaToken));

            expect(res.status).toBe(403);
        });

        it('should return 404 when seller has no open cash session', async () => {
            const seller = await createUserWithToken({
                displayName: 'Order Seller Without Shift',
                employeeId: 'EMP-062'
            });

            const res = await api()
                .get('/api/orders/my-shift')
                .set(authHeader(seller.token));

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/orders/admin/sales-summary', () => {
        it('should return sales summary for admins', async () => {
            const res = await api()
                .get('/api/orders/admin/sales-summary?range=day')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('summary');
            expect(res.body.summary.orderCount).toBeGreaterThan(0);
            expect(res.body.summary.totalSales).toBeGreaterThan(0);
            expect(res.body).toHaveProperty('salesSeries');
            expect(res.body).toHaveProperty('topProducts');
        });

        it('should return sales summaries for week, month, and year ranges', async () => {
            for (const range of ['week', 'month', 'year']) {
                const res = await api()
                    .get(`/api/orders/admin/sales-summary?range=${range}`)
                    .set(authHeader(adminToken));

                expect(res.status).toBe(200);
                expect(res.body).toHaveProperty('range', range);
                expect(res.body).toHaveProperty('summary');
            }
        });

        it('should reject non-admin users', async () => {
            const res = await api()
                .get('/api/orders/admin/sales-summary?range=day')
                .set(authHeader(empToken));

            expect(res.status).toBe(403);
        });
    });

    describe('GET /api/orders/admin/list', () => {
        it('should list filtered admin orders', async () => {
            const res = await api()
                .get('/api/orders/admin/list?range=day&paymentMethod=efectivo&limit=5')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('orders');
            expect(res.body).toHaveProperty('pagination');
            expect(res.body.orders.length).toBeGreaterThan(0);
            expect(res.body.orders[0]).toHaveProperty('user');
            expect(res.body.orders[0]).toHaveProperty('assignedBarista');
            expect(res.body.orders.every((order) => order.paymentMethod === 'efectivo')).toBe(true);
        });

        it('should list admin orders with explicit dates and employee filters', async () => {
            const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
            const to = new Date().toISOString().slice(0, 10);

            const res = await api()
                .get(`/api/orders/admin/list?from=${from}&to=${to}&sellerEmployeeId=EMP-060&baristaEmployeeId=EMP-061&status=pendiente&page=1&limit=10`)
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('orders');
            expect(res.body).toHaveProperty('pagination');
        });

        it('should return an empty list for missing employee filters', async () => {
            const res = await api()
                .get('/api/orders/admin/list?sellerEmployeeId=EMP-999&baristaEmployeeId=EMP-998')
                .set(authHeader(adminToken));

            expect(res.status).toBe(200);
            expect(res.body.orders).toHaveLength(0);
        });

        it('should reject non-admin users from admin orders list', async () => {
            const res = await api()
                .get('/api/orders/admin/list?range=day')
                .set(authHeader(empToken));

            expect(res.status).toBe(403);
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

        it('should reject non-completed status changes that pass route validation', async () => {
            const order = await api()
                .post('/api/orders')
                .set(authHeader(empToken))
                .send(makeOrderPayload({
                    client: clientId,
                    productId,
                    quantity: 1
                }));

            const res = await api()
                .patch(`/api/orders/${order.body._id}/status`)
                .set(authHeader(empToken))
                .send({ status: 'pendiente' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('message', 'Las órdenes solo pueden marcarse como completadas.');
        });

        it('should reject a barista completing an order assigned to another barista', async () => {
            const anotherBarista = await createBaristaWithToken({
                displayName: 'Other Order Barista',
                employeeId: 'EMP-063'
            });

            const order = await api()
                .post('/api/orders')
                .set(authHeader(empToken))
                .send(makeOrderPayload({
                    client: clientId,
                    productId,
                    quantity: 1
                }));

            const res = await api()
                .patch(`/api/orders/${order.body._id}/status`)
                .set(authHeader(anotherBarista.token))
                .send({ status: 'completado' });

            expect(res.status).toBe(403);
            expect(res.body).toHaveProperty('message', 'Esta orden no está asignada a este barista.');
        });
    });
});
