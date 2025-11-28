import React, { useState, useEffect } from 'react';
import { getEvents } from '../services/api';

const Sidebar = ({ currentEventId, onSelectEvent, onNewEvent }) => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, [currentEventId]); 

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const fetchedEvents = await getEvents();
            setEvents(fetchedEvents);
        } catch (error) {
            console.error("Failed to load events", error);
        } finally {
            setLoading(false);
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
                                <button
                                    key={event.id}
                                    onClick={() => { onSelectEvent(event.id); setIsMobileOpen(false); }}
                                    className={`w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative ${
                                        currentEventId === event.id 
                                        ? 'bg-white/10 text-white font-semibold shadow-lg ring-1 ring-white/10' 
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    {currentEventId === event.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-pink-500 to-purple-500 rounded-r-full"></div>
                                    )}
                                    <span className="truncate block pl-2">
                                        {event.name || event.id}
                                    </span>
                                </button>
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
