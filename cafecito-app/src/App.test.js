import { render, screen } from '@testing-library/react';
import App from './components/templates/App/App';

jest.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Routes: ({ children }) => <div>{children}</div>,
  Route: ({ path, element }) => (path === '/' ? element : null),
  Navigate: () => null,
  useNavigate: () => jest.fn(),
}), { virtual: true });

jest.mock('./services/categoryService', () => ({
  fetchCategories: jest.fn().mockResolvedValue([]),
}));

jest.mock('./services/productService', () => ({
  fetchProducts: jest.fn().mockResolvedValue({ products: [], pagination: {} }),
  clearProductsCache: jest.fn(),
}));

test('renders POS session entry point', async () => {
  render(<App />);

  expect(await screen.findByText(/apertura de turno/i)).toBeInTheDocument();
});
