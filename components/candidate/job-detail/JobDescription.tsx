'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, ListChecks, Target, GraduationCap } from 'lucide-react';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-sm';

const SECTION_IDS = ['overview', 'responsibilities', 'requirements'] as const;

interface JobDescriptionProps {
  description: string;
  experience_required?: string;
  education_required?: string;
}

function splitIntoParagraphs(text: string): string[] {
  if (!text?.trim()) return [];
  return text.split(/\n\n+/).filter(Boolean);
}

function bulletPoints(text: string): string[] {
  const lines = text.split(/\n/).filter(Boolean);
  const bullets: string[] = [];
  for (const line of lines) {
    const trimmed = line.replace(/^[\s•\-*]\s*/, '').trim();
    if (trimmed) bullets.push(trimmed);
  }
  return bullets.length ? bullets : [text];
}

export default function JobDescription({
  description,
  experience_required,
  education_required,
}: JobDescriptionProps) {
  const overviewRef = useRef<HTMLDivElement>(null);
  const responsibilitiesRef = useRef<HTMLDivElement>(null);
  const requirementsRef = useRef<HTMLDivElement>(null);

  const paragraphs = splitIntoParagraphs(description);
  const hasBullets = description.includes('\n') && (description.match(/\n/g)?.length ?? 0) >= 2;
  const bullets = hasBullets ? bulletPoints(description) : [];

  return (
    <div className="space-y-6">
      {/* Anchor links */}
      <nav className="flex flex-wrap gap-2">
        {SECTION_IDS.map((id) => (
          <a
            key={id}
            href={`#${id}`}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-candidate-600 dark:hover:text-candidate-400 hover:bg-candidate-500/10 dark:hover:bg-candidate-500/20 transition-colors"
          >
            {id === 'overview' ? 'Overview' : id === 'responsibilities' ? 'What you\'ll do' : 'Requirements'}
          </a>
        ))}
      </nav>

      {/* Overview / Description */}
      <motion.section
        ref={overviewRef}
        id="overview"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={CARD_CLASS}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FileText className="h-5 w-5 text-candidate-500" />
            Overview
          </h2>
          <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 mb-4" aria-hidden />
          <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-gray-400">
            {paragraphs.length > 0 ? (
              paragraphs.map((p, i) => (
                <p key={i} className="mb-3 leading-relaxed last:mb-0">
                  {p}
                </p>
              ))
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{description || 'No description provided.'}</p>
            )}
          </div>
        </div>
      </motion.section>

      {/* What you'll do (if we have bullet-like content) */}
      {bullets.length > 0 && (
        <motion.section
          ref={responsibilitiesRef}
          id="responsibilities"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD_CLASS}
        >
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <ListChecks className="h-5 w-5 text-candidate-500" />
              What you&apos;ll do
            </h2>
            <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 mb-4" aria-hidden />
            <ul className="space-y-2">
              {bullets.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="text-candidate-500 dark:text-candidate-400 mt-1.5 flex-shrink-0">•</span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.section>
      )}

      {/* Requirements */}
      <motion.section
        ref={requirementsRef}
        id="requirements"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={CARD_CLASS}
      >
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-candidate-500" />
            What we&apos;re looking for
          </h2>
          <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 mb-4" aria-hidden />
          <div className="space-y-4">
            {experience_required && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <Target className="h-4 w-4 text-candidate-500" />
                  Experience
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-6">
                  {experience_required}
                </p>
              </div>
            )}
            {education_required && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-candidate-500" />
                  Education
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-6">
                  {education_required}
                </p>
              </div>
            )}
            {!experience_required && !education_required && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No specific requirements listed.</p>
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
