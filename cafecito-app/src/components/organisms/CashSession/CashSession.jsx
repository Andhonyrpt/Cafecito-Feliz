import { useEffect, useState } from 'react';
import Icon from '../../atoms/Icon';
import { checkEmployeeRole } from '../../../services/auth';
import { useSession } from '../../../context/SessionContext';
import './CashSession.css';

export default function CashSession({ isOpen, mode = 'open', onSessionSubmit, expectedCash }) {
    const [employeeId, setEmployeeId] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCashCorrect, setIsCashCorrect] = useState(null);
    const [discrepancyReason, setDiscrepancyReason] = useState('');
    const [detectedRole, setDetectedRole] = useState(null);

    const { currentUser, setIsModalOpen } = useSession();

    const isOpening = mode === 'open';

    const role = isOpening ? detectedRole : currentUser?.role;
    const isSeller = role === 'vendedor';
    const isAdmin = role === 'admin';

    useEffect(() => {
        if (!isOpening) return;

        const verifyRole = async () => {
            const cleanId = employeeId.trim();
            if (cleanId.length >= 6) {
                const role = await checkEmployeeRole(cleanId);

                if (role === 'unknown') {
                    setError('El número de empleado no está registrado.');
                    setDetectedRole(null);
                } else if (role === 'error') {
                    setError('Error de conexión con el servidor.');
                    setDetectedRole(null);
                } else {
                    setError(''); // Limpia el error si el rol es válido (admin o vendedor)
                    setDetectedRole(role);
                }
            } else {
                setDetectedRole(null);
                setError('');
            }
        };

        verifyRole();

    }, [employeeId, isOpening]);

    useEffect(() => {
        if (isOpen) {
            // Ponemos un micro-retraso para que actúe JUSTO DESPUÉS de que el navegador intente inyectar datos fijos
            const forceClean = setTimeout(() => {
                setEmployeeId('');
                setPin('');
                setAmount('');
                setIsCashCorrect(null);
                setDiscrepancyReason('');
                setError('');

                if (!isOpening && currentUser) {
                    setDetectedRole(currentUser.role);
                } else {
                    setDetectedRole(null);
                }

            }, 50);

            return () => clearTimeout(forceClean);
        }
    }, [isOpen, mode, isOpening, currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (isOpening) {

            if (!role) {
                setError('Ingresa un número de empleado válido para continuar.');
                return;
            }

            if (!isSeller) {
                if (!employeeId || !pin) {
                    setError('Todos los campos son obligatorios para continuar.');
                    return;
                }
            } else {
                // Si es vendedor normal, el dinero sigue siendo obligatorio
                if (!employeeId || !pin || !amount) {
                    setError('Todos los campos son obligatorios para continuar.');
                    return;
                }
            }
        } else {
            if (!isSeller) {
                if (!pin) {
                    setError('Por favor, ingresa tu PIN para continuar.');
                    return;
                }
            } else {
                if (isCashCorrect === null) {
                    setError('Por favor, selecciona si el efectivo coincide o no.');
                    return;
                }

                if (isCashCorrect === false && !discrepancyReason.trim()) {
                    setError('Por favor, detalla el motivo del descuadre obligatoriamente.');
                    return;
                }

                if (!pin) {
                    setError('Por favor, ingresa tu PIN para continuar.');
                    return;
                }
            }
        }

        const sessionData = {
            employeeId: isOpening ? employeeId : null,
            pin,
            amount: isOpening ? (isSeller ? parseFloat(amount) : 0) : (isSeller ? expectedCash : 0),
            timestamp: new Date(),
            isCashCorrect: isSeller ? (isOpening ? null : isCashCorrect) : null,
            discrepancyReason: isSeller ? (isOpening ? '' : discrepancyReason) : ""
        };

        setIsSubmitting(true);
        const result = await onSessionSubmit(sessionData);
        setIsSubmitting(false);

        if (result === true) {
            // Si el contexto dio luz verde, limpiamos el formulario local
            setEmployeeId('');
            setPin('');
            setAmount('');
            setIsCashCorrect(null);
            setDiscrepancyReason('');
            setDetectedRole(null);
            setError('');
        } else {
            // Si el contexto devolvió un string de error, lo pintamos en pantalla
            setError(result);
        }
    };

    if (!isOpen) return null;

    return (
        <div className='session-modal-overlay'>
            <div className='session-modal-container'>
                {!isOpening && (
                    <button
                        type='button'
                        className='session-modal-close-btn'
                        onClick={() => setIsModalOpen(false)}
                    >
                        <Icon name='x' size={20} />
                    </button>
                )}

                <div className='session-modal-header'>
                    <div className={`session-icon-badge ${isOpening ? 'open-badge' : 'close-badge'}`}>
                        <Icon name={isOpening ? "unlock" : "lock"} size={24} />
                    </div>
                    <h2>{isOpening ? (!isSeller && role ? `Acceso de ${isAdmin ? 'Administrador' : 'Barista'}` : 'Apertura de turno') : (!isSeller ? 'Cerrar sesión' : 'Cierre de turno y caja')}</h2>
                    <p>
                        {
                            isOpening ?
                                (!isSeller && role ?
                                    "Ingresa tus credenciales para acceder a tu vista asignada."
                                    : "Ingresa tu PIN de empleado y el dinero en efectivo con el que inicia la caja.") :
                                (!isSeller ? "Confirma tu PIN para cerrar tu sesión de forma segura."
                                    : "Registra tu PIN para confirmar tu identidad y el efectivo total final en caja.")
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className='session-modal-form' autoComplete='off'>
                    {error && (typeof error === 'string' ? error.trim().length > 0 : error.message) && (
                        <div className='session-modal-error'>
                            <Icon name="alertTriangle" size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {isOpening && (
                        <div className="session-input-group">
                            <label>Número de Empleado</label>
                            <div className="session-input-wrapper">
                                <Icon name="user" size={18} className="session-input-icon" />
                                <input
                                    type="text"
                                    placeholder="Ej. EMP-01"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value)}
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    )}

                    <div className="session-input-group">
                        <label >PIN de Empleado</label>
                        <div className='session-input-wrapper'>
                            <Icon name="key" size={18} className='session-input-icon' />
                            <input
                                type="password"
                                placeholder="••••"
                                maxLength={6}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                autoComplete='new-password'
                            />
                        </div>
                    </div>

                    {isOpening && isSeller && (
                        <div className='session-input-group'>
                            <label>Fondo inicial en Caja</label>
                            <div className='session-input-wrapper'>
                                <span className='session-currency-prefix'>$</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {!isOpening && isSeller && (
                        <div className="session-input-group">
                            <div className="session-expected-cash-box">
                                <span className="session-expected-label">Efectivo esperado en caja:</span>
                                <span className="session-expected-amount">
                                    {/* Formateamos el número a dos decimales de forma limpia */}
                                    ${new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(expectedCash || 0)}
                                </span>
                            </div>

                            <label>¿El dinero físico en caja coincide con el total esperado?</label>
                            <div className='session-buttons-container'>
                                <button
                                    type="button"
                                    className={`btn-session-audit btn-audit-yes ${isCashCorrect === true ? 'active' : ''}`}
                                    onClick={() => { setIsCashCorrect(true); setError(''); }}
                                >
                                    SÍ, COINCIDE
                                </button>

                                <button
                                    type="button"
                                    className={`btn-session-audit btn-audit-no ${isCashCorrect === false ? 'active' : ''}`}
                                    onClick={() => { setIsCashCorrect(false); setError(''); }}
                                >
                                    NO COINCIDE
                                </button>
                            </div>
                        </div>
                    )}

                    {!isOpening && isSeller && isCashCorrect === false && (
                        <div className="session-input-group">
                            <label>Detalla el motivo del descuadre obligatoriamente</label>
                            <div className="session-input-wrapper">
                                <input
                                    className="session-discrepancy-input"
                                    type="text"
                                    placeholder="Ej. falta cambio de $50 / se dio cambio de más por error"
                                    value={discrepancyReason}
                                    onChange={(e) => setDiscrepancyReason(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    <button
                        type='submit'
                        className={`btn-session-submit ${isOpening ? 'btn-open' : 'btn-close'}`}
                        disabled={isSubmitting || (isOpening ? (!role || (!isSeller ? (!employeeId.trim() || !pin.trim()) : (!employeeId.trim() || !pin.trim() || !amount.trim())))
                            : (!isSeller ? !pin.trim() : (isCashCorrect === null || pin.trim() === '' || (isCashCorrect === false && !discrepancyReason.trim()))))
                        }
                    >
                        {isSubmitting ? 'Procesando...' : (isOpening ? (!isSeller && role ? 'Iniciar sesión' : 'Abrir Caja y Comenzar') : (!isSeller ? 'Cerrar sesión' : 'Realizar Corte y Cierre de Caja'))}
                    </button>
                </form>
            </div>
        </div>
    );
};
