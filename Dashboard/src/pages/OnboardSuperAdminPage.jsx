import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api';
import { Activity, User, Mail, Lock, Loader2, ArrowLeft, Shield } from 'lucide-react';
import styles from '../styles/modules/Login.module.scss';

function OnboardSuperAdminPage({ onSuccess, onBack }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const onboardMutation = useMutation({
        mutationFn: authApi.onboardSuperAdmin,
        onSuccess: (data) => {
            if (data.success) {
                setSuccess(true);
                setTimeout(() => onSuccess(), 1500);
            } else {
                setError(data.message || 'Onboarding failed');
            }
        },
        onError: (error) => {
            setError(error.response?.data?.message || 'Failed to connect to server');
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        onboardMutation.mutate({ username, email, password });
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
                        <Shield />
                    </div>
                    <h2 className={styles.illustrationTitle}>First-Time Setup</h2>
                    <p className={styles.illustrationSubtitle}>
                        Onboard your primary Super Admin account to manage clients, API keys, and system metrics.
                    </p>
                </div>
            </div>

            {/* Right side — form centered */}
            <div className={styles.formSide}>
                <div className={styles.loginCard} style={{ maxWidth: '28rem' }}>
                    <div className={styles.cardHeader}>
                        <div className={styles.logoContainer}>
                            <Shield />
                        </div>
                        <h1 className={styles.title}>
                            First-Time Setup
                        </h1>
                        <p className={styles.description}>
                            Create your Super Admin account to get started
                        </p>
                    </div>
                    <div className={styles.cardContent}>
                        {success && (
                            <div style={{
                                marginBottom: '1rem',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                border: '1px solid rgba(34, 197, 94, 0.5)',
                                color: 'rgb(74, 222, 128)',
                                fontSize: '0.875rem',
                            }}>
                                Super Admin created successfully! Redirecting…
                            </div>
                        )}
                        {error && (
                            <div className={styles.errorMessage}>
                                {error}
                            </div>
                        )}
                        <form onSubmit={handleSubmit} className={styles.form}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="onboard-username" className={styles.label}>
                                    Username
                                </label>
                                <div className={styles.inputContainer}>
                                    <User />
                                    <input
                                        type="text"
                                        id="onboard-username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={onboardMutation.isPending || success}
                                        className={styles.input}
                                        placeholder="Choose a username"
                                        minLength={3}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="onboard-email" className={styles.label}>
                                    Email
                                </label>
                                <div className={styles.inputContainer}>
                                    <Mail />
                                    <input
                                        type="email"
                                        id="onboard-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={onboardMutation.isPending || success}
                                        className={styles.input}
                                        placeholder="admin@example.com"
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="onboard-password" className={styles.label}>
                                    Password
                                </label>
                                <div className={styles.inputContainer}>
                                    <Lock />
                                    <input
                                        type="password"
                                        id="onboard-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={onboardMutation.isPending || success}
                                        className={styles.input}
                                        placeholder="Min 6 chars, 1 upper, 1 number, 1 special"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="onboard-confirm-password" className={styles.label}>
                                    Confirm Password
                                </label>
                                <div className={styles.inputContainer}>
                                    <Lock />
                                    <input
                                        type="password"
                                        id="onboard-confirm-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={onboardMutation.isPending || success}
                                        className={styles.input}
                                        placeholder="Confirm your password"
                                        minLength={6}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={onboardMutation.isPending || success}
                            >
                                <div className={styles.buttonContent}>
                                    {onboardMutation.isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Creating account...
                                        </>
                                    ) : (
                                        'Create Super Admin'
                                    )}
                                </div>
                            </button>
                        </form>
                        <div className={styles.footerText}>
                            <button
                                onClick={onBack}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    color: 'hsl(var(--primary))',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <ArrowLeft style={{ width: '1rem', height: '1rem' }} />
                                Back to Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OnboardSuperAdminPage;
