import { createContext, useState, useContext, useEffect } from "react";
import { http } from "../services/http";
import { getUserProfile } from "../services/userService";
import { login, verifyEmployeePin } from "../services/auth";
import ordersData from '../data/orders.json';
import Loading from '../components/common/Loading/Loading';

const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sessionMode, setSessionMode] = useState('open');
    const [expectedCash, setExpectedCash] = useState(0);
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const checkActiveSession = async () => {
            const token = localStorage.getItem('authToken');

            if (token) {
                try {
                    const user = await getUserProfile();
                    setCurrentUser(user);
                    setIsModalOpen(false);
                } catch (error) {
                    localStorage.removeItem('authToken');
                    setIsModalOpen(true);
                }
            } else {
                setIsModalOpen(true);
            }
            setLoading(false);
        };
        checkActiveSession();
    }, []);

    const calculateExpectedTotals = () => {
        if (!currentUser) return;

        // Filtra las ventas que coincidan con el ID del empleado activo
        const currentSales = ordersData.filter((order) => order.employeeId === currentUser.employeeId && order.paymentMethod === 'cash');

        // Suma los totales de las ventas
        const totalSales = currentSales.reduce((sum, order) => sum + order.total, 0);

        // Suma el fondo inicial con el que abrió la caja
        const expectedTotal = currentUser.initialCash + totalSales;
        setExpectedCash(expectedTotal);
    };

    const handleSessionSubmit = async (data) => {
        if (sessionMode === 'open') {

            try {
                const res = await login({
                    employeeId: data.employeeId,
                    password: data.pin
                });

                const { token, user } = res.data;

                localStorage.setItem('authToken', token);

                setCurrentUser({
                    ...user,
                    initialCash: Number(data.amount),
                    openedAt: data.timestamp
                });

                setIsModalOpen(false);
                return true;

            } catch (error) {
                console.error('Error en login:', error);
                return error.response?.data?.message;
            }

        } else {
            try {
                await verifyEmployeePin(currentUser.employeeId, data.pin);

                console.log("Cierre de caja - ¿Coincide?:", data.isCashCorrect, "Motivo descuadre:", data.discrepancyReason, "a las:", data.timestamp);

                localStorage.removeItem('authToken');
                setCurrentUser(null);
                setSessionMode('open');
                setIsModalOpen(true);
                return true;

            } catch (error) {
                console.error('Error en cierre de caja:', error);
                return error.response?.data?.message;
            }

        }
    };

    if (loading) {
        return (
            <Loading>Cargando Sesión</Loading>
        );
    }

    return (
        <SessionContext.Provider value={{
            currentUser,
            isModalOpen,
            setIsModalOpen,
            sessionMode,
            setSessionMode,
            handleSessionSubmit, // 🚀 Compartimos la función con toda la app
            expectedCash,
            calculateExpectedTotals
        }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const context = useContext(SessionContext);

    if (!context) {
        throw new Error("useOrder debe usarse dentro de un SessionProvider");
    }

    return context
}