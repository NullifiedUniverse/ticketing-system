import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTickets, updateTicketStatus, updateTicket, deleteTicket } from '../services/api';

export const useTickets = (eventId, handleApiError) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [connectionError, setConnectionError] = useState(null);
    const [pollingInterval, setPollingInterval] = useState(5000);

    // Adaptive Polling Logic
    useEffect(() => {
        let idleTimer;
        const setActive = () => {
            setPollingInterval(5000);
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => setPollingInterval(30000), 60000); // Go idle after 60s
        };

        window.addEventListener('mousemove', setActive);
        window.addEventListener('keydown', setActive);
        window.addEventListener('click', setActive);
        
        setActive(); // Init

        return () => {
            window.removeEventListener('mousemove', setActive);
            window.removeEventListener('keydown', setActive);
            window.removeEventListener('click', setActive);
            clearTimeout(idleTimer);
        };
    }, []);

    useEffect(() => {
        if (!eventId) {
            setConnectionStatus('disconnected');
            setTickets([]);
            setIsLoading(false);
            setIsSyncing(false);
            return;
        }

        const fetchTickets = async (isPolling = false) => {
            if (!isPolling) {
                setIsLoading(true);
                setConnectionStatus('connecting');
                setConnectionError(null);
            } else {
                setIsSyncing(true);
            }

            try {
                const ticketsData = await getTickets(eventId);
                // Safety check
                const newTickets = Array.isArray(ticketsData) ? ticketsData : [];
                
                setTickets(prev => {
                    // Deep compare to prevent unnecessary re-renders
                    if (JSON.stringify(prev) === JSON.stringify(newTickets)) return prev;
                    return newTickets;
                });

                if (!isPolling) setConnectionStatus('connected');
            } catch (err) {
                console.error("API Error:", err);
                if (!isPolling) {
                    setConnectionStatus('error');
                    setConnectionError(err.message);
                    setTickets([]);
                }
            } finally {
                if (!isPolling) setIsLoading(false);
                else setIsSyncing(false);
            }
        };

        fetchTickets();

        const intervalId = setInterval(() => {
            fetchTickets(true);
        }, pollingInterval);

        return () => clearInterval(intervalId);
    }, [eventId, pollingInterval]);

    const handleTicketCreated = useCallback((result) => {
        setTickets(prevTickets => [...prevTickets, result.ticket]);
    }, []);
    
    const handleManualStatusChange = useCallback(async (ticket, action = 'check-in') => {
        if (!eventId) return;
        try {
            await updateTicketStatus(eventId, ticket.id, action);
            
            // Optimistic Update
            const newStatus = action === 'check-in' ? 'checked-in' : 'on-leave';
            
            setTickets((prevTickets) =>
                prevTickets.map((t) =>
                    t.id === ticket.id ? { ...t, status: newStatus } : t
                )
            );
        } catch (err) {
            handleApiError(`Manual ${action} failed.`);
        }
    }, [eventId, handleApiError]);

    const handleUpdateTicket = useCallback(async (updatedTicket) => {
        try {
            await updateTicket(eventId, updatedTicket.id, updatedTicket);
            setTickets((prevTickets) =>
                prevTickets.map((t) =>
                    t.id === updatedTicket.id ? updatedTicket : t
                )
            );
        } catch (err) {
            handleApiError('Failed to update ticket.');
        }
    }, [eventId, handleApiError]);

    const handleDeleteTicket = useCallback(async (ticket) => {
        try {
            await deleteTicket(eventId, ticket.id);
            setTickets((prevTickets) =>
                prevTickets.filter((t) => t.id !== ticket.id)
            );
        } catch (err) {
            handleApiError('Failed to delete ticket.');
        }
    }, [eventId, handleApiError]);

    const stats = useMemo(() => ({
        total: tickets.length,
        checkedIn: tickets.filter((t) => t.status === 'checked-in').length,
        onLeave: tickets.filter((t) => t.status === 'on-leave').length,
        valid: tickets.filter((t) => t.status === 'valid').length,
    }), [tickets]);

    return {
        tickets,
        isLoading,
        connectionStatus,
        connectionError,
        handleTicketCreated,
        handleManualStatusChange,
        handleUpdateTicket,
        handleDeleteTicket,
        stats,
        isSyncing
    };
};
