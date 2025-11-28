import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import DashboardStats from './DashboardStats';
import AnalyticsDashboard from './AnalyticsDashboard';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
import LiveIndicator from './LiveIndicator';
import Modal from './Modal';
import { getScannerToken, getNgrokUrl, createEvent } from '../services/api';
import { useTickets } from '../hooks/useTickets';
import { useModal } from '../hooks/useModal';

const Dashboard = () => {
    const { modalContent, showModal, hideModal, showErrorModal, showConfirmModal, showPromptModal, showQrCodeModal } = useModal();
    const [eventId, setEventId] = useState(null);
    
    const {
        tickets,
        isLoading,
        connectionStatus,
        connectionError,
        handleTicketCreated,
        handleManualCheckIn,
        handleUpdateTicket,
        handleDeleteTicket,
        stats
    } = useTickets(eventId, showErrorModal);
    
    const [searchTerm, setSearchTerm] = useState('');

    // Load last event from local storage on mount
    useEffect(() => {
        const lastEvent = localStorage.getItem('lastEventId');
        if (lastEvent) setEventId(lastEvent);
    }, []);

    const handleEventChange = (newEventId) => {
        setEventId(newEventId);
        localStorage.setItem('lastEventId', newEventId);
    };

    const handleTicketCreatedAndShowQR = (result) => {
        handleTicketCreated(result);
        showQrCodeModal('Ticket QR Code', `QR Code for ${result.ticket.attendeeName}`, result.ticket.id);
    }

    const handleEdit = (ticket) => {
        showModal({
            type: 'edit-ticket',
            title: 'Edit Ticket',
            body: `Editing ticket for ${ticket.attendeeName}`,
            ticket,
            onConfirm: async (updatedTicket) => {
                await handleUpdateTicket(updatedTicket);
                hideModal();
            },
        });
    };

    const handleDelete = (ticket) => {
        showConfirmModal('Delete Ticket', `Are you sure you want to delete the ticket for ${ticket.attendeeName}?`, async () => {
            await handleDeleteTicket(ticket);
            hideModal();
        });
    };
    
    const handleCheckIn = (ticket) => {
        showConfirmModal('Manual Check-In', `Are you sure you want to check in ${ticket.attendeeName}?`, async () => {
            await handleManualCheckIn(ticket);
            hideModal();
        });
    };

    const handleNewEvent = () => {
        showPromptModal('Create New Event', 'Enter a unique ID for the new event (e.g., concert-2025).', async (newEventId) => {
            if (newEventId) {
                const formattedId = newEventId.trim().toLowerCase().replace(/\s+/g, '-');
                try {
                    await createEvent(formattedId);
                    handleEventChange(formattedId);
                } catch (err) {
                    showErrorModal(`Failed to create event: ${err.message}`);
                }
            }
            hideModal();
        });
    };
    
    const generateSetupQR = async () => {
        if (!eventId) {
            showErrorModal("Please select an event first.");
            return;
        }
        try {
            const scannerToken = await getScannerToken();
            const { url: apiBaseUrl, type } = await getNgrokUrl();
            
            if (!apiBaseUrl) {
                 throw new Error("Could not retrieve backend URL.");
            }

            let message = `Event: ${eventId}. Volunteers scan this to configure their device.`;
            if (type === 'local') {
                message += ' WARNING: Using Local Network IP. Scanner must be on same Wi-Fi.';
            }

            const config = { eventId, apiBaseUrl, token: scannerToken };
            showQrCodeModal('Scanner Setup Code', message, JSON.stringify(config));
        } catch (error) {
            console.error(error);
            showErrorModal(`Setup Failed: ${error.message}.`);
        }
    };

    const filteredTickets = useMemo(() =>
        tickets.filter(
            (ticket) =>
                (ticket.attendeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (ticket.attendeeEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
        ), [tickets, searchTerm]);

    return (
        <div className="flex h-screen bg-black text-gray-100 font-sans overflow-hidden">
            
            {/* 1. Sidebar (Responsive Drawer) */}
            <Sidebar 
                currentEventId={eventId} 
                onSelectEvent={handleEventChange} 
                onNewEvent={handleNewEvent} 
            />

            {/* 2. Main Content Area */}
            {/* Changed lg:ml-72 to xl:ml-72 to keep sidebar collapsed on smaller landscape screens/tablets */}
            <div className="flex-1 flex flex-col min-w-0 relative xl:ml-72 transition-all duration-300">
                
                {/* Sticky Header */}
                <header className="bg-gray-950/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/10 px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
                    {/* Spacer for mobile hamburger which is fixed */}
                    <div className="w-8 xl:hidden"></div> 

                    <div className="flex items-center gap-4 overflow-hidden">
                         <h2 className="text-lg md:text-xl font-semibold text-white truncate">
                            {eventId ? (
                                <>
                                    <span className="text-gray-500 mr-2 hidden sm:inline">Event:</span>
                                    {eventId}
                                </>
                            ) : (
                                <span className="text-gray-500">Select Event</span>
                            )}
                        </h2>
                        <LiveIndicator status={connectionStatus} error={connectionError} />
                    </div>

                    {eventId && (
                        <div className="flex items-center gap-3">
                             <button 
                                onClick={generateSetupQR}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                             >
                                <span className="text-lg">📱</span>
                                <span className="hidden sm:inline">Scanner Setup</span>
                             </button>
                        </div>
                    )}
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    {!eventId ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <div className="text-6xl mb-4 opacity-50">🎟️</div>
                            <h3 className="text-xl font-medium text-white mb-2">No Event Selected</h3>
                            <p className="text-center px-4">Select an event from the sidebar or create a new one to get started.</p>
                        </div>
                    ) : (
                        <div className="max-w-7xl mx-auto space-y-8 pb-20">
                            
                            {/* Stats Grid */}
                            <section>
                                <DashboardStats stats={stats} />
                            </section>

                             {/* Analytics */}
                             <AnimatePresence>
                                {tickets.length > 0 && (
                                    <section>
                                        <AnalyticsDashboard tickets={tickets} />
                                    </section>
                                )}
                            </AnimatePresence>

                            {/* Management Grid */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                
                                {/* Creation Form - Sticky on Desktop? No, just stacked */}
                                <div className="xl:col-span-1">
                                    <CreateTicket eventId={eventId} onTicketCreated={handleTicketCreatedAndShowQR} onApiError={showErrorModal} />
                                </div>

                                {/* List - Takes more space */}
                                <div className="xl:col-span-2">
                                     <TicketList
                                        filteredTickets={filteredTickets}
                                        isLoading={isLoading}
                                        searchTerm={searchTerm}
                                        setSearchTerm={setSearchTerm}
                                        onCheckIn={handleCheckIn}
                                        onShowQR={(ticketId, attendeeName) => showQrCodeModal('Ticket QR Code', `QR Code for ${attendeeName}`, ticketId)}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            </div>

                        </div>
                    )}
                </main>
            </div>
            
            {/* Global Modal */}
            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </div>
    )
}

export default Dashboard;
