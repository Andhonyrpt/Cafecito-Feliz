import { useEffect, useState } from 'react';
import Button from '../../../components/atoms/Button/Button';
import { createCategory, deleteCategory, fetchCategories, updateCategory } from '../../../services/categoryService';
import './CategoriesView.css';

const getCategoryErrorMessage = (error, fallback) => {
    const firstValidationError = error?.response?.data?.errors?.[0] || error?.errors?.[0];
    const message = error?.response?.data?.message || error?.message;

    if (firstValidationError?.path === 'imageUrl') {
        return 'La imagen debe ser una ruta válida como /img/categories/Cafes.png o una URL completa.';
    }

    if (firstValidationError?.path === 'name') {
        return 'Revisa el nombre de la categoría.';
    }

    if (message && !message.includes('Request failed')) return message;

    return fallback;
};

export default function CategoriesView() {
    const emptyForm = {
        name: '',
        imageUrl: ''
    };

    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadCategories = async () => {
        try {
            setError('');
            const data = await fetchCategories();
            setCategories(data || []);
        } catch (error) {
            setError(error?.message || 'No se pudieron cargar las categorías.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingCategoryId(null);
    };

    const handleEdit = (category) => {
        setEditingCategoryId(category._id);
        setFormData({
            name: category.name || '',
            imageUrl: category.imageUrl || ''
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');
        setNotice('');

        const payload = {
            name: formData.name.trim(),
            imageUrl: formData.imageUrl.trim()
        };

        try {
            if (editingCategoryId) {
                await updateCategory(editingCategoryId, payload);
                setNotice('Categoría actualizada correctamente.');
            } else {
                await createCategory(payload);
                setNotice('Categoría creada correctamente.');
            }

            resetForm();
            await loadCategories();
        } catch (error) {
            setError(getCategoryErrorMessage(error, 'No se pudo guardar la categoría.'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (category) => {
        const confirmed = window.confirm(`¿Eliminar ${category.name}?`);

        if (!confirmed) return;

        try {
            setError('');
            setNotice('');
            await deleteCategory(category._id);
            setNotice('Categoría eliminada correctamente.');
            await loadCategories();

            if (editingCategoryId === category._id) resetForm();
        } catch (error) {
            setError(getCategoryErrorMessage(error, 'No se pudo eliminar la categoría.'));
        }
    };

    return (
        <section className="admin-categories-view">
            <div className="admin-categories-view__header">
                <div>
                    <p className="admin-categories-view__eyebrow">Menú</p>
                    <h2>Categorías</h2>
                </div>
                <Button variant="secondary" onClick={loadCategories}>Actualizar</Button>
            </div>

            {error && <div className="admin-categories-view__error">{error}</div>}
            {notice && <div className="admin-categories-view__notice">{notice}</div>}

            <div className="admin-categories-view__grid">
                <form className="admin-category-form" onSubmit={handleSubmit}>
                    <h3>{editingCategoryId ? 'Editar categoría' : 'Nueva categoría'}</h3>

                    <label htmlFor="category-name">Nombre</label>
                    <input id="category-name" name="name" value={formData.name} onChange={handleChange} required />

                    <label htmlFor="category-image">Imagen</label>
                    <input id="category-image" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="/img/categories/Cafes.png" required />

                    <div className="admin-category-form__actions">
                        <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                        {editingCategoryId && <Button variant="secondary" onClick={resetForm}>Cancelar</Button>}
                    </div>
                </form>

                <div className="admin-categories-list">
                    {loading ? (
                        <div className="admin-categories-list__state">Cargando categorías...</div>
                    ) : categories.length === 0 ? (
                        <div className="admin-categories-list__state">No hay categorías registradas.</div>
                    ) : (
                        categories.map((category) => (
                            <article className="admin-category-card" key={category._id}>
                                <img src={category.imageUrl} alt={category.name} width="52" height="52" loading="lazy" decoding="async" />
                                <div>
                                    <h3>{category.name}</h3>
                                    <p>Categoría del menú</p>
                                </div>
                                <div className="admin-category-card__actions">
                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(category)}>Editar</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(category)}>Eliminar</Button>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
}
