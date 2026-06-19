import { http } from "./http";

export const fetchCategories = async () => {
    try {
        const catResponse = await http.get('/categories');
        const categories = catResponse.data?.categories || catResponse.data || [];

        return categories;
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}
