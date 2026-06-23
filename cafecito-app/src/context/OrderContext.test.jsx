import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { OrderProvider, useOrder } from './OrderContext';

function OrderContextProbe() {
  const {
    orderItems,
    activeClient,
    subtotal,
    discount,
    iva,
    totalToPay,
    totalItemsCount,
    addItemToOrder,
    updateItemQuantity,
    removeItemFromOrder,
    setClientToOrder,
    removeClientFromOrder,
    resetPOSPanel
  } = useOrder();

  const product = {
    _id: 'product-1',
    name: 'Americano',
    price: 35,
    stock: 10
  };

  const client = {
    _id: 'client-1',
    displayName: 'Cliente Frecuente',
    email: 'cliente@example.com',
    totalPurchaseCount: 5
  };

  return (
    <div>
      <div data-testid="items-count">{orderItems.length}</div>
      <div data-testid="total-items">{totalItemsCount}</div>
      <div data-testid="subtotal">{subtotal.toFixed(2)}</div>
      <div data-testid="discount">{discount.toFixed(2)}</div>
      <div data-testid="iva">{iva.toFixed(2)}</div>
      <div data-testid="total">{totalToPay.toFixed(2)}</div>
      <div data-testid="client-name">{activeClient?.displayName || 'none'}</div>

      <button onClick={() => addItemToOrder(product, 2)}>add</button>
      <button onClick={() => updateItemQuantity(product._id, 3)}>set quantity</button>
      <button onClick={() => removeItemFromOrder({ _id: product._id })}>remove</button>
      <button onClick={() => setClientToOrder(client)}>set client</button>
      <button onClick={removeClientFromOrder}>remove client</button>
      <button onClick={resetPOSPanel}>reset</button>
    </div>
  );
}

describe('OrderContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('manages order items, client discount, totals, and reset', () => {
    render(
      <OrderProvider>
        <OrderContextProbe />
      </OrderProvider>
    );

    fireEvent.click(screen.getByText('add'));

    expect(screen.getByTestId('items-count')).toHaveTextContent('1');
    expect(screen.getByTestId('total-items')).toHaveTextContent('2');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('70.00');
    expect(screen.getByTestId('discount')).toHaveTextContent('0.00');
    expect(screen.getByTestId('iva')).toHaveTextContent('11.20');
    expect(screen.getByTestId('total')).toHaveTextContent('81.20');

    fireEvent.click(screen.getByText('set client'));

    expect(screen.getByTestId('client-name')).toHaveTextContent('Cliente Frecuente');
    expect(screen.getByTestId('discount')).toHaveTextContent('7.00');
    expect(screen.getByTestId('iva')).toHaveTextContent('10.08');
    expect(screen.getByTestId('total')).toHaveTextContent('73.08');

    fireEvent.click(screen.getByText('set quantity'));

    expect(screen.getByTestId('total-items')).toHaveTextContent('3');
    expect(screen.getByTestId('subtotal')).toHaveTextContent('105.00');
    expect(screen.getByTestId('discount')).toHaveTextContent('10.50');
    expect(screen.getByTestId('total')).toHaveTextContent('109.62');

    fireEvent.click(screen.getByText('remove client'));

    expect(screen.getByTestId('client-name')).toHaveTextContent('none');
    expect(screen.getByTestId('discount')).toHaveTextContent('0.00');

    fireEvent.click(screen.getByText('remove'));

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('total')).toHaveTextContent('0.00');

    fireEvent.click(screen.getByText('add'));
    fireEvent.click(screen.getByText('set client'));
    fireEvent.click(screen.getByText('reset'));

    expect(screen.getByTestId('items-count')).toHaveTextContent('0');
    expect(screen.getByTestId('client-name')).toHaveTextContent('none');
    expect(screen.getByTestId('total')).toHaveTextContent('0.00');
  });
});
