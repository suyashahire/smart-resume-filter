'use client';

import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Shield,
  Target,
  Lightbulb,
  Wand2,
} from 'lucide-react';

export type InsightTab = 'overview' | 'ats' | 'job-match' | 'improvements' | 'optimize';

interface TabDef {
  id: InsightTab;
  label: string;
  icon: React.ElementType;
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'ats', label: 'ATS Analysis', icon: Shield },
  { id: 'job-match', label: 'Job Match', icon: Target },
  { id: 'improvements', label: 'Improvements', icon: Lightbulb },
  { id: 'optimize', label: 'Optimize', icon: Wand2 },
];

interface ResumeInsightsTabsProps {
  activeTab: InsightTab;
  onChange: (tab: InsightTab) => void;
}

export default function ResumeInsightsTabs({ activeTab, onChange }: ResumeInsightsTabsProps) {
  return (
    <div className="flex gap-1.5 p-1.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-x-auto scrollbar-none">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="insight-tab-bg"
                className="absolute inset-0 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
