
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../utils/animations';
import AnimatedCounter from './AnimatedCounter'; // Assuming this exists or we use simple text

const themes = {
    pink: { border: "border-pink-500/30 hover:border-pink-500", glow: "bg-pink-500/20", bar: "from-pink-500 to-rose-500" },
    blue: { border: "border-blue-500/30 hover:border-blue-500", glow: "bg-blue-500/20", bar: "from-blue-500 to-indigo-500" },
    green: { border: "border-green-500/30 hover:border-green-500", glow: "bg-green-500/20", bar: "from-green-500 to-emerald-500" },
    yellow: { border: "border-yellow-500/30 hover:border-yellow-500", glow: "bg-yellow-500/20", bar: "from-yellow-500 to-orange-500" }
};

const StatsCard = ({ title, value, total, showProgress, colorTheme = 'blue' }) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;
    const theme = themes[colorTheme] || themes.blue;

    return (
        <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`bg-gray-900/50 border p-6 rounded-2xl shadow-lg relative overflow-hidden group transition-colors ${theme.border}`}
        >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-80 ${theme.glow}`}></div>
            
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">{title}</h3>
            
            <div className="flex items-end gap-2 relative z-10">
                <span className="text-4xl font-bold text-white">
                    <AnimatedCounter value={value} />
                </span>
                {total !== undefined && (
                    <span className="text-gray-500 text-sm mb-1">/ {total}</span>
                )}
            </div>

            {showProgress && (
                <div className="mt-4 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden relative z-10">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r rounded-full ${theme.bar}`}
                    />
                </div>
            )}
        </motion.div>
    );
};

export default StatsCard;
