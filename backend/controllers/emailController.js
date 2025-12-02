const emailService = require('../services/emailService');
const ticketService = require('../services/ticketService');

class EmailController {
    async sendSingle(req, res) {
        const { eventId, ticketId } = req.body;
        try {
            // Fetch fresh ticket data to ensure sync
            const tickets = await ticketService.getTickets(eventId);
            const ticket = tickets.find(t => t.id === ticketId);

            if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });
            if (!ticket.attendeeEmail) return res.status(400).json({ status: 'error', message: 'No email address for this attendee' });

            await emailService.sendTicketEmail(ticket, eventId);
            res.json({ status: 'success', message: `Email sent to ${ticket.attendeeEmail}` });
        } catch (error) {
            console.error("Email send error:", error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    async sendBatch(req, res) {
        const { eventId } = req.body;
        try {
            const result = await emailService.sendAllTickets(eventId);
            res.json({ status: 'success', result });
        } catch (error) {
            console.error("Batch email error:", error);
            res.status(500).json({ status: 'error', message: 'Batch process failed' });
        }
    }
}

module.exports = new EmailController();
