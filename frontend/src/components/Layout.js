import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Modal from './Modal';
import PageTransition from './PageTransition';
import { useEvent } from '../context/EventContext';
import { useModal } from '../hooks/useModal';
import { createEvent, deleteEvent } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { springTransition } from '../utils/animations';

const Layout = ({ children }) => {
    const { eventId, selectEvent, triggerRefresh, fetchEvents } = useEvent();
    const { modalContent, hideModal, showErrorModal, showPromptModal, showConfirmModal } = useModal();
    const { t } = useLanguage();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1280);

    // Responsive Check
    React.useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1280);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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

    return (
        <div className="flex h-screen bg-transparent text-slate-200 font-sans overflow-hidden">
            <Sidebar
                currentEventId={eventId}
                onSelectEvent={selectEvent}
                onNewEvent={handleNewEvent}
                onDeleteEvent={handleDeleteEvent}
                isCollapsed={isCollapsed}
                toggleCollapse={() => setIsCollapsed(!isCollapsed)}
            />

            <motion.div
                initial={false}
                animate={{ marginLeft: isDesktop ? (isCollapsed ? 96 : 320) : 0 }} // Responsive Margin
                transition={springTransition}
                className="flex-1 flex flex-col min-w-0 relative h-full will-change-transform"
            >
                <PageTransition>
                    {children}
                </PageTransition>
            </motion.div>

            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </div>
    );
};

export default Layout;