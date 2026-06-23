import { http } from "./http";
import storageService from "./storageService";

export const fetchProducts = async (page, limit, category) => {
    let url = '/products';

    const params = [];

    if (page && limit) params.push(`page=${page}&limit=${limit}`);
    if (category) params.push(`category=${category}`);

    if (params.length > 0) {
        url += `?${params.join('&')}`;
    }

    const cacheKey = `products_page_${page || 'all'}_limit_${limit || 'all'}_cat_${category || 'all'}`;
    const cachedData = storageService.getCache(cacheKey);

    if (cachedData) {
        return cachedData;
    }

    const res = await http.get(url);
    const result = res.data || { products: [], pagination: {} };

    storageService.setCache(cacheKey, result);

    return result;
};

export const clearProductsCache = () => {
    storageService.clearSessionCache("products_page_");
};

export const createProduct = async (productData) => {
    const res = await http.post('/products', productData);
    clearProductsCache();
    return res.data;
};

export const updateProduct = async (productId, productData) => {
    const res = await http.put(`/products/${productId}`, productData);
    clearProductsCache();
    return res.data;
};

export const deleteProduct = async (productId) => {
    await http.delete(`/products/${productId}`);
    clearProductsCache();
};
