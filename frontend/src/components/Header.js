
import React, { memo } from 'react';
import { motion } from 'framer-motion';
import LiveIndicator from './LiveIndicator';

const headerVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const Header = memo(({ eventId, connectionStatus, connectionError }) => (
    <motion.header
        initial="hidden"
        animate="visible"
        variants={headerVariants}
        className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
    >
        <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight truncate">
                Event Control Panel
            </h1>
            <div className="mt-1 flex items-center gap-2 text-sm">
                {eventId ? (
                    <>
                        <span className="text-gray-400">Monitoring:</span>
                        <span className="font-mono animated-gradient-text px-2 py-0.5 rounded bg-white/5 border border-white/10 truncate max-w-[200px] sm:max-w-md">
                            {eventId}
                        </span>
                    </>
                ) : (
                    <span className="text-gray-500 italic">No event selected</span>
                )}
            </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
            <LiveIndicator status={connectionStatus} error={connectionError} />
        </div>
    </motion.header>
));

export default Header;

