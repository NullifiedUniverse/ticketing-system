import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import DashboardStats from './DashboardStats';
import AnalyticsChart from './AnalyticsChart';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
import LiveIndicator from './LiveIndicator';
import Modal from './Modal';
import BentoCard from './BentoCard';
import { getScannerToken, getNgrokUrl, getAlerts } from '../services/api';
import { useTickets } from '../hooks/useTickets';
import { useModal } from '../hooks/useModal';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { parseCSV } from '../utils/csvParser';
import { bentoBounce, buttonClick, containerStagger, fadeInUp } from '../utils/animations';

const Dashboard = () => {
    const { modalContent, showModal, hideModal, showErrorModal, showConfirmModal, showPromptModal, showQrCodeModal } = useModal();
    const { eventId } = useEvent(); 
    const { t } = useLanguage();
    
    // Alert Polling State
    const [lastAlertTime, setLastAlertTime] = useState(Date.now());

    // Poll for Scanner Alerts
    useEffect(() => {
        if (!eventId) return;

        const pollAlerts = async () => {
            try {
                const alerts = await getAlerts(eventId, lastAlertTime);
                if (alerts && alerts.length > 0) {
                    const latest = alerts[alerts.length - 1];
                    setLastAlertTime(latest.timestamp);
                    
                    // Trigger Notification
                    // We play a sound if possible or just show the modal
                    showModal({
                        type: 'alert',
                        title: '⚠️ Scanner Reported Issue',
                        body: `A volunteer reported an issue at ${new Date(latest.timestamp).toLocaleTimeString()}. Please check the gate.`, 
                        onConfirm: hideModal
                    });
                }
            } catch (e) {
                // Silent fail on poll error
                console.warn("Alert poll failed", e);
            }
        };

        const interval = setInterval(pollAlerts, 5000);
        return () => clearInterval(interval);
    }, [eventId, lastAlertTime, showModal, hideModal]);
    
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
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    
    // Layout Customization State
    const [layout, setLayout] = useState({ stats: true, chart: true, actions: true });
    const [isEditing, setIsEditing] = useState(false);

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);

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
                (ticket.attendeeName?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
                (ticket.attendeeEmail?.toLowerCase() || '').includes(debouncedSearchTerm.toLowerCase()) ||
                ticket.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ), [tickets, debouncedSearchTerm]);

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
            <header className="sticky top-4 z-30 mx-4 sm:mx-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-3xl px-6 py-4 flex justify-between items-center shadow-2xl mb-4">
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
                                onClick={() => setIsEditing(!isEditing)}
                                className={`glass-interactive px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isEditing ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white'}`}
                                title="Customize Dashboard"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                            </motion.button>

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

                <AnimatePresence mode="wait">
                    {!eventId ? (
                        <motion.div 
                            key="limbo"
                            className="h-full flex flex-col items-center justify-center p-4"
                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)", transition: { duration: 0.3 } }}
                        >
                            <motion.div 
                                variants={bentoBounce}
                                initial="hidden"
                                animate="visible"
                                whileHover="hover"
                                className="glass-panel p-12 rounded-[2.5rem] max-w-lg w-full text-center border border-white/10 relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-violet-500/10 via-transparent to-pink-500/10 pointer-events-none"></div>
                                <div className="text-8xl mb-6 opacity-30 animate-pulse grayscale filter blur-sm">🎟️</div>
                                <h3 className="text-3xl font-black text-white mb-3 tracking-tight">{t('limboTitle')}</h3>
                                <p className="text-lg text-slate-400 leading-relaxed">{t('limboDesc')}</p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="dashboard"
                            variants={containerStagger}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
                            className="max-w-7xl mx-auto space-y-10 pb-24"
                        >
                            {/* Customization Panel */}
                            <AnimatePresence>
                                {isEditing && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        animate={{ height: "auto", opacity: 1, marginBottom: 32 }}
                                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <BentoCard title="Customize Layout" icon="🎨" className="bg-slate-800/80">
                                            <div className="flex gap-6 p-2">
                                                {['stats', 'chart', 'actions'].map(key => (
                                                    <label key={key} className="flex items-center gap-3 cursor-pointer">
                                                        <div className="relative">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={layout[key]} 
                                                                onChange={() => setLayout({...layout, [key]: !layout[key]})}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-10 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-white capitalize">{key}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </BentoCard>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Stats */}
                            <AnimatePresence>
                                {layout.stats && (
                                    <motion.section 
                                        key="stats"
                                        variants={fadeInUp} 
                                        initial="hidden" 
                                        animate="visible" 
                                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    >
                                        <DashboardStats stats={stats} />
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            {/* Chart */}
                            <AnimatePresence>
                                {layout.chart && (
                                    <motion.section 
                                        key="chart"
                                        variants={fadeInUp} 
                                        initial="hidden" 
                                        animate="visible" 
                                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    >
                                        <AnalyticsChart tickets={tickets} />
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            {/* Grid: Create Ticket + Quick Actions + List */}
                            <motion.div variants={fadeInUp} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                
                                {/* Left Column: Actions */}
                                <div className="xl:col-span-1 space-y-8">
                                    <CreateTicket eventId={eventId} onTicketCreated={handleTicketCreatedAndShowQR} onApiError={showErrorModal} />
                                    
                                    <AnimatePresence>
                                        {layout.actions && (
                                            <motion.div
                                                key="actions"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                            >
                                                {/* Quick Actions Card */}
                                                <BentoCard 
                                                    title={t('qaTitle')} 
                                                    icon="⚡"
                                                    isCollapsible 
                                                    className="p-0"
                                                >
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
                                                </BentoCard>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
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
                </AnimatePresence>
            </main>
            
            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </Layout>
    )
}

export default Dashboard;