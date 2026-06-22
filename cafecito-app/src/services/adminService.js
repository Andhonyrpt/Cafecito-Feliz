import { http } from './http';

export const getSalesSummary = async (range = 'day') => {
    try {
        const response = await http.get('/orders/admin/sales-summary', {
            params: { range }
        });

        return response.data;
    } catch (error) {
        console.error('Error obteniendo resumen de ventas admin', error);
        throw error.response?.data || error;
    }
};

export const getAdminOrders = async (params = {}) => {
    try {
        const response = await http.get('/orders/admin/list', { params });
        return response.data;
    } catch (error) {
        console.error('Error obteniendo órdenes admin', error);
        throw error.response?.data || error;
    }
};
