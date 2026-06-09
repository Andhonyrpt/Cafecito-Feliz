import { useState } from "react";
import { useOrder } from "../../context/OrderContext";
import Button from "../common/Button/Button.jsx";
import Icon from "../common/Icon";
import ClientSelector from "./ClientSelector";
import './OrderPanel.css';

export default function OrderPanel() {

    const {
        orderItems,
        activeClient,
        subtotal,
        iva,
        totalToPay,
        addItemToOrder,
        updateItemQuantity,
        removeItemFromOrder,
        removeClientFromOrder,
        resetPOSPanel
    } = useOrder();

    // Estado para controlar el método de pago seleccionado en la barra inferior
    const [paymentMethod, setPaymentMethod] = useState('efectivo');

    const handleOpenModal = () => {
        console.log("Abriendo modal para registrar un nuevo cliente en la BD");
        // Aquí disparas tu estado para abrir un formulario emergente (Modal)
    };

    // Acción del botón principal "Cobrar (F2)"
    const handleCheckout = () => {

        if (orderItems.length === 0) {
            alert("El pedido está vacío.");
            return;
        }

        const orderPayload = {
            clienteId: activeClient?._id || null,
            items: orderItems.map((item) => {
                const p = item.product || item;
                return {
                    productId: p._id,
                    quantity: item.quantity,
                    price: p.price || item.price
                };
            }),
            subtotal,
            iva,
            total: totalToPay,
            paymentMethod
        };
        console.log("Enviando orden de venta al Backend:", orderPayload);
        // Aquí disparas tu fetch POST de tu API de registrar productos

        alert("¡Cobro realizado con éxito!");
        resetPOSPanel();
    };

    return (
        <div className="order-view">
            <ClientSelector
                activeClient={activeClient}
                onRemoveClient={removeClientFromOrder}
                onOpenClientModal={handleOpenModal}
            />

            <div className="order-view-info">
                <div className="order-view-header">
                    <h2>Pedidos</h2>
                    {orderItems.length > 0 && (
                        <Button
                            variant="ghost"
                            className="danger"
                            size="sm"
                            onClick={resetPOSPanel}
                            title="Cancelar Pedido"
                        >
                            <Icon name="trash" size={15} />
                        </Button>
                    )}
                </div>

                <div className="order-items-list">
                    {orderItems && orderItems.map((item, index) => {
                        const p = item.product || item;
                        const currentItemId = p?._id;
                        const availableStock = p?.stock || 0;
                        const itemPrice = p?.price || 0;
                        const itemQuantity = item?.quantity || 0;
                        const totalItem = itemPrice * itemQuantity;

                        return (
                            <div className="order-item" key={currentItemId}>

                                <div className="order-item-quantity">
                                    <div className="item-quantity-span">
                                        <span>{item.quantity}</span>
                                    </div>

                                    <div  className="item-quantity-controls">
                                        <button
                                            variant="third"
                                            size="xsm"
                                            onClick={() => {
                                                if (item.quantity < availableStock) {
                                                    updateItemQuantity(currentItemId, item.quantity + 1)
                                                }
                                            }}
                                        >
                                            <Icon name="chevronUp" size={15}></Icon>
                                        </button>
                                        <button
                                            variant="third"
                                            size="xsm"
                                            onClick={() => updateItemQuantity(currentItemId, item.quantity - 1)}
                                        >
                                            <Icon name="chevronDown" size={15}></Icon>
                                        </button>
                                    </div>
                                </div>

                                <div className="order-item-image">
                                    <img src={p?.imageUrl} alt={p?.name} />
                                </div>

                                <div className="order-item-info">
                                    <h3>{p?.name}</h3>
                                    <p className="order-item-price">{`$${(p?.price || 0).toFixed(2)}`}</p>
                                </div>

                                <Button variant="ghost" className="danger" size="sm"
                                    onClick={() => removeItemFromOrder(currentItemId)}
                                    title="Eliminar articulo"
                                >
                                    <Icon name="trash" size={15} />
                                </Button>
                            </div>
                        );
                    })}
                </div>

                <div className="order-totals" >
                    <div>
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div>
                        <span>IVA (16%)</span>
                        <span>${iva.toFixed(2)}</span>
                    </div>
                    <div >
                        <span>Total a pagar</span>
                        <span >${totalToPay.toFixed(2)}</span>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={handleCheckout}
                >
                    Cobrar
                </Button>

                <div className="payment-grid">
                    <button
                        className={`payment-tile ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('efectivo')}
                    >
                        <Icon name="cash" size={24} />
                        <span>Efectivo</span>
                    </button>
                    <button
                        className={`payment-tile ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('tarjeta')}
                    >
                        <Icon name="creditCard" size={24} />
                        <span>Tarjeta</span>
                    </button>
                </div>
            </div>
        </div>
    );
};