'use client';

function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`rounded-lg bg-gray-200/60 dark:bg-gray-700/40 animate-pulse ${className}`} />
  );
}

export default function JobCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg p-5 sm:p-6">
      {/* Header */}
      <div className="flex items-start gap-3.5 mb-3">
        <Shimmer className="w-11 h-11 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <Shimmer className="h-4 w-48 sm:w-56" />
          <Shimmer className="h-3 w-32" />
        </div>
      </div>
      {/* Badges */}
      <div className="flex gap-2 mb-3">
        <Shimmer className="h-7 w-20 rounded-lg" />
        <Shimmer className="h-7 w-24 rounded-lg" />
        <Shimmer className="h-7 w-16 rounded-lg" />
      </div>
      {/* Description */}
      <Shimmer className="h-3 w-full mb-1.5" />
      <Shimmer className="h-3 w-3/4 mb-3" />
      {/* Skills */}
      <div className="flex gap-1.5 mb-4">
        <Shimmer className="h-5 w-14 rounded-md" />
        <Shimmer className="h-5 w-18 rounded-md" />
        <Shimmer className="h-5 w-12 rounded-md" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 dark:border-gray-800/60">
        <Shimmer className="h-3 w-24" />
        <Shimmer className="h-9 w-28 rounded-xl" />
      </div>
    </div>
  );
}
