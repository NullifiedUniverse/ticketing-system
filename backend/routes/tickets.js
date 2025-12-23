const express = require('express');
const adminRouter = express.Router();
const scannerRouter = express.Router();
const ticketController = require('../controllers/ticketController');
const raffleController = require('../controllers/raffleController');
const scannerController = require('../controllers/scannerController');
const { controller: emailController, uploadMiddleware } = require('../controllers/emailController');

// --- ADMIN ROUTES ---

// Events
adminRouter.get('/events', ticketController.getEvents.bind(ticketController));
adminRouter.post('/create-event', ticketController.createEvent.bind(ticketController));
adminRouter.delete('/delete-event/:eventId', ticketController.deleteEvent.bind(ticketController));

// Tickets
adminRouter.post('/create-ticket/:eventId', ticketController.createTicket.bind(ticketController));
adminRouter.post('/import/:eventId', ticketController.importAttendees.bind(ticketController));
adminRouter.put('/update-ticket/:eventId/:ticketId', ticketController.updateTicket.bind(ticketController));
adminRouter.delete('/delete-ticket/:eventId/:ticketId', ticketController.deleteTicket.bind(ticketController));
adminRouter.get('/tickets/:eventId', ticketController.getTickets.bind(ticketController));
adminRouter.post('/update-ticket-status/:eventId/:ticketId', ticketController.updateTicketStatus.bind(ticketController));

// Raffle
adminRouter.get('/raffle/draw/:eventId', raffleController.drawWinner.bind(raffleController));

// Email
adminRouter.post('/email/upload-bg', uploadMiddleware, emailController.uploadBackground.bind(emailController));
adminRouter.post('/email/preview', emailController.preview.bind(emailController));
adminRouter.post('/email/send-one', emailController.sendSingle.bind(emailController));
adminRouter.post('/email/send-batch', emailController.sendBatch.bind(emailController));


// Scanner API (requires scannerAuthMiddleware)
scannerRouter.post('/update-ticket-status/:eventId/:ticketId', ticketController.updateTicketStatus.bind(ticketController));
scannerRouter.get('/warmup/:eventId', ticketController.warmupCache.bind(ticketController));
scannerRouter.get('/get-minimal-ticket-data/:eventId', ticketController.getMinimalTicketData.bind(ticketController));
scannerRouter.post('/log-perf', scannerController.logPerformance.bind(scannerController));
scannerRouter.post('/report-issue/:eventId', ticketController.reportIssue.bind(ticketController));

// Admin Alerts
adminRouter.get('/alerts/:eventId', ticketController.getAlerts.bind(ticketController));
adminRouter.get('/scanners/:eventId', ticketController.getActiveScanners.bind(ticketController));

module.exports = { adminRouter, scannerRouter };
