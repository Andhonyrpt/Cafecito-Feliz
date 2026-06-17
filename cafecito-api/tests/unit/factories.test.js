import { makeEmployeeId, makeOrderPayload, makeUserPayload } from '../helpers/factories.js';

describe('test factories', () => {
    it('creates explicit and generated employee IDs', () => {
        expect(makeEmployeeId(42)).toBe('EMP-42');
        expect(makeEmployeeId()).toMatch(/^EMP-\d+$/);
    });

    it('creates user payloads with defaults and overrides', () => {
        const payload = makeUserPayload({ displayName: 'Factory User', employeeId: 'EMP-701' });

        expect(payload).toEqual(expect.objectContaining({
            displayName: 'Factory User',
            employeeId: 'EMP-701',
            password: '12345'
        }));
    });

    it('creates order payloads with default item or explicit products', () => {
        const defaultPayload = makeOrderPayload({ productId: 'product-1', quantity: 2 });
        const customProducts = [{ productId: 'product-2', quantity: 3, notes: 'sin azucar' }];
        const customPayload = makeOrderPayload({ products: customProducts });

        expect(defaultPayload.products).toEqual([{ productId: 'product-1', quantity: 2 }]);
        expect(customPayload.products).toBe(customProducts);
    });
});
