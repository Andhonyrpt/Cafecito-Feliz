import { useState, useEffect } from 'react';
import { createClient, checkEmail } from '../../../services/clientService';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon';
import './CreateClientModal.css';

export default function CreateClientModal({ onClose, onClientCreated }) {
    const [formData, setFormData] = useState({ displayName: '', email: '' });
    const [isEmailTaken, setIsEmailTaken] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(formData.email)) {
            setIsEmailTaken(false); // Reseteamos el estado por si borró texto
            setError(null);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setError(null);
                const data = await checkEmail(formData.email);
                setIsEmailTaken(data.taken);
            } catch (error) {
                console.error("Error al validar email:", error);

                if (error.response?.status !== 422) {
                    setError("Error al verificar el correo");
                }
            }

        }, 500);

        return () => clearTimeout(timer);
    }, [formData.email]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isEmailTaken) return;

        setLoading(true);
        setError(null);

        try {
            const res = await createClient(formData);

            if (res.client) {
                onClientCreated(res.client);
            }

        } catch (error) {
            setError(error.res?.data?.message || 'Error al crear cliente');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='modal-overlay'>
            <div className='modal-content'>
                <div className='modal-header'>
                    <h2><Icon name='plus' size={20} /> Nuevo Cliente</h2>

                    <button
                        className='close-btn'
                        onClick={onClose}
                        aria-label='Cerrar nuevo cliente'
                    >
                        <Icon name='x' size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className='form-group'>
                        <label htmlFor='client-display-name'>Nombre</label>

                        <input
                            id='client-display-name'
                            type="text"
                            required
                            placeholder='Ej. Juan Pérez'
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        />
                    </div>

                    <div className='form-group'>
                        <label htmlFor='client-email'>Correo Electrónico</label>

                        <input
                            id='client-email'
                            type="text"
                            required
                            placeholder='juan@ejemplo.com'
                            className={isEmailTaken ? 'input-error' : ''}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                        {isEmailTaken && <span className='error-text'>Este correo ya está registrado</span>}
                    </div>

                    {error && <div className='form-error'>{error}</div>}

                    <div className='modal-actions'>
                        <Button
                            variant='ghost'
                            onClick={onClose}
                            type='button'
                        >
                            Cancelar
                        </Button>

                        <Button
                            variant='primary'
                            type='submit'
                            disabled={loading || isEmailTaken}
                        >
                            {loading ? 'Guardando...' : 'Registrar y Seleccionar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
