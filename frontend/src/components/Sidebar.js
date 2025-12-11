import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { buttonClick, containerStagger, fadeInUp } from '../utils/animations';

const Sidebar = ({ onNewEvent, onDeleteEvent, onRaffle }) => {
    const { events, loading, eventId: currentEventId, selectEvent } = useEvent();
    const { t, cycleLanguage, language } = useLanguage();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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

            {/* Sidebar Container - Desktop (Floating Dock) & Mobile (Drawer) */}
            {/* We handle mobile visibility via CSS transform for performance, but can use motion for the internal list */}
            <div 
                className={`fixed z-50 w-72 bg-gradient-to-b from-slate-900/80 to-slate-950/80 backdrop-blur-2xl border border-white/10 shadow-2xl transform transition-all duration-300 ease-out xl:translate-x-0 xl:top-4 xl:left-4 xl:bottom-4 xl:rounded-[2.5rem] inset-y-0 left-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 flex flex-col h-full relative overflow-hidden">
                    {/* Decorative Gradient Blob */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-violet-600/10 blur-3xl -z-10 pointer-events-none"></div>

                    <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className="mb-8 mt-2 flex justify-between items-center"
                    >
                        <h1 className="text-2xl font-bold flex items-center gap-2 cursor-pointer" onClick={() => window.location.hash = ''}>
                            <span className="w-8 h-8 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-lg flex items-center justify-center text-lg shadow-lg shadow-violet-500/20">🎫</span>
                            <span className="rainbow-text font-extrabold tracking-tight">{t('appTitle')}</span>
                        </h1>
                    </motion.div>
                    
                    {/* Language Toggle */}
                    <motion.button 
                        variants={buttonClick}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={cycleLanguage}
                        className="mb-6 w-full py-2 px-3 glass-interactive rounded-lg text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center group"
                    >
                        <span>Language</span>
                        <span className="text-white group-hover:text-violet-300 transition-colors">{language === 'en' ? '🇺🇸 EN' : '🇹🇼 TW'}</span>
                    </motion.button>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">
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
                            {events.map((event) => {
                                const isActive = currentEventId === event.id;
                                return (
                                    <motion.div 
                                        key={event.id}
                                        variants={fadeInUp}
                                        className="relative group flex items-center"
                                    >
                                        <button
                                            onClick={() => { onSelectEvent(event.id); setIsMobileOpen(false); }}
                                            className={`relative w-full text-left px-4 py-3.5 rounded-xl transition-all duration-300 ${
                                                isActive ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeEventBackground"
                                                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border border-white/10 rounded-xl shadow-lg backdrop-blur-sm"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            )}

                                            {isActive && (
                                                <motion.div 
                                                    layoutId="activeEventIndicator"
                                                    className="absolute left-0 top-0 bottom-0 my-auto w-1 h-6 bg-gradient-to-b from-violet-500 via-fuchsia-500 to-pink-500 rounded-r-full shadow-[0_0_15px_rgba(168,85,247,0.6)]"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            )}

                                            <span className="relative z-10 truncate block pl-3 transition-transform duration-200 group-hover:translate-x-1">
                                                {event.name || event.id}
                                            </span>
                                        </button>

                                        {/* Delete Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.1, color: '#ef4444' }}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteEvent(event.id);
                                            }}
                                            className="absolute right-2 z-20 p-2 text-slate-500 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10 rounded-lg"
                                            title="Delete Event"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </motion.button>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* Quick Tools Section */}
                        {currentEventId && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                transition={{ delay: 0.2 }}
                                className="mt-8 mb-4 px-1"
                            >
                                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
                                    {t('quickTools')}
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <motion.button 
                                        variants={buttonClick}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={onRaffle}
                                        className="p-3 glass-interactive rounded-xl text-center group flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">🎲</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{t('raffle')}</div>
                                    </motion.button>
                                    <motion.button 
                                        variants={buttonClick}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => window.location.hash = '#email'}
                                        className="p-3 glass-interactive rounded-xl text-center group flex flex-col items-center justify-center gap-2"
                                    >
                                        <div className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">✉️</div>
                                        <div className="text-[10px] text-slate-400 font-medium">{t('email')}</div>
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
                            className="w-full group relative flex items-center justify-center gap-2 animated-gradient-bg text-white py-3.5 px-4 rounded-xl transition-all border border-white/10 shadow-lg"
                        >
                            <span className="text-xl font-light relative z-10 leading-none pb-1">+</span>
                            <span className="font-medium relative z-10">{t('createEvent')}</span>
                        </motion.button>
                    </div>

                    {/* Watermark */}
                    <div className="text-[10px] text-slate-600 text-center mt-6 pb-2 select-none opacity-50">
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
