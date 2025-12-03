const { db, admin } = require('../firebase');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Service for managing tickets and events.
 * Implements a Read-Through / Write-Through cache strategy with Real-Time Firestore Listeners.
 */
class TicketService {
    constructor() {
        // Cache Structure: Map<eventId, Map<ticketId, ticketData>>
        this.cache = new Map();
        
        // Track listeners to unsubscribe on shutdown/cleanup if needed
        this.listeners = new Map();

        // Performance Metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            writes: 0,
            latencies: [] // Keep last 100 write latencies
        };
    }

    // --- METRICS ---
    recordLatency(ms) {
        this.metrics.latencies.push(ms);
        if (this.metrics.latencies.length > 100) this.metrics.latencies.shift();
    }

    getMetrics() {
        const total = this.metrics.hits + this.metrics.misses;
        const ratio = total === 0 ? 0 : (this.metrics.hits / total * 100).toFixed(2);
        const avgLatency = this.metrics.latencies.length === 0 ? 0 : 
            (this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length).toFixed(2);
        
        return {
            hitRatio: `${ratio}%`,
            totalOps: total,
            writes: this.metrics.writes,
            avgWriteLatencyMs: avgLatency
        };
    }

    // --- CACHE & REAL-TIME SYNC ---

    /**
     * Ensures the cache is initialized for an event.
     * Sets up a real-time listener if one doesn't exist.
     */
    async ensureCache(eventId) {
        if (this.cache.has(eventId) && this.listeners.has(eventId)) {
            return; 
        }

        logger.info(`[Cache] Initializing Real-Time Sync for Event: ${eventId}`);
        
        // 1. Initialize Storage
        if (!this.cache.has(eventId)) {
            this.cache.set(eventId, new Map());
        }

        // 2. Setup Firestore Listener
        const collectionRef = db.collection('events').doc(eventId).collection('tickets');
        
        const unsubscribe = collectionRef.onSnapshot(snapshot => {
            const eventCache = this.cache.get(eventId);
            
            snapshot.docChanges().forEach(change => {
                const ticket = change.doc.data();
                const ticketId = change.doc.id;

                if (change.type === 'added' || change.type === 'modified') {
                    // Update Cache
                    eventCache.set(ticketId, ticket);
                    // logger.debug(`[Sync] Updated ${ticketId} in cache.`);
                }
                if (change.type === 'removed') {
                    eventCache.delete(ticketId);
                    // logger.debug(`[Sync] Removed ${ticketId} from cache.`);
                }
            });
        }, error => {
            logger.error(`[Sync] Listener Error for ${eventId}: ${error.message}`);
        });

        this.listeners.set(eventId, unsubscribe);
        
        // Wait for initial load? onSnapshot fires immediately with current state.
        // However, for the very first request, we might want to ensure data is there.
        // We can trust the listener to populate it very quickly.
        // To be safe for the *very first* synchronous call, we can do a get() if empty.
        if (this.cache.get(eventId).size === 0) {
             const snap = await collectionRef.get();
             snap.forEach(doc => this.cache.get(eventId).set(doc.id, doc.data()));
             logger.info(`[Cache] Pre-loaded ${snap.size} tickets.`);
        }
    }

    /**
     * Retrieves a ticket from the cache (Read-Through).
     */
    getCachedTicket(eventId, ticketId) {
        if (!this.cache.has(eventId)) {
            this.metrics.misses++;
            return null;
        }
        
        const ticket = this.cache.get(eventId).get(ticketId);
        if (ticket) {
            this.metrics.hits++;
        } else {
            this.metrics.misses++;
        }
        return ticket;
    }

    // --- EVENT MANAGEMENT ---

    async createEvent(eventId) {
        await this.createEventMetadata(eventId);
        await this.ensureCache(eventId); // Start sync immediately
        return { id: eventId, name: eventId, createdAt: new Date() };
    }

    async deleteEvent(eventId) {
        // Stop Listener
        if (this.listeners.has(eventId)) {
            this.listeners.get(eventId)(); // Unsubscribe
            this.listeners.delete(eventId);
        }
        this.cache.delete(eventId);

        // DB Deletion
        await db.collection('events_meta').doc(eventId).delete();
        const ticketsRef = db.collection('events').doc(eventId).collection('tickets');
        const snapshot = await ticketsRef.get();
        if (!snapshot.empty) {
            const batch = db.batch();
            snapshot.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
        }
        await db.collection('events').doc(eventId).delete();
    }

    async getEvents() {
        const eventsRef = db.collection('events_meta');
        const snapshot = await eventsRef.get();
        let events = [];
        snapshot.forEach(doc => events.push(doc.data()));
        
        // Pre-warm caches for known events?
        // events.forEach(e => this.ensureCache(e.id)); // Optional: Warm up all on startup
        
        return events;
    }

    async createEventMetadata(eventId) {
        const eventRef = db.collection('events_meta').doc(eventId);
        const doc = await eventRef.get();
        if (!doc.exists) {
            await eventRef.set({ id: eventId, createdAt: new Date(), name: eventId });
        }
    }

    // --- TICKET MANAGEMENT (Write-Through) ---

    async createTicket(eventId, ticketData) {
        await this.ensureCache(eventId);

        const { attendeeName, attendeeEmail } = ticketData;
        const ticketId = uuidv4();
        const start = performance.now();

        const newTicket = {
            id: ticketId,
            attendeeName,
            attendeeEmail,
            status: 'valid',
            createdAt: new Date(),
            checkInHistory: [],
        };

        // Write to DB (Listener will update Cache automatically)
        // But for Write-Through latency, we can also optimistically update cache
        this.cache.get(eventId).set(ticketId, newTicket);

        try {
            await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).set(newTicket);
            this.metrics.writes++;
            this.recordLatency(performance.now() - start);
            return newTicket;
        } catch (error) {
            // Revert cache on failure?
            this.cache.get(eventId).delete(ticketId);
            throw error;
        }
    }

    async createBatch(eventId, attendees) {
        await this.ensureCache(eventId);
        
        // Firestore limits batches to 500 ops
        const CHUNK_SIZE = 450; // Safe margin
        const chunks = [];
        for (let i = 0; i < attendees.length; i += CHUNK_SIZE) {
            chunks.push(attendees.slice(i, i + CHUNK_SIZE));
        }

        let createdCount = 0;
        
        for (const chunk of chunks) {
            const batch = db.batch();
            const ticketRefBase = db.collection('events').doc(eventId).collection('tickets');
            
            const tempCacheUpdates = [];

            chunk.forEach(attendee => {
                if (!attendee.attendeeName) return; // Skip empty rows
                
                const ticketId = uuidv4();
                const newTicket = {
                    id: ticketId,
                    attendeeName: attendee.attendeeName,
                    attendeeEmail: attendee.attendeeEmail || '',
                    status: 'valid',
                    createdAt: new Date(),
                    checkInHistory: []
                };

                const docRef = ticketRefBase.doc(ticketId);
                batch.set(docRef, newTicket);
                
                tempCacheUpdates.push(newTicket);
                createdCount++;
            });

            if (tempCacheUpdates.length > 0) {
                // Optimistic Cache Update
                const eventCache = this.cache.get(eventId);
                tempCacheUpdates.forEach(t => eventCache.set(t.id, t));

                await batch.commit();
                this.metrics.writes += tempCacheUpdates.length;
            }
        }

        return { success: true, count: createdCount };
    }

    async updateTicketStatus(eventId, ticketId, action, scannedBy) {
        await this.ensureCache(eventId);
        
        // Use Firestore Transaction for Atomicity
        // This prevents race conditions if two scanners scan the same ticket simultaneously
        const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
        let finalTicketData = null;
        let message = '';

        await db.runTransaction(async (t) => {
            const doc = await t.get(ticketRef);
            if (!doc.exists) throw new AppError("Ticket not found.", 404);
            
            const ticketData = doc.data();
            const now = new Date();
            let newStatus = ticketData.status;

            if (action === 'check-in') {
                if (ticketData.status === 'checked-in') throw new AppError('Ticket already checked in.', 400);
                if (ticketData.status !== 'valid' && ticketData.status !== 'on-leave') throw new AppError('Ticket cannot be checked in.', 400);
                newStatus = 'checked-in';
                message = `Checked In: ${ticketData.attendeeName}`;
            } else if (action === 'check-out') {
                if (ticketData.status !== 'checked-in') throw new AppError('Can only check out an already checked-in ticket.', 400);
                newStatus = 'on-leave';
                message = `On Leave: ${ticketData.attendeeName}`;
            } else {
                 throw new AppError(`Invalid action: ${action}`, 400);
            }

            const historyEntry = { action, timestamp: now, scannedBy };
            const updatedData = {
                status: newStatus,
                checkInHistory: admin.firestore.FieldValue.arrayUnion(historyEntry)
            };

            t.update(ticketRef, updatedData);
            
            // Prepare return data (cannot rely on doc.data() after update inside txn)
            finalTicketData = { 
                ...ticketData, 
                status: newStatus,
                checkInHistory: [...(ticketData.checkInHistory || []), historyEntry]
            };
        });

        const start = performance.now();

        // Transaction successful -> Update Cache
        // (Ideally the listener would catch this, but optimistic update is faster for UI response)
        if (finalTicketData) {
            this.cache.get(eventId).set(ticketId, finalTicketData);
        }

        this.metrics.writes++;
        this.recordLatency(performance.now() - start);
        
        return { ...finalTicketData, message };
    }

    async updateTicket(eventId, ticketId, updateData) {
        await this.ensureCache(eventId);
        const current = this.getCachedTicket(eventId, ticketId);
        if (!current) throw new AppError('Ticket not found', 404);

        const updated = { ...current, ...updateData };
        const start = performance.now();

        this.cache.get(eventId).set(ticketId, updated);

        await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).update(updateData);
        
        this.metrics.writes++;
        this.recordLatency(performance.now() - start);

        return { message: 'Ticket updated successfully.' };
    }

    async deleteTicket(eventId, ticketId) {
        await this.ensureCache(eventId);
        if (!this.getCachedTicket(eventId, ticketId)) throw new AppError('Ticket not found', 404);

        const start = performance.now();
        
        this.cache.get(eventId).delete(ticketId);
        await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).delete();

        this.metrics.writes++;
        this.recordLatency(performance.now() - start);

        return { message: 'Ticket deleted successfully.' };
    }

    async getTickets(eventId) {
        await this.ensureCache(eventId);
        return Array.from(this.cache.get(eventId).values());
    }

    // --- EMAIL CONFIG (Persistence) ---
    async updateEmailConfig(eventId, configData) {
        // configData: { messageBefore, messageAfter, bgFilename, layoutConfig }
        // We merge this into the existing events_meta doc
        const eventRef = db.collection('events_meta').doc(eventId);
        await eventRef.set({ emailConfig: configData }, { merge: true });
    }

    async getEmailConfig(eventId) {
        const eventRef = db.collection('events_meta').doc(eventId);
        const doc = await eventRef.get();
        if (doc.exists && doc.data().emailConfig) {
            return doc.data().emailConfig;
        }
        return null;
    }

    // --- EMAIL STATUS (Idempotency & DLQ) ---
    async updateEmailStatus(eventId, ticketId, status, error = null) {
        await this.ensureCache(eventId);
        
        const updateData = { 
            emailStatus: status,
            emailLastAttempt: new Date()
        };
        if (error) updateData.emailError = error;

        // Optimistic Cache Update
        const ticket = this.cache.get(eventId).get(ticketId);
        if (ticket) {
            this.cache.get(eventId).set(ticketId, { ...ticket, ...updateData });
        }

        await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).update(updateData);
    }

    async getEmailStatus(eventId, ticketId) {
        const ticket = this.getCachedTicket(eventId, ticketId);
        return ticket ? ticket.emailStatus : null;
    }
}

module.exports = new TicketService();
