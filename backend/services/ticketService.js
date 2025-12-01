const { db } = require('../firebase');
const { v4: uuidv4 } = require('uuid');

class TicketService {
    // --- EVENT MANAGEMENT ---
    async createEvent(eventId) {
        await this.createEventMetadata(eventId);
        return { id: eventId, name: eventId, createdAt: new Date() };
    }

    async deleteEvent(eventId) {
        // 1. Delete metadata
        await db.collection('events_meta').doc(eventId).delete();

        // 2. Delete all tickets in the event (subcollection)
        const ticketsRef = db.collection('events').doc(eventId).collection('tickets');
        const snapshot = await ticketsRef.get();
        
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // 3. Delete the event document itself
        await db.collection('events').doc(eventId).delete();
    }

    async getEvents() {
        const eventsRef = db.collection('events_meta');
        const snapshot = await eventsRef.get();
        let events = [];
        snapshot.forEach(doc => {
            events.push(doc.data());
        });

        // Fallback: if no metadata found, try to discover from 'events' collection
        // Note: listCollections is an admin SDK method
        if (events.length === 0) {
            try {
                const collections = await db.collection('events').listDocuments();
                if (collections.length > 0) {
                    console.log("Discovered events without metadata. Backfilling...");
                    const discoveredEvents = collections.map(doc => ({
                        id: doc.id,
                        name: doc.id,
                        createdAt: new Date() // Approximate
                    }));
                    
                    // Save them for next time
                    for (const evt of discoveredEvents) {
                        await this.createEventMetadata(evt.id);
                    }
                    events = discoveredEvents;
                }
            } catch (err) {
                console.warn("Could not list documents to discover events:", err);
            }
        }

        return events;
    }

    async createEventMetadata(eventId) {
        const eventRef = db.collection('events_meta').doc(eventId);
        const doc = await eventRef.get();
        if (!doc.exists) {
            await eventRef.set({
                id: eventId,
                createdAt: new Date(),
                name: eventId
            });
        }
    }

    // --- TICKET MANAGEMENT ---
    async createTicket(eventId, ticketData) {
        // Ensure event metadata exists
        await this.createEventMetadata(eventId);

        const { attendeeName, attendeeEmail } = ticketData;
        const ticketId = uuidv4();

        const eventRef = db.collection('events').doc(eventId);
        const ticketRef = eventRef.collection('tickets').doc(ticketId);

        const newTicket = {
            id: ticketId,
            attendeeName,
            attendeeEmail,
            status: 'valid', // valid, checked-in, on-leave
            createdAt: new Date(),
            checkInHistory: [],
        };

        await ticketRef.set(newTicket);
        return newTicket;
    }

    async updateTicketStatus(eventId, ticketId, action, scannedBy) {
        const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            throw new Error("Ticket not found.");
        }

        const ticketData = ticketDoc.data();
        const now = new Date();
        let newStatus = ticketData.status;
        let message = '';

        if (action === 'check-in') {
            if (ticketData.status === 'checked-in') {
                throw new Error('Ticket already checked in.');
            }
            if (ticketData.status !== 'valid' && ticketData.status !== 'on-leave') {
                throw new Error('Ticket cannot be checked in.');
            }
            newStatus = 'checked-in';
            message = `Checked In: ${ticketData.attendeeName}`;
        } else if (action === 'check-out') {
            if (ticketData.status !== 'checked-in') {
                throw new Error('Can only check out an already checked-in ticket.');
            }
            newStatus = 'on-leave';
            message = `On Leave: ${ticketData.attendeeName}`;
        }

        const historyEntry = {
            action,
            timestamp: now,
            scannedBy
        };

        await ticketRef.update({
            status: newStatus,
            checkInHistory: [...ticketData.checkInHistory, historyEntry]
        });

        return { ...ticketData, status: newStatus, message };
    }

    async updateTicket(eventId, ticketId, updateData) {
        const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            throw new Error('Ticket not found');
        }

        await ticketRef.update(updateData);
        return { message: 'Ticket updated successfully.' };
    }

    async deleteTicket(eventId, ticketId) {
        const ticketRef = db.collection('events').doc(eventId).collection('tickets').doc(ticketId);
        const ticketDoc = await ticketRef.get();

        if (!ticketDoc.exists) {
            throw new Error('Ticket not found');
        }

        await ticketRef.delete();
        return { message: 'Ticket deleted successfully.' };
    }

    async getTickets(eventId) {
        const ticketsRef = db.collection('events').doc(eventId).collection('tickets');
        const snapshot = await ticketsRef.get();

        if (snapshot.empty) {
            return [];
        }

        const tickets = [];
        snapshot.forEach(doc => {
            tickets.push(doc.data());
        });
        return tickets;
    }
}

module.exports = new TicketService();
