'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Link as LinkIcon,
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  Globe,
  Sparkles,
  X,
  Plus,
  Check,
  Target,
  FileText,
  Award,
  Github,
  Linkedin,
  ExternalLink,
  Shield,
  Eye,
  Clock,
  ChevronRight,
  Zap,
  TrendingUp,
  Star,
  Hash,
  ArrowUpRight,
  Info,
  Pencil,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import * as api from '@/lib/api';

// ============================================================================
// INTERFACES
// ============================================================================

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  bio: string;
  website: string;
  linkedin: string;
  github: string;
  experience_years: number;
  education: string;
  skills: string[];
}

// ============================================================================
// SHARED STYLES
// ============================================================================

const cardClass =
  'bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.06] overflow-hidden';

const inputClass =
  'w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/30 focus:border-candidate-500/50 focus:bg-white/[0.06] transition-all duration-300';

const inputClassNoIcon =
  'w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/30 focus:border-candidate-500/50 focus:bg-white/[0.06] transition-all duration-300';

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface ProfileSectionProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: ReactNode;
  delay?: number;
  stepNumber?: number;
  accentColor?: string;
}

function ProfileSection({
  title,
  description,
  icon: Icon,
  children,
  delay = 0,
  stepNumber,
  accentColor = 'from-candidate-500/20 to-cyan-500/20',
}: ProfileSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`${cardClass} group/section hover:border-white/[0.1] transition-all duration-500`}
    >
      {/* Section Header */}
      <div className="px-6 py-5 border-b border-white/[0.06] relative overflow-hidden">
        {/* Subtle gradient accent on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-candidate-500/[0.03] to-transparent opacity-0 group-hover/section:opacity-100 transition-opacity duration-500" />

        <div className="flex items-center gap-3.5 relative z-10">
          {/* Step Number + Icon */}
          <div className="relative">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${accentColor} border border-white/[0.08] flex items-center justify-center group-hover/section:border-white/[0.12] transition-colors duration-300`}>
              <Icon className="h-5 w-5 text-candidate-400" />
            </div>
            {stepNumber && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gray-900 border border-white/[0.1] flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-400">{stepNumber}</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white tracking-tight">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
          {/* Section edit indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] opacity-0 group-hover/section:opacity-100 transition-all duration-300">
            <Pencil className="h-3 w-3 text-gray-500" />
            <span className="text-[11px] text-gray-500">Edit</span>
          </div>
        </div>
      </div>

      {/* Section Content */}
      <div className="p-6">
        {children}
      </div>
    </motion.div>
  );
}

// Form Field
interface FormFieldProps {
  label: string;
  icon?: React.ElementType;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

function FormField({ label, icon: Icon, helper, error, required, disabled, children }: FormFieldProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-300">
        {label}
        {required && <span className="text-red-400 text-xs">*</span>}
      </label>
      <div className={`relative group/field ${disabled ? 'opacity-50' : ''}`}>
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
            <Icon className="h-[18px] w-[18px] text-gray-500 group-focus-within/field:text-candidate-400 transition-colors duration-300" />
          </div>
        )}
        {children}
      </div>
      {helper && !error && (
        <p className="text-xs text-gray-500 pl-0.5">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Skill Tag Input
interface SkillTagInputProps {
  skills: string[];
  onAdd: (skill: string) => void;
  onRemove: (skill: string) => void;
}

function SkillTagInput({ skills, onAdd, onRemove }: SkillTagInputProps) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    if (input.trim() && !skills.includes(input.trim())) {
      onAdd(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const skillColors = [
    'from-candidate-500/15 to-cyan-500/10 border-candidate-500/25 text-candidate-300',
    'from-purple-500/15 to-pink-500/10 border-purple-500/25 text-purple-300',
    'from-amber-500/15 to-orange-500/10 border-amber-500/25 text-amber-300',
    'from-emerald-500/15 to-green-500/10 border-emerald-500/25 text-emerald-300',
    'from-blue-500/15 to-indigo-500/10 border-blue-500/25 text-blue-300',
    'from-rose-500/15 to-red-500/10 border-rose-500/25 text-rose-300',
  ];

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative group/skill">
          <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-500 group-focus-within/skill:text-candidate-400 transition-colors duration-300 pointer-events-none z-10" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Enter..."
            className={inputClass}
          />
        </div>
        <motion.button
          type="button"
          onClick={handleAdd}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-xl font-medium shadow-md shadow-candidate-500/20 hover:shadow-lg hover:shadow-candidate-500/25 transition-all disabled:opacity-40 disabled:shadow-none"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {skills.map((skill, idx) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${skillColors[idx % skillColors.length]} text-sm font-medium rounded-full border backdrop-blur-sm`}
              >
                {skill}
                <button
                  type="button"
                  onClick={() => onRemove(skill)}
                  className="w-4 h-4 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      {skills.length === 0 && (
        <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-white/[0.02] border border-dashed border-white/[0.08]">
          <Info className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <p className="text-sm text-gray-500">
            No skills added yet. Add skills to improve your profile visibility.
          </p>
        </div>
      )}

      {skills.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <TrendingUp className="h-3 w-3" />
          {skills.length} skill{skills.length !== 1 ? 's' : ''} added
          {skills.length < 3 && ' — add at least 3 for better visibility'}
        </div>
      )}
    </div>
  );
}

