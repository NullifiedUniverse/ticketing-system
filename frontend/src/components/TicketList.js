
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketRow from './TicketRow';
import TicketCard from './TicketCard';
import TicketListSkeleton from './TicketListSkeleton';
import { useLanguage } from '../context/LanguageContext';
import { exportToCSV, formatTicketsForCSV } from '../utils/exportUtils';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const TicketList = ({ filteredTickets, isLoading, searchTerm, setSearchTerm, onCheckIn, onShowQR, onEdit, onDelete }) => {
    const { t } = useLanguage();

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
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors"
                        aria-label="Clear Search"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
            
            <button 
                onClick={handleExport}
                className="glass-interactive px-4 py-3 text-white rounded-xl font-bold flex items-center gap-2 whitespace-nowrap"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {t('btnExportCsv')}
            </button>
        </div>

        {isLoading ? (
            <TicketListSkeleton />
        ) : (
            <>
                        {/* Desktop View (Table) */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left border-collapse relative">                        <thead className="sticky top-0 bg-gray-950/95 backdrop-blur-xl z-10 border-b border-gray-700/50 text-gray-400 text-sm uppercase tracking-wider shadow-sm">
                            <tr>
                                <th className="p-4 font-semibold rounded-tl-lg">{t('colStatus')}</th>
                                <th className="p-4 font-semibold">{t('colAttendee')}</th>
                                <th className="p-4 font-semibold">{t('colTicketId')}</th>
                                <th className="p-4 text-right font-semibold rounded-tr-lg">{t('colActions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            <AnimatePresence mode='popLayout'>
                                {filteredTickets.map((ticket) => (
                                    <TicketRow 
                                        key={ticket.id} 
                                        ticket={ticket} 
                                        onCheckIn={onCheckIn} 
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
                        {filteredTickets.map((ticket) => (
                            <TicketCard
                                key={ticket.id}
                                ticket={ticket}
                                onCheckIn={onCheckIn}
                                onShowQR={onShowQR}
                                onEdit={onEdit}
                                onDelete={onDelete}
                            />
                        ))}
                    </AnimatePresence>
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
)};

export default TicketList;
