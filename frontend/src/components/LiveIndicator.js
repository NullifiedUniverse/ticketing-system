
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const LiveIndicator = ({ status, error, isSyncing }) => {
    const { t } = useLanguage();

    let color = '#22c55e'; // connected (green)
    let text = t('liveConnected');
    let animate = { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] };

    if (status === 'error') {
        color = '#ef4444';
        text = t('liveOffline');
        animate = { opacity: [1, 0.5, 1] };
    } else if (isSyncing) {
        color = '#3b82f6'; // blue
        text = 'Syncing...';
        animate = { scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] };
    }

    return (
        <div className="relative group flex items-center gap-2">
            <motion.div
                animate={animate}
                transition={{ duration: isSyncing ? 1 : 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="text-sm text-gray-400 hidden sm:inline">{text}</span>
            {status === 'error' && error && (
                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-red-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none left-1/2 -translate-x-1/2 z-10 shadow-lg">
                    {error}
                </div>
            )}
        </div>
    );
};

export default LiveIndicator;
