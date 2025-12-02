const emailService = require('../services/emailService');
const ticketService = require('../services/ticketService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Configure Multer for background upload
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `background-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

class EmailController {
    
    uploadBackground = catchAsync(async (req, res, next) => {
        if (!req.file) return next(new AppError('No file uploaded', 400));
        logger.info(`Background uploaded: ${req.file.filename}`);
        res.json({ status: 'success', filename: req.file.filename });
    });

    sendSingle = catchAsync(async (req, res, next) => {
        const { eventId, ticketId, bgFilename, config: reqConfig, messageBefore, messageAfter } = req.body;
        const config = { ...reqConfig, messageBefore, messageAfter };
        
        const tickets = await ticketService.getTickets(eventId);
        const ticket = tickets.find(t => t.id === ticketId);

        if (!ticket) return next(new AppError('Ticket not found', 404));
        if (!ticket.attendeeEmail) return next(new AppError('No email address for this ticket', 400));

        const bgPath = bgFilename ? path.join(uploadDir, bgFilename) : null;
        
        await emailService.sendTicketEmail(ticket, eventId, bgPath, config);
        res.json({ status: 'success', message: `Email sent to ${ticket.attendeeEmail}` });
    });

    sendBatch = catchAsync(async (req, res, next) => {
        const { eventId, bgFilename, config: reqConfig, messageBefore, messageAfter } = req.body;
        const config = { ...reqConfig, messageBefore, messageAfter };
        
        logger.info(`[Email Batch] Syncing user list for event: ${eventId}`);
        const tickets = await ticketService.getTickets(eventId);
        logger.info(`[Email Batch] Found ${tickets.length} potential recipients.`);

        const bgPath = bgFilename ? path.join(uploadDir, bgFilename) : null;
        
        const results = { success: 0, failed: 0, errors: [] };

        // Use Promise.all for better performance, but limit concurrency to avoid SMTP rate limits
        const CONCURRENCY_LIMIT = 3;
        const chunks = [];
        
        // Filter only valid emails
        const emailQueue = tickets.filter(t => t.attendeeEmail);
        
        for (let i = 0; i < emailQueue.length; i += CONCURRENCY_LIMIT) {
            chunks.push(emailQueue.slice(i, i + CONCURRENCY_LIMIT));
        }

        for (const chunk of chunks) {
            await Promise.all(chunk.map(async (ticket) => {
                try {
                    await emailService.sendTicketEmail(ticket, eventId, bgPath, config);
                    results.success++;
                } catch (e) {
                    logger.error(`[Email Batch] Failed for ${ticket.attendeeEmail}: ${e.message}`);
                    results.failed++;
                    results.errors.push(`${ticket.attendeeEmail}: ${e.message}`);
                }
            }));
        }
        
        logger.info(`[Email Batch] Completed. Success: ${results.success}, Failed: ${results.failed}`);
        res.json({ status: 'success', result: results });
    });

    preview = catchAsync(async (req, res, next) => {
        const { eventId, ticketId, bgFilename, config } = req.body;
        
        const tickets = await ticketService.getTickets(eventId);
        const ticket = tickets.find(t => t.id === ticketId) || tickets[0]; 

        if (!ticket) return next(new AppError('No tickets found to preview', 404));

        const bgPath = bgFilename ? path.join(uploadDir, bgFilename) : null;
        const dataUrl = await emailService.getPreviewImage(ticket, bgPath, config);
        
        res.json({ status: 'success', image: dataUrl });
    });
}

module.exports = { 
    controller: new EmailController(), 
    uploadMiddleware: upload.single('background') 
};