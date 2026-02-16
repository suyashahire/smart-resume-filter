'use client';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md';

export default function JobCardSkeleton() {
  return (
    <div className={`${CARD_CLASS} p-5 animate-pulse`}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 min-w-0 space-y-2">
          <div className="h-4 w-48 sm:w-56 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
      <div className="flex gap-2 mb-3">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
      <div className="h-3 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-5 w-14 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-9 w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );
}
