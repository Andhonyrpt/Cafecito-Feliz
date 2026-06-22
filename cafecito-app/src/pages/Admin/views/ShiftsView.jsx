import { useCallback, useEffect, useState } from 'react';
import Button from '../../../components/atoms/Button/Button';
import { getAdminCashSessions } from '../../../services/cashSessionService';
import './ShiftsView.css';

const emptyFilters = {
    status: '',
    role: '',
    employeeId: '',
    from: '',
    to: ''
};

const formatCurrency = (value = 0) => new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
}).format(value || 0);

const formatDateTime = (value) => {
    if (!value) return 'Sin registro';

    return new Intl.DateTimeFormat('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(value));
};

const getDurationLabel = (start, end) => {
    if (!start) return 'Sin duración';

    const diffMs = new Date(end || Date.now()).getTime() - new Date(start).getTime();
    const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
};

const isForgottenOpenShift = (session) => {
    if (session.status !== 'open') return false;
    return Date.now() - new Date(session.openedAt).getTime() > 8 * 60 * 60 * 1000;
};

export default function ShiftsView() {
    const [filters, setFilters] = useState(emptyFilters);
    const [sessions, setSessions] = useState([]);
    const [summary, setSummary] = useState({});
    const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadSessions = useCallback(async (page = 1, nextFilters = emptyFilters) => {
        try {
            setLoading(true);
            setError('');

            const params = Object.entries({ ...nextFilters, page, limit: 10 }).reduce((acc, [key, value]) => {
                if (value !== '') acc[key] = value;
                return acc;
            }, {});

            const data = await getAdminCashSessions(params);
            setSessions(data?.sessions || []);
            setSummary(data?.summary || {});
            setPagination(data?.pagination || { currentPage: 1, totalPages: 1 });
        } catch (error) {
            setError(error?.message || 'No se pudieron cargar los turnos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSessions(1);
    }, [loadSessions]);

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters((current) => ({ ...current, [name]: value }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        loadSessions(1, filters);
    };

    const handleReset = () => {
        setFilters(emptyFilters);
        loadSessions(1, emptyFilters);
    };

    return (
        <section className="admin-shifts-view">
            <div className="admin-shifts-view__header">
                <div>
                    <p className="admin-shifts-view__eyebrow">Caja</p>
                    <h2>Turnos y sesiones</h2>
                </div>
                <Button variant="secondary" onClick={() => loadSessions(pagination.currentPage, filters)}>Actualizar</Button>
            </div>

            {error && <div className="admin-shifts-view__error">{error}</div>}

            <div className="admin-shifts-summary">
                <article>
                    <span>Turnos abiertos</span>
                    <strong>{summary.openSessions || 0}</strong>
                </article>
                <article>
                    <span>Turnos cerrados</span>
                    <strong>{summary.closedSessions || 0}</strong>
                </article>
                <article>
                    <span>Ventas del listado</span>
                    <strong>{formatCurrency(summary.totalSales)}</strong>
                </article>
                <article>
                    <span>Órdenes vendidas</span>
                    <strong>{summary.orderCount || 0}</strong>
                </article>
            </div>

            <form className="admin-shifts-filters" onSubmit={handleSubmit}>
                <select name="status" value={filters.status} onChange={handleFilterChange} aria-label="Estado del turno">
                    <option value="">Todos los estados</option>
                    <option value="open">Abiertos</option>
                    <option value="closed">Cerrados</option>
                </select>

                <select name="role" value={filters.role} onChange={handleFilterChange} aria-label="Rol del empleado">
                    <option value="">Vendedores</option>
                    <option value="vendedor">Vendedor</option>
                </select>

                <input name="employeeId" value={filters.employeeId} onChange={handleFilterChange} placeholder="EMP-01" aria-label="Número de empleado" />
                <input name="from" type="date" value={filters.from} onChange={handleFilterChange} aria-label="Desde" />
                <input name="to" type="date" value={filters.to} onChange={handleFilterChange} aria-label="Hasta" />

                <div className="admin-shifts-filters__actions">
                    <Button variant="primary" type="submit">Filtrar</Button>
                    <Button variant="secondary" onClick={handleReset}>Limpiar</Button>
                </div>
            </form>

            <div className="admin-shifts-list">
                {loading ? (
                    <div className="admin-shifts-list__state">Cargando turnos...</div>
                ) : sessions.length === 0 ? (
                    <div className="admin-shifts-list__state">No hay turnos con esos filtros.</div>
                ) : (
                    sessions.map((session) => {
                        const forgotten = isForgottenOpenShift(session);

                        return (
                            <article className={`admin-shift-card ${forgotten ? 'is-forgotten' : ''}`} key={session._id}>
                                <div className="admin-shift-card__main">
                                    <div>
                                        <span className={`admin-shift-card__status ${session.status === 'open' ? 'is-open' : 'is-closed'}`}>
                                            {session.status === 'open' ? 'Abierto' : 'Cerrado'}
                                        </span>
                                        {forgotten && <span className="admin-shift-card__warning">Turno abierto hace más de 8h</span>}
                                    </div>
                                    <h3>{session.user?.displayName || 'Usuario no disponible'}</h3>
                                    <p>{session.user?.employeeId || 'Sin empleado'} · {session.user?.role || 'Sin rol'}</p>
                                </div>

                                <div className="admin-shift-card__times">
                                    <span>Apertura: <strong>{formatDateTime(session.openedAt)}</strong></span>
                                    <span>Cierre: <strong>{formatDateTime(session.closedAt)}</strong></span>
                                    <span>Duración: <strong>{getDurationLabel(session.openedAt, session.closedAt)}</strong></span>
                                </div>

                                <div className="admin-shift-card__money">
                                    <span>Fondo: <strong>{formatCurrency(session.initialCash)}</strong></span>
                                    <span>Ventas: <strong>{formatCurrency(session.sales?.totalSales)}</strong></span>
                                    <span>Efectivo esperado: <strong>{formatCurrency(session.expectedCash)}</strong></span>
                                </div>

                                <div className="admin-shift-card__audit">
                                    <span>Efectivo: {formatCurrency(session.sales?.cashSales)}</span>
                                    <span>Tarjeta: {formatCurrency(session.sales?.cardSales)}</span>
                                    <span>Órdenes: {session.sales?.orderCount || 0}</span>
                                    {session.status === 'closed' && (
                                        <span className={session.isCashCorrect ? 'is-ok' : 'is-mismatch'}>
                                            {session.isCashCorrect ? 'Caja correcta' : `Descuadre: ${session.discrepancyReason || 'Sin motivo'}`}
                                        </span>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className="admin-shifts-pagination">
                    <Button variant="secondary" size="sm" disabled={!pagination.hasPrev} onClick={() => loadSessions(pagination.currentPage - 1, filters)}>Anterior</Button>
                    <span>Página {pagination.currentPage} de {pagination.totalPages}</span>
                    <Button variant="secondary" size="sm" disabled={!pagination.hasNext} onClick={() => loadSessions(pagination.currentPage + 1, filters)}>Siguiente</Button>
                </div>
            )}
        </section>
    );
}
