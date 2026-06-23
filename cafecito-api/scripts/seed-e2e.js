import bcrypt from "bcrypt";
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: process.env.SEED_ENV_FILE || ".env" });

const E2E = {
    seller: {
        displayName: "E2E Vendedor",
        employeeId: "EMP-9001",
        password: "12345",
        role: "vendedor",
        avatar: "https://placehold.co/100x100.png?text=E2E+V"
    },
    barista: {
        displayName: "E2E Barista",
        employeeId: "EMP-9002",
        password: "12345",
        role: "barista",
        avatar: "https://placehold.co/100x100.png?text=E2E+B"
    },
    category: {
        name: "E2E Cafes",
        imageUrl: "/logo192.png"
    },
    product: {
        name: "E2E Americano",
        price: 35,
        stock: 100,
        imageUrl: "/logo192.png"
    },
    client: {
        displayName: "E2E Cliente",
        email: "e2e.cliente@e2e.local",
        totalPurchaseCount: 0
    }
};

function assertSafeEnvironment() {
    if (process.env.NODE_ENV === "production" && process.env.SEED_CONFIRM_PRODUCTION !== "true") {
        throw new Error("E2E seed aborted: production requires SEED_CONFIRM_PRODUCTION=true.");
    }

    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
        throw new Error("E2E seed aborted: MONGODB_URI and MONGODB_DB are required.");
    }
}

async function loadModels() {
    const [databaseModule, userModule, categoryModule, productModule, clientModule, orderModule, cashSessionModule, baristaSessionModule] = await Promise.all([
        import("../src/config/database.js"),
        import("../src/models/user.js"),
        import("../src/models/category.js"),
        import("../src/models/product.js"),
        import("../src/models/client.js"),
        import("../src/models/order.js"),
        import("../src/models/cashSession.js"),
        import("../src/models/baristaSession.js")
    ]);

    return {
        dbConnection: databaseModule.default,
        User: userModule.default,
        Category: categoryModule.default,
        Product: productModule.default,
        Client: clientModule.default,
        Order: orderModule.default,
        CashSession: cashSessionModule.default,
        BaristaSession: baristaSessionModule.default
    };
}

async function upsertUser(User, userData) {
    const hashPassword = await bcrypt.hash(userData.password, 10);

    return User.findOneAndUpdate(
        { employeeId: userData.employeeId },
        {
            $set: {
                displayName: userData.displayName,
                employeeId: userData.employeeId,
                hashPassword,
                role: userData.role,
                avatar: userData.avatar,
                isActive: true
            }
        },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
}

async function cleanE2EData({ User, Product, Client, Order, CashSession, BaristaSession }) {
    const e2eUsers = await User.find({ employeeId: { $in: [E2E.seller.employeeId, E2E.barista.employeeId] } }).select("_id");
    const e2eUserIds = e2eUsers.map((user) => user._id);
    const e2eClient = await Client.findOne({ email: E2E.client.email }).select("_id");
    const e2eProduct = await Product.findOne({ name: E2E.product.name }).select("_id");

    await Order.deleteMany({
        $or: [
            { user: { $in: e2eUserIds } },
            { assignedBarista: { $in: e2eUserIds } },
            ...(e2eClient ? [{ client: e2eClient._id }] : []),
            ...(e2eProduct ? [{ "products.productId": e2eProduct._id }] : [])
        ]
    });

    await CashSession.deleteMany({ user: { $in: e2eUserIds } });
    await BaristaSession.deleteMany({ user: { $in: e2eUserIds } });

    if (e2eClient) {
        await Client.findByIdAndUpdate(e2eClient._id, {
            $set: {
                displayName: E2E.client.displayName,
                totalPurchaseCount: E2E.client.totalPurchaseCount,
                purchaseHistory: []
            }
        });
    }
}

async function seedE2E() {
    assertSafeEnvironment();

    const models = await loadModels();
    await models.dbConnection();

    const { User, Category, Product, Client, BaristaSession } = models;

    await cleanE2EData(models);

    const seller = await upsertUser(User, E2E.seller);
    const barista = await upsertUser(User, E2E.barista);

    const category = await Category.findOneAndUpdate(
        { name: E2E.category.name },
        { $set: { ...E2E.category, parentCategory: null } },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );

    const product = await Product.findOneAndUpdate(
        { name: E2E.product.name },
        { $set: { ...E2E.product, parentCategory: category._id } },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );

    const client = await Client.findOneAndUpdate(
        { email: E2E.client.email },
        { $set: E2E.client, $setOnInsert: { purchaseHistory: [] } },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );

    await BaristaSession.create({
        user: barista._id,
        openedAt: new Date(),
        status: "open"
    });

    console.log("E2E seed completed successfully");
    console.table([
        { type: "seller", employeeId: seller.employeeId, password: E2E.seller.password },
        { type: "barista", employeeId: barista.employeeId, password: E2E.barista.password },
        { type: "category", name: category.name },
        { type: "product", name: product.name, stock: product.stock, price: product.price },
        { type: "client", email: client.email }
    ]);
}

seedE2E()
    .catch((error) => {
        console.error("E2E seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });
