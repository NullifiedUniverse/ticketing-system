const emailService = require('../services/emailService');
const ticketService = require('../services/ticketService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for background upload
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `background-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

class EmailController {
    
    // Upload Background
    async uploadBackground(req, res) {
        if (!req.file) return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        
        // Store the path relative to backend or absolute
        // We'll return the filename so the frontend can pass it back or we store it in DB associated with event.
        // For simplicity, we return the filename.
        res.json({ status: 'success', filename: req.file.filename });
    }

    async sendSingle(req, res) {
        const { eventId, ticketId, bgFilename, config } = req.body;
        try {
            const tickets = await ticketService.getTickets(eventId);
            const ticket = tickets.find(t => t.id === ticketId);

            if (!ticket) return res.status(404).json({ status: 'error', message: 'Ticket not found' });
            if (!ticket.attendeeEmail) return res.status(400).json({ status: 'error', message: 'No email address' });

            const bgPath = bgFilename ? path.join(uploadDir, bgFilename) : null;
            
            await emailService.sendTicketEmail(ticket, eventId, bgPath, config);
            res.json({ status: 'success', message: `Email sent to ${ticket.attendeeEmail}` });
        } catch (error) {
            console.error("Email send error:", error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }

    async sendBatch(req, res) {
        const { eventId, bgFilename, config } = req.body;
        try {
            const tickets = await ticketService.getTickets(eventId);
            const bgPath = bgFilename ? path.join(uploadDir, bgFilename) : null;
            
            const results = { success: 0, failed: 0, errors: [] };

            for (const ticket of tickets) {
                if (!ticket.attendeeEmail) continue;
                try {
                    await emailService.sendTicketEmail(ticket, eventId, bgPath, config);
                    results.success++;
                } catch (e) {
                    results.failed++;
                    results.errors.push(e.message);
                }
            }
            
            res.json({ status: 'success', result: results });
        } catch (error) {
            console.error("Batch email error:", error);
            res.status(500).json({ status: 'error', message: 'Batch process failed' });
        }
    }

    async preview(req, res) {
        const { eventId, ticketId, bgFilename, config } = req.body;
        try {
            const tickets = await ticketService.getTickets(eventId);
            const ticket = tickets.find(t => t.id === ticketId) || tickets[0]; // Default to first if ID missing

            if (!ticket) return res.status(404).json({ status: 'error', message: 'No tickets found to preview' });

            const bgPath = bgFilename ? path.join(uploadDir, bgFilename) : null;
            const dataUrl = await emailService.getPreviewImage(ticket, bgPath, config);
            
            res.json({ status: 'success', image: dataUrl });
        } catch (error) {
            console.error("Preview error:", error);
            res.status(500).json({ status: 'error', message: error.message });
        }
    }
}

module.exports = { 
    controller: new EmailController(), 
    uploadMiddleware: upload.single('background') 
};