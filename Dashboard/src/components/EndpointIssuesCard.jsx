import { AlertCircle, AlertTriangle, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui';
import styles from '../styles/modules/EndpointIssues.module.scss';

const SEVERITY_MAP = {
    critical: { dot: '🔴', labelClass: 'labelCritical', rowClass: 'rowCritical' },
    warning:  { dot: '🟡', labelClass: 'labelWarning',  rowClass: 'rowWarning' },
    info:     { dot: '🔵', labelClass: 'labelInfo',     rowClass: 'rowInfo' },
};

function getMethodClass(method) {
    const map = { GET: 'methodGet', POST: 'methodPost', PUT: 'methodPut', DELETE: 'methodDelete', PATCH: 'methodPatch' };
    return map[method?.toUpperCase()] || 'methodDefault';
}

function IssueRow({ issue, index }) {
    const cfg = SEVERITY_MAP[issue.severity] ?? SEVERITY_MAP.info;

    return (
        <div
            className={`${styles.issueRow} ${styles[cfg.rowClass]}`}
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className={styles.issueDot}>{cfg.dot}</div>
            <div className={styles.issueCenter}>
                <div className={styles.issueTop}>
                    <span className={`${styles.methodBadge} ${styles[getMethodClass(issue.method)]}`}>
                        {issue.method}
                    </span>
                    <code className={styles.endpointPath}>{issue.endpoint}</code>
                </div>
                <div className={styles.issueBottom}>
                    <span className={`${styles.issueTypeBadge} ${styles[cfg.labelClass]}`}>
                        {issue.issueType}
                    </span>
                    <span className={styles.issueDetail}>{issue.detail}</span>
                </div>
            </div>
            <div className={styles.issueMeta}>
                <div className={styles.issueMetaItem}>
                    <span className={styles.metaLabel}>P95</span>
                    <span className={styles.metaValue}>{issue.p95}ms</span>
                </div>
                <div className={styles.issueMetaItem}>
                    <span className={styles.metaLabel}>Avail</span>
                    <span className={`${styles.metaValue} ${Number(issue.availability) < 95 ? styles.metaValueCritical : ''}`}>
                        {issue.availability}%
                    </span>
                </div>
            </div>
        </div>
    );
}

export function EndpointIssuesCard({ issues = [] }) {
    const criticalCount = issues.filter(i => i.severity === 'critical').length;

    return (
        <Card className={styles.container}>
            <CardHeader>
                <div className={styles.headerRow}>
                    <div className={styles.headerLeft}>
                        <div className={styles.headerIcon}>
                            <AlertCircle />
                        </div>
                        <div>
                            <CardTitle>
                                🚨 Current Endpoint Issues
                            </CardTitle>
                            <CardDescription>Endpoints currently requiring attention</CardDescription>
                        </div>
                    </div>
                    {issues.length > 0 && (
                        <div className={styles.headerBadge}>
                            {criticalCount > 0 && (
                                <span className={styles.criticalBadge}>
                                    <AlertTriangle />
                                    {criticalCount} Critical
                                </span>
                            )}
                            <span className={styles.totalBadge}>{issues.length} total</span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {issues.length === 0 ? (
                    <div className={styles.allClear}>
                        <div className={styles.allClearIcon}>
                            <Gauge />
                        </div>
                        <p className={styles.allClearTitle}>No endpoint issues detected</p>
                        <p className={styles.allClearSub}>All monitored endpoints are within healthy thresholds</p>
                    </div>
                ) : (
                    <div className={styles.issuesList}>
                        {issues.map((issue, i) => (
                            <IssueRow
                                key={`${issue.endpoint}-${issue.issueType}-${i}`}
                                issue={issue}
                                index={i}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default EndpointIssuesCard;
