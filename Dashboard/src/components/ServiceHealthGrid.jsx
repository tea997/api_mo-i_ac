import { Activity, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui';
import styles from '../styles/modules/ServiceHealth.module.scss';

function getServiceIcon(name) {
    const n = name?.toLowerCase() ?? '';
    if (n.includes('auth') || n.includes('login')) return '🔐';
    if (n.includes('order')) return '📦';
    if (n.includes('payment') || n.includes('pay')) return '💳';
    if (n.includes('user') || n.includes('account')) return '👤';
    if (n.includes('product') || n.includes('item')) return '🛍️';
    if (n.includes('analytics') || n.includes('metric')) return '📊';
    if (n.includes('notif') || n.includes('alert')) return '🔔';
    return '⚙️';
}

function ServiceCard({ service, index }) {
    const isHealthy = service.health === 'healthy';
    const isDegraded = service.health === 'degraded';
    const isCritical = service.health === 'critical';

    const HealthIcon = isCritical ? XCircle : isDegraded ? AlertTriangle : CheckCircle2;
    const healthLabel = isCritical ? 'Critical' : isDegraded ? 'Degraded' : 'Healthy';

    return (
        <div
            className={`${styles.serviceCard} ${isCritical ? styles.cardCritical : isDegraded ? styles.cardDegraded : styles.cardHealthy}`}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            <div className={styles.serviceTop}>
                <div className={styles.serviceIcon}>{getServiceIcon(service.service)}</div>
                <div className={styles.serviceInfo}>
                    <h4 className={styles.serviceName}>
                        {service.service.charAt(0).toUpperCase() + service.service.slice(1)}
                    </h4>
                    <div className={`${styles.healthBadge} ${isCritical ? styles.healthCritical : isDegraded ? styles.healthDegraded : styles.healthHealthy}`}>
                        <HealthIcon />
                        {healthLabel}
                    </div>
                </div>
            </div>

            <div className={styles.serviceStats}>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Requests</span>
                    <span className={styles.statValue}>{Number(service.totalHits).toLocaleString()}</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Avg Latency</span>
                    <span className={styles.statValue}>{service.avgLatency}ms</span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Error Rate</span>
                    <span className={`${styles.statValue} ${parseFloat(service.errorRate) > 5 ? styles.statValueError : parseFloat(service.errorRate) > 2 ? styles.statValueWarn : ''}`}>
                        {service.errorRate}%
                    </span>
                </div>
                <div className={styles.statItem}>
                    <span className={styles.statLabel}>Availability</span>
                    <span className={`${styles.statValue} ${parseFloat(service.availability) < 95 ? styles.statValueError : ''}`}>
                        {service.availability}%
                    </span>
                </div>
            </div>

            {/* Availability bar */}
            <div className={styles.availBar}>
                <div
                    className={`${styles.availFill} ${isCritical ? styles.fillCritical : isDegraded ? styles.fillDegraded : styles.fillHealthy}`}
                    style={{ width: `${Math.min(100, parseFloat(service.availability))}%` }}
                />
            </div>
        </div>
    );
}

export function ServiceHealthGrid({ services = [] }) {
    if (services.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={styles.headerIcon}><Activity /></div>
                        <div>
                            <CardTitle>Service Health</CardTitle>
                            <CardDescription>Microservice availability & performance</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={styles.emptyState}>
                        <Activity className={styles.emptyIcon} />
                        <p>No service data yet. Send traffic to see service health.</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const healthyCount = services.filter(s => s.health === 'healthy').length;
    const criticalCount = services.filter(s => s.health === 'critical').length;

    return (
        <Card>
            <CardHeader>
                <div className={styles.headerRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className={styles.headerIcon}><Activity /></div>
                        <div>
                            <CardTitle>🏥 Service Health</CardTitle>
                            <CardDescription>Microservice availability & performance</CardDescription>
                        </div>
                    </div>
                    <div className={styles.headerSummary}>
                        <span className={styles.summaryHealthy}>
                            <CheckCircle2 /> {healthyCount} Healthy
                        </span>
                        {criticalCount > 0 && (
                            <span className={styles.summaryCritical}>
                                <XCircle /> {criticalCount} Critical
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className={styles.grid}>
                    {services.map((svc, i) => (
                        <ServiceCard key={svc.service} service={svc} index={i} />
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

export default ServiceHealthGrid;
