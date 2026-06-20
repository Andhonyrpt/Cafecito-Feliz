import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { useOrder } from "../../../context/OrderContext";
import { useSession } from "../../../context/SessionContext.jsx";
import { clearProductsCache } from "../../../services/productService.js";
import { createOrder, previewOrder } from "../../../services/orderSevice.js";
import { getUserProfile } from "../../../services/userService.js";
import Button from "../../atoms/Button/Button.jsx";
import Icon from "../../atoms/Icon";
import ClientSelector from "../../molecules/ClientSelector/ClientSelector";
import './OrderPanel.css';

const CreateClientModal = lazy(() => import('../OrderModals/CreateClientModal.jsx'));
const CheckoutConfirmationModal = lazy(() => import("../OrderModals/CheckoutConfirmationModal.jsx"));

function ModalFallback() {
    return <div className="modal-loading" role="status">Preparando...</div>;
}

export default function OrderPanel({ onOrderSuccess }) {

    const {
        orderItems,
        activeClient,
        subtotal,
        discount,
        iva,
        totalToPay,
        updateItemQuantity,
        removeItemFromOrder,
        setClientToOrder,
        removeClientFromOrder,
        resetPOSPanel
    } = useOrder();

    const { currentUser } = useSession();
    const canSell = currentUser?.role === 'vendedor';

    // Estado para controlar el método de pago seleccionado en la barra inferior
    const [paymentMethod, setPaymentMethod] = useState('efectivo');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [orderType, setOrderType] = useState('local');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!currentUser) {
            resetPOSPanel();
        }
    }, [currentUser, resetPOSPanel]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            // Si el menú está abierto y el clic NO fue dentro del contenedor del dropdown, lo cerramos
            if (isDropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        // Escuchamos los clics en toda la pantalla del navegador
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            // Limpiamos el evento al desmontar el componente
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const handleOpenModal = () => {
        setIsClientModalOpen(true);
    };

    const handleSelectOrderType = (type) => {
        setOrderType(type);
        setIsDropdownOpen(false); // Cierra el menú automáticamente
    };

    // Acción del botón principal "Cobrar (F2)"
    const handleCheckout = async () => {

        if (orderItems.length === 0) {
            alert("El pedido está vacío.");
            return;
        }

        if (!canSell) {
            return;
        }

        setIsLoading(true);

        try {
            const normalizedProducts = orderItems.map((item) => {
                const p = item.product || item;

                return {
                    productId: p._id,
                    quantity: item.quantity,
                    notes: item.orderNotes || item.notes || ''
                };
            });

            const dataCalculated = await previewOrder(normalizedProducts, activeClient?._id || null);

            setPreviewData(dataCalculated);
            setIsCheckoutModalOpen(true);
        } catch (error) {
            alert(error.message || "Error al simular los totales.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmPayment = async () => {
        try {
            setIsLoading(true);

            const userProfile = await getUserProfile();
            const userId = userProfile?._id;

            if (!userId) {
                throw new Error("No se pudo obtener el perfil del cajero");
            }

            const finalProducts = orderItems.map((item) => {
                const p = item.product || item;

                return {
                    productId: p._id,
                    quantity: item.quantity,
                    notes: item.orderNotes || item.notes || ''
                };
            });

            const orderPayload = {
                user: userId,
                client: activeClient?._id || null,
                products: finalProducts,
                paymentMethod: paymentMethod,
                orderType: orderType,
                subtotal: previewData?.subtotal || subtotal,
                discount: previewData?.discount || 0,
                tax: previewData?.tax || iva,
                total: previewData?.total || totalToPay
            };

            await createOrder(orderPayload);

            alert('Cobro realizado con éxito');

            clearProductsCache();

            if (onOrderSuccess) {
                onOrderSuccess();
            }

            setIsCheckoutModalOpen(false);
            setPreviewData(null);
            removeClientFromOrder();
            resetPOSPanel();
            setPaymentMethod('efectivo');
            setOrderType('local');

        } catch (error) {
            console.error("Error al guardar la orden en el servidor:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="order-view">
            <ClientSelector
                activeClient={activeClient}
                onSelectClient={setClientToOrder}
                onRemoveClient={removeClientFromOrder}
                onOpenClientModal={handleOpenModal}
            />

            <div className="order-view-info">
                <div className="order-view-header">
                    <h2>Pedidos</h2>

                    <div className="order-type-container" ref={dropdownRef}>
                        <button
                            type="button"
                            className="dropdown-btn"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <Icon name={orderType === 'local' ? 'shop' : 'bag'}
                                size={16}
                                className="dropdown-inline-icon"
                            />

                            <span>{orderType === 'local' ? 'Consumir aquí' : 'Para llevar'}</span>

                            <Icon
                                name='chevronDown'
                                size={14}
                                className="dropdown-arrow-icon"
                            />
                        </button>

                        {isDropdownOpen && (
                            <div className="dropdown-menu">
                                <button
                                    type="button"
                                    className={`dropdown-menu-item ${orderType === 'local' ? 'selected' : ''}`}
                                    onClick={() => handleSelectOrderType('local')}
                                >
                                    <Icon name="shop" size={14} />
                                    <span>Consumir aquí</span>
                                </button>

                                <button
                                    type="button"
                                    className={`dropdown-menu-item ${orderType === 'llevar' ? 'selected' : ''}`}
                                    onClick={() => handleSelectOrderType('llevar')}
                                >
                                    <Icon name="bag" size={14} />
                                    <span>Para llevar</span>
                                </button>
                            </div>
                        )}
                    </div>

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

                        const totalAcumuladoEnCarrito = orderItems
                            .filter((i) => (i.product?._id || i._id) === currentItemId)
                            .reduce((sum, i) => sum + i.quantity, 0);

                        // 2. Creamos los booleanos limpios para los botones
                        const esMaximoStock = totalAcumuladoEnCarrito >= availableStock;
                        const esMinimoStock = item.quantity <= 1;

                        return (
                            <div className="order-item" key={currentItemId}>

                                <div className="order-item-quantity">
                                    <div className="item-quantity-span">
                                        <span>{item.quantity}</span>
                                    </div>

                                    <div className="item-quantity-controls">
                                        <button
                                            type="button"
                                            onClick={() => updateItemQuantity(currentItemId, item.quantity + 1, item.orderNotes, availableStock)}
                                            disabled={esMaximoStock}
                                        >
                                            <Icon name="chevronUp" size={15}></Icon>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateItemQuantity(currentItemId, item.quantity - 1, item.orderNotes)}
                                            disabled={esMinimoStock}
                                        >
                                            <Icon name="chevronDown" size={15}></Icon>
                                        </button>
                                    </div>
                                </div>

                                <div className="order-item-image">
                                    <img
                                        src={p?.imageUrl}
                                        alt={p?.name}
                                        loading="lazy"
                                        decoding="async"
                                        width="55"
                                        height="55"
                                    />
                                </div>

                                <div className="order-item-info">
                                    <h3>{p?.name}</h3>
                                    <p className="order-item-price">{`$${(p?.price || 0).toFixed(2)}`}</p>
                                </div>

                                <Button variant="ghost" className="danger" size="sm"
                                    onClick={() => removeItemFromOrder({ _id: currentItemId, orderNotes: item.orderNotes })}
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

                    {discount > 0 && (
                        <div className="summary-row discount">
                            <span>Descuento:</span>
                            <span>-${discount.toFixed(2)}</span>
                        </div>
                    )}

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
                    disabled={isLoading || orderItems.length === 0 || !canSell}
                    data-testid="order-checkout-button"
                >
                    {isLoading ? 'Calculando' : (canSell ? 'Cobrar' : 'Cobro no disponible')}
                </Button>

                <div className="payment-grid">
                    <button
                        className={`payment-tile ${paymentMethod === 'efectivo' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('efectivo')}
                        data-testid="payment-method-cash"
                    >
                        <Icon name="cash" size={24} />
                        <span>Efectivo</span>
                    </button>
                    <button
                        className={`payment-tile ${paymentMethod === 'tarjeta' ? 'active' : ''}`}
                        onClick={() => setPaymentMethod('tarjeta')}
                        data-testid="payment-method-card"
                    >
                        <Icon name="creditCard" size={24} />
                        <span>Tarjeta</span>
                    </button>
                </div>
            </div>

            {isClientModalOpen && (
                <Suspense fallback={<ModalFallback />}>
                    <CreateClientModal
                        onClose={() => setIsClientModalOpen(false)}
                        onClientCreated={(newClient) => {
                            setClientToOrder(newClient); // Lo asigna directo a la orden al crearse
                            setIsClientModalOpen(false); // Cierra el modal
                        }}
                    />
                </Suspense>
            )}

            {isCheckoutModalOpen && (
                <Suspense fallback={<ModalFallback />}>
                    <CheckoutConfirmationModal
                        onClose={() => {
                            setIsCheckoutModalOpen(false);
                            setPreviewData(null);
                        }}
                        onConfirm={handleConfirmPayment}
                        previewData={previewData}
                        orderType={orderType}
                        activeClient={activeClient}
                        orderItems={orderItems}
                        paymentMethod={paymentMethod}
                    />
                </Suspense>
            )}
        </div>
    );
};
