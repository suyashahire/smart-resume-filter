'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Brain } from 'lucide-react';
import MagneticButton from '@/components/landing/MagneticButton';
import SectionContainer from '@/components/landing/SectionContainer';

export default function CTASection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <div style={{ background: '#faf8f5' }}>
            <SectionContainer>
                <motion.div
                    ref={ref}
                    initial={{ opacity: 0, y: 40 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.7 }}
                    className="relative"
                >
                    {/* Outer glow — enhanced (improvement #7) */}
                    <div className="absolute -inset-6 bg-gradient-to-br from-blue-300/30 via-purple-300/30 to-orange-300/30 rounded-[52px] blur-3xl" />

                    {/* Card */}
                    <div className="relative rounded-[40px] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-12 md:p-20 text-center overflow-hidden">
                        {/* Background pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 800 400">
                                <circle cx="400" cy="200" r="300" stroke="white" strokeWidth="0.5" fill="none" opacity="0.3" />
                                <circle cx="400" cy="200" r="200" stroke="white" strokeWidth="0.5" fill="none" opacity="0.2" />
                                <circle cx="400" cy="200" r="100" stroke="white" strokeWidth="0.5" fill="none" opacity="0.1" />
                                {/* Horizontal lines */}
                                {[...Array(8)].map((_, i) => (
                                    <line key={`h-${i}`} x1="0" y1={50 + i * 50} x2="800" y2={50 + i * 50} stroke="white" strokeWidth="0.3" opacity="0.1" />
                                ))}
                                {/* Vertical lines */}
                                {[...Array(16)].map((_, i) => (
                                    <line key={`v-${i}`} x1={50 + i * 50} y1="0" x2={50 + i * 50} y2="400" stroke="white" strokeWidth="0.3" opacity="0.1" />
                                ))}
                            </svg>
                        </div>
                        {/* Noise texture (improvement #11) */}
                        <div className="absolute inset-0 rounded-[40px] opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

                        {/* Content */}
                        <div className="relative z-10">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-[32px] md:text-[44px] font-bold text-white tracking-tight mb-4 leading-tight"
                            >
                                Build the future of hiring
                                <br />
                                with HireQ.
                            </motion.h2>

                            {/* Decorative star */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={isInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="flex justify-center my-8"
                            >
                                <Brain className="h-10 w-10 text-white/50" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.5, delay: 0.5 }}
                            >
                                <MagneticButton>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-2 px-8 py-4 text-[15px] font-semibold text-slate-800 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-all shadow-xl hover:shadow-2xl active:scale-[0.97]"
                                    >
                                        Get Started
                                    </Link>
                                </MagneticButton>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </SectionContainer>
        </div>
    );
}
