import { memo } from "react";
import Button from "../../atoms/Button/Button";
import './ProductCard.css';

const ProductCard = memo(({ product, orientation, priority = false, onAdd, isButtonDisabled }) => {
    const { name, price, imageUrl } = product;

    const cardClass = `product-card product-card--${orientation}`;

    return (
        <div className={cardClass}>
            <img src={imageUrl}
                alt={name}
                className="product-card-image"
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
                        onClick={onAdd}
                        disabled={isButtonDisabled}
                    >
                        +
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default ProductCard;
