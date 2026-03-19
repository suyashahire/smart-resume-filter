'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { login, register } from '@/lib/api';

/* ─────────────────────────────────────────────
   Sub-components
   ───────────────────────────────────────────── */

/** Left panel — full-bleed video with rounded inset card */
function LoginImagePanel() {
  return (
    <div className="login-image-panel">
      <div className="login-image-card">
        <video
          src="/candidate_login_video.mp4"
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
  type = 'text',
  value,
  onChange,
  placeholder,
  required = true,
  minLength,
  endAdornment,
}: {
  label: string;
  icon: React.ElementType;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  minLength?: number;
  endAdornment?: React.ReactNode;
}) {
  return (
    <div className="login-field">
      <label className="login-label">{label}</label>
      <div className="login-input-wrapper">
        <Icon className="login-input-icon" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="login-input"
          placeholder={placeholder}
          required={required}
          minLength={minLength}
        />
        {endAdornment}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main page
   ───────────────────────────────────────────── */

export default function CandidateLoginPage() {
  const router = useRouter();
  const { setUser, setAuthToken, setIsAuthenticated } = useStore();

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        const response = await login(formData.email, formData.password);

        // Verify user is a candidate
        if (response.user.role !== 'candidate') {
          setError('This portal is for candidates only. Please use the HR portal.');
          setIsLoading(false);
          return;
        }

        setAuthToken(response.access_token);
        setUser(response.user);
        setIsAuthenticated(true);
        router.push('/candidate');
      } else {
        // Register as candidate
        const response = await register(
          formData.name,
          formData.email,
          formData.password,
          'candidate'
        );

        setAuthToken(response.access_token);
        setUser(response.user);
        setIsAuthenticated(true);
        router.push('/candidate');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Scoped styles — no global CSS file needed */}
      <style jsx global>{`
        /* ── Layout ───────────────────────────── */
        .login-page {
          display: flex;
          min-height: 100vh;
          background: #ffffff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* ── Left Image Panel ─────────────────── */
        .login-image-panel {
          display: none;
          width: 50%;
          padding: 12px;
        }
        @media (min-width: 1024px) {
          .login-image-panel {
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
        .login-image-card {
          position: relative;
          width: 100%;
          max-height: 100%;
          aspect-ratio: 1600 / 1800;
          border-radius: 20px;
          overflow: hidden;
        }

        /* ── Right Form Panel ─────────────────── */
        .login-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
        }
        .login-form-container {
          width: 100%;
          max-width: 420px;
          display: flex;
          flex-direction: column;
          padding: 32px;
          border-radius: 16px;
          border: 1px solid #F0F0F0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.03);
          background: #ffffff;
        }

        /* ── Brand ────────────────────────────── */
        .login-brand {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 4px;
        }
        .login-brand-row {
          position: relative;
          display: inline-flex;
          align-items: center;
        }
        .login-brand-logo {
          position: absolute;
          right: 100%;
          margin-right: 10px;
          width: 34px;
          height: 34px;
          border-radius: 10px;
          background: #111111;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .login-brand-logo svg {
          width: 19px;
          height: 19px;
          color: #ffffff;
        }
        .login-brand-title {
          font-size: 22px;
          font-weight: 600;
          color: #111111;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .login-brand-subtitle {
          font-size: 13px;
          font-weight: 400;
          color: #999999;
          margin-top: 4px;
        }

        /* ── Portal label ────────────────────── */
        .login-portal-label {
          text-align: center;
          font-size: 14px;
          font-weight: 500;
          color: #777777;
          margin-bottom: 24px;
        }

        /* ── Heading ──────────────────────────── */
        .login-heading {
          text-align: center;
          margin-bottom: 24px;
        }
        .login-heading h2 {
          font-size: 28px;
          font-weight: 700;
          color: #111111;
          letter-spacing: -0.025em;
          margin: 0 0 6px 0;
        }
        .login-heading p {
          font-size: 14px;
          color: #999999;
          margin: 0;
        }

        /* ── Error ────────────────────────────── */
        .login-error {
          padding: 12px 16px;
          border-radius: 10px;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          color: #DC2626;
          font-size: 14px;
          margin-bottom: 16px;
        }

        /* ── Form fields ──────────────────────── */
        .login-field {
          margin-bottom: 16px;
        }
        .login-label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #444444;
          margin-bottom: 6px;
        }
        .login-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .login-input-icon {
          position: absolute;
          left: 14px;
          width: 17px;
          height: 17px;
          color: #BBBBBB;
          pointer-events: none;
        }
        .login-input {
          width: 100%;
          height: 48px;
          padding: 0 14px 0 42px;
          border: 1px solid #E5E5E5;
          border-radius: 10px;
          font-size: 14px;
          color: #111111;
          background: #FAFAFA;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .login-input::placeholder {
          color: #C0C0C0;
        }
        .login-input:focus {
          border-color: #8B5CF6;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        /* ── Password toggle ──────────────────── */
        .login-password-toggle {
          position: absolute;
          right: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #BBBBBB;
          transition: color 0.15s ease;
        }
        .login-password-toggle:hover {
          color: #666666;
        }
        .login-password-toggle svg {
          width: 17px;
          height: 17px;
        }

        /* ── Remember / Forgot ────────────────── */
        .login-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          margin-top: -4px;
        }
        .login-remember {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #666666;
          cursor: pointer;
        }
        .login-remember input[type="checkbox"] {
          width: 15px;
          height: 15px;
          accent-color: #8B5CF6;
          border-radius: 4px;
          cursor: pointer;
        }
        .login-forgot {
          font-size: 13px;
          color: #666666;
          text-decoration: none;
          transition: color 0.15s ease;
        }
        .login-forgot:hover {
          color: #111111;
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* ── Submit Button ────────────────────── */
        .login-submit {
          width: 100%;
          height: 48px;
          border-radius: 999px;
          border: none;
          background: #111111;
          color: #ffffff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        }
        .login-submit:hover:not(:disabled) {
          background: #1a1a1a;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
          transform: translateY(-1px);
        }
        .login-submit:active:not(:disabled) {
          transform: scale(0.99) translateY(0);
        }
        .login-submit:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .login-submit svg {
          width: 17px;
          height: 17px;
        }

        /* ── Switch mode link ─────────────────── */
        .login-switch {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: #999999;
        }
        .login-switch button {
          background: none;
          border: none;
          color: #111111;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .login-switch button:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
          color: #000000;
        }

        /* ── HR Portal link ───────────────────── */
        .login-hr-redirect {
          text-align: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #F0F0F0;
          font-size: 13px;
          color: #999999;
        }
        .login-hr-redirect a {
          color: #111111;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.15s ease;
        }
        .login-hr-redirect a:hover {
          text-decoration: underline;
          text-underline-offset: 3px;
        }

        /* ── Footer ───────────────────────────── */
        .login-footer {
          text-align: center;
          font-size: 12px;
          color: #CCCCCC;
          margin-top: 40px;
        }

        /* ── Loading spinner ──────────────────── */
        .login-spinner {
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

      <div className="login-page">
        {/* Left Panel — Image */}
        <LoginImagePanel />

        {/* Right Panel — Form */}
        <div className="login-form-panel">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="login-form-container"
          >
            {/* Brand */}
            <div className="login-brand">
              <div className="login-brand-row">
                <div className="login-brand-logo">
                  <Brain />
                </div>
                <h1 className="login-brand-title">HireQ</h1>
              </div>
              <p className="login-brand-subtitle">Apply Smartly</p>
            </div>

            {/* Portal Label */}
            <p className="login-portal-label">Candidate Portal</p>

            {/* Heading */}
            <div className="login-heading">
              <h2>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
              <p>
                {isLogin
                  ? 'Sign in to track your applications'
                  : 'Join HireQ to start your career journey'}
              </p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="login-error"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <InputField
                      label="Full Name"
                      icon={User}
                      value={formData.name}
                      onChange={(v) => setFormData({ ...formData, name: v })}
                      placeholder="John Doe"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <InputField
                label="Email Address"
                icon={Mail}
                type="email"
                value={formData.email}
                onChange={(v) => setFormData({ ...formData, email: v })}
                placeholder="you@example.com"
              />

              <InputField
                label="Password"
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(v) => setFormData({ ...formData, password: v })}
                placeholder="••••••••"
                minLength={isLogin ? undefined : 8}
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="login-password-toggle"
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                }
              />

              {/* Remember me / Forgot password */}
              {isLogin && (
                <div className="login-options">
                  <label className="login-remember">
                    <input type="checkbox" />
                    Remember me
                  </label>
                  <a href="#" className="login-forgot">
                    Forgot password?
                  </a>
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="login-submit"
                whileHover={{ scale: isLoading ? 1 : 1.01 }}
                whileTap={{ scale: isLoading ? 1 : 0.99 }}
              >
                {isLoading ? (
                  <div className="login-spinner" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight />
                  </>
                )}
              </motion.button>
            </form>

            {/* Switch mode */}
            <div className="login-switch">
              {isLogin ? "Don\u2019t have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
              >
                {isLogin ? 'Create one' : 'Sign in'}
              </button>
            </div>

            {/* HR Portal redirect */}
            <div className="login-hr-redirect">
              Are you a recruiter?{' '}
              <Link href="/login">HR Portal →</Link>
            </div>
            {/* Footer */}
            <div className="login-footer">
              Built with care, for better hiring.
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}
