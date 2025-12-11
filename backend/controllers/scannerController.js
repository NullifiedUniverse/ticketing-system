const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

class ScannerController {
    logPerformance = catchAsync(async (req, res, next) => {
        const { eventId, metrics, timestamp, config: scannerConfig } = req.body;
        logger.info(`[ScannerPerf - ${eventId}] Metrics: ${JSON.stringify(metrics)} | Config: ${JSON.stringify(scannerConfig)} | Time: ${new Date(timestamp).toISOString()}`);
        res.status(200).json({ status: 'success' });
    });
}

module.exports = new ScannerController();
