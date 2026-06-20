import { useState } from 'react';
import Button from '../../atoms/Button/Button';
import './ModifiersModal.css';

export default function ModifiersModal({ isOpen, onClose, product, onConfirm }) {
    const [note, setNote] = useState('');

    if (!isOpen || !product) return null;

    const handleSubmit = () => {
        onConfirm(product, note);
        setNote('');
        onClose();
    };

    return (
        <div className='modal-overlay'>
            <div className='modifiers-modal'>
                <div className='modifiers-modal__header'>
                    <h2>Personalizar {product.name}</h2>
                    <button
                        className='close-btn'
                        onClick={onClose}
                    >
                        &times;
                    </button>
                </div>

                <div className='modifiers-modal__body'>
                    <img src={product.imageUrl}
                        alt={product.name}
                        className='modal-product-img'
                        width='180'
                        height='120'
                        loading='eager'
                        decoding='async'
                    />

                    <div className='modifiers-form-group'>
                        <label htmlFor="drink-notes">Notas:</label>
                        <textarea
                            id="drink-notes"
                            placeholder='Ej. Leche de almendras, sin azucar...'
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows='3'
                        />
                    </div>
                </div>

                <div className='modifiers-modal__footer'>
                    <Button variant='secondary' size='md'
                        onClick={onClose}
                        className='btn-cancelar'
                    >
                        Cancelar
                    </Button>

                    <Button variant='primary' size='sm'
                        onClick={handleSubmit}
                        className='btn-confirmar'
                        data-testid='modifier-confirm-add'

                    >
                        Agregar a la orden
                    </Button>
                </div>
            </div>
        </div>
    );
};
