import React from 'react';
import Sidebar from './Sidebar';
import Modal from './Modal';
import { useEvent } from '../context/EventContext';
import { useModal } from '../hooks/useModal';
import { createEvent } from '../services/api';

const Layout = ({ children }) => {
    const { eventId, selectEvent, triggerRefresh } = useEvent();
    const { modalContent, hideModal, showErrorModal, showPromptModal } = useModal();
    
    const handleNewEvent = () => {
        showPromptModal('Create New Event', 'Enter a unique ID for the new event (e.g., concert-2025).', async (newEventId) => {
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

    return (
        <div className="flex h-screen bg-black text-gray-100 font-sans overflow-hidden">
            <Sidebar 
                currentEventId={eventId} 
                onSelectEvent={selectEvent} 
                onNewEvent={handleNewEvent} 
                refreshTrigger={0} 
            />

            <div className="flex-1 flex flex-col min-w-0 relative xl:ml-72 transition-all duration-300 h-full">
                {children}
            </div>
            
            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </div>
    );
};

export default Layout;