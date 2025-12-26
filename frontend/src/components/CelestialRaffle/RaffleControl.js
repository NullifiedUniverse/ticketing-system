import React, { useState, useEffect, useCallback } from 'react';
import { useEvent } from '../../context/EventContext';
import { 
    getRaffleState, 
    syncRaffleAttendees, 
    updateRafflePrizes, 
    drawRaffleWinner, 
    resetRaffle 
} from '../../services/api';
import { Play, RotateCcw, RefreshCw, Save, Users, Gift, Trophy, Monitor, Image as ImageIcon } from 'lucide-react';
import { defaultPrizes } from './defaultPrizes';
import ImageUploader from './ImageUploader';

const CHANNEL_NAME = 'celestial_raffle_sync_v3';

const RaffleControl = () => {
    const { selectedEvent, loading: contextLoading } = useEvent();
    const [state, setState] = useState(null);
    const [loading, setLoading] = useState(false);
    const [prizesInput, setPrizesInput] = useState(defaultPrizes.join('\n'));
    const [message, setMessage] = useState('');
    const [showImageUploader, setShowImageUploader] = useState(false);
    
    // Local state to simulate "Rolling" visual feedback on the controller
    const [isRolling, setIsRolling] = useState(false);

    const refreshState = useCallback(async () => {
        if (!selectedEvent) return;
        try {
            const data = await getRaffleState(selectedEvent.id);
            setState(data);
        } catch (err) {
            console.error(err);
        }
    }, [selectedEvent]);

    useEffect(() => {
        refreshState();
        const interval = setInterval(refreshState, 2000);
        return () => clearInterval(interval);
    }, [refreshState]);

    // ... (rest of the file) ...

    const handleSync = async () => {
        if (!selectedEvent) return;
        setLoading(true);
        try {
            const res = await syncRaffleAttendees(selectedEvent.id);
            setMessage(res.message);
            await refreshState();
        } catch (err) {
            setMessage("Sync Failed: " + err.message);
        }
        setLoading(false);
    };

    const handleUpdatePrizes = async () => {
        if (!selectedEvent) return;
        setLoading(true);
        try {
            // Parse prizes. Support "Title | Name | image.png" syntax.
            const list = prizesInput.split('\n').filter(p => p.trim().length > 0).map(line => {
                const parts = line.split('|').map(s => s.trim());
                
                // Logic: Detect image by extension
                let image = null;
                const lastPart = parts[parts.length - 1];
                if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(lastPart)) {
                    image = parts.pop();
                }

                // Remaining parts
                let title = "";
                let name = "";

                if (parts.length >= 2) {
                    title = parts[0];
                    name = parts.slice(1).join(' '); // Join rest as name
                } else if (parts.length === 1) {
                    name = parts[0];
                    title = "CONGRATULATIONS"; // Default Title
                }

                if (image || title !== "CONGRATULATIONS") {
                    return { title, name, image };
                }
                return name; // Fallback to simple string if just a name
            });

            await updateRafflePrizes(selectedEvent.id, list);
            setMessage(`Updated ${list.length} prizes.`);
            await refreshState();
        } catch (err) {
            setMessage("Update Failed: " + err.message);
        }
        setLoading(false);
    };

    const handleDraw = async () => {
        if (!selectedEvent) return;
        setLoading(true);
        setIsRolling(true); // Start visual rolling
        try {
            const res = await drawRaffleWinner(selectedEvent.id);
            setMessage(`Winner: ${res.winner.name}`);
            
            // Broadcast for instant local sync
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage({ 
                type: 'START_DRAW', 
                winner: res.winner, 
                prize: res.prize 
            });
            channel.close();

            await refreshState();
            
            // Keep "ROLLING" for 8 seconds to match animation, then allow NEXT
            setTimeout(() => {
                setIsRolling(false);
            }, 8000);

        } catch (err) {
            setMessage("Draw Failed: " + err.message);
            setIsRolling(false); // Reset on error
        }
        setLoading(false);
    };

    const handleReset = async () => {
        if (!selectedEvent) return;
        if (!window.confirm("Reset raffle state? This will clear the current winner display.")) return;
        setLoading(true);
        try {
            await resetRaffle(selectedEvent.id);
            
            const channel = new BroadcastChannel(CHANNEL_NAME);
            channel.postMessage({ type: 'RESET' });
            channel.close();

            setMessage("Raffle Reset.");
            await refreshState();
        } catch (err) {
            setMessage("Reset Failed: " + err.message);
        }
        setLoading(false);
    };

    const openDisplay = () => {
        window.open('#raffle-display', 'RaffleDisplay', 'width=1920,height=1080');
    };

    const onImageUploaded = (filename) => {
        // Append to current prize input line? Or just append to bottom?
        setPrizesInput(prev => {
            const lines = prev.split('\n');
            // If the last line is not empty and doesn't have pipe, append pipe
            if (lines.length > 0 && lines[lines.length - 1].trim() !== '' && !lines[lines.length - 1].includes('|')) {
                lines[lines.length - 1] = `${lines[lines.length - 1]} | ${filename}`;
                return lines.join('\n');
            } else {
                return prev + `\nGrand Prize | New Item | ${filename}`;
            }
        });
    };

    if (contextLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center text-cyan-400 font-mono">
                <div className="animate-pulse">LOADING CONTROL CONSOLE...</div>
            </div>
        );
    }

    if (!selectedEvent) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <h2 className="text-xl font-bold text-white mb-2">No Event Selected</h2>
                <p>Please select an event from the dashboard sidebar to access Raffle Control.</p>
                <button 
                    onClick={() => window.location.hash = '#dashboard'}
                    className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-white transition-colors border border-slate-700"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                            Raffle Control Center
                        </h1>
                        <p className="text-slate-400">Event: {selectedEvent.name}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button 
                            onClick={openDisplay}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold text-cyan-400 border border-slate-700 transition-colors"
                        >
                            <Monitor size={16} /> Open Display
                        </button>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${state?.status === 'IDLE' ? 'bg-slate-700 text-slate-300' : state?.status === 'DRAWING' ? 'bg-blue-600/20 text-blue-400 animate-pulse' : 'bg-green-600/20 text-green-400'}`}>
                            Status: {state?.status || 'Loading...'}
                        </span>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <div className="flex items-center gap-3 mb-2 text-cyan-400">
                            <Users size={20} />
                            <h3 className="font-bold uppercase tracking-wider text-xs">Eligible Candidates</h3>
                        </div>
                        <p className="text-4xl font-black">{state?.poolSize || 0}</p>
                        <button 
                            onClick={handleSync} 
                            disabled={loading}
                            className="mt-4 text-xs flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Sync with Check-ins
                        </button>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <div className="flex items-center gap-3 mb-2 text-amber-400">
                            <Gift size={20} />
                            <h3 className="font-bold uppercase tracking-wider text-xs">Up Next</h3>
                        </div>
                        <div className="mt-2">
                            {state?.prizes?.[0] ? (
                                <>
                                    {state.prizes[0].title && (
                                        <p className="text-xs font-bold text-amber-500/80 tracking-widest uppercase mb-1">
                                            {state.prizes[0].title}
                                        </p>
                                    )}
                                    <p className="text-2xl font-black text-white truncate leading-tight">
                                        {state.prizes[0].name || state.prizes[0]}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-2">
                                        + {Math.max(0, (state?.prizeCount || 0) - 1)} more in queue
                                    </p>
                                </>
                            ) : (
                                <p className="text-slate-500 italic">Queue Empty</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                        <div className="flex items-center gap-3 mb-2 text-purple-400">
                            <Trophy size={20} />
                            <h3 className="font-bold uppercase tracking-wider text-xs">Last Winner</h3>
                        </div>
                        <div className="mt-1">
                            {state?.winner ? (
                                <>
                                    <p className="text-xl font-bold truncate">{state.winner.name}</p>
                                    <p className="text-sm text-slate-500 font-mono">{state.winner.maskedId}</p>
                                    <p className="text-xs text-amber-400 mt-1">
                                        {state.currentPrize?.name || state.currentPrize}
                                    </p>
                                </>
                            ) : (
                                <p className="text-slate-500 italic">No winner yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Prize Management */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-300">Prize Queue</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowImageUploader(!showImageUploader)}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-700"
                                    title="Upload Prize Image"
                                >
                                    <ImageIcon size={14} /> {showImageUploader ? 'Hide Upload' : 'Add Image'}
                                </button>
                                <button 
                                    onClick={handleUpdatePrizes}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs font-bold transition-colors"
                                >
                                    <Save size={14} /> Update Queue
                                </button>
                            </div>
                        </div>

                        {showImageUploader && (
                            <ImageUploader onUploadComplete={onImageUploaded} />
                        )}

                        <textarea
                            value={prizesInput}
                            onChange={(e) => setPrizesInput(e.target.value)}
                            className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-sm text-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all resize-none"
                            placeholder={`Enter prizes, one per line.\nFormats:\n- Prize Name\n- Prize Name | image.png\n- Prize Title | Prize Name | image.png`}
                        />
                        
                        {/* Syntax Helper */}
                        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-xs text-slate-400 space-y-1">
                            <p className="font-bold text-slate-300 mb-1">📝 Prize Format Guide:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                <li>Simple: <code className="bg-slate-900 px-1 rounded text-cyan-400">Prize Name</code></li>
                                <li>With Image: <code className="bg-slate-900 px-1 rounded text-cyan-400">Prize Name | image.png</code></li>
                                <li>With Title: <code className="bg-slate-900 px-1 rounded text-cyan-400">GRAND PRIZE | iPhone 15 | phone.png</code></li>
                            </ul>
                            <p className="mt-2 opacity-75">Upload an image first, then its filename will be auto-appended.</p>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="space-y-6">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 h-full shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 pointer-events-none"></div>
                            
                            <button
                                onClick={handleDraw}
                                disabled={loading || state?.poolSize === 0 || isRolling}
                                className={`relative w-48 h-48 rounded-full text-white shadow-2xl transition-all flex flex-col items-center justify-center gap-2 group-disabled:opacity-50 group-disabled:cursor-not-allowed ${
                                    isRolling ? 'bg-slate-700 cursor-wait' :
                                    state?.winner ? 'bg-gradient-to-br from-purple-500 to-pink-600 hover:shadow-purple-500/50' : 
                                    'bg-gradient-to-br from-cyan-500 to-blue-600 hover:shadow-cyan-500/50'
                                }`}
                            >
                                {isRolling ? (
                                    <>
                                        <RefreshCw size={48} className="animate-spin" />
                                        <span className="font-black tracking-widest text-lg">ROLLING</span>
                                    </>
                                ) : state?.winner ? (
                                    <>
                                        <Play size={48} className="fill-current ml-2" />
                                        <span className="font-black tracking-widest text-lg">NEXT</span>
                                    </>
                                ) : (
                                    <>
                                        <Play size={48} className="fill-current ml-2" />
                                        <span className="font-black tracking-widest text-lg">START</span>
                                    </>
                                )}
                            </button>

                            <div className="flex gap-4 z-10">
                                <button
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-slate-400 hover:text-white transition-colors border border-slate-700"
                                >
                                    <RotateCcw size={18} /> Reset
                                </button>
                            </div>

                            {message && (
                                <div className="absolute bottom-4 left-0 right-0 text-center text-xs text-cyan-400 font-mono animate-pulse">
                                    {message}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RaffleControl;