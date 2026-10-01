import { useState } from 'react';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { PageStatus, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui';
import { ShieldAlert, AlertTriangle, Zap, TrendingUp, CheckCircle2, Filter } from 'lucide-react';

const SEVERITIES = ['All', 'Critical', 'Warning', 'Info'];
const TYPES = ['All', 'High Error Rate', 'Elevated Error Rate', 'Latency Spike', 'High Latency', 'Traffic Surge'];

const TYPE_ICONS = {
    'High Error Rate': AlertTriangle,
    'Elevated Error Rate': AlertTriangle,
    'Latency Spike': Zap,
    'High Latency': Zap,
    'Traffic Surge': TrendingUp,
};

const METHOD_STYLES = {
    GET: { background: 'hsl(142, 76%, 36% / 0.15)', color: 'hsl(142, 76%, 28%)' },
    POST: { background: 'hsl(210, 80%, 55% / 0.15)', color: 'hsl(210, 80%, 38%)' },
    PUT: { background: 'hsl(38, 92%, 50% / 0.15)', color: 'hsl(38, 92%, 33%)' },
    DELETE: { background: 'hsl(0, 90%, 60% / 0.15)', color: 'hsl(0, 90%, 43%)' },
    PATCH: { background: 'hsl(265, 82%, 50% / 0.15)', color: 'hsl(265, 82%, 40%)' },
};

const SEVERITY_STYLES = {
    critical: { border: 'hsl(0, 90%, 60% / 0.25)', bg: 'hsl(0, 90%, 60% / 0.05)', dot: 'hsl(0, 90%, 50%)', badge: { bg: 'hsl(0, 90%, 60% / 0.15)', color: 'hsl(0, 90%, 43%)' } },
    warning:  { border: 'hsl(38, 92%, 50% / 0.25)', bg: 'hsl(38, 92%, 50% / 0.05)', dot: 'hsl(38, 92%, 45%)', badge: { bg: 'hsl(38, 92%, 50% / 0.15)', color: 'hsl(38, 92%, 33%)' } },
    info:     { border: 'hsl(210, 80%, 55% / 0.25)', bg: 'hsl(210, 80%, 55% / 0.05)', dot: 'hsl(210, 80%, 55%)', badge: { bg: 'hsl(210, 80%, 55% / 0.15)', color: 'hsl(210, 80%, 38%)' } },
};

export default function WatchdogPage() {
    const { data, isPending, error, refetch } = useDashboardQuery();
    const [severity, setSeverity] = useState('All');
    const [typeFilter, setTypeFilter] = useState('All');

    if (isPending || !data) return <PageStatus isLoading onRetry={refetch} loadingText="Loading Watchdog alerts..." />;
    if (error) return <PageStatus error={error} onRetry={refetch} errorText="Failed to load Watchdog data" />;

    const allInsights = data?.data?.watchdogInsights ?? [];

    const filtered = allInsights.filter(i => {
        const matchSev = severity === 'All' || i.severity === severity.toLowerCase();
        const matchType = typeFilter === 'All' || i.type === typeFilter;
        return matchSev && matchType;
    });

    const criticalCount = allInsights.filter(i => i.severity === 'critical').length;
    const warningCount = allInsights.filter(i => i.severity === 'warning').length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Header */}
            <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShieldAlert style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--primary))' }} />
                    Watchdog Insights
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))', margin: 0, fontSize: '0.875rem' }}>
                    Automated anomaly detection &amp; alert history
                </p>
            </div>

            {/* Summary row */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Alerts', value: allInsights.length, color: 'hsl(265, 82%, 50%)' },
                    { label: 'Critical', value: criticalCount, color: 'hsl(0, 90%, 45%)' },
                    { label: 'Warnings', value: warningCount, color: 'hsl(38, 92%, 40%)' },
                    { label: 'All Clear', value: allInsights.length === 0 ? '✅' : '—', color: 'hsl(142, 76%, 36%)' },
                ].map(s => (
                    <div key={s.label} style={{
                        flex: '1',
                        minWidth: '120px',
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid hsl(var(--border) / 0.5)',
                        background: 'hsl(var(--card))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                    }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'hsl(var(--muted-foreground))' }}>{s.label}</span>
                        <span style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <Card>
                <CardContent style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Filter style={{ width: '0.875rem', height: '0.875rem', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {SEVERITIES.map(s => (
                            <button key={s} onClick={() => setSeverity(s)} style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '0.375rem',
                                border: '1px solid hsl(var(--border))',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                background: severity === s ? 'hsl(var(--primary))' : 'transparent',
                                color: severity === s ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                            }}>{s}</button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {TYPES.map(t => (
                            <button key={t} onClick={() => setTypeFilter(t)} style={{
                                padding: '0.3rem 0.6rem',
                                borderRadius: '0.375rem',
                                border: '1px solid hsl(var(--border))',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                cursor: 'pointer',
                                background: typeFilter === t ? 'hsl(var(--primary))' : 'transparent',
                                color: typeFilter === t ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))',
                            }}>{t}</button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Alert list */}
            <Card>
                <CardHeader>
                    <CardTitle>{filtered.length} Alerts</CardTitle>
                    <CardDescription>Showing {severity !== 'All' ? severity : 'all severities'}, {typeFilter !== 'All' ? typeFilter : 'all types'}</CardDescription>
                </CardHeader>
                <CardContent>
                    {filtered.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '0.75rem', textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
                            <CheckCircle2 style={{ width: '3rem', height: '3rem', color: 'hsl(142, 76%, 36%)' }} />
                            <p style={{ margin: 0, fontWeight: 600, color: 'hsl(142, 76%, 30%)' }}>No alerts match your filters</p>
                            <p style={{ margin: 0, fontSize: '0.875rem' }}>All systems appear operational with current filter settings</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {filtered.map((insight, i) => {
                                const sStyle = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.info;
                                const Icon = TYPE_ICONS[insight.type] ?? ShieldAlert;
                                const mStyle = METHOD_STYLES[insight.method?.toUpperCase()] ?? {};
                                return (
                                    <div key={i} style={{
                                        padding: '1rem',
                                        borderRadius: '0.625rem',
                                        border: `1px solid ${sStyle.border}`,
                                        background: sStyle.bg,
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.875rem',
                                        animation: 'fadeIn 300ms ease',
                                    }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: sStyle.dot, flexShrink: 0, marginTop: '0.4rem', boxShadow: `0 0 6px ${sStyle.dot}88` }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                                                <span style={{ ...mStyle, padding: '0.1rem 0.35rem', borderRadius: '0.25rem', fontSize: '0.65rem', fontWeight: 700, fontFamily: 'monospace' }}>
                                                    {insight.method}
                                                </span>
                                                <code style={{ fontSize: '0.8rem', fontWeight: 700 }}>{insight.endpoint}</code>
                                                <span style={{ ...sStyle.badge, padding: '0.1rem 0.45rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.04em', marginLeft: 'auto' }}>
                                                    {insight.severity.toUpperCase()}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                                <Icon style={{ width: '0.75rem', height: '0.75rem', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--foreground) / 0.7)' }}>{insight.type}</span>
                                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(265, 82%, 50%)', background: 'hsl(265, 82%, 50% / 0.08)', padding: '0.1rem 0.35rem', borderRadius: '0.25rem' }}>
                                                    {insight.value}
                                                </span>
                                            </div>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.775rem', color: 'hsl(var(--muted-foreground))' }}>
                                                {insight.message}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
