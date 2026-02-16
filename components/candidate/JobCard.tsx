'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  DollarSign,
  Briefcase,
  ChevronRight,
  Building,
} from 'lucide-react';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    description: string;
    company?: string;
    location?: string;
    salary_range?: string;
    job_type: string;
    required_skills: string[];
    created_at: string;
  };
  index?: number;
}

const jobTypeColors: Record<string, string> = {
  'full-time': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'part-time': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'contract': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'internship': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function JobCard({ job, index = 0 }: JobCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        href={`/candidate/jobs/${job.id}`}
        className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg hover:border-candidate-300 dark:hover:border-candidate-600 transition-all group"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-candidate-100 dark:bg-candidate-900/30 rounded-xl flex items-center justify-center">
              <Building className="h-6 w-6 text-candidate-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-candidate-600 dark:group-hover:text-candidate-400 transition-colors">
                {job.title}
              </h3>
              {job.company && (
                <p className="text-gray-600 dark:text-gray-400">{job.company}</p>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-candidate-500 group-hover:translate-x-1 transition-all" />
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
          {job.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${jobTypeColors[job.job_type] || jobTypeColors['full-time']}`}>
            <Briefcase className="h-3 w-3 inline mr-1" />
            {job.job_type.replace('-', ' ')}
          </span>
          {job.location && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <MapPin className="h-3 w-3 inline mr-1" />
              {job.location}
            </span>
          )}
          {job.salary_range && (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              <DollarSign className="h-3 w-3 inline mr-1" />
              {job.salary_range}
            </span>
          )}
        </div>

        {/* Skills */}
        {job.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {job.required_skills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="px-2 py-1 bg-candidate-50 dark:bg-candidate-900/20 text-candidate-700 dark:text-candidate-300 text-xs rounded-md"
              >
                {skill}
              </span>
            ))}
            {job.required_skills.length > 4 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-md">
                +{job.required_skills.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Posted Date */}
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          Posted {formatDate(job.created_at)}
        </div>
      </Link>
    </motion.div>
  );
}
