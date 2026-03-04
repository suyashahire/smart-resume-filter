'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getCandidateApplications } from '@/lib/api';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import {
  FilterTabs,
  ApplicationListCard,
  ApplicationsEmptyState,
  ApplicationSkeleton,
} from '@/components/candidate/applications';

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'status', label: 'Status' },
];

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;

  const fetchApplications = useCallback(async (pageNum: number = page) => {
    try {
      setIsLoading(true);
      const data = await getCandidateApplications(pageNum, PAGE_SIZE);
      setApplications(data.applications || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    fetchApplications(page);
  }, [page]);

  // Re-fetch applications when status changes come in via WebSocket
  useRealtimeUpdates({
    onEvent: (event) => {
      if (event.type === 'application_status_changed') {
        fetchApplications(page);
      }
    },
  });

  const statusCounts = applications.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    let filtered = [...applications];

    if (selectedStatus) {
      filtered = filtered.filter((a) => a.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.job_title?.toLowerCase() || '').includes(query) ||
          (a.company?.toLowerCase() || '').includes(query)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
        case 'status':
          return a.status.localeCompare(b.status);
        case 'newest':
        default:
          return new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime();
      }
    });

    setFilteredApplications(filtered);
  }, [selectedStatus, searchQuery, sortBy, applications]);

  const hasActiveFilter = !!(selectedStatus || searchQuery);
  const clearFilters = () => {
    setSelectedStatus('');
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen">
      {/* Background: slightly lighter for contrast */}
      <div className="fixed inset-0 bg-gray-100 dark:bg-gray-950 -z-10" />
      <div
        className="fixed inset-0 -z-10 pointer-events-none bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.06),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(20,184,166,0.04),transparent)]"
        aria-hidden
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
            My Applications
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Track the status of your job applications
          </p>
        </motion.header>

        {/* Sticky filter bar with glass panel */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="sticky top-20 z-20 mb-6"
        >
          <div className="rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm p-4 space-y-4">
            {/* Segmented filter tabs */}
            <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
              <FilterTabs
                value={selectedStatus}
                onChange={setSelectedStatus}
                counts={statusCounts}
                totalCount={applications.length}
              />
            </div>

            {/* Search + Sort row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by company or role"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-candidate-500/20 focus:border-candidate-500 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-700/60"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="relative flex-shrink-0 sm:w-40">
                <button
                  type="button"
                  onClick={() => setSortOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800 transition-colors"
                >
                  <span>{sortOptions.find((o) => o.value === sortBy)?.label}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {sortOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setSortOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-full min-w-[140px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20 overflow-hidden"
                      >
                        {sortOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSortBy(option.value);
                              setSortOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                              sortBy === option.value
                                ? 'bg-candidate-500/10 dark:bg-candidate-500/20 text-candidate-600 dark:text-candidate-400 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results count + clear */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between gap-4 mb-4"
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filteredApplications.length === applications.length
              ? `Showing ${applications.length} of ${totalCount} application${totalCount !== 1 ? 's' : ''}${totalPages > 1 ? ` (page ${page} of ${totalPages})` : ''}`
              : `Showing ${filteredApplications.length} of ${applications.length} applications`}
          </p>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-candidate-600 dark:text-candidate-400 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded"
            >
              Clear filters
            </button>
          )}
        </motion.div>

        {/* Divider */}
        <div className="h-px bg-gray-200/80 dark:bg-gray-700/80 mb-6" aria-hidden />

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <ApplicationSkeleton key={i} />
              ))}
            </div>
          ) : filteredApplications.length > 0 ? (
            <ul className="space-y-4 list-none p-0 m-0">
              {filteredApplications.map((app, index) => (
                <li key={app.id}>
                  <ApplicationListCard
                    application={app}
                    index={index}
                    onWithdrawn={() => fetchApplications(page)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ApplicationsEmptyState
              hasFilter={hasActiveFilter}
              onClearFilter={clearFilters}
            />
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | string)[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    typeof item === 'string' ? (
                      <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">...</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                          page === item
                            ? 'bg-candidate-500 text-white shadow-sm shadow-candidate-500/25'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {item}
                      </button>
                    )
                  )}
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
