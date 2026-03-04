'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Brain,
  Wifi,
  WifiOff,
  Clock,
  Building,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

/** Left panel — video with rounded inset card */
function LoginImagePanel() {
  return (
    <div className="hr-login-image-panel">
      <div className="hr-login-image-card">
        <video
          src="/hr_login_video.mp4"
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </div>
    </div>
  );
}

/** Reusable input field */
function InputField({
  label,
  icon: Icon,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  endAdornment,
  hint,
}: {
  label: string;
  icon: React.ElementType;
  id?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  endAdornment?: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="hr-field">
      <label className="hr-label" htmlFor={id}>{label}</label>
      <div className="hr-input-wrapper">
        <Icon className="hr-input-icon" />
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="hr-input"
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
        {endAdornment}
      </div>
      {hint && <p className="hr-input-hint">{hint}</p>}
    </div>
  );
}

/** Status badge */
function StatusBadge({ status }: { status: 'checking' | 'online' | 'offline' }) {
  return (
    <div className={`hr-status-badge hr-status-badge--${status}`}>
      {status === 'online' ? (
        <>
          <Wifi className="hr-status-icon" />
          <span>Server Connected</span>
          <span className="hr-status-dot" />
        </>
      ) : status === 'offline' ? (
        <>
          <WifiOff className="hr-status-icon" />
          <span>Server Offline</span>
        </>
      ) : (
        <>
          <div className="hr-status-spinner" />
          <span>Connecting…</span>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setAuthToken, setIsAuthenticated, setUseRealApi } = useStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  useEffect(() => {
    checkBackendStatus();
  }, []);

  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    try {
      await api.healthCheck();
      setBackendStatus('online');
      setUseRealApi(true);
    } catch {
      setBackendStatus('offline');
      setUseRealApi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsPendingApproval(false);
    setIsLoading(true);

    try {
      if (backendStatus === 'online') {
        if (isRegistering) {
          const response = await api.register(name, email, password, 'hr_manager', company || undefined);

          // Check if account is pending approval
          if (!response.access_token || response.user.account_status === 'pending') {
            setIsPendingApproval(true);
            setIsLoading(false);
            return;
          }

          setAuthToken(response.access_token);
          setUser({
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role,
            account_status: response.user.account_status,
            company: response.user.company
          });
          setIsAuthenticated(true);
          router.push('/dashboard');
        } else {
          const response = await api.login(email, password);

          // Check if user is a candidate (should use candidate portal)
          if (response.user.role === 'candidate') {
            setError('This portal is for recruiters only. Please use the Candidate Portal.');
            setIsLoading(false);
            return;
          }

          setAuthToken(response.access_token);
          setUser({
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role,
            account_status: response.user.account_status,
            company: response.user.company
          });
          setIsAuthenticated(true);
          router.push('/dashboard');
        }
      } else {
        throw new Error('Backend server is offline. Please try again later.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      if (errorMessage.toLowerCase().includes('pending')) {
        setIsPendingApproval(true);
      } else {
        setError(errorMessage);
      }
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setIsPendingApproval(false);
  };

  return (
    <>
      <style jsx global>{`
        /* ── Layout ───────────────────────────── */
        .hr-login-page {
          display: flex;
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Left Image Panel ─────────────────── */
        .hr-login-image-panel {
          display: none;
          width: 50%;
          padding: 12px;
        }
        @media (min-width: 1024px) {
          .hr-login-image-panel {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        .hr-login-image-card {
          position: relative;
          width: 100%;
          max-height: 100%;
          aspect-ratio: 1600 / 1800;
          border-radius: 20px;
          overflow: hidden;
        }

        /* ── Right Form Panel ─────────────────── */
        .hr-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          position: relative;
        }
        .hr-form-container {
          width: 100%;
          max-width: 400px;
        }

        /* ── Brand ────────────────────────────── */
        .hr-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 40px;
        }
        .hr-brand-row {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .hr-brand-logo {
          position: absolute;
          right: 100%;
          margin-right: 12px;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #111111;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hr-brand-logo svg {
          width: 22px;
          height: 22px;
          color: #ffffff;
        }
        .hr-brand-title {
          font-size: 32px;
          font-weight: 600;
          color: #111111;
          letter-spacing: -0.03em;
          margin: 0;
        }
        .hr-brand-subtitle {
          font-size: 16px;
          font-weight: 400;
          color: #888888;
          margin-top: 6px;
        }

        /* ── Status Badge ─────────────────────── */
        .hr-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 32px;
        }
        .hr-status-badge--online {
          background: #F0FDF4;
          color: #16A34A;
          border: 1px solid #BBF7D0;
        }
        .hr-status-badge--offline {
          background: #FEF2F2;
          color: #DC2626;
          border: 1px solid #FECACA;
        }
        .hr-status-badge--checking {
          background: #F9FAFB;
          color: #6B7280;
          border: 1px solid #E5E7EB;
        }
        .hr-status-icon {
          width: 14px;
          height: 14px;
        }
        .hr-status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #16A34A;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        .hr-status-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid #D1D5DB;
          border-top-color: #6B7280;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── Heading ──────────────────────────── */
        .hr-heading {
          text-align: center;
          margin-bottom: 32px;
        }
        .hr-heading h2 {
          font-size: 24px;
          font-weight: 600;
          color: #111111;
          letter-spacing: -0.02em;
          margin: 0 0 6px 0;
        }
        .hr-heading p {
          font-size: 15px;
          color: #888888;
          margin: 0;
        }

        /* ── Error ────────────────────────────── */
        .hr-error {
          padding: 12px 16px;
          border-radius: 10px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          font-size: 14px;
          margin-bottom: 24px;
        }

        /* ── Pending Approval ─────────────────── */
        .hr-pending {
          text-align: center;
          padding: 32px 24px;
          border-radius: 16px;
          border: 1px solid #E5E5E5;
          background: #FAFAFA;
        }
        .hr-pending-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #FFFBEB;
          border: 1px solid #FDE68A;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }
        .hr-pending-icon svg {
          width: 28px;
          height: 28px;
          color: #D97706;
        }
        .hr-pending h3 {
          font-size: 18px;
          font-weight: 600;
          color: #111111;
          margin: 0 0 8px 0;
        }
        .hr-pending p {
          font-size: 14px;
          color: #888888;
          margin: 0 0 24px 0;
          line-height: 1.5;
        }
        .hr-pending button {
          background: none;
          border: none;
          color: #111111;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* ── Form fields ──────────────────────── */
        .hr-field {
          margin-bottom: 20px;
        }
        .hr-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #333333;
          margin-bottom: 8px;
        }
        .hr-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .hr-input-icon {
          position: absolute;
          left: 14px;
          width: 18px;
          height: 18px;
          color: #AAAAAA;
          pointer-events: none;
        }
        .hr-input {
          width: 100%;
          padding: 14px 14px 14px 44px;
          border: 1px solid #E5E5E5;
          border-radius: 12px;
          font-size: 15px;
          color: #111111;
          background: #FAFAFA;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .hr-input::placeholder {
          color: #C0C0C0;
        }
        .hr-input:focus {
          border-color: #111111;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
        }
        .hr-input-hint {
          font-size: 12px;
          color: #AAAAAA;
          margin-top: 6px;
        }

        /* ── Password toggle ──────────────────── */
        .hr-password-toggle {
          position: absolute;
          right: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #AAAAAA;
          transition: color 0.15s ease;
        }
        .hr-password-toggle:hover {
          color: #666666;
        }
        .hr-password-toggle svg {
          width: 18px;
          height: 18px;
        }

        /* ── Remember / Forgot ────────────────── */
        .hr-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          margin-top: -4px;
        }
        .hr-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #555555;
          cursor: pointer;
        }
        .hr-remember input[type="checkbox"] {
          width: 16px;
          height: 16px;
          accent-color: #111111;
          border-radius: 4px;
          cursor: pointer;
        }
        .hr-forgot {
          font-size: 14px;
          color: #555555;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .hr-forgot:hover {
          color: #111111;
        }

        /* ── Submit Button ────────────────────── */
        .hr-submit {
          width: 100%;
          padding: 14px 24px;
          border-radius: 48px;
          border: none;
          background: #111111;
          color: #ffffff;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
        }
        .hr-submit:hover:not(:disabled) {
          background: #222222;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        .hr-submit:active:not(:disabled) {
          transform: scale(0.99);
        }
        .hr-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .hr-submit svg {
          width: 18px;
          height: 18px;
        }

        /* ── Divider ──────────────────────────── */
        .hr-divider {
          position: relative;
          margin: 24px 0;
        }
        .hr-divider-line {
          width: 100%;
          height: 1px;
          background: #F0F0F0;
        }
        .hr-divider-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          padding: 0 16px;
          background: #ffffff;
          font-size: 13px;
          color: #AAAAAA;
        }

        /* ── Switch mode link ─────────────────── */
        .hr-switch {
          text-align: center;
          font-size: 14px;
          color: #888888;
        }
        .hr-switch button {
          background: none;
          border: none;
          color: #111111;
          font-weight: 500;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.15s ease;
        }
        .hr-switch button:hover {
          color: #000000;
        }

        /* ── Candidate Portal link ────────────── */
        .hr-candidate-redirect {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #F0F0F0;
          font-size: 14px;
          color: #888888;
        }
        .hr-candidate-redirect a {
          color: #111111;
          font-weight: 500;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }
        .hr-candidate-redirect a:hover {
          opacity: 0.7;
        }

        /* ── Legal footer ─────────────────────── */
        .hr-legal {
          position: absolute;
          bottom: 24px;
          left: 0;
          right: 0;
          text-align: center;
          font-size: 12px;
          color: #BBBBBB;
        }
        .hr-legal a {
          color: #888888;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .hr-legal a:hover {
          color: #111111;
        }

        /* ── Loading spinner ──────────────────── */
        .hr-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="hr-login-page">
        {/* Left Panel — Image */}
        <LoginImagePanel />

        {/* Right Panel — Form */}
        <div className="hr-form-panel">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="hr-form-container"
          >
            {/* Brand */}
            <div className="hr-brand">
              <div className="hr-brand-row">
                <div className="hr-brand-logo">
                  <Brain />
                </div>
                <h1 className="hr-brand-title">HireQ</h1>
              </div>
              <p className="hr-brand-subtitle">Recruiter Portal</p>
            </div>

            {/* Status Badge */}
            <div style={{ textAlign: 'center' }}>
              <StatusBadge status={backendStatus} />
            </div>

            {/* Heading */}
            <div className="hr-heading">
              <h2>{isRegistering ? 'Create Account' : 'Welcome back'}</h2>
              <p>
                {isRegistering
                  ? 'Set up your recruiter account'
                  : 'Sign in to continue to HireQ'}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="hr-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pending Approval */}
            {isPendingApproval ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="hr-pending"
              >
                <div className="hr-pending-icon">
                  <Clock />
                </div>
                <h3>Account Pending Approval</h3>
                <p>
                  Your recruiter account is being reviewed by an administrator.
                  You&apos;ll receive an email once approved.
                </p>
                <button
                  onClick={() => {
                    setIsPendingApproval(false);
                    setIsRegistering(false);
                  }}
                >
                  Back to Sign In
                </button>
              </motion.div>
            ) : (
              <>
                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {isRegistering && (
                      <motion.div
                        key="register-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <InputField
                          label="Full Name"
                          icon={User}
                          id="name"
                          value={name}
                          onChange={setName}
                          placeholder="John Doe"
                          required={isRegistering}
                        />
                        <InputField
                          label="Company Name"
                          icon={Building}
                          id="company"
                          value={company}
                          onChange={setCompany}
                          placeholder="Acme Corp"
                          required={isRegistering}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <InputField
                    label="Email Address"
                    icon={Mail}
                    id="email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="you@example.com"
                  />

                  <InputField
                    label="Password"
                    icon={Lock}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={setPassword}
                    placeholder="••••••••"
                    minLength={6}
                    hint={isRegistering ? 'Minimum 6 characters' : undefined}
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="hr-password-toggle"
                      >
                        {showPassword ? <EyeOff /> : <Eye />}
                      </button>
                    }
                  />

                  {/* Remember me / Forgot password */}
                  {!isRegistering && (
                    <div className="hr-options">
                      <label className="hr-remember">
                        <input type="checkbox" />
                        Remember me
                      </label>
                      <a href="#" className="hr-forgot">
                        Forgot password?
                      </a>
                    </div>
                  )}

                  {/* Submit */}
                  <motion.button
                    type="submit"
                    disabled={isLoading || backendStatus !== 'online'}
                    className="hr-submit"
                    whileHover={{ scale: isLoading ? 1 : 1.01 }}
                    whileTap={{ scale: isLoading ? 1 : 0.99 }}
                  >
                    {isLoading ? (
                      <div className="hr-spinner" />
                    ) : (
                      <>
                        <span>{isRegistering ? 'Create Account' : 'Sign In'}</span>
                        <ArrowRight />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Divider + Toggle */}
                <div className="hr-divider">
                  <div className="hr-divider-line" />
                  <span className="hr-divider-text">or</span>
                </div>

                <div className="hr-switch">
                  {isRegistering ? 'Already have an account?' : "Don\u2019t have an account?"}{' '}
                  <button onClick={toggleMode}>
                    {isRegistering ? 'Sign In' : 'Create one'}
                  </button>
                </div>
              </>
            )}

            {/* Candidate Portal redirect */}
            <div className="hr-candidate-redirect">
              Looking for a job?{' '}
              <Link href="/candidate/login">Go to Candidate Portal →</Link>
            </div>
          </motion.div>

          {/* Legal Footer */}
          <div className="hr-legal">
            By continuing, you agree to our{' '}
            <a href="#">Terms of Service</a>
            {' '}and{' '}
            <a href="#">Privacy Policy</a>
          </div>
        </div>
      </div>
    </>
  );
}
