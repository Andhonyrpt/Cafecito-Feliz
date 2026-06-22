import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Button from '../../components/atoms/Button/Button';
import './AdminDashboard.css';

export default function AdminDashboard() {
    const navigate = useNavigate();

    return (
        <section className="admin-dashboard">
            <aside className="admin-dashboard__sidebar">
                <div>
                    <p className="admin-dashboard__eyebrow">Admin</p>
                    <h1>Panel administrativo</h1>
                </div>

                <nav className="admin-dashboard__nav" aria-label="Navegación administrativa">
                    <NavLink to="/admin" end>Resumen</NavLink>
                    <NavLink to="/admin/sales">Ventas</NavLink>
                    <NavLink to="/admin/products">Productos</NavLink>
                    <NavLink to="/admin/categories">Categorías</NavLink>
                    <NavLink to="/admin/employees">Empleados</NavLink>
                    <NavLink to="/admin/shifts">Turnos</NavLink>
                </nav>

                <Button variant="secondary" onClick={() => navigate('/')}>
                    Volver al POS
                </Button>
            </aside>

            <main className="admin-dashboard__content">
                <Outlet />
            </main>
        </section>
    );
}
