
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const AnalyticsChart = ({ tickets }) => {
    const { t } = useLanguage();

    // 1. Process Data
    if (!tickets || !Array.isArray(tickets)) {
        return (
             <div className="h-64 flex items-center justify-center text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                No data available
            </div>
        );
    }
    
    // Get all check-in timestamps
    const checkIns = tickets.flatMap(t => {
        if (!t.checkInHistory || t.checkInHistory.length === 0) return [];
        // Filter for 'check-in' actions only
        return t.checkInHistory
            .filter(h => h.action === 'check-in')
            .map(h => {
                const date = h.timestamp._seconds ? new Date(h.timestamp._seconds * 1000) : new Date(h.timestamp);
                return date;
            });
    }).sort((a, b) => a - b);

    if (checkIns.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-500 bg-white/5 rounded-2xl border border-white/5">
                No check-in data available yet
            </div>
        );
    }

    // 2. Binning (e.g., by 15 minute intervals)
    const binSize = 15 * 60 * 1000; // 15 mins
    const dataMap = new Map();

    if (checkIns.length > 0) {
        const start = new Date(Math.floor(checkIns[0].getTime() / binSize) * binSize);
        const end = new Date(Math.ceil(checkIns[checkIns.length - 1].getTime() / binSize) * binSize);

        // Initialize bins
        for (let t = start.getTime(); t <= end.getTime(); t += binSize) {
            dataMap.set(t, 0);
        }

        // Fill bins
        checkIns.forEach(d => {
            const bin = Math.floor(d.getTime() / binSize) * binSize;
            dataMap.set(bin, (dataMap.get(bin) || 0) + 1);
        });
    }

    // 3. Format for Recharts
    const data = Array.from(dataMap.entries()).map(([time, count]) => ({
        time: new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count: count
    }));

    return (
        <div className="h-72 w-full bg-gradient-to-b from-gray-900/50 to-transparent border border-white/5 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 opacity-20"></div>
            <h3 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6 pl-2 border-l-4 border-purple-500">{t('chartTitle')}</h3>
            
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis 
                        dataKey="time" 
                        stroke="#6b7280" 
                        tick={{fill: '#9ca3af', fontSize: 12}} 
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis 
                        stroke="#6b7280" 
                        tick={{fill: '#9ca3af', fontSize: 12}} 
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#a78bfa' }}
                        cursor={{ stroke: '#ffffff20', strokeWidth: 2 }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorCount)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default AnalyticsChart;
