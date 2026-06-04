import { useOrder } from "../../context/OrderContext";
import ProductCard from "../ProductCard/ProductCard";
import "./List.css";

export default function List({
    products = [],
    layout = "grid"
}) {
    const { addItemToOrder } = useOrder();

    return (
        <div className="list-container">

            {layout === 'grid' ? (
                <div className="list-grid">
                    {products.map((product, index) => {
                        return (
                            <ProductCard
                                key={product._id}
                                product={product}
                                orientation="vertical"
                                className="list-item"
                                priority={index < 2}
                                onAdd={() => addItemToOrder(product)}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="list-vertical">
                    {products.map((product, index) => {
                        return (
                            <ProductCard
                                key={product._id}
                                product={product}
                                orientation="horizontal"
                                className="list-item"
                                priority={index < 2}
                                onAdd={() => addItemToOrder(product)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
};