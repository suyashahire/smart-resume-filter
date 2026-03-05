'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import MeshBackground from '@/components/landing/MeshBackground';
import GridOverlay from '@/components/landing/GridOverlay';
import MagneticButton from '@/components/landing/MagneticButton';

const logos = [
    'TechCorp', 'InnovatePro', 'DataFlow', 'CloudHire', 'SkillSync', 'TalentAI', 'RecruitIQ'
];

export default function HeroSection() {
    const heroRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start'],
    });
    // Parallax: background moves slower than scroll (improvement #8)
    const bgY = useTransform(scrollYProgress, [0, 1], [0, -120]);

    return (
        <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden" style={{ background: 'linear-gradient(180deg, #f5e6d8 0%, #ede4f0 25%, #e8dff5 40%, #f0ebe3 60%, #faf8f5 100%)' }}>
            {/* Background layers with parallax depth */}
            <motion.div className="absolute inset-0 pointer-events-none" style={{ y: bgY }}>
                <MeshBackground />
                <GridOverlay />
            </motion.div>
            {/* Noise texture overlay (improvement #11) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")` }} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-32 pb-20 text-center">
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
                    className="text-[52px] md:text-[72px] lg:text-[84px] font-bold tracking-tight text-gray-900 leading-[1.05] mb-6"
                >
                    AI for modern hiring
                </motion.h1>

                {/* Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 25 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="text-[18px] md:text-[20px] text-gray-500 max-w-xl mx-auto leading-relaxed mb-10"
                >
                    Built for modern hiring. Powered by frontier-class models.
                    <br />
                    Designed for modern teams.
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
                >
                    <MagneticButton>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2.5 px-8 py-4 text-[16px] font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:shadow-gray-900/30 active:scale-[0.97]"
                        >
                            Experience HireQ
                            <ArrowRight className="h-4.5 w-4.5" />
                        </Link>
                    </MagneticButton>
                </motion.div>

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

            {/* Logo strip */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.65 }}
                className="relative z-10 w-full border-t border-gray-200/30 py-10" style={{ background: 'rgba(250,248,245,0.5)', backdropFilter: 'blur(8px)' }}
            >
                <p className="text-center text-[12px] font-semibold tracking-[0.15em] uppercase text-gray-400 mb-8">
                    Trusted by teams building the future of hiring
                </p>
                <div className="flex items-center justify-center gap-12 md:gap-16 overflow-hidden px-6 flex-wrap">
                    {logos.map((name, i) => (
                        <motion.span
                            key={name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 0.4, y: 0 }}
                            transition={{ delay: 0.7 + i * 0.05 }}
                            whileHover={{ opacity: 0.8 }}
                            className="text-[18px] md:text-[20px] font-bold text-gray-900 tracking-tight select-none cursor-default"
                        >
                            {name}
                        </motion.span>
                    ))}
                </div>
            </motion.div>
        </section>
    );
}
