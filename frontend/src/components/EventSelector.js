import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const EventSelector = ({ onEventIdChange, onShowSetupQR, onNewEvent }) => {
    const [eventIdInput, setEventIdInput] = useState('');
    const [eventHistory, setEventHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('eventHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('eventHistory', JSON.stringify(eventHistory));
    }, [eventHistory]);

    const handleSelect = (newEventId) => {
        onEventIdChange(newEventId);
        if (newEventId) {
            setEventHistory((prev) => [newEventId, ...prev.filter((id) => id !== newEventId)].slice(0, 5));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (eventIdInput.trim()) {
            handleSelect(eventIdInput.trim().toLowerCase().replace(/\s+/g, '-'));
            setEventIdInput('');
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gray-900 border border-purple-500/20 p-6 rounded-2xl shadow-lg"
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <h2 className="text-2xl font-bold text-white">Select or Create Event</h2>
                <div className="flex items-center space-x-4">
                    <motion.button
                        onClick={onNewEvent}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-lg text-sm"
                    >
                        New Event
                    </motion.button>
                    <motion.button
                        onClick={onShowSetupQR}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="bg-gray-700 text-sm hover:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg flex-shrink-0"
                    >
                        Show Setup QR
                    </motion.button>
                </div>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Enter Event ID (e.g., concert-2025)"
                    value={eventIdInput}
                    onChange={(e) => setEventIdInput(e.target.value)}
                    required
                    className="flex-grow bg-black border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                />
                <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    style={{ '--gradient-start': '#ec4899', '--gradient-end': '#8b5cf6' }}
                    className="animated-gradient-bg text-white font-bold py-2 px-4 rounded-lg transition-all shadow-md"
                >
                    Load Event
                </motion.button>
            </form>
            {eventHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                    <h3 className="text-sm text-gray-400 mb-2">Recent Events:</h3>
                    <div className="flex flex-wrap gap-2">
                        {eventHistory.map((id) => (
                            <motion.button
                                key={id}
                                onClick={() => handleSelect(id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-gray-700 hover:bg-gray-600 text-white font-mono text-sm py-1 px-3 rounded-lg"
                            >
                                {id}
                            </motion.button>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default EventSelector;
