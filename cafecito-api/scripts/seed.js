import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config({ path: process.env.SEED_ENV_FILE || ".env" });

let User;
let Category;
let Product;
let Client;

const toObjectId = (id) => new mongoose.Types.ObjectId(id);

const seedUsers = [
    {
        _id: "6a247c06e0c0505b91379a9d",
        displayName: process.env.SEED_ADMIN_NAME || "Andhony Palacios",
        employeeId: process.env.SEED_ADMIN_EMPLOYEE_ID || "EMP-01",
        password: process.env.SEED_ADMIN_PASSWORD || "220122",
        role: "admin",
        avatar: process.env.SEED_ADMIN_AVATAR || "/img/usuarios/perfil_andhony.jpg",
        isActive: true
    },
    {
        _id: "6a2e3790b5114aa5f69354f0",
        displayName: process.env.SEED_VENDOR_NAME || "Andhony Tellez",
        employeeId: process.env.SEED_VENDOR_EMPLOYEE_ID || "EMP-02",
        password: process.env.SEED_VENDOR_PASSWORD || "220123",
        role: "vendedor",
        avatar: process.env.SEED_VENDOR_AVATAR || "https://loremflickr.com/320/320/face",
        isActive: true
    },
    {
        displayName: process.env.SEED_BARISTA_NAME || "Barista Cafecito",
        employeeId: process.env.SEED_BARISTA_EMPLOYEE_ID || "EMP-03",
        password: process.env.SEED_BARISTA_PASSWORD || "220124",
        role: "barista",
        avatar: process.env.SEED_BARISTA_AVATAR || "https://loremflickr.com/320/320/face",
        isActive: true
    }
];

const seedCategories = [
    {
        _id: "6a1e907134dbc0b057403f4b",
        name: "Cafés",
        imageUrl: "/img/categories/Cafes.png"
    },
    {
        _id: "6a1e90c334dbc0b057403f4c",
        name: "Frappes",
        imageUrl: "/img/categories/frappe.png"
    },
    {
        _id: "6a1e90f034dbc0b057403f4d",
        name: "Postres",
        imageUrl: "/img/categories/cake.png"
    },
    {
        _id: "6a1e911234dbc0b057403f4e",
        name: "Paninis",
        imageUrl: "/img/categories/panini.png"
    },
    {
        _id: "6a1e915434dbc0b057403f4f",
        name: "Bebidas",
        imageUrl: "/img/categories/soft-drink.png"
    }
];

