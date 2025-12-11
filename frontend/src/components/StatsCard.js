import React from 'react';
import { motion } from 'framer-motion';
import BentoCard from './BentoCard';
import AnimatedCounter from './AnimatedCounter';

const themes = {
    pink: { 
        border: "border-pink-500/10 hover:border-pink-500/40", 
        glow: "bg-pink-500/10", 
        text: "text-pink-400",
        bar: "from-pink-500 to-rose-500" 
    },
    blue: { 
        border: "border-cyan-500/10 hover:border-cyan-500/40", 
        glow: "bg-cyan-500/10", 
        text: "text-cyan-400",
        bar: "from-cyan-500 to-blue-500" 
    },
    green: { 
        border: "border-emerald-500/10 hover:border-emerald-500/40", 
        glow: "bg-emerald-500/10", 
        text: "text-emerald-400",
        bar: "from-emerald-500 to-teal-500" 
    },
    yellow: { 
        border: "border-amber-500/10 hover:border-amber-500/40", 
        glow: "bg-amber-500/10", 
        text: "text-amber-400",
        bar: "from-amber-500 to-orange-500" 
    }
};

const StatsCard = ({ title, value, total, showProgress, colorTheme = 'blue' }) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    const theme = themes[colorTheme] || themes.blue;

    return (
        <BentoCard 
            className={`group transition-colors duration-300 border ${theme.border} bg-slate-900/40`}
        >
            {/* Animated Glow Blob */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl transition-all duration-700 opacity-20 group-hover:opacity-50 group-hover:scale-110 ${theme.glow} pointer-events-none`}></div>
            
            <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-3 relative z-10 ${theme.text} opacity-90`}>{title}</h3>
            
            <div className="flex items-end gap-2 relative z-10">
                <span className="text-5xl font-black text-white drop-shadow-lg tracking-tighter">
                    <AnimatedCounter value={value} />
                </span>
                {total !== undefined && (
                    <span className="text-slate-500 text-sm mb-1.5 font-bold">/ {total}</span>
                )}
            </div>

            {showProgress && (
                <div className="mt-5 h-2 w-full bg-white/5 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1.5, ease: "circOut" }}
                        className={`h-full bg-gradient-to-r shadow-[0_0_15px_currentColor] ${theme.bar}`}
                    />
                </div>
            )}
        </BentoCard>
    );
};

export default StatsCard;