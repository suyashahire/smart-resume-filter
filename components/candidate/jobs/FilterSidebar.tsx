'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  MapPin,
  TrendingUp,
  Globe,
  DollarSign,
  X,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from 'lucide-react';

export interface JobFilters {
  jobType: string;
  location: string;
  experience: string;
  workMode: string; // 'all' | 'remote' | 'onsite'
  salaryRange: string;
}

const JOB_TYPES = [
  { value: '', label: 'All types' },
  { value: 'full-time', label: 'Full-time' },
  { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const WORK_MODES = [
  { value: 'all', label: 'All' },
  { value: 'remote', label: 'Remote' },
  { value: 'onsite', label: 'On-site' },
];

interface FilterSidebarProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  locations: string[];
  experienceOptions: string[];
  salaryOptions: string[];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  className?: string;
}

/* ── Collapsible filter section ── */
function FilterSection({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 dark:border-gray-800/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 py-3.5 text-left group"
      >
        <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-candidate-500/8 dark:bg-candidate-500/15 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-candidate-600 dark:text-candidate-400" />
          </span>
          {title}
        </span>
        <span className="text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors">
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-3.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Pill option ── */
function PillOption({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${isActive
          ? 'bg-candidate-500 text-white shadow-sm shadow-candidate-500/25 ring-1 ring-candidate-500/30'
          : 'bg-gray-50 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/60 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-gray-700/40'
        }`}
    >
      {label}
    </button>
  );
}

/* ── Main sidebar ── */
export default function FilterSidebar({
  filters,
  onChange,
  locations,
  experienceOptions,
  salaryOptions,
  hasActiveFilters,
  onClearFilters,
  className = '',
}: FilterSidebarProps) {
  const update = (key: keyof JobFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  const activeCount = [
    filters.jobType,
    filters.location,
    filters.experience,
    filters.workMode !== 'all' ? filters.workMode : '',
    filters.salaryRange,
  ].filter(Boolean).length;

  return (
    <div
      className={`rounded-2xl border border-gray-200/50 dark:border-gray-700/50
        bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg shadow-sm ${className}`}
    >
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <SlidersHorizontal className="h-4 w-4 text-candidate-500" />
            Filters
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-candidate-500 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </span>
          {hasActiveFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium
                text-candidate-600 dark:text-candidate-400
                hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20
                transition-colors"
            >
              <X className="h-3 w-3" />
              Clear all
            </motion.button>
          )}
        </div>

        <div className="mt-2">
          {/* Job type */}
          <FilterSection title="Job type" icon={Briefcase}>
            <div className="flex flex-wrap gap-1.5">
              {JOB_TYPES.map((opt) => (
                <PillOption
                  key={opt.value || 'all'}
                  label={opt.label}
                  isActive={filters.jobType === opt.value}
                  onClick={() => update('jobType', opt.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Location */}
          <FilterSection title="Location" icon={MapPin}>
            <div className="flex flex-wrap gap-1.5">
              <PillOption
                label="All locations"
                isActive={filters.location === ''}
                onClick={() => update('location', '')}
              />
              {locations.slice(0, 10).map((loc) => (
                <PillOption
                  key={loc}
                  label={loc}
                  isActive={filters.location === loc}
                  onClick={() => update('location', loc)}
                />
              ))}
              {locations.length > 10 && (
                <span className="text-[11px] text-gray-400 px-2 py-1 self-center">
                  +{locations.length - 10} more
                </span>
              )}
            </div>
          </FilterSection>

          {/* Experience */}
          <FilterSection title="Experience" icon={TrendingUp}>
            <div className="flex flex-wrap gap-1.5">
              <PillOption
                label="Any"
                isActive={filters.experience === ''}
                onClick={() => update('experience', '')}
              />
              {experienceOptions.map((exp) => (
                <PillOption
                  key={exp}
                  label={exp}
                  isActive={filters.experience === exp}
                  onClick={() => update('experience', exp)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Work mode */}
          <FilterSection title="Work mode" icon={Globe}>
            <div className="flex flex-wrap gap-1.5">
              {WORK_MODES.map((opt) => (
                <PillOption
                  key={opt.value}
                  label={opt.label}
                  isActive={filters.workMode === opt.value}
                  onClick={() => update('workMode', opt.value)}
                />
              ))}
            </div>
          </FilterSection>

          {/* Salary */}
          {salaryOptions.length > 0 && (
            <FilterSection title="Salary range" icon={DollarSign}>
              <div className="flex flex-wrap gap-1.5">
                <PillOption
                  label="Any"
                  isActive={filters.salaryRange === ''}
                  onClick={() => update('salaryRange', '')}
                />
                {salaryOptions.map((range) => (
                  <PillOption
                    key={range}
                    label={range}
                    isActive={filters.salaryRange === range}
                    onClick={() => update('salaryRange', range)}
                  />
                ))}
              </div>
            </FilterSection>
          )}
        </div>
      </div>
    </div>
  );
}
