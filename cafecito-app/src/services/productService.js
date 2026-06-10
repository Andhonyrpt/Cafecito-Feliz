import { http } from "./http";

export const fetchProducts = async (page, limit, category) => {
    let url = '/products';

    const params = [];

    if (page && limit) params.push(`page=${page}&limit=${limit}`);
    if (category) params.push(`category=${category}`);

    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }

    const cacheKey = `products_page_${page || 'all'}_limit_${limit || 'all'}_cat_${category || 'all'}`;
    const cachedItem = sessionStorage.getItem(cacheKey);

    if (cachedItem) {
        try {
            const parsed = JSON.parse(cachedItem);
            const isExpired = Date.now() - parsed.timestamp > 5 * 60 * 1000;

            if (!isExpired) {
                return parsed.data;
            }
        } catch (error) {
            // Ignorar errores de parseo y forzar re-fetch
        }
    }

    const res = await http.get(url);
    const result = res.data || { products: [], pagination: {} };

    sessionStorage.setItem(cacheKey, JSON.stringify({
        timestamp: Date.now(),
        data: result
    }));

    return result;
};