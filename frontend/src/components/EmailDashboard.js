import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from './Layout';
import Modal from './Modal';
import { getTickets, sendTicketEmail, sendBatchEmails } from '../services/api';
import { useModal } from '../hooks/useModal';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { buttonClick, containerStagger, fadeInUp, EASING } from '../utils/animations';

const EmailDashboard = () => {
    const { eventId } = useEvent(); // Use global state
    const { t } = useLanguage();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    
    const [bgFilename, setBgFilename] = useState(null);
    const [config, setConfig] = useState({
        qrSize: 1150, qrX: 220, qrY: 1110,
        fontSize: 150, nameX: 400, nameY: 925,
        messageBefore: '',
        messageAfter: '',
        emailSubject: '',
        senderName: ''
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
            showErrorModal(`${t('errorCsvEmpty')}: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [eventId, showErrorModal, t]);

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
                showErrorModal(`${t('errorUploadFailed')}: ${err.message}`);
            }
        }
    };

    const handleConfigChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev, 
            [name]: ['messageBefore', 'messageAfter', 'emailSubject', 'senderName'].includes(name) ? value : (parseInt(value) || 0)
        }));
    };

    const handleSendOne = async (ticket) => {
        if (!ticket.attendeeEmail) return showErrorModal("This ticket has no email address.");

        setSending(true);
        try {
            await sendTicketEmail(eventId, ticket.id, bgFilename, config, config.messageBefore, config.messageAfter, config.emailSubject, config.senderName);
            alert(t('emailSent', ticket.attendeeEmail));
        } catch (err) {
            showErrorModal(`${t('importFailed')}: ${err.message}`);
        } finally {
            setSending(false);
        }
    };

    const handleBatchSend = async () => {
        showConfirmModal(
            t('modalSendBatchTitle'), 
            t('modalSendBatchBody', tickets.length), 
            async () => {
                hideModal();
                setSending(true);
                try {
                    const res = await sendBatchEmails(eventId, bgFilename, config, config.messageBefore, config.messageAfter, config.emailSubject, config.senderName);
                    let msg = `Batch Complete!\nSuccess: ${res.result.success}\nFailed: ${res.result.failed}`;
                    if (res.result.errors && res.result.errors.length > 0) {
                        msg += `\n\nErrors:\n${res.result.errors.join('\n')}`;
                    }
                    alert(msg);
                } catch (err) {
                    showErrorModal(`${t('importFailed')}: ${err.message}`);
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
            
            const msgBefore = config.messageBefore || t('emailDefaultMsgBefore', eventId);
            const msgAfter = config.messageAfter || t('emailDefaultMsgAfter');

            const content = (
                <div className="p-0 bg-gray-50 text-gray-800 rounded-xl max-w-2xl mx-auto border shadow-lg max-h-[80vh] overflow-y-auto">
                    <div className="bg-white p-8 text-center">
                        <h2 className="text-xl font-bold mb-4 text-gray-900"></h2> 
                        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{msgBefore}</p>
                        <div className="mb-6">
                            <img 
                                src={imageSrc} 
                                alt={`Ticket Preview for ${ticket.attendeeName}`}
                                loading="lazy"
                                className="w-full h-auto rounded shadow-lg border" 
                            />
                        </div>
                        <p className="text-gray-600 mb-6 whitespace-pre-wrap">{msgAfter}</p>
                        <p className="text-xs text-gray-400 mt-8 pt-4 border-t">Ticket ID: {ticket.id}</p>
                    </div>
                </div>
            );
            
            showModal({ type: 'custom', title: t('btnSimulate'), body: content, contentComponent: () => content });
        } catch (err) {
            showErrorModal(`Preview failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!eventId) {
        return (
            <Layout>
                <div className="flex-1 flex items-center justify-center text-gray-500 h-full">
                    {t('errorNoEventSelected')}
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
                            <h1 className="text-3xl font-bold text-white">{t('emailTitle')}</h1>
                            <p className="text-gray-400 mt-1">{t('emailManageCommunications')} <span className="text-purple-400 font-mono">{eventId}</span></p>
                        </div>
                        <div className="flex gap-3">
                            <motion.button 
                                variants={buttonClick}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => setShowSettings(!showSettings)}
                                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl shadow-lg transition-colors border border-gray-600"
                            >
                                ⚙️ {t('btnSettings')}
                            </motion.button>
                            <motion.button 
                                variants={buttonClick}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={handleBatchSend}
                                disabled={sending || loading}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {sending ? 'Sending...' : `🚀 ${t('btnBatch')}`}
                            </motion.button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showSettings && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0, marginBottom: 0 }} 
                                animate={{ height: 'auto', opacity: 1, marginBottom: 32, transition: { ease: EASING.gentle, duration: 0.4 } }} 
                                exit={{ height: 0, opacity: 0, marginBottom: 0, transition: { ease: EASING.gentle, duration: 0.3 } }}
                                className="overflow-hidden relative z-50 shrink-0"
                            >
                                <div className="glass-panel p-6 rounded-2xl border border-white/10 bg-white/5 grid grid-cols-1 md:grid-cols-2 lg:col-span-4 gap-6">
                                    <div className="col-span-1 md:col-span-2 lg:col-span-4">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('labelBg')}</label>
                                        <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"/>
                                        {bgFilename && <p className="text-xs text-green-400 mt-1">Active: {bgFilename}</p>}
                                    </div>
                                    
                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('labelSubject')}</label>
                                        <input 
                                            type="text"
                                            name="emailSubject" 
                                            value={config.emailSubject} 
                                            onChange={handleConfigChange}
                                            placeholder={t('emailSubjectPlaceholder')}
                                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('labelSender')}</label>
                                        <input 
                                            type="text"
                                            name="senderName" 
                                            value={config.senderName} 
                                            onChange={handleConfigChange}
                                            placeholder={t('emailSenderPlaceholder')}
                                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none text-sm"
                                        />
                                    </div>

                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('labelPreamble')}</label>
                                        <textarea 
                                            name="messageBefore" 
                                            value={config.messageBefore} 
                                            onChange={handleConfigChange}
                                            placeholder={t('emailPreamblePlaceholder')}
                                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 outline-none h-24 text-sm resize-none"
                                        />
                                    </div>
                                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('labelFinePrint')}</label>
                                        <textarea 
                                            name="messageAfter" 
                                            value={config.messageAfter} 
                                            onChange={handleConfigChange}
                                            placeholder={t('emailFinePrintPlaceholder')}
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
                                        <th className="p-4">{t('colAttendee')}</th>
                                        <th className="p-4">{t('colEmail')}</th>
                                        <th className="p-4">{t('colStatus')}</th>
                                        <th className="p-4 text-right">{t('colActions')}</th>
                                    </tr>
                                </thead>
                                <motion.tbody 
                                    variants={containerStagger}
                                    initial="hidden"
                                    animate="visible"
                                    className="divide-y divide-white/5"
                                >
                                    {tickets.map(ticket => (
                                        <motion.tr 
                                            key={ticket.id} 
                                            variants={fadeInUp}
                                            layout
                                            className="hover:bg-white/5 transition-colors"
                                        >
                                            <td className="p-4 font-medium">{ticket.attendeeName}</td>
                                            <td className="p-4 text-gray-400">{ticket.attendeeEmail}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${ticket.status === 'checked-in' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {ticket.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <motion.button 
                                                    variants={buttonClick}
                                                    whileHover="hover"
                                                    whileTap="tap"
                                                    onClick={() => handlePreview(ticket)}
                                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold border border-white/10 transition-colors"
                                                >
                                                    {t('btnSimulate')}
                                                </motion.button>
                                                <motion.button 
                                                    variants={buttonClick}
                                                    whileHover="hover"
                                                    whileTap="tap"
                                                    onClick={() => handleSendOne(ticket)}
                                                    disabled={sending}
                                                    className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition-colors"
                                                >
                                                    {t('btnHarass')}
                                                </motion.button>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </motion.tbody>
                            </table>
                            
                            {tickets.length === 0 && !loading && (
                                <div className="p-12 text-center text-gray-500">{t('emptyEmail')}</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={!!modalContent} onClose={hideModal} content={modalContent || {}} />
        </Layout>
    );
};
