import React, { useState, useEffect, lazy, Suspense } from 'react';
import { EventProvider } from './context/EventContext';
import { LanguageProvider } from './context/LanguageContext';
import PageSkeleton from './components/PageSkeleton';
import Gatekeeper from './components/Gatekeeper';

const Dashboard = lazy(() => import('./components/Dashboard'));
const EmailDashboard = lazy(() => import('./components/EmailDashboard'));
const RaffleDisplay = lazy(() => import('./components/CelestialRaffle/RaffleDisplay'));
const RaffleControl = lazy(() => import('./components/CelestialRaffle/RaffleControl'));

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
                <Gatekeeper>
                    <Suspense fallback={<PageSkeleton />}>
                        {route === '#email' ? <EmailDashboard /> :
                            route === '#raffle-control' ? <RaffleControl /> :
                            route === '#raffle-display' ? <RaffleDisplay /> :
                            route === '#raffle' ? <RaffleDisplay /> :
                                <Dashboard />}
                    </Suspense>
                </Gatekeeper>
            </EventProvider>
        </LanguageProvider>
    );
};

export default App;