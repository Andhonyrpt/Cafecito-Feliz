import { memo } from "react";
import Button from "../../atoms/Button/Button";
import './ProductCard.css';

const ProductCard = memo(({ product, orientation, priority = false, onAddProduct, isButtonDisabled }) => {
    const { name, price, imageUrl } = product;

    const cardClass = `product-card product-card--${orientation}`;

    return (
        <div className={cardClass}>
            <img src={imageUrl}
                alt={name}
                className="product-card-image"
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority ? "high" : "auto"}
                width="180"
                height="120"
            />
            <div className="product-card-content">
                <h3 className="product-card-title">
                    {name}
                </h3>

                <div className="product-card-actions">
                    <h3 className="product-card-price">
                        ${price.toFixed(2)}
                    </h3>

                    <Button variant="secondary" size="sm"
                        onClick={() => onAddProduct(product)}
                        disabled={isButtonDisabled}
                        data-testid={`add-product-${product._id}`}
                        aria-label={`Agregar ${name} al pedido`}
                    >
                        +
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
