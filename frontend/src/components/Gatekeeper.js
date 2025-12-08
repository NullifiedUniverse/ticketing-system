import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { buttonClick } from '../utils/animations';

// Simple hash function to obscure credentials in client-side code
// (Not cryptographically secure against determined attackers, but prevents casual snooping)
const simpleHash = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return hash;
};

// Target Hashes for "Null" and "980122"
const TARGET_USER_HASH = 2439591; 
const TARGET_PASS_HASH = 1685057440;

const Gatekeeper = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const sessionAuth = sessionStorage.getItem('ticket_system_auth');
        if (sessionAuth === 'granted') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(false);

        // Fake network delay for realism/security theater
        setTimeout(() => {
            if (simpleHash(username) === TARGET_USER_HASH && simpleHash(password) === TARGET_PASS_HASH) {
                sessionStorage.setItem('ticket_system_auth', 'granted');
                setIsAuthenticated(true);
            } else {
                setError(true);
                setIsLoading(false);
                // Shake input effect
            }
        }, 800);
    };

    return (
        <>
            <AnimatePresence mode="wait">
                {!isAuthenticated && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
                    >
                        {/* Background with deep blur */}
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" />

                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="glass-panel w-full max-w-md p-8 relative overflow-hidden z-10"
                        >
                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
                            
                            <div className="text-center mb-8">
                                <motion.div 
                                    initial={{ y: -10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="w-16 h-16 mx-auto bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl flex items-center justify-center shadow-inner border border-white/10 mb-4"
                                >
                                    <span className="text-3xl">🔒</span>
                                </motion.div>
                                <h2 className="text-2xl font-bold text-white tracking-tight">System Access</h2>
                                <p className="text-slate-400 text-sm mt-1">Restricted Area. Identify yourself.</p>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Username</label>
                                    <input 
                                        type="text" 
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className={`glass-input w-full ${error ? 'border-red-500/50 focus:ring-red-500/20' : ''}`}
                                        placeholder="Enter ID"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                                    <input 
                                        type="password" 
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className={`glass-input w-full ${error ? 'border-red-500/50 focus:ring-red-500/20' : ''}`}
                                        placeholder="••••••"
                                    />
                                </div>

                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="text-red-400 text-xs text-center font-bold bg-red-500/10 py-2 rounded-lg border border-red-500/20"
                                    >
                                        ACCESS DENIED
                                    </motion.div>
                                )}

                                <motion.button
                                    variants={buttonClick}
                                    whileHover="hover"
                                    whileTap="tap"
                                    disabled={isLoading}
                                    className="w-full animated-gradient-bg py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 mt-2"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Authenticate</span>
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                        </>
                                    )}
                                </motion.button>
                            </form>
                            
                            <div className="mt-6 text-center">
                                <span className="text-[10px] text-slate-600 font-mono">SECURE CONNECTION // TLS 1.3</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Only render children when authenticated to prevent data fetching */}
            {isAuthenticated && children}
        </>
    );
};

export default Gatekeeper;
