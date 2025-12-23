import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BentoCard from './BentoCard';
import SmartButton from './SmartButton';
import { getActiveScanners } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { fadeInUp, containerStagger } from '../utils/animations';

const ScannerMonitor = ({ eventId }) => {
    const { t } = useLanguage();
    const [scanners, setScanners] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchScanners = useCallback(async () => {
        if (!eventId) return;
        try {
            const data = await getActiveScanners(eventId);
            setScanners(data);
        } catch (err) {
            console.error("Failed to fetch scanners", err);
        }
    }, [eventId]);

    useEffect(() => {
        fetchScanners();
        const interval = setInterval(fetchScanners, 10000); // Refresh every 10s
        return () => clearInterval(interval);
    }, [fetchScanners]);

    return (
        <BentoCard 
            title="Scanner Intelligence" 
            icon="📡" 
            subtitle={`${scanners.length} Active Devices`}
            className="h-full"
        >
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="popLayout">
                    {scanners.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-12 text-slate-500 italic text-sm"
                        >
                            No active scanners detected.
                        </motion.div>
                    ) : (
                        <motion.div 
                            variants={containerStagger}
                            initial="hidden"
                            animate="visible"
                            className="grid gap-3"
                        >
                            {scanners.map((scanner) => (
                                <motion.div 
                                    key={scanner.id}
                                    variants={fadeInUp}
                                    layout
                                    className="glass-panel p-4 flex justify-between items-center group hover:bg-slate-800/50 transition-all border border-white/5"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-xl shadow-inner">
                                                📱
                                            </div>
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white flex items-center gap-2">
                                                {scanner.id.substring(0, 8)}...
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black tracking-tighter ${scanner.type === 'NGROK' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                    {scanner.type}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">
                                                Last seen: {new Date(scanner.lastSeen).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-white leading-none">
                                            {scanner.scans}
                                        </div>
                                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                            Scans
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Real-Time Monitoring</span>
                <SmartButton 
                    variant="glass" 
                    className="py-1 px-3 text-[10px]" 
                    onClick={fetchScanners}
                >
                    Refresh
                </SmartButton>
            </div>
        </BentoCard>
    );
};

export default ScannerMonitor;
