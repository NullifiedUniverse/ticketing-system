import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Modal from './Modal';
import PageTransition from './PageTransition';
import { useEvent } from '../context/EventContext';
import { useModal } from '../hooks/useModal';
import { createEvent, deleteEvent, drawRaffleWinner } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

const Layout = ({ children }) => {
    const { eventId, selectEvent, triggerRefresh, fetchEvents } = useEvent();
    const { modalContent, hideModal, showErrorModal, showPromptModal, showConfirmModal, showModal } = useModal();
    const { t } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const handleNewEvent = () => {
        showPromptModal(t('modalPromptTitle'), 'Enter a unique ID for the new event (e.g., concert-2025).', async (newEventId) => {
            if (newEventId) {
                const formattedId = newEventId.trim().toLowerCase().replace(/\s+/g, '-');
                try {
                    await createEvent(formattedId);
                    selectEvent(formattedId);
                    triggerRefresh();
                } catch (err) {
                    showErrorModal(`Failed to create event: ${err.message}`);
                }
            }
            hideModal();
        });
    };

    const handleDeleteEvent = (targetEventId) => {
        showConfirmModal(
            t('modalDeleteEventTitle'), 
            t('modalDeleteEventBody', targetEventId),
            async () => {
                try {
                    await deleteEvent(targetEventId);
                    if (eventId === targetEventId) {
                        selectEvent(null);
                    }
                    fetchEvents(); // Force refresh
                    hideModal();
                } catch (error) {
                    showErrorModal("Failed to delete event: " + error.message);
                }
            }
        );
    };

    const handleRaffle = async () => {
        if (!eventId) return;
        try {
            const result = await drawRaffleWinner(eventId);
            showModal({
                type: 'alert',
                title: t('raffleWinnerTitle'),
                contentComponent: () => (
                    <div className="text-center">
                        <div className="text-6xl mb-4 animate-bounce">🏆</div>
                        <h3 className="text-2xl font-bold text-white mb-2">{result.winner.name}</h3>
                        <p className="text-gray-400">{result.winner.email}</p>
                        <div className="mt-6 text-xs text-gray-600 uppercase tracking-widest">
                            {t('poolSize')} {result.poolSize}
                        </div>
                    </div>
                )
            });
        } catch (error) {
            showErrorModal(error.message);
        }
    };

    return (
        <div className="flex h-screen bg-transparent text-slate-200 font-sans overflow-hidden">
            <Sidebar 
                currentEventId={eventId} 
                onSelectEvent={selectEvent} 
                onNewEvent={handleNewEvent} 
                onDeleteEvent={handleDeleteEvent}
                onRaffle={handleRaffle}
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            <div 
                className={`flex-1 flex flex-col min-w-0 relative transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] h-full ${isCollapsed ? 'xl:ml-24' : 'xl:ml-80'}`}
            >
                <PageTransition>
                    {children}
                </PageTransition>
            </div>
            
            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </div>
    );
};

export default Layout;