import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { PageStatus } from '../components/ui';
import { ServiceHealthGrid } from '../components/ServiceHealthGrid';
import { estimateP95 } from '../api/api';
import { Layers } from 'lucide-react';

export default function ServicesPage() {
    const { data, isPending, error, refetch } = useDashboardQuery();

    if (isPending || !data) return <PageStatus isLoading onRetry={refetch} loadingText="Loading services..." />;
    if (error) return <PageStatus error={error} onRetry={refetch} errorText="Failed to load service data" />;

    const services = data?.data?.serviceHealth ?? [];
    const topEndpoints = data?.data?.topEndpoints ?? [];

    // Group endpoints by service
    const serviceEndpoints = {};
    for (const ep of topEndpoints) {
        const svc = ep.service_name ?? ep.serviceName ?? 'unknown';
        if (!serviceEndpoints[svc]) serviceEndpoints[svc] = [];
        serviceEndpoints[svc].push(ep);
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 300ms ease' }}>
            <div>
                <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers style={{ width: '1.5rem', height: '1.5rem', color: 'hsl(var(--primary))' }} />
                    Services
                </h2>
                <p style={{ color: 'hsl(var(--muted-foreground))', margin: 0, fontSize: '0.875rem' }}>
                    Microservice health &amp; performance overview
                </p>
            </div>

            <ServiceHealthGrid services={services} />

            {services.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {services.map(svc => {
                        const eps = serviceEndpoints[svc.service] ?? [];
                        if (eps.length === 0) return null;
                        return (
                            <div key={svc.service} style={{
                                padding: '1.25rem',
                                border: '1px solid hsl(var(--border) / 0.5)',
                                borderRadius: '0.75rem',
                                background: 'hsl(var(--card))',
                            }}>
                                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9375rem', fontWeight: 700, textTransform: 'capitalize' }}>
                                    {svc.service} — Endpoints ({eps.length})
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                    {eps.map((ep, i) => {
                                        const avg = Number(ep.avg_latency ?? ep.avgLatency ?? 0);
                                        const hits = Number(ep.total_hits ?? ep.totalHits ?? 0);
                                        const errors = Number(ep.error_hits ?? ep.errorHits ?? 0);
                                        const errorRate = hits > 0 ? ((errors / hits) * 100).toFixed(1) : '0.0';
                                        const p95 = estimateP95(avg);
                                        return (
                                            <div key={i} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '0.5rem',
                                                background: 'hsl(var(--muted) / 0.3)',
                                            }}>
                                                <span style={{
                                                    padding: '0.1rem 0.35rem',
                                                    borderRadius: '0.25rem',
                                                    fontSize: '0.65rem',
                                                    fontWeight: 700,
                                                    fontFamily: 'monospace',
                                                    background: 'hsl(210, 80%, 55% / 0.15)',
                                                    color: 'hsl(210, 80%, 38%)',
                                                    flexShrink: 0,
                                                }}>
                                                    {ep.method ?? 'GET'}
                                                </span>
                                                <code style={{ flex: 1, fontSize: '0.8rem', fontWeight: 600 }}>
                                                    {ep.endpoint ?? ep.path ?? '/'}
                                                </code>
                                                <span style={{ fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
                                                    {hits.toLocaleString()} reqs · P95 {p95}ms · {errorRate}% errors
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
