import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import Modal from './Modal';
import { getTickets, sendTicketEmail, sendBatchEmails } from '../services/api';
import { useModal } from '../hooks/useModal';
import { useEvent } from '../context/EventContext';

const EmailDashboard = () => {
    const { eventId } = useEvent(); // Use global state
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    const [bgFilename, setBgFilename] = useState(null);
    const [config, setConfig] = useState({
        qrSize: 1150, qrX: 220, qrY: 1110,
        fontSize: 150, nameX: 400, nameY: 925,
        messageBefore: '',
        messageAfter: ''
    });

    const { modalContent, showModal, hideModal, showErrorModal, showConfirmModal } = useModal();

    const fetchTickets = useCallback(async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const data = await getTickets(eventId);
            setTickets(data);
        } catch (err) {
            console.error("Failed to fetch tickets", err);
            showErrorModal("Failed to load attendee list.");
        } finally {
            setLoading(false);
        }
    }, [eventId, showErrorModal]);

    useEffect(() => {
        if (eventId) {
            fetchTickets();
        } else {
            setTickets([]);
        }
    }, [eventId, fetchTickets]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const result = await import('../services/api').then(m => m.uploadBackground(file));
                setBgFilename(result.filename || result);
            } catch (err) {
                showErrorModal("Upload failed: " + err.message);
            }
        }
    };

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev, 
            [name]: ['messageBefore', 'messageAfter'].includes(name) ? value : (parseInt(value) || 0)
        }));
    };

    const handleSendOne = async (ticket) => {
        if (!ticket.attendeeEmail) return showErrorModal("This ticket has no email address.");
        
        setSending(true);
        try {
            await sendTicketEmail(eventId, ticket.id, bgFilename, config, config.messageBefore, config.messageAfter);
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
            `This will send QR codes to ALL ${tickets.length} attendees.`, 
            async () => {
                hideModal();
                setSending(true);
                try {
                    const res = await sendBatchEmails(eventId, bgFilename, config);
                    let msg = `Batch Complete!\nSuccess: ${res.result.success}\nFailed: ${res.result.failed}`;
                    if (res.result.errors && res.result.errors.length > 0) {
                        msg += `\n\nErrors:\n${res.result.errors.join('\n')}`;
                    }
                    alert(msg);
                } catch (err) {
                    showErrorModal(`Batch failed: ${err.message}`);
                } finally {
                    setSending(false);
                }
            }
        );
    };    

    const handlePreview = async (ticket) => {
        setLoading(true);
        try {
            const imageSrc = await import('../services/api').then(m => m.getEmailPreview(eventId, ticket.id, bgFilename, config));
            
            const msgBefore = config.messageBefore || `Here is your ticket for ${eventId}.`;
            const msgAfter = config.messageAfter || "Please present this QR code at the entrance.";

            const content = (
                <div className="p-0 bg-gray-50 text-gray-800 rounded-xl max-w-2xl mx-auto border shadow-lg max-h-[80vh] overflow-y-auto">
                    <div className="bg-white p-8 text-center">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">Hello {ticket.attendeeName},</h2>
                        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{msgBefore}</p>
                        <div className="mb-6">
                            <img 
                                src={imageSrc} 
                                alt={`Ticket Preview for ${ticket.attendeeName}`} 
                                loading="lazy"
                                className="w-full h-auto rounded shadow-lg border" 
                            />
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap">{msgAfter}</p>
                        <p className="text-xs text-gray-400 mt-8 pt-4 border-t">Ticket ID: {ticket.id}</p>
                    </div>
                </div>
            );
            
            showModal({ type: 'custom', title: 'Email Preview', body: content, contentComponent: () => content });
        } catch (err) {
            showErrorModal("Preview failed: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!eventId) {
        return (
            <Layout>
                <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
                    Select an event to manage emails.
                </div>
                <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="flex-1 flex flex-col h-full relative overflow-hidden">
                <div className="p-8 flex flex-col h-full max-w-7xl mx-auto w-full">
                
                    <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-4 border-b border-white/10 gap-4 shrink-0">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Email Dashboard</h1>
                            <p className="text-gray-400 mt-1">Manage communications for <span className="text-purple-400 font-mono">{eventId}</span></p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowSettings(!showSettings)}
                                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl shadow-lg transition-all border border-gray-600"
                            >
                                ⚙️ Settings
                            </button>
                            <button 
                                onClick={handleBatchSend}
                                disabled={sending || loading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {sending ? 'Sending...' : '🚀 Send Batch to All'}
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showSettings && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0, marginBottom: 0 }} 
                                animate={{ height: 'auto', opacity: 1, marginBottom: 32 }} 
                                exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                className="overflow-hidden relative z-50 shrink-0"
                            >
                                <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Background Image</label>
                                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                                        {bgFilename && <p className="text-xs text-green-400 mt-1">Active: {bgFilename}</p>}
                                    </div>
                                    
                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message Before Image</label>
                                        <textarea 
                                            name="messageBefore" 
                                            value={config.messageBefore} 
                                            onChange={handleConfigChange}
                                            placeholder="e.g. Here is your ticket..."
                                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none h-24 text-sm resize-none"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message After Image</label>
                                        <textarea 
                                            name="messageAfter" 
                                            value={config.messageAfter} 
                                            onChange={handleConfigChange}
                                            placeholder="e.g. Please present this at the gate..."
                                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none h-24 text-sm resize-none"
                                        />
                                    </div>

                                    {['qrSize', 'qrX', 'qrY', 'fontSize', 'nameX', 'nameY'].map(key => (
                                        <div key={key}>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{key}</label>
                                            <input 
                                                type="number" name={key} value={config[key]} onChange={handleConfigChange}
                                                className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 flex-1 flex flex-col min-h-0">
                        <div className="overflow-y-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-collapse relative">
                                <thead className="bg-gray-900/95 backdrop-blur text-gray-400 text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
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
                </div>
            </div>

            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </Layout>
    );
};

export default EmailDashboard;