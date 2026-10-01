import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api';
import { Activity, Lock, User, Loader2, Zap } from 'lucide-react';
import styles from '../styles/modules/Login.module.scss';

function Login({ onLoginSuccess, onShowOnboarding, onShowRegister }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            if (data?.success) {
                onLoginSuccess();
            } else {
                setError(data?.message || 'Invalid username or password');
            }
        },
        onError: (err) => {
            setError(err.response?.data?.message || 'Invalid username or password');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        loginMutation.mutate({ username, password });
    };

    return (
        <div className={styles.container}>
            {/* Left side — illustration */}
            <div className={styles.illustrationSide}>
                <div className={styles.backgroundElements}>
                    <div className={`${styles.backgroundOrb} ${styles.orb1}`}></div>
                    <div className={`${styles.backgroundOrb} ${styles.orb2}`}></div>
                    <div className={`${styles.backgroundOrb} ${styles.orb3}`}></div>
                </div>
                <div className={styles.illustrationContent}>
                    <div className={styles.illustrationLogo}>
                        <Zap />
                    </div>
                    <h2 className={styles.illustrationTitle}>API Monitor</h2>
                    <p className={styles.illustrationSubtitle}>
                        Real-time API monitoring, analytics, and performance insights for your applications.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureDot}></span>
                            Real-time API hit tracking
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureDot}></span>
                            Detailed performance analytics
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureDot}></span>
                            Multi-client key management
                        </div>
                    </div>
                </div>
            </div>

            {/* Right side — login form */}
            <div className={styles.formSide}>
                <div className={styles.loginCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.logoContainer}>
                            <Activity />
                        </div>
                        <h1 className={styles.title}>Welcome Back</h1>
                        <p className={styles.description}>
                            Sign in to access your dashboard
                        </p>
                    </div>
                    <div className={styles.cardContent}>
                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="username" className={styles.label}>
                                    Username
                                </label>
                                <div className={styles.inputContainer}>
                                    <User />
                                    <input
                                        type="text"
                                        id="username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={loginMutation.isPending}
                                        className={styles.input}
                                        placeholder="Enter your username"
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="password" className={styles.label}>
                                    Password
                                </label>
                                <div className={styles.inputContainer}>
                                    <Lock />
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loginMutation.isPending}
                                        className={styles.input}
                                        placeholder="Enter your password"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={loginMutation.isPending}
                            >
                                <div className={styles.buttonContent}>
                                    {loginMutation.isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </div>
                            </button>
                        </form>
                        <div className={styles.footerText}>
                            New here?{' '}
                            <button
                                onClick={onShowRegister}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'hsl(var(--primary))',
                                    fontWeight: 600,
                                    fontSize: '0.875rem',
                                    textDecoration: 'underline',
                                    padding: 0,
                                }}
                            >
                                Create a free account →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
