const axios = require('axios');

/**
 * Monitoring middleware for API performance tracking
 * Reusable across different client applications
 */
const monitoringMiddleware = (options = {}) => {
    const {
        apiKey = process.env.MONITORING_API_KEY,
        endpoint = process.env.MONITORING_ENDPOINT || 'http://localhost:5000/api/hit',
        serviceName = process.env.SERVICE_NAME || 'demo2-service',
        enableLogging = process.env.NODE_ENV !== 'production',
        timeout = 3000,
        enabled = process.env.MONITORING_ENABLED !== 'false'
    } = options;

    if (!enabled || !apiKey) {
        if (enableLogging && !apiKey) {
            console.warn('Monitoring middleware: API key not configured');
        }
        return (req, res, next) => next();
    }

    return (req, res, next) => {
        const startTime = Date.now();
        const originalEnd = res.end;

        res.end = function (...args) {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            const monitoringData = {
                serviceName: serviceName,
                endpoint: req.originalUrl || req.url,
                method: req.method,
                statusCode: res.statusCode,
                latencyMs: responseTime,
                ip: req.ip || req.connection?.remoteAddress || 'unknown',
                userAgent: req.get('User-Agent') || 'unknown'
            };

            setImmediate(() => {
                sendMonitoringData(monitoringData, { apiKey, endpoint, enableLogging, timeout });
            });

            originalEnd.apply(res, args);
        };

        next();
    };
};

async function sendMonitoringData(data, options) {
    try {
        if (options.enableLogging) {
            console.log('📡 Sending monitoring hit:', {
                endpoint: data.endpoint,
                method: data.method,
                status: data.statusCode,
                latency: `${data.latencyMs}ms`
            });
        }

        await axios.post(options.endpoint, data, {
            headers: {
                'x-api-key': options.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: options.timeout
        });

        if (options.enableLogging) {
            console.log('✅ Monitoring hit recorded');
        }
    } catch (error) {
        if (options.enableLogging) {
            console.error('⚠️ Monitoring telemetry failed (non-blocking):', error.response?.data?.message || error.message);
        }
    }
}

module.exports = monitoringMiddleware;
