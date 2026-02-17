'use client';

import { motion } from 'framer-motion';

function Shimmer({ className = '' }: { className?: string }) {
    return (
        <div className={`rounded-lg bg-gray-200/60 dark:bg-gray-700/40 animate-pulse ${className}`} />
    );
}

export default function SkeletonDashboard() {
    return (
        <div className="min-h-screen">
            <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 -z-10" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* Header skeleton */}
                <div className="mb-8">
                    <Shimmer className="h-4 w-28 mb-3" />
                    <Shimmer className="h-8 w-64 mb-2" />
                    <Shimmer className="h-4 w-48" />
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-4 sm:p-5"
                        >
                            <Shimmer className="h-9 w-9 rounded-xl mb-3" />
                            <Shimmer className="h-7 w-10 mb-1" />
                            <Shimmer className="h-3 w-16 mb-3" />
                            <Shimmer className="h-1 w-full" />
                        </div>
                    ))}
                </div>

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                    {/* Left col */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Pipeline skeleton */}
                        <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-5 sm:p-6">
                            <Shimmer className="h-5 w-40 mb-6" />
                            <div className="flex justify-between">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="flex flex-col items-center flex-1">
                                        <Shimmer className="h-10 w-10 rounded-full" />
                                        <Shimmer className="h-3 w-14 mt-2.5" />
                                        <Shimmer className="h-5 w-6 mt-1" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Applications skeleton */}
                        <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-5 sm:p-6">
                            <Shimmer className="h-5 w-32 mb-5" />
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-3 py-3">
                                    <Shimmer className="h-10 w-10 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-1.5">
                                        <Shimmer className="h-4 w-44" />
                                        <Shimmer className="h-3 w-28" />
                                    </div>
                                    <Shimmer className="h-5 w-16 rounded-md" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right col */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 p-5 sm:p-6">
                            <Shimmer className="h-5 w-32 mb-4" />
                            <div className="flex justify-center mb-4">
                                <Shimmer className="h-24 w-24 rounded-full" />
                            </div>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} className="flex items-center gap-2 py-1.5">
                                    <Shimmer className="h-4 w-4 rounded-full" />
                                    <Shimmer className="h-3 w-28" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
