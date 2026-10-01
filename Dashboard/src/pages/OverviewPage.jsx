import { useMemo, useState } from 'react';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import StatsGrid from '../components/StatsGrid';
import TopEndpoints from '../components/TopEndpoints';
import { ApiHitsChart, StatusDistributionChart } from '../components/charts';
import { PageStatus } from '../components/ui';
import { WatchdogInsightsCard } from '../components/WatchdogInsightsCard';
import { EndpointIssuesCard } from '../components/EndpointIssuesCard';
import { ServiceHealthGrid } from '../components/ServiceHealthGrid';
import { LiveRequestStream } from '../components/LiveRequestStream';
import styles from '../styles/modules/pages/PageComponents.module.scss';

const TIME_RANGES = [
    { label: '1H', value: '1h', ms: 60 * 60 * 1000 },
    { label: '24H', value: 'daily', ms: 24 * 60 * 60 * 1000 },
    { label: '7D', value: 'weekly', ms: 7 * 24 * 60 * 60 * 1000 },
    { label: '30D', value: 'monthly', ms: 30 * 24 * 60 * 60 * 1000 },
];

export function OverviewPage() {
    const [activeRange, setActiveRange] = useState('daily');
    const { data, isPending, error, refetch } = useDashboardQuery();

    const stats = data?.data?.stats ?? null;
    const topEndpoints = data?.data?.topEndpoints ?? [];
    const apmMetrics = data?.data?.apmMetrics ?? null;
    const serviceHealth = data?.data?.serviceHealth ?? [];
    const watchdogInsights = data?.data?.watchdogInsights ?? [];
    const endpointIssues = data?.data?.endpointIssues ?? [];

    // Enrich stats with active alert count from watchdog insights
    const enrichedStats = useMemo(() => {
        if (!stats) return null;
        return { ...stats, activeAlerts: watchdogInsights.filter(i => i.severity === 'critical').length || (watchdogInsights.length > 0 ? watchdogInsights.length : '—') };
    }, [stats, watchdogInsights]);

    const statusData = useMemo(() => {
        if (!stats) return null;
        return {
            labels: ['Success (2xx)', 'Errors (4xx/5xx)'],
            values: [stats.successHits, stats.errorHits],
        };
    }, [stats]);

    if (isPending || error || !data) {
        return (
            <PageStatus
                isLoading={isPending || !data}
                error={error}
                onRetry={refetch}
                loadingText="Loading dashboard..."
                errorText="Failed to load dashboard data"
            />
        );
    }

    return (
        <div className={styles.pageContainer}>
            {/* Page header */}
            <div className={styles.pageHeader}>
                <div className={styles.headerWithActions}>
                    <div>
                        <h2>Dashboard</h2>
                        <p>API Monitoring & Application Performance</p>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '0.25rem',
                        background: 'hsl(var(--muted) / 0.5)',
                        borderRadius: '0.5rem',
                        padding: '0.25rem',
                    }}>
                        {TIME_RANGES.map((range) => (
                            <button
                                key={range.value}
                                onClick={() => setActiveRange(range.value)}
                                style={{
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                    background: activeRange === range.value
                                        ? 'linear-gradient(135deg, hsl(265, 82%, 50%), hsl(245, 80%, 55%))'
                                        : 'transparent',
                                    color: activeRange === range.value
                                        ? 'white'
                                        : 'hsl(var(--muted-foreground))',
                                    boxShadow: activeRange === range.value
                                        ? '0 2px 8px hsla(265, 82%, 50%, 0.3)'
                                        : 'none',
                                }}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 1. 8 KPI Cards */}
            <StatsGrid stats={enrichedStats} apmMetrics={apmMetrics} />

            {/* 2. Traffic + Status Distribution */}
            <div className={styles.gridTwoCols}>
                <ApiHitsChart stats={stats} />
                <StatusDistributionChart data={statusData} />
            </div>

            {/* 3. Watchdog Insights */}
            <WatchdogInsightsCard insights={watchdogInsights} />

            {/* 4. Top 5 Worst Performing Endpoints */}
            <TopEndpoints endpoints={topEndpoints} />

            {/* 5. Service Health Grid */}
            <ServiceHealthGrid services={serviceHealth} />

            {/* 6. Live Request Stream */}
            <LiveRequestStream endpoints={topEndpoints} />

            {/* 7. Endpoint Issues */}
            <EndpointIssuesCard issues={endpointIssues} />
        </div>
    );
}