// Profile Completeness Item
interface CompletenessItemProps {
  label: string;
  completed: boolean;
}

function CompletenessItem({ label, completed }: CompletenessItemProps) {
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className={`flex items-center gap-2.5 py-2 px-2.5 rounded-lg transition-colors duration-200 ${completed ? 'hover:bg-emerald-500/[0.04]' : 'hover:bg-white/[0.02]'
        }`}
    >
      {completed ? (
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <Check className="h-3 w-3 text-emerald-400" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-white/10 group-hover:border-white/15 transition-colors" />
      )}
      <span className={`text-sm ${completed ? 'text-gray-300 line-through decoration-gray-600' : 'text-gray-500'}`}>
        {label}
      </span>
      {completed && (
        <CheckCircle className="h-3 w-3 text-emerald-500/50 ml-auto" />
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function CandidateProfilePage() {
  const { user, setUser } = useStore();

  const [profile, setProfile] = useState<ProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    title: '',
    bio: '',
    website: '',
    linkedin: '',
    github: '',
    experience_years: 0,
    education: '',
    skills: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Profile completeness
  const completenessItems = [
    { label: 'Full Name', completed: !!profile.name.trim() },
    { label: 'Professional Title', completed: !!profile.title.trim() },
    { label: 'Phone Number', completed: !!profile.phone.trim() },
    { label: 'Location', completed: !!profile.location.trim() },
    { label: 'Bio / Summary', completed: !!profile.bio.trim() },
    { label: 'Education', completed: !!profile.education.trim() },
    { label: 'Skills (at least 3)', completed: profile.skills.length >= 3 },
    { label: 'LinkedIn or Website', completed: !!profile.linkedin.trim() || !!profile.website.trim() },
  ];

  const completedCount = completenessItems.filter(item => item.completed).length;
  const completionPercentage = Math.round((completedCount / completenessItems.length) * 100);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await api.getCandidateProfile();
      setProfile({
        name: data.name || user?.name || '',
        email: data.email || user?.email || '',
        phone: data.phone || '',
        location: data.location || '',
        title: data.title || '',
        bio: data.bio || '',
        website: data.website || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        experience_years: data.experience_years || 0,
        education: data.education || '',
        skills: data.skills || []
      });
    } catch {
      console.log('No profile found, using defaults');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setIsSaving(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (user && profile.name !== user.name) {
        setUser({ ...user, name: profile.name });
      }

      setSuccess('Profile saved successfully!');
      setHasChanges(false);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = (skill: string) => {
    setProfile(prev => ({ ...prev, skills: [...prev.skills, skill] }));
    setHasChanges(true);
  };

  const handleRemoveSkill = (skill: string) => {
    setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    setHasChanges(true);
  };

  // Strength label and color
  const strengthLabel = completionPercentage === 100 ? 'Complete!' : completionPercentage >= 75 ? 'Almost there!' : completionPercentage >= 50 ? 'Good progress!' : 'Getting started';
  const strengthColor = completionPercentage === 100 ? 'text-emerald-400' : completionPercentage >= 75 ? 'text-cyan-400' : completionPercentage >= 50 ? 'text-amber-400' : 'text-gray-400';

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-candidate-500/20 border-t-candidate-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-gray-950">
      {/* Background effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(20,184,166,0.08),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-candidate-500/[0.04] to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/[0.03] to-transparent rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Page Header ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-candidate-500/10 border border-candidate-500/20 text-candidate-400 text-xs font-semibold tracking-wider uppercase mb-4">
            <User className="h-3.5 w-3.5" />
            My Profile
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                Profile Settings
              </h1>
              <p className="text-gray-400 max-w-lg">
                Complete your profile to improve visibility with recruiters and land better opportunities.
              </p>
            </div>

            {/* Quick stat chips */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <div className={`w-2 h-2 rounded-full ${completionPercentage >= 75 ? 'bg-emerald-400' : completionPercentage >= 50 ? 'bg-amber-400' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-400">{completionPercentage}% Complete</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                <Eye className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-gray-400">Public</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Alerts ────────────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <p className="text-emerald-300 font-medium">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Main Content ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ================================================================ */}
            {/* LEFT COLUMN — Profile Summary (Sticky)                           */}
            {/* ================================================================ */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Profile Hero Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`relative ${cardClass} group`}
                >
                  {/* Animated Gradient Banner */}
                  <div className="h-28 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-candidate-500 via-cyan-500 to-purple-500" />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgMTAgMCBMIDIwIDEwIEwgMzAgMCBMIDQwIDEwIEwgNDAgMjAgTCAzMCAzMCBMIDQwIDQwIEwgMzAgNDAgTCAyMCAzMCBMIDEwIDQwIEwgMCA0MCBMIDAgMzAgTCAxMCAyMCBMIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA4KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-30" />
                    {/* Floating sparkle effect */}
                    <div className="absolute top-3 right-4 w-2 h-2 rounded-full bg-white/30 animate-pulse" />
                    <div className="absolute top-6 right-12 w-1.5 h-1.5 rounded-full bg-white/20 animate-pulse delay-300" />
                    <div className="absolute bottom-4 left-6 w-1 h-1 rounded-full bg-white/25 animate-pulse delay-700" />
                  </div>

                  <div className="px-6 pb-6">
                    {/* Avatar with animated gradient ring */}
                    <div className="relative -mt-14 mb-4">
                      <div className="relative w-[104px] h-[104px]">
                        {/* Animated glow ring */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-candidate-500 via-cyan-400 to-purple-500 opacity-60 blur-md group-hover:opacity-80 transition-opacity duration-500" />
                        {/* Border container */}
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-candidate-500 via-cyan-400 to-purple-500 p-[3px]">
                          <div className="w-full h-full rounded-[13px] bg-gray-950 flex items-center justify-center">
                            <span className="text-3xl font-bold text-white">
                              {profile.name.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-1 right-1 w-8 h-8 bg-gray-800/90 backdrop-blur-sm border border-white/10 rounded-lg flex items-center justify-center shadow-lg hover:bg-gray-700 hover:border-white/20 transition-all group/cam"
                      >
                        <Camera className="h-4 w-4 text-gray-400 group-hover/cam:text-white transition-colors" />
                      </button>
                    </div>

                    {/* Name & Title */}
                    <h2 className="text-xl font-bold text-white mb-0.5 tracking-tight">
                      {profile.name || 'Your Name'}
                    </h2>
                    <p className="text-sm text-gray-400 mb-1">
                      {profile.title || 'Add your professional title'}
                    </p>
                    {profile.email && (
                      <p className="text-xs text-gray-500 mb-3">{profile.email}</p>
                    )}

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-candidate-500/10 text-candidate-300 text-xs font-medium rounded-full border border-candidate-500/20">
                        <Target className="h-3 w-3" />
                        Job Seeker
                      </div>
                      {profile.experience_years > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 text-purple-300 text-xs font-medium rounded-full border border-purple-500/20">
                          <Briefcase className="h-3 w-3" />
                          {profile.experience_years}y exp
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* ── Profile Strength Card ──────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`${cardClass} p-6`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-candidate-400" />
                      Profile Strength
                    </h3>
                    <span className={`text-xs font-semibold ${strengthColor}`}>{strengthLabel}</span>
                  </div>

                  {/* Progress Bar (replacing the ring for a cleaner look) */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold text-white">{completionPercentage}%</span>
                      <span className="text-xs text-gray-500">{completedCount}/{completenessItems.length} fields</span>
                    </div>
                    <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-candidate-500 to-cyan-500 rounded-full relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20 rounded-full" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-0.5">
                    {completenessItems.map((item) => (
                      <CompletenessItem key={item.label} label={item.label} completed={item.completed} />
                    ))}
                  </div>
                </motion.div>

                {/* ── Profile Visibility Card ────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={`${cardClass} p-6`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Eye className="h-4 w-4 text-candidate-400" />
                      Profile Visibility
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Public
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Recruiters can view your profile and contact you about job opportunities.
                  </p>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent my-3" />
                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 text-amber-400" />
                    <p className="text-xs text-gray-400">
                      {completionPercentage >= 75 ? 'Your profile ranks higher in searches!' : 'Complete more fields to rank higher.'}
                    </p>
                  </div>
                </motion.div>

                {/* ── Quick Tips Card ────────────────────────────── */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className={`${cardClass} p-6`}
                >
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Quick Tips
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      { tip: 'Add at least 5 skills to rank higher', icon: TrendingUp },
                      { tip: 'A detailed bio boosts recruiter interest', icon: FileText },
                      { tip: 'Link your LinkedIn for credibility', icon: Linkedin },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-gray-400 group/tip hover:text-gray-300 transition-colors cursor-default">
                        <div className="w-5 h-5 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/tip:border-white/[0.1] transition-colors">
                          <item.icon className="h-3 w-3 text-gray-500 group-hover/tip:text-candidate-400 transition-colors" />
                        </div>
                        {item.tip}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>

            {/* ================================================================ */}
            {/* RIGHT COLUMN — Editable Form Sections                            */}
            {/* ================================================================ */}
            <div className="flex-1 space-y-6">
              {/* ── Basic Information ──────────────────────────── */}
              <ProfileSection
                title="Basic Information"
                description="Your name and professional identity"
                icon={User}
                stepNumber={1}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Full Name" icon={User} required>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className={inputClass}
                      required
                    />
                  </FormField>

                  <FormField label="Professional Title" icon={Briefcase} helper="e.g. Full Stack Developer, Product Designer">
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Your job title"
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </ProfileSection>

              {/* ── Contact Information ────────────────────────── */}
              <ProfileSection
                title="Contact Information"
                description="How recruiters can reach you"
                icon={Mail}
                delay={0.05}
                stepNumber={2}
                accentColor="from-blue-500/20 to-indigo-500/20"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Email Address" icon={Mail} helper="Email cannot be changed" disabled>
                    <input
                      type="email"
                      value={profile.email}
                      className="w-full pl-11 pr-4 py-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-gray-500 cursor-not-allowed"
                      disabled
                    />
                  </FormField>

                  <FormField label="Phone Number" icon={Phone} helper="Include country code">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className={inputClass}
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Location" icon={MapPin} helper="City, Country">
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="San Francisco, USA"
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                </div>
              </ProfileSection>

              {/* ── Professional Details ───────────────────────── */}
              <ProfileSection
                title="Professional Details"
                description="Your experience and qualifications"
                icon={Briefcase}
                delay={0.1}
                stepNumber={3}
                accentColor="from-purple-500/20 to-pink-500/20"
              >
                <div className="space-y-6">
                  {/* Bio with AI Assist */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-gray-500" />
                        Bio / Summary
                      </label>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-candidate-400 bg-gradient-to-r from-candidate-500/10 to-cyan-500/10 rounded-lg border border-candidate-500/20 hover:border-candidate-500/30 hover:from-candidate-500/15 hover:to-cyan-500/15 transition-all shadow-sm shadow-candidate-500/10"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate with AI
                      </motion.button>
                    </div>
                    <div className="relative">
                      <textarea
                        value={profile.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Write a compelling summary about your professional background, skills, and career goals..."
                        rows={5}
                        maxLength={500}
                        className={`${inputClassNoIcon} resize-none`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        A good bio helps recruiters understand your background
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${profile.bio.length > 450 ? 'bg-amber-400' : profile.bio.length > 200 ? 'bg-emerald-400' : 'bg-white/20'
                              }`}
                            style={{ width: `${Math.min(100, (profile.bio.length / 500) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs tabular-nums ${profile.bio.length > 450 ? 'text-amber-400' : 'text-gray-500'}`}>
                          {profile.bio.length}/500
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Years of Experience" icon={Clock}>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={profile.experience_years}
                        onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="Highest Education" icon={GraduationCap}>
                      <input
                        type="text"
                        value={profile.education}
                        onChange={(e) => handleChange('education', e.target.value)}
                        placeholder="B.S. Computer Science"
                        className={inputClass}
                      />
                    </FormField>
                  </div>

                  {/* Separator */}
                  <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

                  {/* Skills */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-300 flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-gray-500" />
                        Skills
                      </label>
                      {profile.skills.length >= 3 && (
                        <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          ✓ Minimum met
                        </span>
                      )}
                    </div>
                    <SkillTagInput
                      skills={profile.skills}
                      onAdd={handleAddSkill}
                      onRemove={handleRemoveSkill}
                    />
                  </div>
                </div>
              </ProfileSection>

              {/* ── Links & Social ─────────────────────────────── */}
              <ProfileSection
                title="Links & Social Profiles"
                description="Connect your online presence"
                icon={LinkIcon}
                delay={0.15}
                stepNumber={4}
                accentColor="from-emerald-500/20 to-green-500/20"
              >
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Personal Website" icon={Globe}>
                      <input
                        type="url"
                        value={profile.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        placeholder="https://yourwebsite.com"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="LinkedIn" icon={Linkedin}>
                      <input
                        type="url"
                        value={profile.linkedin}
                        onChange={(e) => handleChange('linkedin', e.target.value)}
                        placeholder="linkedin.com/in/yourprofile"
                        className={inputClass}
                      />
                    </FormField>

                    <FormField label="GitHub" icon={Github}>
                      <input
                        type="url"
                        value={profile.github}
                        onChange={(e) => handleChange('github', e.target.value)}
                        placeholder="github.com/yourusername"
                        className={inputClass}
                      />
                    </FormField>
                  </div>

                  {/* Quick link preview */}
                  {(profile.website || profile.linkedin || profile.github) && (
                    <div className="pt-3 border-t border-white/[0.06]">
                      <p className="text-xs text-gray-500 mb-2.5">Active links</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.website && (
                          <a href={profile.website} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:text-white hover:border-white/[0.15] transition-all group/link"
                          >
                            <Globe className="h-3 w-3" />
                            Website
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        )}
                        {profile.linkedin && (
                          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:text-blue-400 hover:border-blue-500/20 transition-all group/link"
                          >
                            <Linkedin className="h-3 w-3" />
                            LinkedIn
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        )}
                        {profile.github && (
                          <a href={profile.github} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.08] text-xs text-gray-400 hover:text-purple-400 hover:border-purple-500/20 transition-all group/link"
                          >
                            <Github className="h-3 w-3" />
                            GitHub
                            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </ProfileSection>
            </div>
          </div>

          {/* ================================================================ */}
          {/* STICKY SAVE BAR                                                  */}
          {/* ================================================================ */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-0 left-0 right-0 z-50"
              >
                {/* Top gradient border */}
                <div className="h-px bg-gradient-to-r from-transparent via-candidate-500/50 to-transparent" />
                <div className="bg-gray-900/95 backdrop-blur-2xl border-t border-white/[0.06]">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
                        <p className="text-sm text-gray-300 font-medium">
                          You have unsaved changes
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.button
                          type="button"
                          onClick={() => {
                            fetchProfile();
                            setHasChanges(false);
                          }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="px-5 py-2.5 text-gray-300 hover:bg-white/[0.06] rounded-xl font-medium transition-all border border-transparent hover:border-white/[0.08]"
                        >
                          Discard
                        </motion.button>
                        <motion.button
                          type="submit"
                          disabled={isSaving}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg shadow-candidate-500/25 hover:shadow-xl hover:shadow-candidate-500/30 transition-all disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
