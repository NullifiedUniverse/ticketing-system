import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createTicket } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { buttonClick } from '../utils/animations';

const CreateTicket = ({ eventId, onTicketCreated, onApiError }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { t } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createTicket(eventId, name, email);
            onTicketCreated(result);
            setName('');
            setEmail('');
        } catch (err) {
            onApiError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            layout 
            className="glass-panel p-6 relative overflow-hidden group"
        >
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-gradient-to-tr from-violet-500/20 via-pink-500/20 to-blue-500/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-500"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-gradient-to-br from-violet-500/20 to-pink-500/20 rounded-xl text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">{t('createTitle')}</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('labelIdentity')}</label>
                        <motion.input
                            whileFocus={{ scale: 1.01, borderColor: '#ec4899' }}
                            type="text"
                            placeholder={t('placeholderIdentity')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all hover:border-gray-600"
                        />
                    </div>
                    
                    <div className="space-y-2">
                         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">{t('labelEmail')}</label>
                        <motion.input
                            whileFocus={{ scale: 1.01, borderColor: '#ec4899' }}
                            type="email"
                            placeholder={t('placeholderEmail')}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all hover:border-gray-600"
                        />
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        variants={buttonClick}
                        whileHover="hover"
                        whileTap="tap"
                        className="w-full mt-6 animated-gradient-bg hover:brightness-110 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>{t('btnCreate')}</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </>
                        )}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};

export default CreateTicket;