import Order from "../models/order.js";
import CashSession from "../models/cashSession.js";
import User from "../models/user.js";
import BaristaSession from "../models/baristaSession.js";

async function assignUnassignedPendingOrdersToBarista(baristaId) {
    const pendingOrders = await Order.find({
        status: 'pendiente',
        assignedBarista: null
    }).sort({ createdAt: 1 });

    if (pendingOrders.length === 0) return;

    await Order.updateMany(
        { _id: { $in: pendingOrders.map((order) => order._id) }, assignedBarista: null },
        { $set: { assignedBarista: baristaId, assignedAt: new Date() } }
    );
}

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

        const { userId, role } = req.user
        const { initialCash, timestamp } = req.body;

        if (!userId) {
            return res.status(404).json({ message: "User not found" });
        }

        if (role === 'admin') {
            return res.status(200).json({ message: 'Sesión admin iniciada sin caja.', session: null });
        }

        if (role === 'barista') {
            const session = await BaristaSession.findOneAndUpdate(
                { user: userId, status: 'open' },
                {
                    $setOnInsert: {
                        user: userId,
                        openedAt: timestamp ? new Date(timestamp) : new Date(),
                        status: 'open'
                    }
                },
                { upsert: true, returnDocument: 'after' }
            );

            await assignUnassignedPendingOrdersToBarista(userId);

            return res.status(200).json({ message: 'Sesión operativa de barista abierta.', session: null, baristaSession: session });
        }

        if (role !== 'vendedor') {
            const session = await CashSession.findOneAndUpdate(
                { user: userId, status: 'open' },
                {
                    $setOnInsert: {
                        user: userId,
                        initialCash: 0,
                        openedAt: timestamp ? new Date(timestamp) : new Date(),
                        status: 'open'
                    }
                },
                { upsert: true, returnDocument: 'after' }
            );

            return res.status(200).json({ message: 'Sesión abierta correctamente.', session });
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
            return res.status(200).json({ message: 'Sesión admin finalizada sin caja.', session: null });
        }

        if (role === 'barista') {
            const updatedSession = await BaristaSession.findOneAndUpdate(
                { user: userId, status: 'open' },
                {
                    $set: {
                        closedAt: timestamp ? new Date(timestamp) : new Date(),
                        status: 'closed'
                    }
                },
                { returnDocument: 'after' }
            );

            return res.status(200).json({ message: 'Sesión operativa de barista finalizada.', session: null, baristaSession: updatedSession });
        }

        if (role !== 'vendedor') {
            const updatedSession = await CashSession.findOneAndUpdate(
                { user: userId, status: 'open' },
                {
                    $set: {
                        closedAt: timestamp ? new Date(timestamp) : new Date(),
                        status: 'closed'
                    }
                },
                { returnDocument: 'after' }
            );

            return res.status(200).json({ message: "Sesión finalizada de manera limpia.", session: updatedSession });
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

async function getAdminCashSessions(req, res, next) {
    try {
        const { status, role, employeeId, from, to, page = 1, limit = 10 } = req.query;
        const sessionFilter = {};
        const userFilter = {};

        if (status) sessionFilter.status = status;
        if (from || to) {
            sessionFilter.openedAt = {};
            if (from) sessionFilter.openedAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                if (String(to).length === 10) toDate.setHours(23, 59, 59, 999);
                sessionFilter.openedAt.$lte = toDate;
            }
        }

        userFilter.role = role || 'vendedor';
        if (employeeId) userFilter.employeeId = employeeId;

        const users = await User.find(userFilter).select('_id');
        sessionFilter.user = { $in: users.map((user) => user._id) };

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const sessions = await CashSession.find(sessionFilter)
            .populate('user', 'displayName employeeId role avatar isActive')
            .sort({ openedAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await CashSession.countDocuments(sessionFilter);

        const sessionsWithTotals = await Promise.all(sessions.map(async (session) => {
            const endDate = session.closedAt || new Date();
            const isBaristaSession = session.user?.role === 'barista';
            const orders = await Order.find(isBaristaSession ? {
                assignedBarista: session.user?._id,
                assignedAt: { $gte: session.openedAt, $lte: endDate }
            } : {
                user: session.user?._id,
                createdAt: { $gte: session.openedAt, $lte: endDate }
            });

            const sales = isBaristaSession ? {
                totalSales: 0,
                cashSales: 0,
                cardSales: 0,
                orderCount: 0
            } : orders.reduce((acc, order) => {
                const total = order.totalPrice || 0;

                acc.totalSales += total;
                acc.orderCount += 1;
                if (order.paymentMethod === 'efectivo') acc.cashSales += total;
                if (order.paymentMethod === 'tarjeta') acc.cardSales += total;

                return acc;
            }, {
                totalSales: 0,
                cashSales: 0,
                cardSales: 0,
                orderCount: 0
            });

            const baristaOrders = isBaristaSession ? orders.reduce((acc, order) => {
                acc.assigned += 1;
                if (order.status === 'completado') acc.completed += 1;
                if (order.status === 'pendiente') acc.pending += 1;
                return acc;
            }, {
                assigned: 0,
                completed: 0,
                pending: 0
            }) : null;

            return {
                ...session.toObject(),
                sales,
                baristaOrders,
                expectedCash: session.status === 'open'
                    ? (session.initialCash || 0) + sales.cashSales
                    : session.expectedCash
            };
        }));

        const summary = sessionsWithTotals.reduce((acc, session) => {
            acc.openSessions += session.status === 'open' ? 1 : 0;
            acc.closedSessions += session.status === 'closed' ? 1 : 0;
            acc.totalSales += session.sales?.totalSales || 0;
            acc.cashSales += session.sales?.cashSales || 0;
            acc.cardSales += session.sales?.cardSales || 0;
            acc.orderCount += session.sales?.orderCount || 0;
            acc.baristaAssignedOrders += session.baristaOrders?.assigned || 0;
            acc.baristaCompletedOrders += session.baristaOrders?.completed || 0;

            return acc;
        }, {
            openSessions: 0,
            closedSessions: 0,
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            orderCount: 0,
            baristaAssignedOrders: 0,
            baristaCompletedOrders: 0
        });

        res.status(200).json({
            sessions: sessionsWithTotals,
            summary,
            pagination: {
                total,
                totalPages: Math.ceil(total / limitNum) || 1,
                currentPage: pageNum,
                perPage: limitNum,
                hasNext: pageNum < Math.ceil(total / limitNum),
                hasPrev: pageNum > 1
            }
        });
    } catch (error) {
        next(error);
    }
};

export {
    getTurnoTotal,
    getAdminCashSessions,
    openCashSession,
    closeCashSession
};
