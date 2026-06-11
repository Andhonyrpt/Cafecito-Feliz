import { http } from "./http";

export const fetchClients = async (page, limit) => {
    let url = '/clients';

    const params = [];

    if (page && limit) params.push(`page=${page}&limit=${limit}`);

    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }

    const res = await http.get(url);
    const result = res.data || { clients: [], pagination: {} };

    return result;
};

export const searchClient = async (searchTerm) => {

    const res = await http.get(`/clients/search?search=${encodeURIComponent(searchTerm)}`);

    return res.data || { client: null };
};

export const createClient = async (clientData) => {

    const res = await http.post('/clients', clientData);

    return res.data;
};

export const updateClient = async (clientId, updatedData) => {

    const res = await http.put(`clients/${clientId}`, updatedData);

    return res.data
};

export const checkEmail = async (email) => {

    const res = await http.get(`/clients/check-email?email=${encodeURIComponent(email)}`);

    return res.data;
}