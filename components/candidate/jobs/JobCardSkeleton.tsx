'use client';

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-gray-200/60 dark:bg-gray-700/40 animate-pulse ${className}`} />
  );
}

export default function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/40 bg-white dark:bg-gray-900/70 p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-4">
        <Shimmer className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-5 w-52 sm:w-64" />
        </div>
        <Shimmer className="w-8 h-8 rounded-lg flex-shrink-0" />
      </div>
      {/* Meta info */}
      <div className="flex gap-4 mb-3.5">
        <Shimmer className="h-3 w-20" />
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-3 w-16" />
      </div>
      {/* Description */}
      <Shimmer className="h-3 w-full mb-1.5" />
      <Shimmer className="h-3 w-4/5 mb-4" />
      {/* Skills */}
      <div className="flex gap-1.5 mb-4">
        <Shimmer className="h-6 w-16 rounded-lg" />
        <Shimmer className="h-6 w-20 rounded-lg" />
        <Shimmer className="h-6 w-14 rounded-lg" />
        <Shimmer className="h-6 w-18 rounded-lg" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800/50">
        <div className="flex gap-3.5">
          <Shimmer className="h-3 w-24" />
          <Shimmer className="h-3 w-20" />
        </div>
        <Shimmer className="h-10 w-32 rounded-xl" />
      </div>
    </div>
  );
}
