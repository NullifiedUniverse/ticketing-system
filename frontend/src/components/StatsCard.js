
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../utils/animations';
import AnimatedCounter from './AnimatedCounter'; // Assuming this exists or we use simple text

const StatsCard = ({ title, value, total, showProgress }) => {
    const percent = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <motion.div 
            variants={fadeInUp}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-gray-900/50 border border-white/10 p-6 rounded-2xl shadow-lg relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 transition-opacity opacity-50 group-hover:opacity-80"></div>
            
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
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                    />
                </div>
            )}
        </motion.div>
    );
};

export default StatsCard;
