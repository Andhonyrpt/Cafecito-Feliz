import Category from '../src/models/category.js';
import Product from '../src/models/product.js';
import { api, authHeader } from './helpers/http.js';
import { makeUserPayload } from './helpers/factories.js';

describe('Ethical hacking checks', () => {
    it('forces public self-registration to vendedor and blocks admin-only routes', async () => {
        const attacker = makeUserPayload({
            displayName: 'Public Admin Attacker',
            employeeId: 'EMP-9001',
            role: 'admin'
        });

        const register = await api()
            .post('/api/auth/register')
            .send(attacker);

        expect(register.status).toBe(201);
        expect(register.body).toMatchObject({
            employeeId: attacker.employeeId,
            role: 'vendedor'
        });

        const login = await api()
            .post('/api/auth/login')
            .send({ employeeId: attacker.employeeId, password: attacker.password });

        expect(login.status).toBe(200);
        expect(login.body.user).toHaveProperty('role', 'vendedor');

        const adminOnly = await api()
            .get('/api/users')
            .set(authHeader(login.body.token));

        expect(adminOnly.status).toBe(403);
        expect(adminOnly.body).toHaveProperty('message', 'Admin access required');
    });

    it('protects employee role and PIN checks from unauthenticated requests', async () => {
        const user = makeUserPayload({
            displayName: 'PIN Probe Target',
            employeeId: 'EMP-9002',
            role: 'barista'
        });

        await api().post('/api/auth/register').send(user);

        const roleProbe = await api().get(`/api/auth/check-role/${user.employeeId}`);

        expect(roleProbe.status).toBe(401);
        expect(roleProbe.body).toHaveProperty('message', 'Unauthorized');

        const wrongPin = await api()
            .post('/api/auth/verify-pin')
            .send({ employeeId: user.employeeId, password: '99999' });

        expect(wrongPin.status).toBe(401);
        expect(wrongPin.body).toHaveProperty('message', 'Unauthorized');

        const unknownUser = await api()
            .post('/api/auth/verify-pin')
            .send({ employeeId: 'EMP-999999', password: '99999' });

        expect(unknownUser.status).toBe(401);
        expect(unknownUser.body).toHaveProperty('message', 'Unauthorized');
    });

    it('rejects NoSQL operator payloads in sensitive auth inputs', async () => {
        const loginInjection = await api()
            .post('/api/auth/login')
            .send({
                employeeId: { $ne: null },
                password: '12345'
            });

        expect(loginInjection.status).toBe(422);
        expect(loginInjection.body).toHaveProperty('errors');

        const user = makeUserPayload({
            displayName: 'Role Probe Target',
            employeeId: 'EMP-9004',
            role: 'vendedor'
        });

        const register = await api().post('/api/auth/register').send(user);
        const login = await api()
            .post('/api/auth/login')
            .send({ employeeId: user.employeeId, password: user.password });

        expect(register.status).toBe(201);
        expect(login.status).toBe(200);

        const roleInjection = await api()
            .get('/api/auth/check-role/not-a-mongo-id')
            .set(authHeader(login.body.token));

        expect(roleInjection.status).toBe(422);
        expect(roleInjection.body).toHaveProperty('errors');

        const pinInjection = await api()
            .post('/api/auth/verify-pin')
            .set(authHeader(login.body.token))
            .send({
                employeeId: { $ne: null },
                password: '99999'
            });

        expect(pinInjection.status).toBe(422);
        expect(pinInjection.body).toHaveProperty('errors');
    });

    it('rejects invalid preview client ids without leaking stack traces', async () => {
        const attacker = makeUserPayload({
            displayName: 'Stack Leak Attacker',
            employeeId: 'EMP-9003',
            role: 'admin'
        });

        await api().post('/api/auth/register').send(attacker);

        const login = await api()
            .post('/api/auth/login')
            .send({ employeeId: attacker.employeeId, password: attacker.password });

        const category = await Category.create({
            name: `Stack Leak Category ${Date.now()}`,
            imageUrl: 'http://example.com/category.jpg'
        });

        const product = await Product.create({
            name: `Stack Leak Product ${Date.now()}`,
            price: 10,
            stock: 5,
            imageUrl: 'http://example.com/product.jpg',
            parentCategory: category._id
        });

        const response = await api()
            .post('/api/orders/preview')
            .set(authHeader(login.body.token))
            .send({
                products: [{ productId: product._id.toString(), quantity: 1 }],
                client: 'not-a-mongo-id'
            });

        expect(response.status).toBe(422);
        expect(response.body).toHaveProperty('errors');
    });
});
