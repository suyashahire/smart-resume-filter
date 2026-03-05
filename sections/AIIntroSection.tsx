'use client';

import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { Brain, Users, Mic } from 'lucide-react';
import SectionContainer from '@/components/landing/SectionContainer';

const features = [
    {
        icon: Brain,
        title: 'AI Resume Intelligence',
        description: 'Automatically extract skills, experience, and candidate insights with NLP-powered parsing.',
        color: 'text-orange-500',
        bg: 'bg-orange-50',
    },
    {
        icon: Users,
        title: 'Smart Candidate Matching',
        description: 'ML models match candidates to jobs using semantic similarity for precise, unbiased ranking.',
        color: 'text-blue-500',
        bg: 'bg-blue-50',
    },
    {
        icon: Mic,
        title: 'Interview Intelligence',
        description: 'AI analyzes interview responses for sentiment, confidence, and role-fit signals.',
        color: 'text-purple-500',
        bg: 'bg-purple-50',
    },
];

export default function AIIntroSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <div id="platform" className="relative overflow-hidden" style={{ background: '#faf8f5' }}>
            {/* Glow orbs (improvement #7) */}
            <div
                className="absolute top-[10%] right-[5%] w-[500px] h-[500px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)', filter: 'blur(140px)' }}
            />
            <div
                className="absolute bottom-[10%] left-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', filter: 'blur(140px)' }}
            />
            <SectionContainer>
                <motion.h2
                    ref={ref}
                    initial={{ opacity: 0, y: 30 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6 }}
                    className="text-[36px] md:text-[44px] font-bold text-center text-gray-900 tracking-tight mb-16 leading-tight"
                >
                    Powering the future of AI hiring
                </motion.h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left — Gradient Glass Card Illustration */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="relative aspect-[4/3] rounded-[32px] overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-100/60 to-blue-50" />
                        {/* Decorative abstract shapes */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                                    className="w-48 h-48 md:w-64 md:h-64 border border-white/40 rounded-3xl"
                                    style={{ transform: 'rotate(45deg)' }}
                                />
                                <motion.div
                                    animate={{ rotate: [0, -360] }}
                                    transition={{ duration: 80, repeat: Infinity, ease: 'linear' }}
                                    className="absolute inset-0 w-48 h-48 md:w-64 md:h-64 border border-white/30 rounded-3xl"
                                    style={{ transform: 'rotate(22.5deg)' }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Brain className="h-12 w-12 md:h-16 md:w-16 text-white/70" />
                                </div>
                            </div>
                        </div>
                        {/* Gradient overlay at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-blue-200/40 to-transparent" />
                    </motion.div>

                    {/* Right — Features list */}
                    <div className="space-y-8">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, x: 30 }}
                                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                                    transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
                                    className="flex gap-5"
                                >
                                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center`}>
                                        <Icon className={`h-5 w-5 ${feature.color}`} />
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-bold text-gray-900 mb-1.5">{feature.title}</h3>
                                        <p className="text-[15px] text-gray-500 leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </SectionContainer>
        </div>
    );
}
