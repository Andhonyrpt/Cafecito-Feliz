import { validationResult } from 'express-validator';
import {
    cashCloseValidation,
    imageUrlValidation,
    orderStatusValidation,
    stockValidation
} from '../../src/middlewares/validators.js';
import { makeReq } from '../helpers/express.js';

const runValidators = async (validators, req) => {
    const chains = Array.isArray(validators) ? validators : [validators];
    await Promise.all(chains.map((validator) => validator.run(req)));
    return validationResult(req).array();
};

describe('validators', () => {
    describe('orderStatusValidation', () => {
        it('accepts current order status values and normalizes case', async () => {
            const req = makeReq({ body: { status: 'Completado' } });

            const errors = await runValidators(orderStatusValidation(), req);

            expect(errors).toEqual([]);
            expect(req.body.status).toBe('completado');
        });

        it('rejects unsupported status values', async () => {
            const req = makeReq({ body: { status: 'cancelado' } });

            const errors = await runValidators(orderStatusValidation(), req);

            expect(errors).toEqual([
                expect.objectContaining({ path: 'status', msg: 'Invalid status value' })
            ]);
        });
    });

    describe('stockValidation', () => {
        it('allows omitted stock when optional', async () => {
            const req = makeReq({ body: {} });

            const errors = await runValidators(stockValidation('stock', false), req);

            expect(errors).toEqual([]);
        });

        it('rejects negative stock', async () => {
            const req = makeReq({ body: { stock: -1 } });

            const errors = await runValidators(stockValidation(), req);

            expect(errors).toEqual([
                expect.objectContaining({ path: 'stock', msg: 'stock must be a non-negative integer' })
            ]);
        });
    });

    describe('imageUrlValidation', () => {
        it('accepts full URLs and relative paths', async () => {
            const fullUrlReq = makeReq({ body: { imageUrl: 'http://example.com/image.jpg' } });
            const relativeReq = makeReq({ body: { imageUrl: '/images/product.jpg' } });

            const fullUrlErrors = await runValidators(imageUrlValidation('imageUrl'), fullUrlReq);
            const relativeErrors = await runValidators(imageUrlValidation('imageUrl'), relativeReq);

            expect(fullUrlErrors).toEqual([]);
            expect(relativeErrors).toEqual([]);
        });

        it('rejects image values that are neither URLs nor relative paths', async () => {
            const req = makeReq({ body: { imageUrl: 'images/product.jpg' } });

            const errors = await runValidators(imageUrlValidation('imageUrl'), req);

            expect(errors).toEqual([
                expect.objectContaining({
                    path: 'imageUrl',
                    msg: 'La imagen debe ser una URL válida o una ruta relativa que empiece con /'
                })
            ]);
        });
    });

    describe('cashCloseValidation', () => {
        it('accepts valid cash close payloads with optional discrepancy reason', async () => {
            const req = makeReq({
                body: {
                    pin: '12345',
                    isCashCorrect: false,
                    discrepancyReason: 'Falta cambio'
                }
            });

            const errors = await runValidators(cashCloseValidation(), req);

            expect(errors).toEqual([]);
        });

        it('rejects invalid pin and missing cash correctness flag', async () => {
            const req = makeReq({ body: { pin: '12ab' } });

            const errors = await runValidators(cashCloseValidation(), req);

            expect(errors).toEqual(expect.arrayContaining([
                expect.objectContaining({ path: 'pin', msg: 'El PIN solo debe contener números.' }),
                expect.objectContaining({ path: 'pin', msg: 'El PIN debe tener al menos 5 dígitos.' }),
                expect.objectContaining({ path: 'isCashCorrect', msg: 'Debe especificar si el efectivo coincide.' })
            ]));
        });
    });
});
