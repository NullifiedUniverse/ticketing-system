const Joi = require('joi');
const ticketService = require('../services/ticketService');

const createTicketSchema = Joi.object({
    attendeeName: Joi.string().min(1).required(),
    attendeeEmail: Joi.string().email().required(),
});

const updateTicketStatusSchema = Joi.object({
    action: Joi.string().valid('check-in', 'check-out').required(),
});

const updateTicketStatusParamsSchema = Joi.object({
    eventId: Joi.string().required(),
    ticketId: Joi.string().required(),
});

const updateTicketSchema = Joi.object({
    attendeeName: Joi.string().min(1).required(),
    attendeeEmail: Joi.string().email().required(),
});

const createEventSchema = Joi.object({
    eventId: Joi.string().min(3).required(),
});

class TicketController {
    // --- EVENTS ---
    async createEvent(req, res) {
        try {
            const { error, value } = createEventSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ status: 'error', message: error.details[0].message });
            }
            
            const event = await ticketService.createEvent(value.eventId);
            res.status(201).json({ status: 'success', event });
        } catch (error) {
            console.error("Error creating event:", error);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    }

    async getEvents(req, res) {
        try {
            const events = await ticketService.getEvents();
            res.json({ status: 'success', events });
        } catch (error) {
            console.error("Error getting events:", error);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    }

    // --- TICKETS ---
    async createTicket(req, res) {
        try {
            console.log("Received create ticket request:", req.body);
            const { eventId } = req.params;
            const { error, value } = createTicketSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ status: 'error', message: error.details[0].message });
            }
            
            const ticket = await ticketService.createTicket(eventId, value);
            res.status(201).json({ status: 'success', ticket });
        } catch (error) {
            console.error("Error creating ticket:", error);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    }

    async updateTicketStatus(req, res) {
        const { error: paramsError, value: paramsValue } = updateTicketStatusParamsSchema.validate(req.params);
        if (paramsError) {
            return res.status(400).json({ status: 'error', message: paramsError.details[0].message });
        }
        const { eventId, ticketId } = paramsValue;

        const { error, value } = updateTicketStatusSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: 'error', message: error.details[0].message });
        }
        const { action } = value;

        const scannedBy = (req.user && req.user.scanner) ? 'qr-scanner' : 'admin';

        try {
            const result = await ticketService.updateTicketStatus(eventId, ticketId, action, scannedBy);
            // Optimize Payload: Only return essential data to speed up mobile networks
            const optimizedData = {
                id: result.id,
                attendeeName: result.attendeeName,
                status: result.status,
                message: result.message
            };
            res.json({ status: 'success', message: result.message, data: optimizedData });
        } catch (error) {
            console.error("Status update error:", error.message);
            res.status(400).json({ status: 'error', message: error.message });
        }
    }

    async deleteEvent(req, res) {
        try {
            const { eventId } = req.params;
            await ticketService.deleteEvent(eventId);
            res.json({ status: 'success', message: 'Event deleted successfully' });
        } catch (error) {
            console.error("Error deleting event:", error);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    }

    async updateTicket(req, res) {
        try {
            const { eventId, ticketId } = req.params;
            const { error, value } = updateTicketSchema.validate(req.body);
            if (error) {
                return res.status(400).json({ status: 'error', message: error.details[0].message });
            }

            const result = await ticketService.updateTicket(eventId, ticketId, value);
            res.json({ status: 'success', message: result.message });
        } catch (error) {
            if (error.message === 'Ticket not found') {
                return res.status(404).json({ status: 'error', message: error.message });
            }
            console.error("Error updating ticket:", error);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    }

    async deleteTicket(req, res) {
        try {
            const { eventId, ticketId } = req.params;
            const result = await ticketService.deleteTicket(eventId, ticketId);
            res.json({ status: 'success', message: result.message });
        } catch (error) {
            if (error.message === 'Ticket not found') {
                return res.status(404).json({ status: 'error', message: error.message });
            }
            console.error("Error deleting ticket:", error);
            res.status(500).json({ status: 'error', message: 'Internal Server Error' });
        }
    }

    async getTickets(req, res) {
        const { eventId } = req.params;
        try {
            const tickets = await ticketService.getTickets(eventId);
            res.json(tickets);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async warmupCache(req, res) {
        const { eventId } = req.params;
        try {
            console.log(`[Warmup] Triggered for event: ${eventId}`);
            await ticketService.loadCacheForEvent(eventId);
            res.json({ status: 'success', message: 'Cache warmed' });
        } catch (error) {
            console.error("Warmup error:", error);
            res.status(500).json({ status: 'error', message: 'Warmup failed' });
        }
    }
}

module.exports = new TicketController();