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

        if (req.deviceId && scannedBy === 'qr-scanner') {
            await ticketService.recordScan(req.deviceId, eventId);
        }

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
        
        // Use optimized View Cache from Service
        const minimal = await ticketService.getMinimalTickets(eventId);
        
        res.json({ status: 'success', data: minimal });
    });

    importAttendees = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const attendees = req.body; // Expects JSON array: [{ attendeeName, attendeeEmail }, ...]

        if (!Array.isArray(attendees) || attendees.length === 0) {
            return next(new AppError('Invalid or empty attendee list.', 400));
        }

        logger.info(`[Import] Starting batch import for ${eventId}. Count: ${attendees.length}`);
        const result = await ticketService.createBatch(eventId, attendees);
        
        res.status(201).json({ status: 'success', message: `Successfully imported ${result.count} tickets.` });
    });

    // --- ALERTS ---
    heartbeat = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const { deviceId, type, battery } = req.body;
        
        // Trust the scanner's reported type if provided, otherwise default to unknown
        // This resolves the mismatch where scanner says LAN but dashboard says NGROK
        await ticketService.registerScanner(deviceId, eventId, type || 'unknown');
        
        res.json({ status: 'success', message: 'Heartbeat received' });
    });

    reportIssue = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const { deviceId } = req.body;
        
        await ticketService.reportIssue(eventId, deviceId);
        res.json({ status: 'success', message: 'Issue reported' });
    });

    getAlerts = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const since = parseInt(req.query.since) || 0;
        
        const alerts = await ticketService.getAlerts(eventId, since);
        res.json({ status: 'success', alerts });
    });

    getActiveScanners = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        const scanners = ticketService.getScanners(eventId);
        res.json({ status: 'success', scanners });
    });
}

module.exports = new TicketController();