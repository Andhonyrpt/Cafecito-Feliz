import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon';
import Receipt from '../Receipt/Receipt';
import './SaleCompletedModal.css';

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
};

export default function SaleCompletedModal({ order, onClose }) {
    if (!order) return null;

    const total = order.totalPrice ?? order.total ?? 0;

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="sale-completed-overlay" role="dialog" aria-modal="true" aria-labelledby="sale-completed-title">
            <div className="sale-completed-modal">
                <div className="sale-completed-modal__icon">
                    <Icon name="check" size={32} />
                </div>

                <h2 id="sale-completed-title">Venta realizada</h2>
                <p>La orden #{order.orderNumber} fue registrada correctamente.</p>

                <div className="sale-completed-modal__summary">
                    <div>
                        <span>Total</span>
                        <strong>{formatCurrency(total)}</strong>
                    </div>
                    <div>
                        <span>Método</span>
                        <strong>{order.paymentMethod === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}</strong>
                    </div>
                    <div>
                        <span>Tipo</span>
                        <strong>{order.orderType === 'llevar' ? 'Para llevar' : 'Consumir aquí'}</strong>
                    </div>
                </div>

                <div className="sale-completed-modal__actions">
                    <Button variant="secondary" onClick={handlePrint}>
                        <Icon name="print" size={16} /> Imprimir ticket
                    </Button>
                    <Button variant="primary" onClick={onClose}>
                        Nueva venta
                    </Button>
                </div>
            </div>

            <Receipt order={order} />
        </div>
    );
}
