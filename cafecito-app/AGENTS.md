# Guía de Agentes - Cafecito App (Frontend)

Este documento contiene las reglas de arquitectura y patrones establecidos en `cafecito-app` (Frontend en React).

## Estructura de Directorios (`src/`)

```
src/
├── components/   # Componentes modulares de UI (App, Order, List, ProductCard, common)
├── context/      # Estados globales usando Context API y Reducers
├── data/         # Archivos JSON mock (products, categories, etc.)
├── layout/       # Componentes de envoltura principal (Header, Layout principal)
├── pages/        # Vistas completas de la aplicación (únicamente Home.jsx)
└── services/     # Llamadas a la API y configuración HTTP (Axios)
```

## Contextos Disponibles

*(Nota: Aunque la petición mencionaba 3 contextos, en el código real existen 2 contextos y 1 reducer asociado).*

### 1. `SessionContext.jsx`
Maneja la sesión del cajero y la validación para abrir/cerrar caja.
**Retorna al usar `useSession()`:**
- `currentUser`: Datos del usuario autenticado (incluye el fondo inicial y `openedAt`).
- `isModalOpen`, `setIsModalOpen`: Estado del modal de apertura/cierre.
- `sessionMode`, `setSessionMode`: Modalidad actual ('open' o 'close').
- `handleSessionSubmit`: Llama a los servicios de MongoDB para abrir o cerrar sesión (verifica PIN y cuadre).
- `expectedCash`: Total calculado en base a las ventas del backend.
- `calculateExpectedTotals`: Petición al backend del arqueo esperado.

### 2. `OrderContext.jsx`
Maneja el estado del POS y pedido en curso mediante un Reducer.
**Retorna al usar `useOrder()`:**
- `orderItems`: Array con los productos agregados.
- `activeClient`: Información del cliente seleccionado.
- `subtotal`, `discount`, `iva`, `totalToPay`: Valores financieros del pedido calculados en vivo.
- `totalItemsCount`: Cantidad de ítems en el pedido.
- `addItemToOrder`, `updateItemQuantity`, `removeItemFromOrder`: Acciones del pedido.
- `setClientToOrder`, `removeClientFromOrder`: Acciones del cliente.
- `resetPOSPanel`: Acción para limpiar la terminal completa post-venta.

## Componentes `common/` (UI Base)

1. **`Button.jsx`**
   - **Props:** `children`, `onClick`, `type` (default "button"), `disabled` (boolean), `variant` ("primary", "secondary", "third", "danger", "outline"), `size` ("xsm", "sm", "base", "md", "lg"), `className`.
   
2. **`DynamicIcon.jsx`**
   - Carga iconos dinámicos usando `lucide-react`.
   - **Props:** `name` (String, nombre del icono en Lucide), `size` (Number).

3. **`Icon.jsx`**
   - Colección de SVGs estáticos inline (aprox 38KB de peso).
   - **Props:** `name` (String, clave en el objeto interno), `size` (Number, default 20), `className` (String).

4. **`Loading.jsx`**
   - Spinner circular con texto animado "pulse".
   - **Props:** `children` (String, texto a mostrar abajo del spinner).

## Patrón de Estado Complejo (Reducer)

En lugar de un `useFormReducer`, el proyecto utiliza el patrón `useReducer` directamente para gestionar el pedido en curso en `orderReducer.js`.

**Ejemplo de uso (Interno en OrderContext):**
```jsx
import { orderReducer, orderInitialState, ORDER_ACTIONS } from "./orderReducer";

// Inicialización
const [state, dispatch] = useReducer(orderReducer, orderInitialState);

// Despacho de eventos (ej: agregar al pedido)
dispatch({ 
    type: ORDER_ACTIONS.ADD, 
    payload: { ...product, quantity } 
});
```
*Las acciones disponibles son: `INIT`, `ADD`, `REMOVE`, `SET_QTY`, `CLEAR`.*

## Flujo de Checkout (`CheckoutConfirmationModal.jsx`)

El modal final de la venta opera de la siguiente manera:
1. **Verificación visual**: Renderiza `previewData` (precios) e items.
2. **Selección Condicional (Efectivo vs Tarjeta)**:
   - **Efectivo**: Pide ingresar `montoRecibido` en un input. Bloquea la sumisión si el monto es menor al total y calcula en tiempo real el `cambio`.
   - **Tarjeta**: Muestra un flujo simulado (`idle` -> `procesando` -> `aprobado`) a través de `setTimeout` al hacer click en "Conectar Terminal".
3. **Submit**: Dispara la función `handleSubmit()` que bloquea temporalmente el modal (`setIsSubmitting(true)`) e invoca `onConfirm()` para avisar al `OrderPanel` que despache la venta a MongoDB.

## Patrón de Servicios (`http.js`)

Todos los servicios pasan obligatoriamente por la instancia preconfigurada de `axios` en `services/http.js`.

**Ejemplo (`clientService.js`):**
```javascript
import { http } from "./http";

export const createClient = async (clientData) => {
    // La instancia "http" agrega automáticamente el Bearer token y la base URL
    const res = await http.post('/clients', clientData);
    return res.data;
};
```

**Mecanismos internos de `http.js`**:
- Agrega en cada petición el token del `localStorage.getItem('authToken')`.
- Intercepta errores `401`/`403`. Si el token expiró y no es una ruta de auth/refresh, llama automáticamente a `refresh()` de `auth.js` para rotar tokens, retoma la solicitud anterior, y avisa al UI de cerrar sesión si la rotación falla.

## Restricciones Arquitectónicas (Qué NO hacer)

1. **NO crear nuevos contextos**: Si hace falta guardar estado, evaluar si corresponde al POS (`OrderContext`) o al turno (`SessionContext`).
2. **NO usar fetch o axios directo**: Cualquier request al API debe importarse desde un servicio en `src/services/` el cual consume el módulo local `http.js`.
3. **NO agregar React Router sin consultar**: El proyecto está deliberadamente construido como un layout SPA plano alrededor de `<Home />`.
4. **NO modificar DOM manualmente**: Mantener las props para interactuar entre modales y vistas en lugar de forzar llamadas a variables globales.
5. **NO inventar Hooks**: Se descubrió que no existe `useFormReducer`, sino un `orderReducer`. Limítate a usar lo que existe en `src/context/`.
