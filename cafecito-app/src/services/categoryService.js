import { http } from "./http";

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
