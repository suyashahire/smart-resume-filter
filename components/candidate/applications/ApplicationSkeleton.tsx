'use client';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm';

export default function ApplicationSkeleton() {
  return (
    <div className={`${CARD_CLASS} p-5 animate-pulse`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 w-48 sm:w-56 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-8 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
