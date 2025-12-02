import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createTicket } from '../services/api';

const CreateTicket = ({ eventId, onTicketCreated, onApiError }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await createTicket(eventId, name, email);
            onTicketCreated(result);
            setName('');
            setEmail('');
        } catch (err) {
            onApiError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div 
            layout 
            className="bg-gray-950/50 backdrop-blur-md border border-white/5 p-6 rounded-3xl shadow-xl relative overflow-hidden group"
        >
            {/* Decorative background glow */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Issue Ticket</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Attendee Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Alice Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all hover:border-gray-600"
                        />
                    </div>
                    
                    <div className="space-y-2">
                         <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                        <input
                            type="email"
                            placeholder="alice@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full bg-black/50 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all hover:border-gray-600"
                        />
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isLoading}
                        whileHover={{ scale: isLoading ? 1 : 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span>Generate Ticket</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </>
                        )}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
};

export default CreateTicket;