import { useState } from 'react';
import Icon from '../common/Icon';
import './CashSession.css';

export default function CashSession({ isOpen, mode = 'open', onSessionSubmit, expectedCash }) {
    const [employeeId, setEmployeeId] = useState('');
    const [pin, setPin] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [isCashCorrect, setIsCashCorrect] = useState(null);
    const [discrepancyReason, setDiscrepancyReason] = useState('');

    if (!isOpen) return null;

    const isOpening = mode === 'open';

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isOpening) {

            if (!employeeId || !pin || !amount) {
                setError('Todos los campos son obligatorios para continuar.');
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

        const sessionData = {
            employeeId: isOpening ? employeeId : null,
            pin,
            amount: isOpening ? parseFloat(amount) : expectedCash,
            timestamp: new Date(),
            isCashCorrect: isOpening ? null : isCashCorrect,
            discrepancyReason: isOpening ? "" : discrepancyReason
        };

        const result = onSessionSubmit(sessionData);

        if (result === true) {
            // Si el contexto dio luz verde, limpiamos el formulario local
            setEmployeeId('');
            setPin('');
            setAmount('');
            setIsCashCorrect(null);
            setDiscrepancyReason('');
        } else {
            // Si el contexto devolvió un string de error, lo pintamos en pantalla
            setError(result);
        }
    };

    return (
        <div className='session-modal-overlay'>
            <div className='session-modal-container'>
                <div className='session-modal-header'>
                    <div className={`session-icon-badge ${isOpening ? 'open-badge' : 'close-badge'}`}>
                        <Icon name={isOpening ? "unlock" : "lock"} size={24} />
                    </div>
                    <h2>{isOpening ? 'Apertura de turno' : 'Cierre de turno y caja'}</h2>
                    <p>
                        {
                            isOpening ?
                                "Ingresa tu PIN de empleado y el dinero en efectivo con el que inicia la caja." :
                                "Registra tu PIN para confirmar tu identidad y el efectivo total final en caja."
                        }
                    </p>
                </div>

                <form onSubmit={handleSubmit} className='session-modal-form'>
                    {error && (
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
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className='session-input-group'>
                        <label>{isOpening ? "Fondo inicial en Caja" : "Efectivo Final en Caja"}</label>
                        {isOpening ? (
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
                        ) : (
                            <div className='session-balance-badge'>
                                <span>${expectedCash.toFixed(2)}</span>
                            </div>
                        )}
                    </div>

                    {!isOpening && (
                        <div className="session-input-group">
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

                    {!isOpening && isCashCorrect === false && (
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
                        disabled={!isOpening && (isCashCorrect === null ||
                            pin.trim() === '' || (isCashCorrect === false && !discrepancyReason.trim()))
                        }
                    >
                        {isOpening ? 'Abrir Caja y Comenzar' : 'Realizar Corte y Cierre de Caja'}
                    </button>
                </form>
            </div>
        </div>
    );
};