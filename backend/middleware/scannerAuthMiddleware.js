const jwt = require('jsonwebtoken');
const config = require('../config');

const apiKeyMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Unauthorized: Missing token' });
    }

    try {
        const decoded = jwt.verify(token, config.apiKey);
        req.user = decoded;
        req.deviceId = req.headers['x-device-id'] || 'unknown-device';
        next();
    } catch (error) {
        return res.status(403).json({ status: 'error', message: 'Forbidden: Invalid token' });
    }
};

module.exports = apiKeyMiddleware;
