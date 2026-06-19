import { useEffect, useState } from "react";
import Button from "../../atoms/Button/Button";
import Icon from "../../atoms/Icon";
import { getPendingOrders, updateOrderStatus } from "../../../services/orderSevice";
import "./PendingOrders.css";

export default function PendingOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingOrderId, setUpdatingOrderId] = useState(null);

    const loadOrders = async () => {
        try {
            setError("");
            const data = await getPendingOrders();
            setOrders(data?.orders || []);
        } catch (error) {
            setError(error?.message || "No se pudieron cargar las órdenes pendientes.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleComplete = async (orderId) => {
        try {
            setUpdatingOrderId(orderId);
            await updateOrderStatus(orderId);
            setOrders((currentOrders) => currentOrders.filter((order) => order._id !== orderId));
        } catch (error) {
            setError(error?.message || "No se pudo completar la orden.");
        } finally {
            setUpdatingOrderId(null);
        }
    };

    if (loading) {
        return <section className="pending-orders-state">Cargando órdenes pendientes...</section>;
    }

    return (
        <section className="pending-orders">
            <div className="pending-orders__header">
                <div>
                    <p className="pending-orders__eyebrow">Barista</p>
                    <h1>Órdenes pendientes</h1>
                </div>

                <Button variant="secondary" onClick={loadOrders}>
                    <Icon name="refresh" size={16} /> Actualizar
                </Button>
            </div>

            {error && <div className="pending-orders__error">{error}</div>}

            {orders.length === 0 ? (
                <div className="pending-orders__empty">
                    <Icon name="check" size={32} />
                    <p>No hay órdenes pendientes por preparar.</p>
                </div>
            ) : (
                <div className="pending-orders__grid">
                    {orders.map((order) => (
                        <article className="pending-order-card" key={order._id}>
                            <div className="pending-order-card__top">
                                <div>
                                    <span className="pending-order-card__number">Orden #{order.orderNumber}</span>
                                    <h2>{order.orderType === "llevar" ? "Para llevar" : "Consumir aquí"}</h2>
                                </div>
                                <span className="pending-order-card__status">Pendiente</span>
                            </div>

                            {order.client?.displayName && (
                                <p className="pending-order-card__client">Cliente: {order.client.displayName}</p>
                            )}

                            <ul className="pending-order-card__items">
                                {order.products?.map((item) => (
                                    <li key={`${order._id}-${item.productId?._id || item.productId}-${item.notes || ""}`}>
                                        <span>{item.quantity}x {item.productId?.name || "Producto"}</span>
                                        {item.notes && <small>{item.notes}</small>}
                                    </li>
                                ))}
                            </ul>

                            <Button
                                variant="primary"
                                className="pending-order-card__action"
                                onClick={() => handleComplete(order._id)}
                                disabled={updatingOrderId === order._id}
                            >
                                {updatingOrderId === order._id ? "Completando..." : "Marcar completada"}
                            </Button>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
