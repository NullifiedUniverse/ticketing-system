import React, { useState, useEffect, lazy, Suspense } from 'react';
import { EventProvider } from './context/EventContext';
import { LanguageProvider } from './context/LanguageContext';

const Dashboard = lazy(() => import('./components/Dashboard'));
const EmailDashboard = lazy(() => import('./components/EmailDashboard'));

const App = () => {
    const [route, setRoute] = useState(window.location.hash || '#dashboard');

    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash || '#dashboard');
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    return (
        <LanguageProvider>
            <EventProvider>
                <Suspense fallback={
                    <div className="flex h-screen w-full items-center justify-center bg-gray-950 text-white">
                        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                }>
                    {route === '#email' ? <EmailDashboard /> : <Dashboard />}
                </Suspense>
            </EventProvider>
        </LanguageProvider>
    );
};

export default App;