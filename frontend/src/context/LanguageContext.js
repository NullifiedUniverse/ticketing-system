import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    // Default to 'en-dark' (funny)
    const [language, setLanguage] = useState(localStorage.getItem('appLanguage') || 'en-dark');

    useEffect(() => {
        localStorage.setItem('appLanguage', language);
    }, [language]);

    const t = (key, ...args) => {
        const langPack = translations[language] || translations['en-dark'];
        const value = langPack[key];
        
        if (typeof value === 'function') {
            return value(...args);
        }
        return value || key;
    };

    const cycleLanguage = () => {
        setLanguage(prev => {
            if (prev === 'en-dark') return 'en-std';
            if (prev === 'en-std') return 'zh-TW';
            return 'en-dark';
        });
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, cycleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};
