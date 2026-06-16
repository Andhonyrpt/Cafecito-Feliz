# Tests E2E con Cypress para Cafecito App

Este documento detalla la estructura, comandos personalizados y flujos completos de tests de integración End-to-End (E2E) utilizando Cypress para la aplicación.

## 1. Instalación de Cypress

Actualmente Cypress no está instalado en el proyecto. Para integrarlo, ejecuta los siguientes comandos en la raíz del proyecto frontend (`cafecito-app`):

```bash
# Navegar al directorio de la aplicación frontend si no estás ahí
cd cafecito-app

# Instalar Cypress como dependencia de desarrollo
npm install cypress --save-dev

# Abrir Cypress por primera vez para generar la estructura de carpetas (cypress/, cypress.config.js)
npx cypress open
```

## 2. Comandos Personalizados (`cypress/support/commands.ts` o `.js`)

Se requieren comandos personalizados para facilitar la escritura de tests repetitivos y mejorar la velocidad de ejecución (por ejemplo, hacer login mediante la API en lugar de la UI antes de cada test de carrito).

Agrega estos comandos en el archivo de soporte de Cypress:

```javascript
// cypress/support/commands.js

/**
 * Realiza un login directamente contra el backend.
 * Evita tener que usar el UI para loguearse en tests que no prueban explícitamente el login.
 */
Cypress.Commands.add('loginByApi', (email, password) => {
  cy.request('POST', 'http://localhost:3000/api/auth/login', {
    email,
    password,
  }).then((response) => {
    expect(response.status).to.eq(200);
    // Guardar el token en el almacenamiento (ajustar según el método que use la app: localStorage, sessionStorage, o cookies)
    window.localStorage.setItem('authToken', response.body.token);
  });
});

/**
 * Agrega un producto al carrito directamente mediante la API.
 */
Cypress.Commands.add('addProductToCart', (productId, quantity = 1) => {
  const token = window.localStorage.getItem('authToken');
  cy.request({
    method: 'POST',
    url: 'http://localhost:3000/api/cart',
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: {
      productId,
      quantity
    }
  }).then((response) => {
    expect(response.status).to.eq(200);
  });
});
```

## 3. Tests Completos

### 3.1. Flujo de Registro (`cypress/e2e/auth/register.cy.js`)

Este test evalúa la capacidad de un usuario para crear una cuenta nueva y su correcta redirección.

```javascript
describe('Flujo de Registro', () => {
  it('Debería permitir a un nuevo usuario registrarse correctamente', () => {
    cy.visit('/register');
    
    // Generar un email dinámico para evitar conflictos si se corre múltiples veces
    const randomEmail = `testuser_${Date.now()}@example.com`;

    cy.get('[data-testid="register-name-input"]').type('Usuario Test Cypress');
    cy.get('[data-testid="register-email-input"]').type(randomEmail);
    cy.get('[data-testid="register-password-input"]').type('Password123!');
    cy.get('[data-testid="register-confirm-password-input"]').type('Password123!');
    
    cy.get('[data-testid="register-submit-button"]').click();
    
    // Verificar que el registro fue exitoso y redirigió correctamente (ej. al dashboard o login)
    cy.url().should('include', '/login');
    cy.get('[data-testid="toast-success"]').should('be.visible').and('contain', 'Registro exitoso');
  });
});
```

### 3.2. Flujo de Login (`cypress/e2e/auth/login.cy.js`)

Testea tanto los casos de éxito como los fallos por credenciales incorrectas.

```javascript
describe('Flujo de Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('Debería permitir hacer login con credenciales válidas', () => {
    cy.get('[data-testid="login-email-input"]').type('test@example.com'); // Asumiendo que este usuario existe en la BD de test
    cy.get('[data-testid="login-password-input"]').type('Password123!');
    
    cy.get('[data-testid="login-submit-button"]').click();
    
    // Verificar redirección tras un login exitoso
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.get('[data-testid="user-menu"]').should('be.visible');
  });

  it('Debería mostrar un mensaje de error con credenciales inválidas', () => {
    cy.get('[data-testid="login-email-input"]').type('wrong@example.com');
    cy.get('[data-testid="login-password-input"]').type('wrongpass');
    
    cy.get('[data-testid="login-submit-button"]').click();
    
    cy.get('[data-testid="login-error-message"]').should('be.visible');
  });
});
```

### 3.3. Flujo de Checkout (4 Fases) (`cypress/e2e/checkout/checkout.cy.js`)

