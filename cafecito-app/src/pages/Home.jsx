import { useState, useEffect } from "react";
import productsData from "../data/products.json";
import categoriesData from "../data/categories.json";
import DynamicIcon from "../components/common/DynamicIcon/DynamicIcon";
import List from "../components/List/List";
import Button from "../components/common/Button/Button";
import OrderPanel from "../components/Order/OrderPanel";
import './Home.css';

export default function Home() {

    const [products, setProducts] = useState(productsData);
    const [categories, setCategories] = useState(categoriesData);
    const [activeCategoryId, setActiveCategoryId] = useState(categoriesData[0]?._id);
    const [viewLayout, setViewLayout] = useState("grid");

    const categoryCounts = products.reduce((acc, product) => {
        const catId = product.parentCategory?._id;

        if (catId) {
            acc[catId] = (acc[catId] || 0) + 1;
        }
        return acc;
    }, {});

    const activeCategory = categories.find((cat) => cat._id === activeCategoryId);
    const filteredProducts = products.filter(
        (product) => product.parentCategory?._id === activeCategoryId
    );


    return (
        <div className="home-container">

            <div className="category-menu">
                {categories.map((category) => (

                    <button key={category._id}
                        onClick={() => setActiveCategoryId(category._id)}
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
                        <p className="category-badge">{categoryCounts[category._id] || 0}</p>
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
                <List
                    products={filteredProducts}
                    layout={viewLayout}
                ></List>
            </div>

            <div className="checkout-container">
                    <OrderPanel />
            </div>
        </div>
    )
};