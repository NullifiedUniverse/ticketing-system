
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TicketRow from './TicketRow';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const TicketList = ({ filteredTickets, isLoading, searchTerm, setSearchTerm, onCheckIn, onShowQR }) => (
    <motion.div layout variants={itemVariants} className="bg-gray-900 border border-purple-500/20 p-6 rounded-2xl shadow-lg">
        <input
            type="text"
            placeholder="Search by name, email, or ticket ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 mb-4 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
        />
        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[600px]">
                <thead className="border-b border-gray-800">
                    <tr>
                        <th className="p-4">Status</th>
                        <th className="p-4">Attendee</th>
                        <th className="p-4">Ticket ID</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <AnimatePresence>
                        {filteredTickets.map((ticket) => (
                            <TicketRow key={ticket.id} ticket={ticket} onCheckIn={onCheckIn} onShowQR={onShowQR} />
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
        {!isLoading && filteredTickets.length === 0 && (
            <p className="text-center text-gray-500 py-8">No tickets found.</p>
        )}
    </motion.div>
);

export default TicketList;
