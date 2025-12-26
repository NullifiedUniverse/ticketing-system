import React, { useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { containerStagger, fadeInUp, springTransition } from '../utils/animations';
import SmartButton from './SmartButton';

const Sidebar = memo(({ onNewEvent, onDeleteEvent, isCollapsed, toggleCollapse }) => {
    const { events, loading, eventId: currentEventId, selectEvent } = useEvent();
    const { t, cycleLanguage, language } = useLanguage();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleMobileToggle = () => setIsMobileOpen(!isMobileOpen);
    const handleSelectEvent = (id) => {
        selectEvent(id);
        setIsMobileOpen(false);
    };

    return (
        <>
            {/* Mobile Toggle */}
            <div className="xl:hidden fixed top-3 left-3 z-[60]">
                <button
                    onClick={handleMobileToggle}
                    aria-label={isMobileOpen ? "Close Sidebar" : "Open Sidebar"}
                    className="bg-gray-900/80 backdrop-blur-md text-white p-2 rounded-lg border border-gray-700 shadow-lg active:scale-95 transition-transform"
                >
                    {isMobileOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                </button>
            </div>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={{ width: isCollapsed ? 80 : 288 }}
                transition={springTransition}
                style={{ willChange: 'width, transform' }}
                className={`fixed z-50 bg-slate-950/90 backdrop-blur-2xl border-r border-white/10 shadow-2xl xl:top-0 xl:bottom-0 xl:left-0 inset-y-0 left-0 h-full flex flex-col ${isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full xl:translate-x-0'}`}
            >
                {/* Decorative Blob */}
                <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-transparent blur-3xl -z-10 pointer-events-none"></div>

                <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 pt-16 xl:pt-4 flex flex-col h-full overflow-hidden transition-all duration-300`}>

                    {/* Header */}
                    <div className={`mb-6 flex items-center shrink-0 h-10 relative transition-all duration-300 ${isCollapsed ? 'pl-2' : ''}`}>
                        <div
                            className="flex items-center gap-3 cursor-pointer text-white whitespace-nowrap overflow-hidden"
                            onClick={() => window.location.hash = ''}
                        >
                            <motion.span
                                layout="position"
                                className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 shrink-0"
                            >
                                🎫
                            </motion.span>
                            <AnimatePresence>
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="font-bold tracking-tight text-lg rainbow-text"
                                    >
                                        {t('appTitle')}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Collapse Toggle */}
                        <button
                            onClick={toggleCollapse}
                            className={`hidden xl:flex p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors absolute right-0 top-1/2 -translate-y-1/2 z-10`}
                        >
                            <svg className={`w-5 h-5 transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Language Toggle */}
                    <SmartButton
                        variant="glass"
                        onClick={cycleLanguage}
                        className={`mb-6 w-full py-2 text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 group transition-all duration-300 ${isCollapsed ? 'pl-[18px]' : 'px-3 justify-between'}`}
                        title={isCollapsed ? (language === 'en' ? 'English' : 'Chinese') : ''}
                    >
                        {!isCollapsed && <span>Language</span>}
                        <span className="text-white group-hover:text-violet-300 transition-colors">{language === 'en' ? '🇺🇸' : '🇹🇼'}</span>
                    </SmartButton>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                        {!isCollapsed && (
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1 whitespace-nowrap">
                                {t('yourEvents')}
                            </h3>
                        )}

                        {loading && (
                            <div className="flex justify-center py-4">
                                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        <motion.div
                            variants={containerStagger}
                            initial="hidden"
                            animate="visible"
                            className="space-y-1.5"
                        >
                            {events.map((event) => {
                                const isActive = currentEventId === event.id;
                                return (
                                    <motion.button
                                        key={event.id}
                                        variants={fadeInUp}
                                        layout="position"
                                        onClick={() => handleSelectEvent(event.id)}
                                        className={`relative w-full flex items-center py-2.5 rounded-xl transition-all duration-300 group ${isActive ? 'text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                            } ${isCollapsed ? 'pl-[14px]' : 'px-3'}`} // 80px width: (80-32-16pad)/2 ~ 16px? adjusted for visual center
                                        title={isCollapsed ? event.name || event.id : ''}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeEvent"
                                                className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent border border-white/5 rounded-xl shadow-sm"
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        )}

                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800/50 text-slate-500 group-hover:bg-slate-700 group-hover:text-slate-300'}`}>
                                            {(event.name || event.id).substring(0, 2).toUpperCase()}
                                        </div>

                                        <AnimatePresence>
                                            {!isCollapsed && (
                                                <motion.span
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="relative z-10 truncate pl-3 text-sm font-medium"
                                                >
                                                    {event.name || event.id}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </motion.button>
                                );
                            })}
                        </motion.div>

                        {/* Quick Tools */}
                        {currentEventId && (
                            <div className={`mt-8 mb-4 ${isCollapsed ? 'flex flex-col gap-2' : ''}`}>
                                {!isCollapsed && (
                                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1 whitespace-nowrap">
                                        {t('quickTools')}
                                    </h3>
                                )}
                                <div className={`${isCollapsed ? 'flex flex-col gap-2' : 'grid grid-cols-2 gap-2'}`}>
                                    <SmartButton
                                        variant="glass"
                                        onClick={() => window.location.hash = '#raffle-control'}
                                        className={`p-0 flex-col gap-1 items-center justify-center transition-all duration-300 ${isCollapsed ? '!h-10 !px-0' : 'h-20'}`}
                                        title={isCollapsed ? t('raffleControl') : ''}
                                    >
                                        <div className="text-xl group-hover:scale-110 transition-transform">⚙️</div>
                                        {!isCollapsed && <div className="text-[10px] text-slate-400 font-medium">{t('raffleControl')}</div>}
                                    </SmartButton>
                                    <SmartButton
                                        variant="glass"
                                        onClick={() => window.location.hash = '#raffle'}
                                        className={`p-0 flex-col gap-1 items-center justify-center transition-all duration-300 ${isCollapsed ? '!h-10 !px-0' : 'h-20'}`}
                                        title={isCollapsed ? t('raffle') : ''}
                                    >
                                        <div className="text-xl group-hover:scale-110 transition-transform">🎲</div>
                                        {!isCollapsed && <div className="text-[10px] text-slate-400 font-medium">{t('raffle')}</div>}
                                    </SmartButton>
                                    <SmartButton
                                        variant="glass"
                                        onClick={() => window.location.hash = '#email'}
                                        className={`p-0 flex-col gap-1 items-center justify-center transition-all duration-300 ${isCollapsed ? '!h-10 !px-0' : 'h-20'}`}
                                        title={isCollapsed ? t('email') : ''}
                                    >
                                        <div className="text-xl group-hover:scale-110 transition-transform">✉️</div>
                                        {!isCollapsed && <div className="text-[10px] text-slate-400 font-medium">{t('email')}</div>}
                                    </SmartButton>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-white/5 shrink-0">
                        <SmartButton
                            onClick={onNewEvent}
                            className={`w-full shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white transition-all duration-300 ${isCollapsed ? '!px-0 py-3 justify-center' : 'py-3 px-4'}`}
                            title={isCollapsed ? t('createEvent') : ''}
                        >
                            <span className="text-xl font-light leading-none">+</span>
                            {!isCollapsed && <span className="font-bold ml-2 text-sm">{t('createEvent')}</span>}
                        </SmartButton>
                    </div>
                </div>
            </motion.aside>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 xl:hidden"
                        onClick={() => setIsMobileOpen(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
});

export default Sidebar;
