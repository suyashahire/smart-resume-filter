'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Brain, Sparkles } from 'lucide-react';
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
                    {/* Outer glow */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-blue-200/25 via-purple-200/25 to-orange-200/25 rounded-[48px] blur-3xl" />

                    {/* Card */}
                    <div className="relative rounded-[36px] overflow-hidden" style={{ background: 'linear-gradient(135deg, #2a2540 0%, #1e293b 40%, #1a1a2e 100%)' }}>
                        {/* Globe wireframe background */}
                        <div className="absolute inset-0 opacity-10">
                            <svg className="w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
                                <circle cx="400" cy="200" r="280" stroke="white" strokeWidth="0.4" fill="none" opacity="0.4" />
                                <circle cx="400" cy="200" r="200" stroke="white" strokeWidth="0.4" fill="none" opacity="0.3" />
                                <circle cx="400" cy="200" r="120" stroke="white" strokeWidth="0.4" fill="none" opacity="0.2" />
                                <ellipse cx="400" cy="200" rx="280" ry="100" stroke="white" strokeWidth="0.3" fill="none" opacity="0.2" />
                                <ellipse cx="400" cy="200" rx="280" ry="60" stroke="white" strokeWidth="0.3" fill="none" opacity="0.15" />
                                <line x1="400" y1="0" x2="400" y2="400" stroke="white" strokeWidth="0.3" opacity="0.15" />
                                <line x1="120" y1="200" x2="680" y2="200" stroke="white" strokeWidth="0.3" opacity="0.15" />
                            </svg>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1a1a2e]/80 to-transparent" />

                        <div className="relative z-10 px-8 py-16 md:px-16 md:py-20 text-center">
                            <motion.h2
                                initial={{ opacity: 0, y: 20 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="text-[30px] md:text-[42px] font-bold text-white tracking-tight mb-3 leading-tight"
                            >
                                Build the future of hiring
                                <br />
                                with HireQ.
                            </motion.h2>

                            {/* Decorative star */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                                animate={isInView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="flex justify-center my-7"
                            >
                                <Sparkles className="h-8 w-8 text-white/40" />
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
                                        Get Started Now
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