const seedProducts = [
    {
        _id: "6a1e95a05588dc4d3078944f",
        name: "Latte Clásico",
        price: 65,
        stock: 100,
        imageUrl: "/img/products/latte-clasico.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a1e960b5588dc4d30789450",
        name: "Capuchino",
        price: 65,
        stock: 100,
        imageUrl: "/img/products/cappuccino-1_600x.webp",
        categoryName: "Cafés"
    },
    {
        _id: "6a1e96305588dc4d30789451",
        name: "Latte Vainilla",
        price: 70,
        stock: 100,
        imageUrl: "/img/products/latte-vainilla.webp",
        categoryName: "Cafés"
    },
    {
        _id: "6a1e96675588dc4d30789452",
        name: "Americano",
        price: 55,
        stock: 100,
        imageUrl: "/img/products/americano.webp",
        categoryName: "Cafés"
    },
    {
        _id: "6a1e96a55588dc4d30789453",
        name: "Mocha",
        price: 75,
        stock: 100,
        imageUrl: "/img/products/MochaLatte-1200x1200-1.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a1e96c55588dc4d30789454",
        name: "Caramelo Macchiato",
        price: 75,
        stock: 100,
        imageUrl: "/img/products/caramel-macchiato.avif",
        categoryName: "Cafés"
    },
    {
        _id: "6a28922d15f28787fb5b5a96",
        name: "Espresso Italiano",
        price: 40,
        stock: 100,
        imageUrl: "/img/products/espresso_italiano.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a28931715f28787fb5b5a99",
        name: "Macchiato Clásico",
        price: 50,
        stock: 100,
        imageUrl: "/img/products/macchiato_clasico.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a28962eb7e61f62d63aca21",
        name: "Flat White",
        price: 70,
        stock: 100,
        imageUrl: "/img/products/flat_white.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a2896aab7e61f62d63aca22",
        name: "Latte Moka Blanco",
        price: 75,
        stock: 100,
        imageUrl: "/img/products/latte_moka_blanco.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a289708b7e61f62d63aca23",
        name: "Affogato",
        price: 75,
        stock: 100,
        imageUrl: "/img/products/affogato.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a28975fb7e61f62d63aca24",
        name: "Café de Olla",
        price: 45,
        stock: 100,
        imageUrl: "/img/products/cafe_olla.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a289daeb7e61f62d63aca25",
        name: "Frappé Oreo",
        price: 85,
        stock: 100,
        imageUrl: "/img/products/frappeoreo.jpg",
        categoryName: "Frappes"
    },
    {
        _id: "6a28acb7b7e61f62d63aca26",
        name: "Frappé Caramelo",
        price: 85,
        stock: 100,
        imageUrl: "/img/products/frappecaramelo.jpg",
        categoryName: "Frappes"
    },
    {
        _id: "6a28ad02b7e61f62d63aca27",
        name: "Frappé Matcha",
        price: 90,
        stock: 100,
        imageUrl: "/img/products/frappematcha.jpg",
        categoryName: "Frappes"
    },
    {
        _id: "6a28ad52b7e61f62d63aca28",
        name: "Frappé Mocha",
        price: 80,
        stock: 100,
        imageUrl: "/img/products/frappemocha.jpg",
        categoryName: "Frappes"
    },
    {
        _id: "6a28adc3b7e61f62d63aca29",
        name: "Frappé Taro",
        price: 85,
        stock: 100,
        imageUrl: "/img/products/frappetaro.jpg",
        categoryName: "Frappes"
    },
    {
        _id: "6a28ae27b7e61f62d63aca2a",
        name: "Frappé Mazapán",
        price: 75,
        stock: 100,
        imageUrl: "/img/products/frappemazapan.jpg",
        categoryName: "Frappes"
    },
    {
        _id: "6a28aee7b7e61f62d63aca2b",
        name: "Cheesecake de Fresa",
        price: 65,
        stock: 20,
        imageUrl: "/img/products/cheesecakefresa.jpg",
        categoryName: "Postres"
    },
    {
        _id: "6a28af50b7e61f62d63aca2c",
        name: "Flan",
        price: 55,
        stock: 20,
        imageUrl: "/img/products/flan.jpg",
        categoryName: "Postres"
    },
    {
        _id: "6a28afafb7e61f62d63aca2d",
        name: "Brownie de Chocolate",
        price: 60,
        stock: 20,
        imageUrl: "/img/products/browniechocolate_nuez.jpg",
        categoryName: "Postres"
    },
    {
        _id: "6a28b030b7e61f62d63aca2e",
        name: "Muffin de Arándano",
        price: 40,
        stock: 20,
        imageUrl: "/img/products/blueberry-muffin.jpg",
        categoryName: "Postres"
    },
    {
        _id: "6a28b043b7e61f62d63aca2f",
        name: "Tarta de Manzana",
        price: 50,
        stock: 20,
        imageUrl: "/img/products/tartamanzana.jpg",
        categoryName: "Postres"
    },
    {
        _id: "6a28b0cfb7e61f62d63aca30",
        name: "Panini Tres Quesos con Tomate",
        price: 85,
        stock: 20,
        imageUrl: "/img/products/paniniquesos.jpg",
        categoryName: "Paninis"
    },
    {
        _id: "6a28b0e9b7e61f62d63aca31",
        name: "Panini Jamón y Queso",
        price: 80,
        stock: 20,
        imageUrl: "/img/products/paninijamonqueso.jpg",
        categoryName: "Paninis"
    },
    {
        _id: "6a28b0feb7e61f62d63aca32",
        name: "Panini Pollo Pesto",
        price: 95,
        stock: 20,
        imageUrl: "/img/products/paninipollo.jpg",
        categoryName: "Paninis"
    },
    {
        _id: "6a28b111b7e61f62d63aca33",
        name: "Panini Italiano",
        price: 75,
        stock: 20,
        imageUrl: "/img/products/paniniitaliano.jpg",
        categoryName: "Paninis"
    },
    {
        _id: "6a28b261b7e61f62d63aca34",
        name: "Italiana Frutos Rojos",
        price: 55,
        stock: 100,
        imageUrl: "/img/products/italianafrutosrojos.jpg",
        categoryName: "Bebidas"
    },
    {
        _id: "6a28b279b7e61f62d63aca35",
        name: "Italiana Manzana",
        price: 55,
        stock: 100,
        imageUrl: "/img/products/browniechocolate_nuez.jpg",
        categoryName: "Bebidas"
    },
    {
        _id: "6a28b28fb7e61f62d63aca36",
        name: "Smoothie Mango/Chamoy",
        price: 65,
        stock: 100,
        imageUrl: "/img/products/browniechocolate_nuez.jpg",
        categoryName: "Bebidas"
    },
    {
        _id: "6a28b29bb7e61f62d63aca37",
        name: "Smoothie de Fresa",
        price: 65,
        stock: 100,
        imageUrl: "/img/products/browniechocolate_nuez.jpg",
        categoryName: "Bebidas"
    },
    {
        _id: "6a28b57eb7e61f62d63aca38",
        name: "Café Bombón",
        price: 65,
        stock: 100,
        imageUrl: "/img/products/cafebombon.jpg",
        categoryName: "Cafés"
    },
    {
        _id: "6a28b599b7e61f62d63aca39",
        name: "Café Irlandés",
        price: 70,
        stock: 100,
        imageUrl: "/img/products/cafeirlandes.jpg",
        categoryName: "Cafés"
    }
];

