import storageService from "../services/storageService";

export const ORDER_ACTIONS = {
    INIT: "ORDER_INIT",
    ADD: "ORDER_ADD",
    REMOVE: "ORDER_REMOVE",
    SET_QTY: "ORDER_SET_QTY",
    CLEAR: "ORDER_CLEAR",
};

export const orderInitialState = {
    items: storageService.get("current_order") || [],
};

export function orderReducer(state, action) {
    switch (action.type) {
        case ORDER_ACTIONS.INIT: {
            const items = action.payload || [];
            return { ...state, items };
        }
        case ORDER_ACTIONS.ADD: {
            const p = action.payload;

            const exists = state.items.find((i) => i._id === p._id);
            const items = exists ?
                state.items.map((i) => i._id === p._id ?
                    { ...i, quantity: i.quantity + (p.quantity || 1) } : i)
                : [...state.items, { ...p, quantity: p.quantity || 1 }];
            return { ...state, items };
        }
        case ORDER_ACTIONS.REMOVE: {
            const { _id } = action.payload;
            return { ...state, items: state.items.filter((i) => !(i._id === _id)) };
        }
        case ORDER_ACTIONS.SET_QTY: {
            const { _id, quantity } = action.payload;
            const q = Math.max(1, quantity);
            return {
                ...state,
                items: state.items.map((i) => (i._id === _id ? { ...i, quantity: q } : i))
            }
        }
        case ORDER_ACTIONS.CLEAR: {
            return { ...state, items: [] };
        }

        default:
            return state;
    }
};