import { http } from "./http";

export const previewOrder = async (products, clientId = null) => {
    try {
        const respoonse = await http.post('/orders/preview', {
            products,
            client: clientId
        });

        return respoonse.data
    } catch (error) {
        console.error("Error al simular los totales de la orden", error);
        throw error.response?.data || error;
    }
};

export const createOrder = async (orderData) => {
    try {
        // Manda todo el ticket de golpe: cajero, cliente, productos, totales y método de pago
        const response = await http.post("/orders", orderData);
        return response.data;
    } catch (error) {
        console.error("Error al registrar la venta en el sistema", error);
        throw error.response?.data || error;
    }
};

export const getPendingOrders = async () => {
    try {
        const response = await http.get('/orders');

        return response.data;
    } catch (error) {
        console.error("Error al obtener las órdenes pendientes para la barra", error);
        throw error.response?.data || error;
    }
}

export const getMyShiftOrders = async () => {
    try {
        const response = await http.get('/orders/my-shift');

        return response.data;
    } catch (error) {
        console.error("Error obteniendo las ventas del turno", error);
        throw error.response?.data || error;
    }
};

// Si en algún momento necesitas ver el historial de ventas del día para el corte de caja:
export const getOrderById = async (orderId) => {
    try {
        const response = await http.get(`orders/${orderId}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener el detalle de la comanda", error);
        throw error.response?.data || error;
    }
};

export const updateOrderStatus = async (orderId) => {
    try {
        const response = await http.patch(`orders/${orderId}/status`, {
            status: 'completado'
        });
        return response.data;
    } catch (error) {
        console.error("Error al actualizar el estatus de la orden", error);
        throw error.response?.data || error;
    }
};

export const getOrdersByClient = async (clientId, page = 1, limit = 10) => {
    try {
        const response = await http.get(`/orders/client/${clientId}`, {
            params: { page, limit }
        });
        return response.data;
    } catch (error) {
        console.error("Error obteniendo el historial de ventas del cliente", error);
        throw error.response?.data || error;
    }
};
