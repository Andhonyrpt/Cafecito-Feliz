import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from '../../../pages/Home';
import Layout from '../Layout/Layout';
import { OrderProvider } from '../../../context/OrderContext';
import { SessionProvider } from '../../../context/SessionContext';

function App() {
  return (
    <OrderProvider>
      <SessionProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path='/' element={<Home />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SessionProvider>
    </OrderProvider>
  );
}

export default App;
