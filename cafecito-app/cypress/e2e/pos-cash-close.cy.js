describe('POS Cash Close Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();

    cy.intercept('GET', '**/api/auth/check-role/EMP-001', {
      statusCode: 200,
      body: { role: 'vendedor' },
    }).as('checkRole');

    cy.intercept('POST', '**/api/auth/login', {
      statusCode: 200,
      body: {
        token: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: {
          _id: 'user-seller',
          displayName: 'Vendedor POS',
          employeeId: 'EMP-001',
          role: 'vendedor',
          avatar: '/logo192.png',
          isActive: true,
        },
      },
    }).as('login');

    cy.intercept('POST', '**/api/total-cash/open', {
      statusCode: 201,
      body: { status: 'open', openedAt: new Date().toISOString() },
    }).as('openCash');

    cy.intercept('GET', '**/api/categories', {
      statusCode: 200,
      body: { categories: [{ _id: 'cat-1', name: 'Bebidas' }] },
    }).as('categories');

    cy.intercept('GET', '**/api/products*', {
      statusCode: 200,
      body: { products: [], pagination: {} },
    }).as('products');

    cy.intercept('GET', '**/api/total-cash/orders*', {
      statusCode: 200,
      body: { cashSales: 50 }, // Initial 100 + 50 from sales
    }).as('expectedCash');

    cy.intercept('POST', '**/api/auth/verify-pin', {
      statusCode: 200,
      body: { message: 'PIN verified' },
    }).as('verifyPin');

    cy.intercept('POST', '**/api/total-cash/close', {
      statusCode: 200,
      body: { status: 'closed' },
    }).as('closeCash');
  });

  it('logs in as seller, opens cash, and closes cash with discrepancy', () => {
    cy.visit('/');

    // Login and Open Cash
    cy.contains('Apertura de turno').should('be.visible');
    cy.wait(100);
    cy.get('[data-testid="cash-session-employee-id"]').type('EMP-001');
    cy.wait('@checkRole');
    cy.get('[data-testid="cash-session-pin"]').type('12345');
    cy.get('[data-testid="cash-session-initial-cash"]').type('100');
    cy.get('[data-testid="cash-session-open-submit"]').click();

    cy.wait('@login');
    cy.wait('@openCash');
    cy.wait('@categories');
    cy.wait('@products');

    // Click Logout / Close Cash button in Header
    cy.get('.logout-button').click();
    cy.wait('@expectedCash');

    // Close Cash Session Modal
    cy.contains('Cierre de turno y caja').should('be.visible');
    cy.contains('$150.00').should('be.visible'); // Expected cash

    cy.get('[data-testid="cash-session-pin"]').type('12345');
    
    // Choose discrepancy
    cy.contains('NO COINCIDE').click();
    cy.get('#session-discrepancy-reason').type('Faltaron 5 pesos de cambio');
    
    cy.get('[data-testid="cash-session-close-submit"]').click();

    cy.wait('@verifyPin');
    cy.wait('@closeCash');

    // After closing, it should redirect or show login again
    cy.contains('Apertura de turno').should('be.visible');
  });
});
