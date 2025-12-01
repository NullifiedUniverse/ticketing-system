const express = require('express');
const adminRouter = express.Router();
const scannerRouter = express.Router();
const ticketController = require('../controllers/ticketController');
const raffleController = require('../controllers/raffleController');

// --- ADMIN ROUTES ---

// Events
adminRouter.get('/events', ticketController.getEvents.bind(ticketController));
adminRouter.post('/create-event', ticketController.createEvent.bind(ticketController));
adminRouter.delete('/delete-event/:eventId', ticketController.deleteEvent.bind(ticketController));

// Tickets
adminRouter.post('/create-ticket/:eventId', ticketController.createTicket.bind(ticketController));
adminRouter.put('/update-ticket/:eventId/:ticketId', ticketController.updateTicket.bind(ticketController));
adminRouter.delete('/delete-ticket/:eventId/:ticketId', ticketController.deleteTicket.bind(ticketController));
adminRouter.get('/tickets/:eventId', ticketController.getTickets.bind(ticketController));
adminRouter.post('/update-ticket-status/:eventId/:ticketId', ticketController.updateTicketStatus.bind(ticketController));

// Raffle
adminRouter.get('/raffle/draw/:eventId', raffleController.drawWinner.bind(raffleController));


// --- SCANNER ROUTES ---
scannerRouter.post('/update-ticket-status/:eventId/:ticketId', ticketController.updateTicketStatus.bind(ticketController));

module.exports = { adminRouter, scannerRouter };
