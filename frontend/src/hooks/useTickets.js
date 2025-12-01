import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTickets, updateTicketStatus, updateTicket, deleteTicket } from '../services/api';

export const useTickets = (eventId, handleApiError) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [connectionError, setConnectionError] = useState(null);

    useEffect(() => {
        if (!eventId) {
            setConnectionStatus('disconnected');
            setTickets([]);
            setIsLoading(false);
            return;
        }

        const fetchTickets = async (isPolling = false) => {
            if (!isPolling) {
                setIsLoading(true);
                setConnectionStatus('connecting');
                setConnectionError(null);
            }

            try {
                const ticketsData = await getTickets(eventId);
                // Safety check
                setTickets(Array.isArray(ticketsData) ? ticketsData : []);
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
            }
        };

        fetchTickets();

        const intervalId = setInterval(() => {
            fetchTickets(true);
        }, 5000);

        return () => clearInterval(intervalId);
    }, [eventId]);

    const handleTicketCreated = useCallback((result) => {
        setTickets(prevTickets => [...prevTickets, result.ticket]);
    }, []);
    
    const handleManualCheckIn = useCallback(async (ticket) => {
        if (!eventId) return;
        try {
            await updateTicketStatus(eventId, ticket.id, 'check-in');
            setTickets((prevTickets) =>
                prevTickets.map((t) =>
                    t.id === ticket.id ? { ...t, status: 'checked-in' } : t
                )
            );
        } catch (err) {
            handleApiError('Manual check-in failed.');
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
        handleManualCheckIn,
        handleUpdateTicket,
        handleDeleteTicket,
        stats
    };
};
