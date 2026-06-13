/**
 * Criterios de negocio centralizados para el cálculo de pedidos.
 * Este helper asegura que tanto la previsualización como la creación real
 * de órdenes utilicen las mismas reglas.
 */

export const TAX_RATE = 0.16; // IVA 16%

/**
 * Calcula el desglose financiero de un pedido.
 * 
 * @param {Array} products - Lista de productos normalizados con {price, quantity}
 * @returns {Object} { subtotal, tax, shippingCost, total }
 */
export function calculateOrderFinancials(products, discount = 0) {
    const subtotal = products.reduce(
        (acc, item) => acc + (item.price * item.quantity),
        0
    );

    const discountAmount = Number((subtotal * discountPercentage).toFixed(2));

    const baseImponible = subtotal - discountAmount;
    const tax = Number((baseImponible * TAX_RATE).toFixed(2));
    const total = Number((baseImponible + tax).toFixed(2));

    return {
        subtotal: Number(subtotal.toFixed(2)),
        discount: discountAmount,
        tax,
        total
    };
}