import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderPanel from './OrderPanel';
import { useOrder } from '../../../context/OrderContext';
import { useSession } from '../../../context/SessionContext.jsx';
import { clearProductsCache } from '../../../services/productService.js';
import { createOrder, previewOrder } from '../../../services/orderService.js';
import { getUserProfile } from '../../../services/userService.js';

jest.mock('../../../context/OrderContext', () => ({
  useOrder: jest.fn()
}));

jest.mock('../../../context/SessionContext.jsx', () => ({
  useSession: jest.fn()
}));

jest.mock('../../../services/productService.js', () => ({
  clearProductsCache: jest.fn()
}));

jest.mock('../../../services/orderService.js', () => ({
  createOrder: jest.fn(),
  previewOrder: jest.fn()
}));

jest.mock('../../../services/userService.js', () => ({
  getUserProfile: jest.fn()
}));

jest.mock('../../molecules/ClientSelector/ClientSelector', () => ({
  __esModule: true,
  default: ({ activeClient }) => <div data-testid="client-selector-mock">{activeClient?.displayName || 'Sin cliente'}</div>
}));

jest.mock('../OrderModals/CreateClientModal.jsx', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('../OrderModals/CheckoutConfirmationModal.jsx', () => ({
  __esModule: true,
  default: ({ previewData, onConfirm }) => (
    <div data-testid="checkout-modal-mock">
      <span data-testid="checkout-preview-total">{previewData?.total}</span>
      <button data-testid="confirm-sale-button" onClick={onConfirm}>Confirmar</button>
    </div>
  )
}));

jest.mock('../OrderModals/SaleCompletedModal.jsx', () => ({
  __esModule: true,
  default: () => null
}));

describe('OrderPanel', () => {
  const removeClientFromOrder = jest.fn();
  const resetPOSPanel = jest.fn();
  const updateItemQuantity = jest.fn();
  const removeItemFromOrder = jest.fn();
  const setClientToOrder = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useSession.mockReturnValue({
      currentUser: {
        _id: 'seller-1',
        role: 'vendedor',
        displayName: 'Seller Test'
      }
    });

    useOrder.mockReturnValue({
      orderItems: [{
        _id: 'prod-1',
        name: 'Americano',
        price: 35,
        stock: 10,
        quantity: 2,
        notes: 'sin azucar'
      }],
      activeClient: {
        _id: 'client-1',
        displayName: 'Cliente VIP'
      },
      subtotal: 70,
      discount: 7,
      iva: 10.08,
      totalToPay: 73.08,
      updateItemQuantity,
      removeItemFromOrder,
      setClientToOrder,
      removeClientFromOrder,
      resetPOSPanel
    });
  });

  it('previews first and only creates the order after confirmation', async () => {
    previewOrder.mockResolvedValue({
      subtotal: 70,
      discount: 7,
      tax: 10.08,
      total: 73.08,
      taxRate: '16%'
    });
    getUserProfile.mockResolvedValue({ _id: 'seller-1' });
    createOrder.mockResolvedValue({
      orderNumber: 101,
      totalPrice: 73.08,
      paymentMethod: 'efectivo',
      orderType: 'local'
    });

    const onOrderSuccess = jest.fn();

    render(<OrderPanel onOrderSuccess={onOrderSuccess} />);

    expect(createOrder).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('order-checkout-button'));

    await waitFor(() => {
      expect(previewOrder).toHaveBeenCalledWith([
        {
          productId: 'prod-1',
          quantity: 2,
          notes: 'sin azucar'
        }
      ], 'client-1');
    });

    expect(createOrder).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.getByTestId('checkout-modal-mock')).toBeInTheDocument();
      expect(screen.getByTestId('checkout-preview-total')).toHaveTextContent('73.08');
    });

    fireEvent.click(screen.getByTestId('confirm-sale-button'));

    await waitFor(() => {
      expect(getUserProfile).toHaveBeenCalled();
      expect(createOrder).toHaveBeenCalledWith({
        user: 'seller-1',
        client: 'client-1',
        products: [
          {
            productId: 'prod-1',
            quantity: 2,
            notes: 'sin azucar'
          }
        ],
        paymentMethod: 'efectivo',
        orderType: 'local',
        subtotal: 70,
        discount: 7,
        tax: 10.08,
        total: 73.08
      });
    });

    expect(clearProductsCache).toHaveBeenCalled();
    expect(removeClientFromOrder).toHaveBeenCalled();
    expect(resetPOSPanel).toHaveBeenCalled();
    expect(onOrderSuccess).toHaveBeenCalled();
  });
});
