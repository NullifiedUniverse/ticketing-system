import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeCanvas } from 'qrcode.react';
import { useLanguage } from '../context/LanguageContext';

const animatedGradientStyle = { '--gradient-start': '#ec4899', '--gradient-end': '#8b5cf6' };

const Modal = ({ isOpen, onClose, content }) => {
    const { t } = useLanguage();
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-sm flex justify-center items-center z-50 p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-gray-900 rounded-2xl shadow-2xl shadow-purple-500/10 w-full max-w-md border border-purple-500/20"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-purple-500/20 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white tracking-wider">{content?.title || t('modalDefaultTitle')}</h3>
                            <motion.button
                                whileHover={{ scale: 1.1, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                aria-label="Close Modal"
                                className="text-gray-400 hover:text-white text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                            >
                                &times;
                            </motion.button>
                        </div>
                        <div className="p-6 text-center">
                            {content.contentComponent ? content.contentComponent() : (
                                <p className="text-gray-300 mb-6">{content.body}</p>
                            )}
                            {(content.type === 'qr-code' || content.type === 'setup-qr') && (
                                <div className="flex justify-center bg-white p-4 rounded-lg">
                                    <QRCodeCanvas value={content.qrValue} size={256} level={"H"} />
                                </div>
                            )}
                            {content.type === 'alert' && (
                                <div className="flex justify-center gap-4 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        style={animatedGradientStyle}
                                        className="animated-gradient-bg text-white font-bold py-2 px-4 rounded-lg"
                                    >
                                        {t('btnOk')}
                                    </motion.button>
                                </div>
                            )}
                            {content.type === 'confirm' && (
                                <div className="flex justify-center gap-4 mt-4">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                                    >
                                        {t('btnCancel')}
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { content.onConfirm(); onClose(); }}
                                        style={animatedGradientStyle}
                                        className="animated-gradient-bg text-white font-bold py-2 px-4 rounded-lg"
                                    >
                                        {t('btnConfirm')}
                                    </motion.button>
                                </div>
                            )}
                            {content.type === 'prompt' && (
                                <div className="flex flex-col items-center gap-4 mt-4">
                                    <input
                                        type="text"
                                        id="prompt-input"
                                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                    />
                                    <div className="flex justify-center gap-4 mt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onClose}
                                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                                        >
                                            {t('btnCancel')}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const input = document.getElementById('prompt-input');
                                                content.onConfirm(input.value);
                                                onClose();
                                            }}
                                            style={animatedGradientStyle}
                                            className="animated-gradient-bg text-white font-bold py-2 px-4 rounded-lg"
                                        >
                                            {t('btnConfirm')}
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                            {content.type === 'edit-ticket' && (
                                <div className="flex flex-col items-center gap-4 mt-4">
                                    <input
                                        type="text"
                                        id="edit-name-input"
                                        defaultValue={content.ticket.attendeeName}
                                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                    />
                                    <input
                                        type="email"
                                        id="edit-email-input"
                                        defaultValue={content.ticket.attendeeEmail}
                                        className="w-full bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                                    />
                                    <div className="flex justify-center gap-4 mt-4">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={onClose}
                                            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg"
                                        >
                                            {t('btnCancel')}
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => {
                                                const nameInput = document.getElementById('edit-name-input');
                                                const emailInput = document.getElementById('edit-email-input');
                                                content.onConfirm({
                                                    ...content.ticket,
                                                    attendeeName: nameInput.value,
                                                    attendeeEmail: emailInput.value,
                                                });
                                                onClose();
                                            }}
                                            style={animatedGradientStyle}
                                            className="animated-gradient-bg text-white font-bold py-2 px-4 rounded-lg"
                                        >
                                            {t('btnSave')}
                                        </motion.button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default Modal;