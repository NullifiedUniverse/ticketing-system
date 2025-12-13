import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LiveIndicator from './LiveIndicator';
import { useEvent } from '../context/EventContext';
import { useLanguage } from '../context/LanguageContext';
import { buttonClick } from '../utils/animations';
import { getNgrokUrl } from '../services/api';

const DashboardHeader = ({ 
    connectionStatus, 
    connectionError, 
    isSyncing, 
    searchTerm, 
    setSearchTerm, 
    isEditing, 
    setIsEditing, 
    generateSetupQR 
}) => {
    const { eventId } = useEvent();
    const { t } = useLanguage();
    
    // Search History State
    const [searchHistory, setSearchHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('searchHistory') || '[]');
        } catch (e) { return []; }
    });
    const [showSearchHistory, setShowSearchHistory] = useState(false);

    // Update History on Search
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleSearchFocus = () => setShowSearchHistory(true);
    const handleSearchBlur = () => setTimeout(() => setShowSearchHistory(false), 200);

    const handleHistoryClick = (term) => {
        setSearchTerm(term);
    };

    const copyLink = async () => {
        try {
            const { url } = await getNgrokUrl();
            if(url) {
                await navigator.clipboard.writeText(`${url}/scanner`);
                alert(t('alertLinkCopied'));
            } else {
                alert(t('errorBackendURL'));
            }
        } catch(e) { console.error(e); }
    };

    return (
        <header className="sticky top-4 z-30 mx-2 sm:mx-6 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-3xl px-4 py-3 md:px-6 md:py-4 flex justify-between items-center shadow-2xl mb-4">
            <div className="w-8 xl:hidden"></div>

            <div className="flex items-center gap-4 overflow-hidden">
                <h2 className="text-xl font-semibold text-white truncate flex items-center gap-2">
                    {eventId ? (
                        <>
                            <span className="text-slate-400 text-xs hidden sm:inline uppercase tracking-widest font-bold">{t('headerEvent')}</span>
                            <span className="rainbow-text text-2xl">{eventId}</span>
                        </>
                    ) : (
                        <span className="text-slate-500 italic">{t('headerSelect')}</span>
                    )}
                </h2>
                <LiveIndicator status={connectionStatus} error={connectionError} isSyncing={isSyncing} />
            </div>

            {eventId && (
                <div className="flex items-center gap-3">
                    {/* Search with History Dropdown */}
                    <div className="relative group hidden md:block">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>
                        <input
                            type="text"
                            placeholder={t('searchPlaceholder') || "Search..."}
                            value={searchTerm}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            className="glass-input pl-9 pr-4 py-2 w-48 focus:w-64 transition-all text-sm rounded-xl"
                        />
                        <AnimatePresence>
                            {showSearchHistory && searchHistory.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-50"
                                >
                                    <div className="p-2">
                                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1 px-2">Recent</div>
                                        {searchHistory.map((term, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleHistoryClick(term)}
                                                className="w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                <span className="text-slate-500">↺</span> {term}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <motion.button 
                        variants={buttonClick}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setIsEditing(!isEditing)}
                        className={`glass-interactive px-4 py-2 text-sm font-medium transition-colors rounded-xl flex items-center gap-2 ${isEditing ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white'}`}
                        title="Customize Dashboard"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                    </motion.button>

                    <motion.button 
                        variants={buttonClick}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={copyLink}
                        className="glass-interactive px-4 py-2 text-sm font-medium text-slate-300 hover:text-white flex items-center gap-2 shadow-lg"
                        title={t('copyScannerLink')}
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                    </motion.button>

                    <motion.button 
                        variants={buttonClick}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={generateSetupQR}
                        className="animated-gradient-bg px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                        <span className="text-lg">📱</span>
                        <span className="hidden sm:inline">{t('qaScanner')}</span>
                    </motion.button>
                </div>
            )}
        </header>
    );
};

export default DashboardHeader;