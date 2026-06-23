import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionProvider, useSession } from './SessionContext';
import { getUserProfile } from '../services/userService';
import { login, verifyEmployeePin } from '../services/auth';
import { fetchTurnoTotals, createCashSession, closeCashSession, getActiveSession } from '../services/cashSessionService';

// Mock all services
jest.mock('../services/userService', () => ({
  getUserProfile: jest.fn()
}));

jest.mock('../services/auth', () => ({
  login: jest.fn(),
  verifyEmployeePin: jest.fn()
}));

jest.mock('../services/cashSessionService', () => ({
  fetchTurnoTotals: jest.fn(),
  createCashSession: jest.fn(),
  closeCashSession: jest.fn(),
  getActiveSession: jest.fn()
}));

function SessionContextProbe() {
  const {
    currentUser,
    isModalOpen,
    sessionMode,
    expectedCash,
    calculateExpectedTotals,
    handleSessionSubmit
  } = useSession();

  return (
    <div>
      <div data-testid="user-role">{currentUser?.role || 'none'}</div>
      <div data-testid="user-name">{currentUser?.displayName || 'none'}</div>
      <div data-testid="initial-cash">{currentUser?.initialCash || 0}</div>
      <div data-testid="opened-at">{currentUser?.openedAt || 'none'}</div>
      <div data-testid="modal-state">{isModalOpen ? 'open' : 'closed'}</div>
      <div data-testid="session-mode">{sessionMode}</div>
      <div data-testid="expected-cash">{expectedCash}</div>

      <button onClick={() => calculateExpectedTotals()}>calculate</button>
      <button onClick={() => handleSessionSubmit({
        employeeId: 'EMP-01',
        pin: '1234',
        amount: '100',
        timestamp: '2026-06-22T10:00:00.000Z'
      })}>submit open</button>
      <button onClick={() => handleSessionSubmit({
        pin: '1234',
        isCashCorrect: true,
        discrepancyReason: '',
        timestamp: '2026-06-22T18:00:00.000Z'
      })}>submit close</button>
    </div>
  );
}

describe('SessionContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('hydrates user session on mount when seller has an active session', async () => {
    localStorage.setItem('authToken', 'test-token');
    getUserProfile.mockResolvedValueOnce({
      _id: 'user-1',
      displayName: 'Vendedor Test',
      role: 'vendedor',
      employeeId: 'EMP-01'
    });
    getActiveSession.mockResolvedValueOnce({
      session: {
        openedAt: '2026-06-22T10:00:00.000Z',
        initialCash: 150,
        status: 'open'
      }
    });

    await act(async () => {
      render(
        <SessionProvider>
          <SessionContextProbe />
        </SessionProvider>
      );
    });

    expect(screen.getByTestId('user-role')).toHaveTextContent('vendedor');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Vendedor Test');
    expect(screen.getByTestId('initial-cash')).toHaveTextContent('150');
    expect(screen.getByTestId('opened-at')).toHaveTextContent('2026-06-22T10:00:00.000Z');
    expect(screen.getByTestId('modal-state')).toHaveTextContent('closed');
  });

  it('forces session open modal if seller has no active session on mount', async () => {
    localStorage.setItem('authToken', 'test-token');
    getUserProfile.mockResolvedValueOnce({
      _id: 'user-1',
      displayName: 'Vendedor Test',
      role: 'vendedor',
      employeeId: 'EMP-01'
    });
    getActiveSession.mockResolvedValueOnce({ session: null });

    await act(async () => {
      render(
        <SessionProvider>
          <SessionContextProbe />
        </SessionProvider>
      );
    });

    expect(screen.getByTestId('modal-state')).toHaveTextContent('open');
    expect(screen.getByTestId('session-mode')).toHaveTextContent('open');
  });

  it('allows opening session via login', async () => {
    getUserProfile.mockResolvedValueOnce(null); // No token initially
    
    login.mockResolvedValueOnce({
      data: {
        token: 'new-token',
        user: {
          _id: 'user-1',
          displayName: 'Vendedor Test',
          role: 'vendedor',
          employeeId: 'EMP-01'
        }
      }
    });
    createCashSession.mockResolvedValueOnce({ message: 'Success' });

    await act(async () => {
      render(
        <SessionProvider>
          <SessionContextProbe />
        </SessionProvider>
      );
    });

    expect(screen.getByTestId('modal-state')).toHaveTextContent('open');

    await act(async () => {
      fireEvent.click(screen.getByText('submit open'));
    });

    expect(login).toHaveBeenCalledWith({
      employeeId: 'EMP-01',
      password: '1234'
    });
    expect(createCashSession).toHaveBeenCalledWith(100, '2026-06-22T10:00:00.000Z');
    expect(localStorage.getItem('authToken')).toBe('new-token');
    expect(screen.getByTestId('user-name')).toHaveTextContent('Vendedor Test');
  });
});
