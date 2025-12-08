import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import Layout from './Layout';
import DashboardStats from './DashboardStats';
import AnalyticsChart from './AnalyticsChart';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
import LiveIndicator from './LiveIndicator';
import Modal from './Modal';
import { getScannerToken, getNgrokUrl } from '../services/api';
import { useTickets } from '../hooks/useTickets';
import { useModal } from '../hooks/useModal';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { parseCSV } from '../utils/csvParser';
import { buttonClick, containerStagger, fadeInUp } from '../utils/animations';

const Dashboard = () => {
    const { modalContent, showModal, hideModal, showErrorModal, showConfirmModal, showPromptModal, showQrCodeModal } = useModal();
    const { eventId } = useEvent(); 
    const { t } = useLanguage();
    
    const {
        tickets,
        isLoading,
        isSyncing,
        connectionStatus,
        connectionError,
        handleTicketCreated,
        handleManualCheckIn,
        handleUpdateTicket,
        handleDeleteTicket,
        stats
    } = useTickets(eventId, showErrorModal);
    
    const [searchTerm, setSearchTerm] = useState('');

    // ... (Handlers remain mostly the same, just purely logic) ...
    // I will omit repeating the exact logic functions for brevity in this tool call unless logic changes. 
    // Re-implementing essential handlers to ensure file integrity.

    const handleTicketCreatedAndShowQR = (result) => {
        handleTicketCreated(result);
        showQrCodeModal(t('modalQrCodeTitle'), `${t('modalQrCodeBodyPrefix')} ${result.ticket.attendeeName}`, result.ticket.id);
    }

    const handleEdit = (ticket) => {
        showModal({
            type: 'edit-ticket',
            title: t('modalEditTicketTitle'),
            body: t('modalEditTicketBody', ticket.attendeeName),
            ticket,
            onConfirm: async (updatedTicket) => {
                await handleUpdateTicket(updatedTicket);
                hideModal();
            },
        });
    };

    const handleDelete = (ticket) => {
        showConfirmModal(t('modalDeleteTicketTitle'), t('modalDeleteTicketBody', ticket.attendeeName), async () => {
            await handleDeleteTicket(ticket);
            hideModal();
        });
    };
    
    const handleCheckIn = (ticket) => {
        showConfirmModal(t('modalCheckInTitle'), t('modalCheckInBody', ticket.attendeeName), async () => {
            await handleManualCheckIn(ticket);
            hideModal();
        });
    };
    
    const generateSetupQR = async () => {
        if (!eventId) {
            showErrorModal(t('errorNoEventSelected'));
            return;
        }
        try {
            const scannerToken = await getScannerToken();
            const { url: publicUrl, localUrl } = await getNgrokUrl();
            
            let selectedUrl = publicUrl;
            let modeMessage = "";

            if (localUrl && publicUrl && localUrl !== publicUrl) {
                const useLocal = window.confirm(
                    `🚀 ${t('scannerSpeedOpt')}\n\n${t('scannerLocalQ', localUrl)}\n\n✅ ${t('scannerLocalYes')}\n❌ ${t('scannerLocalNo')}`
                );
                if (useLocal) {
                    selectedUrl = localUrl;
                    modeMessage = ` [${t('scannerLocalMode')}]`;
                } else {
                    modeMessage = ` [${t('scannerPublicMode')}]`;
                }
            } else if (!publicUrl && localUrl) {
                selectedUrl = localUrl;
                modeMessage = ` [${t('scannerLocalOnly')}]`;
            }

            if (!selectedUrl) {
                 throw new Error(t('errorBackendURL'));
            }

            const message = `${t('headerEvent')} ${eventId}${modeMessage}. ${t('scannerConfigPrompt')}`;
            const config = { eventId, apiBaseUrl: selectedUrl, token: scannerToken };
            
            showQrCodeModal(t('qaScanner'), message, JSON.stringify(config));
        } catch (error) {
            console.error(error);
            showErrorModal(`${t('setupFailed')}: ${error.message}.`);
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
                if (attendees.length === 0) throw new Error(t('errorNoValidAttendees'));
                showConfirmModal(
                    t('qaImport'), 
                    t('importPrompt', attendees.length), 
                    async () => {
                        try {
                            const res = await import('../services/api').then(m => m.importAttendees(eventId, attendees));
                            alert(res.message);
                        } catch (err) {
                            showErrorModal(`${t('importFailed')}: ${err.message}`);
                        } finally {
                            hideModal();
                        }
                    }
                );
            } catch (err) {
                showErrorModal(`${t('errorCsvParse')}: ${err.message}`);
            }
        };
        reader.readAsText(file);
        e.target.value = null;
    };

    // --- RENDER ---
    return (
        <Layout>
            {/* Header with Frosted Blur and Sticky */}
            <header className="sticky top-0 z-30 border-b border-white/5 bg-slate-900/50 backdrop-blur-xl px-6 py-4 flex justify-between items-center shadow-md">
                <div className="w-8 xl:hidden"></div> {/* Spacer */}

                <div className="flex items-center gap-4 overflow-hidden">
                        <h2 className="text-xl font-semibold text-white truncate flex items-center gap-2">
                        {eventId ? (
                            <>
                                <span className="text-slate-400 text-xs hidden sm:inline uppercase tracking-widest font-bold">{t('headerEvent')}</span>
                                <span className="rainbow-text text-2xl">{eventId}</span>
                            </>
                        ) : (
                            <span className="text-slate-500 italic">{t('headerSelect')}</span>
                        )}
                    </h2>
                    <LiveIndicator status={connectionStatus} error={connectionError} isSyncing={isSyncing} />
                </div>

                {eventId && (
                    <div className="flex items-center gap-3">
                            <motion.button 
                                variants={buttonClick}
                                whileHover="hover"
                                whileTap="tap"
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
                                className="glass-interactive px-4 py-2 text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 shadow-lg"
                                title={t('copyScannerLink')}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            </motion.button>

                            <motion.button 
                                variants={buttonClick}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={generateSetupQR}
                                className="animated-gradient-bg px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                            >
                                <span className="text-lg">📱</span>
                                <span className="hidden sm:inline">{t('qaScanner')}</span>
                            </motion.button>
                    </div>
                )}
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
                {/* Ambient Background Glow */}
                <div className="fixed inset-0 pointer-events-none ambient-glow -z-10"></div>

                {!eventId ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <div className="text-8xl mb-6 opacity-20 animate-pulse grayscale">🎟️</div>
                        <h3 className="text-3xl font-bold text-white mb-3">{t('limboTitle')}</h3>
                        <p className="text-center px-4 max-w-md text-lg opacity-70">{t('limboDesc')}</p>
                    </div>
                ) : (
                    <motion.div 
                        variants={containerStagger}
                        initial="hidden"
                        animate="visible"
                        className="max-w-7xl mx-auto space-y-10 pb-24"
                    >
                        {/* Stats */}
                        <motion.section variants={fadeInUp}>
                            <DashboardStats stats={stats} />
                        </motion.section>

                        {/* Chart */}
                        <motion.section variants={fadeInUp}>
                            <AnalyticsChart tickets={tickets} />
                        </motion.section>

                        {/* Grid: Create Ticket + Quick Actions + List */}
                        <motion.div variants={fadeInUp} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                            
                            {/* Left Column: Actions */}
                            <div className="xl:col-span-1 space-y-8">
                                <CreateTicket eventId={eventId} onTicketCreated={handleTicketCreatedAndShowQR} onApiError={showErrorModal} />
                                
                                {/* Quick Actions Card */}
                                <motion.div variants={fadeInUp} className="glass-panel p-6">
                                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3 border-b border-white/5 pb-4">
                                        <span className="text-2xl">⚡</span> {t('qaTitle')}
                                    </h3>
                                    <div className="space-y-4">
                                        <motion.button 
                                            variants={buttonClick}
                                            whileHover="hover"
                                            whileTap="tap"
                                            onClick={() => window.location.hash = '#email'}
                                            className="glass-interactive w-full flex items-center justify-between p-4 rounded-xl text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl group-hover:scale-110 transition-transform">📨</span>
                                                <span className="text-slate-200 font-medium group-hover:text-white">{t('qaEmail')}</span>
                                            </div>
                                            <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
                                        </motion.button>
                                        
                                        <motion.button 
                                            variants={buttonClick}
                                            whileHover="hover"
                                            whileTap="tap"
                                            onClick={generateSetupQR}
                                            className="glass-interactive w-full flex items-center justify-between p-4 rounded-xl text-left group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl group-hover:scale-110 transition-transform">📱</span>
                                                <span className="text-slate-200 font-medium group-hover:text-white">{t('qaScanner')}</span>
                                            </div>
                                            <span className="text-slate-500 group-hover:text-white transition-colors">→</span>
                                        </motion.button>
                                        
                                        <motion.label 
                                            variants={buttonClick}
                                            whileHover="hover"
                                            whileTap="tap"
                                            className="glass-interactive w-full flex items-center justify-between p-4 rounded-xl text-left group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl group-hover:scale-110 transition-transform">📂</span>
                                                <span className="text-slate-200 font-medium group-hover:text-white">{t('qaImport')}</span>
                                            </div>
                                            <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
                                        </motion.label>

                                        <motion.button 
                                            variants={buttonClick}
                                            whileHover="hover"
                                            whileTap="tap"
                                            onClick={() => {
                                                    alert(t('alertDelete'));
                                            }}
                                            className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/5 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 text-left transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl group-hover:rotate-12 transition-transform">☢️</span>
                                                <span className="text-red-400 font-medium group-hover:text-red-300">{t('qaNuke')}</span>
                                            </div>
                                        </motion.button>
                                    </div>
                                </motion.div>
                            </div>

                            {/* Right Column: List */}
                            <div className="xl:col-span-2">
                                    <TicketList
                                    key={eventId}
                                    filteredTickets={filteredTickets}
                                    isLoading={isLoading}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    onCheckIn={handleCheckIn}
                                    onShowQR={(ticketId, attendeeName) => showQrCodeModal(t('modalQrCodeTitle'), `${t('modalQrCodeBodyPrefix')} ${attendeeName}`, ticketId)}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            </div>
                        </motion.div>

                    </motion.div>
                )}
            </main>
            
            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </Layout>
    )
}

export default Dashboard;
