import Product from "../models/product.js";

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Obtiene todos los productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 */
async function getProducts(req, res, next) {
    try {
        const { page, limit, category } = req.query;

        const filterQuery = {};

        if (category) {
            filterQuery.parentCategory = category;
        }

        if (!page || !limit) {
            const products = await Product.find(filterQuery)
                .populate('parentCategory')
                .sort({ name: 1 });

            const total = products.length;

            return res.status(200).json({
                products,
                pagination: {
                    currentPage: 1,
                    totalPages: 1,
                    totalResults: total,
                    hasNext: false,
                    hasPrev: false
                }
            });
        }

        const pageInt = parseInt(page) || 1;
        const limitInt = parseInt(limit) || 12;
        const skip = (pageInt - 1) * limitInt;

        const products = await Product.find(filterQuery)
            .populate('parentCategory')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitInt);

        const totalResults = await Product.countDocuments(filterQuery);
        const totalPages = Math.ceil(totalResults / limitInt);

        res.json({
            products,
            pagination: {
                currentPage: pageInt,
                totalPages,
                totalResults,
                hasNext: pageInt < totalPages,
                hasPrev: pageInt > 1
            }
        });

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/products/{productId}:
 *   get:
 *     summary: Obtiene un producto por su ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto obtenido
 *       404:
 *         description: Producto no encontrado
 */
async function getProductById(req, res, next) {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId).populate('parentCategory');

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json(product);

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/products/category/{categoryId}:
 *   get:
 *     summary: Obtiene productos por categoría
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de productos
 */
async function getProductByCategory(req, res, next) {
    try {
        const { categoryId } = req.params;

        const products = await Product.find({ parentCategory: categoryId })
            .populate('parentCategory')
            .sort({ name: 1 });

        res.json(products);

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/products:
 *   post:
 *     summary: Crea un nuevo producto
 *     tags: [Products]
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
async function createProduct(req, res, next) {
    try {
        const { name, price, stock, imageUrl, parentCategory } = req.body;

        const newProduct = new Product({
            name,
            price,
            stock,
            imageUrl,
            parentCategory
        });

        await newProduct.save();

        const populatedProduct = await Product.findById(newProduct._id).populate('parentCategory');

        res.status(201).json(populatedProduct);

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/products/{productId}:
 *   put:
 *     summary: Actualiza un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Producto actualizado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
async function updateProduct(req, res, next) {
    try {
        const { productId } = req.params;
        const { name, price, stock, imageUrl, parentCategory } = req.body;

        if (
            !name &&
            price === undefined &&
            stock === undefined &&
            !imageUrl && !parentCategory
        ) {
            return res.status(400).json({ message: "At least one field must be provided to update" });
        }

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        if (name !== undefined) product.name = name;
        if (price !== undefined) product.price = price;
        if (stock !== undefined) product.stock = stock;
        if (imageUrl !== undefined) product.imageUrl = imageUrl;
        if (parentCategory !== undefined) product.parentCategory = parentCategory;

        await product.save();

        const updatedProduct = await Product.findById(productId).populate("parentCategory");

        res.status(200).json(updatedProduct);

    } catch (error) {
        next(error);
    }
};

/**
 * @openapi
 * /api/products/{productId}:
 *   delete:
 *     summary: Elimina un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Producto eliminado exitosamente
 *       404:
 *         description: Producto no encontrado
 */
async function deleteProduct(req, res, next) {
    try {
        const { productId } = req.params;

        const deletedProduct = await Product.findByIdAndDelete(productId);

        if (deletedProduct) {
            return res.status(204).send();
        } else {
            return res.status(404).json({ message: "Product not found" });
        }

    } catch (error) {
        next(error);
    }
};

export {
    getProducts,
    getProductById,
    getProductByCategory,
    createProduct,
    updateProduct,
    deleteProduct
};
