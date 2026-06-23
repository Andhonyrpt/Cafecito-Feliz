import { http } from "./http";
import storageService from "./storageService";

export const register = async (userData) => {
    try {
        const response = await http.post("/auth/register", userData);
        const { user } = response.data;

        if (user) {
            return user;
        } else {
            return null;
        }

    } catch (error) {
        console.error("Error al registrar un usuario", error.message, userData);
        return null;
    }
};

export const login = async (credentials) => {
    try {
        const response = await http.post("/auth/login", credentials);
        const { token, refreshToken } = response.data;

        if (token) {
            storageService.set("authToken", token);
            storageService.set("refreshToken", refreshToken);

            return response;
        } else {
            return null;
        }

    } catch (error) {
        console.error("Error al iniciar sesión del usuario", error.message);
        throw error;
    }
};

export const refresh = async () => {
    try {
        const refreshToken = storageService.get('refreshToken');

        if (!refreshToken) return null;

        const response = await http.post("/auth/refresh", { refreshToken });

        const { token, refreshToken: newRefreshToken } = response.data;

        if (token) {
            storageService.set("authToken", token);
            storageService.set("refreshToken", newRefreshToken);
            return token;
        }

        return null;

    } catch (error) {
        console.error("Error al refrescar el token", error);
        return null;
    }
}

export const logout = async () => {
    try {
        await http.post("/auth/logout");
        storageService.remove("authToken");
        storageService.remove("refreshToken");
        storageService.remove("userData");
        return true;
    } catch (error) {
        console.error("Error al cerrar sesión", error);
        return false;
    }
};

export const verifyEmployeePin = async (employeeId, pin) => {
    try {
        const response = await http.post('/auth/verify-pin', { employeeId, password: pin });



        return response.data;
    } catch (error) {
        console.error("Error al verificar el PIN en el servicio:", error.message);
        throw error;
    }
};

export const checkEmployeeRole = async (employeeId, token = storageService.get('authToken')) => {
    try {
        const response = await http.get(`/auth/check-role/${employeeId}`, token ? {
            headers: { Authorization: `Bearer ${token}` }
        } : undefined);

        return response.data.role;
    } catch (error) {
        console.error("Error al consultar el rol del empleado:", error.message);
        return 'error';
    }
};
