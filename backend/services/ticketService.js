const { db, admin } = require('../firebase');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

/**
 * Service for managing tickets and events.
 * Includes an in-memory cache to optimize read/scan operations.
 */
class TicketService {
    constructor() {
        // In-memory cache: Map<eventId, Map<ticketId, ticketData>>
        this.cache = new Map();
    }

    /**
     * Loads tickets for an event into the in-memory cache.
     * @param {string} eventId 
     */
    async loadCacheForEvent(eventId) {
        if (this.cache.has(eventId)) return;

        logger.debug(`[Cache] Loading event: ${eventId}`);
        try {
            const ticketsRef = db.collection('events').doc(eventId).collection('tickets');
            const snapshot = await ticketsRef.get();
            
            const eventTickets = new Map();
            snapshot.forEach(doc => {
                eventTickets.set(doc.id, doc.data());
            });
            
            this.cache.set(eventId, eventTickets);
            logger.info(`[Cache] Loaded ${eventTickets.size} tickets for ${eventId}`);
        } catch (error) {
            logger.error(`[Cache] Failed to load event ${eventId}: ${error.message}`);
            throw new AppError('Failed to load ticket cache', 500);
        }
    }

    /**
     * Retrieves a ticket from the cache.
     * @param {string} eventId 
     * @param {string} ticketId 
     * @returns {Object|null}
     */
    getCachedTicket(eventId, ticketId) {
        if (!this.cache.has(eventId)) return null;
        return this.cache.get(eventId).get(ticketId);
    }

    /**
     * Updates a ticket in the cache.
     * @param {string} eventId 
     * @param {string} ticketId 
     * @param {Object} newData 
     */
    updateCachedTicket(eventId, ticketId, newData) {
        if (!this.cache.has(eventId)) return;
        this.cache.get(eventId).set(ticketId, newData);
    }

    /**
     * Removes a ticket from the cache.
     * @param {string} eventId 
     * @param {string} ticketId 
     */
    removeCachedTicket(eventId, ticketId) {
        if (!this.cache.has(eventId)) return;
        this.cache.get(eventId).delete(ticketId);
    }

    // --- EVENT MANAGEMENT ---

    /**
     * Creates a new event.
     * @param {string} eventId 
     * @returns {Promise<Object>}
     */
    async createEvent(eventId) {
        try {
            await this.createEventMetadata(eventId);
            // Initialize empty cache
            this.cache.set(eventId, new Map());
            logger.info(`Event created: ${eventId}`);
            return { id: eventId, name: eventId, createdAt: new Date() };
        } catch (error) {
            logger.error(`Error creating event ${eventId}: ${error.message}`);
            throw new AppError('Could not create event', 500);
        }
    }

