const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const { createCanvas, loadImage, registerFont } = require('canvas');
const path = require('path');
const fs = require('fs');

// Defaults from automail.py
const DEFAULTS = {
    qrSize: 1150,
    qrX: 220,
    qrY: 1110,
    fontSize: 150,
    nameX: 400,
    nameY: 925,
    sender: "dsa@kcislk.ntpc.edu.tw",
    password: "xcuk qwjw yext eibz" // App Password
};

class EmailService {
    constructor() {
        // Allow override via Env, else use automail.py defaults
        this.transporter = nodemailer.createTransport({
            service: 'gmail', // 'smtp.gmail.com' implied by service: gmail
            auth: {
                user: process.env.SMTP_USER || DEFAULTS.sender,
                pass: process.env.SMTP_PASS || DEFAULTS.password
            }
        });
    }

    /**
     * Replicates generate_ticket_image from automail.py
     */
    async generateTicketImage(ticket, bgPath, config = {}) {
        const qrSize = parseInt(config.qrSize || DEFAULTS.qrSize);
        const qrX = parseInt(config.qrX || DEFAULTS.qrX);
        const qrY = parseInt(config.qrY || DEFAULTS.qrY);
        const fontSize = parseInt(config.fontSize || DEFAULTS.fontSize);
        const nameX = parseInt(config.nameX || DEFAULTS.nameX);
        const nameY = parseInt(config.nameY || DEFAULTS.nameY);

        // 1. Load Background
        // If no custom bg uploaded, use a default placeholder or fail gracefully
        let image;
        try {
            if (bgPath && fs.existsSync(bgPath)) {
                image = await loadImage(bgPath);
            } else {
                // Fallback: Create a white canvas if no bg
                const canvas = createCanvas(2480, 3508); // A4 @ 300dpi approx
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 2480, 3508);
                image = canvas; // Use canvas as source? No, better to draw on it.
            }
        } catch (e) {
            throw new Error(`Failed to load background: ${e.message}`);
        }

        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        // 2. Generate QR
        // Python uses box_size=10, here we scale to px
        const qrDataUrl = await QRCode.toDataURL(ticket.id, {
            errorCorrectionLevel: 'H',
            margin: 0,
            width: qrSize,
            color: {
                dark: '#000000',
                light: '#ffffff' // White background for QR to ensure contrast
            }
        });
        const qrImg = await loadImage(qrDataUrl);
        
        // 3. Paste QR
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

        // 4. Draw Name with Outline (Stroke)
        const nameText = ticket.attendeeName || "Unknown";
        
        // Font selection
        // canvas uses system fonts. 'Arial' is safe.
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'left'; // Python PIL default is top-left anchor usually
        ctx.textBaseline = 'top'; // Python PIL uses top-left usually

        // Stroke Logic
        const strokeW = Math.floor(fontSize * 0.05);
        ctx.lineWidth = strokeW;
        ctx.strokeStyle = 'white';
        ctx.fillStyle = 'black';

        // Draw Stroke then Fill
        ctx.strokeText(nameText, nameX, nameY);
        ctx.fillText(nameText, nameX, nameY);

        return canvas.toBuffer('image/png');
    }

    async sendTicketEmail(ticket, eventId, bgPath, config = {}) {
        if (!ticket.attendeeEmail) return;

        // Generate the image
        const imageBuffer = await this.generateTicketImage(ticket, bgPath, config);
        const cid = `ticket-${ticket.id}@ticketsystem.local`;

        const mailOptions = {
            from: `"TicketSystem" <${process.env.SMTP_USER || DEFAULTS.sender}>`,
            to: ticket.attendeeEmail,
            subject: `Your Ticket for ${eventId}`,
            html: `
                <html>
                    <body>
                        <p>Hello ${ticket.attendeeName},</p>
                        <p>Here is your official ticket for <strong>${eventId}</strong>.</p>
                        <br>
                        <img src="cid:${cid}" alt="Ticket" style="max-width:100%; height:auto;">
                        <br>
                        <p>Please present this ticket at the entrance.</p>
                    </body>
                </html>
            `,
            attachments: [
                {
                    filename: 'ticket.png',
                    content: imageBuffer,
                    cid: cid, // Same cid value as in the html img src
                    contentType: 'image/png'
                }
            ]
        };

        return this.transporter.sendMail(mailOptions);
    }

    async getPreviewImage(ticket, bgPath, config) {
        const buffer = await this.generateTicketImage(ticket, bgPath, config);
        return `data:image/png;base64,${buffer.toString('base64')}`;
    }
}

module.exports = new EmailService();