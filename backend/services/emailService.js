const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const ticketService = require('./ticketService');

class EmailService {
    constructor() {
        // Configure your SMTP transporter here
        // For now, we'll use a placeholder or a test account (Ethereal)
        // In production, use SendGrid, AWS SES, or Gmail
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: 587,
            auth: {
                user: process.env.SMTP_USER || 'test',
                pass: process.env.SMTP_PASS || 'test'
            }
        });
    }

    async generateQR(text) {
        try {
            return await QRCode.toDataURL(text);
        } catch (err) {
            console.error("QR Gen Error:", err);
            throw err;
        }
    }

    async sendTicketEmail(ticket, eventName) {
        const qrCodeDataUrl = await this.generateQR(ticket.id);
        
        const mailOptions = {
            from: '"TicketSystem" <noreply@ticketsystem.com>',
            to: ticket.attendeeEmail,
            subject: `Your Ticket for ${eventName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #333;">Hello ${ticket.attendeeName},</h2>
                    <p>Here is your ticket for <strong>${eventName}</strong>.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <img src="${qrCodeDataUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px;" />
                        <p style="font-size: 12px; color: #777;">ID: ${ticket.id}</p>
                    </div>

                    <p>Please present this QR code at the entrance.</p>
                    <p style="color: #999; font-size: 12px;">Sent by TicketMaster Pro</p>
                </div>
            `
        };

        return this.transporter.sendMail(mailOptions);
    }

    async sendAllTickets(eventId) {
        const tickets = await ticketService.getTickets(eventId);
        const results = { success: 0, failed: 0, errors: [] };

        // Process in chunks to avoid rate limits? 
        // For now, sequential is safer to prevent spam flagging
        for (const ticket of tickets) {
            if (!ticket.attendeeEmail) continue;
            try {
                await this.sendTicketEmail(ticket, eventId);
                results.success++;
            } catch (error) {
                console.error(`Failed to email ${ticket.attendeeEmail}:`, error);
                results.failed++;
                results.errors.push({ email: ticket.attendeeEmail, error: error.message });
            }
        }

        return results;
    }
}

module.exports = new EmailService();
