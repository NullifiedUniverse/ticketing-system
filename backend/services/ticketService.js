const { db, admin } = require('../firebase');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

function generateShortId() {
    return crypto.randomBytes(6).toString('hex');
}

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
        
        // State Tracking
        this.loadingPromises = new Map(); // eventId -> Promise (resolves when initial sync done)
        this.cacheStatus = new Map(); // eventId -> 'init' | 'syncing' | 'ready' | 'error'
        this.alerts = new Map(); // eventId -> Array of Alert Objects
        this.activeScanners = new Map(); // deviceId -> { id, lastSeen, type (LAN/NGROK), scans, eventId }
        this.minimalCache = new Map(); // eventId -> { data: [], timestamp: number }
        
        // Internals for concurrency & cleanup
        this.initializing = new Map(); // Map<eventId, Promise> - locks for ensureCache (value is the loading promise)
        this.lastAccessed = new Map(); // eventId -> timestamp

        // Retry Queue for failed writes
        this.failedWrites = []; 

        // Cleanup Interval (every hour)
        setInterval(() => this.cleanupIdleCaches(), 60 * 60 * 1000);
        
        // Scanner Heartbeat Cleanup (every 30s)
        setInterval(() => this.cleanupInactiveScanners(), 30 * 1000);

        // Retry Queue Processor (every 10s)
        setInterval(() => this.processRetryQueue(), 10 * 1000);

        // Performance Metrics
        this.metrics = {
            hits: 0,
            misses: 0,
            writes: 0,
            retries: 0,
            latencies: [] // Keep last 100 write latencies
        };
    }

    // --- CLEANUP ---
    cleanupInactiveScanners() {
        const now = Date.now();
        for (const [deviceId, scanner] of this.activeScanners.entries()) {
            if (now - scanner.lastSeen > 60000) { // 1 minute timeout
                this.activeScanners.delete(deviceId);
            }
        }
    }

    cleanupIdleCaches() {
        const IDLE_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
        const now = Date.now();
        let cleaned = 0;

        for (const [eventId, lastAccess] of this.lastAccessed.entries()) {
            if (now - lastAccess > IDLE_TIMEOUT) {
                logger.info(`[Cache] Cleaning up idle event: ${eventId}`);
                if (this.listeners.has(eventId)) {
                    this.listeners.get(eventId)(); // Unsubscribe
                    this.listeners.delete(eventId);
                }
                this.cache.delete(eventId);
                this.loadingPromises.delete(eventId);
                this.cacheStatus.delete(eventId);
                this.lastAccessed.delete(eventId);
                this.initializing.delete(eventId);
                cleaned++;
            }
        }
        if (cleaned > 0) logger.info(`[Cache] Cleaned ${cleaned} idle events.`);
    }

    // --- RETRY QUEUE PROCESSING ---
    async processRetryQueue() {
        if (this.failedWrites.length === 0) return;

        const batchSize = 10;
        const currentBatch = this.failedWrites.splice(0, batchSize);
        logger.info(`[Retry] Processing ${currentBatch.length} failed writes...`);

        for (const task of currentBatch) {
            try {
                if (task.type === 'update') {
                    await db.collection('events').doc(task.eventId).collection('tickets').doc(task.ticketId).update(task.data);
                } else if (task.type === 'set') {
                    await db.collection('events').doc(task.eventId).collection('tickets').doc(task.ticketId).set(task.data);
                } else if (task.type === 'delete') {
                    await db.collection('events').doc(task.eventId).collection('tickets').doc(task.ticketId).delete();
                }
                this.metrics.retries++;
                logger.info(`[Retry] Successfully recovered write for ${task.ticketId}`);
            } catch (err) {
                logger.error(`[Retry] Failed again for ${task.ticketId}: ${err.message}`);
                task.attempts = (task.attempts || 0) + 1;
                if (task.attempts < 5) {
                    this.failedWrites.push(task); // Re-queue if attempts < 5
                } else {
                    logger.error(`[Retry] Dropping write for ${task.ticketId} after 5 attempts.`);
                }
            }
        }
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
            retries: this.metrics.retries,
            queueSize: this.failedWrites.length,
            avgWriteLatencyMs: avgLatency,
            activeEvents: this.cache.size
        };
    }

    // --- ALERTS SYSTEM ---
    async reportIssue(eventId, deviceId) {
        if (!this.alerts.has(eventId)) {
            this.alerts.set(eventId, []);
        }
        
        const alert = {
            id: uuidv4(),
            timestamp: Date.now(),
            deviceId: deviceId || 'Unknown Scanner',
            type: 'issue',
            message: 'Scanner Reported Issue'
        };

        const eventAlerts = this.alerts.get(eventId);
        eventAlerts.push(alert);
        
        // Keep only last 50 alerts
        if (eventAlerts.length > 50) eventAlerts.shift();
        
        return alert;
    }

    async getAlerts(eventId, since = 0) {
        const eventAlerts = this.alerts.get(eventId) || [];
        return eventAlerts.filter(a => a.timestamp > since);
    }

    // --- SCANNER TRACKING ---
    async registerScanner(deviceId, eventId, type) {
        const now = Date.now();
        if (!this.activeScanners.has(deviceId)) {
            this.activeScanners.set(deviceId, {
                id: deviceId,
                eventId,
                type, // 'local' or 'ngrok'
                scans: 0,
                lastSeen: now
            });
        } else {
            const scanner = this.activeScanners.get(deviceId);
            scanner.lastSeen = now;
            scanner.eventId = eventId;
            scanner.type = type; // Update type if changed
        }
    }

    getScanners(eventId) {
        const scanners = [];
        for (const scanner of this.activeScanners.values()) {
            if (scanner.eventId === eventId) {
                scanners.push(scanner);
            }
        }
        return scanners;
    }

    async recordScan(deviceId, eventId) {
        if (this.activeScanners.has(deviceId)) {
            const scanner = this.activeScanners.get(deviceId);
            scanner.scans++;
            scanner.lastSeen = Date.now();
        }
    }

    // --- CACHE & REAL-TIME SYNC ---

    /**
     * Ensures the cache is initialized and syncing.
     * Implementing a robust "Double-Check Locking" pattern with Promises for deduplication.
     */
    async ensureCache(eventId) {
        this.lastAccessed.set(eventId, Date.now());

        // 1. Fast Path: If fully ready, return immediately
        if (this.cacheStatus.get(eventId) === 'ready') {
            return;
        }

        // 2. Race Condition Protection: If initializing, wait for the existing promise
        if (this.initializing.has(eventId)) {
            await this.initializing.get(eventId);
            return;
        }

        // 3. Initialization Logic
        logger.info(`[Cache] Initializing Real-Time Sync for Event: ${eventId}`);
        this.cacheStatus.set(eventId, 'init');
        
        if (!this.cache.has(eventId)) {
            this.cache.set(eventId, new Map());
        }

        // Create the Promise that defines the "initializing" state
        const loadPromise = new Promise((resolve, reject) => {
            const collectionRef = db.collection('events').doc(eventId).collection('tickets');
            
            // We use a flag to resolve the promise only on the FIRST snapshot
            let isInitialLoad = true;

            const unsubscribe = collectionRef.onSnapshot(snapshot => {
                const eventCache = this.cache.get(eventId);
                
                // Log large updates
                if (snapshot.docChanges().length > 50) {
                    logger.info(`[Cache] Processing batch update of ${snapshot.docChanges().length} tickets for ${eventId}...`);
                }

                snapshot.docChanges().forEach(change => {
                    const ticket = change.doc.data();
                    const ticketId = change.doc.id;

                    if (change.type === 'added' || change.type === 'modified') {
                        eventCache.set(ticketId, ticket);
                    }
                    if (change.type === 'removed') {
                        eventCache.delete(ticketId);
                    }
                });

                // Resolve promise on first callback (Initial State Synced)
                if (isInitialLoad) {
                    logger.info(`[Cache] Hydration Complete. Total tickets: ${eventCache.size}`);
                    this.cacheStatus.set(eventId, 'ready');
                    isInitialLoad = false;
                    resolve();
                }
            }, error => {
                logger.error(`[Sync] Listener Error for ${eventId}: ${error.message}`);
                this.cacheStatus.set(eventId, 'error');
                if (isInitialLoad) {
                    isInitialLoad = false;
                    reject(error);
                }
            });

            this.listeners.set(eventId, unsubscribe);
        });

        // Store the promise in the lock map
        this.initializing.set(eventId, loadPromise);
        this.loadingPromises.set(eventId, loadPromise);

        try {
            await loadPromise;
        } catch (error) {
            logger.error(`[Cache] Setup failed for ${eventId}: ${error.message}`);
            this.initializing.delete(eventId); // Clear lock
            this.cacheStatus.set(eventId, 'error');
            throw error;
        } finally {
            // Once resolved (success or fail), we can technically remove the "initializing" lock
            // But 'loadingPromises' stays to valid success. 
            this.initializing.delete(eventId);
        }
    }

    /**
     * Waits for the cache to be fully hydrated (used by Dashboard/Exports).
     */
    async loadCacheForEvent(eventId) {
        await this.ensureCache(eventId);
    }

    /**
     * Retrieves a ticket from the cache (Read-Through).
     * Returns undefined if ticket not found in a READY cache.
     * Returns null if cache is not ready/found.
     */
    getCachedTicket(eventId, ticketId) {
        this.lastAccessed.set(eventId, Date.now());

        if (!this.cache.has(eventId)) {
            this.metrics.misses++;
            return null; // Cache miss / Event not loaded
        }
        
        const ticket = this.cache.get(eventId).get(ticketId);
        if (ticket) {
            this.metrics.hits++;
        } else {
            // Check if cache is actually ready. If ready, it's a 404.
            if (this.cacheStatus.get(eventId) === 'ready') {
                 this.metrics.hits++;
            } else {
                this.metrics.misses++;
            }
        }
        return ticket;
    }

    // --- EVENT MANAGEMENT ---

    async createEvent(eventId) {
        await this.createEventMetadata(eventId);
        await this.ensureCache(eventId); 
        return { id: eventId, name: eventId, createdAt: new Date() };
    }

    async deleteEvent(eventId) {
        // Stop Listener
        if (this.listeners.has(eventId)) {
            this.listeners.get(eventId)(); // Unsubscribe
            this.listeners.delete(eventId);
        }
        this.cache.delete(eventId);
        this.loadingPromises.delete(eventId);
        this.cacheStatus.delete(eventId);
        this.initializing.delete(eventId);

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
        const ticketId = generateShortId();
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
        
        // Incremental Minimal Cache Update
        if (this.minimalCache.has(eventId)) {
            const cacheEntry = this.minimalCache.get(eventId);
            cacheEntry.data.push({
                id: ticketId,
                s: 0, // valid
                n: attendeeName
            });
            cacheEntry.timestamp = Date.now();
        }

        // Fire & Forget with Reliability Queue
        db.collection('events').doc(eventId).collection('tickets').doc(ticketId).set(newTicket)
            .then(() => {
                this.metrics.writes++;
                this.recordLatency(performance.now() - start);
            })
            .catch(err => {
                logger.error(`[Reliability] Initial write failed for ${ticketId}. Queuing...`);
                this.failedWrites.push({
                    type: 'set',
                    eventId,
                    ticketId,
                    data: newTicket,
                    attempts: 0
                });
            });

        return newTicket;
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
                
                const ticketId = generateShortId();
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

                // Note: Batches are hard to queue individually if they fail. 
                // We await them here as bulk imports are usually critical.
                try {
                    await batch.commit();
                    this.metrics.writes += tempCacheUpdates.length;
                } catch (err) {
                    logger.error(`[Batch] Batch write failed!`);
                    // In a real system, we might queue the whole batch buffer, 
                    // but for now, we throw to alert the user.
                    throw err; 
                }
            }
        }
        
        this.minimalCache.delete(eventId); // Invalidate View Cache
        return { success: true, count: createdCount };
    }

    /**
     * Updates ticket status with an Optimistic "Fire-and-Forget" strategy.
     * RELIABILITY UPGRADE: Now uses an in-memory retry queue for failures.
     */
    async updateTicketStatus(eventId, ticketId, action, scannedBy) {
        // Ensure cache is initialized (non-blocking check if already warm)
        await this.ensureCache(eventId);
        
        // 1. FAST VALIDATION (In-Memory)
        let ticketData = this.getCachedTicket(eventId, ticketId);

        // Cold Cache Fallback
        if (!ticketData) {
            const doc = await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).get();
            if (!doc.exists) throw new AppError("Ticket not found.", 404);
            ticketData = doc.data();
            if (this.cache.has(eventId)) {
                this.cache.get(eventId).set(ticketId, ticketData);
            }
        }

        // 2. LOGIC CHECK
        let newStatus = ticketData.status;
        let message = '';

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

        // 3. UPDATE
        const now = new Date();
        const historyEntry = { action, timestamp: now, scannedBy };
        
        const updatedTicketData = { 
            ...ticketData, 
            status: newStatus,
            checkInHistory: [...(ticketData.checkInHistory || []), historyEntry]
        };
        
        // Optimistic Cache Update
        if (this.cache.has(eventId)) {
            this.cache.get(eventId).set(ticketId, updatedTicketData);
        }
        
        // Incremental Minimal Cache Update
        if (this.minimalCache.has(eventId)) {
            const cacheEntry = this.minimalCache.get(eventId);
            const minimalTicket = cacheEntry.data.find(t => t.id === ticketId);
            if (minimalTicket) {
                minimalTicket.s = newStatus === 'checked-in' ? 1 : 0;
                cacheEntry.timestamp = Date.now();
            } else {
                this.minimalCache.delete(eventId);
            }
        }

        // 4. PERSIST (Reliable Fire-and-Forget)
        const updatePayload = {
            status: newStatus,
            checkInHistory: admin.firestore.FieldValue.arrayUnion(historyEntry)
        };

        const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
        
        ticketRef.update(updatePayload).catch(err => {
            logger.error(`[Reliability] Status update failed for ${ticketId}. Queuing...`);
            this.failedWrites.push({
                type: 'update',
                eventId,
                ticketId,
                data: updatePayload,
                attempts: 0
            });
        });
        
        return { ...updatedTicketData, message };
    }

    async updateTicket(eventId, ticketId, updateData) {
        await this.ensureCache(eventId);
        const current = this.getCachedTicket(eventId, ticketId);
        if (!current) throw new AppError('Ticket not found', 404);

        const updated = { ...current, ...updateData };
        const start = performance.now();

        this.cache.get(eventId).set(ticketId, updated);
        
        // Incremental Minimal Cache Update
        if (this.minimalCache.has(eventId)) {
            const cacheEntry = this.minimalCache.get(eventId);
            const minimalTicket = cacheEntry.data.find(t => t.id === ticketId);
            if (minimalTicket && updateData.attendeeName) {
                minimalTicket.n = updateData.attendeeName;
                cacheEntry.timestamp = Date.now();
            }
        }

        // Reliable Update
        db.collection('events').doc(eventId).collection('tickets').doc(ticketId).update(updateData)
            .then(() => {
                this.metrics.writes++;
                this.recordLatency(performance.now() - start);
            })
            .catch(err => {
                logger.error(`[Reliability] Update failed for ${ticketId}. Queuing...`);
                this.failedWrites.push({
                    type: 'update',
                    eventId,
                    ticketId,
                    data: updateData,
                    attempts: 0
                });
            });

        return { message: 'Ticket updated successfully.' };
    }

    async deleteTicket(eventId, ticketId) {
        await this.ensureCache(eventId);
        if (!this.getCachedTicket(eventId, ticketId)) throw new AppError('Ticket not found', 404);

        const start = performance.now();
        
        this.cache.get(eventId).delete(ticketId);
        
        // Incremental Minimal Cache Update
        if (this.minimalCache.has(eventId)) {
            const cacheEntry = this.minimalCache.get(eventId);
            cacheEntry.data = cacheEntry.data.filter(t => t.id !== ticketId);
            cacheEntry.timestamp = Date.now();
        }
        
        db.collection('events').doc(eventId).collection('tickets').doc(ticketId).delete()
            .then(() => {
                this.metrics.writes++;
                this.recordLatency(performance.now() - start);
            })
            .catch(err => {
                logger.error(`[Reliability] Delete failed for ${ticketId}. Queuing...`);
                this.failedWrites.push({
                    type: 'delete',
                    eventId,
                    ticketId,
                    attempts: 0
                });
            });

        return { message: 'Ticket deleted successfully.' };
    }

    async getTickets(eventId) {
        // Ensure we wait for the full list before returning
        await this.loadCacheForEvent(eventId);
        return Array.from(this.cache.get(eventId).values());
    }

    async getMinimalTickets(eventId) {
        await this.ensureCache(eventId);
        
        // Return cached view if available
        if (this.minimalCache.has(eventId)) {
            return this.minimalCache.get(eventId).data;
        }

        const tickets = Array.from(this.cache.get(eventId).values());
        const minimal = tickets.map(t => ({
            id: t.id,
            s: t.status === 'checked-in' ? 1 : 0,
            n: t.attendeeName
        }));

        this.minimalCache.set(eventId, { data: minimal, timestamp: Date.now() });
        return minimal;
    }

    // --- EMAIL CONFIG (Persistence) ---
    async updateEmailConfig(eventId, configData) {
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
