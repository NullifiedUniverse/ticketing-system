import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getEvents } from '../services/api';

const EventContext = createContext();

export const useEvent = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvent must be used within an EventProvider');
    }
    return context;
};

export const EventProvider = ({ children }) => {
    const [eventId, setEventId] = useState(localStorage.getItem('lastEventId') || null);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const fetchedEvents = await getEvents();
            // Sort by most recent
            const sorted = fetchedEvents.sort((a, b) => {
                 const getTime = (t) => {
                     if (!t) return 0;
                     if (t._seconds) return t._seconds * 1000;
                     if (t.seconds) return t.seconds * 1000; 
                     return new Date(t).getTime();
                 };
                 return getTime(b.createdAt) - getTime(a.createdAt);
            });
            setEvents(sorted);
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents, refreshTrigger]);

    const selectEvent = (id) => {
        setEventId(id);
        if (id) {
            localStorage.setItem('lastEventId', id);
        } else {
            localStorage.removeItem('lastEventId');
        }
    };

    const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

    const selectedEvent = events.find(e => e.id === eventId) || null;

    const value = {
        eventId,
        selectEvent,
        selectedEvent,
        events,
        loading,
        triggerRefresh,
        fetchEvents
    };

    return (
        <EventContext.Provider value={value}>
            {children}
        </EventContext.Provider>
    );
};
