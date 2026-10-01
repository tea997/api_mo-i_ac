import logger from '../../../shared/config/logger.js';
import AppError from '../../../shared/utils/AppError.js';
import { v4 as uuidv4 } from 'uuid';
import ApiHit from '../../../shared/models/ApiHits.js';

/**
 * Service class responsible for handling the business logic of ingesting API hit data.
 */
export class IngestService {
    constructor({ eventProducer }) {
        if (!eventProducer) throw new Error('IngestService requires eventProducer');
        this.eventProducer = eventProducer;
    };

    /**
     * Ingests an API hit by validating the hit data and publishing an event to RabbitMQ.
     * If RabbitMQ is unavailable, gracefully persists directly to MongoDB.
     */
    async ingestApiHit(hitData) {
        try {
            this.validateHitData(hitData);

            const event = {
                eventId: uuidv4(),
                timestamp: new Date(),
                serviceName: hitData.serviceName,
                endpoint: hitData.endpoint,
                method: hitData.method.toUpperCase(),
                statusCode: parseInt(hitData.statusCode, 10),
                latencyMs: parseFloat(hitData.latencyMs),
                clientId: hitData.clientId,
                apiKeyId: hitData.apiKeyId,
                ip: hitData.ip || 'unknown',
                userAgent: hitData.userAgent || '',
            };

            let published = false;
            try {
                published = await this.eventProducer.publishApiHit(event);
            } catch (rmqError) {
                logger.warn('RabbitMQ publish unavailable, falling back to direct MongoDB persistence:', { error: rmqError.message });
            }

            if (!published) {
                try {
                    await ApiHit.create(event);
                    logger.info('API hit recorded directly to MongoDB', {
                        eventId: event.eventId,
                        endpoint: event.endpoint,
                        clientId: event.clientId,
                    });
                    return {
                        eventId: event.eventId,
                        status: 'queued',
                        timestamp: event.timestamp,
                    };
                } catch (dbErr) {
                    logger.error('Failed to persist API hit to database:', dbErr);
                    throw dbErr;
                }
            }

            logger.info('API hit ingested', {
                eventId: event.eventId,
                endpoint: event.endpoint,
                method: event.method,
                clientId: event.clientId,
            });

            return {
                eventId: event.eventId,
                status: 'queued',
                timestamp: event.timestamp,
            };
        } catch (error) {
            logger.error('Error ingesting API hit:', error);
            throw error;
        }
    }

    /**
     * Validates the API hit data to ensure all required fields are present and valid.
     * @param {Object} hitData - The API hit data to be validated.
     * @throws {AppError} - If any required fields are missing or invalid.
     */
    validateHitData(hitData) {
        const requiredFields = [
            'serviceName',
            'endpoint',
            'method',
            'statusCode',
            'latencyMs',
            'clientId',
        ];

        const missingFields = requiredFields.filter((field) => !hitData[field])

        if (missingFields.length > 0) {
            throw new AppError(`Missing required fields: ${missingFields.join(",")}`, 400)
        };

        const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'];

        if (!validMethods.includes(hitData.method.toUpperCase())) {
            throw new AppError(`Invalid HTTP methods: ${hitData.method} `, 400)
        };

        const statusCode = parseInt(hitData.statusCode, 10);
        if (isNaN(statusCode) || statusCode < 100 || statusCode > 599) {
            throw new AppError(`Invalid Status code : ${hitData.statusCode} `, 400)
        };

        const latency = parseFloat(hitData.latencyMs);
        if (isNaN(latency) || latency < 0) {
            throw new AppError(`Invalid latency : ${hitData.latencyMs} `, 400)
        }
    }
}