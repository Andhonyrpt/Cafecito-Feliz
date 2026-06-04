import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Home from '../../pages/Home';
import Layout from '../../layout/Layout';
import { OrderProvider } from '../../context/OrderContext';

function App() {
  return (
    <OrderProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path='/' element={<Home />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </OrderProvider>
  );
}

export default App;
