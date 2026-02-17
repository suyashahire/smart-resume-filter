'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, Lock, Bell, Moon, Sun, Shield, Trash2,
  Download, LogOut, Save, Eye, EyeOff, Check, AlertCircle,
  FileText, Briefcase, Clock, ChevronRight, KeyRound,
  Activity, Palette, Smartphone, Globe, History, Zap,
  CheckCircle2, XCircle, AlertTriangle, Building
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useTheme } from '@/contexts/ThemeContext';
import * as api from '@/lib/api';

/* ─── reusable toggle ─── */
function Toggle({ enabled, onChange, accentColor = 'cyan' }: { enabled: boolean; onChange: () => void; accentColor?: string }) {
  const colors: Record<string, string> = {
    cyan: 'bg-cyan-500 shadow-cyan-500/40',
    amber: 'bg-amber-500 shadow-amber-500/40',
    purple: 'bg-purple-500 shadow-purple-500/40',
    emerald: 'bg-emerald-500 shadow-emerald-500/40',
    red: 'bg-red-500 shadow-red-500/40',
  };
  return (
    <button onClick={onChange} className={`relative w-12 h-6 rounded-full transition-all duration-300 ${enabled ? `${colors[accentColor]} shadow-lg` : 'bg-white/10'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow-md transition-all duration-300 ${enabled ? 'translate-x-6 bg-white' : 'translate-x-0 bg-gray-400'}`} />
    </button>
  );
}

/* ─── password strength ─── */
function PasswordStrength({ password }: { password: string }) {
  const getStrength = () => {
    if (!password) return { score: 0, label: '', color: '' };
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    if (s <= 1) return { score: 20, label: 'Weak', color: 'bg-red-500' };
    if (s <= 2) return { score: 40, label: 'Fair', color: 'bg-orange-500' };
    if (s <= 3) return { score: 60, label: 'Good', color: 'bg-yellow-500' };
    if (s <= 4) return { score: 80, label: 'Strong', color: 'bg-cyan-500' };
    return { score: 100, label: 'Excellent', color: 'bg-emerald-500' };
  };
  const { score, label, color } = getStrength();
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }} className={`h-full rounded-full ${color}`} transition={{ duration: 0.4 }} />
      </div>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}

/* ─── glass card wrapper ─── */
function GlassCard({ children, className = '', danger = false }: { children: React.ReactNode; className?: string; danger?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className={`rounded-2xl backdrop-blur-xl border p-6 ${danger ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.03] border-white/[0.06]'} ${className}`}
    >
      {children}
    </motion.div>
  );
}

