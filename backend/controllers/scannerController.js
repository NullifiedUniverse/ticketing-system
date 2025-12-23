const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const ticketService = require('../services/ticketService');

class ScannerController {
    logPerformance = catchAsync(async (req, res, next) => {
        const { eventId, metrics, timestamp, config: scannerConfig } = req.body;
        const deviceId = req.deviceId || 'unknown';
        
        // Detect Type
        const baseUrl = scannerConfig?.apiBaseUrl || '';
        const type = baseUrl.includes('ngrok-free.app') || baseUrl.includes('ngrok.io') ? 'NGROK' : 'LAN';

        await ticketService.registerScanner(deviceId, eventId, type);

        logger.info(`[ScannerPerf - ${eventId}] Device: ${deviceId} | Type: ${type} | Metrics: ${JSON.stringify(metrics)}`);
        res.status(200).json({ status: 'success' });
    });
}

module.exports = new ScannerController();
