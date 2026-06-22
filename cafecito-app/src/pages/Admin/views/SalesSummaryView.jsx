import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/atoms/Button/Button';
import { getAdminOrders, getSalesSummary } from '../../../services/adminService';
import { getAllUsers } from '../../../services/userService';
import './SalesSummaryView.css';

const RANGE_LABELS = {
    day: 'Día',
    week: 'Semana',
    month: 'Mes',
    year: 'Año'
};

const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(value || 0);
};

const formatDateTime = (value) => {
    if (!value) return '';

    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
};

const formatFullDateTime = (value) => {
    if (!value) return '';

    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
};

const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const getOrderProductsLabel = (order) => {
    return order.products?.map((item) => {
        const name = item.productId?.name || 'Producto';
        const notes = item.notes ? ` (${item.notes})` : '';
        return `${item.quantity}x ${name}${notes}`;
    }).join(' | ') || '';
};

const getEmployeeLabel = (employee) => employee ? `${employee.displayName} (${employee.employeeId})` : '';

const filterEmployees = (employees, query) => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return [];

    return employees.filter((employee) => {
        const name = employee.displayName?.toLowerCase() || '';
        const employeeId = employee.employeeId?.toLowerCase() || '';
        return name.includes(normalizedQuery) || employeeId.includes(normalizedQuery);
    }).slice(0, 6);
};

