'use client';

import { motion } from 'framer-motion';

interface SkillPillProps {
  label: string;
  category?: 'frontend' | 'backend' | 'databases' | 'soft' | 'other';
  matchPercent?: number;
}

const CATEGORY_STYLES: Record<string, string> = {
  frontend: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:border-blue-500/40 hover:shadow-md',
  backend: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 hover:border-purple-500/40 hover:shadow-md',
  databases: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:border-amber-500/40 hover:shadow-md',
  soft: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 hover:border-green-500/40 hover:shadow-md',
  other: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20 hover:border-gray-500/40 hover:shadow-md',
};

function inferCategory(skill: string): string {
  const s = skill.toLowerCase();
  if (/\b(react|vue|angular|javascript|typescript|css|html|frontend|ui)\b/.test(s)) return 'frontend';
  if (/\b(python|java|node|api|backend|server)\b/.test(s)) return 'backend';
  if (/\b(sql|database|mongodb|postgres|redis)\b/.test(s)) return 'databases';
  if (/\b(communication|leadership|teamwork|problem solving)\b/.test(s)) return 'soft';
  return 'other';
}

export default function SkillPill({ label, category, matchPercent }: SkillPillProps) {
  const styleKey = category ?? inferCategory(label);
  const style = CATEGORY_STYLES[styleKey] || CATEGORY_STYLES.other;

  return (
    <motion.span
      whileHover={{ scale: 1.03 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 hover:shadow-md ${style}`}
    >
      {label}
      {matchPercent != null && matchPercent > 0 && (
        <span className="text-xs opacity-80">({matchPercent}%)</span>
      )}
    </motion.span>
  );
}
