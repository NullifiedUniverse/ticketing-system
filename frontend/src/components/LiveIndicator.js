
import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const LiveIndicator = ({ status, error }) => {
    const { t } = useLanguage();
    const color = status === 'connected' ? '#22c55e' : '#ef4444';
    const text = status === 'connected' ? t('liveConnected') : t('liveOffline');

    return (
        <div className="relative group flex items-center gap-2">
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="text-sm text-gray-400">{text}</span>
            {status === 'error' && error && (
                <div className="absolute bottom-full mb-2 w-max max-w-xs bg-red-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none left-1/2 -translate-x-1/2 z-10 shadow-lg">
                    {error}
                </div>
            )}
        </div>
    );
};

export default LiveIndicator;
