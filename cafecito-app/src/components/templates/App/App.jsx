import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Home from '../../../pages/Home';
import Layout from '../Layout/Layout';
import { OrderProvider } from '../../../context/OrderContext';
import { SessionProvider } from '../../../context/SessionContext';
import Loading from '../../atoms/Loading/Loading';

const ProtectedRoute = lazy(() => import('../../../pages/ProtectedRoute'));
const SellerOrders = lazy(() => import('../../../pages/SellerOrders'));

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
              <Route path='*' element={<Navigate to='/' replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SessionProvider>
    </OrderProvider>
  );
}

export default App;
