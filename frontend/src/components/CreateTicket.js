
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { createTicket } from '../services/api';

const animatedGradientStyle = { '--gradient-start': '#ec4899', '--gradient-end': '#8b5cf6' };

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
        <motion.div layout className="bg-gray-900 border border-purple-500/20 p-6 rounded-2xl shadow-lg mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Create New Ticket</h2>
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Attendee Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <input
                        type="email"
                        placeholder="Attendee Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                </div>
                <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: isLoading ? 1 : 1.02 }}
                    style={animatedGradientStyle}
                    className="w-full animated-gradient-bg text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center h-10 shadow-md"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        'Generate Ticket'
                    )}
                </motion.button>
            </form>
        </motion.div>
    );
};

export default CreateTicket;
