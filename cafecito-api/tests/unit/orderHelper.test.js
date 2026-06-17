import { calculateOrderFinancials, TAX_RATE } from '../../src/utils/orderHelper.js';

describe('orderHelper', () => {
    describe('calculateOrderFinancials', () => {
        it('calculates subtotal, tax, and total without discount', () => {
            const result = calculateOrderFinancials([
                { price: 20, quantity: 2 },
                { price: 10, quantity: 1 }
            ]);

            expect(result).toEqual({
                subtotal: 50,
                discount: 0,
                tax: 8,
                total: 58
            });
            expect(TAX_RATE).toBe(0.16);
        });

        it('applies percentage discount before tax and rounds to two decimals', () => {
            const result = calculateOrderFinancials([
                { price: 19.99, quantity: 3 }
            ], 0.15);

            expect(result).toEqual({
                subtotal: 59.97,
                discount: 9,
                tax: 8.16,
                total: 59.13
            });
        });

        it('returns zero totals for an empty products array', () => {
            const result = calculateOrderFinancials([]);

            expect(result).toEqual({
                subtotal: 0,
                discount: 0,
                tax: 0,
                total: 0
            });
        });
    });
});
