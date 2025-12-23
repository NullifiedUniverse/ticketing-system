import { useState, useEffect, useCallback } from 'react';

export const useDashboardPreferences = () => {
    // Layout State
    const [layout, setLayout] = useState(() => {
        try {
            const saved = localStorage.getItem('dashboardLayout');
            return saved ? JSON.parse(saved) : { stats: true, chart: true, scanners: true };
        } catch {
            return { stats: true, chart: true, scanners: true };
        }
    });

    // Search History State
    const [searchHistory, setSearchHistory] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('searchHistory') || '[]');
        } catch {
            return [];
        }
    });

    // Action Stats State
    const [actionStats, setActionStats] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('actionStats') || '{}');
        } catch {
            return {};
        }
    });

    // Persistence Effects
    useEffect(() => {
        localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    }, [layout]);

    const addToSearchHistory = useCallback((term) => {
        setSearchHistory(prev => {
            const newHistory = [term, ...prev.filter(s => s !== term)].slice(0, 5);
            localStorage.setItem('searchHistory', JSON.stringify(newHistory));
            return newHistory;
        });
    }, []);

    const trackAction = useCallback((actionName) => {
        setActionStats(prev => {
            const newStats = { ...prev, [actionName]: (prev[actionName] || 0) + 1 };
            localStorage.setItem('actionStats', JSON.stringify(newStats));
            return newStats;
        });
    }, []);

    return {
        layout,
        setLayout,
        searchHistory,
        addToSearchHistory,
        actionStats,
        trackAction
    };
};
