import Category from "../models/category.js";

async function getCategories(req, res, next) {
    try {
        const { page, limit } = req.query;

        if (!page || !limit) {
            const categories = await Category.find()
                .populate('parentCategory')
                .sort({ name: 1 });

            return res.status(200).json({ categories });
        }

        const pageInt = parseInt(page) || 1;
        const limitInt = parseInt(limit) || 10;
        const skip = (pageInt - 1) * limitInt;

        const categories = await Category.find()
            .populate('parentCategory')
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitInt);

        const totalResults = await Category.countDocuments();
        const totalPages = Math.ceil(totalResults / limitInt);

        res.status(200).json({
            categories,
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

async function getCategoryById(req, res, next) {
    try {
        const category = await Category.findById(req.params.id).populate('parentcategory');

        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json(category);

    } catch (error) {
        next(error);
    }
};

async function createCategory(req, res, next) {
    try {
        const { name, imageUrl, parentCategory } = req.body;

        const newCategory = new Category({
            name,
            imageUrl,
            parentCategory
        });

        await newCategory.save();
        res.status(201).json(newCategory);

    } catch (error) {
        next(error);
    }
};

async function updateCategory(req, res, next) {
    try {
        const { name, imageUrl, parentCategory } = req.body;
        const idCategory = req.params.id;

        if (
            name === undefined &&
            imageUrl === undefined &&
            parentCategory === undefined
        ) {
            return res.status(400).json({ message: "At least one field must be provided for update" })
        }

        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
        if (parentCategory !== undefined) updateData.parentCategory = parentCategory;

        const updatedCategory = await Categpry.findByIdAndUpdate(
            idCategory,
            updateData, { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(200).json(updatedCategory);

    } catch (error) {
        next(error);
    }
};

async function deleteCategory(req, res, next) {
    try {
        const idCategory = req.params.id;

        const deletedCategory = await Category.findByIdAndDelete(idCategory);

        if (!deletedCategory) {
            return res.status(404).json({ message: "Category not found" });
        }

        res.status(204).send();

    } catch (error) {
        next(error);
    }
};

async function searchCategories(req, res, next) {
    try {
        const {
            q,
            parentCategory,
            sort,
            order,
            limit,
            page
        } = req.query;

        let filters = {};

        if (q) {
            filters.$or = [
                { name: { regex: q, $options: 'i' } }
            ];
        }

        if (parentCategory) {
            filters.parentCategory = parentCategory;
        }

        let sortOptions = {};

        if (sort) {
            const sortOrder = order === 'desc' ? -1 : 1;
            sortOptions[sort] = sortOrder;
        } else {
            sortOptions.name = -1;
        }

        if (!page || !limit) {
            const categories = await Category.find(filters)
                .populate('parentCategory')
                .sort(sortOptions);
            return res.status(200).json({ categories });
        }

        const limitInt = parseInt(limit) || 10;
        const pageInt = parseInt(page) || 1;
        const skip = (pageInt - 1) * limitInt;

        const categories = await Category.countDocuments(filters)
            .populate('parentCategory')
            .sort(sortOptions)
            .skip(skip)
            .limit(limitInt);

        const totalResults = await Category.countDocuments(filters);
        const totalPages = Math.ceil(totalResults / limitInt);

        res.status(200).json({
            categories,
            pagination: {
                currentPage: pageInt,
                totalPages,
                totalResults,
                hasNext: pageInt < totalPages,
                hasPrev: pageInt > 1
            },
            filters: {
                searchTerm: q || null,
                parentCategory: parentCategory || null,
                sort: sort || null,
                order: order || 'desc'
            }
        });

    } catch (error) {
        next(error);
    }
};

export {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    searchCategories
};