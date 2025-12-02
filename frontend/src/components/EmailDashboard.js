import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Modal from './Modal';
import { getTickets, sendTicketEmail, sendBatchEmails } from '../services/api';
import { useModal } from '../hooks/useModal';

const EmailDashboard = () => {
    const [eventId, setEventId] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const { modalContent, showModal, hideModal, showErrorModal, showConfirmModal } = useModal();

    // Load event from local storage on mount
    useEffect(() => {
        const lastEvent = localStorage.getItem('lastEventId');
        if (lastEvent) setEventId(lastEvent);
    }, []);

    useEffect(() => {
        if (eventId) fetchTickets();
    }, [eventId]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const data = await getTickets(eventId);
            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            showErrorModal("Failed to load tickets.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOne = async (ticket) => {
        if (!ticket.attendeeEmail) return showErrorModal("This ticket has no email address.");
        
        setSending(true);
        try {
            await sendTicketEmail(eventId, ticket.id);
            alert(`Email sent to ${ticket.attendeeEmail}!`);
        } catch (err) {
            showErrorModal(`Failed to send: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleBatchSend = async () => {
        showConfirmModal(
            "Send Batch Emails?", 
            `This will send QR codes to ALL ${tickets.length} attendees with valid emails. This action cannot be undone.`, 
            async () => {
                hideModal();
                setSending(true);
                try {
                    const res = await sendBatchEmails(eventId);
                    alert(`Batch Complete!\nSuccess: ${res.result.success}\nFailed: ${res.result.failed}`);
                } catch (err) {
                    showErrorModal(`Batch failed: ${err.message}`);
                } finally {
                    setSending(false);
                }
            }
        );
    };

    const handlePreview = (ticket) => {
        const content = (
            <div className="p-6 bg-white text-gray-800 rounded-xl max-w-md mx-auto border shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Example Ticket Email</h2>
                <div className="border-b pb-4 mb-4">
                    <p><strong>To:</strong> {ticket.attendeeEmail}</p>
                    <p><strong>Subject:</strong> Your Ticket for {eventId}</p>
                </div>
                <div className="text-center space-y-4">
                    <p>Hello <strong>{ticket.attendeeName}</strong>,</p>
                    <p>Here is your ticket for <strong>{eventId}</strong>.</p>
                    <div className="w-48 h-48 bg-gray-200 mx-auto flex items-center justify-center rounded-lg border-2 border-dashed border-gray-400">
                        <span className="text-gray-500 italic text-sm">(QR Code Image)</span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">{ticket.id}</p>
                    <p className="text-sm text-gray-600">Please present this code at the entrance.</p>
                </div>
            </div>
        );
        
        showModal({
            type: 'custom',
            title: 'Email Preview',
            body: content, // This modal impl might need adjustment if it expects string
            contentComponent: () => content // Passing component directly if supported
        });
    };

    // --- UI ---
    
    if (!eventId) {
        return (
            <div className="flex h-screen bg-black text-gray-100 font-sans">
                <Sidebar currentEventId={eventId} onSelectEvent={setEventId} />
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    Select an event to manage emails.
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black text-gray-100 font-sans overflow-hidden">
            <Sidebar currentEventId={eventId} onSelectEvent={setEventId} />
            
            <div className="flex-1 flex flex-col relative xl:ml-72 transition-all duration-300 overflow-y-auto custom-scrollbar p-8">
                
                {/* Header */}
                <div className="flex justify-between items-end mb-8 pb-4 border-b border-white/10">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Email Dashboard</h1>
                        <p className="text-gray-400 mt-1">Manage communications for <span className="text-purple-400 font-mono">{eventId}</span></p>
                    </div>
                    <button 
                        onClick={handleBatchSend}
                        disabled={sending || loading}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {sending ? 'Sending...' : '🚀 Send Batch to All'}
                    </button>
                </div>

                {/* List */}
                <div className="glass-panel rounded-2xl overflow-hidden border border-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4">Attendee</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tickets.map(ticket => (
                                <tr key={ticket.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-medium">{ticket.attendeeName}</td>
                                    <td className="p-4 text-gray-400">{ticket.attendeeEmail}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'checked-in' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        <button 
                                            onClick={() => handlePreview(ticket)}
                                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold border border-white/10 transition-colors"
                                        >
                                            Preview
                                        </button>
                                        <button 
                                            onClick={() => handleSendOne(ticket)}
                                            disabled={sending}
                                            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            Send Email
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    {tickets.length === 0 && !loading && (
                        <div className="p-12 text-center text-gray-500">No attendees found for this event.</div>
                    )}
                </div>
            </div>

            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </div>
    );
};

export default EmailDashboard;
