import { lazy, Suspense } from 'react';
import { useSession } from '../../../context/SessionContext';
import Header from '../Header/Header';
import './Layout.css';

const CashSession = lazy(() => import('../../organisms/CashSession/CashSession'));

function InlineFallback({ children = 'Cargando...' }) {
    return <div className="inline-fallback" role="status">{children}</div>;
}

export default function Layout({ children }) {
    const { isModalOpen, sessionMode, handleSessionSubmit, expectedCash } = useSession();

    return (
        <div className='layout'>
            <Header/>
            {isModalOpen && (
                <Suspense fallback={<InlineFallback>Cargando sesión...</InlineFallback>}>
                    <CashSession
                        isOpen={isModalOpen}
                        mode={sessionMode}
                        onSessionSubmit={handleSessionSubmit}
                        expectedCash={expectedCash}
                    />
                </Suspense>
            )}
            <main className='main-content'>
                {children}
            </main>
        </div>
    );
}