Flujo E2E crítico de comercio electrónico, compuesto por: Carrito, Datos de Envío, Datos de Pago y Confirmación de Pedido.

```javascript
describe('Flujo de Checkout (4 Fases)', () => {
  beforeEach(() => {
    // Preparar el estado antes de empezar la prueba visual
    // Usamos comandos personalizados para no acoplar esta prueba al UI de Login
    cy.loginByApi('test@example.com', 'Password123!');
    cy.addProductToCart('producto_prueba_1', 1);
    
    // Iniciar en la página del carrito (Fase 1)
    cy.visit('/cart');
  });

  it('Debería completar todas las fases del checkout y generar la orden', () => {
    // --- FASE 1: Carrito ---
    cy.get('[data-testid="cart-item"]').should('have.length.at.least', 1);
    cy.get('[data-testid="checkout-proceed-button"]').click();
    
    // --- FASE 2: Información de Envío ---
    cy.url().should('include', '/checkout/shipping');
    cy.get('[data-testid="shipping-address-input"]').type('123 Calle Test');
    cy.get('[data-testid="shipping-city-input"]').type('Ciudad Cypress');
    cy.get('[data-testid="shipping-zip-input"]').type('12345');
    cy.get('[data-testid="shipping-next-button"]').click();
    
    // --- FASE 3: Método de Pago ---
    cy.url().should('include', '/checkout/payment');
    cy.get('[data-testid="payment-method-credit-card"]').click(); // Selección de tarjeta
    cy.get('[data-testid="card-number-input"]').type('4242424242424242'); // Número de test de Stripe
    cy.get('[data-testid="card-expiry-input"]').type('12/25');
    cy.get('[data-testid="card-cvc-input"]').type('123');
    cy.get('[data-testid="payment-next-button"]').click();
    
    // --- FASE 4: Confirmación ---
    cy.url().should('include', '/checkout/confirm');
    cy.get('[data-testid="order-summary"]').should('be.visible');
    cy.get('[data-testid="place-order-button"]').click();
    
    // Verificación final (Post-checkout / Success Page)
    cy.url().should('include', '/order-success');
    cy.get('[data-testid="success-message"]').should('contain', 'Gracias por tu compra');
  });
});
```

## 4. Tabla de `data-testid` Requeridos

Para que estos tests funcionen robustamente (y no se rompan al cambiar estilos, textos o IDs de CSS), es obligatorio incluir los siguientes atributos `data-testid` en los componentes de la aplicación de frontend:

| Flujo / Vista | Elemento | Atributo `data-testid` |
| --- | --- | --- |
| **Registro** | Input de Nombre | `register-name-input` |
| | Input de Email | `register-email-input` |
| | Input de Contraseña | `register-password-input` |
| | Input de Confirmar Contraseña | `register-confirm-password-input` |
| | Botón de Enviar | `register-submit-button` |
| **Login** | Input de Email | `login-email-input` |
| | Input de Contraseña | `login-password-input` |
| | Botón de Enviar | `login-submit-button` |
| | Mensaje de Error de credenciales| `login-error-message` |
| **Global/General** | Notificación de Éxito (Toast) | `toast-success` |
| | Menú de Usuario (cuando logueado) | `user-menu` |
| **Carrito (Fase 1)** | Contenedor de producto en carrito | `cart-item` |
| | Botón para ir al Checkout | `checkout-proceed-button` |
| **Envío (Fase 2)** | Input de Dirección | `shipping-address-input` |
| | Input de Ciudad | `shipping-city-input` |
| | Input de Código Postal | `shipping-zip-input` |
| | Botón de Continuar | `shipping-next-button` |
| **Pago (Fase 3)** | Opción Tarjeta de Crédito | `payment-method-credit-card` |
| | Input Número de Tarjeta | `card-number-input` |
| | Input Fecha de Expiración | `card-expiry-input` |
| | Input CVC | `card-cvc-input` |
| | Botón de Continuar | `payment-next-button` |
| **Confirmación (Fase 4)**| Resumen del Pedido | `order-summary` |
| | Botón de Confirmar y Pagar | `place-order-button` |
| **Éxito** | Mensaje de Orden Confirmada | `success-message` |

> **Nota:** Usar selectores dedicados de testing (como `data-testid`) es una buena práctica porque desvincula el código de los tests E2E de la semántica de HTML o la manipulación de clases de CSS que puedan sufrir refactorizaciones frecuentes.
