import storageService from "../services/storageService";

export const ORDER_ACTIONS = {
    INIT: "ORDER_INIT",
    ADD: "ORDER_ADD",
    REMOVE: "ORDER_REMOVE",
    SET_QTY: "ORDER_SET_QTY",
    CLEAR: "ORDER_CLEAR",
};

export const orderInitialState = {
    items: storageService.get("order") || [],
};

export function orderReducer(state, action) {
    switch (action.type) {
        case ORDER_ACTIONS.INIT: {
            const items = action.payload || [];
            return { ...state, items };
        }
        case ORDER_ACTIONS.ADD: {
            const p = action.payload;

            const notaNueva = p.orderNotes ? p.orderNotes.trim() : "";
            const cantidadAAgregar = p.quantity || 1;

            const cantidadActualTotal = state.items
                .filter((item) => item._id === p._id)
                .reduce((sum, item) => sum + item.quantity, 0);

            // Verificamos si la suma supera el stock máximo de MongoDB
            if (cantidadActualTotal + cantidadAAgregar > p.stock) {
                alert(`¡Inventario alcanzado! El stock máximo es de ${p.stock} unidades y ya tienes ${cantidadActualTotal} en el carrito.`);
                return state;
            }

            const exists = state.items.find((i) => i._id === p._id && (i.orderNotes || "") === notaNueva);

            const items = exists ?
                state.items.map((i) => (i._id === p._id && (i.orderNotes || "") === notaNueva) ?
                    { ...i, quantity: i.quantity + cantidadAAgregar } : i)
                : [...state.items, { ...p, orderNotes: notaNueva, quantity: cantidadAAgregar }];
            return { ...state, items };
        }
        case ORDER_ACTIONS.REMOVE: {
            const { _id, orderNotes } = action.payload;

            const notaABorrar = orderNotes ? orderNotes.trim() : "";

            return {
                ...state,
                items: state.items.filter((i) => !(i._id === _id && (i.orderNotes || "") === notaABorrar))
            };
        }
        case ORDER_ACTIONS.SET_QTY: {
            const { _id, orderNotes, quantity } = action.payload;

            const notaQty = orderNotes ? orderNotes.trim() : "";

            const q = Math.max(1, quantity);

            return {
                ...state,
                items: state.items.map((i) => (i._id === _id && (i.orderNotes || "") === notaQty) ? { ...i, quantity: q } : i)
            }
        }
        case ORDER_ACTIONS.CLEAR: {
            return { ...state, items: [] };
        }

        default:
            return state;
    }
};