'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Animated counter hook ── */
function useCountUp(target: number, duration = 600) {
    const [value, setValue] = useState(0);
    const raf = useRef<number>();

    useEffect(() => {
        if (target === 0) { setValue(0); return; }
        const start = performance.now();
        const step = (now: number) => {
            const t = Math.min((now - start) / duration, 1);
            // ease-out quad
            setValue(Math.round(target * (1 - (1 - t) * (1 - t))));
            if (t < 1) raf.current = requestAnimationFrame(step);
        };
        raf.current = requestAnimationFrame(step);
        return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    }, [target, duration]);

    return value;
}

/* ── Accent colour map (bg → ring/text helpers) ── */
const accentMap: Record<string, { ring: string; bar: string; iconBg: string }> = {
    'bg-candidate-500': { ring: 'ring-candidate-400/20', bar: 'bg-candidate-500', iconBg: 'bg-candidate-500' },
    'bg-blue-500': { ring: 'ring-blue-400/20', bar: 'bg-blue-500', iconBg: 'bg-blue-500' },
    'bg-amber-500': { ring: 'ring-amber-400/20', bar: 'bg-amber-500', iconBg: 'bg-amber-500' },
    'bg-purple-500': { ring: 'ring-purple-400/20', bar: 'bg-purple-500', iconBg: 'bg-purple-500' },
    'bg-green-500': { ring: 'ring-green-400/20', bar: 'bg-green-500', iconBg: 'bg-green-500' },
    'bg-red-500': { ring: 'ring-red-400/20', bar: 'bg-red-500', iconBg: 'bg-red-500' },
};

interface KpiCardProps {
    label: string;
    value: number;
    icon: LucideIcon;
    accentColor: string;       // e.g. 'bg-candidate-500'
    href?: string;
    progressPercent?: number;
    trend?: string;            // e.g. "+2 this week"
    index?: number;
}

export default function KpiCard({
    label,
    value,
    icon: Icon,
    accentColor,
    href = '/candidate/applications',
    progressPercent,
    trend,
    index = 0,
}: KpiCardProps) {
    const display = useCountUp(value);
    const palette = accentMap[accentColor] ?? accentMap['bg-candidate-500'];

    const inner = (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className={`
        group relative overflow-hidden rounded-2xl
        border border-gray-200/50 dark:border-gray-700/50
        bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg
        shadow-sm
        transition-all duration-200
        hover:shadow-lg hover:ring-2 ${palette.ring}
        hover:-translate-y-0.5
      `}
        >
            <div className="p-4 sm:p-5">
                {/* Icon */}
                <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${palette.iconBg}`}
                    aria-hidden
                >
                    <Icon className="h-4 w-4 text-white" />
                </div>

                {/* Value + trend */}
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white leading-none">
                    {display}
                </p>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
                    {label}
                </p>

                {trend && (
                    <span className="inline-block mt-1.5 text-[10px] font-medium text-candidate-600 dark:text-candidate-400 bg-candidate-500/10 dark:bg-candidate-500/20 rounded-md px-1.5 py-0.5">
                        {trend}
                    </span>
                )}

                {/* Sparkline bar */}
                {progressPercent !== undefined && (
                    <div className="mt-3 h-1 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, progressPercent)}%` }}
                            transition={{ delay: index * 0.04 + 0.2, duration: 0.5, ease: 'easeOut' }}
                            className={`h-full rounded-full ${palette.bar} opacity-80`}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );

    if (href) {
        return (
            <Link href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-candidate-500 rounded-2xl">
                {inner}
            </Link>
        );
    }
    return inner;
}
