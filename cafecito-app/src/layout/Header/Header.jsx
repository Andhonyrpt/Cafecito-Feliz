import { useState, useEffect } from 'react';
import Icon from '../../components/common/Icon';
import './Header.css';

export default function Header() {

    const [time, setTime] = useState(new Date());

    // Simulación de autenticación (Cambia a true o false para probar ambos estados)
    const isAuth = true;
    const user = { name: "María López", role: "Vendedora" };

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

    return (
        <header className='header'>
            <div className='header-left' />

            <div className='header-center'>
                <img src="/img/logo/logo-cafecito-1.png" alt="Logo Cafecito Feliz"
                    style={{ width: "150px", height: "auto" }} />
            </div>

            <div className='header-right'>
                {/* Desktop User Menu */}
                <button
                    className={`user-profile-button ${!isAuth ? 'not-authenticated' : ''}`}>
                    <div className='user-avatar'>
                        {isAuth ? (
                            <Icon name="user" size={18} />
                        ) : (
                            <Icon name="user" size={18} className="logged-out-icon" />
                        )}
                    </div>

                    <div className="user-text">
                        <span className="user-name">
                            {isAuth ? user.name : "Inicia sesión"}
                        </span>

                        <span className="user-role">
                            {isAuth ? user.role : "Invitado"}
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
                        <button className='logout-button'>
                            <Icon name="logOut" size={24} />
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};