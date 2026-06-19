import { useState, useEffect } from "react";
import { fetchProducts } from "../services/productService";
import { fetchCategories } from "../services/categoryService";
import DynamicIcon from "../components/atoms/DynamicIcon/DynamicIcon";
import ProductList from "../components/molecules/ProductList/ProductList";
import Button from "../components/atoms/Button/Button";
import OrderPanel from "../components/organisms/OrderPanel/OrderPanel";
import CashSession from "../components/organisms/CashSession/CashSession";
import PendingOrders from "../components/organisms/PendingOrders/PendingOrders";
import { useSession } from "../context/SessionContext";
import { useOrder } from "../context/OrderContext";
import ModifiersModal from "../components/organisms/OrderModals/ModifiersModal";
import './Home.css';
import Icon from "../components/atoms/Icon";

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


    const { currentUser, isModalOpen, sessionMode, handleSessionSubmit, expectedCash } = useSession();
    const { addItemToOrder } = useOrder();

    useEffect(() => {
        let isMounted = true;

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
    }, []);

    const productsPerPage = viewLayout === "grid" ? 12 : 4;

    useEffect(() => {
        let isMounted = true;

        const loadProducts = async () => {
            try {
                const productsData = await fetchProducts(currentPage, productsPerPage, activeCategoryId) || {};

                if (isMounted) {
                    setProducts(productsData?.products || []);

                    setPaginationInfo(productsData?.pagination || {});
                }

            } catch (error) {
                if (isMounted) {
                    setProducts([]);
                }
            }
        };

        if (activeCategoryId) {
            loadProducts();
        }

        return () => {
            isMounted = false;
        };

    }, [currentPage, activeCategoryId, viewLayout, productsPerPage, refreshTrigger]);

    const activeCategory = categories.find((cat) => cat._id === activeCategoryId);

    const handleCategory = (categoryId) => {
        setActiveCategoryId(categoryId);
        setCurrentPage(1);
    };

    const handleOpenModifiers = (product) => {
        setSelectedProduct(product);
        setIsModifiersOpen(true);
    };

    // Esta función se ejecuta cuando le dan "Agregar a la orden" dentro del modal:
    const handleConfirmAddOrder = (product, note) => {
        const productWithNotes = {
            ...product,
            orderNotes: note
        };

        addItemToOrder(productWithNotes);
    };

    const renderRoleContent = () => {
        if (currentUser?.role === 'barista') {
            return <PendingOrders />;
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
                                />
                                <h2>{category.name}</h2>
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
                                >
                                    <DynamicIcon name="LayoutGrid" size={18} />
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`view-btn ${viewLayout === "list" ? "active" : ""}`}
                                    onClick={() => setViewLayout("list")}
                                >
                                    <DynamicIcon name="List" size={18} />
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

                        {paginationInfo?.totalPages > 1 && (
                            <div className="pagination-controls">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={!paginationInfo.hasPrev}
                                    onClick={() => setCurrentPage((prev) => prev - 1)}
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
                                >
                                    <Icon name="chevronRight" size={12} />

                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="checkout-container">
                    <OrderPanel
                        onOrderSuccess={() => {
                            setTimeout(() => {
                                setRefreshTrigger(prev => prev + 1);
                            }, 300);
                        }}
                    />
                </div>

                <ModifiersModal
                    isOpen={isModifiersOpen}
                    onClose={() => setIsModifiersOpen(false)}
                    product={selectedProduct}
                    onConfirm={handleConfirmAddOrder}
                />
            </>
        );
    };


    return (
        <div className="home-container">
            <CashSession
                isOpen={isModalOpen}
                mode={sessionMode}
                onSessionSubmit={handleSessionSubmit}
                expectedCash={expectedCash}
            />
            {renderRoleContent()}
        </div>
    )
};
