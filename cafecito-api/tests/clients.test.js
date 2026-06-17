import { createUserWithToken } from './helpers/auth.js';
import { makeClientPayload } from './helpers/factories.js';
import { api, authHeader } from './helpers/http.js';

describe('Clients Module Tests', () => {
    let empToken = '';
    let clientId = '';
    let createdClientEmail = '';

    beforeAll(async () => {
        const employee = await createUserWithToken({
            displayName: 'Emp Client',
            employeeId: 'EMP-05'
        });
        empToken = employee.token;
    });

    describe('POST /api/clients', () => {
        it('should create a client', async () => {
            const clientPayload = makeClientPayload({
                displayName: 'John Doe',
                email: 'john@example.com'
            });

            const res = await api()
                .post('/api/clients')
                .set(authHeader(empToken))
                .send(clientPayload);
            
            expect(res.status).toBe(201);
            expect(res.body.client).toHaveProperty('email', clientPayload.email);
            clientId = res.body.client._id;
            createdClientEmail = clientPayload.email;
        });

        it('should fail if email is invalid', async () => {
            const res = await api()
                .post('/api/clients')
                .set(authHeader(empToken))
                .send(makeClientPayload({
                    email: 'invalid-email'
                }));
            expect(res.status).toBe(422);
        });
    });

    describe('GET /api/clients/check-email', () => {
        it('should check if email exists', async () => {
            const res = await api().get(`/api/clients/check-email?email=${encodeURIComponent(createdClientEmail)}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('taken');
        });
    });

    describe('GET /api/clients/search', () => {
        it('should search clients', async () => {
            const res = await api()
                .get('/api/clients/search?search=john')
                .set(authHeader(empToken));
            expect(res.status).toBe(200);
            expect(Array.isArray(res.body.clients)).toBe(true);
        });
    });

    describe('PUT /api/clients/:clientId', () => {
        it('should update client', async () => {
            const updatePayload = makeClientPayload({
                displayName: 'John Updated',
                email: 'john2@example.com'
            });

            const res = await api()
                .put(`/api/clients/${clientId}`)
                .set(authHeader(empToken))
                .send(updatePayload);
            expect(res.status).toBe(200);
            expect(res.body.client).toHaveProperty('displayName', updatePayload.displayName);
        });
    });
});
