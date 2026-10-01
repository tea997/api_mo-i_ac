import { Shield, AlertTriangle, Info, Activity, Zap, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui';
import styles from '../styles/modules/WatchdogInsights.module.scss';

const SEVERITY_CONFIG = {
    critical: { label: 'CRITICAL', icon: AlertTriangle, colorClass: 'severityCritical' },
    warning: { label: 'WARNING', icon: AlertTriangle, colorClass: 'severityWarning' },
    info: { label: 'INFO', icon: Info, colorClass: 'severityInfo' },
};

const TYPE_ICONS = {
    'High Error Rate': AlertTriangle,
    'Elevated Error Rate': AlertTriangle,
    'Latency Spike': Zap,
    'High Latency': Zap,
    'Traffic Surge': TrendingUp,
};

function getMethodClass(method) {
    const map = { GET: 'methodGet', POST: 'methodPost', PUT: 'methodPut', DELETE: 'methodDelete', PATCH: 'methodPatch' };
    return map[method?.toUpperCase()] || 'methodDefault';
}

function WatchdogInsightItem({ insight, index }) {
    const config = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.info;
    const SeverityIcon = config.icon;
    const TypeIcon = TYPE_ICONS[insight.type] ?? Activity;

    return (
        <div
            className={`${styles.insightItem} ${styles[config.colorClass]}`}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            <div className={styles.insightLeft}>
                <div className={`${styles.severityDot} ${styles[`dot_${insight.severity}`]}`} />
                <div className={styles.insightBody}>
                    <div className={styles.insightHeader}>
                        <span className={`${styles.methodBadge} ${styles[getMethodClass(insight.method)]}`}>
                            {insight.method}
                        </span>
                        <code className={styles.endpointPath}>{insight.endpoint}</code>
                        <span className={`${styles.severityBadge} ${styles[`badge_${insight.severity}`]}`}>
                            <SeverityIcon />
                            {config.label}
                        </span>
                    </div>
                    <div className={styles.insightMeta}>
                        <span className={styles.insightType}>
                            <TypeIcon />
                            {insight.type}
                        </span>
                        <span className={styles.insightValue}>{insight.value}</span>
                    </div>
                    <p className={styles.insightMessage}>{insight.message}</p>
                </div>
            </div>
        </div>
    );
}

export function WatchdogInsightsCard({ insights = [] }) {
    const criticalCount = insights.filter(i => i.severity === 'critical').length;
    const warningCount = insights.filter(i => i.severity === 'warning').length;

    return (
        <Card className={styles.container}>
            <CardHeader>
                <div className={styles.headerRow}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <Shield />
                        </div>
                        <div>
                            <CardTitle>Watchdog Insights</CardTitle>
                            <CardDescription>Automated anomaly detection &amp; alerts</CardDescription>
                        </div>
                    </div>
                    <div className={styles.headerCounts}>
                        {criticalCount > 0 && (
                            <span className={styles.countBadgeCritical}>
                                <AlertTriangle /> {criticalCount} Critical
                            </span>
                        )}
                        {warningCount > 0 && (
                            <span className={styles.countBadgeWarning}>
                                {warningCount} Warning
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {insights.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <Shield />
                        </div>
                        <p className={styles.emptyTitle}>All systems operational</p>
                        <p className={styles.emptySubtitle}>No anomalies detected in current traffic</p>
                    </div>
                ) : (
                    <div className={styles.insightsList}>
                        {insights.slice(0, 6).map((insight, i) => (
                            <WatchdogInsightItem key={`${insight.endpoint}-${insight.type}-${i}`} insight={insight} index={i} />
                        ))}
                        {insights.length > 6 && (
                            <div className={styles.moreInsights}>
                                +{insights.length - 6} more anomalies detected
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default WatchdogInsightsCard;
