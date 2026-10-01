import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api';
import { Building2, User, Mail, Lock, Loader2, ArrowLeft, Zap } from 'lucide-react';
import styles from '../styles/modules/Login.module.scss';

function validatePassword(password) {
    const errors = [];
    if (password.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('one number');
    if (!/[^A-Za-z0-9]/.test(password)) errors.push('one special character');
    return errors;
}

function RegisterPage({ onSuccess, onBack }) {
    const [companyName, setCompanyName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const registerMutation = useMutation({
        mutationFn: authApi.clientSelfRegister,
        onSuccess: (data) => {
            if (data.success) {
                setSuccess(true);
                setTimeout(() => onSuccess(), 1500);
            } else {
                setError(data.message || 'Registration failed');
            }
        },
        onError: (err) => {
            const resData = err.response?.data;
            if (resData?.error && Array.isArray(resData.error) && resData.error.length > 0) {
                setError(resData.error.join(', '));
            } else {
                setError(resData?.message || err.message || 'Failed to connect to server');
            }
        },
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        const passwordErrors = validatePassword(password);
        if (passwordErrors.length > 0) {
            setError(`Password must contain ${passwordErrors.join(', ')}`);
            return;
        }
        registerMutation.mutate({ companyName, username, email, password });
    };

    const isPending = registerMutation.isPending;

    return (
        <div className={styles.container}>
            {/* Left branding panel */}
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
                    <h2 className={styles.illustrationTitle}>Start Monitoring</h2>
                    <p className={styles.illustrationSubtitle}>
                        Create your free account and get an API key instantly. Integrate in minutes.
                    </p>
                    <div className={styles.featureList}>
                        <div className={styles.featureItem}>
                            <span className={styles.featureDot}></span>
                            Free API key generated automatically
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureDot}></span>
                            Real-time latency & error tracking
                        </div>
                        <div className={styles.featureItem}>
                            <span className={styles.featureDot}></span>
                            Add team members any time
                        </div>
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div className={styles.formSide}>
                <div className={styles.loginCard}>
                    <div className={styles.cardHeader}>
                        <div className={styles.logoContainer}>
                            <Zap />
                        </div>
                        <h1 className={styles.title}>Create Account</h1>
                        <p className={styles.description}>
                            Start monitoring your APIs in minutes
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
                                🎉 Account created! Redirecting to your dashboard…
                            </div>
                        )}

                        {error && (
                            <div className={styles.errorMessage}>{error}</div>
                        )}

                        <form onSubmit={handleSubmit} className={styles.form}>
                            {/* Company Name */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="reg-company" className={styles.label}>
                                    Company / Organization Name
                                </label>
                                <div className={styles.inputContainer}>
                                    <Building2 />
                                    <input
                                        type="text"
                                        id="reg-company"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        required
                                        disabled={isPending || success}
                                        className={styles.input}
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                            </div>

                            {/* Username */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="reg-username" className={styles.label}>
                                    Username
                                </label>
                                <div className={styles.inputContainer}>
                                    <User />
                                    <input
                                        type="text"
                                        id="reg-username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required
                                        disabled={isPending || success}
                                        className={styles.input}
                                        placeholder="Choose a username"
                                        minLength={3}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="reg-email" className={styles.label}>
                                    Email Address
                                </label>
                                <div className={styles.inputContainer}>
                                    <Mail />
                                    <input
                                        type="email"
                                        id="reg-email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isPending || success}
                                        className={styles.input}
                                        placeholder="you@company.com"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="reg-password" className={styles.label}>
                                    Password
                                </label>
                                <div className={styles.inputContainer}>
                                    <Lock />
                                    <input
                                        type="password"
                                        id="reg-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={isPending || success}
                                        className={styles.input}
                                        placeholder="Min 8 characters with upper, lower, number & symbol"
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className={styles.inputGroup}>
                                <label htmlFor="reg-confirm-password" className={styles.label}>
                                    Confirm Password
                                </label>
                                <div className={styles.inputContainer}>
                                    <Lock />
                                    <input
                                        type="password"
                                        id="reg-confirm-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isPending || success}
                                        className={styles.input}
                                        placeholder="Confirm your password"
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className={styles.submitButton}
                                disabled={isPending || success}
                            >
                                <div className={styles.buttonContent}>
                                    {isPending ? (
                                        <>
                                            <Loader2 className="animate-spin" />
                                            Creating your account…
                                        </>
                                    ) : (
                                        'Create Account'
                                    )}
                                </div>
                            </button>
                        </form>

                        <div className={styles.footerText}>
                            Already have an account?{' '}
                            <button
                                onClick={onBack}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'hsl(var(--primary))',
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    textDecoration: 'underline',
                                    padding: 0,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                }}
                            >
                                <ArrowLeft style={{ width: '0.875rem', height: '0.875rem' }} />
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
