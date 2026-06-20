import { useState, useEffect } from 'react';
import Icon from '../../atoms/Icon';
import { useSession } from '../../../context/SessionContext';
import './Header.css';

export default function Header() {

    const [time, setTime] = useState(new Date());

    // Simulación de autenticación 
    const { currentUser, setIsModalOpen, setSessionMode, calculateExpectedTotals } = useSession();
    const isAuth = !!currentUser;

    useEffect(() => {

        // Intervalo para actualizar la hora cada segundo
        const interval = setInterval(() => {
            setTime(new Date());
        }, 1000);

        // Limpieza de intervalo al desmontar el componente
        return () => clearInterval(interval);
    }, []);

    // Formato de la hora (Ejemplo: 10:32 AM)
    const formatTime = (date) => {
        return new Intl.DateTimeFormat("es-MX", {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    // Formato de la fecha (Ejemplo: 25 May 2025)
    const formatDate = (date) => {
        return new Intl.DateTimeFormat("es-MX", {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        }).format(date);
    };

    const handleLogout = async () => {
        await calculateExpectedTotals();
        setSessionMode('close'); // Setea el modal en modo Cierre de Caja
        setIsModalOpen(true);    // Despliega el modal encima de la app
    };

    return (
        <header className='header'>
            <div className='header-left' />

            <div className='header-center'>
                <img
                    src="/img/logo/logo-cafecito-1.png"
                    alt="Logo Cafecito Feliz"
                    className="header-logo"
                    width="150"
                    height="44"
                />
            </div>

            <div className='header-right'>
                {/* Desktop User Menu */}
                <button
                    className={`user-profile-button ${!isAuth ? 'not-authenticated' : ''}`}>
                    <div className='user-avatar'>
                        {isAuth ? (
                            <img src={currentUser.avatar}
                                alt={currentUser.displayName}
                                className='user-avatar-img'
                                loading='lazy'
                                decoding='async'
                                width='42'
                                height='42'
                            />
                        ) : (
                            <Icon name="user" size={18} className={!isAuth ? "logged-out-icon" : ""} />
                        )}
                    </div>

                    <div className="user-text">
                        <span className="user-name">
                            {isAuth ? currentUser.displayName : "Inicia sesión"}
                        </span>

                        <span className="user-role">
                            {isAuth ? currentUser.role : "Invitado"}
                            {isAuth && <span className='status-dot-online'></span>}
                        </span>
                    </div>
                </button>


                <div className='clock-container'>
                    <Icon name="clock" size={22} className='clock-icon' />

                    <div className='clock-text'>
                        <span className='clock-time'>{formatTime(time)}</span>
                        <span className='clock-date'>{formatDate(time)}</span>
                    </div>
                </div>

                {isAuth && (
                    <div>
                        <button className='logout-button' onClick={handleLogout}>
                            <Icon name="logOut" size={24} />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};
