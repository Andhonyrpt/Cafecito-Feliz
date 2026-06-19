import { useOrder } from "../../../context/OrderContext";
import ProductCard from "../ProductCard/ProductCard";
import "./ProductList.css";

export default function ProductList({
    products = [],
    layout = "grid",
    onAddProduct
}) {

    const { orderItems } = useOrder();

    const renderProductCard = (product, index, orientation) => {
        // 2. Sumamos de forma global cuánto hay de ESTE producto en el carrito actual
        const totalEnCarrito = orderItems
            .filter((item) => (item.product?._id || item._id) === product._id)
            .reduce((sum, item) => sum + item.quantity, 0);

        // 3. Evaluamos el booleano limpio contra el stock que viene de MongoDB
        const esMaximoStock = totalEnCarrito >= (product.stock || 0);

        return (
            <ProductCard
                key={product._id}
                product={product}
                orientation={orientation}
                className="list-item"
                priority={index < 2}
                onAdd={() => onAddProduct(product)}
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
