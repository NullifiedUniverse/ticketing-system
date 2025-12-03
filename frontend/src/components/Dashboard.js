import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from './Layout';
import DashboardStats from './DashboardStats';
import AnalyticsChart from './AnalyticsChart';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
import LiveIndicator from './LiveIndicator';
import Modal from './Modal';
import { getScannerToken, getNgrokUrl, createEvent } from '../services/api';
import { useTickets } from '../hooks/useTickets';
import { useModal } from '../hooks/useModal';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { parseCSV } from '../utils/csvParser';

const Dashboard = () => {
    const { modalContent, showModal, hideModal, showErrorModal, showConfirmModal, showPromptModal, showQrCodeModal } = useModal();
    const { eventId } = useEvent(); // Get global eventId
    const { t } = useLanguage();
    
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
    
    const generateSetupQR = async () => {
        if (!eventId) {
            showErrorModal("Please select an event first.");
            return;
        }
        try {
            const scannerToken = await getScannerToken();
            const { url: publicUrl, localUrl } = await getNgrokUrl();
            
            let selectedUrl = publicUrl;
            let modeMessage = "";

            if (localUrl && publicUrl && localUrl !== publicUrl) {
                // Ask user preference
                const useLocal = window.confirm(
                    `🚀 Optimize Speed?\n\nUse Local Network IP (${localUrl})?\n\n✅ YES: Fast (Phone must be on same Wi-Fi)\n❌ NO: Slower (Public Internet / 4G)`
                );
                if (useLocal) {
                    selectedUrl = localUrl;
                    modeMessage = " [LOCAL MODE - FAST]";
                } else {
                    modeMessage = " [PUBLIC MODE]";
                }
            } else if (!publicUrl && localUrl) {
                selectedUrl = localUrl;
                modeMessage = " [LOCAL ONLY]";
            }

            if (!selectedUrl) {
                 throw new Error("Could not retrieve backend URL.");
            }

            const message = `Event: ${eventId}${modeMessage}. Scan to configure.`;
            const config = { eventId, apiBaseUrl: selectedUrl, token: scannerToken };
            
            showQrCodeModal(t('qaScanner'), message, JSON.stringify(config));
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

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            try {
                const attendees = parseCSV(text);

                if (attendees.length === 0) throw new Error("No valid attendees found in CSV.");

                showConfirmModal(
                    t('qaImport'), 
                    t('importPrompt', attendees.length), 
                    async () => {
                        try {
                            const res = await import('../services/api').then(m => m.importAttendees(eventId, attendees));
                            alert(res.message);
                            // window.location.reload(); // Or refresh tickets
                        } catch (err) {
                            showErrorModal(`Import failed: ${err.message}`);
                        } finally {
                            hideModal();
                        }
                    }
                );

            } catch (err) {
                showErrorModal(`Failed to parse CSV: ${err.message}`);
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset input
    };

    return (
        <Layout>
            {/* Sticky Header */}
            <header className="bg-gray-950/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/10 px-4 md:px-8 py-4 flex justify-between items-center shrink-0">
                {/* Spacer for mobile hamburger which is fixed in Sidebar/Layout */}
                <div className="w-8 xl:hidden"></div> 

                <div className="flex items-center gap-4 overflow-hidden">
                        <h2 className="text-lg md:text-xl font-semibold text-white truncate">
                        {eventId ? (
                            <>
                                <span className="text-gray-500 mr-2 hidden sm:inline">{t('headerEvent')}</span>
                                {eventId}
                            </>
                        ) : (
                            <span className="text-gray-500">{t('headerSelect')}</span>
                        )}
                    </h2>
                    <LiveIndicator status={connectionStatus} error={connectionError} />
                </div>

                {eventId && (
                    <div className="flex items-center gap-3">
                            <button 
                            onClick={async () => {
                                try {
                                    const { url } = await getNgrokUrl();
                                    if(url) {
                                        await navigator.clipboard.writeText(`${url}/scanner`);
                                        alert(t('alertLinkCopied'));
                                    } else {
                                        alert(t('errorBackendURL'));
                                    }
                                } catch(e) { console.error(e); }
                            }}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border border-gray-700"
                            title={t('copyScannerLink')}
                            >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            </button>

                            <button 
                            onClick={generateSetupQR}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                            >
                            <span className="text-lg">📱</span>
                            <span className="hidden sm:inline">{t('qaScanner')}</span>
                            </button>
                    </div>
                )}
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                {!eventId ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500">
                        <div className="text-6xl mb-4 opacity-50">🎟️</div>
                        <h3 className="text-xl font-medium text-white mb-2">{t('limboTitle')}</h3>
                        <p className="text-center px-4">{t('limboDesc')}</p>
                    </div>
                ) : (
                    <div className="max-w-7xl mx-auto space-y-8 pb-20">
                        
                        {/* Stats Grid */}
                        <section>
                            <DashboardStats stats={stats} />
                        </section>

                            {/* Analytics Chart */}
                        <section>
                            <AnalyticsChart tickets={tickets} />
                        </section>

                        {/* Management Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            
                            {/* Creation Form & Quick Settings */}
                            <div className="xl:col-span-1 space-y-8">
                                <CreateTicket eventId={eventId} onTicketCreated={handleTicketCreatedAndShowQR} onApiError={showErrorModal} />
                                
                                {/* Quick Actions / Settings Card */}
                                <div className="glass-panel p-6 rounded-2xl border border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <span>⚙️</span> {t('qaTitle')}
                                    </h3>
                                    <div className="space-y-3">
                                        <button 
                                            onClick={() => window.location.hash = '#email'}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors group"
                                        >
                                            <span className="text-gray-300 font-medium group-hover:text-white">{t('qaEmail')}</span>
                                            <span className="text-gray-500 group-hover:text-white">→</span>
                                        </button>
                                        
                                        <button 
                                            onClick={generateSetupQR}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors group"
                                        >
                                            <span className="text-gray-300 font-medium group-hover:text-white">{t('qaScanner')}</span>
                                            <span className="text-xl">📱</span>
                                        </button>
                                        
                                        <label className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-left transition-colors group cursor-pointer">
                                            <span className="text-gray-300 font-medium group-hover:text-white">{t('qaImport')}</span>
                                            <span className="text-xl">📂</span>
                                            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                                        </label>

                                        <button 
                                            onClick={() => {
                                                    // Alert user to use Sidebar
                                                    alert(t('alertDelete'));
                                            }}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-left transition-colors group"
                                        >
                                            <span className="text-red-400 font-medium group-hover:text-red-300">{t('qaNuke')}</span>
                                            <span className="text-red-400 group-hover:text-red-300">🗑️</span>
                                        </button>
                                    </div>
                                </div>
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
            
            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </Layout>
    )
}

export default Dashboard;
