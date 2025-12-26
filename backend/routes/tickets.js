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
adminRouter.get('/raffle/state/:eventId', raffleController.getState.bind(raffleController));
adminRouter.post('/raffle/sync/:eventId', raffleController.syncAttendees.bind(raffleController));
adminRouter.post('/raffle/prizes/:eventId', raffleController.updatePrizes.bind(raffleController));
adminRouter.post('/raffle/upload-prize-image', 
    (req, res, next) => { console.log('DEBUG: Upload route hit'); next(); },
    uploadMiddleware, 
    raffleController.uploadPrizeImage.bind(raffleController)
);
adminRouter.post('/raffle/draw/:eventId', raffleController.drawWinner.bind(raffleController));
adminRouter.post('/raffle/reset/:eventId', raffleController.reset.bind(raffleController));

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
scannerRouter.post('/heartbeat/:eventId', ticketController.heartbeat.bind(ticketController));
scannerRouter.post('/report-issue/:eventId', ticketController.reportIssue.bind(ticketController));

// Admin Alerts
adminRouter.get('/alerts/:eventId', ticketController.getAlerts.bind(ticketController));
adminRouter.get('/scanners/:eventId', ticketController.getActiveScanners.bind(ticketController));

module.exports = { adminRouter, scannerRouter };
