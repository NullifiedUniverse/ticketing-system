const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');
const ticketService = require('../services/ticketService');
const Joi = require('joi');
const AppError = require('../utils/AppError');

const logPerfSchema = Joi.object({
    eventId: Joi.string().required(),
    metrics: Joi.object().required(),
    timestamp: Joi.number().required(),
    config: Joi.object().optional()
});

class ScannerController {
    logPerformance = catchAsync(async (req, res, next) => {
        const { error, value } = logPerfSchema.validate(req.body);
        if (error) {
            return next(new AppError(error.details[0].message, 400));
        }

        const { eventId, metrics, config: scannerConfig } = value;
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
