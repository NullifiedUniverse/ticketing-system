const ticketService = require('../services/ticketService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

class RaffleController {
    drawWinner = catchAsync(async (req, res, next) => {
        const { eventId } = req.params;
        
        // 1. Get all tickets
        const tickets = await ticketService.getTickets(eventId);
        
        // 2. Filter for checked-in users only
        const checkedIn = tickets.filter(t => t.status === 'checked-in');

        if (checkedIn.length === 0) {
            return next(new AppError('No attendees checked in yet.', 400));
        }

        // 3. Random Pick
        const randomIndex = Math.floor(Math.random() * checkedIn.length);
        const winner = checkedIn[randomIndex];

        res.json({ 
            status: 'success', 
            winner: {
                name: winner.attendeeName,
                email: winner.attendeeEmail,
                ticketId: winner.id
            },
            poolSize: checkedIn.length
        });
    });
}

module.exports = new RaffleController();
