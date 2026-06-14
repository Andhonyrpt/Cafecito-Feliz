import { useEffect, useState } from "react";
import Button from "../../common/Button/Button";
import Icon from "../../common/Icon";
import './CheckoutConfirmationModal.css';

export default function CheckoutConfirmationModal({
    onClose,
    onConfirm,
    previewData,
    paymentMethod,
    orderType,
    activeClient,
    orderItems
}) {
    const [montoRecibido, setMontoRecibido] = useState('');
    const [cambio, setCambio] = useState(0);
    const [terminalStatus, setTerminalStatus] = useState('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalAPagar = previewData?.total || 0;

    const metodoNormalizado = paymentMethod ? paymentMethod.toLowerCase().trim() : 'efectivo';
    const esEfectivo = metodoNormalizado === 'efectivo';

    const obtenerTextoTipoOrden = () => {
        if (!orderType) return "";
        const type = orderType.toLowerCase().trim();
        if (type === 'local') return " - Consumo Local";
        if (type === 'para_llevar' || type === 'llevar') return " - Para Llevar";
        return ` - ${orderType}`;
    };

    useEffect(() => {
        if (paymentMethod === 'efectivo' && montoRecibido) {
            const efectivo = parseFloat(montoRecibido);

            if (!isNaN(efectivo) && efectivo >= totalAPagar) {
                setCambio(efectivo - totalAPagar);
            } else {
                setCambio(0);
            }
        } else {
            setCambio(0);
        }
    }, [montoRecibido, totalAPagar, paymentMethod]);

    const handleTarjetaFlow = () => {
        setTerminalStatus('procesando');

        setTimeout(() => {
            setTerminalStatus('aprobado');
        }, 2500);
    };

    const handleSubmit = async () => {
        if (paymentMethod === "efectivo") {
            const efectivo = parseFloat(montoRecibido);

            if (isNaN(efectivo) || efectivo < totalAPagar) {
                alert("El monto recibido es menor al total a pagar.");
                return;
            }
        }

        setIsSubmitting(true);
        // Le avisamos al OrderPanel que mande la orden definitiva a MongoDB
        await onConfirm();
        setIsSubmitting(false);
    };

    return (
        <div className="pos-modal-overlay">
            <div className="checkout-modal-container">
                <div className="checkout-modal-header">
                    <div className="header-title-group">
                        <Icon name={paymentMethod === 'efectivo' ? 'cash' : 'creditCard'} size={24} />
                        <h2>Confirmación de Cobro {obtenerTextoTipoOrden()}</h2>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={isSubmitting || terminalStatus === "procesando"}
                        className="close-x-btn"
                    >
                        <Icon name='close' size={18} />
                    </button>
                </div>

                <div className="checkout-modal-body">
                    <div className="checkout-summary-section">
                        <h3>Resumen del Pedido</h3>

                        <div className="checkout-items-review">
                            {orderItems && orderItems.map((item, index) => {
                                const p = item.product || item;
                                const note = item.orderNotes;

                                return (
                                    <div className="review-item-row" key={p._id}>
                                        <div className="review-item-main">
                                            <span className="review-item-qty">{item.quantity}x</span>
                                            <div className="review-item-details">
                                                <span className="review-item-name">{p.name}</span>

                                                {note && (
                                                    <span className="review-item-notes" >
                                                        📝 {note}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <span className="review-item-price">${((p.price || 0) * item.quantity).toFixed(2)}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="checkout-financials-box">
                            <div className="financial-row">
                                <span>Subtotal:</span>
                                <span>${previewData?.subtotal.toFixed(2)}</span>
                            </div>

                            {previewData?.discount > 0 && (
                                <div className="financial-row discount-text">
                                    <span>Descuento:</span>
                                    <span>-${previewData?.discount.toFixed(2)}</span>
                                </div>
                            )}

                            <div className="financial-row">
                                <span>IVA({previewData?.taxRate}):</span>
                                <span>${previewData?.tax.toFixed(2)}</span>
                            </div>

                            <div className="financial-row total-row">
                                <span>Total a Cobrar:</span>
                                <span>${totalAPagar.toFixed(2)}</span>
                            </div>

                            {activeClient && (
                                <p className="client-vip-tag">
                                    👤 Cliente VIP: {activeClient.displayName}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="checkout-action-section">
                        {esEfectivo ? (
                            <div className="cash-payment-flow">
                                <h3>Manejo de Efectivo</h3>

                                <div className="input-group-cash">
                                    <label>¿Con cuánto paga el cliente?</label>

                                    <div className="cash-input-wrapper">
                                        <span>$</span>

                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={montoRecibido}
                                            onChange={(e) => setMontoRecibido(e.target.value)}
                                            disabled={isSubmitting}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className="change-display-box">
                                    <span>Cambio a entregar:</span>
                                    <h2 className={cambio > 0 ? 'positive-change' : ''}>
                                        ${cambio.toFixed(2)}
                                    </h2>
                                </div>
                            </div>
                        ) : (
                            <div className="card-payment-flow">
                                <h3>Terminal Bancaria Integrada</h3>

                                {terminalStatus === 'idle' && (
                                    <div className="terminal-state-box idle">
                                        <Icon name='creditCard' size={48} />
                                        <p>
                                            Presiona el botón para enviar el monto de <strong>${totalAPagar.toFixed(2)} MXN</strong> a la terminal.
                                        </p>

                                        <Button
                                            variant="secondary"
                                            onClick={handleTarjetaFlow}
                                        >
                                            Conectar Terminal
                                        </Button>
                                    </div>
                                )}

                                {terminalStatus === 'procesando' && (
                                    <div className="terminal-state-box processing">
                                        <div className="spinner-loader"></div>
                                        <p><strong>Esperando pago...</strong></p>
                                        <span>Inserte, deslice o acerque la tarjeta a la terminal</span>
                                    </div>
                                )}

                                {terminalStatus === 'aprobado' && (
                                    <div className="terminal-state-box approved">
                                        <Icon name='check' size={48} className="success-icon" />
                                        <p><strong>Pago Aprobado</strong></p>
                                        <span>Transacción bancaria exitosa ID: {Math.floor(Math.random() * 900000 + 100000)}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="checkout-modal-footer">
                    <Button
                        variant="ghost"
                        className="modal-cancel-btn"
                        onClick={onClose}
                        disabled={isSubmitting || terminalStatus === 'procesando'}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        className="modal-submit-btn"
                        disabled={
                            isSubmitting || (paymentMethod === 'tarjeta' && terminalStatus !== 'aprobado') ||
                            (paymentMethod === 'efectivo' && (!montoRecibido || parseFloat(montoRecibido) < totalAPagar))
                        }
                    >
                        {isSubmitting ? 'Procesando' : 'Aceptar y Procesar Venta'}
                    </Button>
                </div>
            </div>
        </div>
    );
};