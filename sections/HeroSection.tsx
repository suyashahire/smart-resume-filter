'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import MeshBackground from '@/components/landing/MeshBackground';
import GridOverlay from '@/components/landing/GridOverlay';
import MagneticButton from '@/components/landing/MagneticButton';

export default function HeroSection() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });
    const bgY = useTransform(scrollYProgress, [0, 1], [0, -120]);

    return (
        <section
            ref={heroRef}
            className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #f5e6d8 0%, #ede4f0 25%, #e8dff5 40%, #f0ebe3 60%, #faf8f5 100%)' }}
        >
            <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bgY }}>
                <MeshBackground />
                <GridOverlay />
            </motion.div>
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-16 text-center">
                {/* Decorative motif */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    className="flex justify-center mb-6"
                >
                    <svg width="80" height="36" viewBox="0 0 80 36" fill="none" className="text-gray-400/50">
                        <path d="M20 18c0-8 6-16 14-16s14 8 14 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <path d="M32 18c0-8 6-16 14-16s14 8 14 16" stroke="currentColor" strokeWidth="1.5" fill="none" />
                        <circle cx="40" cy="18" r="3" fill="currentColor" opacity="0.3" />
                    </svg>
                </motion.div>

                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#ede5db] bg-[#fefcf9]/80 backdrop-blur-sm text-[14px] font-medium text-gray-600 mb-8 shadow-sm"
                >
                    <span className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 animate-pulse" />
                    Next-Generation Hiring Platform
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.15 }}
                    className="text-[48px] md:text-[68px] lg:text-[80px] font-bold tracking-tight text-gray-900 leading-[1.05] mb-6"
                >
                    AI for modern hiring
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="text-[17px] md:text-[19px] text-gray-500 max-w-xl mx-auto leading-relaxed mb-10"
                >
                    Built for modern hiring. Powered by frontier-class models.
                    <br />
                    Designed for modern teams.
                </motion.p>

                {/* Primary CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
                >
                    <MagneticButton>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2.5 px-8 py-4 text-[15px] font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:shadow-gray-900/30 active:scale-[0.97]"
                        >
                            Experience HireQ
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </MagneticButton>
                </motion.div>

                {/* Secondary CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.55 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3"
                >
                    <Link
                        href="/login"
                        className="px-6 py-3 text-[14px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
                    >
                        Recruiter Portal
                    </Link>
                    <Link
                        href="/candidate/login"
                        className="px-6 py-3 text-[14px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
                    >
                        Candidate Portal
                    </Link>
                </motion.div>
            </div>

            {/* Scrolling logos strip — like sarvam "India Builds With" */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
                className="relative z-10 w-full mt-auto pb-10"
            >
                <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-gray-400 text-center mb-5">
                    Trusted by modern teams
                </p>
                <div className="flex items-center justify-center gap-10 md:gap-16 opacity-40">
                    {['TechCorp', 'InnoHire', 'ScaleUp', 'TalentAI', 'PeopleFirst'].map((name) => (
                        <span key={name} className="text-[15px] md:text-[17px] font-bold text-gray-500 tracking-wide whitespace-nowrap select-none">
                            {name}
                        </span>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
