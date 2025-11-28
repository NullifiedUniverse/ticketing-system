
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const AnalyticsDashboard = ({ tickets }) => {
    const analytics = useMemo(() => {
        const history = tickets.flatMap(t => t.checkInHistory || []).filter(h => h.timestamp?.toDate);
        const checkInsByTime = history.filter(h => h.action === 'check-in').reduce((acc, item) => {
            const time = item.timestamp.toDate();
            const intervalStart = new Date(Math.floor(time.getTime() / 300000) * 300000);
            const key = intervalStart.toISOString();
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        const velocityData = Object.entries(checkInsByTime)
            .map(([time, count]) => ({ time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), scans: count }))
            .sort((a, b) => new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time));

        const manualCheckIns = history.filter(t => t.scannedBy === 'manual-admin').length;

        return { velocityData, manualCheckIns, totalScans: history.length };
    }, [tickets]);

    return (
        <motion.div layout className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-gray-900 border border-purple-500/20 p-6 rounded-2xl shadow-lg">
                <h2 className="text-lg font-semibold animated-gradient-text mb-4">Check-in Velocity (Scans per 5 min)</h2>
                {analytics.velocityData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analytics.velocityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #334155', color: '#fff' }} />
                            <Line type="monotone" dataKey="scans" stroke="url(#colorUv)" strokeWidth={2} />
                            <defs>
                                <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8} />
                                </linearGradient>
                            </defs>
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-gray-500">Not enough data for velocity chart.</p>
                    </div>
                )}
            </motion.div>
            <motion.div variants={itemVariants} className="bg-gray-900 border border-purple-500/20 p-6 rounded-2xl shadow-lg flex flex-col justify-center">
                <h2 className="text-lg font-semibold animated-gradient-text">Scan Overview</h2>
                <p className="text-4xl font-bold text-white mt-4">{analytics.totalScans.toLocaleString()}</p>
                <p className="text-gray-400">Total Scans</p>
                <p className="text-2xl font-bold text-white mt-4">{analytics.manualCheckIns.toLocaleString()}</p>
                <p className="text-gray-400">Manual Check-ins</p>
            </motion.div>
        </motion.div>
    );
};

export default AnalyticsDashboard;
