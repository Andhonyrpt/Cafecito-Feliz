import { useState } from 'react';
import Button from '../common/Button/Button';
import Icon from '../common/Icon';
import './ClientSelector.css';

export default function ClientSelector({
    activeClient,
    onSelectClient,
    onRemoveClient,
    onOpenClientModal
}) {

    const [searchTerm, setSearchTerm] = useState('');

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        console.log("Buscando cliente con término:", e.target.value);
    };

    return (
        <div className='client-selector'>
            <div className='client-title'>
                <h3>Cliente</h3>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={onOpenClientModal}
                >
                    <Icon name="plus" size={12} /> Nuevo cliente
                </Button>
            </div>

            <div className='client-search-container'>
                <input
                    type='text'
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder='Buscar por nombre, email o teléfono'
                />

                    <Icon name="search" size={16} />
            </div>

            {activeClient && (
                <div className='active-client-badge'>
                    <img
                        src={activeClient.imageUrl}
                        alt={activeClient.name}
                    />
                    <div className='client-details'>
                        <h4>{activeClient.name}</h4>
                        <p>{activeClient.email}</p>
                    </div>

                    <button
                        onClick={onRemoveClient}
                    >
                        <Icon name="x" size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};