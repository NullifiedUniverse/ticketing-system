require('dotenv').config();
// --- LIBRARIES ---
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const config = require('./config');

// --- ROUTES & MODULES ---
const scannerTokenRoutes = require('./routes/scannerToken');
const { adminRouter, scannerRouter } = require('./routes/tickets');
const scannerAuthMiddleware = require('./middleware/scannerAuthMiddleware');
const ngrok = require('./ngrok'); 

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
app.use(compression()); // Compress all responses
app.use(cors({
    origin: '*' // Allow all origins (for now, to support local & ngrok)
}));
app.use(express.json());

// Security Headers for Camera Access (Important for Scanner)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*');
  // res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  // console.log(`${req.method} ${req.originalUrl}`); // Optional logging
  next();
});

// --- API ROUTES ---
app.use('/api/admin', adminRouter);
app.use('/api/scanner', scannerAuthMiddleware, scannerRouter);
app.use('/auth', scannerTokenRoutes);

app.get('/api/ping', (req, res) => res.send('pong'));

app.get('/api/ngrok-url', (req, res) => {
    const url = ngrok.getUrl();
    const type = ngrok.getUrlType();
    if (url) {
        res.json({ status: 'success', url, type });
    } else {
        // Even if tunnel isn't active (e.g. using localhost), return something useful if possible,
        // or just 503. The frontend handles this by showing 'local' status.
        res.status(503).json({ status: 'error', message: 'Tunnel is not active.' });
    }
});

// --- SERVE SCANNER (Standalone) ---
app.get('/scanner', (req, res) => {
    res.sendFile(path.join(__dirname, '../scanner/scanner.html'));
});

app.get('/html5-qrcode.min.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '../scanner/html5-qrcode.min.js'));
});

// --- SERVE STATIC FRONTEND (Production) ---
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// --- START SERVER ---
const server = app.listen(PORT, '0.0.0.0', async () => { // Listen on all network interfaces
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    // Start Ngrok/Local tunnel
    await ngrok.start();
  }
});

// --- GRACEFUL SHUTDOWN ---
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    if (process.env.NODE_ENV !== 'production') {
        await ngrok.stop();
    }
    server.close(() => {
        console.log('HTTP server closed');
    });
});