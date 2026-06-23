import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: process.env.SEED_ENV_FILE || ".env" });

const stockArg = Number(process.argv[2]);

if (!Number.isInteger(stockArg) || stockArg < 0) {
    console.error("Usage: node scripts/set-e2e-product-stock.js <non-negative-integer>");
    process.exit(1);
}

const dbUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!dbUri || !dbName) {
    console.error("MONGODB_URI and MONGODB_DB are required.");
    process.exit(1);
}

const [baseUri, existingQuery = ""] = dbUri.split("?");
const normalizedBaseUri = baseUri.replace(/\/$/, "");
const params = new URLSearchParams(existingQuery);
params.set("retryWrites", "false");
const connectionUri = `${normalizedBaseUri}/${dbName}?${params.toString()}`;

const productName = "E2E Americano";

async function run() {
    await mongoose.connect(connectionUri);

    const { default: Product } = await import("../src/models/product.js");
    const product = await Product.findOneAndUpdate(
        { name: productName },
        { $set: { stock: stockArg } },
        { returnDocument: "after" }
    );

    if (!product) {
        throw new Error(`Product not found: ${productName}`);
    }

    console.log(`Updated ${productName} stock to ${product.stock}`);
}

run()
    .then(async () => {
        await mongoose.disconnect();
    })
    .catch(async (error) => {
        console.error(error.message);
        await mongoose.disconnect();
        process.exit(1);
    });
