import { createContext, useCallback, useContext, useEffect, useReducer, useState } from "react";
import storageService from "../services/storageService";
import { orderReducer, orderInitialState, ORDER_ACTIONS } from "./orderReducer";

const OrderContext = createContext();

const STORAGE_KEYS = {
    ORDER: "order",
    CLIENT: "active_client"
}

export function OrderProvider({ children }) {
    const [state, dispatch] = useReducer(orderReducer, orderInitialState);
    const [activeClient, setActiveClient] = useState(null);

    const subtotal = state.items.reduce((sum, i) => {
        const price = i.product?.price || i.price || 0;
        return sum + (price * (i.quantity || 0));
    }, 0);

    let discountPercentage = 0;

    if (activeClient) {
        const purchases = activeClient.totalPurchaseCount || 0;

        if (purchases >= 1 && purchases <= 4) discountPercentage = 0.05;
        else if (purchases >= 5 && purchases <= 9) discountPercentage = 0.10;
        else if (purchases >= 10) discountPercentage = 0.15;
    }

    const discount = subtotal * discountPercentage;
    const subtotalDescuento = subtotal - discount;
    const iva = subtotalDescuento * 0.16;
    const totalToPay = subtotalDescuento + iva;
    const totalItemsCount = state.items.reduce((sum, i) => sum + (i.quantity || 0), 0);

    useEffect(() => {
        storageService.set(STORAGE_KEYS.ORDER, state.items);
    }, [state.items]);


    useEffect(() => {
        const initializeOrder = async () => {
            const localItems = storageService.get(STORAGE_KEYS.ORDER) || [];
            const localClient = storageService.get(STORAGE_KEYS.CLIENT);

            if (localItems.length > 0) {
                dispatch({ type: ORDER_ACTIONS.INIT, payload: localItems })
            }

            if (localClient) {
                setActiveClient(localClient);
            }
        };
        initializeOrder();
    }, []);

    const addItemToOrder = (product, quantity = 1) => {
        dispatch({ type: ORDER_ACTIONS.ADD, payload: { ...product, quantity } });
    };

    const updateItemQuantity = (_id, quantity, orderNotes = "", stock) => {
        dispatch({ type: ORDER_ACTIONS.SET_QTY, payload: { _id, quantity, orderNotes, stock } });
    };

    const removeItemFromOrder = (payloadData) => {
        dispatch({ type: ORDER_ACTIONS.REMOVE, payload: payloadData });
    };

    const setClientToOrder = (client) => {
        setActiveClient(client);
        storageService.set(STORAGE_KEYS.CLIENT, client);
    };

    const removeClientFromOrder = () => {
        setActiveClient(null);
        storageService.remove(STORAGE_KEYS.CLIENT);
    };

    const resetPOSPanel = useCallback(() => {
        dispatch({ type: ORDER_ACTIONS.CLEAR });
        setActiveClient(null);
        storageService.remove(STORAGE_KEYS.ORDER);
        storageService.remove(STORAGE_KEYS.CLIENT);
    }, []);

    const value = {
        orderItems: state.items,
        activeClient,
        subtotal,
        discount,
        iva,
        totalToPay,
        totalItemsCount,
        addItemToOrder,
        updateItemQuantity,
        setClientToOrder,
        removeItemFromOrder,
        removeClientFromOrder,
        resetPOSPanel
    };

    return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder() {
    const context = useContext(OrderContext);

    if (!context) {
        throw new Error("useOrder debe usarse dentro de un OrderProvider");
    }
    return context;
}
