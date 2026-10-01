import axios from 'axios';

const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL ?? '/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRoute = error.config?.url?.includes('/auth/');
        if (error.response?.status === 401 && !isAuthRoute) {
            window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: async (credentials) => {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    getProfile: async (options) => {
        const response = await api.get('/auth/profile', { signal: options?.signal });
        return response.data;
    },
    logout: async () => {
        const response = await api.get('/auth/logout');
        return response.data;
    },
    updateProfile: async (profileData) => {
        const response = await api.put('/auth/profile', profileData);
        return response.data;
    },
    onboardSuperAdmin: async (data) => {
        const response = await api.post('/auth/onboard-super-admin', data);
        return response.data;
    },
    clientSelfRegister: async (data) => {
        const response = await api.post('/auth/client-register', data);
        return response.data;
    },
};

// --- APM helpers (client-side derived metrics, no backend changes needed) ---

/** Estimate P95 latency: avg * 2.3 is a reasonable heuristic when raw percentiles aren't available. */
export function estimateP95(avgLatency) {
    return avgLatency > 0 ? Math.round(avgLatency * 2.3) : 0;
}

/** Apdex Score: satisfied (<500ms) + tolerating (<2000ms)*0.5 / total */
export function computeApdex(endpoints = []) {
    if (!endpoints.length) return null;
    let total = 0, satisfied = 0, tolerating = 0;
    for (const ep of endpoints) {
        const hits = Number(ep.total_hits ?? ep.totalHits ?? 0);
        const avg = Number(ep.avg_latency ?? ep.avgLatency ?? 0);
        total += hits;
        if (avg < 500) satisfied += hits;
        else if (avg < 2000) tolerating += hits;
    }
    if (total === 0) return null;
    return ((satisfied + tolerating * 0.5) / total).toFixed(2);
}

/** Compute availability % across all endpoints */
export function computeAvailability(stats) {
    if (!stats || !stats.totalHits) return 100;
    const total = Number(stats.total_hits ?? stats.totalHits ?? 0);
    const errors = Number(stats.error_hits ?? stats.errorHits ?? 0);
    if (total === 0) return 100;
    return ((total - errors) / total * 100).toFixed(1);
}

/** Derive per-service health aggregates from endpoint list */
export function deriveServiceHealth(endpoints = []) {
    const map = {};
    for (const ep of endpoints) {
        const svc = ep.service_name ?? ep.serviceName ?? 'unknown';
        if (!map[svc]) map[svc] = { service: svc, totalHits: 0, errorHits: 0, avgLatencySum: 0, count: 0 };
        const hits = Number(ep.total_hits ?? ep.totalHits ?? 0);
        const errors = Number(ep.error_hits ?? ep.errorHits ?? 0);
        const avg = Number(ep.avg_latency ?? ep.avgLatency ?? 0);
        map[svc].totalHits += hits;
        map[svc].errorHits += errors;
        map[svc].avgLatencySum += avg * hits;
        map[svc].count += hits;
    }
    return Object.values(map).map((s) => ({
        service: s.service,
        totalHits: s.totalHits,
        errorHits: s.errorHits,
        avgLatency: s.count > 0 ? Math.round(s.avgLatencySum / s.count) : 0,
        errorRate: s.totalHits > 0 ? ((s.errorHits / s.totalHits) * 100).toFixed(1) : '0.0',
        availability: s.totalHits > 0 ? (((s.totalHits - s.errorHits) / s.totalHits) * 100).toFixed(1) : '100.0',
        health: s.totalHits > 0 && (s.errorHits / s.totalHits) > 0.1
            ? 'critical'
            : s.totalHits > 0 && (s.errorHits / s.totalHits) > 0.03
                ? 'degraded'
                : 'healthy',
    }));
}

/** Generate Watchdog anomaly insights from endpoint data */
export function generateWatchdogInsights(endpoints = [], stats = {}) {
    const insights = [];
    const avgTotal = Number(stats.avg_latency ?? stats.avgLatency ?? 0);

    for (const ep of endpoints) {
        const path = ep.endpoint ?? ep.path ?? '/unknown';
        const method = ep.method ?? 'GET';
        const hits = Number(ep.total_hits ?? ep.totalHits ?? 0);
        const errors = Number(ep.error_hits ?? ep.errorHits ?? 0);
        const avg = Number(ep.avg_latency ?? ep.avgLatency ?? 0);
        const errorRate = hits > 0 ? (errors / hits) * 100 : 0;
        const p95 = estimateP95(avg);

        if (errorRate >= 10) {
            insights.push({ severity: 'critical', type: 'High Error Rate', endpoint: path, method, value: `${errorRate.toFixed(1)}%`, message: `Error rate reached ${errorRate.toFixed(1)}% — ${errors.toLocaleString()} 5xx errors detected` });
        } else if (errorRate >= 5) {
            insights.push({ severity: 'warning', type: 'Elevated Error Rate', endpoint: path, method, value: `${errorRate.toFixed(1)}%`, message: `Error rate elevated to ${errorRate.toFixed(1)}%` });
        }
        if (avgTotal > 0 && avg > avgTotal * 2.5 && avg > 800) {
            insights.push({ severity: 'critical', type: 'Latency Spike', endpoint: path, method, value: `P95 ${p95}ms`, message: `P95 latency at ${p95}ms — ${Math.round((avg / avgTotal - 1) * 100)}% above baseline` });
        } else if (avgTotal > 0 && avg > avgTotal * 1.8 && avg > 400) {
            insights.push({ severity: 'warning', type: 'High Latency', endpoint: path, method, value: `${avg.toFixed(0)}ms avg`, message: `Average latency at ${avg.toFixed(0)}ms, above acceptable threshold` });
        }
    }
    // Sort: critical first
    return insights.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
}

/** Derive endpoint issues (consolidated problem list) from endpoint data */
export function deriveEndpointIssues(endpoints = []) {
    const issues = [];
    for (const ep of endpoints) {
        const path = ep.endpoint ?? ep.path ?? '/unknown';
        const method = ep.method ?? 'GET';
        const hits = Number(ep.total_hits ?? ep.totalHits ?? 0);
        const errors = Number(ep.error_hits ?? ep.errorHits ?? 0);
        const avg = Number(ep.avg_latency ?? ep.avgLatency ?? 0);
        const errorRate = hits > 0 ? (errors / hits) * 100 : 0;
        const p95 = estimateP95(avg);
        const availability = hits > 0 ? ((hits - errors) / hits * 100) : 100;

        if (errorRate >= 10) {
            issues.push({ severity: 'critical', issueType: 'High Error Rate', endpoint: path, method, detail: `${errorRate.toFixed(1)}% error rate`, p95, availability: availability.toFixed(1) });
        } else if (errorRate >= 5) {
            issues.push({ severity: 'warning', issueType: 'Elevated Error Rate', endpoint: path, method, detail: `${errorRate.toFixed(1)}% error rate`, p95, availability: availability.toFixed(1) });
        } else if (avg > 1500) {
            issues.push({ severity: 'critical', issueType: 'High Latency', endpoint: path, method, detail: `P95 latency ${p95}ms`, p95, availability: availability.toFixed(1) });
        } else if (avg > 600) {
            issues.push({ severity: 'warning', issueType: 'High Latency', endpoint: path, method, detail: `P95 latency ${p95}ms`, p95, availability: availability.toFixed(1) });
        } else if (availability < 95) {
            issues.push({ severity: 'critical', issueType: 'Service Unavailable', endpoint: path, method, detail: `Availability at ${availability.toFixed(1)}%`, p95, availability: availability.toFixed(1) });
        }
    }
    return issues.sort((a, b) => (a.severity === 'critical' ? -1 : 1));
}

export const analyticsApi = {
    getDashboard: async (params = {}) => {
        let payload = {};
        try {
            const response = await api.get('/analytics/dashboard', { params });
            payload = response.data || {};
        } catch {
            payload = {
                success: true,
                data: {
                    stats: null,
                    topEndpoints: [],
                    recentActivity: []
                }
            };
        }

        payload.data = payload.data || {};

        const emptyStats = {
            totalHits: 0,
            avgLatency: 0,
            errorRate: 0,
            errorHits: 0,
            successHits: 0,
            uniqueServices: 0,
            uniqueEndpoints: 0,
        };

        payload.data.stats = payload.data.stats ?? emptyStats;
        payload.data.topEndpoints = payload.data.topEndpoints && payload.data.topEndpoints.length > 0
            ? payload.data.topEndpoints
            : [];

        payload.data.recentActivity = payload.data.recentActivity ?? [];

        // Derive APM metrics client-side from real data
        const { stats, topEndpoints } = payload.data;
        payload.data.apmMetrics = {
            p95Latency: estimateP95(Number(stats.avg_latency ?? stats.avgLatency ?? 0)),
            apdexScore: computeApdex(topEndpoints),
            availability: computeAvailability(stats),
            rps: stats.totalHits ? (Number(stats.total_hits ?? stats.totalHits) / 86400).toFixed(2) : '0.00',
        };
        payload.data.serviceHealth = deriveServiceHealth(topEndpoints);
        payload.data.watchdogInsights = generateWatchdogInsights(topEndpoints, stats);
        payload.data.endpointIssues = deriveEndpointIssues(topEndpoints);

        return payload;
    },
    getStats: async (params) => {
        try {
            const response = await api.get('/analytics/stats', { params });
            return response.data;
        } catch {
            return { success: true, data: { totalHits: 0, avgLatency: 0, errorRate: 0 } };
        }
    },
    getTopEndpoints: async (params) => {
        try {
            const response = await api.get('/analytics/top-endpoints', { params });
            return response.data;
        } catch {
            return { success: true, data: [] };
        }
    },
    getTimeSeries: async (params) => {
        try {
            const response = await api.get('/analytics/time-series', { params });
            return response.data;
        } catch {
            return { success: true, data: [] };
        }
    },
};

export const clientApi = {
    getCurrentClient: async () => {
        const response = await api.get('/clients/current');
        return response.data;
    },
    getClientDashboard: async (clientId) => {
        const params = clientId ? { clientId } : {};
        const response = await api.get('/clients/dashboard', { params });
        return response.data;
    },
    createClient: async (clientData) => {
        const response = await api.post('/admin/clients', clientData);
        return response.data;
    },
    getClients: async (params) => {
        const response = await api.get('/admin/clients', { params });
        return response.data;
    },
    createApiKey: async (clientId, keyData) => {
        const response = await api.post(`/admin/clients/${clientId}/api-keys`, keyData);
        return response.data;
    },
    getClientApiKeys: async (clientId) => {
        const response = await api.get(`/admin/clients/${clientId}/api-keys`);
        return response.data;
    },
    createClientUser: async (clientId, userData) => {
        const response = await api.post(`/admin/clients/${clientId}/users`, userData);
        return response.data;
    },
};

export default api;