const ticketService = require('../services/ticketService');

class RaffleController {
    async drawWinner(req, res) {
        const { eventId } = req.params;
        try {
            // 1. Get all tickets
            const tickets = await ticketService.getTickets(eventId);
            
            // 2. Filter for checked-in users only
            const checkedIn = tickets.filter(t => t.status === 'checked-in');

            if (checkedIn.length === 0) {
                return res.status(400).json({ status: 'error', message: 'No attendees checked in yet.' });
            }

            // 3. Random Pick
            const randomIndex = Math.floor(Math.random() * checkedIn.length);
            const winner = checkedIn[randomIndex];

            res.json({ 
                status: 'success', 
                winner: {
                    name: winner.attendeeName,
                    email: winner.attendeeEmail, // Mask this in production?
                    ticketId: winner.id
                },
                poolSize: checkedIn.length
            });

        } catch (error) {
            console.error("Raffle Error:", error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
}

module.exports = new RaffleController();
