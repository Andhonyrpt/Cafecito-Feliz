import { http } from "./http";

export const createOrder = async (orderData) => {
    try {
        // Manda todo el ticket de golpe: cajero, cliente, productos, totales y método de pago
        const response = await http.post("orders/create", orderData);
        return response.data;
    } catch (error) {
        console.error("Error al registrar la venta en el sistema", error);
        throw error;
    }
};

// Si en algún momento necesitas ver el historial de ventas del día para el corte de caja:
export const getOrdersBySeller = async (vendedorId) => {
    try {
        const response = await http.get(`orders/seller/${vendedorId}`);
        return response.data;
    } catch (error) {
        console.error("Error obteniendo el historial de ventas", error);
        throw error;
    }
};