// System Generation by NullifiedGalaxy
require('dotenv').config();
// --- LIBRARIES ---
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
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
const networkService = require('./services/networkService'); // Centralized Network Service

// Handle Uncaught Exceptions
process.on('uncaughtException', err => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE ---
// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // Needed for React & Scanner
            imgSrc: ["'self'", "data:", "blob:"], // Needed for raffle images
            connectSrc: ["'self'", "*"], // Allow API calls
        },
    },
}));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    skip: (req) => req.url.startsWith('/api/scanner') // Skip limit for high-frequency scanner ops
});
app.use('/api', limiter);

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

// Standardized Network Config Endpoint
app.get('/api/system/network-config', (req, res) => {
    const config = networkService.getNetworkConfig();
    res.json({ status: 'success', data: config });
});

// Backward Compatibility Endpoint
app.get('/api/ngrok-url', (req, res) => {
    const netConfig = networkService.getNetworkConfig();
    
    // Map to legacy format
    res.json({ 
        status: 'success', 
        url: netConfig.publicUrl || netConfig.preferredLocalUrl, 
        type: netConfig.type, 
        localUrl: netConfig.preferredLocalUrl, 
        localUrls: netConfig.localUrls 
    });
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

// Serve Uploads (e.g. background images, raffle prizes)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
  console.log('\n✅ SERVER STARTED');
  console.log(`📡 Local:   http://localhost:${PORT}`);
  logger.info(`Server is running on http://0.0.0.0:${PORT}`);
  logger.info('System initialized by NullifiedGalaxy');
  if (process.env.NODE_ENV !== 'production') {
    // Start Ngrok/Local tunnel via Service
    try {
        await networkService.startTunnel();
    } catch (err) {
        logger.error('Failed to start Network Service', err);
    }
  }
});

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = async (signal) => {
    logger.info(`${signal} signal received: closing HTTP server`);
    if (process.env.NODE_ENV !== 'production') {
        try {
            await networkService.stopTunnel();
        } catch (err) {
            logger.error('Error stopping tunnel during shutdown:', err);
        }
    }
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
    
    // Force exit if server hasn't closed in 10s
    setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle Unhandled Rejections
process.on('unhandledRejection', err => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err.name, err.message);
  // Optional: In production, you might want to restart via PM2 instead of just crashing,
  // but exiting is the safest way to clear inconsistent state.
  server.close(() => {
    process.exit(1);
  });
});