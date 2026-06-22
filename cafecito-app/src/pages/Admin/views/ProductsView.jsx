import { useCallback, useEffect, useMemo, useState } from 'react';
import Button from '../../../components/atoms/Button/Button';
import { fetchCategories } from '../../../services/categoryService';
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../../../services/productService';
import './ProductsView.css';

const PRODUCTS_PER_PAGE = 5;
const LOW_STOCK_THRESHOLD = 5;

export default function ProductsView() {
    const emptyForm = {
        name: '',
        price: '',
        stock: '',
        imageUrl: '',
        parentCategory: ''
    };

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState(emptyForm);
    const [editingProductId, setEditingProductId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [stockFilter, setStockFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const loadData = useCallback(async () => {
        try {
            setError('');
            const [productsData, categoriesData] = await Promise.all([
                fetchProducts(),
                fetchCategories()
            ]);

            setProducts(productsData?.products || []);
            setCategories(categoriesData || []);
        } catch (error) {
            setError(error?.message || 'No se pudieron cargar los productos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const inventoryStats = useMemo(() => {
        return products.reduce((acc, product) => {
            const stock = Number(product.stock || 0);

            acc.totalProducts += 1;
            acc.totalUnits += stock;
            if (stock === 0) acc.outOfStock += 1;
            if (stock > 0 && stock <= LOW_STOCK_THRESHOLD) acc.lowStock += 1;

            return acc;
        }, {
            totalProducts: 0,
            totalUnits: 0,
            lowStock: 0,
            outOfStock: 0
        });
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const stock = Number(product.stock || 0);
            const productCategoryId = product.parentCategory?._id || product.parentCategory || '';
            const matchesCategory = categoryFilter === 'all' || productCategoryId === categoryFilter;
            const matchesStock = stockFilter === 'all'
                || (stockFilter === 'low' && stock > 0 && stock <= LOW_STOCK_THRESHOLD)
                || (stockFilter === 'out' && stock === 0)
                || (stockFilter === 'available' && stock > LOW_STOCK_THRESHOLD);

            return matchesCategory && matchesStock;
        });
    }, [categoryFilter, products, stockFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
    const visibleProducts = filteredProducts.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE);
    const paginationInfo = {
        currentPage,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [categoryFilter, stockFilter]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((current) => ({ ...current, [name]: value }));
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEditingProductId(null);
    };

    const handleEdit = (product) => {
        setEditingProductId(product._id);
        setFormData({
            name: product.name || '',
            price: String(product.price ?? ''),
            stock: String(product.stock ?? ''),
            imageUrl: product.imageUrl || '',
            parentCategory: product.parentCategory?._id || product.parentCategory || ''
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

        const payload = {
            name: formData.name.trim(),
            price: Number(formData.price),
            stock: Number(formData.stock),
            imageUrl: formData.imageUrl.trim(),
            parentCategory: formData.parentCategory
        };

        try {
            if (editingProductId) {
                await updateProduct(editingProductId, payload);
            } else {
                await createProduct(payload);
                setCurrentPage(1);
            }

            resetForm();
            await loadData();
        } catch (error) {
            setError(error?.message || 'No se pudo guardar el producto.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (product) => {
        const confirmed = window.confirm(`¿Eliminar ${product.name}?`);

        if (!confirmed) return;

        try {
            setError('');
            await deleteProduct(product._id);

            const shouldGoPrevPage = visibleProducts.length === 1 && currentPage > 1;
            const nextPage = shouldGoPrevPage ? currentPage - 1 : currentPage;

            if (shouldGoPrevPage) {
                setCurrentPage(nextPage);
            }

            await loadData();

            if (editingProductId === product._id) resetForm();
        } catch (error) {
            setError(error?.message || 'No se pudo eliminar el producto.');
        }
    };

    return (
        <section className="admin-products-view">
            <div className="admin-products-view__header">
                <div>
                    <p className="admin-products-view__eyebrow">Menú</p>
                    <h2>Productos</h2>
                </div>
                <Button variant="secondary" onClick={loadData}>Actualizar</Button>
            </div>

            {error && <div className="admin-products-view__error">{error}</div>}

            <div className="admin-inventory-summary">
                <article>
                    <span>Productos</span>
                    <strong>{inventoryStats.totalProducts}</strong>
                </article>
                <article>
                    <span>Unidades en stock</span>
                    <strong>{inventoryStats.totalUnits}</strong>
                </article>
                <article className={inventoryStats.lowStock > 0 ? 'has-warning' : ''}>
                    <span>Stock bajo</span>
                    <strong>{inventoryStats.lowStock}</strong>
                </article>
                <article className={inventoryStats.outOfStock > 0 ? 'has-danger' : ''}>
                    <span>Agotados</span>
                    <strong>{inventoryStats.outOfStock}</strong>
                </article>
            </div>

            <div className="admin-inventory-filters" aria-label="Filtros de inventario">
                <div className="admin-inventory-filters__buttons">
                    <Button variant={stockFilter === 'all' ? 'primary' : 'secondary'} size="sm" onClick={() => setStockFilter('all')}>Todos</Button>
                    <Button variant={stockFilter === 'available' ? 'primary' : 'secondary'} size="sm" onClick={() => setStockFilter('available')}>Disponibles</Button>
                    <Button variant={stockFilter === 'low' ? 'primary' : 'secondary'} size="sm" onClick={() => setStockFilter('low')}>Stock bajo</Button>
                    <Button variant={stockFilter === 'out' ? 'primary' : 'secondary'} size="sm" onClick={() => setStockFilter('out')}>Agotados</Button>
                </div>

                <div className="admin-inventory-filters__select-wrap">
                    <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filtrar por categoría">
                        <option value="all">Todas las categorías</option>
                        {categories.map((category) => (
                            <option key={category._id} value={category._id}>{category.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="admin-products-view__grid">
                <form className="admin-product-form" onSubmit={handleSubmit}>
                    <h3>{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h3>

                    <label htmlFor="product-name">Nombre</label>
                    <input id="product-name" name="name" value={formData.name} onChange={handleChange} required />

                    <label htmlFor="product-price">Precio</label>
                    <input id="product-price" name="price" type="number" min="0" step="0.01" value={formData.price} onChange={handleChange} required />

                    <label htmlFor="product-stock">Stock</label>
                    <input id="product-stock" name="stock" type="number" min="0" step="1" value={formData.stock} onChange={handleChange} required />

                    <label htmlFor="product-image">Imagen</label>
                    <input id="product-image" name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="/img/products/americano.webp" required />

                    <label htmlFor="product-category">Categoría</label>
                    <div className="admin-product-form__select-wrap">
                        <select id="product-category" name="parentCategory" value={formData.parentCategory} onChange={handleChange} required>
                            <option value="">Selecciona categoría</option>
                            {categories.map((category) => (
                                <option key={category._id} value={category._id}>{category.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-product-form__actions">
                        <Button variant="primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
                        {editingProductId && <Button variant="secondary" onClick={resetForm}>Cancelar</Button>}
                    </div>
                </form>

                <div className="admin-products-list">
                    {loading ? (
                        <div className="admin-products-list__state">Cargando productos...</div>
                    ) : visibleProducts.length === 0 ? (
                        <div className="admin-products-list__state">No hay productos registrados.</div>
                    ) : (
                        visibleProducts.map((product) => (
                            <article className="admin-product-card" key={product._id}>
                                <img src={product.imageUrl} alt={product.name} width="64" height="64" loading="lazy" decoding="async" />
                                <div>
                                    <h3>{product.name}</h3>
                                    <p>{product.parentCategory?.name || 'Sin categoría'}</p>
                                    <span className={`admin-product-card__stock ${Number(product.stock || 0) === 0 ? 'is-out' : Number(product.stock || 0) <= LOW_STOCK_THRESHOLD ? 'is-low' : 'is-ok'}`}>
                                        {Number(product.stock || 0) === 0 ? 'Agotado' : Number(product.stock || 0) <= LOW_STOCK_THRESHOLD ? `Stock bajo: ${product.stock}` : `Stock: ${product.stock}`}
                                    </span>
                                    <strong>${Number(product.price || 0).toFixed(2)}</strong>
                                </div>
                                <div className="admin-product-card__actions">
                                    <Button variant="secondary" size="sm" onClick={() => handleEdit(product)}>Editar</Button>
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(product)}>Eliminar</Button>
                                </div>
                            </article>
                        ))
                    )}

                    {paginationInfo?.totalPages > 1 && (
                        <div className="admin-products-pagination">
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={!paginationInfo.hasPrev}
                                onClick={() => setCurrentPage((page) => page - 1)}
                            >
                                Anterior
                            </Button>
                            <span>Página {paginationInfo.currentPage} de {paginationInfo.totalPages}</span>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={!paginationInfo.hasNext}
                                onClick={() => setCurrentPage((page) => page + 1)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
