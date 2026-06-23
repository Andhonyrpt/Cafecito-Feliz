import { lazy, startTransition, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { fetchProducts } from "../services/productService";
import { fetchCategories } from "../services/categoryService";
import ProductList from "../components/molecules/ProductList/ProductList";
import Button from "../components/atoms/Button/Button";
import OrderPanel from "../components/organisms/OrderPanel/OrderPanel";
import { useSession } from "../context/SessionContext";
import { useOrder } from "../context/OrderContext";
import './Home.css';
import Icon from "../components/atoms/Icon";

const PendingOrders = lazy(() => import("../components/organisms/PendingOrders/PendingOrders"));
const ModifiersModal = lazy(() => import("../components/organisms/OrderModals/ModifiersModal"));

function InlineFallback({ children = "Cargando..." }) {
    return <div className="inline-fallback" role="status">{children}</div>;
}

const warmedImageOrigins = new Set();
const preloadedImages = new Set();

function warmImageOrigin(imageUrl) {
    if (!imageUrl) return;

    try {
        const { origin } = new URL(imageUrl, window.location.origin);

        if (warmedImageOrigins.has(origin)) return;

        warmedImageOrigins.add(origin);

        const preconnect = document.createElement("link");
        preconnect.rel = "preconnect";
        preconnect.href = origin;

        const dnsPrefetch = document.createElement("link");
        dnsPrefetch.rel = "dns-prefetch";
        dnsPrefetch.href = origin;

        document.head.append(preconnect, dnsPrefetch);
    } catch (error) {
        // Invalid image URLs should not block product rendering.
    }
}

function preloadCatalogImages(products) {
    products.slice(0, 4).forEach((product) => {
        const imageUrl = product?.imageUrl;

        if (!imageUrl || preloadedImages.has(imageUrl)) return;

        preloadedImages.add(imageUrl);
        warmImageOrigin(imageUrl);

        const preload = document.createElement("link");
        preload.rel = "preload";
        preload.as = "image";
        preload.href = imageUrl;
        preload.fetchPriority = "high";
        document.head.appendChild(preload);
    });
}

export default function Home() {

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [viewLayout, setViewLayout] = useState("grid");
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState({});
    const [isModifiersOpen, setIsModifiersOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [isProductsLoading, setIsProductsLoading] = useState(false);


    const { currentUser } = useSession();
    const { addItemToOrder } = useOrder();
    const canLoadCatalog = !!currentUser && currentUser.role !== 'barista';

    useEffect(() => {
        let isMounted = true;

        if (!canLoadCatalog) {
            setCategories([]);
            setActiveCategoryId(null);
            return undefined;
        }

        const loadCategories = async () => {
            try {
                const categoriesData = await fetchCategories() || [];

                if (isMounted) {
                    setCategories(categoriesData);

                    if (categoriesData.length > 0) {
                        setActiveCategoryId(categoriesData[0]._id)
                    }

                }

            } catch (error) {
                if (isMounted) {
                    setCategories([]);
                }
            }
        };

        loadCategories();

        return () => {
            isMounted = false;
        };
    }, [canLoadCatalog]);

    const productsPerPage = viewLayout === "grid" ? 12 : 4;

    useEffect(() => {
        let isMounted = true;

        if (!canLoadCatalog) {
            setProducts([]);
            setPaginationInfo({});
            setIsProductsLoading(false);
            return undefined;
        }

        const loadProducts = async () => {
            setIsProductsLoading(true);

            try {
                const productsData = await fetchProducts(currentPage, productsPerPage, activeCategoryId) || {};

                if (isMounted) {
                    const loadedProducts = productsData?.products || [];

                    preloadCatalogImages(loadedProducts);
                    setProducts(loadedProducts);

                    setPaginationInfo(productsData?.pagination || {});
                }

            } catch (error) {
                if (isMounted) {
                    setProducts([]);
                }
            } finally {
                if (isMounted) {
                    setIsProductsLoading(false);
                }
            }
        };

        if (activeCategoryId) {
            loadProducts();
        }

        return () => {
            isMounted = false;
        };

    }, [currentPage, activeCategoryId, viewLayout, productsPerPage, refreshTrigger, canLoadCatalog]);

    const activeCategory = useMemo(
        () => categories.find((cat) => cat._id === activeCategoryId),
        [categories, activeCategoryId]
    );

    const handleCategory = useCallback((categoryId) => {
        startTransition(() => {
            setActiveCategoryId(categoryId);
            setCurrentPage(1);
        });
    }, []);

    const handleOpenModifiers = useCallback((product) => {
        setSelectedProduct(product);
        setIsModifiersOpen(true);
    }, []);

    // Esta función se ejecuta cuando le dan "Agregar a la orden" dentro del modal:
    const handleConfirmAddOrder = useCallback((product, note) => {
        const productWithNotes = {
            ...product,
            orderNotes: note
        };

        addItemToOrder(productWithNotes);
    }, [addItemToOrder]);

    const handleOrderSuccess = useCallback(() => {
        setTimeout(() => {
            setRefreshTrigger(prev => prev + 1);
        }, 300);
    }, []);

    const renderRoleContent = () => {
        if (currentUser?.role === 'barista') {
            return (
                <Suspense fallback={<InlineFallback>Cargando órdenes...</InlineFallback>}>
                    <PendingOrders />
                </Suspense>
            );
        }

        return (
            <>
                <div className="category-menu">
                    {categories.map((category) => (

                        <button key={category._id}
                            onClick={() => handleCategory(category._id)}
                            className={`category-btn ${category._id === activeCategoryId ? 'active' : ''}`}
                        >
                            <div className="category-menu__info">
                                <img
                                    src={category.imageUrl}
                                    alt={category.name}
                                    className="category-img"
                                    loading="lazy"
                                    decoding="async"
                                    width="30"
                                    height="32"
                                />
                                <span className="category-name">{category.name}</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="products-section">
                    <div className="products-section__header">
                        <div className="products-section__header--left">
                            <h1 className="products-section__header--title">{activeCategory ? activeCategory.name : ""}</h1>
                                <img
                                    src={activeCategory?.imageUrl}
                                    alt={activeCategory?.name}
                                    className="category-img"
                                    loading="eager"
                                    decoding="async"
                                    width="30"
                                    height="32"
                                />
                        </div>

                        <div className="products-section__header--right">
                            <h5 className="view-label">Vista</h5>
                            <div className="view-buttons">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`view-btn ${viewLayout === "grid" ? "active" : ""}`}
                                    onClick={() => setViewLayout("grid")}
                                    aria-label="Cambiar a vista de cuadrícula"
                                    aria-pressed={viewLayout === "grid"}
                                >
                                    <Icon name="grid" size={18} />
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`view-btn ${viewLayout === "list" ? "active" : ""}`}
                                    onClick={() => setViewLayout("list")}
                                    aria-label="Cambiar a vista de lista"
                                    aria-pressed={viewLayout === "list"}
                                >
                                    <Icon name="list" size={18} />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="product-list-wrapper">
                        <ProductList
                            products={products}
                            layout={viewLayout}
                            onAddProduct={handleOpenModifiers}
                        />

                        {isProductsLoading && <InlineFallback>Actualizando productos...</InlineFallback>}

                        {paginationInfo?.totalPages > 1 && (
                            <div className="pagination-controls">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={!paginationInfo.hasPrev}
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
                                    aria-label="Página anterior"
                                >
                                    <Icon name="chevronLeft" size={12} />
                                </Button>

                                <span className="pagination-info">
                                    Página {paginationInfo.currentPage} de {paginationInfo.totalPages}
                                </span>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={!paginationInfo.hasNext}
                                    onClick={() => setCurrentPage((prev) => prev + 1)}
                                    aria-label="Página siguiente"
                                >
                                    <Icon name="chevronRight" size={12} />

                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="checkout-container">
                    <OrderPanel
                        onOrderSuccess={handleOrderSuccess}
                    />
                </div>

                {isModifiersOpen && (
                    <Suspense fallback={null}>
                        <ModifiersModal
                            isOpen={isModifiersOpen}
                            onClose={() => setIsModifiersOpen(false)}
                            product={selectedProduct}
                            onConfirm={handleConfirmAddOrder}
                        />
                    </Suspense>
                )}
            </>
        );
    };


    return (
        <div className={`home-container ${currentUser?.role === 'barista' ? 'home-container--barista' : ''}`}>
            {renderRoleContent()}
        </div>
    )
};
