
import React from 'react';
import { motion } from 'framer-motion';
import StatsCard from './StatsCard';
import { useLanguage } from '../context/LanguageContext';
import { containerStagger } from '../utils/animations';

const DashboardStats = ({ stats }) => {
    const { t } = useLanguage();

    return (
    <motion.div
        variants={containerStagger}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-8"
    >
        <StatsCard title={t('statsContained')} value={stats.checkedIn} colorTheme="green" />
        <StatsCard title={t('statsAwol')} value={stats.onLeave} colorTheme="yellow" />
        <StatsCard title={t('statsCaptured')} value={stats.checkedIn + stats.onLeave} total={stats.total} showProgress={true} colorTheme="pink" />
        <StatsCard title={t('statsAtLarge')} value={stats.valid} colorTheme="blue" />
    </motion.div>
)};

export default DashboardStats;
