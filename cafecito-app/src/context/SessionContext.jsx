import { createContext, useState, useContext } from "react";
import employeesData from '../data/employees.json';
import ordersData from '../data/orders.json';

const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(true);
    const [sessionMode, setSessionMode] = useState('open');
    const [expectedCash, setExpectedCash] = useState(0);

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

    const handleSessionSubmit = (data) => {
        if (sessionMode === 'open') {

            const foundEmployee = employeesData.find((emp) => emp.employeeId.toUpperCase() === data.employeeId.toUpperCase() && emp.pin === data.pin);

            if (!foundEmployee) {
                // Si no coincide, regresamos un mensaje de error
                return 'Número de empleado o PIN incorrectos.';
            }

            setCurrentUser({
                name: foundEmployee.name, // En el futuro vendrá de la API
                role: foundEmployee.role,
                employeeId: foundEmployee.employeeId,
                initialCash: data.amount,
                openedAt: data.timestamp
            });
            setIsModalOpen(false);
            return true;

        } else {
            if (data.pin !== currentUser?.pin && data.pin !== '0000') {
                // (Opcional: puedes dejar un PIN maestro como '0000' por seguridad del administrador)
                const checkActiveEmp = employeesData.find(emp => emp.employeeId === currentUser.employeeId);
                if (checkActiveEmp && data.pin !== checkActiveEmp.pin) {
                    return 'El PIN no coincide con el usuario activo.';
                }
            }

            console.log("Cierre de caja - ¿Coincide?:", data.isCashCorrect, "Motivo descuadre:", data.discrepancyReason, "a las:", data.timestamp);
            setCurrentUser(null);
            setSessionMode('open');
            setIsModalOpen(true);
            return true;
        }
    };

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