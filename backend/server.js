// --- LIBRARIES ---
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const morgan = require('morgan');
const Joi = require('joi');
const config = require('./config');

// --- INITIALIZATION ---
admin.initializeApp({
  credential: admin.credential.cert(config.serviceAccount)
});
const db = admin.firestore();
const app = express();

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// --- SECURITY MIDDLEWARE ---
const apiKeyMiddleware = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== config.apiKey) {
    return res.status(403).json({ status: 'error', message: 'Forbidden: Invalid API Key' });
  }
  next();
};

app.use(apiKeyMiddleware); // Apply security to all routes

// --- VALIDATION SCHEMAS ---
const createTicketSchema = Joi.object({
    attendeeName: Joi.string().min(1).required(),
    attendeeEmail: Joi.string().email().required(),
});

const updateTicketStatusSchema = Joi.object({
    action: Joi.string().valid('check-in', 'check-out').required(),
});

// --- API ROUTES ---

// 1. Create a new ticket
app.post('/api/create-ticket/:eventId', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { error, value } = createTicketSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ status: 'error', message: error.details[0].message });
        }
        const { attendeeName, attendeeEmail } = value;
        const ticketId = uuidv4();
        const ticketRef = db.collection(`events/${eventId}/tickets`).doc(ticketId);
        
        const newTicket = {
            attendeeName,
            attendeeEmail,
            status: 'valid', // valid, checked-in, on-leave
            createdAt: new Date(),
            checkInHistory: [], // To log all check-in/out events
        };
        
        await ticketRef.set(newTicket);
        res.status(201).json({ status: 'success', ticket: { id: ticketId, ...newTicket } });
    } catch (error) {
        console.error("Error creating ticket:", error);
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

// 2. Update a ticket's status (for scanning)
app.post('/api/update-ticket-status/:eventId/:ticketId', async (req, res) => {
    const { eventId, ticketId } = req.params;
    const { error, value } = updateTicketStatusSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ status: 'error', message: error.details[0].message });
    }
    const { action } = value;
    const ticketRef = db.doc(`events/${eventId}/tickets/${ticketId}`);
    
    try {
        const result = await db.runTransaction(async (transaction) => {
            const ticketDoc = await transaction.get(ticketRef);
            
            if (!ticketDoc.exists) {
                throw new Error("Ticket not found.");
            }
            
            const ticketData = ticketDoc.data();
            const now = new Date();
            let newStatus = ticketData.status;
            let message = '';

            if (action === 'check-in') {
                if (ticketData.status === 'checked-in') {
                    throw new Error('Ticket already checked in.');
                }
                newStatus = 'checked-in';
                message = `Checked In: ${ticketData.attendeeName}`;
            } else if (action === 'check-out') {
                if (ticketData.status !== 'checked-in') {
                    throw new Error('Can only check out an already checked-in ticket.');
                }
                newStatus = 'on-leave';
                message = `On Leave: ${ticketData.attendeeName}`;
            }
            
            const historyEntry = {
                action,
                timestamp: now,
                scannedBy: 'qr-scanner'
            };

            transaction.update(ticketRef, { 
                status: newStatus,
                checkInHistory: admin.firestore.FieldValue.arrayUnion(historyEntry)
            });
            
            return { ...ticketData, status: newStatus, message };
        });
        
        res.json({ status: 'success', data: result });
    } catch (error) {
        console.error("Status update error:", error.message);
        res.status(400).json({ status: 'error', message: error.message });
    }
});


// --- START SERVER ---
const PORT = config.port || 3001;
app.listen(PORT, '0.0.0.0', () => { // Listen on all network interfaces
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});

