import React from 'react';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';

const TicketCard = ({ ticket, index, onStatusChange, onShowQR, onEdit, onDelete }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-panel p-5 mb-6 relative overflow-hidden border-l-0 rounded-3xl"
        >
            {/* Status Stripe with Glow */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${ticket.status === 'checked-in' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]' : 'bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]'}`}></div>

            <div className="flex justify-between items-start mb-3 pl-3">
                <div className="min-w-0 pr-2">
                    <h3 className="font-bold text-white text-lg tracking-tight selectable truncate">
                        <span className="text-slate-500 mr-2 text-sm">#{index}</span>
                        {ticket.attendeeName}
                    </h3>
                    <p className="text-slate-400 text-sm selectable truncate">{ticket.attendeeEmail}</p>
                </div>
                <div className="shrink-0">
                    <StatusBadge status={ticket.status} />
                </div>
            </div>

            <div className="flex flex-wrap gap-3 pl-3 pb-1 mt-4">

                <button
                    onClick={() => onShowQR(ticket.id, ticket.attendeeName)}
                    className="flex-1 btn-neutral py-2.5 px-4 text-sm whitespace-nowrap min-w-[100px]"
                    aria-label="View QR Code"
                >
                    QR Code
                </button>

                {ticket.status !== 'checked-in' ? (
                    <button
                        onClick={() => onStatusChange(ticket, 'check-in')}
                        className="flex-1 btn-success py-2.5 px-4 text-sm whitespace-nowrap min-w-[100px]"
                        aria-label="Check In"
                    >
                        Check In
                    </button>
                ) : (
                    <button
                        onClick={() => onStatusChange(ticket, 'check-out')}
                        className="flex-1 py-2.5 px-4 text-sm whitespace-nowrap bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-xl font-bold transition-colors min-w-[100px]"
                        aria-label="Check Out"
                    >
                        Check Out
                    </button>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={() => onEdit(ticket)}
                        className="btn-neutral w-10 flex items-center justify-center text-sky-400 hover:text-sky-300"
                        aria-label="Edit Ticket"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>

                    <button
                        onClick={() => onDelete(ticket)}
                        className="btn-neutral w-10 flex items-center justify-center text-rose-400 hover:text-rose-300"
                        aria-label="Delete Ticket"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default TicketCard;
