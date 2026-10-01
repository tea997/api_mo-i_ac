import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Login from './components/Login';
import { authApi } from './api/api';
import { DashboardLayout } from './components/layout';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ClientOnboardingPage = lazy(() => import('./pages/ClientOnboardingPage'));
const ClientUsersPage = lazy(() => import('./pages/ClientUsersPage'));
const ApiKeyPage = lazy(() => import('./pages/ApiKeyPage'));
const OnboardSuperAdminPage = lazy(() => import('./pages/OnboardSuperAdminPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const EndpointsPage = lazy(() => import('./pages/EndpointsPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const WatchdogPage = lazy(() => import('./pages/WatchdogPage'));

const pageFallback = (
    <div style={{ height: '60vh', display: 'grid', placeItems: 'center', background: '#ffffff' }}>Loading…</div>
);

function AuthGate() {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [user, setUser] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        const controller = new AbortController();
        authApi.getProfile({ signal: controller.signal })
            .then((res) => {
                if (res?.data) {
                    setUser(res.data);
                    setIsAuthenticated(true);
                } else {
                    setUser(null);
                    setIsAuthenticated(false);
                }
            })
            .catch(() => {
                setUser(null);
                setIsAuthenticated(false);
            });
        return () => controller.abort();
    }, []);

    const handleLoginSuccess = useCallback(async () => {
        try {
            const res = await authApi.getProfile();
            setUser(res.data);
            setIsAuthenticated(true);
        } catch {
            setUser(null);
            setIsAuthenticated(false);
        }
    }, []);

    const handleLogout = useCallback(async () => {
        try { await authApi.logout(); } catch { }
        queryClient.clear();
        setUser(null);
        setIsAuthenticated(false);
    }, [queryClient]);

    useEffect(() => {
        const handle401 = () => {
            setUser(null);
            setIsAuthenticated(false);
        };
        window.addEventListener('auth:unauthorized', handle401);
        return () => window.removeEventListener('auth:unauthorized', handle401);
    }, []);

    if (isAuthenticated === null) {
        return (
            <div style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#ffffff' }}>
                Checking authentication…
            </div>
        );
    }

    if (!isAuthenticated) {
        if (showOnboarding) {
            return (
                <Suspense fallback={pageFallback}>
                    <OnboardSuperAdminPage
                        onSuccess={handleLoginSuccess}
                        onBack={() => setShowOnboarding(false)}
                    />
                </Suspense>
            );
        }
        if (showRegister) {
            return (
                <Suspense fallback={pageFallback}>
                    <RegisterPage
                        onSuccess={handleLoginSuccess}
                        onBack={() => setShowRegister(false)}
                    />
                </Suspense>
            );
        }
        return (
            <Login
                onLoginSuccess={handleLoginSuccess}
                onShowOnboarding={() => setShowOnboarding(true)}
                onShowRegister={() => setShowRegister(true)}
            />
        );
    }

    const isSuperAdmin = user?.role === 'super_admin';
    const isClientAdmin = user?.role === 'client_admin';
    const canManage = isSuperAdmin || isClientAdmin;

    return (
        <AuthProvider user={user} onLogout={handleLogout}>
            <DashboardLayout onLogout={handleLogout}>
                <Suspense fallback={pageFallback}>
                    <Routes>
                        <Route path="/" element={<OverviewPage />} />
                        <Route path="/endpoints" element={<EndpointsPage />} />
                        <Route path="/services" element={<ServicesPage />} />
                        <Route path="/watchdog" element={<WatchdogPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                        {isSuperAdmin && (
                            <Route path="/clients" element={<ClientOnboardingPage />} />
                        )}
                        {canManage && (
                            <Route path="/client-users" element={<ClientUsersPage />} />
                        )}
                        {canManage && (
                            <Route path="/api-keys" element={<ApiKeyPage />} />
                        )}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </DashboardLayout>
        </AuthProvider>
    );
}

function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <AuthGate />
                    </BrowserRouter>
                </ToastProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

export default App;