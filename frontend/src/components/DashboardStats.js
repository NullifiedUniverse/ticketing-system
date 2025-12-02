
import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };

const DashboardStats = ({ stats }) => (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
        <StatsCard title="Currently Inside" value={stats.checkedIn} />
        <StatsCard title="On Temporary Leave" value={stats.onLeave} />
        <StatsCard title="Total Checked In (All Time)" value={stats.checkedIn + stats.onLeave} total={stats.total} showProgress={true} />
        <StatsCard title="Remaining Tickets" value={stats.valid} />
    </motion.div>
);

export default DashboardStats;
