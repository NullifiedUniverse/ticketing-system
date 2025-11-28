import React from 'react';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';

const TicketCard = ({ ticket, onCheckIn, onShowQR, onEdit, onDelete }) => {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4 shadow-sm relative overflow-hidden"
        >
            {/* Status Stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${ticket.status === 'checked-in' ? 'bg-green-500' : 'bg-purple-500'}`}></div>

            <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                    <h3 className="font-bold text-white text-lg">{ticket.attendeeName}</h3>
                    <p className="text-gray-400 text-sm">{ticket.attendeeEmail}</p>
                </div>
                <StatusBadge status={ticket.status} />
            </div>

            <div className="pl-2 mb-4">
                 <p className="text-xs text-gray-500 font-mono uppercase tracking-wider">ID: {ticket.id}</p>
            </div>

            <div className="flex gap-2 pl-2 overflow-x-auto pb-1">
                <button 
                    onClick={() => onShowQR(ticket.id, ticket.attendeeName)}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold py-2 px-3 rounded-lg whitespace-nowrap"
                >
                    QR Code
                </button>
                
                {ticket.status !== 'checked-in' && (
                    <button 
                        onClick={() => onCheckIn(ticket)}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:opacity-90 text-white text-sm font-semibold py-2 px-3 rounded-lg whitespace-nowrap shadow-lg shadow-purple-500/20"
                    >
                        Check In
                    </button>
                )}

                <button 
                    onClick={() => onEdit(ticket)}
                    className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 text-sm font-semibold py-2 px-3 rounded-lg"
                >
                    Edit
                </button>
                
                <button 
                    onClick={() => onDelete(ticket)}
                    className="bg-red-600/20 text-red-400 hover:bg-red-600/30 text-sm font-semibold py-2 px-3 rounded-lg"
                >
                    Del
                </button>
            </div>
        </motion.div>
    );
};

export default TicketCard;
