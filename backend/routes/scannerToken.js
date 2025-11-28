const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('../config');

// Generate a short-lived token for the scanner to use
router.post('/scanner-token', (req, res) => {
    try {
        // The scanner uses the API key to verify, so we sign with that
        const token = jwt.sign({ scanner: true }, config.apiKey, { expiresIn: '1h' }); // Increased to 1h for better UX
        res.json({ status: 'success', token });
    } catch (error) {
        console.error("Error generating scanner token:", error);
        res.status(500).json({ status: 'error', message: 'Failed to generate token' });
    }
});

module.exports = router;