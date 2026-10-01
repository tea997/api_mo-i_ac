import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import {
    LayoutDashboard,
    Settings,
    Zap,
    Users,
    Building2,
    KeyRound,
    Globe,
    Layers,
    ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/modules/layout/Sidebar.module.scss';

const navItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
        description: 'Main dashboard view',
        roles: null, // visible to all
    },
    {
        title: 'Endpoints',
        href: '/endpoints',
        icon: Globe,
        description: 'All monitored API endpoints',
        roles: null,
    },
    {
        title: 'Services',
        href: '/services',
        icon: Layers,
        description: 'Microservice health',
        roles: null,
    },
    {
        title: 'Watchdog',
        href: '/watchdog',
        icon: ShieldAlert,
        description: 'Anomaly history & alerts',
        roles: null,
    },
    {
        title: 'Clients',
        href: '/clients',
        icon: Building2,
        description: 'Manage clients',
        roles: ['super_admin'],
    },
    {
        title: 'Client Users',
        href: '/client-users',
        icon: Users,
        description: 'Manage client users',
        roles: ['super_admin', 'client_admin'],
    },
    {
        title: 'API Keys',
        href: '/api-keys',
        icon: KeyRound,
        description: 'Manage API keys',
        roles: ['super_admin', 'client_admin'],
    },
];

const bottomNavItems = [
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
        description: 'App settings',
        roles: null,
    },
];

export function Sidebar({ isOpen, onClose }) {
    const { user } = useAuth();
    const userRole = user?.role;

    const filterByRole = (items) =>
        items.filter((item) => !item.roles || item.roles.includes(userRole));

    return (
        <>
            {isOpen && (
                <div
                    className={styles.mobileOverlay}
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            <aside
                className={cn(styles.sidebar, !isOpen && styles.closed)}
                aria-label="Sidebar"
                aria-expanded={isOpen}
            >
                <div className={styles.sidebarContainer}>
                    <div className={styles.logoSection}>
                        <div className={cn(styles.logoIcon, 'theme-logo-bg')}>
                            <Zap aria-hidden="true" />
                        </div>
                        <div className={styles.logoText}>
                            <h2 className="theme-text-gradient">API Monitor</h2>
                            <p>By Code Architecture</p>
                        </div>
                    </div>
                    <nav className={styles.navigation} aria-label="Main navigation">
                        <div className={styles.navList}>
                            {filterByRole(navItems).map((item) => {
                                const Icon = item.icon;
                                return (
                                    <NavLink
                                        key={item.href}
                                        to={item.href}
                                        end={item.href === '/'}
                                        onClick={onClose}
                                        className={({ isActive }) =>
                                            cn(styles.navLink, isActive && styles.active)
                                        }
                                    >
                                        <Icon aria-hidden="true" />
                                        <div className={styles.navItem}>
                                            <div>{item.title}</div>
                                        </div>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </nav>
                    <div className={styles.bottomNavigation}>
                        {filterByRole(bottomNavItems).map((item) => {
                            const Icon = item.icon;
                            return (
                                <NavLink
                                    key={item.href}
                                    to={item.href}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        cn(styles.navLink, isActive && styles.active)
                                    }
                                >
                                    <Icon aria-hidden="true" />
                                    <div className={styles.navItem}>
                                        <div>{item.title}</div>
                                    </div>
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </aside>
        </>
    );
}
