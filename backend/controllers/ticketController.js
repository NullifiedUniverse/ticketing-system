const Joi = require('joi');
const ticketService = require('../services/ticketService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Validation Schemas
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
    createEvent = catchAsync(async (req, res, next) => {
        const { error, value } = createEventSchema.validate(req.body);
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }
        
        const event = await ticketService.createEvent(value.eventId);
        res.status(201).json({ status: 'success', event });
    });

    getEvents = catchAsync(async (req, res, next) => {
        const events = await ticketService.getEvents();
        res.json({ status: 'success', events });
    });

    deleteEvent = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        await ticketService.deleteEvent(eventId);
        res.json({ status: 'success', message: 'Event deleted successfully' });
    });

    // --- TICKETS ---
    createTicket = catchAsync(async (req, res, next) => {
        logger.debug(`Received create ticket request: ${JSON.stringify(req.body)}`);
        const { eventId } = req.params;
        const { error, value } = createTicketSchema.validate(req.body);
        if (error) {
             return next(new AppError(error.details[0].message, 400));
        }
        
        const ticket = await ticketService.createTicket(eventId, value);
        res.status(201).json({ status: 'success', ticket });
    });

    updateTicketStatus = catchAsync(async (req, res, next) => {
        const start = performance.now();
        const { error: paramsError, value: paramsValue } = updateTicketStatusParamsSchema.validate(req.params);
        if (paramsError) {
             return next(new AppError(paramsError.details[0].message, 400));
        }
        const { eventId, ticketId } = paramsValue;

        const { error, value } = updateTicketStatusSchema.validate(req.body);
        if (error) {
             return next(new AppError(error.details[0].message, 400));
        }
        const { action } = value;

        const scannedBy = (req.user && req.user.scanner) ? 'qr-scanner' : 'admin';

        const dbStart = performance.now();
        const result = await ticketService.updateTicketStatus(eventId, ticketId, action, scannedBy);
        const dbEnd = performance.now();

        // Optimize Payload: Only return essential data to speed up mobile networks
        const optimizedData = {
            id: result.id,
            attendeeName: result.attendeeName,
            status: result.status,
            message: result.message
        };
        
        const end = performance.now();
        logger.info(`[Perf] Total: ${(end - start).toFixed(2)}ms | Logic: ${(dbEnd - dbStart).toFixed(2)}ms | Ticket: ${ticketId}`);
        
        res.json({ status: 'success', message: result.message, data: optimizedData });
    });

    updateTicket = catchAsync(async (req, res, next) => {
        const { eventId, ticketId } = req.params;
        const { error, value } = updateTicketSchema.validate(req.body);
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }

        const result = await ticketService.updateTicket(eventId, ticketId, value);
        res.json({ status: 'success', message: result.message });
    });

    deleteTicket = catchAsync(async (req, res, next) => {
        const { eventId, ticketId } = req.params;
        const result = await ticketService.deleteTicket(eventId, ticketId);
        res.json({ status: 'success', message: result.message });
    });

    getTickets = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const tickets = await ticketService.getTickets(eventId);
        res.json(tickets);
    });

    warmupCache = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        logger.info(`[Warmup] Triggered for event: ${eventId}`);
        await ticketService.loadCacheForEvent(eventId);
        res.json({ status: 'success', message: 'Cache warmed' });
    });

    getMinimalTicketData = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        
        // Ensure cache is hot
        await ticketService.loadCacheForEvent(eventId);
        const tickets = await ticketService.getTickets(eventId);
        
        // Map to minimal array: [id, status, name]
        const minimal = tickets.map(t => ({
            id: t.id,
            s: t.status === 'checked-in' ? 1 : 0, // 1 = Checked In, 0 = Valid
            n: t.attendeeName
        }));
        
        res.json({ status: 'success', data: minimal });
    });
}

module.exports = new TicketController();
