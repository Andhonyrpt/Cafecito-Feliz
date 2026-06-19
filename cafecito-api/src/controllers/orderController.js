import Order from "../models/order.js";
import Product from "../models/product.js";
import Client from "../models/client.js";
import { calculateOrderFinancials } from "../utils/orderHelper.js";

async function getOrders(req, res, next) {
    try {

        const pendingOrders = await Order.find({ status: 'pendiente' })
            .populate('client', 'displayName') // Trae solo el nombre del cliente, ignorando emails
            .populate('products.productId')
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
                status: 'pendiente'
            });

            if (client) {
                await Client.findByIdAndUpdate(client, {
                    $inc: { totalPurchaseCount: 1 },
                    $push: { purchaseHistory: newOrder._id }
                });
            }

            await newOrder.populate('user', 'displayName employeeId role');
            await newOrder.populate('products.productId');

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

        // Guard: Máquina de estados. No permitir cambios desde estados terminales
        if (order.status === 'completado') {
            return res.status(400).json({
                message: `Cannot change status of an order that is already ${order.status}`
            });
        }

        const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { returnDocument: 'after' })
            .populate("client", "displayName")
            .populate("products.productId");

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

            if (!product) return null;

            return {
                price: product.price,
                quantity: item.quantity
            };
        }));

        if (priceChecks.some((p) => p === null)) {
            return res.status(404).json({ message: "One or more products not found" });
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
    createOrder,
    updateOrderStatus,
    previewOrder
};
