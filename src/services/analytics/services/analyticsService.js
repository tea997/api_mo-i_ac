import logger from '../../../shared/config/logger.js';
import AppError from '../../../shared/utils/AppError.js';
import ApiHit from '../../../shared/models/ApiHits.js';
import mongoose from 'mongoose';

export class AnalyticsService {
    constructor(metricsRepo) {
        if (!metricsRepo) throw new Error("AnalyticsService requires a metricsRepository")
        this.metricsRepository = metricsRepo;
    }

    async getOverallStats(clientId, filters = {}) {
        try {
            const { startTime, endTime } = this.parseTimeFilters(filters);
            let stats = null;

            try {
                stats = await this.metricsRepository.getOverallStats(
                    clientId,
                    startTime,
                    endTime
                );
            } catch (pgErr) {
                logger.warn('PostgreSQL stats unavailable, using MongoDB fallback:', pgErr.message);
            }

            if (!stats || !stats.total_hits) {
                const match = { timestamp: { $gte: startTime, $lte: endTime } };
                if (clientId) {
                    match.clientId = typeof clientId === 'string' ? new mongoose.Types.ObjectId(clientId) : clientId;
                }

                const [agg] = await ApiHit.aggregate([
                    { $match: match },
                    {
                        $group: {
                            _id: null,
                            total_hits: { $sum: 1 },
                            error_hits: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
                            avg_latency: { $avg: '$latencyMs' },
                            services: { $addToSet: '$serviceName' },
                            endpoints: { $addToSet: '$endpoint' },
                        }
                    }
                ]);

                if (agg) {
                    stats = {
                        total_hits: agg.total_hits,
                        error_hits: agg.error_hits,
                        avg_latency: Math.round(agg.avg_latency || 0),
                        unique_services: agg.services?.length || 0,
                        unique_endpoints: agg.endpoints?.length || 0,
                    };
                } else {
                    stats = {};
                }
            }

            const totalHits = parseInt(stats.total_hits) || 0;
            const errorHits = parseInt(stats.error_hits) || 0;
            const errorRate = totalHits > 0 ? (errorHits / totalHits) * 100 : 0;

            return {
                totalHits,
                errorHits,
                successHits: totalHits - errorHits,
                errorRate: parseFloat(errorRate.toFixed(2)),
                avgLatency: parseFloat(stats.avg_latency) || 0,
                uniqueServices: parseInt(stats.unique_services) || 0,
                uniqueEndpoints: parseInt(stats.unique_endpoints) || 0,
                timeRange: {
                    start: startTime,
                    end: endTime,
                },
            };
        } catch (error) {
            logger.error('Error getting overall stats:', error);
            throw error;
        }
    }

    parseTimeFilters(filters = {}) {
        let { startTime, endTime } = filters;

        if (!startTime) {
            startTime = new Date();
            startTime.setHours(startTime.getHours() - 24);
        } else {
            startTime = new Date(startTime);
        }

        if (!endTime) {
            endTime = new Date();
        } else {
            endTime = new Date(endTime);
        }

        return { startTime, endTime };
    }

    async getTopEndpoints(clientId, options = {}) {
        try {
            const { limit = 10, startTime } = options;
            const parsedStartTime = startTime ? new Date(startTime) : null;
            let endpoints = null;

            try {
                endpoints = await this.metricsRepository.getTopEndpoints(clientId, limit, parsedStartTime);
            } catch (pgErr) {
                logger.warn('PostgreSQL top endpoints unavailable, using MongoDB fallback:', pgErr.message);
            }

            if (!endpoints || endpoints.length === 0) {
                const match = {};
                if (parsedStartTime) match.timestamp = { $gte: parsedStartTime };
                if (clientId) {
                    match.clientId = typeof clientId === 'string' ? new mongoose.Types.ObjectId(clientId) : clientId;
                }

                const agg = await ApiHit.aggregate([
                    { $match: match },
                    {
                        $group: {
                            _id: { endpoint: '$endpoint', method: '$method', serviceName: '$serviceName' },
                            total_hits: { $sum: 1 },
                            error_hits: { $sum: { $cond: [{ $gte: ['$statusCode', 400] }, 1, 0] } },
                            avg_latency: { $avg: '$latencyMs' },
                        }
                    },
                    { $sort: { total_hits: -1 } },
                    { $limit: limit }
                ]);

                endpoints = agg.map((a) => ({
                    service_name: a._id.serviceName,
                    endpoint: a._id.endpoint,
                    method: a._id.method,
                    total_hits: a.total_hits,
                    avg_latency: Math.round(a.avg_latency || 0),
                    error_hits: a.error_hits,
                }));
            }

            return endpoints.map((endpoint) => {
                const total = parseInt(endpoint.total_hits) || 0;
                const errors = parseInt(endpoint.error_hits) || 0;
                return {
                    serviceName: endpoint.service_name,
                    endpoint: endpoint.endpoint,
                    method: endpoint.method,
                    totalHits: total,
                    avgLatency: parseFloat(endpoint.avg_latency).toFixed(2),
                    errorHits: errors,
                    errorRate: total > 0 ? ((errors / total) * 100).toFixed(2) : '0.00',
                };
            });
        } catch (error) {
            logger.error('Error getting top endpoints:', error);
            throw error;
        }
    }

    async getTimeSeries(clientId, filters = {}) {
        try {
            const { serviceName, endpoint, startTime, endTime, limit = 100 } = filters;
            const { endTime: end_time, startTime: start_time } = this.parseTimeFilters({ startTime, endTime });
            let metrics = null;

            try {
                metrics = await this.metricsRepository.getMetrics({ clientId, serviceName, endpoint, startTime: start_time, endTime: end_time, limit });
            } catch (pgErr) {
                logger.warn('PostgreSQL time series unavailable, using MongoDB fallback:', pgErr.message);
            }

            if (!metrics || metrics.length === 0) {
                const match = { timestamp: { $gte: start_time, $lte: end_time } };
                if (clientId) {
                    match.clientId = typeof clientId === 'string' ? new mongoose.Types.ObjectId(clientId) : clientId;
                }
                if (serviceName) match.serviceName = serviceName;
                if (endpoint) match.endpoint = endpoint;

                const recentHits = await ApiHit.find(match).sort({ timestamp: -1 }).limit(limit).lean();
                metrics = recentHits.map((h) => ({
                    service_name: h.serviceName,
                    endpoint: h.endpoint,
                    method: h.method,
                    total_hits: 1,
                    error_hits: h.statusCode >= 400 ? 1 : 0,
                    avg_latency: h.latencyMs,
                    min_latency: h.latencyMs,
                    max_latency: h.latencyMs,
                    time_bucket: h.timestamp,
                }));
            }

            return metrics.map((metric) => ({
                serviceName: metric.service_name,
                endpoint: metric.endpoint,
                method: metric.method,
                totalHits: parseInt(metric.total_hits) || 0,
                errorHits: parseInt(metric.error_hits) || 0,
                avgLatency: parseFloat(metric.avg_latency).toFixed(2),
                minLatency: parseFloat(metric.min_latency).toFixed(2),
                maxLatency: parseFloat(metric.max_latency).toFixed(2),
                timeBucket: metric.time_bucket,
            }));
        } catch (error) {
            logger.error('Error getting time series:', error);
            throw error;
        }
    }
}