import { http } from "./http";
import { clearProductsCache } from "./productService";

const CATEGORIES_CACHE_KEY = "categories_all";
const CATEGORIES_TTL = 10 * 60 * 1000;

export const fetchCategories = async () => {
    try {
        const cachedItem = sessionStorage.getItem(CATEGORIES_CACHE_KEY);

        if (cachedItem) {
            try {
                const parsed = JSON.parse(cachedItem);

                if (Date.now() - parsed.timestamp <= CATEGORIES_TTL) {
                    return parsed.data;
                }
            } catch (error) {
                sessionStorage.removeItem(CATEGORIES_CACHE_KEY);
            }
        }

        const catResponse = await http.get('/categories');
        const categories = catResponse.data?.categories || catResponse.data || [];

        sessionStorage.setItem(CATEGORIES_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            data: categories
        }));

        return categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export const clearCategoriesCache = () => {
    sessionStorage.removeItem(CATEGORIES_CACHE_KEY);
};

export const createCategory = async (categoryData) => {
    const response = await http.post('/categories', categoryData);
    clearCategoriesCache();
    clearProductsCache();
    return response.data;
};

export const updateCategory = async (categoryId, categoryData) => {
    const response = await http.put(`/categories/${categoryId}`, categoryData);
    clearCategoriesCache();
    clearProductsCache();
    return response.data;
};

export const deleteCategory = async (categoryId) => {
    await http.delete(`/categories/${categoryId}`);
    clearCategoriesCache();
    clearProductsCache();
};
