'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import SectionContainer from '@/components/landing/SectionContainer';
import GridOverlay from '@/components/landing/GridOverlay';

export default function InfrastructureSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <div className="relative overflow-hidden" style={{ background: '#f5f0eb' }}>
            <GridOverlay />
            <SectionContainer>
                <div ref={ref} className="text-center">
                    {/* Label tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5 }}
                        className="flex items-center justify-center gap-2 text-[12px] font-semibold tracking-[0.15em] uppercase text-gray-400 mb-6"
                    >
                        <span>RECRUITERS</span>
                        <span className="text-gray-300">|</span>
                        <span>CANDIDATES</span>
                        <span className="text-gray-300">|</span>
                        <span>ENTERPRISE</span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-[36px] md:text-[48px] font-bold text-gray-900 tracking-tight mb-6 leading-tight"
                    >
                        AI Infrastructure for
                        <br />
                        Modern Hiring
                    </motion.h2>

                    {/* Description */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-[17px] text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Scalable AI infrastructure that processes thousands of candidate profiles and resumes.
                        Built to handle the complexity of modern recruitment so teams can focus on people, not process.
                    </motion.p>

                    {/* Portal Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14"
                    >
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/15 hover:shadow-xl active:scale-[0.97]"
                        >
                            Recruiter Portal
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/candidate/login"
                            className="inline-flex items-center gap-2 px-7 py-3.5 text-[14px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
                        >
                            Candidate Portal
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </motion.div>

                    {/* Feature cards grid — Sarvam-style with gradient icons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                title: 'Resume Processing',
                                desc: 'NLP-powered extraction that turns unstructured resumes into structured talent profiles in seconds.',
                                gradient: 'from-orange-300 to-orange-400',
                                bgGradient: 'from-orange-50 to-orange-100/50',
                            },
                            {
                                title: 'Semantic Matching',
                                desc: 'Sentence-BERT embeddings match candidates to roles with human-level understanding of skills and context.',
                                gradient: 'from-blue-300 to-blue-400',
                                bgGradient: 'from-blue-50 to-blue-100/50',
                            },
                            {
                                title: 'Interview Analytics',
                                desc: 'Whisper transcription + sentiment analysis gives you data-driven insights from every conversation.',
                                gradient: 'from-purple-300 to-purple-400',
                                bgGradient: 'from-purple-50 to-purple-100/50',
                            },
                        ].map((card, i) => (
                            <motion.div
                                key={card.title}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
                                whileHover={{ y: -6 }}
                                className="bg-[#fefcf9] rounded-[24px] border border-[#ede5db] p-7 text-left hover:shadow-xl transition-all duration-300 group"
                            >
                                {/* Icon */}
                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.bgGradient} flex items-center justify-center mb-5`}>
                                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${card.gradient} opacity-80`} />
                                </div>
                                <h3 className="text-[17px] font-bold text-gray-900 mb-2">{card.title}</h3>
                                <p className="text-[14px] text-gray-500 leading-relaxed">{card.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </SectionContainer>
        </div>
    );
}
