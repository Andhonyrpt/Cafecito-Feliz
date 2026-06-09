import { http } from "./http";

export function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    return token !== null;
};

export const getUserProfile = async () => {

    const res = await http.get('/users/profile');
    const { message, user } = res.data;

    if (!user) {
        throw new Error('No se pudo obtener el perfil');
    }

    console.log(message);
    return user;
};

export const updateUserAsAdmin = async (userId, userData) => {
    const res = await http.put(`/users/${userId}`, userData);
    return res.data;
};

export const getAllUsers = async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const res = await http.get(`/users${query ? `?${query}` : ''}`);
    return res.data;
};

export const createUser = async (userData) => {
    const res = await http.post('/users', userData);
    return res.data;
};

export const toggleUserStatus = async (userId) => {
    const res = await http.patch(`toggle-status/${userId}`);
    return res.data;
}