const seedClients = [
    {
        _id: "6a2a6373ed8d289f46ee356f",
        displayName: "Juan Perez",
        email: "juanperez@hotmail.com",
        totalPurchaseCount: 0
    },
    {
        _id: "6a2a6421ed8d289f46ee3570",
        displayName: "Juan Palacios",
        email: "juanpalacios@hotmail.com",
        totalPurchaseCount: 0
    }
];

function assertSafeEnvironment() {
    if (process.env.NODE_ENV === "test") {
        throw new Error("Seed aborted: NODE_ENV=test uses MongoMemoryServer setup, not the real seed target.");
    }

    if (process.env.NODE_ENV === "production" && process.env.SEED_CONFIRM_PRODUCTION !== "true") {
        throw new Error("Seed aborted: set SEED_CONFIRM_PRODUCTION=true to run in production.");
    }

    if (!process.env.MONGODB_URI || !process.env.MONGODB_DB) {
        throw new Error("Seed aborted: MONGODB_URI and MONGODB_DB are required.");
    }
}

async function loadProjectModules() {
    const [databaseModule, userModule, categoryModule, productModule, clientModule] = await Promise.all([
        import("../src/config/database.js"),
        import("../src/models/user.js"),
        import("../src/models/category.js"),
        import("../src/models/product.js"),
        import("../src/models/client.js")
    ]);

    User = userModule.default;
    Category = categoryModule.default;
    Product = productModule.default;
    Client = clientModule.default;

    return databaseModule.default;
}

async function upsertUser({ _id, displayName, employeeId, password, role, avatar, isActive }) {
    const hashPassword = await bcrypt.hash(password, 10);

    const user = await User.findOneAndUpdate(
        { employeeId: employeeId.toUpperCase() },
        {
            $set: {
                displayName,
                employeeId: employeeId.toUpperCase(),
                hashPassword,
                role,
                avatar,
                isActive
            },
            $setOnInsert: {
                ...(_id ? { _id: toObjectId(_id) } : {})
            }
        },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    ).select("-hashPassword");

    return user;
}

async function upsertCategory({ _id, name, imageUrl }) {
    return Category.findOneAndUpdate(
        { name },
        {
            $set: {
                name,
                imageUrl,
                parentCategory: null
            },
            $setOnInsert: {
                _id: toObjectId(_id)
            }
        },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
}

async function upsertProduct({ _id, name, price, stock, categoryName, imageUrl }, categoriesByName) {
    const parentCategory = categoriesByName.get(categoryName);

    if (!parentCategory) {
        throw new Error(`Seed aborted: category not found for product ${name}: ${categoryName}`);
    }

    return Product.findOneAndUpdate(
        { name },
        {
            $set: {
                name,
                price,
                stock,
                imageUrl,
                parentCategory: parentCategory._id
            },
            $setOnInsert: {
                _id: toObjectId(_id)
            }
        },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    ).populate("parentCategory");
}

async function upsertClient({ _id, displayName, email, totalPurchaseCount }) {
    const normalizedEmail = email.trim().toLowerCase();

    return Client.findOneAndUpdate(
        { email: normalizedEmail },
        {
            $set: {
                displayName,
                email: normalizedEmail,
                totalPurchaseCount
            },
            $setOnInsert: {
                _id: toObjectId(_id),
                purchaseHistory: []
            }
        },
        { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true }
    );
}

async function runSeed() {
    assertSafeEnvironment();

    const dbConnection = await loadProjectModules();
    await dbConnection();

    const users = [];
    for (const userData of seedUsers) {
        users.push(await upsertUser(userData));
    }

    const categories = [];
    for (const categoryData of seedCategories) {
        categories.push(await upsertCategory(categoryData));
    }

    const categoriesByName = new Map(categories.map((category) => [category.name, category]));

    const products = [];
    for (const productData of seedProducts) {
        products.push(await upsertProduct(productData, categoriesByName));
    }

    const clients = [];
    for (const clientData of seedClients) {
        clients.push(await upsertClient(clientData));
    }

    console.log("Seed completed successfully");
    console.table(users.map(({ displayName, employeeId, role, isActive }) => ({ displayName, employeeId, role, isActive })));
    console.table(categories.map(({ name }) => ({ category: name })));
    console.table(products.map(({ name, price, stock, parentCategory }) => ({
        product: name,
        price,
        stock,
        category: parentCategory?.name
    })));
    console.table(clients.map(({ displayName, email }) => ({ displayName, email })));
}

runSeed()
    .catch((error) => {
        console.error("Seed failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.connection.close();
    });
