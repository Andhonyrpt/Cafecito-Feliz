import Order from "../models/order.js";
import Product from "../models/product.js";
import Client from "../models/client.js";
import CashSession from "../models/cashSession.js";
import BaristaSession from "../models/baristaSession.js";
import User from "../models/user.js";
import { calculateOrderFinancials } from "../utils/orderHelper.js";

async function findAvailableBaristaForOrder() {
    const activeBaristaSessions = await BaristaSession.find({ status: 'open' })
        .populate('user', 'role isActive displayName')
        .sort({ openedAt: 1 });

    const activeBaristas = activeBaristaSessions
        .filter((session) => session.user?.role === 'barista' && session.user?.isActive)
        .map((session) => session.user);

    if (activeBaristas.length === 0) return null;

    const workload = await Promise.all(activeBaristas.map(async (barista) => {
        const pendingCount = await Order.countDocuments({
            status: 'pendiente',
            assignedBarista: barista._id
        });

        return { barista, pendingCount };
    }));

    workload.sort((a, b) => {
        if (a.pendingCount !== b.pendingCount) return a.pendingCount - b.pendingCount;
        return String(a.barista._id).localeCompare(String(b.barista._id));
    });

    return workload[0].barista;
}

async function getOrders(req, res, next) {
    try {

        const filters = { status: 'pendiente' };

        if (req.user?.role === 'barista') {
            filters.assignedBarista = req.user.userId;
        }

        const pendingOrders = await Order.find(filters)
            .populate('client', 'displayName') // Trae solo el nombre del cliente, ignorando emails
            .populate('products.productId')
            .populate('assignedBarista', 'displayName employeeId')
            .sort({ createdAt: 1 })// Las más antiguas primero para respetar la fila


        res.json({
            orders: pendingOrders
        });

    } catch (err) {
        next(err);
    }
};

async function getOrderById(req, res, next) {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('client', 'displayName')
            .populate('products.productId')

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.json(order);

    } catch (error) {
        next(error);
    }
};

