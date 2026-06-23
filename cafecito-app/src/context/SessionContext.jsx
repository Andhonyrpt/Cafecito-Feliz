import { createContext, useState, useContext, useEffect } from "react";
import { getUserProfile } from "../services/userService";
import { login, verifyEmployeePin } from "../services/auth";
import Loading from '../components/atoms/Loading/Loading';
import { fetchTurnoTotals, createCashSession, closeCashSession, getActiveSession } from "../services/cashSessionService";

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
                    let openedAt = null;
                    let initialCash = 0;

                    if (user.role === 'vendedor') {
                        try {
                            const activeSessionData = await getActiveSession();
                            if (activeSessionData && activeSessionData.session) {
                                openedAt = activeSessionData.session.openedAt;
                                initialCash = activeSessionData.session.initialCash;
                            }
                        } catch (err) {
                            console.error("Error fetching active vendor session from backend, falling back to localStorage", err);
                            openedAt = localStorage.getItem('openedAt') || null;
                            initialCash = Number(localStorage.getItem('initialCash')) || 0;
                        }
                    } else if (user.role === 'barista') {
                        try {
                            const activeSessionData = await getActiveSession();
                            if (activeSessionData && activeSessionData.baristaSession) {
                                openedAt = activeSessionData.baristaSession.openedAt;
                            }
                        } catch (err) {
                            console.error("Error fetching active barista session from backend, falling back to localStorage", err);
                            openedAt = localStorage.getItem('openedAt') || null;
                        }
                    }

                    setCurrentUser({
                        ...user,
                        initialCash,
                        openedAt: openedAt || null
                    });

                    if (user.role === 'admin' || openedAt) {
                        setIsModalOpen(false);
                    } else {
                        setSessionMode('open');
                        setIsModalOpen(true);
                    }
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

    const calculateExpectedTotals = async () => {
        if (!currentUser || !currentUser.openedAt) return;

        try {
            const orderData = await fetchTurnoTotals(currentUser.openedAt);

            const cashSales = orderData?.cashSales || 0;
            const initialCash = currentUser.initialCash || 0;
            const expectedTotal = initialCash + cashSales;

            setExpectedCash(expectedTotal);
        } catch (error) {
            console.error("Error al calcular el dinero esperado a través del servicio:", error);
            // Fallback: si el servidor falla, al menos mostramos el fondo inicial
            setExpectedCash(currentUser.initialCash || 0);
        }
    };

    const handleSessionSubmit = async (data) => {
        if (sessionMode === 'open') {

            try {
                const res = await login({
                    employeeId: data.employeeId,
                    password: data.pin
                });

                const { token, user } = res.data;

                const nowIsoString = new Date(data.timestamp).toISOString();

                localStorage.setItem('authToken', token);
                localStorage.setItem('openedAt', nowIsoString);
                localStorage.setItem('initialCash', data.amount);

                await createCashSession(Number(data.amount), nowIsoString);

                setCurrentUser({
                    ...user,
                    initialCash: Number(data.amount),
                    openedAt: nowIsoString
                });

                setIsModalOpen(false);
                return true;

            } catch (error) {
                console.error('Error en login:', error);
                localStorage.removeItem('authToken');
                return error.response?.data?.message;
            }

        } else {
            try {
                await verifyEmployeePin(currentUser.employeeId, data.pin);

                await closeCashSession({
                    pin: data.pin,
                    isCashCorrect: data.isCashCorrect,
                    discrepancyReason: data.discrepancyReason,
                    timestamp: data.timestamp
                });

                localStorage.removeItem('authToken');
                localStorage.removeItem('openedAt');
                localStorage.removeItem('initialCash');

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
};
