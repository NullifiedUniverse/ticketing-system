const express = require('express');
const adminRouter = express.Router();
const scannerRouter = express.Router();
const ticketController = require('../controllers/ticketController');

// --- ADMIN ROUTES ---

// Events
adminRouter.get('/events', ticketController.getEvents.bind(ticketController));
adminRouter.post('/create-event', ticketController.createEvent.bind(ticketController));

// Tickets
adminRouter.post('/create-ticket/:eventId', ticketController.createTicket.bind(ticketController));
adminRouter.put('/update-ticket/:eventId/:ticketId', ticketController.updateTicket.bind(ticketController));
adminRouter.delete('/delete-ticket/:eventId/:ticketId', ticketController.deleteTicket.bind(ticketController));
adminRouter.get('/tickets/:eventId', ticketController.getTickets.bind(ticketController));
adminRouter.post('/update-ticket-status/:eventId/:ticketId', ticketController.updateTicketStatus.bind(ticketController));


// --- SCANNER ROUTES ---
scannerRouter.post('/update-ticket-status/:eventId/:ticketId', ticketController.updateTicketStatus.bind(ticketController));

module.exports = { adminRouter, scannerRouter };
