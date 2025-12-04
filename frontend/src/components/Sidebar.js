import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { deleteEvent } from '../services/api';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { buttonClick, containerStagger, fadeInUp, sidebarDrawer } from '../utils/animations';

const Sidebar = ({ onNewEvent }) => {
    const { events, loading, eventId: currentEventId, selectEvent, fetchEvents } = useEvent();
    const { t, cycleLanguage, language } = useLanguage();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleDelete = async (e, eventId) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete event "${eventId}"? This action cannot be undone.`)) {
            try {
                await deleteEvent(eventId);
                if (currentEventId === eventId) {
                    selectEvent(null);
                }
                // Force refresh via context
                fetchEvents();
            } catch (error) {
                alert("Failed to delete event: " + error.message);
            }
        }
    };

    const onSelectEvent = (id) => {
        selectEvent(id);
        setIsMobileOpen(false);
    };

    return (
        <>
             {/* Mobile Toggle */}
            <div className="xl:hidden fixed top-4 left-4 z-50">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label={isMobileOpen ? "Close Sidebar" : "Open Sidebar"}
                    className="bg-gray-900/80 backdrop-blur text-white p-2.5 rounded-xl border border-gray-700 shadow-lg"
                >
                    {isMobileOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                </motion.button>
            </div>

            {/* Sidebar Container - Desktop (Always visible) & Mobile (Drawer) */}
            {/* We handle mobile visibility via CSS transform for performance, but can use motion for the internal list */}
            <div 
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-950/90 backdrop-blur-xl border-r border-white/5 hover:border-white/10 transform transition-all duration-300 ease-out xl:translate-x-0 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
            >
                <div className="p-6 flex flex-col h-full relative overflow-hidden">
                    {/* Decorative Gradient Blob */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-purple-600/20 blur-3xl -z-10 pointer-events-none"></div>

                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="mb-8 mt-2 flex justify-between items-center"
                    >
                        <h1 className="text-2xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => window.location.hash = ''}>
                            <span className="w-8 h-8 bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-pink-500/20">🎫</span>
                            <span className="rainbow-text font-extrabold tracking-tight">{t('appTitle')}</span>
                        </h1>
                    </motion.div>
                    
                    {/* Language Toggle */}
                    <motion.button 
                        variants={buttonClick}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={cycleLanguage}
                        className="mb-6 w-full py-2 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center transition-all active:scale-95 hover:border-pink-500/30"
                    >
                        <span>Language</span>
                        <span className="text-white">{language === 'en' ? '🇺🇸 EN' : '🇹🇼 TW'}</span>
                    </motion.button>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                            {t('yourEvents')}
                        </h3>
                        
                        {loading && (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        <motion.div 
                            variants={containerStagger}
                            initial="hidden"
                            animate="visible"
                            className="space-y-1"
                        >
                            {events.map((event) => (
                                <motion.div 
                                    key={event.id}
                                    variants={fadeInUp}
                                    className="relative group flex items-center"
                                >
                                    <motion.button
                                        whileHover={{ x: 4, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => { onSelectEvent(event.id); setIsMobileOpen(false); }}
                                        className={`flex-grow text-left px-4 py-3.5 rounded-xl transition-colors duration-200 relative ${
                                            currentEventId === event.id 
                                            ? 'bg-white/10 text-white font-semibold shadow-lg ring-1 ring-white/10' 
                                            : 'text-gray-400 hover:text-white'
                                        }`}
                                    >
                                        {currentEventId === event.id && (
                                            <motion.div 
                                                layoutId="activeIndicator"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-500 via-purple-500 to-cyan-500 rounded-r-full"
                                            />
                                        )}
                                        <span className="truncate block pl-2 pr-8">
                                            {event.name || event.id}
                                        </span>
                                    </motion.button>

                                    {/* Delete Button */}
                                    <motion.button
                                        whileHover={{ scale: 1.1, color: '#ef4444' }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={(e) => handleDelete(e, event.id)}
                                        className="absolute right-2 z-20 p-2 text-gray-400 rounded-lg transition-colors"
                                        title="Delete Event"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </motion.button>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Quick Tools Section */}
                        {currentEventId && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: 0.2 }}
                                className="mt-8 mb-4 px-1"
                            >
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">
                                    {t('quickTools')}
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <motion.button 
                                        variants={buttonClick}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => alert("Raffle Winner feature coming soon to UI! (Backend ready)")}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-center transition-colors group"
                                    >
                                        <div className="text-xl mb-1 group-hover:scale-110 transition-transform">🎲</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{t('raffle')}</div>
                                    </motion.button>
                                    <motion.button 
                                        variants={buttonClick}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => window.location.hash = '#email'}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-center transition-colors group"
                                    >
                                        <div className="text-xl mb-1 group-hover:scale-110 transition-transform">✉️</div>
                                        <div className="text-[10px] text-gray-400 font-medium">{t('email')}</div>
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <motion.button
                            variants={buttonClick}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={onNewEvent}
                            className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 hover:from-gray-700 hover:to-gray-700 text-white py-3.5 px-4 rounded-xl transition-all border border-gray-700 hover:border-purple-500/50 shadow-lg hover:shadow-purple-500/20"
                        >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-xl font-light relative z-10 leading-none pb-1">+</span>
                            <span className="font-medium relative z-10">{t('createEvent')}</span>
                        </motion.button>
                    </div>

                    {/* Watermark */}
                    <div className="text-[10px] text-gray-700 text-center mt-6 pb-2 select-none opacity-50">
                        {t('sidebarFooter')}
                    </div>
                </div>
            </div>
            
            {/* Overlay for mobile */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default Sidebar;
