import { useCallback, useEffect, useRef, useState } from "react";
import Button from "../../atoms/Button/Button";
import Icon from "../../atoms/Icon";
import { getPendingOrders, updateOrderStatus } from "../../../services/orderSevice";
import "./PendingOrders.css";

export default function PendingOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingOrderId, setUpdatingOrderId] = useState(null);
    const [highlightedOrderIds, setHighlightedOrderIds] = useState([]);
    const knownOrderIdsRef = useRef(new Set());
    const hasLoadedOnceRef = useRef(false);
    const audioContextRef = useRef(null);

    const playNewOrderSound = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;

            if (!AudioContext) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const audioContext = audioContextRef.current;
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();

            oscillator.type = "sine";
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.12);

            gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.32);

            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.34);
        } catch (error) {
            // Browsers can block audio before user interaction; the visual highlight still notifies the barista.
        }
    }, []);

    const loadOrders = useCallback(async () => {
        try {
            setError("");
            const data = await getPendingOrders();
            const nextOrders = data?.orders || [];
            const nextOrderIds = new Set(nextOrders.map((order) => order._id));

            if (hasLoadedOnceRef.current) {
                const newOrderIds = nextOrders
                    .map((order) => order._id)
                    .filter((orderId) => !knownOrderIdsRef.current.has(orderId));

                if (newOrderIds.length > 0) {
                    setHighlightedOrderIds(newOrderIds);
                    playNewOrderSound();

                    setTimeout(() => {
                        setHighlightedOrderIds((currentIds) => currentIds.filter((id) => !newOrderIds.includes(id)));
                    }, 6000);
                }
            }

            knownOrderIdsRef.current = nextOrderIds;
            hasLoadedOnceRef.current = true;
            setOrders(nextOrders);
        } catch (error) {
            setError(error?.message || "No se pudieron cargar las órdenes pendientes.");
        } finally {
            setLoading(false);
        }
    }, [playNewOrderSound]);

    useEffect(() => {
        loadOrders();
        const interval = setInterval(loadOrders, 15000);
        return () => clearInterval(interval);
    }, [loadOrders]);

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

    const formatOrderTime = (createdAt) => {
        if (!createdAt) return "";

        return new Intl.DateTimeFormat("es-MX", {
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(createdAt));
    };

    if (loading) {
        return <section className="pending-orders-state">Cargando órdenes pendientes...</section>;
    }

    return (
        <section className="pending-orders">
            <div className="pending-orders__header">
                <div>
                    <p className="pending-orders__eyebrow">Barista</p>
                    <h1>Mis órdenes asignadas</h1>
                </div>

                <Button variant="secondary" onClick={loadOrders}>
                    <Icon name="refresh" size={16} /> Actualizar
                </Button>
            </div>

            {error && <div className="pending-orders__error">{error}</div>}

            {orders.length === 0 ? (
                <div className="pending-orders__empty">
                    <Icon name="check" size={32} />
                    <p>No tienes órdenes pendientes por preparar.</p>
                </div>
            ) : (
                <div className="pending-orders__grid">
                    {orders.map((order) => (
                        <article
                            className={`pending-order-card ${highlightedOrderIds.includes(order._id) ? "pending-order-card--new" : ""}`}
                            key={order._id}
                        >
                            <div className="pending-order-card__top">
                                <div>
                                    <span className="pending-order-card__number">Orden #{order.orderNumber}</span>
                                    <h2>{order.orderType === "llevar" ? "Para llevar" : "Consumir aquí"}</h2>
                                    {order.createdAt && (
                                        <small className="pending-order-card__time">Recibida {formatOrderTime(order.createdAt)}</small>
                                    )}
                                </div>
                                <span className="pending-order-card__status">Pendiente</span>
                            </div>

                            {order.client?.displayName && (
                                <p className="pending-order-card__client">Cliente: {order.client.displayName}</p>
                            )}

                            <ul className="pending-order-card__items">
                                {order.products?.map((item, index) => (
                                    <li key={`${order._id}-${item.productId?._id || item.productId}-${item.notes || ""}-${index}`}>
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
