import './Receipt.css';

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
};

const formatDate = (date) => {
    if (!date) return '';

    return new Intl.DateTimeFormat('es-MX', {
        dateStyle: 'short',
        timeStyle: 'short'
    }).format(new Date(date));
};

export default function Receipt({ order }) {
    if (!order) return null;

    const total = order.totalPrice ?? order.total ?? 0;

    return (
        <section className="receipt-print-root" aria-label="Ticket de compra">
            <div className="receipt">
                <header className="receipt__header">
                    <h1>Cafecito Feliz</h1>
                    <p>Gracias por su compra</p>
                </header>

                <div className="receipt__meta">
                    <div>
                        <span>Orden</span>
                        <strong>#{order.orderNumber}</strong>
                    </div>
                    <div>
                        <span>Fecha</span>
                        <strong>{formatDate(order.createdAt || new Date())}</strong>
                    </div>
                    {order.user?.displayName && (
                        <div>
                            <span>Cajero</span>
                            <strong>{order.user.displayName}</strong>
                        </div>
                    )}
                    {order.client?.displayName && (
                        <div>
                            <span>Cliente</span>
                            <strong>{order.client.displayName}</strong>
                        </div>
                    )}
                    <div>
                        <span>Tipo</span>
                        <strong>{order.orderType === 'llevar' ? 'Para llevar' : 'Consumir aqui'}</strong>
                    </div>
                    <div>
                        <span>Pago</span>
                        <strong>{order.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}</strong>
                    </div>
                </div>

                <div className="receipt__divider" />

                <ul className="receipt__items">
                    {order.products?.map((item, index) => {
                        const product = item.productId || item.product || item;
                        const itemTotal = (item.price || product.price || 0) * (item.quantity || 0);

                        return (
                            <li className="receipt__item" key={`${product._id || product.name}-${item.notes || ''}-${index}`}>
                                <div className="receipt__item-main">
                                    <span>{item.quantity}x {product.name || 'Producto'}</span>
                                    <strong>{formatCurrency(itemTotal)}</strong>
                                </div>
                                {item.notes && <small>Nota: {item.notes}</small>}
                            </li>
                        );
                    })}
                </ul>

                <div className="receipt__divider" />

                <div className="receipt__totals">
                    <div>
                        <span>Subtotal</span>
                        <strong>{formatCurrency(order.subtotal)}</strong>
                    </div>
                    {(order.discount || 0) > 0 && (
                        <div>
                            <span>Descuento</span>
                            <strong>-{formatCurrency(order.discount)}</strong>
                        </div>
                    )}
                    <div>
                        <span>IVA</span>
                        <strong>{formatCurrency(order.tax)}</strong>
                    </div>
                    <div className="receipt__total">
                        <span>Total</span>
                        <strong>{formatCurrency(total)}</strong>
                    </div>
                </div>

                <footer className="receipt__footer">
                    <p>Conserve este comprobante.</p>
                    <p>cafecito feliz</p>
                </footer>
            </div>
        </section>
    );
}
