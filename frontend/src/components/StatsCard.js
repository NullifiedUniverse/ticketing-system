
import React from 'react';
import { motion } from 'framer-motion';
import AnimatedCounter from './AnimatedCounter';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
const animatedGradientStyle = { '--gradient-start': '#ec4899', '--gradient-end': '#8b5cf6' };

const StatsCard = ({ title, value, total, showProgress = false }) => (
    <motion.div
        variants={itemVariants}
        className="bg-gray-900 border border-purple-500/20 p-6 rounded-2xl shadow-lg h-full"
    >
        <h2 className="text-lg font-semibold animated-gradient-text">{title}</h2>
        <p className="text-5xl font-bold mt-2 text-white">
            <AnimatedCounter value={value} /> {total !== undefined && <span className="text-3xl text-gray-400">/ {total.toLocaleString()}</span>}
        </p>
        {showProgress && (
            <div className="w-full bg-black rounded-full h-2.5 mt-4">
                <motion.div
                    className="animated-gradient-bg h-2.5 rounded-full shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: total > 0 ? `${(value / total) * 100}%` : '0%' }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    style={animatedGradientStyle}
                />
            </div>
        )}
    </motion.div>
);

export default StatsCard;
