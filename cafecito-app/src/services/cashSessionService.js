import { http } from "./http";

export const fetchTurnoTotals = async (openedAt) => {
    try {
        const response = await http.get(`/total-cash/orders?openedAt=${openedAt}`);

        return response.data;
    } catch (error) {
        console.error("Error en el servicio fetchTurnoCashTotals:", error);
        throw error;
    }
};

export const createCashSession = async (initialCash, timestamp) => {
    try {
        const response = await http.post('total-cash/open', { initialCash, timestamp });

        return response.data;
    } catch (error) {
        console.error("Error al crear sesión de caja en el backend:", error);
        throw error;
    }
};

export const closeCashSession = async (closingData) => {
    try {
        const response = await http.post('total-cash/close', closingData);

        return response.data
    } catch (error) {
        console.error("Error al cerrar sesión de caja en el backend:", error);
        throw error;
    }
}

export const getAdminCashSessions = async (params = {}) => {
    try {
        const response = await http.get('/total-cash/admin/sessions', { params });
        return response.data;
    } catch (error) {
        console.error("Error al obtener turnos admin:", error);
        throw error.response?.data || error;
    }
};
