import { Navigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';

const getDefaultRouteByRole = (role) => {
    if (role === 'barista') return '/';
    if (role === 'vendedor') return '/';
    if (role === 'admin') return '/admin';

    return '/';
};

export default function ProtectedRoute({ children, redirectTo = '/', allowedRoles = [] }) {
    const { currentUser } = useSession();

    if (!currentUser) {
        return <Navigate to={redirectTo} replace />;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
        return <Navigate to={getDefaultRouteByRole(currentUser.role)} replace />;
    }

    return children;
}
