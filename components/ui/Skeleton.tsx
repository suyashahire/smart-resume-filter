'use client';

/**
 * Reusable skeleton / shimmer components for loading states.
 */

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-gray-200/60 dark:bg-gray-700/40 animate-pulse ${className}`}
    />
  );
}

/** Dashboard skeleton — stat cards, charts, table */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <Shimmer className="h-4 w-32 mb-3" />
          <Shimmer className="h-8 w-56 mb-2" />
          <Shimmer className="h-4 w-40" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-5"
            >
              <Shimmer className="h-10 w-10 rounded-xl mb-3" />
              <Shimmer className="h-8 w-16 mb-1" />
              <Shimmer className="h-3 w-24" />
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-6"
            >
              <Shimmer className="h-5 w-40 mb-4" />
              <Shimmer className="h-[250px] w-full rounded-xl" />
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-6">
          <Shimmer className="h-5 w-48 mb-5" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3">
              <Shimmer className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-4 w-40" />
                <Shimmer className="h-3 w-28" />
              </div>
              <Shimmer className="h-6 w-16 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Results page skeleton — filter bar, candidate cards */
export function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Shimmer className="h-4 w-24 mb-3" />
          <Shimmer className="h-9 w-64 mb-2" />
          <Shimmer className="h-4 w-48" />
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Shimmer key={i} className="h-10 w-24 rounded-xl" />
          ))}
        </div>

        {/* Search bar */}
        <Shimmer className="h-12 w-full rounded-xl mb-6" />

        {/* Candidate cards */}
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-6"
            >
              <div className="flex items-start gap-4">
                <Shimmer className="h-14 w-14 rounded-xl flex-shrink-0" />
                <div className="flex-1">
                  <Shimmer className="h-5 w-44 mb-2" />
                  <Shimmer className="h-3 w-32 mb-3" />
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <Shimmer key={j} className="h-6 w-16 rounded-md" />
                    ))}
                  </div>
                </div>
                <Shimmer className="h-14 w-14 rounded-full flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Messages page skeleton — conversation list + chat area */
export function MessagesSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-6">
          <Shimmer className="h-8 w-40 mb-2" />
          <Shimmer className="h-4 w-56" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
          {/* Conversation list */}
          <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-4 overflow-hidden">
            <Shimmer className="h-10 w-full rounded-lg mb-4" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <Shimmer className="h-10 w-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Shimmer className="h-4 w-28" />
                  <Shimmer className="h-3 w-40" />
                </div>
                <Shimmer className="h-3 w-10" />
              </div>
            ))}
          </div>

          {/* Chat area */}
          <div className="md:col-span-2 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-6 flex flex-col">
            {/* Chat header */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200/50 dark:border-gray-700/50 mb-4">
              <Shimmer className="h-10 w-10 rounded-full" />
              <div>
                <Shimmer className="h-4 w-32 mb-1" />
                <Shimmer className="h-3 w-20" />
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <Shimmer className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-3/5' : 'w-2/5'}`} />
                </div>
              ))}
            </div>
            {/* Input */}
            <Shimmer className="h-12 w-full rounded-xl mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
