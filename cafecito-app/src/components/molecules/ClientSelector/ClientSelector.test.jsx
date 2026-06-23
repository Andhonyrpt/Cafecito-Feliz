import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ClientSelector from './ClientSelector';
import { searchClient } from '../../../services/clientService';

// Mock the client service
jest.mock('../../../services/clientService', () => ({
  searchClient: jest.fn()
}));

describe('ClientSelector Component', () => {
  const mockClients = [
    { _id: '1', displayName: 'Juan Perez', email: 'juan@example.com' },
    { _id: '2', displayName: 'Maria Gomez', email: 'maria@example.com' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the search input when there is no active client', () => {
    render(<ClientSelector activeClient={null} onSelectClient={jest.fn()} onRemoveClient={jest.fn()} onOpenClientModal={jest.fn()} />);
    expect(screen.getByRole('textbox', { name: /buscar cliente por nombre o email/i })).toBeInTheDocument();
    expect(screen.getByText('Nuevo cliente')).toBeInTheDocument();
  });

  it('displays the active client and allows removing it', () => {
    const onRemoveClientMock = jest.fn();
    render(<ClientSelector activeClient={mockClients[0]} onSelectClient={jest.fn()} onRemoveClient={onRemoveClientMock} onOpenClientModal={jest.fn()} />);
    
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    expect(screen.getByText('juan@example.com')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /buscar cliente por nombre o email/i })).not.toBeInTheDocument();

    const removeBtn = screen.getByLabelText('Quitar cliente del pedido');
    fireEvent.click(removeBtn);
    expect(onRemoveClientMock).toHaveBeenCalledTimes(1);
  });

  it('performs search and displays results', async () => {
    searchClient.mockResolvedValueOnce({ clients: mockClients });
    const onSelectClientMock = jest.fn();

    render(<ClientSelector activeClient={null} onSelectClient={onSelectClientMock} onRemoveClient={jest.fn()} onOpenClientModal={jest.fn()} />);
    
    const input = screen.getByRole('textbox', { name: /buscar cliente por nombre o email/i });
    fireEvent.change(input, { target: { value: 'Juan' } });

    await waitFor(() => {
      expect(searchClient).toHaveBeenCalledWith('Juan');
    });

    await waitFor(() => {
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('maria@example.com')).toBeInTheDocument();
    });

    const listItems = screen.getAllByRole('listitem');
    fireEvent.click(listItems[0]);

    expect(onSelectClientMock).toHaveBeenCalledWith(mockClients[0]);
  });
});
