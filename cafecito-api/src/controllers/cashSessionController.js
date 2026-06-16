import Order from "../models/order.js";
import CashSession from "../models/cashSession.js";

async function getTurnoTotal(req, res, next) {
    try {
        const { userId } = req.user;
        const { openedAt } = req.query;

        if (!userId) {
            return res.status(401).json({ message: "User not found." });
        }

        if (!openedAt) {
            return res.status(400).json({ message: "La fecha de apertura 'openedAt' es obligatoria." });
        }

        const openDate = new Date(openedAt);

        const currentOrders = await Order.find({
            user: userId,
            paymentMethod: "efectivo",
            createdAt: { $gte: openDate } // Mayor o igual a la hora de apertura
        });

        const cashSales = currentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        res.status(200).json({
            userId,
            openedAt: openDate,
            cashSales
        });
    } catch (error) {
        next(error);
    }
};

async function openCashSession(req, res, next) {
    try {

        console.log("=== DATOS DEL USUARIO EN REQ.USER ===", req.user);
        console.log("=== DATOS DEL CUERPO REQ.BODY ===", req.body);

        const { userId, role } = req.user
        const { initialCash, timestamp } = req.body;

        if (!userId) {
            return res.status(404).json({ message: "User not found" });
        }

        if (role === 'admin') {
            return res.status(200).json({ message: 'Acceso de administrador autorizado sin apertura de caja.' });
        }

        if (initialCash === undefined || initialCash === null) {
            return res.status(400).json({ message: "El monto de fondo inicial es obligatorio para vendedores." });
        }

        const newSession = await CashSession.create({
            user: userId,
            initialCash: Number(initialCash),
            openedAt: timestamp ? new Date(timestamp) : new Date(),
            status: 'open'
        });

        res.status(201).json({
            message: "Turno y caja abiertos correctamente.",
            session: newSession
        });
    } catch (error) {
        console.error("❌ ERROR DETALLADO EN OPEN_CASH_SESSION:", error);
        next(error);
    }
};

async function closeCashSession(req, res, next) {
    try {
        const { userId, role } = req.user;
        const { pin, isCashCorrect, discrepancyReason, timestamp } = req.body;

        if (!userId) {
            return res.status(404).json({ message: "User not found" });
        }

        if (role === 'admin') {
            return res.status(200).json({ message: "Sesión de administración finalizada de manera limpia." });
        }

        const activeSession = await CashSession.findOne({ user: userId, status: 'open' });

        if (!activeSession) {
            return res.status(404).json({ message: "No se encontró ninguna sesión de caja abierta para este usuario." });
        }

        const currentOrders = await Order.find({
            user: userId,
            paymentMethod: 'efectivo',
            createdAt: { $gte: activeSession.openedAt }
        });

        const cashSales = currentOrders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
        const expectedCash = activeSession.initialCash + cashSales;

        const updatedSession = await CashSession.findOneAndUpdate(
            { user: userId, status: 'open' }, // Criterio de búsqueda (el que esté abierto)
            {
                $set: {
                    closedAt: timestamp ? new Date(timestamp) : new Date(),
                    status: 'closed',
                    totalSales: cashSales,
                    expectedCash: expectedCash,
                    isCashCorrect: isCashCorrect,
                    discrepancyReason: isCashCorrect ? "" : (discrepancyReason || "")
                }
            },
            { returnDocument: 'after' } // Equivalente moderno a { new: true } para que te devuelva el registro ya actualizado
        );

        res.status(200).json({
            message: "Corte realizado y turno cerrado con éxito en la base de datos.",
            session: updatedSession
        });

    } catch (error) {
        next(error);
    }
};

export {
    getTurnoTotal,
    openCashSession,
    closeCashSession
};