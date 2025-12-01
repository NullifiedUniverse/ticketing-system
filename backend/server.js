require('dotenv').config();
// --- LIBRARIES ---
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const scannerTokenRoutes = require('./routes/scannerToken');
const ticketRoutes = require('./routes/tickets');
const { connect, getPublicUrl } = require('./ngrok'); // Import ngrok module

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(compression()); // Compress all responses
app.use(cors({
    origin: '*', // Allow all origins (for now, to support local & ngrok)

app.use(express.json());

// Security Headers for Camera Access
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=*');
  // res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  // res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// --- API ROUTES ---
app.use('/api/admin', adminRouter);
app.use('/api/scanner', scannerAuthMiddleware, scannerRouter);
app.use('/auth', scannerTokenRoutes);

app.get('/api/ngrok-url', (req, res) => {
    const url = ngrok.getUrl();
    const type = ngrok.getUrlType();
    if (url) {
        res.json({ status: 'success', url, type });
    } else {
        res.status(503).json({ status: 'error', message: 'Tunnel is not active.' });
    }
});

// --- SERVE SCANNER ---
app.get('/scanner', (req, res) => {
    res.sendFile(path.join(__dirname, '../scanner/scanner.html'));
});

app.get('/html5-qrcode.min.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, '../scanner/html5-qrcode.min.js'));
});

// --- SERVE STATIC FRONTEND ---
// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../frontend/build')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// --- START SERVER ---
const PORT = config.port || 3001;
const server = app.listen(PORT, '0.0.0.0', async () => { // Listen on all network interfaces
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    await ngrok.start();
  }
});

// --- GRACEFUL SHUTDOWN ---
process.on('SIGINT', async () => {
    console.log('SIGINT signal received: closing HTTP server');
    if (process.env.NODE_ENV === 'development') {
        await ngrok.stop();
    }
    server.close(() => {
        console.log('HTTP server closed');
    });
});


