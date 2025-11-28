import React, { useState, useEffect } from 'react';
import { getEvents, deleteEvent } from '../services/api';

const Sidebar = ({ currentEventId, onSelectEvent, onNewEvent, refreshTrigger }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [currentEventId, refreshTrigger]); 

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const fetchedEvents = await getEvents();
            // Sort by most recent
            const sorted = fetchedEvents.sort((a, b) => {
                 const getTime = (t) => {
                     if (!t) return 0;
                     if (t._seconds) return t._seconds * 1000;
                     if (t.seconds) return t.seconds * 1000; // Firebase timestamp standard
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
    };

    const handleDelete = async (e, eventId) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete event "${eventId}"? This action cannot be undone.`)) {
            try {
                await deleteEvent(eventId);
                if (currentEventId === eventId) {
                    onSelectEvent(null);
                }
                // Force a small delay to ensure backend consistency
                setTimeout(fetchEvents, 500);
            } catch (error) {
                alert("Failed to delete event: " + error.message);
            }
        }
    };

    return (
        <>
             {/* Mobile Toggle */}
            <div className="xl:hidden fixed top-4 left-4 z-50">
                <button 
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="bg-gray-900/80 backdrop-blur text-white p-2.5 rounded-xl border border-gray-700 shadow-lg active:scale-95 transition-transform"
                >
                    {isMobileOpen ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    )}
                </button>
            </div>

            {/* Sidebar Container */}
            <div 
                className={`fixed inset-y-0 left-0 z-40 w-72 bg-gray-950/90 backdrop-blur-xl border-r border-white/5 transform transition-transform duration-300 ease-out xl:translate-x-0 ${isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}
            >
                <div className="p-6 flex flex-col h-full relative overflow-hidden">
                    {/* Decorative Gradient Blob */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-purple-600/20 blur-3xl -z-10 pointer-events-none"></div>

                    <div className="mb-8 mt-2">
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg flex items-center justify-center text-lg">🎫</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">TicketControl</span>
                        </h1>
                    </div>

                    <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                            Your Events
                        </h3>
                        
                        {loading && (
                            <div className="flex justify-center py-4">
                                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}

                        <div className="space-y-1">
                            {events.map((event) => (
                                <div 
                                    key={event.id}
                                    className="relative group flex items-center"
                                >
                                    <button
                                        onClick={() => { onSelectEvent(event.id); setIsMobileOpen(false); }}
                                        className={`flex-grow text-left px-4 py-3.5 rounded-xl transition-all duration-200 relative ${
                                            currentEventId === event.id 
                                            ? 'bg-white/10 text-white font-semibold shadow-lg ring-1 ring-white/10' 
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        {currentEventId === event.id && (
                                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-r-full"></div>
                                        )}
                                        <span className="truncate block pl-2 pr-8">
                                            {event.name || event.id}
                                        </span>
                                    </button>

                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => handleDelete(e, event.id)}
                                        className="absolute right-2 z-20 p-2 text-gray-400 hover:text-white hover:bg-red-600/80 rounded-lg transition-colors"
                                        title="Delete Event"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-white/5">
                        <button
                            onClick={onNewEvent}
                            className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-800 hover:to-gray-800 text-white py-3.5 px-4 rounded-xl transition-all border border-gray-700 hover:border-gray-600 shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <span className="text-xl font-light relative z-10 leading-none pb-1">+</span>
                            <span className="font-medium relative z-10">Create Event</span>
                        </button>
                    </div>
                </div>
            </div>
            
            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
