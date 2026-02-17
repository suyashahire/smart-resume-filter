'use client';

import { LucideIcon, FileText, Search, Users, Gift, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Stage {
    key: string;
    label: string;
    icon: LucideIcon;
    count: number;
}

interface PipelineStepperProps {
    stages: Stage[];
    contextTip?: string;
}

const stageColors: Record<string, { active: string; ring: string; text: string; connector: string }> = {
    applied: { active: 'bg-blue-500', ring: 'ring-blue-400/30', text: 'text-blue-500', connector: 'bg-blue-400/40' },
    screening: { active: 'bg-amber-500', ring: 'ring-amber-400/30', text: 'text-amber-500', connector: 'bg-amber-400/40' },
    interview: { active: 'bg-purple-500', ring: 'ring-purple-400/30', text: 'text-purple-500', connector: 'bg-purple-400/40' },
    offer: { active: 'bg-green-500', ring: 'ring-green-400/30', text: 'text-green-500', connector: 'bg-green-400/40' },
};

export default function PipelineStepper({ stages, contextTip }: PipelineStepperProps) {
    const total = stages.reduce((sum, s) => sum + s.count, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/60 backdrop-blur-lg shadow-sm p-5 sm:p-6"
        >
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
                <span className="w-8 h-8 rounded-lg bg-candidate-500/10 dark:bg-candidate-500/20 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-candidate-600 dark:text-candidate-400" />
                </span>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Application Pipeline</h2>
            </div>

            {/* Stepper */}
            <div className="relative flex items-start justify-between">
                {stages.map((stage, i) => {
                    const palette = stageColors[stage.key] ?? stageColors.applied;
                    const isActive = stage.count > 0;
                    const Icon = stage.icon;

                    return (
                        <div key={stage.key} className="relative flex flex-col items-center flex-1">
                            {/* Connector line (not on first) */}
                            {i > 0 && (
                                <div className="absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 pointer-events-none">
                                    <div className={`h-full ${isActive ? palette.connector : 'bg-gray-200 dark:bg-gray-700'}`} />
                                </div>
                            )}

                            {/* Circle */}
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
                                className={`
                  relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                  transition-all duration-200
                  ${isActive
                                        ? `${palette.active} ring-4 ${palette.ring} shadow-md`
                                        : 'bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-200 dark:ring-gray-700'
                                    }
                `}
                            >
                                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                            </motion.div>

                            {/* Label + count */}
                            <div className="mt-2.5 text-center">
                                <p className={`text-xs font-semibold ${isActive ? palette.text : 'text-gray-400 dark:text-gray-500'}`}>
                                    {stage.label}
                                </p>
                                <p className={`text-lg font-bold tabular-nums mt-0.5 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
                                    {stage.count}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Context tip */}
            {contextTip && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-5 text-xs text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
                >
                    💡 {contextTip}
                </motion.p>
            )}
        </motion.div>
    );
}
