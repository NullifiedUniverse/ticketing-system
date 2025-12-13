import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonClick } from '../utils/animations';

const SmartButton = ({ 
    children, 
    onClick, 
    variant = 'primary', 
    className = '', 
    disabled = false,
    loading = false, // External loading control
    icon,
    loadingText,
    type = 'button',
    title
}) => {
    const [internalStatus, setInternalStatus] = useState('idle'); // idle, loading, success, error

    // Determine effective status
    const status = loading ? 'loading' : internalStatus;

    const handleTap = () => {
        if (!disabled && status === 'idle' && navigator.vibrate) {
            navigator.vibrate(15);
        }
    };

    const handleClick = async (e) => {
        if (status === 'loading' || disabled) return;
        
        if (onClick) {
            try {
                if (!loading) setInternalStatus('loading'); // Only set internal if not controlled
                await onClick(e);
                if (!loading) {
                    setInternalStatus('success');
                    if (navigator.vibrate) navigator.vibrate([10, 30, 10]); // Success haptic
                    setTimeout(() => setInternalStatus('idle'), 2000);
                }
            } catch (err) {
                console.error("Button Action Failed:", err);
                if (!loading) {
                    setInternalStatus('error');
                    if (navigator.vibrate) navigator.vibrate(100); // Error haptic
                    setTimeout(() => setInternalStatus('idle'), 2000);
                }
            }
        }
    };

    // Styles
    const baseClasses = "w-full py-3.5 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg relative overflow-hidden";
    
    const variants = {
        primary: "animated-gradient-bg hover:brightness-110 text-white shadow-purple-500/20",
        glass: "glass-interactive text-slate-200 hover:text-white",
        danger: "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300",
        secondary: "bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
    };

    const activeClass = variants[variant] || variants.primary;
    const disabledClass = "opacity-50 cursor-not-allowed grayscale";

    return (
        <motion.button
            type={type}
            disabled={disabled || status === 'loading'}
            onClick={type === 'submit' ? undefined : handleClick}
            onTapStart={handleTap}
            title={title}
            variants={buttonClick}
            whileHover={status === 'idle' && !disabled ? "hover" : "rest"}
            whileTap={status === 'idle' && !disabled ? "tap" : "rest"}
            className={`${baseClasses} ${activeClass} ${disabled ? disabledClass : ''} ${className}`}
        >
            <AnimatePresence mode="wait">
                {status === 'loading' ? (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                    >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {loadingText && <span>{loadingText}</span>}
                    </motion.div>
                ) : status === 'success' ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="flex items-center gap-2 text-white"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Done</span>
                    </motion.div>
                ) : status === 'error' ? (
                    <motion.div
                        key="error"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex items-center gap-2 text-red-200"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Error</span>
                    </motion.div>
                ) : (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-2"
                    >
                        {children}
                        {icon && <span className="text-lg">{icon}</span>}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};

export default SmartButton;
