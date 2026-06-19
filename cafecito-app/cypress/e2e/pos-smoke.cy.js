describe('POS smoke flow', () => {
  const category = {
    _id: 'cat-coffee',
    name: 'Café',
    imageUrl: '/logo192.png',
  };

  const product = {
    _id: 'prod-americano',
    name: 'Americano',
    price: 35,
    stock: 10,
    imageUrl: '/logo192.png',
    parentCategory: category._id,
  };

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
      body: { status: 'open' },
    }).as('openCash');

    cy.intercept('GET', '**/api/categories', {
      statusCode: 200,
      body: { categories: [category] },
    }).as('categories');

    cy.intercept('GET', '**/api/products*', {
      statusCode: 200,
      body: {
        products: [product],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          hasPrev: false,
          hasNext: false,
        },
      },
    }).as('products');

    cy.intercept('POST', '**/api/orders/preview', (req) => {
      expect(req.body.products).to.deep.equal([
        { productId: product._id, quantity: 1, notes: '' },
      ]);

      req.reply({
        statusCode: 200,
        body: {
          subtotal: 35,
          discount: 0,
          tax: 5.6,
          total: 40.6,
          currency: 'MXN',
          taxRate: '16%',
        },
      });
    }).as('previewOrder');

    cy.intercept('GET', '**/api/users/profile', {
      statusCode: 200,
      body: {
        user: {
          _id: 'user-seller',
          displayName: 'Vendedor POS',
          employeeId: 'EMP-001',
          role: 'vendedor',
          avatar: '/logo192.png',
          isActive: true,
        },
      },
    }).as('profile');

    cy.intercept('POST', '**/api/orders', {
      statusCode: 201,
      body: {
        order: {
          _id: 'order-001',
          status: 'pendiente',
          totalPrice: 40.6,
        },
      },
    }).as('createOrder');
  });

  it('opens cash, adds a product, previews totals, and confirms a cash sale', () => {
    cy.on('window:alert', (message) => {
      expect(message).to.equal('Cobro realizado con éxito');
    });

    cy.visit('/');

    cy.contains('Apertura de turno').should('be.visible');
    cy.get('[data-testid="cash-session-employee-id"]').type('EMP-001');
    cy.wait('@checkRole');
    cy.get('[data-testid="cash-session-pin"]').type('12345');
    cy.get('[data-testid="cash-session-initial-cash"]').type('100');
    cy.get('[data-testid="cash-session-open-submit"]').click();

    cy.wait('@login');
    cy.wait('@openCash');
    cy.wait('@categories');
    cy.wait('@products');

    cy.contains('Café').should('be.visible');
    cy.contains('Americano').should('be.visible');

    cy.get('[data-testid="add-product-prod-americano"]').click();
    cy.contains('Personalizar Americano').should('be.visible');
    cy.get('[data-testid="modifier-confirm-add"]').click();

    cy.contains('Pedidos').should('be.visible');
    cy.contains('Americano').should('be.visible');
    cy.get('[data-testid="order-checkout-button"]').click();

    cy.wait('@previewOrder');
    cy.contains('Confirmación de Cobro').should('be.visible');
    cy.contains('Total a Cobrar:').should('be.visible');

    cy.get('[data-testid="cash-received-input"]').type('50');
    cy.get('[data-testid="confirm-sale-button"]').click();

    cy.wait('@profile');
    cy.wait('@createOrder');
  });
});
