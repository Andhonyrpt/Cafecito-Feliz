describe('POS Barista Flow', () => {
  const pendingOrder = {
    _id: 'order-barista-001',
    orderNumber: 105,
    orderType: 'llevar',
    createdAt: new Date().toISOString(),
    status: 'pendiente',
    client: { displayName: 'Maria Gomez' },
    products: [
      {
        productId: { _id: 'prod-1', name: 'Latte Vainilla' },
        quantity: 2,
        notes: 'Deslactosada'
      }
    ]
  };

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();

    cy.intercept('GET', '**/api/auth/check-role/EMP-002', {
      statusCode: 200,
      body: { role: 'barista' },
    }).as('checkRole');

    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: {
          _id: 'user-barista',
          displayName: 'Barista Experto',
          employeeId: 'EMP-002',
          role: 'barista',
          avatar: '/logo192.png',
          isActive: true,
        },
      },
    }).as('login');

    // Barista doesn't open cash, but might hit total-cash/open if the app tries?
    // Actually the cash modal is only for sellers usually, let's assume login goes straight to Home.
    // In POS smoke, the cash modal appears first because it's required for sellers.
    // Let's check how barista enters. They might just use the same login modal and then skip cash session.

    cy.intercept('GET', '**/api/orders', {
      statusCode: 200,
      body: { orders: [pendingOrder] },
    }).as('getPendingOrders');

    cy.intercept('POST', '**/api/total-cash/open', {
      statusCode: 201,
      body: { status: 'open', openedAt: new Date().toISOString() },
    }).as('openCash');

    cy.intercept('PATCH', '**/api/orders/order-barista-001/status', {
      statusCode: 200,
      body: { ...pendingOrder, status: 'completado' },
    }).as('completeOrder');
  });

  it('logs in as barista, views pending orders, and completes one', () => {
    cy.visit('/');

    // Login as Barista
    cy.contains('Apertura de turno').should('be.visible');
    cy.wait(100);
    cy.get('[data-testid="cash-session-employee-id"]').type('EMP-002');
    cy.wait('@checkRole');
    cy.get('[data-testid="cash-session-pin"]').type('12345');
    
    cy.get('[data-testid="cash-session-open-submit"]').click();

    cy.wait('@login');
    cy.wait('@openCash');
    cy.wait('@getPendingOrders');

    // Check Barista View
    cy.contains('Mis órdenes asignadas').should('be.visible');
    cy.contains('Orden #105').should('be.visible');
    cy.contains('Maria Gomez').should('be.visible');
    cy.contains('Latte Vainilla').should('be.visible');
    cy.contains('Deslactosada').should('be.visible');

    // Complete Order
    cy.contains('Marcar completada').click();
    cy.wait('@completeOrder');

    // Order should disappear from the list (the UI filters it out on success)
    cy.contains('No tienes órdenes pendientes por preparar.').should('be.visible');
  });
});