/* ─── section heading ─── */
function SectionHeading({ icon: Icon, title, subtitle, iconColor = 'text-cyan-400' }: { icon: any; title: string; subtitle?: string; iconColor?: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── form input ─── */
function GlassInput({ icon: Icon, label, disabled = false, ...props }: { icon: any; label: string; disabled?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="relative group">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-500 group-focus-within:text-cyan-400 transition-colors" />
        <input
          {...props}
          disabled={disabled}
          className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-white/[0.03] text-white placeholder-gray-500 transition-all duration-200 focus:outline-none ${disabled
              ? 'border-white/[0.04] text-gray-500 cursor-not-allowed'
              : 'border-white/[0.08] focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 focus:bg-white/[0.05]'
            }`}
        />
      </div>
    </div>
  );
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout, setUser, resumes, useRealApi } = useStore();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [company, setCompany] = useState(user?.company || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [screeningAlerts, setScreeningAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'preferences', 'activity'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (user) { setName(user.name); setEmail(user.email); setCompany(user.company || ''); }
  }, [user]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) { showMsg('error', 'Name cannot be empty'); return; }
    if (!email.trim() || !email.includes('@')) { showMsg('error', 'Please enter a valid email'); return; }
    setSaving(true);
    try {
      if (useRealApi) await api.updateProfile({ name, email, company: company || undefined });
      setUser({ ...user!, name, email, company: company || undefined });
      showMsg('success', 'Profile updated successfully');
    } catch { showMsg('error', 'Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) { showMsg('error', 'Please enter your current password'); return; }
    if (newPassword.length < 6) { showMsg('error', 'New password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { showMsg('error', 'Passwords do not match'); return; }
    setSaving(true);
    try {
      if (useRealApi) await api.changePassword(currentPassword, newPassword);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      showMsg('success', 'Password changed successfully');
    } catch { showMsg('error', 'Failed to change password. Check your current password.'); }
    finally { setSaving(false); }
  };

  const handleExportData = async () => {
    try {
      const data = { profile: { name: user?.name, email: user?.email }, resumes, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `hireq-data-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click(); URL.revokeObjectURL(url);
      showMsg('success', 'Data exported successfully');
    } catch { showMsg('error', 'Failed to export data'); }
  };

  const handleDeleteAccount = async () => {
    try {
      if (useRealApi) await api.deleteAccount();
      logout(); router.push('/login');
    } catch { showMsg('error', 'Failed to delete account'); }
  };

  const handleLogout = async () => {
    if (useRealApi) { try { await api.logout(); } catch (e) { console.error('Logout error:', e); } }
    logout(); router.push('/login');
  };

  if (!isAuthenticated || !user) return null;

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, color: 'from-cyan-500 to-blue-500' },
    { id: 'security', name: 'Security', icon: Shield, color: 'from-amber-500 to-orange-500' },
    { id: 'preferences', name: 'Preferences', icon: Palette, color: 'from-purple-500 to-pink-500' },
    { id: 'activity', name: 'Activity', icon: Activity, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className="min-h-screen py-8" style={{ background: 'linear-gradient(145deg, #0a0f1e 0%, #111827 50%, #0d1321 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
              <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">Account Settings</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mt-3">Manage Your Account</h1>
          <p className="text-gray-400 mt-1">Profile, security, preferences and activity — all in one place</p>
        </motion.div>

        {/* ── Toast ── */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`mb-6 p-4 rounded-xl backdrop-blur-xl border flex items-center gap-3 ${message.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}
            >
              {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <XCircle className="h-5 w-5 flex-shrink-0" />}
              <span className="text-sm font-medium">{message.text}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:w-72 flex-shrink-0">
            <div className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">

              {/* Avatar hero */}
              <div className="p-6 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 p-[2px]">
                      <div className="w-full h-full rounded-full bg-[#0f1629] flex items-center justify-center">
                        <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0f1629]" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">{user.name}</p>
                    <p className="text-sm text-gray-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {user.role || 'Recruiter'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-3 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group relative overflow-hidden ${activeTab === tab.id
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                      }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div layoutId="activeTab" className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-[0.12] rounded-xl`} transition={{ type: 'spring', duration: 0.5 }} />
                    )}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${activeTab === tab.id ? `bg-gradient-to-r ${tab.color} text-white shadow-lg` : 'bg-white/[0.06] text-gray-400 group-hover:text-gray-200'
                      }`}>
                      <tab.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm relative z-10">{tab.name}</span>
                    <ChevronRight className={`h-4 w-4 ml-auto transition-all relative z-10 ${activeTab === tab.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`} />
                  </button>
                ))}
              </nav>

              {/* Logout */}
              <div className="p-3 pt-0">
                <div className="border-t border-white/[0.06] pt-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <LogOut className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Main Content ── */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex-1 min-w-0">
            <AnimatePresence mode="wait">

              {/* ═══════ PROFILE TAB ═══════ */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                  <GlassCard>
                    <SectionHeading icon={User} title="Profile Information" subtitle="Update your personal details" />

                    <div className="space-y-5">
                      <GlassInput icon={User} label="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" />
                      <GlassInput icon={Mail} label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" />
                      <GlassInput icon={Building} label="Company Name" type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Enter your company name" />
                      <GlassInput icon={Briefcase} label="Role" type="text" value={user.role || 'Recruiter'} disabled />

                      <div className="pt-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={handleUpdateProfile} disabled={saving}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="h-4 w-4" />
                          {saving ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Account info snippet */}
                  <GlassCard>
                    <SectionHeading icon={Globe} title="Account Details" iconColor="text-purple-400" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Member Since', value: 'Jan 2025', icon: Clock, color: 'text-cyan-400' },
                        { label: 'Account Type', value: 'Professional', icon: Zap, color: 'text-amber-400' },
                        { label: 'Status', value: 'Active', icon: CheckCircle2, color: 'text-emerald-400' },
                      ].map((item) => (
                        <div key={item.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                          <div className="flex items-center gap-2 mb-2">
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                            <span className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</span>
                          </div>
                          <p className="text-white font-semibold">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* ═══════ SECURITY TAB ═══════ */}
              {activeTab === 'security' && (
                <motion.div key="security" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">
                  <GlassCard>
                    <SectionHeading icon={KeyRound} title="Change Password" subtitle="Keep your account secure" iconColor="text-amber-400" />

                    <div className="space-y-5">
                      {/* Current */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                          <input
                            type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full pl-11 pr-12 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 focus:outline-none transition-all"
                            placeholder="Enter current password"
                          />
                          <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                          <input
                            type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full pl-11 pr-12 py-3 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white placeholder-gray-500 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 focus:outline-none transition-all"
                            placeholder="Enter new password"
                          />
                          <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrength password={newPassword} />
                      </div>

                      {/* Confirm */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                        <div className="relative group">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 group-focus-within:text-amber-400 transition-colors" />
                          <input
                            type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-white/[0.03] text-white placeholder-gray-500 focus:outline-none transition-all ${confirmPassword && confirmPassword !== newPassword
                                ? 'border-red-500/50 focus:ring-1 focus:ring-red-500/20'
                                : confirmPassword && confirmPassword === newPassword
                                  ? 'border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20'
                                  : 'border-white/[0.08] focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20'
                              }`}
                            placeholder="Confirm new password"
                          />
                          {confirmPassword && (
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                              {confirmPassword === newPassword ? <Check className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3">
                        <motion.button
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={handleChangePassword} disabled={saving}
                          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <KeyRound className="h-4 w-4" />
                          {saving ? 'Updating...' : 'Update Password'}
                        </motion.button>
                      </div>
                    </div>
                  </GlassCard>

                  {/* Session info */}
                  <GlassCard>
                    <SectionHeading icon={Smartphone} title="Active Sessions" iconColor="text-blue-400" />
                    <div className="space-y-3">
                      {[
                        { device: 'Current Browser', location: 'This device', active: true, time: 'Now' },
                        { device: 'Chrome on macOS', location: 'Last login', active: false, time: '2 hours ago' },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${s.active ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : 'bg-gray-600'}`} />
                            <div>
                              <p className="text-sm font-medium text-white">{s.device}</p>
                              <p className="text-xs text-gray-500">{s.location}</p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">{s.time}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Danger */}
                  <GlassCard danger>
                    <SectionHeading icon={AlertTriangle} title="Danger Zone" subtitle="Irreversible actions" iconColor="text-red-400" />
                    <p className="text-sm text-gray-400 mb-4">Once you delete your account, there is no going back. All data will be permanently removed.</p>
                    {!showDeleteConfirm ? (
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </motion.button>
                    ) : (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                          <p className="text-sm text-red-400 font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Are you sure? This action cannot be undone.
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleDeleteAccount}
                            className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">
                            Yes, Delete My Account
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowDeleteConfirm(false)}
                            className="px-5 py-2.5 rounded-xl border border-white/[0.08] text-gray-300 text-sm font-medium hover:bg-white/[0.04] transition-colors">
                            Cancel
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </GlassCard>
                </motion.div>
              )}

              {/* ═══════ PREFERENCES TAB ═══════ */}
              {activeTab === 'preferences' && (
                <motion.div key="preferences" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">

                  {/* Appearance */}
                  <GlassCard>
                    <SectionHeading icon={Palette} title="Appearance" subtitle="Customize how HireQ looks" iconColor="text-purple-400" />
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-indigo-500/15 text-indigo-400' : 'bg-amber-500/15 text-amber-400'}`}>
                          {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Dark Mode</p>
                          <p className="text-xs text-gray-500">{theme === 'dark' ? 'Dark theme active' : 'Light theme active'}</p>
                        </div>
                      </div>
                      <Toggle enabled={theme === 'dark'} onChange={toggleTheme} accentColor="purple" />
                    </div>
                  </GlassCard>

                  {/* Notifications */}
                  <GlassCard>
                    <SectionHeading icon={Bell} title="Notifications" subtitle="Choose what you want to be notified about" iconColor="text-amber-400" />
                    <div className="space-y-3">
                      {[
                        { label: 'Email Notifications', desc: 'Receive email updates about your activity', enabled: emailNotifications, toggle: () => setEmailNotifications(!emailNotifications), icon: Mail, color: 'cyan', borderColor: 'border-l-cyan-500' },
                        { label: 'Screening Alerts', desc: 'Get notified when screening is complete', enabled: screeningAlerts, toggle: () => setScreeningAlerts(!screeningAlerts), icon: Bell, color: 'amber', borderColor: 'border-l-amber-500' },
                        { label: 'Weekly Reports', desc: 'Receive weekly summary of recruitment activity', enabled: weeklyReports, toggle: () => setWeeklyReports(!weeklyReports), icon: FileText, color: 'purple', borderColor: 'border-l-purple-500' },
                      ].map((item) => (
                        <div key={item.label} className={`flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.04] border-l-2 ${item.borderColor}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-9 h-9 rounded-lg bg-${item.color}-500/10 flex items-center justify-center text-${item.color}-400`}>
                              <item.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{item.label}</p>
                              <p className="text-xs text-gray-500">{item.desc}</p>
                            </div>
                          </div>
                          <Toggle enabled={item.enabled} onChange={item.toggle} accentColor={item.color} />
                        </div>
                      ))}
                    </div>
                  </GlassCard>

                  {/* Data & Privacy */}
                  <GlassCard>
                    <SectionHeading icon={Download} title="Data & Privacy" subtitle="Manage your data" iconColor="text-emerald-400" />
                    <p className="text-sm text-gray-400 mb-4">
                      Download a copy of all your data including uploaded resumes, job descriptions, and screening results.
                    </p>
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={handleExportData}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/10 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Export My Data
                      </motion.button>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      <p className="text-xs text-gray-500 flex items-center gap-2"><Shield className="h-3.5 w-3.5 text-gray-600" /> Your data is encrypted and stored securely. Export includes all personally identifiable information.</p>
                    </div>
                  </GlassCard>
                </motion.div>
              )}

              {/* ═══════ ACTIVITY TAB ═══════ */}
              {activeTab === 'activity' && (
                <motion.div key="activity" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="space-y-6">

                  {/* Stats */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Candidates', value: resumes.length, icon: User, gradient: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/20' },
                      { label: 'Top Matches', value: resumes.filter(r => r.score >= 75).length, icon: CheckCircle2, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20' },
                      { label: 'Avg Score', value: `${resumes.length > 0 ? Math.round(resumes.reduce((a, b) => a + b.score, 0) / resumes.length) : 0}%`, icon: Zap, gradient: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
                      { label: 'Unique Skills', value: new Set(resumes.flatMap(r => r.skills)).size, icon: Globe, gradient: 'from-purple-500 to-pink-600', shadow: 'shadow-purple-500/20' },
                    ].map((stat) => (
                      <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        className="rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] p-5 group hover:bg-white/[0.05] transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} ${stat.shadow} shadow-lg flex items-center justify-center mb-3`}>
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Recent Activity — Timeline */}
                  <GlassCard>
                    <SectionHeading icon={History} title="Recent Activity" subtitle={`${resumes.length} candidates processed`} iconColor="text-emerald-400" />

                    {resumes.length > 0 ? (
                      <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/40 via-purple-500/20 to-transparent" />

                        <div className="space-y-4">
                          {resumes.slice(0, 6).map((resume, index) => (
                            <motion.div
                              key={resume.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="relative flex items-start gap-4 pl-10"
                            >
                              {/* Dot */}
                              <div className={`absolute left-[14px] top-4 w-2.5 h-2.5 rounded-full border-2 border-[#0f1629] z-10 ${resume.score >= 75 ? 'bg-emerald-400' : resume.score >= 60 ? 'bg-cyan-400' : resume.score >= 45 ? 'bg-amber-400' : 'bg-red-400'
                                }`} />

                              <div className="flex-1 p-4 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.05] transition-colors">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center">
                                      <FileText className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-white">{resume.name}</p>
                                      <p className="text-xs text-gray-500">{resume.email}</p>
                                    </div>
                                  </div>
                                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${resume.score >= 75
                                      ? 'bg-emerald-500/15 text-emerald-400'
                                      : resume.score >= 60
                                        ? 'bg-cyan-500/15 text-cyan-400'
                                        : resume.score >= 45
                                          ? 'bg-amber-500/15 text-amber-400'
                                          : 'bg-red-500/15 text-red-400'
                                    }`}>
                                    {resume.score}%
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {resumes.length > 6 && (
                          <p className="text-sm text-gray-500 text-center mt-4 pl-10">
                            And {resumes.length - 6} more candidates…
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-8 w-8 text-gray-600" />
                        </div>
                        <p className="text-gray-400 font-medium">No recent activity</p>
                        <p className="text-sm text-gray-600 mt-1">Start by uploading resumes to screen candidates</p>
                      </div>
                    )}
                  </GlassCard>
                </motion.div>
              )}

            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(145deg, #0a0f1e 0%, #111827 50%, #0d1321 100%)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}
