import { useEffect, useState } from 'react';
import { searchClient } from '../../../services/clientService';
import Button from '../../atoms/Button/Button';
import Icon from '../../atoms/Icon';
import './ClientSelector.css';

export default function ClientSelector({
    activeClient,
    onSelectClient,
    onRemoveClient,
    onOpenClientModal
}) {

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!searchTerm.trim() || activeClient) {
            setSearchResults([]);
            setError(null);
            return;
        }

        const delayBounce = setTimeout(async () => {
            try {
                setError(null);

                const data = await searchClient(searchTerm);

                if (data && data.clients) {
                    setSearchResults(data.clients);
                }

            } catch (error) {
                console.error("Error al buscar cliente:", error);
                setError("Error en la búsqueda");
            }
        }, 500);

        return () => clearTimeout(delayBounce);
    }, [searchTerm, activeClient]);

    const handleSearchChange = (e) => {
        const value = e.target.value
        setSearchTerm(value);

        if (!value.trim()) {
            setSearchResults([]);
        }
    };

    const handleSelect = (client) => {
        onSelectClient(client);
        setSearchTerm('');
        setSearchResults([]); // Limpiamos la lista desplegable
    };

    return (
        <div className='client-selector'>
            <div className='client-title'>
                <h3>Cliente</h3>
                {!activeClient && (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={onOpenClientModal}
                    >
                        <Icon name="plus" size={12} /> Nuevo cliente
                    </Button>
                )}
            </div>

            {!activeClient && (
                <div className='client-search-container-relative'>
                    <div className='client-search-container'>
                        <input
                            type='text'
                            value={searchTerm}
                            onChange={handleSearchChange}
                            placeholder='Buscar por nombre o email '
                        />
                        <Icon name="search" size={16} />
                        {error && <span className="search-error-msg">{error}</span>}
                    </div>

                    {searchResults.length > 0 && (
                        <ul className="client-dropdown">
                            {searchResults.map((client) => (
                                <li
                                    key={client._id}
                                    onClick={() => handleSelect(client)}
                                    className="dropdown-item"
                                >
                                    <div className="item-icon">
                                        <Icon name="user" size={14} />
                                    </div>
                                    <div className="item-info">
                                        <span className="item-name">{client.displayName}</span>
                                        <span className="item-email">{client.email}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {activeClient && (
                <div className='active-client-badge'>
                    <div className='client-avatar-icon'>
                        <Icon name="user" size={20} />
                    </div>

                    <div className='client-details'>
                        <h4>{activeClient.displayName}</h4>
                        <p>{activeClient.email}</p>
                    </div>

                    <button
                        onClick={() => {
                            onRemoveClient();
                            setSearchTerm('');
                        }}
                        className='remove-client-btn'
                    >
                        <Icon name="x" size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
