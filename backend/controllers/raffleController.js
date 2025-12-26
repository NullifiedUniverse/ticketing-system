const ticketService = require('../services/ticketService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { db } = require('../firebase'); // Import Firebase DB

// In-Memory Cache (Write-Through)
// eventId -> { status, pool, prizes, currentPrize, winner, animationTrigger, lastUpdated }
const raffleCache = new Map();

const DEFAULT_STATE = {
    status: 'IDLE', // IDLE, READY, DRAWING, REVEALED
    pool: [],
    prizes: [],
    currentPrize: null,
    winner: null,
    animationTrigger: 0,
    lastUpdated: Date.now()
};

class RaffleController {
    
    // Helper: Load from DB or Cache
    async _loadState(eventId) {
        if (raffleCache.has(eventId)) {
            return raffleCache.get(eventId);
        }

        const docRef = db.collection('events_meta').doc(eventId);
        const doc = await docRef.get();
        
        let state = DEFAULT_STATE;
        if (doc.exists && doc.data().raffleState) {
            state = { ...DEFAULT_STATE, ...doc.data().raffleState };
        }

        raffleCache.set(eventId, state);
        return state;
    }

    // Helper: Save to DB and Update Cache
    async _saveState(eventId, updates) {
        const current = await this._loadState(eventId); // Ensure we have base
        const next = { ...current, ...updates, lastUpdated: Date.now() };
        
        // Update Cache
        raffleCache.set(eventId, next);
        
        // Persist to Firestore (merge)
        await db.collection('events_meta').doc(eventId).set({ 
            raffleState: next 
        }, { merge: true });

        return next;
    }

    getState = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const state = await this._loadState(eventId);
        
        res.json({
            status: 'success',
            data: {
                status: state.status,
                prizeCount: state.prizes.length,
                prizes: state.prizes,
                currentPrize: state.currentPrize,
                winner: state.winner,
                animationTrigger: state.animationTrigger,
                poolSize: state.pool.length
            }
        });
    });

    syncAttendees = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        
        // 1. Get all tickets
        const tickets = await ticketService.getTickets(eventId);
        
        // 2. Filter for checked-in users only & valid email
        // Logic: Extract Student ID from email.
        const checkedIn = tickets
            .filter(t => t.status === 'checked-in' && t.attendeeEmail)
            .map(t => {
                const email = t.attendeeEmail.toLowerCase();
                let studentId = email.substring(0, 7);
                
                return {
                    id: t.id,
                    name: t.attendeeName,
                    email: t.attendeeEmail,
                    studentId: studentId.toUpperCase(),
                    maskedId: studentId.toUpperCase()
                };
            });

        await this._saveState(eventId, { pool: checkedIn });

        res.json({ 
            status: 'success', 
            count: checkedIn.length,
            message: `Synced ${checkedIn.length} eligible attendees.` 
        });
    });

    updatePrizes = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const { prizes } = req.body; 

        if (!Array.isArray(prizes)) {
            return next(new AppError('Prizes must be an array.', 400));
        }

        await this._saveState(eventId, { prizes });

        res.json({ status: 'success', count: prizes.length });
    });

    // Add this method to handle image uploads for prizes
    uploadPrizeImage = catchAsync(async (req, res, next) => {
        if (!req.file) return next(new AppError('No file uploaded.', 400));
        res.status(200).json({ status: 'success', filename: req.file.filename });
    });

    drawWinner = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const state = await this._loadState(eventId);

        if (state.pool.length === 0) {
            return next(new AppError('No eligible attendees found. Please sync attendees first.', 400));
        }

        if (state.prizes.length === 0) {
            return next(new AppError('No prizes defined.', 400));
        }

        // 1. Pick Winner
        const randomIndex = Math.floor(Math.random() * state.pool.length);
        const winner = state.pool[randomIndex];

        // 2. Pick Prize
        const prize = state.prizes[0];
        const remainingPrizes = state.prizes.slice(1);

        // 3. Remove Winner from Pool (so they don't win twice)
        const remainingPool = state.pool.filter(p => p.id !== winner.id);

        // 4. Update State
        // Status: REVEALED immediately. The frontend animation will play based on 'animationTrigger'.
        // This allows the Controller to see "Winner Selected" and offer "Next".
        await this._saveState(eventId, {
            status: 'REVEALED',
            winner: winner,
            currentPrize: prize, 
            prizes: remainingPrizes,
            pool: remainingPool,
            animationTrigger: Date.now() 
        });

        res.json({ 
            status: 'success', 
            winner: winner,
            prize: prize
        });
    });

    reset = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        
        await this._saveState(eventId, {
            status: 'IDLE',
            winner: null,
            currentPrize: null,
            animationTrigger: 0
        });

        res.json({ status: 'success', message: 'Raffle state reset to IDLE.' });
    });
}

module.exports = new RaffleController();
