
import React from 'react';
import { motion } from 'framer-motion';
import LiveIndicator from './LiveIndicator';

const Header = ({ eventId, connectionStatus, connectionError }) => (
    <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex justify-between items-start"
    >
        <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">Event Control Panel</h1>
            {eventId ? (
                <p className="text-gray-400 mt-1">
                    Monitoring event: <span className="font-mono animated-gradient-text break-all">{eventId}</span>
                </p>
            ) : (
                <p className="text-gray-500 mt-1">No event selected.</p>
            )}
        </div>
        <LiveIndicator status={connectionStatus} error={connectionError} />
    </motion.header>
);

export default Header;
