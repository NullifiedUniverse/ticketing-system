import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketRow from './TicketRow';
import TicketCard from './TicketCard';
import TicketListSkeleton from './TicketListSkeleton';
import { useLanguage } from '../context/LanguageContext';
import { exportToCSV, formatTicketsForCSV } from '../utils/exportUtils';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const TicketList = ({ filteredTickets, isLoading, searchTerm, setSearchTerm, onStatusChange, onShowQR, onEdit, onDelete, onImport }) => {
    const { t } = useLanguage();
    const [displayLimit, setDisplayLimit] = useState(50);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Reset pagination ONLY on search term change
    useEffect(() => {
        setDisplayLimit(50);
    }, [searchTerm]);

    const visibleTickets = filteredTickets.slice(0, displayLimit);
    const hasMore = displayLimit < filteredTickets.length;

    const observerTarget = React.useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
                    setIsLoadingMore(true);
                    // Artificial delay for smooth UX or just state update
                    setTimeout(() => {
                        setDisplayLimit(prev => prev + 50);
                        setIsLoadingMore(false);
                    }, 500);
                }
            },
            { threshold: 0.1 } // Trigger earlier
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [hasMore, isLoadingMore]);

    const handleExport = () => {
        const formattedData = formatTicketsForCSV(filteredTickets);
        exportToCSV(formattedData, 'tickets_export.csv');
    };

    return (
        <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="glass-panel p-6 rounded-3xl border border-white/5 bg-slate-900/40 backdrop-blur-xl"
        >
            {/* Search Bar */}
            <div className="relative mb-6 flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={t('searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full glass-input pl-10 pr-10"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 pl-3 flex items-center text-slate-500 hover:text-white transition-colors"
                            aria-label="Clear Search"
                        >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="flex gap-2">
                    <label className="glass-interactive px-3 py-2 md:px-4 md:py-3 text-white rounded-xl font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        {t('qaImport')}
                        <input type="file" accept=".csv" onChange={onImport} className="hidden" />
                    </label>
                    <button
                        onClick={handleExport}
                        className="glass-interactive px-3 py-2 md:px-4 md:py-3 text-white rounded-xl font-bold flex items-center gap-2 whitespace-nowrap"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {t('btnExportCsv')}
                    </button>
                </div>
            </div>

            {isLoading ? (
                <TicketListSkeleton />
            ) : (
                <>
                    {/* Desktop View (Table) */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse relative">                        <thead className="sticky top-0 bg-slate-950/70 backdrop-blur-xl z-10 border-b border-white/10 text-slate-400 text-sm uppercase tracking-wider shadow-sm">
                            <tr>
                                <th className="p-4 font-semibold rounded-tl-lg w-16">#</th>
                                <th className="p-4 font-semibold">{t('colStatus')}</th>
                                <th className="p-4 font-semibold">{t('colAttendee')}</th>
                                <th className="p-4 text-right font-semibold rounded-tr-lg">{t('colActions')}</th>
                            </tr>
                        </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                <AnimatePresence mode='popLayout'>
                                    {visibleTickets.map((ticket, i) => (
                                        <TicketRow
                                            key={ticket.id}
                                            index={i + 1}
                                            ticket={ticket}
                                            onStatusChange={onStatusChange}
                                            onShowQR={onShowQR}
                                            onEdit={onEdit}
                                            onDelete={onDelete}
                                        />
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden space-y-4">
                        <AnimatePresence mode='popLayout'>
                            {visibleTickets.map((ticket, i) => (
                                <TicketCard
                                    key={ticket.id}
                                    index={i + 1}
                                    ticket={ticket}
                                    onStatusChange={onStatusChange}
                                    onShowQR={onShowQR}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    <div ref={observerTarget} className="h-16 w-full flex justify-center items-center">
                        {isLoadingMore && (
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        )}
                    </div>

                    {!isLoading && filteredTickets.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-3">🔍</div>
                            <h3 className="text-lg font-medium text-white">{t('emptyTitle')}</h3>
                            <p className="text-gray-500">{t('emptyDesc')}</p>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    )
};

export default TicketList;
