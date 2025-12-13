import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { containerStagger, fadeInUp } from '../utils/animations';
import SmartButton from './SmartButton';

const Sidebar = ({ onNewEvent, onDeleteEvent, onRaffle, isCollapsed, toggleCollapse }) => {
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
            <motion.div 
                layout
                initial={false}
                animate={{ width: isCollapsed ? 80 : 288 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={`fixed z-50 bg-slate-900/90 backdrop-blur-2xl border border-white/10 shadow-2xl xl:top-4 xl:left-4 xl:bottom-4 xl:rounded-[2.5rem] inset-y-0 left-0 ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full xl:translate-x-0'}`}
            >
                <div className="p-4 flex flex-col h-full relative overflow-hidden">
                    {/* Decorative Gradient Blob */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/20 to-pink-600/20 blur-3xl -z-10 pointer-events-none"></div>

                    {/* Header */}
                    <div className="mb-8 mt-2 flex justify-between items-center overflow-hidden">
                        <motion.h1 
                            layout
                            className="text-xl font-bold flex items-center gap-3 cursor-pointer text-white whitespace-nowrap" 
                            onClick={() => window.location.hash = ''}
                        >
                            <span className="w-10 h-10 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-violet-500/20 shrink-0">🎫</span>
                            {!isCollapsed && (
                                <motion.span 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                    className="tracking-tight rainbow-text"
                                >
                                    {t('appTitle')}
                                </motion.span>
                            )}
                        </motion.h1>
                        
                        {/* Collapse Toggle (Desktop Only) */}
                        <button 
                            onClick={toggleCollapse} 
                            className="hidden xl:flex p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors absolute right-2 top-2"
                        >
                            <svg className={`w-5 h-5 transform transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Language Toggle */}
                    <SmartButton 
                        variant="glass"
                        onClick={cycleLanguage}
                        className={`mb-6 w-full py-2 px-2 text-xs font-bold text-slate-400 uppercase tracking-wider ${isCollapsed ? 'justify-center' : 'justify-between'} group`}
                        title={isCollapsed ? (language === 'en' ? 'English' : 'Chinese') : ''}
                    >
                        {!isCollapsed && <span>Language</span>}
                        <span className="text-white group-hover:text-violet-300 transition-colors">{language === 'en' ? '🇺🇸' : '🇹🇼'}</span>
                    </SmartButton>

                    <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar overflow-x-hidden">
                        {!isCollapsed && (
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2 whitespace-nowrap">
                                {t('yourEvents')}
                            </h3>
                        )}
                        
                        {loading && (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        <motion.div 
                            variants={containerStagger}
                            initial="hidden"
                            animate="visible"
                            className="space-y-2"
                        >
                            {events.map((event) => {
                                const isActive = currentEventId === event.id;
                                return (
                                    <motion.div 
                                        key={event.id}
                                        variants={fadeInUp}
                                        className="relative group flex items-center justify-center xl:justify-start"
                                    >
                                        <button
                                            onClick={() => { onSelectEvent(event.id); setIsMobileOpen(false); }}
                                            className={`relative w-full flex items-center px-3 py-3 rounded-xl transition-all duration-300 group-hover:bg-white/5 ${
                                                isActive ? 'text-white' : 'text-slate-400'
                                            } ${isCollapsed ? 'justify-center' : ''}`}
                                            title={isCollapsed ? event.name || event.id : ''}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="activeEventBackground"
                                                    className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border border-white/5 rounded-xl shadow-lg"
                                                    initial={false}
                                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                                />
                                            )}

                                            {/* Icon / Initial */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isActive ? 'bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                                                {(event.name || event.id).substring(0, 2).toUpperCase()}
                                            </div>

                                            {!isCollapsed && (
                                                <span className="relative z-10 truncate block pl-3 text-sm font-medium transition-transform duration-200 group-hover:translate-x-1">
                                                    {event.name || event.id}
                                                </span>
                                            )}
                                        </button>
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
                                className={`mt-8 mb-4 ${isCollapsed ? 'flex flex-col gap-2' : 'px-1'}`}
                            >
                                {!isCollapsed && (
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2 whitespace-nowrap">
                                        {t('quickTools')}
                                    </h3>
                                )}
                                <div className={`${isCollapsed ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-2'}`}>
                                    <SmartButton 
                                        variant="glass"
                                        onClick={onRaffle}
                                        className={`p-2 flex-col gap-1 ${isCollapsed ? 'h-12' : 'h-20'}`}
                                        title={isCollapsed ? t('raffle') : ''}
                                    >
                                        <div className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">🎲</div>
                                        {!isCollapsed && <div className="text-[10px] text-slate-400 font-medium">{t('raffle')}</div>}
                                    </SmartButton>
                                    <SmartButton 
                                        variant="glass"
                                        onClick={() => window.location.hash = '#email'}
                                        className={`p-2 flex-col gap-1 ${isCollapsed ? 'h-12' : 'h-20'}`}
                                        title={isCollapsed ? t('email') : ''}
                                    >
                                        <div className="text-xl group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">✉️</div>
                                        {!isCollapsed && <div className="text-[10px] text-slate-400 font-medium">{t('email')}</div>}
                                    </SmartButton>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <SmartButton
                            onClick={onNewEvent}
                            className={`w-full shadow-lg bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white ${isCollapsed ? 'px-0 py-3 justify-center' : 'py-3.5 px-4'}`}
                            title={isCollapsed ? t('createEvent') : ''}
                        >
                            <span className="text-xl font-light relative z-10 leading-none pb-1">+</span>
                            {!isCollapsed && <span className="font-medium relative z-10 ml-2">{t('createEvent')}</span>}
                        </SmartButton>
                    </div>
                </div>
            </motion.div>
            
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
