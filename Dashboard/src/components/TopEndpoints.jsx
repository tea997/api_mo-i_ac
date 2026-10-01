import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui';
import { Flame, TrendingUp, Clock, AlertCircle, Activity, Zap } from 'lucide-react';
import { estimateP95 } from '../api/api';
import styles from '../styles/modules/TopEndpoints.module.scss';

function TopEndpoints({ endpoints = [] }) {
    const getMethodColor = (method) => {
        const colors = {
            GET: styles.methodGet,
            POST: styles.methodPost,
            PUT: styles.methodPut,
            DELETE: styles.methodDelete,
            PATCH: styles.methodPatch,
        };
        return colors[method] || styles.methodDefault;
    };

    const getRankColor = (index) => {
        if (index === 0) return styles.rank1;
        if (index === 1) return styles.rank2;
        if (index === 2) return styles.rank3;
        return styles.rankOther;
    };

    // Sort endpoints to prioritize highest error rates & latency for "Worst Performing"
    const worstEndpoints = [...endpoints].sort((a, b) => {
        const errA = Number(a.error_hits ?? a.errorHits ?? 0) / Math.max(1, Number(a.total_hits ?? a.totalHits ?? 1));
        const errB = Number(b.error_hits ?? b.errorHits ?? 0) / Math.max(1, Number(b.total_hits ?? b.totalHits ?? 1));
        if (errB !== errA) return errB - errA;
        return Number(b.avg_latency ?? b.avgLatency ?? 0) - Number(a.avg_latency ?? a.avgLatency ?? 0);
    }).slice(0, 5);

    if (!worstEndpoints || worstEndpoints.length === 0) {
        return (
            <Card className={styles.container}>
                <CardHeader>
                    <div className={styles.headerInfo}>
                        <div className={styles.iconContainer}>
                            <Flame className={styles.icon} />
                        </div>
                        <div>
                            <CardTitle>🔥 Top 5 Worst Performing Endpoints</CardTitle>
                            <CardDescription>Monitored endpoints sorted by latency and error rate</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={styles.noDataContainer}>
                        <div className={styles.noDataIcon}>
                            <Activity className={styles.noDataIconSvg} />
                        </div>
                        <p className={styles.noDataText}>No endpoint performance data yet</p>
                        <p className={styles.noDataSubtext}>
                            Endpoint performance statistics will appear here once traffic is recorded
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={styles.container}>
            <CardHeader>
                <div className={styles.headerContainer}>
                    <div className={styles.headerInfo}>
                        <div className={styles.iconContainer}>
                            <Flame className={styles.icon} style={{ color: 'hsl(0, 90%, 50%)' }} />
                        </div>
                        <div>
                            <CardTitle>🔥 Top 5 Worst Performing Endpoints</CardTitle>
                            <CardDescription>Endpoints requiring optimization by highest error rate &amp; latency</CardDescription>
                        </div>
                    </div>
                    <Badge variant="secondary" className={styles.badge}>
                        <TrendingUp className={styles.badgeIcon} />
                        Top {worstEndpoints.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className={styles.endpointsList}>
                    {worstEndpoints.map((endpoint, index) => {
                        const hits = Number(endpoint.total_hits ?? endpoint.totalHits ?? 0);
                        const errors = Number(endpoint.error_hits ?? endpoint.errorHits ?? 0);
                        const avg = Number(endpoint.avg_latency ?? endpoint.avgLatency ?? 0);
                        const p95 = estimateP95(avg);
                        const errorRate = hits > 0 ? ((errors / hits) * 100).toFixed(1) : '0.0';

                        return (
                            <div
                                key={`${endpoint.endpoint}-${endpoint.method}-${index}`}
                                className={styles.endpointItem}
                            >
                                <div className={styles.endpointContent}>
                                    <div className={`${styles.rankBadge} ${getRankColor(index)}`}>
                                        {index + 1}
                                    </div>

                                    <div className={styles.endpointInfo}>
                                        <div className={styles.endpointHeader}>
                                            <code className={styles.endpointPath}>
                                                {endpoint.endpoint}
                                            </code>
                                            <div className={styles.badgeGroup}>
                                                <Badge variant="outline" className={`${styles.methodBadge} ${getMethodColor(endpoint.method)}`}>
                                                    {endpoint.method}
                                                </Badge>
                                                <Badge variant="secondary" className={styles.badge}>
                                                    <Activity className={styles.badgeIcon} />
                                                    {endpoint.serviceName || endpoint.service_name || 'Service'}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className={styles.statsGrid}>
                                            <div className={styles.statItem}>
                                                <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                                                    <TrendingUp className={styles.statIconSvg} />
                                                </div>
                                                <div>
                                                    <p className={styles.statLabel}>Hits</p>
                                                    <p className={styles.statValue}>
                                                        {hits.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className={styles.statItem}>
                                                <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                                                    <Clock className={styles.statIconSvg} />
                                                </div>
                                                <div>
                                                    <p className={styles.statLabel}>Avg Latency</p>
                                                    <p className={styles.statValue}>{avg.toFixed(0)} ms</p>
                                                </div>
                                            </div>
                                            <div className={styles.statItem}>
                                                <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                                                    <Zap className={styles.statIconSvg} />
                                                </div>
                                                <div>
                                                    <p className={styles.statLabel}>P95 Latency</p>
                                                    <p className={styles.statValue}>{p95} ms</p>
                                                </div>
                                            </div>
                                            <div className={styles.statItem}>
                                                <div className={`${styles.statIcon} ${styles.statIconRed}`}>
                                                    <AlertCircle className={styles.statIconSvg} />
                                                </div>
                                                <div>
                                                    <p className={styles.statLabel}>Error Rate</p>
                                                    <p className={`${styles.statValue} ${styles.errorRate}`}>{errorRate}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default TopEndpoints;
