import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseConfig, API_KEY, API_BASE_URL } from './config';
import Header from './components/Header';
import EventSelector from './components/EventSelector';
import DashboardStats from './components/DashboardStats';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import CreateTicket from './components/CreateTicket';
import TicketList from './components/TicketList';
import Modal from './components/Modal';
import './App.css';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Framer Motion Variants ---
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

// --- Main App Component ---
function App() {
    const [eventId, setEventId] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [connectionError, setConnectionError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [eventHistory, setEventHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('eventHistory');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem('eventHistory', JSON.stringify(eventHistory));
    }, [eventHistory]);

    const handleSetEventId = useCallback((newEventId) => {
        setEventId(newEventId);
        if (newEventId && !eventHistory.includes(newEventId)) {
            setEventHistory((prev) => [newEventId, ...prev.filter((id) => id !== newEventId)].slice(0, 5));
        }
    }, [eventHistory]);

    useEffect(() => {
        if (!eventId) {
            setConnectionStatus('disconnected');
            setTickets([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setConnectionStatus('connecting');
        setConnectionError(null);

        const ticketsCollectionRef = collection(db, `events/${eventId}/tickets`);
        const unsubscribe = onSnapshot(ticketsCollectionRef, (snapshot) => {
            const ticketsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setTickets(ticketsData);
            setIsLoading(false);
            setConnectionStatus('connected');
            setConnectionError(null);
        }, (err) => {
            console.error("Firebase Snapshot Error:", err);
            setConnectionStatus('error');
            setConnectionError(err.message);
            setIsLoading(false);
            setTickets([]);
        });

        return () => unsubscribe();
    }, [eventId]);

    const handleApiError = useCallback((message) => setModalContent({ type: 'alert', title: 'API Error', body: message }), []);

    const handleTicketCreated = useCallback((result) => {
        showTicketQR(result.ticket.id, result.ticket.attendeeName);
    }, []);

    const showTicketQR = useCallback((ticketId, attendeeName) => {
        setModalContent({
            type: 'qr-code',
            title: 'Ticket QR Code',
            body: `QR Code for ${attendeeName}`,
            qrValue: ticketId,
        });
    }, []);

    const handleManualCheckIn = useCallback((ticket) => {
        setModalContent({
            type: 'confirm',
            title: 'Manual Check-In',
            body: `Are you sure you want to check in ${ticket.attendeeName}?`,
            onConfirm: async () => {
                if (!eventId) return;
                const ticketRef = doc(db, `events/${eventId}/tickets`, ticket.id);
                try {
                    await updateDoc(ticketRef, {
                        status: 'checked-in',
                        checkInHistory: [...(ticket.checkInHistory || []), { action: 'check-in', timestamp: new Date(), scannedBy: 'manual-admin' }],
                    });
                } catch (err) {
                    handleApiError('Manual check-in failed in the database.');
                }
            },
        });
    }, [eventId, handleApiError]);

    const generateSetupQR = () => {
        if (!eventId) {
            handleApiError("Please load an event first.");
            return;
        }
        const config = { eventId, apiKey: API_KEY, apiBaseUrl: API_BASE_URL };
        setModalContent({
            type: 'setup-qr',
            title: 'Scanner Setup Code',
            body: `Event: ${eventId}. Volunteers scan this to configure their device.`,
            qrValue: JSON.stringify(config),
        });
    };

    const stats = useMemo(() => ({
        total: tickets.length,
        checkedIn: tickets.filter((t) => t.status === 'checked-in').length,
        onLeave: tickets.filter((t) => t.status === 'on-leave').length,
        valid: tickets.filter((t) => t.status === 'valid').length,
    }), [tickets]);

    const filteredTickets = useMemo(() =>
        tickets.filter(
            (ticket) =>
                (ticket.attendeeName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (ticket.attendeeEmail?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
        ), [tickets, searchTerm]);

    return (
        <>
            <Modal isOpen={!!modalContent} onClose={() => setModalContent(null)} content={modalContent} />

            <div className="bg-black text-gray-100 min-h-screen font-sans p-4 sm:p-6 lg:p-8 animated-gradient-text-container">
                <div className="max-w-7xl mx-auto">
                    <Header eventId={eventId} connectionStatus={connectionStatus} connectionError={connectionError} />
                    <EventSelector onEventSelect={handleSetEventId} eventHistory={eventHistory} onShowSetupQR={generateSetupQR} />

                    {eventId && !isLoading && (
                        <AnimatePresence>
                            <motion.div variants={containerVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                                <DashboardStats stats={stats} />
                                <AnimatePresence> {tickets.length > 0 && <AnalyticsDashboard tickets={tickets} />} </AnimatePresence>
                                <motion.div variants={itemVariants}>
                                    <CreateTicket eventId={eventId} onTicketCreated={handleTicketCreated} onApiError={handleApiError} />
                                </motion.div>
                                <TicketList
                                    filteredTickets={filteredTickets}
                                    isLoading={isLoading}
                                    searchTerm={searchTerm}
                                    setSearchTerm={setSearchTerm}
                                    onCheckIn={handleManualCheckIn}
                                    onShowQR={showTicketQR}
                                />
                            </motion.div>
                        </AnimatePresence>
                    )}

                    {isLoading && eventId && (
                        <div className="flex justify-center items-center h-64">
                            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default App;