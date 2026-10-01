import { useState, useMemo } from 'react';
import { useDashboardQuery } from '../hooks/useDashboardQuery';
import { PageStatus, Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui';
import { Globe, Search, Filter, ChevronUp, ChevronDown, TrendingUp, Clock, AlertCircle, Activity } from 'lucide-react';
import { estimateP95, deriveEndpointIssues } from '../api/api';
import styles from '../styles/modules/pages/EndpointsPage.module.scss';

const METHODS = ['All', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const HEALTH_FILTERS = ['All', 'Healthy', 'Warning', 'Critical'];

function getMethodClass(method) {
    const map = { GET: 'mGet', POST: 'mPost', PUT: 'mPut', DELETE: 'mDel', PATCH: 'mPatch' };
    return map[method?.toUpperCase()] || 'mDefault';
}

function getHealth(ep) {
    const hits = Number(ep.total_hits ?? ep.totalHits ?? 0);
    const errors = Number(ep.error_hits ?? ep.errorHits ?? 0);
    const avg = Number(ep.avg_latency ?? ep.avgLatency ?? 0);
    const errorRate = hits > 0 ? (errors / hits) * 100 : 0;
    if (errorRate >= 10 || avg > 1500) return 'critical';
    if (errorRate >= 5 || avg > 600) return 'warning';
    return 'healthy';
}

export default function EndpointsPage() {
    const { data, isPending, error, refetch } = useDashboardQuery();
    const [search, setSearch] = useState('');
    const [method, setMethod] = useState('All');
    const [health, setHealth] = useState('All');
    const [sortBy, setSortBy] = useState('totalHits');
    const [sortDir, setSortDir] = useState('desc');

    const allEndpoints = data?.data?.topEndpoints ?? [];

    const endpoints = useMemo(() => {
        let list = allEndpoints.map(ep => ({
            ...ep,
            _hits: Number(ep.total_hits ?? ep.totalHits ?? 0),
            _errors: Number(ep.error_hits ?? ep.errorHits ?? 0),
            _avg: Number(ep.avg_latency ?? ep.avgLatency ?? 0),
            _p95: estimateP95(Number(ep.avg_latency ?? ep.avgLatency ?? 0)),
            _p99: Math.round(estimateP95(Number(ep.avg_latency ?? ep.avgLatency ?? 0)) * 1.3),
            _method: (ep.method ?? 'GET').toUpperCase(),
            _endpoint: ep.endpoint ?? ep.path ?? '/',
            _service: ep.service_name ?? ep.serviceName ?? '',
            _health: getHealth(ep),
            _errorRate: (() => {
                const h = Number(ep.total_hits ?? ep.totalHits ?? 0);
                const e = Number(ep.error_hits ?? ep.errorHits ?? 0);
                return h > 0 ? (e / h) * 100 : 0;
            })(),
            _availability: (() => {
                const h = Number(ep.total_hits ?? ep.totalHits ?? 0);
                const e = Number(ep.error_hits ?? ep.errorHits ?? 0);
                return h > 0 ? ((h - e) / h * 100).toFixed(1) : '100.0';
            })(),
        }));

        if (search) list = list.filter(ep => ep._endpoint.toLowerCase().includes(search.toLowerCase()));
        if (method !== 'All') list = list.filter(ep => ep._method === method);
        if (health !== 'All') list = list.filter(ep => ep._health === health.toLowerCase());

        const dir = sortDir === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            const keyMap = { totalHits: '_hits', errorRate: '_errorRate', avgLatency: '_avg', p95: '_p95', availability: '_availability' };
            const k = keyMap[sortBy] ?? '_hits';
            return (Number(a[k]) - Number(b[k])) * dir;
        });

        return list;
    }, [allEndpoints, search, method, health, sortBy, sortDir]);

    const toggleSort = (col) => {
        if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('desc'); }
    };

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return null;
        return sortDir === 'asc' ? <ChevronUp style={{ width: '0.75rem', height: '0.75rem' }} /> : <ChevronDown style={{ width: '0.75rem', height: '0.75rem' }} />;
    };

    if (isPending || !data) return <PageStatus isLoading onRetry={refetch} loadingText="Loading endpoints..." />;
    if (error) return <PageStatus error={error} onRetry={refetch} errorText="Failed to load endpoints" />;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h2 className={styles.title}>
                        <Globe className={styles.titleIcon} /> Endpoints
                    </h2>
                    <p className={styles.subtitle}>All monitored API endpoints with performance metrics</p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className={styles.filtersRow}>
                    <div className={styles.searchWrap}>
                        <Search className={styles.searchIcon} />
                        <input
                            className={styles.searchInput}
                            placeholder="Search endpoints..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <div className={styles.filterGroup}>
                        <Filter className={styles.filterIcon} />
                        {METHODS.map(m => (
                            <button key={m} className={`${styles.filterBtn} ${method === m ? styles.filterActive : ''}`} onClick={() => setMethod(m)}>{m}</button>
                        ))}
                    </div>
                    <div className={styles.filterGroup}>
                        {HEALTH_FILTERS.map(h => (
                            <button key={h} className={`${styles.filterBtn} ${health === h ? styles.filterActive : ''}`} onClick={() => setHealth(h)}>{h}</button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>{endpoints.length} Endpoints</CardTitle>
                    <CardDescription>Click column headers to sort</CardDescription>
                </CardHeader>
                <CardContent className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Method</th>
                                <th>Endpoint</th>
                                <th className={styles.sortable} onClick={() => toggleSort('totalHits')}>
                                    <TrendingUp style={{ width: '0.75rem', height: '0.75rem' }} /> Requests <SortIcon col="totalHits" />
                                </th>
                                <th className={styles.sortable} onClick={() => toggleSort('avgLatency')}>
                                    <Clock style={{ width: '0.75rem', height: '0.75rem' }} /> Avg Latency <SortIcon col="avgLatency" />
                                </th>
                                <th className={styles.sortable} onClick={() => toggleSort('p95')}>
                                    P95 <SortIcon col="p95" />
                                </th>
                                <th className={styles.sortable} onClick={() => toggleSort('errorRate')}>
                                    <AlertCircle style={{ width: '0.75rem', height: '0.75rem' }} /> Error Rate <SortIcon col="errorRate" />
                                </th>
                                <th className={styles.sortable} onClick={() => toggleSort('availability')}>
                                    <Activity style={{ width: '0.75rem', height: '0.75rem' }} /> Availability <SortIcon col="availability" />
                                </th>
                                <th>Health</th>
                            </tr>
                        </thead>
                        <tbody>
                            {endpoints.length === 0 ? (
                                <tr><td colSpan={8} className={styles.emptyRow}>No endpoints match your filters</td></tr>
                            ) : endpoints.map((ep, i) => (
                                <tr key={`${ep._endpoint}-${ep._method}-${i}`} className={styles.row}>
                                    <td>
                                        <span className={`${styles.methodBadge} ${styles[getMethodClass(ep._method)]}`}>
                                            {ep._method}
                                        </span>
                                    </td>
                                    <td><code className={styles.endpointCell}>{ep._endpoint}</code></td>
                                    <td className={styles.numCell}>{ep._hits.toLocaleString()}</td>
                                    <td className={styles.numCell}>{ep._avg.toFixed(0)}ms</td>
                                    <td className={styles.numCell}>{ep._p95}ms</td>
                                    <td className={styles.numCell}>
                                        <div className={styles.errorRateWrap}>
                                            <div className={styles.errorBar}>
                                                <div
                                                    className={`${styles.errorFill} ${ep._errorRate >= 10 ? styles.fillCritical : ep._errorRate >= 5 ? styles.fillWarn : styles.fillOk}`}
                                                    style={{ width: `${Math.min(100, ep._errorRate)}%` }}
                                                />
                                            </div>
                                            <span className={`${styles.errorText} ${ep._errorRate >= 10 ? styles.textCritical : ep._errorRate >= 5 ? styles.textWarn : styles.textOk}`}>
                                                {ep._errorRate.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className={styles.numCell}>{ep._availability}%</td>
                                    <td>
                                        <span className={`${styles.healthDot} ${ep._health === 'healthy' ? styles.healthOk : ep._health === 'warning' ? styles.healthWarn : styles.healthCritical}`}>
                                            {ep._health === 'healthy' ? '🟢 Healthy' : ep._health === 'warning' ? '🟡 Warning' : '🔴 Critical'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