function SalesLineChart({ points = [] }) {
    if (points.length === 0) {
        return <p className="sales-summary-view__empty">Sin ventas en este rango.</p>;
    }

    const width = 640;
    const height = 220;
    const padding = 28;
    const maxTotal = Math.max(...points.map((point) => point.total || 0), 1);
    const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
    const coordinates = points.map((point, index) => {
        const x = points.length > 1 ? padding + index * stepX : width / 2;
        const y = height - padding - ((point.total || 0) / maxTotal) * (height - padding * 2);
        return { ...point, x, y };
    });
    const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
    const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${height - padding} L ${coordinates[0].x} ${height - padding} Z`;

    return (
        <div className="sales-line-chart" aria-label="Gráfica de ingresos por periodo">
            <svg viewBox={`0 0 ${width} ${height}`} role="img">
                <defs>
                    <linearGradient id="salesAreaGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
                    </linearGradient>
                </defs>
                <line className="sales-line-chart__axis" x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
                <path className="sales-line-chart__area" d={areaPath} />
                <path className="sales-line-chart__line" d={linePath} />
                {coordinates.map((point) => (
                    <g key={point.label}>
                        <circle className="sales-line-chart__dot" cx={point.x} cy={point.y} r="5" />
                        <title>{point.label}: {formatCurrency(point.total)}</title>
                    </g>
                ))}
            </svg>
            <div className="sales-line-chart__legend">
                {points.map((point) => (
                    <span key={point.label}>{point.label}</span>
                ))}
            </div>
        </div>
    );
}

function TopProductsChart({ products = [] }) {
    if (products.length === 0) {
        return <p className="sales-summary-view__empty">Sin productos vendidos.</p>;
    }

    const maxQuantity = Math.max(...products.map((product) => product.quantitySold || 0), 1);

    return (
        <div className="top-products-chart" aria-label="Productos más vendidos">
            {products.map((product) => (
                <div className="top-products-chart__row" key={product.productId}>
                    <div className="top-products-chart__meta">
                        <strong>{product.name}</strong>
                        <span>{product.quantitySold} vendidos · {formatCurrency(product.totalRevenue)}</span>
                    </div>
                    <div className="top-products-chart__track">
                        <span style={{ width: `${((product.quantitySold || 0) / maxQuantity) * 100}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function SalesSummaryView({ compact = false }) {
    const [range, setRange] = useState('day');
    const [data, setData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [sellers, setSellers] = useState([]);
    const [baristas, setBaristas] = useState([]);
    const [sellerSearch, setSellerSearch] = useState('');
    const [baristaSearch, setBaristaSearch] = useState('');
    const [ordersPagination, setOrdersPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [orderFilters, setOrderFilters] = useState({
        sellerEmployeeId: '',
        baristaEmployeeId: '',
        paymentMethod: '',
        status: '',
        from: '',
        to: ''
    });
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [error, setError] = useState('');
    const [ordersError, setOrdersError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadSummary = async () => {
            setLoading(true);
            setError('');

            try {
                const summary = await getSalesSummary(range);

                if (isMounted) setData(summary);
            } catch (error) {
                if (isMounted) setError(error?.message || 'No se pudo cargar el resumen de ventas.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadSummary();

        return () => {
            isMounted = false;
        };
    }, [range]);

    const getOrderQueryParams = useCallback((page = 1, limit = 10) => {
        const params = { page, limit };

        if (orderFilters.from || orderFilters.to) {
            if (orderFilters.from) params.from = orderFilters.from;
            if (orderFilters.to) params.to = orderFilters.to;
        } else {
            params.range = range;
        }

        Object.entries(orderFilters).forEach(([key, value]) => {
            if (value && key !== 'from' && key !== 'to') params[key] = value.trim();
        });

        return params;
    }, [orderFilters, range]);

    const loadAdminOrders = useCallback(async (page = 1) => {
        if (compact) return;

        try {
            setOrdersLoading(true);
            setOrdersError('');
            const ordersData = await getAdminOrders(getOrderQueryParams(page));
            setOrders(ordersData?.orders || []);
            setOrdersPagination(ordersData?.pagination || { currentPage: 1, totalPages: 1 });
        } catch (error) {
            setOrdersError(error?.message || 'No se pudieron cargar las órdenes.');
        } finally {
            setOrdersLoading(false);
        }
    }, [compact, getOrderQueryParams]);

    useEffect(() => {
        loadAdminOrders(1);
    }, [loadAdminOrders]);

    useEffect(() => {
        if (compact) return undefined;

        let isMounted = true;

        const loadEmployees = async () => {
            try {
                const [sellerData, baristaData] = await Promise.all([
                    getAllUsers({ role: 'vendedor', limit: 100 }),
                    getAllUsers({ role: 'barista', limit: 100 })
                ]);

                if (!isMounted) return;

                setSellers(sellerData?.users || []);
                setBaristas(baristaData?.users || []);
            } catch (error) {
                if (isMounted) setOrdersError(error?.message || 'No se pudieron cargar empleados para filtros.');
            }
        };

        loadEmployees();

        return () => {
            isMounted = false;
        };
    }, [compact]);

    const handleRangeChange = (value) => {
        setRange(value);
        setSelectedOrder(null);
    };

    const handleOrderFilterChange = (event) => {
        const { name, value } = event.target;
        setSelectedOrder(null);
        setOrderFilters((current) => ({ ...current, [name]: value }));
    };

    const handleEmployeeSearchChange = (role, value) => {
        setSelectedOrder(null);

        const normalizedValue = value.trim().toUpperCase();
        const isEmployeeId = /^EMP-\d+$/.test(normalizedValue);

        if (role === 'seller') {
            setSellerSearch(value);
            setOrderFilters((current) => ({
                ...current,
                sellerEmployeeId: isEmployeeId ? normalizedValue : ''
            }));
            return;
        }

        setBaristaSearch(value);
        setOrderFilters((current) => ({
            ...current,
            baristaEmployeeId: isEmployeeId ? normalizedValue : ''
        }));
    };

    const handleEmployeeSelect = (role, employee) => {
        setSelectedOrder(null);

        if (role === 'seller') {
            setSellerSearch(getEmployeeLabel(employee));
            setOrderFilters((current) => ({ ...current, sellerEmployeeId: employee.employeeId }));
            return;
        }

        setBaristaSearch(getEmployeeLabel(employee));
        setOrderFilters((current) => ({ ...current, baristaEmployeeId: employee.employeeId }));
    };

    const handleOrderFilterSubmit = (event) => {
        event.preventDefault();
        setSelectedOrder(null);
        loadAdminOrders(1);
    };

    const handleClearOrderFilters = () => {
        setSelectedOrder(null);
        setSellerSearch('');
        setBaristaSearch('');
        setOrderFilters({
            sellerEmployeeId: '',
            baristaEmployeeId: '',
            paymentMethod: '',
            status: '',
            from: '',
            to: ''
        });
    };

    const handleExportCsv = async () => {
        try {
            setOrdersError('');
            const ordersData = await getAdminOrders(getOrderQueryParams(1, 1000));
            const exportOrders = ordersData?.orders || [];
            const rows = [
                ['Orden', 'Fecha', 'Vendedor', 'Barista', 'Estado', 'Pago', 'Tipo', 'Cliente', 'Productos', 'Subtotal', 'Descuento', 'IVA', 'Total'],
                ...exportOrders.map((order) => [
                    order.orderNumber,
                    formatFullDateTime(order.createdAt),
                    `${order.user?.displayName || ''} ${order.user?.employeeId ? `(${order.user.employeeId})` : ''}`,
                    `${order.assignedBarista?.displayName || ''} ${order.assignedBarista?.employeeId ? `(${order.assignedBarista.employeeId})` : ''}`,
                    order.status,
                    order.paymentMethod,
                    order.orderType,
                    order.client?.displayName || '',
                    getOrderProductsLabel(order),
                    order.subtotal,
                    order.discount,
                    order.tax,
                    order.totalPrice
                ])
            ];
            const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ventas-${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (error) {
            setOrdersError(error?.message || 'No se pudo exportar el CSV.');
        }
    };

    const sellerSuggestions = orderFilters.sellerEmployeeId ? [] : filterEmployees(sellers, sellerSearch);
    const baristaSuggestions = orderFilters.baristaEmployeeId ? [] : filterEmployees(baristas, baristaSearch);

    const summary = data?.summary || {};
    const periodLabel = data?.startDate && data?.endDate
        ? `${formatDateTime(data.startDate)} - ${formatDateTime(data.endDate)}`
        : '';

    return (
        <section className="sales-summary-view">
            <div className="sales-summary-view__header">
                <div>
                    <p className="sales-summary-view__eyebrow">Ventas</p>
                    <h2>{compact ? 'Resumen de hoy' : 'Resumen de ventas'}</h2>
                </div>

                {!compact && (
                    <div className="sales-summary-view__ranges" aria-label="Rango de ventas">
                        {Object.entries(RANGE_LABELS).map(([value, label]) => (
                            <Button
                                key={value}
                                variant={range === value ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => handleRangeChange(value)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {error && <div className="sales-summary-view__error">{error}</div>}
            {loading && <div className="sales-summary-view__state">Cargando resumen...</div>}

            {!loading && !error && (
                <>
                    <div className="sales-summary-view__kpis">
                        <article>
                            <span>Ingresos</span>
                            <strong>{formatCurrency(summary.totalSales)}</strong>
                        </article>
                        <article>
                            <span>Órdenes</span>
                            <strong>{summary.orderCount || 0}</strong>
                        </article>
                        <article>
                            <span>Efectivo</span>
                            <strong>{formatCurrency(summary.cashSales)}</strong>
                        </article>
                        <article>
                            <span>Tarjeta</span>
                            <strong>{formatCurrency(summary.cardSales)}</strong>
                        </article>
                        <article>
                            <span>Ticket promedio</span>
                            <strong>{formatCurrency(summary.averageTicket)}</strong>
                        </article>
                    </div>

                    {compact ? (
                        <div className="sales-summary-view__today-overview">
                            <section className="sales-summary-view__chart-card sales-summary-view__today-chart">
                                <div className="sales-summary-view__section-title">
                                    <h3>Ritmo del día</h3>
                                    {periodLabel && <span>{periodLabel}</span>}
                                </div>
                                <SalesLineChart points={data?.salesSeries || []} />
                            </section>

                            <section className="sales-summary-view__chart-card sales-summary-view__today-side-card">
                                <div className="sales-summary-view__section-title">
                                    <h3>Más vendido</h3>
                                    <span>Hoy</span>
                                </div>
                                {data?.topProducts?.[0] ? (
                                    <div className="sales-summary-view__top-highlight">
                                        <strong>{data.topProducts[0].name}</strong>
                                        <span>{data.topProducts[0].quantitySold} vendidos</span>
                                        <b>{formatCurrency(data.topProducts[0].totalRevenue)}</b>
                                    </div>
                                ) : (
                                    <p className="sales-summary-view__empty">Sin productos vendidos.</p>
                                )}
                            </section>

                            <section className="sales-summary-view__chart-card sales-summary-view__today-side-card">
                                <div className="sales-summary-view__section-title">
                                    <h3>Pagos</h3>
                                    <span>Distribución</span>
                                </div>
                                <div className="payment-mix-chart payment-mix-chart--compact">
                                    <div className="payment-mix-chart__bar">
                                        <span
                                            className="payment-mix-chart__cash"
                                            style={{ width: `${summary.totalSales ? (summary.cashSales / summary.totalSales) * 100 : 0}%` }}
                                        />
                                        <span
                                            className="payment-mix-chart__card"
                                            style={{ width: `${summary.totalSales ? (summary.cardSales / summary.totalSales) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <div className="payment-mix-chart__legend">
                                        <span><b className="is-cash" /> Efectivo {formatCurrency(summary.cashSales)}</span>
                                        <span><b className="is-card" /> Tarjeta {formatCurrency(summary.cardSales)}</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : (
                        <div className="sales-summary-view__details">
                            <section className="sales-summary-view__chart-card sales-summary-view__chart-card--wide">
                                <div className="sales-summary-view__section-title">
                                    <h3>Ingresos por periodo</h3>
                                    {periodLabel && <span>{periodLabel}</span>}
                                </div>
                                <SalesLineChart points={data?.salesSeries || []} />
                            </section>

                            <section className="sales-summary-view__chart-card">
                                <div className="sales-summary-view__section-title">
                                    <h3>Top productos</h3>
                                    <span>Por unidades vendidas</span>
                                </div>
                                <TopProductsChart products={data?.topProducts || []} />
                            </section>

                            <section className="sales-summary-view__chart-card">
                                <div className="sales-summary-view__section-title">
                                    <h3>Mezcla de pagos</h3>
                                    <span>Efectivo vs tarjeta</span>
                                </div>
                                <div className="payment-mix-chart">
                                    <div className="payment-mix-chart__bar">
                                        <span
                                            className="payment-mix-chart__cash"
                                            style={{ width: `${summary.totalSales ? (summary.cashSales / summary.totalSales) * 100 : 0}%` }}
                                        />
                                        <span
                                            className="payment-mix-chart__card"
                                            style={{ width: `${summary.totalSales ? (summary.cardSales / summary.totalSales) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <div className="payment-mix-chart__legend">
                                        <span><b className="is-cash" /> Efectivo {formatCurrency(summary.cashSales)}</span>
                                        <span><b className="is-card" /> Tarjeta {formatCurrency(summary.cardSales)}</span>
                                    </div>
                                </div>
                            </section>

                            <section className="sales-summary-view__orders sales-summary-view__chart-card--wide">
                                <div className="sales-summary-view__section-title">
                                    <h3>Órdenes del periodo</h3>
                                    <span>{ordersPagination.total || 0} resultados</span>
                                </div>

                                <form className="admin-orders-filters" onSubmit={handleOrderFilterSubmit}>
                                    <label>
                                        <span>Vendedor</span>
                                        <div className="admin-orders-autocomplete">
                                            <input
                                                value={sellerSearch}
                                                onChange={(event) => handleEmployeeSearchChange('seller', event.target.value)}
                                                placeholder="Nombre o EMP-##"
                                                aria-label="Buscar vendedor por nombre o empleado"
                                                autoComplete="off"
                                            />
                                            {sellerSuggestions.length > 0 && (
                                                <div className="admin-orders-autocomplete__menu">
                                                    {sellerSuggestions.map((seller) => (
                                                        <button key={seller._id} type="button" onClick={() => handleEmployeeSelect('seller', seller)}>
                                                            <strong>{seller.displayName}</strong>
                                                            <span>{seller.employeeId}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                    <label>
                                        <span>Barista</span>
                                        <div className="admin-orders-autocomplete">
                                            <input
                                                value={baristaSearch}
                                                onChange={(event) => handleEmployeeSearchChange('barista', event.target.value)}
                                                placeholder="Nombre o EMP-##"
                                                aria-label="Buscar barista por nombre o empleado"
                                                autoComplete="off"
                                            />
                                            {baristaSuggestions.length > 0 && (
                                                <div className="admin-orders-autocomplete__menu">
                                                    {baristaSuggestions.map((barista) => (
                                                        <button key={barista._id} type="button" onClick={() => handleEmployeeSelect('barista', barista)}>
                                                            <strong>{barista.displayName}</strong>
                                                            <span>{barista.employeeId}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                    <label>
                                        <span>Pago</span>
                                        <select name="paymentMethod" value={orderFilters.paymentMethod} onChange={handleOrderFilterChange} aria-label="Método de pago">
                                            <option value="">Todos</option>
                                            <option value="efectivo">Efectivo</option>
                                            <option value="tarjeta">Tarjeta</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span>Estado</span>
                                        <select name="status" value={orderFilters.status} onChange={handleOrderFilterChange} aria-label="Estado de orden">
                                            <option value="">Todos</option>
                                            <option value="pendiente">Pendiente</option>
                                            <option value="completado">Completado</option>
                                        </select>
                                    </label>
                                    <label>
                                        <span>Desde</span>
                                        <input name="from" type="date" value={orderFilters.from} onChange={handleOrderFilterChange} aria-label="Desde" />
                                    </label>
                                    <label>
                                        <span>Hasta</span>
                                        <input name="to" type="date" value={orderFilters.to} onChange={handleOrderFilterChange} aria-label="Hasta" />
                                    </label>
                                    <div className="admin-orders-filters__actions" aria-label="Acciones de filtros">
                                        <Button variant="primary" type="submit" size="sm">Filtrar</Button>
                                        <Button variant="secondary" size="sm" onClick={handleClearOrderFilters}>Limpiar</Button>
                                        <Button variant="secondary" size="sm" onClick={handleExportCsv}>CSV</Button>
                                    </div>
                                </form>

                                {ordersError && <div className="sales-summary-view__error">{ordersError}</div>}

                                <div className="admin-orders-list">
                                    {ordersLoading ? (
                                        <div className="admin-orders-list__state">Cargando órdenes...</div>
                                    ) : orders.length === 0 ? (
                                        <div className="admin-orders-list__state">No hay órdenes con esos filtros.</div>
                                    ) : (
                                        orders.map((order) => (
                                            <article className="admin-order-card" key={order._id}>
                                                <div>
                                                    <span className="admin-order-card__number">Orden #{order.orderNumber}</span>
                                                    <h4>{formatCurrency(order.totalPrice)}</h4>
                                                    <p>{formatFullDateTime(order.createdAt)} · {order.paymentMethod} · {order.status}</p>
                                                </div>
                                                <div>
                                                    <span>Vendedor</span>
                                                    <strong>{order.user?.displayName || 'Sin vendedor'}</strong>
                                                    <p>{order.user?.employeeId || ''}</p>
                                                </div>
                                                <div>
                                                    <span>Barista</span>
                                                    <strong>{order.assignedBarista?.displayName || 'Sin asignar'}</strong>
                                                    <p>{order.assignedBarista?.employeeId || ''}</p>
                                                </div>
                                                <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(order)}>Detalle</Button>
                                            </article>
                                        ))
                                    )}
                                </div>

                                {ordersPagination.totalPages > 1 && (
                                    <div className="admin-orders-pagination">
                                        <Button variant="secondary" size="sm" disabled={!ordersPagination.hasPrev} onClick={() => loadAdminOrders(ordersPagination.currentPage - 1)}>Anterior</Button>
                                        <span>Página {ordersPagination.currentPage} de {ordersPagination.totalPages}</span>
                                        <Button variant="secondary" size="sm" disabled={!ordersPagination.hasNext} onClick={() => loadAdminOrders(ordersPagination.currentPage + 1)}>Siguiente</Button>
                                    </div>
                                )}

                                {selectedOrder && (
                                    <div className="admin-order-detail">
                                        <div className="sales-summary-view__section-title">
                                            <h3>Detalle orden #{selectedOrder.orderNumber}</h3>
                                            <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>Cerrar</Button>
                                        </div>
                                        <div className="admin-order-detail__grid">
                                            <span>Cliente: <strong>{selectedOrder.client?.displayName || 'Sin cliente'}</strong></span>
                                            <span>Tipo: <strong>{selectedOrder.orderType === 'llevar' ? 'Para llevar' : 'Consumir aquí'}</strong></span>
                                            <span>Subtotal: <strong>{formatCurrency(selectedOrder.subtotal)}</strong></span>
                                            <span>Descuento: <strong>{formatCurrency(selectedOrder.discount)}</strong></span>
                                            <span>IVA: <strong>{formatCurrency(selectedOrder.tax)}</strong></span>
                                            <span>Total: <strong>{formatCurrency(selectedOrder.totalPrice)}</strong></span>
                                        </div>
                                        <ul className="admin-order-detail__products">
                                            {selectedOrder.products?.map((item) => (
                                                <li key={item._id || item.productId?._id}>
                                                    <span>{item.quantity}x {item.productId?.name || 'Producto'}</span>
                                                    <strong>{formatCurrency((item.price || 0) * (item.quantity || 0))}</strong>
                                                    {item.notes && <em>{item.notes}</em>}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </>
            )}
        </section>
    );
}
