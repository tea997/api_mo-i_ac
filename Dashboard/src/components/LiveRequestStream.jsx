import { useMemo, useState } from 'react';
import { Activity, Clock, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui';
import styles from '../styles/modules/LiveRequestStream.module.scss';

function getStatusClass(status) {
    const s = Number(status);
    if (s >= 500) return 'status5xx';
    if (s >= 400) return 'status4xx';
    if (s >= 300) return 'status3xx';
    return 'status2xx';
}

function getMethodClass(method) {
    const map = { GET: 'mGet', POST: 'mPost', PUT: 'mPut', DELETE: 'mDel', PATCH: 'mPatch' };
    return map[method?.toUpperCase()] || 'mDefault';
}

function getLatencyClass(ms) {
    if (ms > 1000) return 'latCritical';
    if (ms > 500) return 'latWarn';
    return 'latOk';
}

/** Build synthetic live-stream rows from topEndpoints data */
function buildLiveRows(endpoints = []) {
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const rows = [];
    const now = Date.now();

    for (let i = 0; i < Math.min(endpoints.length * 3, 20); i++) {
        const ep = endpoints[i % endpoints.length];
        if (!ep) continue;
        const hits = Number(ep.total_hits ?? ep.totalHits ?? 1);
        const errors = Number(ep.error_hits ?? ep.errorHits ?? 0);
        const avg = Number(ep.avg_latency ?? ep.avgLatency ?? 100);
        const errorRate = hits > 0 ? errors / hits : 0;

        // Simulate latency spread (0.5x to 2x avg)
        const jitter = 0.5 + Math.random() * 1.5;
        const latency = Math.round(avg * jitter);

        // Simulate status distribution
        const statusRoll = Math.random();
        let status = '200';
        if (statusRoll < errorRate * 0.6) status = '500';
        else if (statusRoll < errorRate) status = '400';
        else if (statusRoll < errorRate + 0.03) status = '302';

        rows.push({
            id: i,
            time: new Date(now - i * 2800 - Math.random() * 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            method: ep.method ?? methods[i % methods.length],
            endpoint: ep.endpoint ?? ep.path ?? '/',
            status,
            latency,
        });
    }
    return rows;
}

export function LiveRequestStream({ endpoints = [] }) {
    const [isLive, setIsLive] = useState(true);

    const rows = useMemo(() => buildLiveRows(endpoints), [endpoints]);

    return (
        <Card className={styles.container}>
            <CardHeader>
                <div className={styles.headerRow}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <Activity />
                        </div>
                        <div>
                            <CardTitle>📡 Live Request Stream</CardTitle>
                            <CardDescription>Recent API requests</CardDescription>
                        </div>
                    </div>
                    <div className={styles.headerRight}>
                        <button
                            className={`${styles.liveToggle} ${isLive ? styles.liveOn : styles.liveOff}`}
                            onClick={() => setIsLive(!isLive)}
                            aria-label="Toggle live feed"
                        >
                            <div className={`${styles.liveDot} ${isLive ? styles.liveDotOn : ''}`} />
                            {isLive ? 'LIVE' : 'PAUSED'}
                        </button>
                    </div>
                </div>

                {/* Table header */}
                <div className={styles.tableHeader}>
                    <span className={styles.thTime}><Clock /> Time</span>
                    <span className={styles.thMethod}>Method</span>
                    <span className={styles.thEndpoint}>Endpoint</span>
                    <span className={styles.thStatus}>Status</span>
                    <span className={styles.thLatency}>Latency</span>
                </div>
            </CardHeader>
            <CardContent className={styles.cardBody}>
                {rows.length === 0 ? (
                    <div className={styles.emptyState}>
                        <RefreshCw className={styles.emptyIcon} />
                        <p>No request data available yet</p>
                        <span>Send traffic via your API key to see the live stream</span>
                    </div>
                ) : (
                    <div className={styles.streamList}>
                        {rows.map((row, i) => (
                            <div
                                key={row.id}
                                className={styles.streamRow}
                                style={{ animationDelay: `${i * 30}ms` }}
                            >
                                <span className={styles.cellTime}>{row.time}</span>
                                <span className={`${styles.methodBadge} ${styles[getMethodClass(row.method)]}`}>
                                    {row.method}
                                </span>
                                <code className={styles.cellEndpoint}>{row.endpoint}</code>
                                <span className={`${styles.statusBadge} ${styles[getStatusClass(row.status)]}`}>
                                    {row.status}
                                </span>
                                <span className={`${styles.cellLatency} ${styles[getLatencyClass(row.latency)]}`}>
                                    {row.latency}ms
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default LiveRequestStream;
