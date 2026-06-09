import axios from 'axios';

const APP_BASE_URL = process.env.REACT_APP_API_URL;

let logoutCallback = null;

export const setLogoutCallback = (callback) => {
    logoutCallback = callback;
};

export const http = axios.create({
    baseURL: APP_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 8000
});

http.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (err) => {
        return Promise.reject(err);
    }
);

http.interceptors.response.use(
    (res) => { return res },
    async (err) => {
        const originalRequest = err.config;

        if ((err.response?.status === 401 || err.response.status === 403 && !originalRequest._retry)) {
            originalRequest._retry = true;

            try {
                const { refresh } = await import('./auth');
                const newToken = await refresh();

                if (newToken) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    return http(originalRequest);
                }

            } catch (error) {
                console.error('Error en refersh token', error);
            }

            if (logoutCallback) logoutCallback();
        };

        return Promise.reject(err);
    }
);