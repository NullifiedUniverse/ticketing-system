
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketRow from './TicketRow';
import TicketCard from './TicketCard';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const TicketList = ({ filteredTickets, isLoading, searchTerm, setSearchTerm, onCheckIn, onShowQR, onEdit, onDelete }) => (
    <motion.div 
        layout 
        variants={itemVariants} 
        initial="hidden"
        animate="visible"
        className="glass-panel p-6 rounded-2xl"
    >
        {/* Search Bar */}
        <div className="relative mb-6 flex gap-4">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    placeholder="Search attendees..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-950/50 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
            </div>
            
            <button 
                onClick={() => {
                    const headers = ["ID,Name,Email,Status,LastActionTime,LastActionBy"];
                    const rows = filteredTickets.map(t => {
                        const lastAction = t.checkInHistory && t.checkInHistory.length > 0 ? t.checkInHistory[t.checkInHistory.length - 1] : null;
                        return [
                            t.id, 
                            `"${t.attendeeName}"`, 
                            t.attendeeEmail, 
                            t.status, 
                            lastAction ? new Date(lastAction.timestamp._seconds * 1000 || lastAction.timestamp).toLocaleString() : '',
                            lastAction ? lastAction.scannedBy : ''
                        ].join(',');
                    });
                    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "tickets_export.csv");
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }}
                className="px-4 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg border border-gray-700 whitespace-nowrap"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export CSV
            </button>
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse relative">
                <thead className="sticky top-0 bg-gray-950/95 backdrop-blur-xl z-10 border-b border-gray-700/50 text-gray-400 text-sm uppercase tracking-wider shadow-sm">
                    <tr>
                        <th className="p-4 font-semibold rounded-tl-lg">Status</th>
                        <th className="p-4 font-semibold">Attendee</th>
                        <th className="p-4 font-semibold">Ticket ID</th>
                        <th className="p-4 text-right font-semibold rounded-tr-lg">Actions</th>
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
                <h3 className="text-lg font-medium text-white">No tickets found</h3>
                <p className="text-gray-500">Try adjusting your search terms.</p>
            </div>
        )}
    </motion.div>
);

export default TicketList;
