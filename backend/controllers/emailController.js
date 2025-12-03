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
        const { eventId, ticketId, bgFilename, config: reqConfig, messageBefore, messageAfter, emailSubject, senderName } = req.body;

        // 1. Load existing config from DB
        const storedConfig = await ticketService.getEmailConfig(eventId) || {};

        // 2. Merge: Request > Stored
        const mergedBgFilename = bgFilename !== undefined ? bgFilename : storedConfig.bgFilename;
        
        const mergedConfig = { ...storedConfig.layoutConfig, ...reqConfig };
        
        let mergedMsgBefore = storedConfig.messageBefore;
        if (messageBefore !== undefined) mergedMsgBefore = messageBefore;
        
        let mergedMsgAfter = storedConfig.messageAfter;
        if (messageAfter !== undefined) mergedMsgAfter = messageAfter;

        let mergedSubject = storedConfig.emailSubject;
        if (emailSubject !== undefined) mergedSubject = emailSubject;

        let mergedSenderName = storedConfig.senderName;
        if (senderName !== undefined) mergedSenderName = senderName;

        // 3. Persist updates
        if (bgFilename !== undefined || reqConfig || messageBefore !== undefined || messageAfter !== undefined || emailSubject !== undefined || senderName !== undefined) {
             await ticketService.updateEmailConfig(eventId, {
                 bgFilename: mergedBgFilename,
                 layoutConfig: mergedConfig,
                 messageBefore: mergedMsgBefore,
                 messageAfter: mergedMsgAfter,
                 emailSubject: mergedSubject,
                 senderName: mergedSenderName
             });
        }

        // Prepare for Service
        const configPayload = { ...mergedConfig };
        configPayload.messageBefore = mergedMsgBefore;
        configPayload.messageAfter = mergedMsgAfter;
        configPayload.emailSubject = mergedSubject;
        configPayload.senderName = mergedSenderName;

        const tickets = await ticketService.getTickets(eventId);
        const ticket = tickets.find(t => t.id === ticketId);

        if (!ticket) return next(new AppError('Ticket not found', 404));
        if (!ticket.attendeeEmail) return next(new AppError('No email address for this ticket', 400));

        const bgPath = mergedBgFilename ? path.join(uploadDir, mergedBgFilename) : null;
        
        await emailService.sendTicketEmail(ticket, eventId, bgPath, configPayload);
        res.json({ status: 'success', message: `Email sent to ${ticket.attendeeEmail}` });
    });

    sendBatch = catchAsync(async (req, res, next) => {
        const { eventId, bgFilename, config: reqConfig, messageBefore, messageAfter, emailSubject, senderName } = req.body;
        
        // 1. Load & Merge
        const storedConfig = await ticketService.getEmailConfig(eventId) || {};
        
        const mergedBgFilename = bgFilename !== undefined ? bgFilename : storedConfig.bgFilename;
        const mergedConfig = { ...storedConfig.layoutConfig, ...reqConfig };
        
        let mergedMsgBefore = storedConfig.messageBefore;
        if (messageBefore !== undefined) mergedMsgBefore = messageBefore;
        
        let mergedMsgAfter = storedConfig.messageAfter;
        if (messageAfter !== undefined) mergedMsgAfter = messageAfter;

        let mergedSubject = storedConfig.emailSubject;
        if (emailSubject !== undefined) mergedSubject = emailSubject;

        let mergedSenderName = storedConfig.senderName;
        if (senderName !== undefined) mergedSenderName = senderName;

        // 2. Persist
        if (bgFilename !== undefined || reqConfig || messageBefore !== undefined || messageAfter !== undefined || emailSubject !== undefined || senderName !== undefined) {
             await ticketService.updateEmailConfig(eventId, {
                 bgFilename: mergedBgFilename,
                 layoutConfig: mergedConfig,
                 messageBefore: mergedMsgBefore,
                 messageAfter: mergedMsgAfter,
                 emailSubject: mergedSubject,
                 senderName: mergedSenderName
             });
        }

        const configPayload = { 
            ...mergedConfig, 
            messageBefore: mergedMsgBefore, 
            messageAfter: mergedMsgAfter,
            emailSubject: mergedSubject,
            senderName: mergedSenderName
        };

        logger.info(`[Email Batch] Syncing user list for event: ${eventId}`);
        const tickets = await ticketService.getTickets(eventId);
        logger.info(`[Email Batch] Found ${tickets.length} potential recipients.`);

        const bgPath = mergedBgFilename ? path.join(uploadDir, mergedBgFilename) : null;
        
        const results = { success: 0, failed: 0, errors: [] };

        // Filter only valid emails
        const emailQueue = tickets.filter(t => t.attendeeEmail);
        
        // Sequential processing with Retry Logic
        for (const ticket of emailQueue) {
            let attempts = 0;
            const maxAttempts = 3;
            let sent = false;

            while (attempts < maxAttempts && !sent) {
                try {
                    attempts++;
                    await emailService.sendTicketEmail(ticket, eventId, bgPath, configPayload);
                    results.success++;
                    sent = true;
                } catch (e) {
                    if (attempts === maxAttempts) {
                        logger.error(`[Email Batch] Failed for ${ticket.attendeeEmail} after ${maxAttempts} attempts: ${e.message}`);
                        results.failed++;
                        results.errors.push(`${ticket.attendeeEmail}: ${e.message}`);
                    } else {
                        logger.warn(`[Email Batch] Attempt ${attempts} failed for ${ticket.attendeeEmail}: ${e.message}. Retrying...`);
                        await new Promise(resolve => setTimeout(resolve, 1000)); // Simple 1s delay
                    }
                }
            }
        }
        
        logger.info(`[Email Batch] Completed. Success: ${results.success}, Failed: ${results.failed}`);
        res.json({ status: 'success', result: results });
    });

    preview = catchAsync(async (req, res, next) => {
        const { eventId, ticketId, bgFilename, config: reqConfig, messageBefore, messageAfter, emailSubject, senderName } = req.body;
        
        // 1. Load & Merge
        const storedConfig = await ticketService.getEmailConfig(eventId) || {};
        
        const mergedBgFilename = bgFilename !== undefined ? bgFilename : storedConfig.bgFilename;
        const mergedConfig = { ...storedConfig.layoutConfig, ...reqConfig };
        
        let mergedMsgBefore = storedConfig.messageBefore;
        if (messageBefore !== undefined) mergedMsgBefore = messageBefore;
        
        let mergedMsgAfter = storedConfig.messageAfter;
        if (messageAfter !== undefined) mergedMsgAfter = messageAfter;

        let mergedSubject = storedConfig.emailSubject;
        if (emailSubject !== undefined) mergedSubject = emailSubject;

        let mergedSenderName = storedConfig.senderName;
        if (senderName !== undefined) mergedSenderName = senderName;

        // 2. Persist
        if (bgFilename !== undefined || reqConfig || messageBefore !== undefined || messageAfter !== undefined || emailSubject !== undefined || senderName !== undefined) {
             await ticketService.updateEmailConfig(eventId, {
                 bgFilename: mergedBgFilename,
                 layoutConfig: mergedConfig,
                 messageBefore: mergedMsgBefore,
                 messageAfter: mergedMsgAfter,
                 emailSubject: mergedSubject,
                 senderName: mergedSenderName
             });
        }

        const configPayload = { 
            ...mergedConfig, 
            messageBefore: mergedMsgBefore, 
            messageAfter: mergedMsgAfter,
            emailSubject: mergedSubject,
            senderName: mergedSenderName
        };

        const tickets = await ticketService.getTickets(eventId);
        const ticket = tickets.find(t => t.id === ticketId) || tickets[0]; 

        if (!ticket) return next(new AppError('No tickets found to preview', 404));

        const bgPath = mergedBgFilename ? path.join(uploadDir, mergedBgFilename) : null;
        const dataUrl = await emailService.getPreviewImage(ticket, bgPath, configPayload);
        
        res.json({ status: 'success', image: dataUrl });
    });
}

module.exports = { 
    controller: new EmailController(), 
    uploadMiddleware: upload.single('background') 
};