async function getOrdersByClient(req, res, next) {
    try {
        const clientId = req.params.clientId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const orders = await Order.find({ client: clientId })
            .populate('user.displayName')
            .populate('products.productId')
            .populate('paymentMethod')
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit);

        const totalResults = await Order.countDocuments({ client: clientId });
        const totalPages = Math.ceil(totalResults / limit);

        res.json({
            orders,
            pagination: {
                currentPage: page,
                totalPages,
                totalResults,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        next(err);
    }
};

async function getMyShiftOrders(req, res, next) {
    try {
        const { userId, role } = req.user;

        if (role !== 'vendedor') {
            return res.status(403).json({ message: 'Solo los vendedores pueden consultar ventas de su turno.' });
        }

        const activeSession = await CashSession.findOne({ user: userId, status: 'open' });

        if (!activeSession) {
            return res.status(404).json({ message: 'No hay una sesión de caja abierta para este vendedor.' });
        }

        const orders = await Order.find({
            user: userId,
            createdAt: { $gte: activeSession.openedAt }
        })
            .populate('client', 'displayName')
            .populate('user', 'displayName employeeId role')
            .populate('products.productId')
            .sort({ createdAt: -1 });

        const summary = orders.reduce((acc, order) => {
            const total = order.totalPrice || 0;

            acc.totalSales += total;
            acc.orderCount += 1;

            if (order.paymentMethod === 'efectivo') {
                acc.cashSales += total;
            }

            if (order.paymentMethod === 'tarjeta') {
                acc.cardSales += total;
            }

            return acc;
        }, {
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            orderCount: 0,
            averageTicket: 0
        });

        summary.averageTicket = summary.orderCount > 0 ? summary.totalSales / summary.orderCount : 0;

        res.status(200).json({
            session: activeSession,
            summary,
            orders
        });
    } catch (error) {
        next(error);
    }
};

function getSalesRangeStart(range, now = new Date()) {
    const start = new Date(now);

    if (range === 'day') {
        start.setHours(0, 0, 0, 0);
        return start;
    }

    if (range === 'week') {
        start.setHours(0, 0, 0, 0);
        const day = start.getDay();
        const diff = day === 0 ? 6 : day - 1;
        start.setDate(start.getDate() - diff);
        return start;
    }

    if (range === 'month') {
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    if (range === 'year') {
        start.setMonth(0, 1);
        start.setHours(0, 0, 0, 0);
        return start;
    }

    start.setHours(0, 0, 0, 0);
    return start;
}

function getSalesSeriesLabel(date, range) {
    if (range === 'day') {
        return new Intl.DateTimeFormat('es-MX', { hour: '2-digit', hour12: false }).format(date);
    }

    if (range === 'year') {
        return new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(date);
    }

    return new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short' }).format(date);
}

async function getAdminSalesSummary(req, res, next) {
    try {
        const range = req.query.range || 'day';
        const now = new Date();
        const startDate = getSalesRangeStart(range, now);

        const orders = await Order.find({
            createdAt: { $gte: startDate, $lte: now }
        })
            .populate('products.productId', 'name')
            .sort({ createdAt: 1 });

        const summary = orders.reduce((acc, order) => {
            const total = order.totalPrice || 0;

            acc.totalSales += total;
            acc.orderCount += 1;

            if (order.paymentMethod === 'efectivo') acc.cashSales += total;
            if (order.paymentMethod === 'tarjeta') acc.cardSales += total;

            const label = getSalesSeriesLabel(order.createdAt, range);
            const currentPoint = acc.seriesMap.get(label) || { label, total: 0, orderCount: 0 };
            currentPoint.total += total;
            currentPoint.orderCount += 1;
            acc.seriesMap.set(label, currentPoint);

            order.products?.forEach((item) => {
                const product = item.productId;
                const productId = String(product?._id || item.productId);
                const productName = product?.name || 'Producto';
                const currentProduct = acc.productsMap.get(productId) || {
                    productId,
                    name: productName,
                    quantitySold: 0,
                    totalRevenue: 0
                };

                currentProduct.quantitySold += item.quantity || 0;
                currentProduct.totalRevenue += (item.price || 0) * (item.quantity || 0);
                acc.productsMap.set(productId, currentProduct);
            });

            return acc;
        }, {
            totalSales: 0,
            cashSales: 0,
            cardSales: 0,
            orderCount: 0,
            averageTicket: 0,
            seriesMap: new Map(),
            productsMap: new Map()
        });

        summary.averageTicket = summary.orderCount > 0 ? summary.totalSales / summary.orderCount : 0;

        const salesSeries = Array.from(summary.seriesMap.values());
        const topProducts = Array.from(summary.productsMap.values())
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 5);

        delete summary.seriesMap;
        delete summary.productsMap;

        res.status(200).json({
            range,
            startDate,
            endDate: now,
            summary,
            salesSeries,
            topProducts
        });
    } catch (error) {
        next(error);
    }
};

async function getAdminOrders(req, res, next) {
    try {
        const {
            range = 'day',
            from,
            to,
            sellerEmployeeId,
            baristaEmployeeId,
            paymentMethod,
            status,
            page = 1,
            limit = 10
        } = req.query;
        const now = new Date();
        const filter = {};

        if (from || to) {
            filter.createdAt = {};
            if (from) filter.createdAt.$gte = new Date(from);
            if (to) {
                const toDate = new Date(to);
                if (String(to).length === 10) toDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = toDate;
            }
        } else {
            filter.createdAt = { $gte: getSalesRangeStart(range, now), $lte: now };
        }

        if (paymentMethod) filter.paymentMethod = paymentMethod;
        if (status) filter.status = status;

        if (sellerEmployeeId) {
            const seller = await User.findOne({ employeeId: sellerEmployeeId, role: 'vendedor' });
            filter.user = seller?._id || null;
        }

        if (baristaEmployeeId) {
            const barista = await User.findOne({ employeeId: baristaEmployeeId, role: 'barista' });
            filter.assignedBarista = barista?._id || null;
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = Math.min(parseInt(limit, 10) || 10, 1000);
        const skip = (pageNum - 1) * limitNum;

        const orders = await Order.find(filter)
            .populate('client', 'displayName')
            .populate('user', 'displayName employeeId role')
            .populate('assignedBarista', 'displayName employeeId role')
            .populate('products.productId', 'name')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        const total = await Order.countDocuments(filter);

        res.status(200).json({
            orders,
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

async function createOrder(req, res, next) {
    try {
        const {
            client,
            products,
            paymentMethod,
            orderType
        } = req.body;

        const userId = req.user?.userId;


        if (!userId) {
            return res.status(401).json({ message: 'No se pudo identificar al cajero que realiza la venta.' });
        }

        if (req.user?.role !== 'vendedor') {
            return res.status(403).json({ message: 'Solo los vendedores pueden registrar ventas.' });
        }

        if (!products || products.length === 0) {
            return res.status(400).json({ message: 'El carrito no puede estar vacío.' });
        }

        const stockChecks = await Promise.all(products.map(async (item) => {
            const product = await Product.findById(item.productId);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            if (product.stock < item.quantity) {
                return {
                    error: 'Stock insuficiente',
                    productId: item.productId,
                    productName: product.name,
                    available: product.stock,
                    requested: item.quantity
                };
            }

            return { productId: item.productId, product, ok: true };
        }));

        const errors = stockChecks.filter((check) => check.error);

        if (errors.length > 0) {
            return res.status(400).json({
                message: 'No se puede completar la venta por falta de inventario.',
                errors
            });
        }

        const stockUpdates = await Promise.all(
            products.map(async (item) => {
                return Product.findOneAndUpdate(
                    { _id: item.productId, stock: { $gte: item.quantity } },
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );
            })
        );

        // Verificar que todas las actualizaciones fueron exitosas
        if (stockUpdates.some((update) => !update)) {
            // Si alguna actualización falló, revertir cambios
            await Promise.all(
                stockChecks.map(async (check, index) => {
                    if (stockUpdates[index]) {
                        const item = products[index];
                        return Product.findByIdAndUpdate(check.productId, { $inc: { stock: item.quantity } });
                    }
                })
            );
            return res.status(500).json({
                message: "Failed to update product stock. Order was not created.",
            });
        }

        let discountPercentage = 0;

        if (client) {
            const clientData = await Client.findById(client);

            if (clientData) {
                const purchases = clientData.totalPurchaseCount || 0;

                if (purchases >= 1 && purchases <= 4) discountPercentage = 0.05;
                else if (purchases >= 5 && purchases <= 9) discountPercentage = 0.10;
                else if (purchases >= 10) discountPercentage = 0.15;
            }
        }

        const normalizedProducts = stockChecks.map((check, index) => ({
            productId: check.product._id,
            quantity: products[index].quantity,
            price: check.product.price,
            notes: products[index].notes || ""
        }));

        // Calcular desglose financiero con lógica centralizada del servidor
        const { subtotal, discount, tax, total: totalPrice } = calculateOrderFinancials(normalizedProducts, discountPercentage);

        try {
            const totalOrdersCount = await Order.countDocuments();
            const nextOrderNumber = totalOrdersCount + 1;

            const assignedBarista = await findAvailableBaristaForOrder();

            const newOrder = await Order.create({
                user: userId,
                client: client || null,
                products: normalizedProducts,
                subtotal,
                discount,
                tax,
                totalPrice,
                paymentMethod,
                orderType,
                orderNumber: nextOrderNumber,
                status: 'pendiente',
                assignedBarista: assignedBarista?._id || null,
                assignedAt: assignedBarista ? new Date() : null
            });

            if (client) {
                await Client.findByIdAndUpdate(client, {
                    $inc: { totalPurchaseCount: 1 },
                    $push: { purchaseHistory: newOrder._id }
                });
            }

            await newOrder.populate('user', 'displayName employeeId role');
            await newOrder.populate('products.productId');
            await newOrder.populate('assignedBarista', 'displayName employeeId');

            if (client) await newOrder.populate('client');

            res.status(201).json(newOrder);

        } catch (error) {
            console.error("Order creation failed, rolling back stock:", error.message);

            await Promise.all(
                products.map(async (item) => {
                    return Product.findByIdAndUpdate(
                        item.productId, { $inc: { stock: item.quantity } }
                    );
                })
            );
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

async function updateOrderStatus(req, res, next) {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (status !== 'completado') {
            return res.status(400).json({ message: 'Las órdenes solo pueden marcarse como completadas.' });
        }

        if (req.user?.role === 'barista' && String(order.assignedBarista) !== req.user.userId) {
            return res.status(403).json({ message: 'Esta orden no está asignada a este barista.' });
        }

        // Guard: Máquina de estados. No permitir cambios desde estados terminales
        if (order.status === 'completado') {
            return res.status(400).json({
                message: `Cannot change status of an order that is already ${order.status}`
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            { status, completedAt: new Date() },
            { returnDocument: 'after' }
        )
            .populate("client", "displayName")
            .populate("products.productId")
            .populate('assignedBarista', 'displayName employeeId');

        return res.status(200).json(updatedOrder);

    } catch (err) {
        next(err);
    }
};

async function previewOrder(req, res, next) {
    try {
        const { products, client } = req.body;

        if (req.user?.role !== 'vendedor') {
            return res.status(403).json({ message: 'Solo los vendedores pueden simular ventas.' });
        }

        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: "Products array is required" });
        }

        const priceChecks = await Promise.all(products.map(async (item) => {
            const product = await Product.findById(item.productId);

            if (!product) {
                return { error: 'Product not found', productId: item.productId };
            }

            if (product.stock < item.quantity) {
                return {
                    error: 'Stock insuficiente',
                    productId: item.productId,
                    productName: product.name,
                    available: product.stock,
                    requested: item.quantity
                };
            }

            return {
                price: product.price,
                quantity: item.quantity
            };
        }));

        const errors = priceChecks.filter((check) => check.error);
        if (errors.length > 0) {
            return res.status(400).json({
                message: 'No se puede completar la venta por falta de inventario.',
                errors
            });
        }

        let discountPercentage = 0;

        if (client) {
            const clientData = await Client.findById(client);
            if (clientData) {
                const purchases = clientData.totalPurchaseCount || 0;

                if (purchases >= 1 && purchases <= 4) discountPercentage = 0.05;
                else if (purchases >= 5 && purchases <= 9) discountPercentage = 0.10;
                else if (purchases >= 10) discountPercentage = 0.15;
            }
        }

        const financials = calculateOrderFinancials(priceChecks, discountPercentage);

        res.json({
            ...financials,
            currency: "MXN",
            taxRate: "16%"
        });

    } catch (err) {
        next(err);
    }
};

export {
    getOrders,
    getOrderById,
    getOrdersByClient,
    getMyShiftOrders,
    getAdminSalesSummary,
    getAdminOrders,
    createOrder,
    updateOrderStatus,
    previewOrder
};
