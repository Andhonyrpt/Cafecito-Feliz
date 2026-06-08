import { http } from "./http";

export const register = async (userData) => {

    try {
        const response = await http.post("/auth/register", userData);
        const { message, user } = response.data;

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
        const { token, refreshToken, user } = response.data;

        if (token) {
            localStorage.setItem("authToken", token);
            localStorage.setItem("refreshToken", refreshToken);

            return response;
        } else {
            return null;
        }

    } catch (error) {
        console.error("Error al iniciar sesión del usuario", error.message);
        throw error; //  Vital para que el modal pinte "PIN incorrecto"
    }
};

export const refresh = async () => {
    try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) return null;

        const response = await http.post("/auth/refresh", { refreshToken });

        const { token, refreshToken: newRefreshToken } = response.data;

        if (token) {
            localStorage.setItem("authToken", token);
            localStorage.setItem("refreshToken", newRefreshToken);
            return token;
        }

        return null;

    } catch (error) {
        console.error("Error al refrescar el token", error);
        return null;
    }
}

// export const checkEmail = async (email) => {
//     try {
//         const response = await http.get(`auth/check-email?email=${email}`);
//         const { taken } = response.data;
//         console.log(response.data);

//         if (response.status === 200) {
//             return taken;
//         } else {
//             return null;
//         }

//     } catch (error) {
//         console.error("Error al consultar la disponibilidad del email", error.message, email);
//         return false;
//     }
// };

export const logout = async () => {
    try {
        await http.post("/auth/logout");
        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");
        return true;
    } catch (error) {
        console.error("Error al cerrar sesión", error);
        return false;
    }
};

export const verifyEmployeePin = async (employeeId, pin) => {
    try {
        console.log("DATOS ENVIADOS AL CIERRE:", { employeeId, password: pin });
        const response = await http.post('/auth/verify-pin', { employeeId, password: pin });

        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");

        return response.data;
    } catch (error) {
        console.error("Error al verificar el PIN en el servicio:", error.message);
        throw error;
    }
};

export const checkEmployeeRole = async (employeeId) => {
    try {
        const response = await http.get(`/auth/check-role/${employeeId}`);

        return response.data.role;
    } catch (error) {
        console.error("Error al consultar el rol del empleado:", error.message);
        return error;
    }
};