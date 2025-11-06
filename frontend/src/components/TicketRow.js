
import React from 'react';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';

const animatedGradientStyle = { '--gradient-start': '#ec4899', '--gradient-end': '#8b5cf6' };

const TicketRow = ({ ticket, onCheckIn, onShowQR }) => (
    <motion.tr
        layout
        key={ticket.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
    >
        <td className="p-4"><StatusBadge status={ticket.status} /></td>
        <td className="p-4 font-medium text-white">
            {ticket.attendeeName}<br />
            <span className="text-gray-400 text-sm">{ticket.attendeeEmail}</span>
        </td>
        <td className="p-4 text-gray-500 text-sm font-mono">{ticket.id}</td>
        <td className="p-4 text-right space-x-2">
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onShowQR(ticket.id, ticket.attendeeName)}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-1 px-3 rounded-lg text-sm"
            >
                QR
            </motion.button>
            {ticket.status !== 'checked-in' && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onCheckIn(ticket)}
                    style={animatedGradientStyle}
                    className="animated-gradient-bg text-white font-bold py-1 px-3 rounded-lg text-sm"
                >
                    Check In
                </motion.button>
            )}
        </td>
    </motion.tr>
);

export default TicketRow;
