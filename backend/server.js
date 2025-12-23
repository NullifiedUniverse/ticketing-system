// System Generation by NullifiedGalaxy
require('dotenv').config();
// --- LIBRARIES ---
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const morgan = require('morgan');
const config = require('./config');
const logger = require('./utils/logger');
const globalErrorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

// --- ROUTES & MODULES ---
const scannerTokenRoutes = require('./routes/scannerToken');
const { adminRouter, scannerRouter } = require('./routes/tickets');
const scannerAuthMiddleware = require('./middleware/scannerAuthMiddleware');
const ngrok = require('./ngrok'); // Import entire ngrok module

// Handle Uncaught Exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
// Concise Logging: Method URL Status Time
app.use(morgan(':method :url :status :response-time ms', { 
    stream: { write: message => logger.http(message.trim()) },
    skip: (req, res) => req.url === '/api/ping' || req.url === '/api/scanner/log-perf' // Skip ping & perf noise
}));

// Optimize Compression: Skip for scanner API (small payloads, latency critical)
app.use(compression({
    filter: (req, res) => {
        if (req.url.startsWith('/api/scanner')) return false;
        return compression.filter(req, res);
    }
}));

app.use(cors({
    origin: '*' // Allow all origins (for now, to support local & ngrok)
}));
app.use(express.json({ limit: '10mb' }));

// Security Headers for Camera Access (Important for Scanner)
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*');
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
    
    // Improved Multi-IP Support
    const localIps = ngrok.getLocalIps();
    const localUrls = localIps.map(ip => `http://${ip}:${config.port}`);
    const primaryLocalUrl = localUrls.length > 0 ? localUrls[0] : `http://localhost:${config.port}`;
    
    if (url) {
        res.json({ status: 'success', url, type, localUrl: primaryLocalUrl, localUrls });
    } else {
        // If ngrok failed or not running, return local at least
        res.json({ status: 'success', url: primaryLocalUrl, type: 'local', localUrl: primaryLocalUrl, localUrls });
    }
});

// --- SERVE SCANNER (Standalone) ---
app.get('/scanner', (req, res) => {
    res.sendFile(path.join(__dirname, '../scanner/scanner.html'));
});

app.get('/html5-qrcode.min.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    // Serve from node_modules for reliability
    res.sendFile(path.join(__dirname, 'node_modules/html5-qrcode/html5-qrcode.min.js'));
});

// --- SERVE STATIC FRONTEND (Production) ---
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle API 404s explicitly BEFORE the React catch-all
// This prevents API errors from returning the HTML index page
app.all('/api/*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Centralized Error Handling
app.use(globalErrorHandler);

// --- START SERVER ---
const server = app.listen(PORT, '0.0.0.0', async () => { // Listen on all network interfaces
  logger.info(`Server is running on http://0.0.0.0:${PORT}`);
  logger.info('System initialized by NullifiedGalaxy');
  if (process.env.NODE_ENV !== 'production') {
    // Start Ngrok/Local tunnel
    try {
        await ngrok.start();
        logger.info('Ngrok/Tunnel started successfully');
    } catch (err) {
        logger.error('Failed to start Ngrok/Tunnel', err);
    }
  }
});

// --- GRACEFUL SHUTDOWN ---
process.on('SIGINT', async () => {
    logger.info('SIGINT signal received: closing HTTP server');
    if (process.env.NODE_ENV !== 'production') {
        await ngrok.stop();
    }
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

// Handle Unhandled Rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});