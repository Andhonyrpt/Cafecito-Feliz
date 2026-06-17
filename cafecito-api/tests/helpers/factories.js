let sequence = 0;

const nextId = () => {
    sequence += 1;
    return `${Date.now()}-${sequence}`;
};

export const makeEmployeeId = (number = null) => {
    if (number !== null) return `EMP-${number}`;
    return `EMP-${1000 + sequence}`;
};

export const makeUserPayload = (overrides = {}) => {
    const id = nextId();

    return {
        displayName: `Test User ${id}`,
        employeeId: overrides.employeeId || makeEmployeeId(1000 + sequence),
        password: '12345',
        avatar: `http://example.com/avatar-${id}.jpg`,
        ...overrides
    };
};

export const makeCategoryPayload = (overrides = {}) => {
    const id = nextId();

    return {
        name: `Category ${id}`,
        imageUrl: `http://example.com/category-${id}.jpg`,
        ...overrides
    };
};

export const makeProductPayload = (parentCategory, overrides = {}) => {
    const id = nextId();

    return {
        name: `Product ${id}`,
        price: 25,
        stock: 10,
        imageUrl: `http://example.com/product-${id}.jpg`,
        parentCategory,
        ...overrides
    };
};

export const makeClientPayload = (overrides = {}) => {
    const id = nextId();

    return {
        displayName: `Client ${id}`,
        email: `client-${id}@example.com`,
        ...overrides
    };
};

export const makeOrderPayload = ({ client = null, productId, products = null, quantity = 1, paymentMethod = 'efectivo', orderType = 'local' } = {}) => ({
    client,
    products: products || [{ productId, quantity }],
    paymentMethod,
    orderType
});
