import mongoose from 'mongoose';
import { createAdminWithToken, createUserWithToken } from '../helpers/auth.js';
import { makeCategoryPayload, makeClientPayload, makeOrderPayload, makeProductPayload } from '../helpers/factories.js';
import { api, authHeader } from '../helpers/http.js';

describe('Critical POS regression flow', () => {
    it('opens cash, creates a client order, updates stock/client, and closes cash', async () => {
        const admin = await createAdminWithToken({
            displayName: 'POS Admin',
            employeeId: 'EMP-601'
        });
        const seller = await createUserWithToken({
            displayName: 'POS Seller',
            employeeId: 'EMP-602'
        });

        const opened = await api()
            .post('/api/total-cash/open')
            .set(authHeader(seller.token))
            .send({ initialCash: 100 });
        expect(opened.status).toBe(201);

        const category = await api()
            .post('/api/categories')
            .set(authHeader(admin.token))
            .send(makeCategoryPayload({ name: 'POS Drinks' }));
        expect(category.status).toBe(201);

        const product = await api()
            .post('/api/products')
            .set(authHeader(admin.token))
            .send(makeProductPayload(category.body._id, {
                name: 'POS Latte',
                price: 10,
                stock: 5
            }));
        expect(product.status).toBe(201);

        const client = await api()
            .post('/api/clients')
            .set(authHeader(seller.token))
            .send(makeClientPayload({
                displayName: 'POS Client',
                email: 'pos-client@example.com'
            }));
        expect(client.status).toBe(201);

        const preview = await api()
            .post('/api/orders/preview')
            .set(authHeader(seller.token))
            .send({
                client: client.body.client._id,
                products: [{ productId: product.body._id, quantity: 2 }]
            });
        expect(preview.status).toBe(200);
        expect(preview.body).toEqual(expect.objectContaining({
            subtotal: 20,
            discount: 0,
            tax: 3.2,
            total: 23.2,
            currency: 'MXN'
        }));

        const order = await api()
            .post('/api/orders')
            .set(authHeader(seller.token))
            .send(makeOrderPayload({
                client: client.body.client._id,
                productId: product.body._id,
                quantity: 2
            }));
        expect(order.status).toBe(201);
        expect(order.body).toEqual(expect.objectContaining({
            subtotal: 20,
            discount: 0,
            tax: 3.2,
            totalPrice: 23.2,
            status: 'pendiente'
        }));

        const Product = mongoose.model('Product');
        const updatedProduct = await Product.findById(product.body._id);
        expect(updatedProduct.stock).toBe(3);

        const Client = mongoose.model('Client');
        const updatedClient = await Client.findById(client.body.client._id);
        expect(updatedClient.totalPurchaseCount).toBe(1);
        expect(updatedClient.purchaseHistory.map(String)).toContain(order.body._id);

        const completed = await api()
            .patch(`/api/orders/${order.body._id}/status`)
            .set(authHeader(seller.token))
            .send({ status: 'completado' });
        expect(completed.status).toBe(200);
        expect(completed.body).toHaveProperty('status', 'completado');

        const closed = await api()
            .post('/api/total-cash/close')
            .set(authHeader(seller.token))
            .send({
                pin: '12345',
                isCashCorrect: true
            });
        expect(closed.status).toBe(200);
        expect(closed.body.session).toEqual(expect.objectContaining({
            status: 'closed',
            totalSales: 23.2,
            expectedCash: 123.2,
            isCashCorrect: true
        }));
    });
});
