import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bentoBounce, buttonClick } from '../utils/animations';

const BentoCard = ({ 
    children, 
    title, 
    icon, 
    colSpan = 1, 
    className = "", 
    isCollapsible = false,
    defaultCollapsed = false
}) => {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <motion.div
            layout
            variants={bentoBounce}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`glass-panel relative overflow-hidden flex flex-col ${colSpan > 1 ? `md:col-span-${colSpan}` : ''} ${className}`}
        >
            {/* Header / Title Bar */}
            {(title || icon || isCollapsible) && (
                <motion.div 
                    layout="position" 
                    className="flex items-center justify-between p-6 pb-2 z-20"
                >
                    <div className="flex items-center gap-3">
                        {icon && <span className="text-xl">{icon}</span>}
                        {title && <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">{title}</h3>}
                    </div>
                    
                    {isCollapsible && (
                        <motion.button
                            variants={buttonClick}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-colors"
                        >
                            <motion.svg 
                                animate={{ rotate: isCollapsed ? 180 : 0 }}
                                className="w-5 h-5" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </motion.svg>
                        </motion.button>
                    )}
                </motion.div>
            )}

            {/* Content */}
            <AnimatePresence initial={false} mode="wait">
                {!isCollapsed && (
                    <motion.div
                        key="content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="flex-1 p-6 pt-2 z-10"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Decorative Background Glow (Optional, can be passed or built-in) */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-gradient-to-tr from-white/5 to-transparent rounded-full blur-3xl pointer-events-none -z-0"></div>
        </motion.div>
    );
};

export default BentoCard;
