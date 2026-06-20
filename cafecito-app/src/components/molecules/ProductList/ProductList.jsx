import { useMemo } from "react";
import { useOrder } from "../../../context/OrderContext";
import ProductCard from "../ProductCard/ProductCard";
import "./ProductList.css";

export default function ProductList({
    products = [],
    layout = "grid",
    onAddProduct
}) {

    const { orderItems } = useOrder();

    const quantityByProductId = useMemo(() => {
        return orderItems.reduce((quantities, item) => {
            const productId = item.product?._id || item._id;

            if (productId) {
                quantities[productId] = (quantities[productId] || 0) + item.quantity;
            }

            return quantities;
        }, {});
    }, [orderItems]);

    const renderProductCard = (product, index, orientation) => {
        const totalEnCarrito = quantityByProductId[product._id] || 0;
        const esMaximoStock = totalEnCarrito >= (product.stock || 0);

        return (
            <ProductCard
                key={product._id}
                product={product}
                orientation={orientation}
                className="list-item"
                priority={index < 4}
                onAddProduct={onAddProduct}
                isButtonDisabled={esMaximoStock}
            />
        );
    };

    return (
        <div className="list-container">

            {layout === 'grid' ? (
                <div className="list-grid">
                    {products.map((product, index) => renderProductCard(product, index, "vertical"))}
                </div>
            ) : (
                <div className="list-vertical">
                    {products.map((product, index) => renderProductCard(product, index, "horizontal"))}
                </div>
            )}
        </div>
    );
};
