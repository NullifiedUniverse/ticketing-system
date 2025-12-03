
import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import { useLanguage } from '../context/LanguageContext';

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };

const DashboardStats = ({ stats }) => {
    const { t } = useLanguage();

    return (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
        <StatsCard title={t('statsContained')} value={stats.checkedIn} />
        <StatsCard title={t('statsAwol')} value={stats.onLeave} />
        <StatsCard title={t('statsCaptured')} value={stats.checkedIn + stats.onLeave} total={stats.total} showProgress={true} />
        <StatsCard title={t('statsAtLarge')} value={stats.valid} />
    </motion.div>
)};

export default DashboardStats;
