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
// REUSABLE COMPONENTS
// ============================================================================

// Profile Section Component
interface ProfileSectionProps {
  title: string;
  description?: string;
  icon: React.ElementType;
  children: ReactNode;
}

function ProfileSection({ title, description, icon: Icon, children }: ProfileSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
    >
      {/* Section Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-candidate-500/10 to-cyan-500/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-candidate-600 dark:text-candidate-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
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

// Form Field Component
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
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className={`relative ${disabled ? 'opacity-60' : ''}`}>
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
        )}
        {children}
      </div>
      {helper && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helper}</p>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}

// Skill Tag Input Component
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

  return (
    <div className="space-y-3">
      {/* Input Row */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a skill and press Enter..."
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
          />
        </div>
        <motion.button
          type="button"
          onClick={handleAdd}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-gradient-to-r from-candidate-500 to-cyan-500 text-white rounded-xl font-medium shadow-md shadow-candidate-500/20 hover:shadow-lg hover:shadow-candidate-500/25 transition-all disabled:opacity-50 disabled:shadow-none"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Skills Tags */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence>
            {skills.map((skill) => (
              <motion.span
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-candidate-500/10 to-cyan-500/10 text-candidate-700 dark:text-candidate-300 text-sm font-medium rounded-full border border-candidate-200/50 dark:border-candidate-700/50"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => onRemove(skill)}
                  className="w-4 h-4 rounded-full bg-candidate-500/20 hover:bg-candidate-500/30 flex items-center justify-center transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      {skills.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
          No skills added yet. Add skills to improve your profile visibility.
        </p>
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
    <div className="flex items-center gap-2.5 py-1.5">
      {completed ? (
        <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
          <Check className="h-3 w-3 text-green-500" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
      )}
      <span className={`text-sm ${completed ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
        {label}
      </span>
    </div>
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

  // Calculate profile completeness
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

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-candidate-200 border-t-candidate-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-gray-50 to-candidate-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-candidate-950/20 -z-10" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-candidate-500/5 to-transparent rounded-full blur-3xl -z-10" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your profile to improve your chances of getting hired
          </p>
        </motion.div>

        {/* Alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 dark:text-red-400 flex-1">{error}</p>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="h-5 w-5" />
              </button>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <p className="text-green-700 dark:text-green-400 font-medium">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content: Two Column Layout */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">
            {/* ============================================================ */}
            {/* LEFT COLUMN: Profile Summary Card (Sticky) */}
            {/* ============================================================ */}
            <div className="lg:w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-24 space-y-6">
                {/* Profile Hero Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
                >
                  {/* Gradient Background */}
                  <div className="h-24 bg-gradient-to-br from-candidate-500 via-cyan-500 to-purple-500" />

                  {/* Avatar */}
                  <div className="px-6 pb-6">
                    <div className="relative -mt-12 mb-4">
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-candidate-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-candidate-500/25 border-4 border-white dark:border-gray-900">
                        <span className="text-3xl font-bold text-white">
                          {profile.name.charAt(0).toUpperCase() || 'U'}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                      </button>
                    </div>

                    {/* Name & Title */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {profile.name || 'Your Name'}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {profile.title || 'Add your professional title'}
                    </p>

                    {/* Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-candidate-100 dark:bg-candidate-900/30 text-candidate-700 dark:text-candidate-300 text-xs font-medium rounded-full">
                      <Target className="h-3 w-3" />
                      Job Seeker
                    </div>
                  </div>
                </motion.div>

                {/* Profile Completeness Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6"
                >
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-candidate-500" />
                    Profile Strength
                  </h3>

                  {/* Progress Ring */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="relative w-16 h-16">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="currentColor"
                          strokeWidth="6"
                          fill="none"
                          className="text-gray-100 dark:text-gray-800"
                        />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="url(#profileGradient)"
                          strokeWidth="6"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${completionPercentage * 1.76} 176`}
                          className="transition-all duration-500"
                        />
                        <defs>
                          <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#0d9488" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{completionPercentage}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {completionPercentage === 100 ? 'Complete!' : completionPercentage >= 75 ? 'Almost there!' : 'Keep going!'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {completedCount} of {completenessItems.length} fields completed
                      </p>
                    </div>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-0.5">
                    {completenessItems.map((item) => (
                      <CompletenessItem key={item.label} label={item.label} completed={item.completed} />
                    ))}
                  </div>
                </motion.div>

                {/* Profile Visibility */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Eye className="h-4 w-4 text-candidate-500" />
                      Profile Visibility
                    </h3>
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                      Public
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Recruiters can view your profile and contact you about job opportunities.
                  </p>
                </motion.div>
              </div>
            </div>

            {/* ============================================================ */}
            {/* RIGHT COLUMN: Editable Form Sections */}
            {/* ============================================================ */}
            <div className="flex-1 space-y-6">
              {/* Basic Info Section */}
              <ProfileSection
                title="Basic Information"
                description="Your name and professional identity"
                icon={User}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Full Name" icon={User} required>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                      required
                    />
                  </FormField>

                  <FormField label="Professional Title" icon={Briefcase} helper="e.g. Full Stack Developer, Product Designer">
                    <input
                      type="text"
                      value={profile.title}
                      onChange={(e) => handleChange('title', e.target.value)}
                      placeholder="Your job title"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                    />
                  </FormField>
                </div>
              </ProfileSection>

              {/* Contact Info Section */}
              <ProfileSection
                title="Contact Information"
                description="How recruiters can reach you"
                icon={Mail}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Email Address" icon={Mail} helper="Email cannot be changed" disabled>
                    <input
                      type="email"
                      value={profile.email}
                      className="w-full pl-11 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      disabled
                    />
                  </FormField>

                  <FormField label="Phone Number" icon={Phone} helper="Include country code">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                    />
                  </FormField>

                  <div className="sm:col-span-2">
                    <FormField label="Location" icon={MapPin} helper="City, Country">
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        placeholder="San Francisco, USA"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                      />
                    </FormField>
                  </div>
                </div>
              </ProfileSection>

              {/* Professional Details Section */}
              <ProfileSection
                title="Professional Details"
                description="Your experience and qualifications"
                icon={Briefcase}
              >
                <div className="space-y-5">
                  {/* Bio with AI Assist */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Bio / Summary
                      </label>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-candidate-600 dark:text-candidate-400 bg-candidate-50 dark:bg-candidate-900/20 rounded-lg hover:bg-candidate-100 dark:hover:bg-candidate-900/30 transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Generate with AI
                      </motion.button>
                    </div>
                    <textarea
                      value={profile.bio}
                      onChange={(e) => handleChange('bio', e.target.value)}
                      placeholder="Write a compelling summary about your professional background, skills, and career goals..."
                      rows={4}
                      maxLength={500}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 resize-none transition-all"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        A good bio helps recruiters understand your background
                      </p>
                      <span className={`text-xs ${profile.bio.length > 450 ? 'text-amber-500' : 'text-gray-400'}`}>
                        {profile.bio.length}/500
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField label="Years of Experience" icon={Clock}>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={profile.experience_years}
                        onChange={(e) => handleChange('experience_years', parseInt(e.target.value) || 0)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                      />
                    </FormField>

                    <FormField label="Highest Education" icon={GraduationCap}>
                      <input
                        type="text"
                        value={profile.education}
                        onChange={(e) => handleChange('education', e.target.value)}
                        placeholder="B.S. Computer Science"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                      />
                    </FormField>
                  </div>

                  {/* Skills */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Skills
                    </label>
                    <SkillTagInput
                      skills={profile.skills}
                      onAdd={handleAddSkill}
                      onRemove={handleRemoveSkill}
                    />
                  </div>
                </div>
              </ProfileSection>

              {/* Links & Social Section */}
              <ProfileSection
                title="Links & Social Profiles"
                description="Connect your online presence"
                icon={LinkIcon}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Personal Website" icon={Globe}>
                    <input
                      type="url"
                      value={profile.website}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://yourwebsite.com"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                    />
                  </FormField>

                  <FormField label="LinkedIn" icon={Linkedin}>
                    <input
                      type="url"
                      value={profile.linkedin}
                      onChange={(e) => handleChange('linkedin', e.target.value)}
                      placeholder="linkedin.com/in/yourprofile"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                    />
                  </FormField>

                  <FormField label="GitHub" icon={Github}>
                    <input
                      type="url"
                      value={profile.github}
                      onChange={(e) => handleChange('github', e.target.value)}
                      placeholder="github.com/yourusername"
                      className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                    />
                  </FormField>
                </div>
              </ProfileSection>
            </div>
          </div>

          {/* ============================================================ */}
          {/* STICKY SAVE BAR */}
          {/* ============================================================ */}
          <AnimatePresence>
            {hasChanges && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50"
              >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You have unsaved changes
                    </p>
                    <div className="flex items-center gap-3">
                      <motion.button
                        type="button"
                        onClick={() => {
                          fetchProfile();
                          setHasChanges(false);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl font-medium transition-colors"
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
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
}
