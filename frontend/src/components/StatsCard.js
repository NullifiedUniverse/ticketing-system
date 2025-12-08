
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../utils/animations';
import AnimatedCounter from './AnimatedCounter';

const themes = {
    pink: { 
        border: "border-pink-500/20 hover:border-pink-500/50", 
        glow: "bg-pink-500/20", 
        text: "text-pink-400",
        bar: "from-pink-500 to-rose-500" 
    },
    blue: { 
        border: "border-cyan-500/20 hover:border-cyan-500/50", 
        glow: "bg-cyan-500/20", 
        text: "text-cyan-400",
        bar: "from-cyan-500 to-blue-500" 
    },
    green: { 
        border: "border-emerald-500/20 hover:border-emerald-500/50", 
        glow: "bg-emerald-500/20", 
        text: "text-emerald-400",
        bar: "from-emerald-500 to-teal-500" 
    },
    yellow: { 
        border: "border-amber-500/20 hover:border-amber-500/50", 
        glow: "bg-amber-500/20", 
        text: "text-amber-400",
        bar: "from-amber-500 to-orange-500" 
    }
};

const StatsCard = ({ title, value, total, showProgress, colorTheme = 'blue' }) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    const theme = themes[colorTheme] || themes.blue;

    return (
        <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`glass-panel p-6 relative overflow-hidden group transition-all duration-300 ${theme.border}`}
        >
            {/* Animated Glow Blob */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-12 -mt-12 transition-all duration-500 opacity-30 group-hover:opacity-60 group-hover:scale-150 ${theme.glow}`}></div>
            
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-2 relative z-10 ${theme.text} opacity-80 group-hover:opacity-100 transition-opacity`}>{title}</h3>
            
            <div className="flex items-end gap-2 relative z-10">
                <span className="text-4xl font-black text-white drop-shadow-sm">
                    <AnimatedCounter value={value} />
                </span>
                {total !== undefined && (
                    <span className="text-slate-500 text-sm mb-1 font-medium">/ {total}</span>
                )}
            </div>

            {showProgress && (
                <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden relative z-10 backdrop-blur-sm">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full bg-gradient-to-r shadow-[0_0_10px_currentColor] ${theme.bar}`}
                    />
                </div>
            )}
        </motion.div>
    );
};

export default StatsCard;
