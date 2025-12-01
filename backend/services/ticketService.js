const { db, admin } = require('../firebase');
const { v4: uuidv4 } = require('uuid');

class TicketService {
    constructor() {
        // In-memory cache: Map<eventId, Map<ticketId, ticketData>>
        this.cache = new Map();
    }

    // --- CACHE HELPERS ---
    async loadCacheForEvent(eventId) {
        if (this.cache.has(eventId)) return;

        console.log(`[Cache] Loading event: ${eventId}`);
        const ticketsRef = db.collection('events').doc(eventId).collection('tickets');
        const snapshot = await ticketsRef.get();
        
        const eventTickets = new Map();
        snapshot.forEach(doc => {
            eventTickets.set(doc.id, doc.data());
        });
        
        this.cache.set(eventId, eventTickets);
        console.log(`[Cache] Loaded ${eventTickets.size} tickets for ${eventId}`);
    }

    getCachedTicket(eventId, ticketId) {
        if (!this.cache.has(eventId)) return null;
        return this.cache.get(eventId).get(ticketId);
    }

    updateCachedTicket(eventId, ticketId, newData) {
        if (!this.cache.has(eventId)) return;
        this.cache.get(eventId).set(ticketId, newData);
    }

    removeCachedTicket(eventId, ticketId) {
        if (!this.cache.has(eventId)) return;
        this.cache.get(eventId).delete(ticketId);
    }

    // --- EVENT MANAGEMENT ---
    async createEvent(eventId) {
        await this.createEventMetadata(eventId);
        // Initialize empty cache
        this.cache.set(eventId, new Map());
        return { id: eventId, name: eventId, createdAt: new Date() };
    }

    async deleteEvent(eventId) {
        this.cache.delete(eventId); // Clear cache

        await db.collection('events_meta').doc(eventId).delete();
        const ticketsRef = db.collection('events').doc(eventId).collection('tickets');
        const snapshot = await ticketsRef.get();
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
        await db.collection('events').doc(eventId).delete();
    }

    async getEvents() {
        const eventsRef = db.collection('events_meta');
        const snapshot = await eventsRef.get();
        let events = [];
        snapshot.forEach(doc => events.push(doc.data()));

        // Discovery Fallback (unchanged)
        if (events.length === 0) {
            try {
                const collections = await db.collection('events').listDocuments();
                if (collections.length > 0) {
                    const discoveredEvents = collections.map(doc => ({ id: doc.id, name: doc.id, createdAt: new Date() }));
                    for (const evt of discoveredEvents) await this.createEventMetadata(evt.id);
                    events = discoveredEvents;
                }
            } catch (err) {
                console.warn("Discovery failed:", err);
            }
        }
        return events;
    }

    async createEventMetadata(eventId) {
        const eventRef = db.collection('events_meta').doc(eventId);
        const doc = await eventRef.get();
        if (!doc.exists) {
            await eventRef.set({ id: eventId, createdAt: new Date(), name: eventId });
        }
    }

    // --- TICKET MANAGEMENT ---
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

        await ticketRef.set(newTicket);
        this.updateCachedTicket(eventId, ticketId, newTicket); // Update Cache
        
        return newTicket;
    }

    async updateTicketStatus(eventId, ticketId, action, scannedBy) {
        // 1. Ensure Cache Loaded
        await this.loadCacheForEvent(eventId);

        // 2. Get from Cache (Fast)
        const ticketData = this.getCachedTicket(eventId, ticketId);
        
        if (!ticketData) {
            // Fallback to DB if somehow missing (e.g. created externally)
             const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
             const doc = await ticketRef.get();
             if (!doc.exists) throw new Error("Ticket not found.");
             // Don't update cache here to keep logic simple, rely on load next time or lazy add?
             // Let's just throw for now as cache should be authoritative if loaded.
        }

        const now = new Date();
        let newStatus = ticketData.status;
        let message = '';

        if (action === 'check-in') {
            if (ticketData.status === 'checked-in') throw new Error('Ticket already checked in.');
            if (ticketData.status !== 'valid' && ticketData.status !== 'on-leave') throw new Error('Ticket cannot be checked in.');
            newStatus = 'checked-in';
            message = `Checked In: ${ticketData.attendeeName}`;
        } else if (action === 'check-out') {
            if (ticketData.status !== 'checked-in') throw new Error('Can only check out an already checked-in ticket.');
            newStatus = 'on-leave';
            message = `On Leave: ${ticketData.attendeeName}`;
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
        }).catch(err => console.error(`[Background Write Error] Ticket ${ticketId}:`, err));

        return { ...updatedTicket, message };
    }

    async updateTicket(eventId, ticketId, updateData) {
        await this.loadCacheForEvent(eventId);
        
        const current = this.getCachedTicket(eventId, ticketId);
        if (!current) throw new Error('Ticket not found');

        const updated = { ...current, ...updateData };
        
        await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).update(updateData);
        this.updateCachedTicket(eventId, ticketId, updated); // Update Cache
        
        return { message: 'Ticket updated successfully.' };
    }

    async deleteTicket(eventId, ticketId) {
        await this.loadCacheForEvent(eventId);
        
        if (!this.getCachedTicket(eventId, ticketId)) throw new Error('Ticket not found');

        await db.collection('events').doc(eventId).collection('tickets').doc(ticketId).delete();
        this.removeCachedTicket(eventId, ticketId); // Update Cache
        
        return { message: 'Ticket deleted successfully.' };
    }

    async getTickets(eventId) {
        // 1. Check Cache first
        if (this.cache.has(eventId)) {
            return Array.from(this.cache.get(eventId).values());
        }

        // 2. Load if missing
        await this.loadCacheForEvent(eventId);
        return Array.from(this.cache.get(eventId).values());
    }
}

module.exports = new TicketService();