import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import EmailDashboard from './components/EmailDashboard';
import { EventProvider } from './context/EventContext';
import { LanguageProvider } from './context/LanguageContext';

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
                <div>
                    {route === '#email' ? <EmailDashboard /> : <Dashboard />}
                </div>
            </EventProvider>
        </LanguageProvider>
    );
};

export default App;