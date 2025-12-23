import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import CreateTicket from './CreateTicket';
import TicketList from './TicketList';
import LiveIndicator from './LiveIndicator';
import Modal from './Modal';
import BentoCard from './BentoCard';
import Skeleton from './Skeleton';
import ScannerMonitor from './ScannerMonitor';
import { getScannerToken, getNgrokUrl, getAlerts } from '../services/api';
import { useTickets } from '../hooks/useTickets';
import { useModal } from '../hooks/useModal';
import { useDashboardPreferences } from '../hooks/useDashboardPreferences';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { parseCSV } from '../utils/csvParser';
import { bentoBounce, buttonClick, containerStagger, fadeInUp } from '../utils/animations';

const DashboardStats = lazy(() => import('./DashboardStats'));
const AnalyticsChart = lazy(() => import('./AnalyticsChart'));

const Dashboard = () => {
    const { modalContent, showModal, hideModal, showErrorModal, showConfirmModal, showQrCodeModal } = useModal();
    const { eventId } = useEvent(); 
    const { t } = useLanguage();
    
    // Preferences Hook
    const { 
        layout, 
        setLayout, 
        searchHistory, 
        addToSearchHistory, 
        trackAction 
    } = useDashboardPreferences();

    // Alert Polling State
    const [lastAlertTime, setLastAlertTime] = useState(Date.now());
    const [connType, setConnType] = useState('Checking...');

    // Poll for Scanner Alerts
    useEffect(() => {
        if (!eventId) return;

        const pollAlerts = async () => {
            try {
                // Determine Dashboard Conn Type (One-time or periodic)
                if (connType === 'Checking...') {
                    const info = await getNgrokUrl();
                    const isNgrok = window.location.hostname.includes('ngrok') || (info.url && info.url.includes('ngrok'));
                    setConnType(isNgrok ? 'CLOUD (NGROK)' : 'LOCAL (LAN)');
                }

                const alerts = await getAlerts(eventId, lastAlertTime);
                if (alerts && alerts.length > 0) {
                    const latest = alerts[alerts.length - 1];
                    setLastAlertTime(latest.timestamp);
                    
                    showModal({
                        type: 'alert',
                        title: '⚠️ Scanner Reported Issue',
                        body: `A volunteer reported an issue at ${new Date(latest.timestamp).toLocaleTimeString()}. Please check the gate.`, 
                        onConfirm: hideModal
                    });
                }
            } catch (e) {
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
    
    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [showSearchHistory, setShowSearchHistory] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Debounce Search Term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            if (searchTerm.trim().length > 2) {
                addToSearchHistory(searchTerm);
            }
        }, 150);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, addToSearchHistory]);

    // const topAction = getTopAction(); // Unused

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
        trackAction('scanner');
        if (!eventId) {
            showErrorModal(t('errorNoEventSelected'));
            return;
        }
        try {
            const scannerToken = await getScannerToken();
            // Expect localUrls array from backend
            const { url: publicUrl, localUrls } = await getNgrokUrl();
            
            // Build Candidates List (Unique, Non-empty)
            const candidates = [publicUrl, ...(localUrls || [])].filter((u, i, self) => u && self.indexOf(u) === i);
            
            if (candidates.length === 0) {
                 throw new Error(t('errorBackendURL'));
            }

            // Primary is Public if available, else first Local
            const primaryUrl = publicUrl || candidates[0];
            const message = `${t('headerEvent')} ${eventId}. ${t('scannerConfigPrompt')}`;
            
            // Payload
            const config = { 
                eventId, 
                apiBaseUrl: primaryUrl, // Backward compatibility
                candidates: candidates, // Smart Connect list
                token: scannerToken 
            };
            
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
        trackAction('import');
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
            <header className="sticky top-6 z-30 mx-6 rounded-2xl glass-panel px-8 py-5 flex justify-between items-center mb-8">
                <div className="w-8 xl:hidden"></div>

                <div className="flex items-center gap-4 overflow-hidden">
                        <h2 className="text-xl font-bold text-white truncate flex items-center gap-3">
                        {eventId ? (
                            <>
                                <span className="text-slate-400 text-xs hidden sm:inline uppercase tracking-widest font-bold">{t('headerEvent')}</span>
                                <span className="text-white text-xl">{eventId}</span>
                            </>
                        ) : (
                            <span className="text-slate-500 italic">{t('headerSelect')}</span>
                        )}
                    </h2>
                    <LiveIndicator status={connectionStatus} error={connectionError} isSyncing={isSyncing} />
                    
                    {/* Connection Type Indicator */}
                    <div className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full border ${connType.includes('LAN') ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'} text-[10px] font-black tracking-widest`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${connType.includes('LAN') ? 'bg-blue-400' : 'bg-purple-400'}`}></div>
                        {connType}
                    </div>
                </div>

                {eventId && (
                    <div className="flex items-center gap-3">
                            {/* Search with History Dropdown */}
                            <div className="relative group hidden md:block">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </div>
                                <input
                                    type="text"
                                    placeholder={t('searchPlaceholder') || "Search..."}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onFocus={() => setShowSearchHistory(true)}
                                    onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                                    className="glass-input pl-9 pr-4 py-2 w-48 focus:w-64 transition-all text-sm rounded-lg"
                                />
                                <AnimatePresence>
                                    {showSearchHistory && searchHistory.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50"
                                        >
                                            <div className="p-2">
                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-2">Recent</div>
                                                {searchHistory.map((term, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSearchTerm(term)}
                                                        className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded transition-colors flex items-center gap-2"
                                                    >
                                                        <span className="text-slate-500">↺</span> {term}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <motion.button 
                                variants={buttonClick}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => setIsEditing(!isEditing)}
                                className={`glass-interactive px-4 py-2 text-sm font-medium transition-colors rounded-lg flex items-center gap-2 ${isEditing ? 'bg-slate-700 text-white' : 'text-slate-300 hover:text-white'}`}
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
                                className="glass-interactive px-4 py-2 text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 shadow-sm"
                                title={t('copyScannerLink')}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                            </motion.button>

                            <motion.button 
                                variants={buttonClick}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={generateSetupQR}
                                className="animated-gradient-bg px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                            >
                                <span className="text-lg">📱</span>
                                <span className="hidden sm:inline">{t('qaScanner')}</span>
                            </motion.button>
                    </div>
                )}
            </header>

            <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
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
                            <AnimatePresence>
                                {isEditing && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        animate={{ height: "auto", opacity: 1, marginBottom: 32 }}
                                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <BentoCard title="Customize Layout" icon="🎨" className="bg-slate-800/80">
                                            <div className="flex flex-wrap gap-6 p-2">
                                                {['stats', 'chart', 'scanners'].map(key => (
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

                            <AnimatePresence>
                                {layout.stats && (
                                    <motion.section 
                                        key="stats"
                                        variants={fadeInUp} 
                                        initial="hidden" 
                                        animate="visible" 
                                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    >
                                        <Suspense fallback={<Skeleton height="120px" className="rounded-3xl" />}>
                                            <DashboardStats stats={stats} />
                                        </Suspense>
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {layout.chart && (
                                    <motion.section 
                                        key="chart"
                                        variants={fadeInUp} 
                                        initial="hidden" 
                                        animate="visible" 
                                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                                    >
                                        <Suspense fallback={<Skeleton height="300px" className="rounded-3xl" />}>
                                            <AnalyticsChart tickets={tickets} />
                                        </Suspense>
                                    </motion.section>
                                )}
                            </AnimatePresence>

                            <motion.div variants={fadeInUp} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                
                                <div className="xl:col-span-1 space-y-8">
                                    <AnimatePresence>
                                        {layout.scanners && (
                                            <motion.div
                                                key="scanner-monitor"
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                            >
                                                <ScannerMonitor eventId={eventId} />
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <CreateTicket eventId={eventId} onTicketCreated={handleTicketCreatedAndShowQR} onApiError={showErrorModal} />
                                </div>

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
                                        onImport={handleImportCSV}
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