    /**
     * Deletes an event and all its tickets.
     * @param {string} eventId 
     */
    async deleteEvent(eventId) {
        try {
            this.cache.delete(eventId); // Clear cache

            await db.collection('events_meta').doc(eventId).delete();
            
            const ticketsRef = db.collection('events').doc(eventId).collection('tickets');
            const snapshot = await ticketsRef.get();
            
            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.docs.forEach((doc) => batch.delete(doc.ref));
                await batch.commit();
            }
            
            await db.collection('events').doc(eventId).delete();
            logger.info(`Event deleted: ${eventId}`);
        } catch (error) {
            logger.error(`Error deleting event ${eventId}: ${error.message}`);
            throw new AppError('Could not delete event', 500);
        }
    }

    /**
     * Retrieves all events.
     * @returns {Promise<Array>}
     */
    async getEvents() {
        try {
            const eventsRef = db.collection('events_meta');
            const snapshot = await eventsRef.get();
            let events = [];
            snapshot.forEach(doc => events.push(doc.data()));

            // Discovery Fallback
            if (events.length === 0) {
                logger.warn("No metadata found. Attempting discovery fallback.");
                try {
                    const collections = await db.collection('events').listDocuments();
                    if (collections.length > 0) {
                        const discoveredEvents = collections.map(doc => ({ id: doc.id, name: doc.id, createdAt: new Date() }));
                        for (const evt of discoveredEvents) await this.createEventMetadata(evt.id);
                        events = discoveredEvents;
                        logger.info(`Discovered and registered ${events.length} events.`);
                    }
                } catch (err) {
                    logger.warn("Discovery failed:", err);
                }
            }
            return events;
        } catch (error) {
            logger.error(`Error getting events: ${error.message}`);
            throw new AppError('Could not retrieve events', 500);
        }
    }

    /**
     * Helper to create event metadata.
     * @param {string} eventId 
     */
    async createEventMetadata(eventId) {
        const eventRef = db.collection('events_meta').doc(eventId);
        const doc = await eventRef.get();
        if (!doc.exists) {
            await eventRef.set({ id: eventId, createdAt: new Date(), name: eventId });
        }
    }

    // --- TICKET MANAGEMENT ---

    /**
     * Creates a new ticket for an event.
     * @param {string} eventId 
     * @param {Object} ticketData 
     * @returns {Promise<Object>}
     */
    async createTicket(eventId, ticketData) {
        // Ensure cache is loaded to avoid state drift
        await this.loadCacheForEvent(eventId);

        const { attendeeName, attendeeEmail } = ticketData;
        const ticketId = uuidv4();

        const eventRef = db.collection('events').doc(eventId);
        const ticketRef = eventRef.collection('tickets').doc(ticketId);

        const newTicket = {
            id: ticketId,
            attendeeName,
            attendeeEmail,
            status: 'valid',
            createdAt: new Date(),
            checkInHistory: [],
        };

        try {
            await ticketRef.set(newTicket);
            this.updateCachedTicket(eventId, ticketId, newTicket); // Update Cache
            logger.info(`Ticket created: ${ticketId} for event ${eventId}`);
            return newTicket;
        } catch (error) {
            logger.error(`Error creating ticket: ${error.message}`);
            throw new AppError('Could not create ticket', 500);
        }
    }

    /**
     * Updates the status of a ticket (check-in/check-out).
     * @param {string} eventId 
     * @param {string} ticketId 
     * @param {string} action 
     * @param {string} scannedBy 
     * @returns {Promise<Object>}
     */
    async updateTicketStatus(eventId, ticketId, action, scannedBy) {
        // 1. Ensure Cache Loaded
        const startLoad = performance.now();
        await this.loadCacheForEvent(eventId);
        const endLoad = performance.now();

        if (endLoad - startLoad > 100) {
            logger.warn(`[Perf Warning] Cache Load took ${(endLoad - startLoad).toFixed(2)}ms`);
        }

        // 2. Get from Cache (Fast)
        let ticketData = this.getCachedTicket(eventId, ticketId);
        
        if (!ticketData) {
            logger.warn(`[Perf] Cache miss for ${ticketId}. Fallback to DB.`);
            // Fallback to DB
            try {
                const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
                const doc = await ticketRef.get();
                if (!doc.exists) throw new AppError("Ticket not found.", 404);
                // Note: We aren't updating cache here to keep "single source of truth" logic simple for now.
                // Ideally we should add it to cache.
                ticketData = doc.data();
            } catch (error) {
                throw new AppError("Ticket not found.", 404);
            }
        }

        const now = new Date();
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

        const historyEntry = { action, timestamp: now, scannedBy };
        
        // 3. Update Cache Immediately
        const updatedTicket = {
            ...ticketData,
            status: newStatus,
            checkInHistory: [...(ticketData.checkInHistory || []), historyEntry]
        };
        this.updateCachedTicket(eventId, ticketId, updatedTicket);

        // 4. Background DB Write
        const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
        ticketRef.update({
            status: newStatus,
            checkInHistory: admin.firestore.FieldValue.arrayUnion(historyEntry)
        }).catch(err => logger.error(`[Background Write Error] Ticket ${ticketId}: ${err.message}`));
        
        return { ...updatedTicket, message };
    }

    /**
     * Updates arbitrary ticket data.
     * @param {string} eventId 
     * @param {string} ticketId 
     * @param {Object} updateData 
     * @returns {Promise<Object>}
     */
    async updateTicket(eventId, ticketId, updateData) {
        await this.loadCacheForEvent(eventId);
        
        const current = this.getCachedTicket(eventId, ticketId);
        if (!current) throw new AppError('Ticket not found', 404);

        const updated = { ...current, ...updateData };
        
        try {
            await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).update(updateData);
            this.updateCachedTicket(eventId, ticketId, updated); // Update Cache
            return { message: 'Ticket updated successfully.' };
        } catch (error) {
             logger.error(`Error updating ticket ${ticketId}: ${error.message}`);
             throw new AppError('Could not update ticket', 500);
        }
    }

    /**
     * Deletes a ticket.
     * @param {string} eventId 
     * @param {string} ticketId 
     * @returns {Promise<Object>}
     */
    async deleteTicket(eventId, ticketId) {
        await this.loadCacheForEvent(eventId);
        
        if (!this.getCachedTicket(eventId, ticketId)) throw new AppError('Ticket not found', 404);

        try {
            await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).delete();
            this.removeCachedTicket(eventId, ticketId); // Update Cache
            return { message: 'Ticket deleted successfully.' };
        } catch (error) {
             logger.error(`Error deleting ticket ${ticketId}: ${error.message}`);
             throw new AppError('Could not delete ticket', 500);
        }
    }

    /**
     * Gets all tickets for an event.
     * @param {string} eventId 
     * @returns {Promise<Array>}
     */
    async getTickets(eventId) {
        // 1. Check Cache first
        if (this.cache.has(eventId)) {
            return Array.from(this.cache.get(eventId).values());
        }

        // 2. Load if missing
        await this.loadCacheForEvent(eventId);
        // 3. Return from cache
        if (this.cache.has(eventId)) {
             return Array.from(this.cache.get(eventId).values());
        }
        
        return [];
    }
}

module.exports = new TicketService();