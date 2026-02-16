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
  Bookmark,
  ChevronDown,
  ChevronUp,
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

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

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
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          <Icon className="h-4 w-4 text-candidate-500 dark:text-candidate-400" />
          {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
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
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PillOption({
  value,
  label,
  isActive,
  onClick,
}: {
  value: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
        isActive
          ? 'bg-candidate-500 text-white shadow-sm shadow-candidate-500/25'
          : 'bg-gray-100/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {label}
    </motion.button>
  );
}

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

  return (
    <div className={`${CARD_CLASS} p-4 ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Filters</span>
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-candidate-600 dark:text-candidate-400 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </motion.button>
        )}
      </div>

      <div className="space-y-1">
        <FilterSection title="Job type" icon={Briefcase}>
          <div className="flex flex-wrap gap-2 pb-3">
            {JOB_TYPES.map((opt) => (
              <PillOption
                key={opt.value || 'all'}
                value={opt.value}
                label={opt.label}
                isActive={filters.jobType === opt.value}
                onClick={() => update('jobType', opt.value)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Location" icon={MapPin}>
          <div className="flex flex-wrap gap-2 pb-3">
            <PillOption
              value=""
              label="All locations"
              isActive={filters.location === ''}
              onClick={() => update('location', '')}
            />
            {locations.slice(0, 10).map((loc) => (
              <PillOption
                key={loc}
                value={loc}
                label={loc}
                isActive={filters.location === loc}
                onClick={() => update('location', loc)}
              />
            ))}
            {locations.length > 10 && (
              <span className="text-xs text-gray-500 px-2 py-1">+{locations.length - 10} more</span>
            )}
          </div>
        </FilterSection>

        <FilterSection title="Experience" icon={TrendingUp}>
          <div className="flex flex-wrap gap-2 pb-3">
            <PillOption
              value=""
              label="Any"
              isActive={filters.experience === ''}
              onClick={() => update('experience', '')}
            />
            {experienceOptions.map((exp) => (
              <PillOption
                key={exp}
                value={exp}
                label={exp}
                isActive={filters.experience === exp}
                onClick={() => update('experience', exp)}
              />
            ))}
          </div>
        </FilterSection>

        <FilterSection title="Remote / On-site" icon={Globe}>
          <div className="flex flex-wrap gap-2 pb-3">
            {WORK_MODES.map((opt) => (
              <PillOption
                key={opt.value}
                value={opt.value}
                label={opt.label}
                isActive={filters.workMode === opt.value}
                onClick={() => update('workMode', opt.value)}
              />
            ))}
          </div>
        </FilterSection>

        {salaryOptions.length > 0 && (
          <FilterSection title="Salary range" icon={DollarSign}>
            <div className="flex flex-wrap gap-2 pb-3">
              <PillOption
                value=""
                label="Any"
                isActive={filters.salaryRange === ''}
                onClick={() => update('salaryRange', '')}
              />
              {salaryOptions.map((range) => (
                <PillOption
                  key={range}
                  value={range}
                  label={range}
                  isActive={filters.salaryRange === range}
                  onClick={() => update('salaryRange', range)}
                />
              ))}
            </div>
          </FilterSection>
        )}
      </div>

      <a
        href="/candidate/jobs"
        className="mt-4 flex items-center gap-2 text-xs font-medium text-candidate-600 dark:text-candidate-400 hover:underline"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Saved searches
      </a>
    </div>
  );
}
