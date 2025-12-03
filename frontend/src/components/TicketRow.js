
import React from 'react';
import { motion } from 'framer-motion';
import StatusBadge from './StatusBadge';
import { useLanguage } from '../context/LanguageContext';
import { buttonClick, fadeInUp } from '../utils/animations'; // Use standard fadeInUp instead of local variant if possible, but parent controls stagger.

const TicketRow = ({ ticket, onCheckIn, onShowQR, onEdit, onDelete }) => {
    const { t } = useLanguage();

    return (
    <motion.tr
        layout
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="border-b border-gray-800 hover:bg-gray-800 transition-colors"
    >
        <td className="p-4"><StatusBadge status={ticket.status} /></td>
        <td className="p-4 font-medium text-white">
            {ticket.attendeeName}<br />
            <span className="text-gray-400 text-sm">{ticket.attendeeEmail}</span>
        </td>
        <td className="p-4 text-gray-500 text-sm font-mono">{ticket.id}</td>
        <td className="p-4 text-right">
            <div className="flex items-center justify-end gap-2">
                <motion.button
                    variants={buttonClick}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => onShowQR(ticket.id, ticket.attendeeName)}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg transition-colors"
                    title={t('btnMark')}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </motion.button>
                
                {ticket.status !== 'checked-in' && (
                    <motion.button
                        variants={buttonClick}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => onCheckIn(ticket)}
                        className="px-3 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-1"
                        title={t('btnCapture')}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        {t('btnCapture').toUpperCase()}
                    </motion.button>
                )}

                <motion.button
                    variants={buttonClick}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => onEdit(ticket)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-blue-400 hover:text-blue-300 rounded-lg transition-colors border border-gray-700"
                    title={t('btnRetcon')}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </motion.button>

                <motion.button
                    variants={buttonClick}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => onDelete(ticket)}
                    className="p-2 bg-gray-800 hover:bg-gray-700 text-red-400 hover:text-red-300 rounded-lg transition-colors border border-gray-700"
                    title={t('btnPurge')}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </motion.button>
            </div>
        </td>
    </motion.tr>
)};

export default TicketRow;
