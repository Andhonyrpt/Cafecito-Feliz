import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '../../../pages/Home';
import Layout from '../Layout/Layout';
import { OrderProvider } from '../../../context/OrderContext';
import { SessionProvider } from '../../../context/SessionContext';
import Loading from '../../atoms/Loading/Loading';

const ProtectedRoute = lazy(() => import('../../../pages/ProtectedRoute'));
const SellerOrders = lazy(() => import('../../../pages/SellerOrders'));
const AdminDashboard = lazy(() => import('../../../pages/Admin/AdminDashboard'));
const AdminHome = lazy(() => import('../../../pages/Admin/views/AdminHome'));
const SalesSummaryView = lazy(() => import('../../../pages/Admin/views/SalesSummaryView'));
const ProductsView = lazy(() => import('../../../pages/Admin/views/ProductsView'));
const CategoriesView = lazy(() => import('../../../pages/Admin/views/CategoriesView'));
const EmployeesView = lazy(() => import('../../../pages/Admin/views/EmployeesView'));
const ShiftsView = lazy(() => import('../../../pages/Admin/views/ShiftsView'));

function App() {
  return (
    <OrderProvider>
      <SessionProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route
                path='/seller/orders'
                element={(
                  <Suspense fallback={<Loading>Cargando ventas</Loading>}>
                    <ProtectedRoute allowedRoles={['vendedor']}>
                      <SellerOrders />
                    </ProtectedRoute>
                  </Suspense>
                )}
              />
              <Route
                path='/admin'
                element={(
                  <Suspense fallback={<Loading>Cargando admin</Loading>}>
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  </Suspense>
                )}
              >
                <Route index element={<AdminHome />} />
                <Route path='sales' element={<SalesSummaryView />} />
                <Route path='products' element={<ProductsView />} />
                <Route path='categories' element={<CategoriesView />} />
                <Route path='employees' element={<EmployeesView />} />
                <Route path='shifts' element={<ShiftsView />} />
              </Route>
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SessionProvider>
    </OrderProvider>
  );
}

export default App;
