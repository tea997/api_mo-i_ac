import { Card, CardContent } from './ui';
import {
    TrendingUp, Clock, AlertTriangle, CheckCircle2,
    Zap, Activity, Shield, Users
} from 'lucide-react';
import styles from '../styles/modules/StatsGrid.module.scss';

function getApdexLabel(score) {
    if (score === null || score === undefined) return { label: 'N/A', cls: 'apdexNa' };
    const v = parseFloat(score);
    if (v >= 0.94) return { label: 'Excellent', cls: 'apdexExcellent' };
    if (v >= 0.85) return { label: 'Good', cls: 'apdexGood' };
    if (v >= 0.70) return { label: 'Fair', cls: 'apdexFair' };
    return { label: 'Poor', cls: 'apdexPoor' };
}

function StatCard({ stat, index }) {
    const Icon = stat.icon;
    return (
        <Card
            className={styles.statCard}
            style={{ animationDelay: `${index * 60}ms` }}
        >
            <CardContent className={styles.cardContent}>
                <div className={styles.contentLayout}>
                    <div className={styles.textContent}>
                        <p className={styles.title}>{stat.title}</p>
                        <h3 className={`${styles.value} ${stat.gradientClass}`}>
                            {stat.value}
                        </h3>
                        {stat.badge ? (
                            <span className={`${styles.badge} ${styles[stat.badge.cls]}`}>
                                {stat.badge.label}
                            </span>
                        ) : (
                            <p className={styles.subtitle}>{stat.subtitle}</p>
                        )}
                    </div>
                    <div className={`${styles.iconContainer} ${stat.bgClass}`}>
                        <Icon className={stat.textClass} />
                    </div>
                </div>
                <div className={`${styles.progressBar} ${stat.progressClass}`} />
            </CardContent>
        </Card>
    );
}

function StatsGrid({ stats, apmMetrics }) {
    const successRate = 100 - (stats?.errorRate ?? 0);
    const apdexBadge = getApdexLabel(apmMetrics?.apdexScore);

    const statCards = [
        {
            title: '📈 Total Requests',
            value: Number(stats?.totalHits ?? 0).toLocaleString(),
            subtitle: 'Last 24 hours',
            icon: TrendingUp,
            gradientClass: styles.gradientBlue,
            bgClass: styles.bgBlue,
            textClass: styles.textBlue,
            progressClass: styles.progressBlue,
        },
        {
            title: '⚡ P95 Latency',
            value: `${apmMetrics?.p95Latency ?? 0}ms`,
            subtitle: `Avg: ${Number(stats?.avgLatency ?? 0).toFixed(0)}ms`,
            icon: Clock,
            gradientClass: styles.gradientPurple,
            bgClass: styles.bgPurple,
            textClass: styles.textPurple,
            progressClass: styles.progressPurple,
        },
        {
            title: '❌ Error Rate',
            value: `${Number(stats?.errorRate ?? 0).toFixed(1)}%`,
            subtitle: `${Number(stats?.errorHits ?? 0).toLocaleString()} errors`,
            icon: AlertTriangle,
            gradientClass: styles.gradientRed,
            bgClass: styles.bgRed,
            textClass: styles.textRed,
            progressClass: styles.progressRed,
        },
        {
            title: '😊 Apdex Score',
            value: apmMetrics?.apdexScore ?? 'N/A',
            badge: apdexBadge,
            icon: CheckCircle2,
            gradientClass: styles.gradientGreen,
            bgClass: styles.bgGreen,
            textClass: styles.textGreen,
            progressClass: styles.progressGreen,
        },
        {
            title: '🚀 Throughput',
            value: `${apmMetrics?.rps ?? '0.00'}/s`,
            subtitle: 'Requests per second',
            icon: Zap,
            gradientClass: styles.gradientIndigo,
            bgClass: styles.bgIndigo,
            textClass: styles.textIndigo,
            progressClass: styles.progressIndigo,
        },
        {
            title: '🟢 Availability',
            value: `${apmMetrics?.availability ?? 100}%`,
            subtitle: `${Number(stats?.successHits ?? 0).toLocaleString()} successful`,
            icon: Activity,
            gradientClass: styles.gradientGreen,
            bgClass: styles.bgGreen,
            textClass: styles.textGreen,
            progressClass: styles.progressGreen,
        },
        {
            title: '🚨 Active Alerts',
            value: stats?.activeAlerts ?? '—',
            subtitle: 'Watchdog anomalies',
            icon: Shield,
            gradientClass: styles.gradientOrange,
            bgClass: styles.bgOrange,
            textClass: styles.textOrange,
            progressClass: styles.progressOrange,
        },
        {
            title: '⚙️ Active Services',
            value: Number(stats?.uniqueServices ?? 0),
            subtitle: `${Number(stats?.uniqueEndpoints ?? 0)} endpoints`,
            icon: Users,
            gradientClass: styles.gradientYellow,
            bgClass: styles.bgYellow,
            textClass: styles.textYellow,
            progressClass: styles.progressYellow,
        },
    ];

    return (
        <div className={styles.container}>
            {statCards.map((stat, i) => (
                <StatCard key={stat.title} stat={stat} index={i} />
            ))}
        </div>
    );
}

export default StatsGrid;
