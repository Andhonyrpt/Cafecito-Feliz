import { http } from "./http";

const extractId = (campo) => {
    if (!campo) return null;

    const id = campo._id || campo;
    return id.toString().trim();
};

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