'use client';

const CARD_CLASS =
  'rounded-xl border border-gray-200/60 dark:border-gray-700/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md animate-pulse';

export default function JobDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      <div className={`${CARD_CLASS} p-6 mb-6`}>
        <div className="flex gap-4">
          <div className="w-14 h-14 rounded-xl bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="flex gap-2 mt-3">
              <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex gap-2 mb-4">
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
          <div className={`${CARD_CLASS} p-6`}>
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-px bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-4/5 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className={`${CARD_CLASS} p-6`}>
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-px bg-gray-200 dark:bg-gray-700 mb-4" />
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <div className={`${CARD_CLASS} p-6`}>
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-xl mb-3" />
            <div className="h-9 w-full bg-gray-200 dark:bg-gray-700 rounded-xl" />
          </div>
          <div className={`${CARD_CLASS} p-6`}>
            <div className="h-5 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-7 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
