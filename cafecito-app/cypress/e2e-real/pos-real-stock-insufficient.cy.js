describe('POS real insufficient stock flow', () => {
  const apiUrl = 'http://localhost:3001/api';
  const sellerEmployeeId = 'EMP-9001';
  const pin = '12345';
  const categoryName = 'E2E Cafes';
  const productName = 'E2E Americano';

  beforeEach(() => {
    cy.exec('npm --prefix ../cafecito-api run seed:e2e', { timeout: 120000 });
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
  });

  it('rejects checkout preview when backend stock changed underneath the UI', () => {
    cy.visit('/');

    cy.contains('Apertura de turno').should('be.visible');
    cy.wait(100);
    cy.get('[data-testid="cash-session-employee-id"]').type(sellerEmployeeId);
    cy.get('[data-testid="cash-session-pin"]').type(pin);
    cy.get('[data-testid="cash-session-initial-cash"]').type('100');
    cy.get('[data-testid="cash-session-open-submit"]').click();

    cy.contains(categoryName, { timeout: 15000 }).click();
    cy.contains(productName, { timeout: 15000 }).should('be.visible');
    cy.get(`[aria-label="Agregar ${productName} al pedido"]`).click();
    cy.contains(`Personalizar ${productName}`).should('be.visible');
    cy.get('[data-testid="modifier-confirm-add"]').click();
    cy.get(`[aria-label="Aumentar cantidad de ${productName}"]`).click();

    cy.request('POST', `${apiUrl}/auth/login`, {
      employeeId: sellerEmployeeId,
      password: pin
    }).then((loginResponse) => {
      const token = loginResponse.body.token;

      cy.request('GET', `${apiUrl}/products`).then((productsResponse) => {
        const products = productsResponse.body.products || [];
        const product = products.find((item) => item.name === productName);

        expect(product, 'seeded product exists').to.exist;

        cy.request({
          method: 'POST',
          url: `${apiUrl}/orders`,
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: {
            client: null,
            products: [{ productId: product._id, quantity: 99 }],
            paymentMethod: 'efectivo',
            orderType: 'local'
          }
        });
      });
    });

    cy.window().then((win) => {
      cy.stub(win, 'alert').as('stockAlert');
    });

    cy.get('[data-testid="order-checkout-button"]').click();

    cy.get('@stockAlert').should('have.been.calledWithMatch', 'No se puede completar la venta por falta de inventario.');
    cy.contains('Confirmacion de Cobro').should('not.exist');
  });
});
