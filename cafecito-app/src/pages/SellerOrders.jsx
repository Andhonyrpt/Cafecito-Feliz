import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/atoms/Button/Button';
import Icon from '../components/atoms/Icon';
import Receipt from '../components/organisms/Receipt/Receipt';
import { getMyShiftOrders } from '../services/orderService';
import './SellerOrders.css';

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
};

const formatTime = (date) => {
    if (!date) return '';

    return new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
};

export default function SellerOrders() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [summary, setSummary] = useState({});
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadShiftOrders = async () => {
        try {
            setError('');
            const data = await getMyShiftOrders();

            setOrders(data?.orders || []);
            setSummary(data?.summary || {});
        } catch (error) {
            setError(error?.message || 'No se pudieron cargar las ventas del turno.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShiftOrders();
    }, []);

    const handlePrint = (order) => {
        setSelectedOrder(order);
        setTimeout(() => window.print(), 50);
    };

    if (loading) {
        return <section className="seller-orders-state">Cargando ventas del turno...</section>;
    }

    return (
        <section className="seller-orders">
            <div className="seller-orders__header">
                <div>
                    <p className="seller-orders__eyebrow">Vendedor</p>
                    <h1>Ventas de mi turno</h1>
                </div>

                <div className="seller-orders__actions">
                    <Button variant="secondary" onClick={() => navigate('/')}>
                        Volver al POS
                    </Button>
                    <Button variant="secondary" onClick={loadShiftOrders}>
                        <Icon name="refresh" size={16} /> Actualizar
                    </Button>
                </div>
            </div>

            {error && <div className="seller-orders__error">{error}</div>}

            <div className="seller-orders__kpis">
                <article>
                    <span>Total vendido</span>
                    <strong>{formatCurrency(summary.totalSales)}</strong>
                </article>
                <article>
                    <span>Órdenes</span>
                    <strong>{summary.orderCount || 0}</strong>
                </article>
                <article>
                    <span>Efectivo</span>
                    <strong>{formatCurrency(summary.cashSales)}</strong>
                </article>
                <article>
                    <span>Tarjeta</span>
                    <strong>{formatCurrency(summary.cardSales)}</strong>
                </article>
                <article>
                    <span>Ticket promedio</span>
                    <strong>{formatCurrency(summary.averageTicket)}</strong>
                </article>
            </div>

            <div className="seller-orders__list">
                {orders.length === 0 ? (
                    <div className="seller-orders__empty">Aún no hay ventas registradas en este turno.</div>
                ) : (
                    orders.map((order) => (
                        <article className="seller-order-card" key={order._id}>
                            <div>
                                <span className="seller-order-card__number">Orden #{order.orderNumber}</span>
                                <h2>{formatCurrency(order.totalPrice)}</h2>
                                <p>{formatTime(order.createdAt)} · {order.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'} · {order.orderType === 'llevar' ? 'Para llevar' : 'Consumir aquí'}</p>
                                {order.client?.displayName && <p>Cliente: {order.client.displayName}</p>}
                            </div>

                            <Button variant="secondary" onClick={() => handlePrint(order)}>
                                <Icon name="print" size={16} /> Reimprimir
                            </Button>
                        </article>
                    ))
                )}
            </div>

            {selectedOrder && <Receipt order={selectedOrder} />}
        </section>
    );
}
