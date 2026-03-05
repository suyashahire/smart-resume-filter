'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, FileCheck, BarChart3 } from 'lucide-react';
import SectionContainer from '@/components/landing/SectionContainer';

const cards = [
    {
        icon: Search,
        title: 'Smart Job Discovery',
        description: 'AI recommends relevant jobs based on your skills, experience, and career trajectory.',
        gradient: 'from-blue-400 to-indigo-400',
        bg: 'bg-blue-50',
        iconColor: '#60a5fa',
    },
    {
        icon: FileCheck,
        title: 'Easy Applications',
        description: 'Apply with one profile. Upload your resume once and apply to multiple positions seamlessly.',
        gradient: 'from-orange-400 to-amber-400',
        bg: 'bg-orange-50',
        iconColor: '#fb923c',
    },
    {
        icon: BarChart3,
        title: 'Application Tracking',
        description: 'Track your job applications in real-time. Get notified on status changes instantly.',
        gradient: 'from-purple-400 to-violet-400',
        bg: 'bg-purple-50',
        iconColor: '#a78bfa',
    },
];

export default function CandidateSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <div id="candidates" style={{ background: '#f5f0eb' }}>
            <SectionContainer>
                <div ref={ref}>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="text-[36px] md:text-[48px] font-bold text-center text-gray-900 tracking-tight mb-5 leading-tight"
                    >
                        Built to support every stage
                        <br className="hidden md:block" />
                        {' '}of your career
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-[17px] text-gray-500 text-center max-w-xl mx-auto mb-14 leading-relaxed"
                    >
                        Whether you&apos;re a fresh graduate or an experienced professional, HireQ gives you the tools to find the right role.
                    </motion.p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {cards.map((card, i) => {
                            const Icon = card.icon;
                            return (
                                <motion.div
                                    key={card.title}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                                    transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                                    whileHover={{ y: -6 }}
                                    className="bg-[#fefcf9] rounded-[24px] border border-[#ede5db] p-8 hover:shadow-xl transition-all duration-300 group cursor-default"
                                >
                                    <div className={`w-14 h-14 rounded-2xl ${card.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                        <Icon className="h-6 w-6" style={{ color: card.iconColor }} />
                                    </div>
                                    <h3 className="text-[18px] font-bold text-gray-900 mb-2">{card.title}</h3>
                                    <p className="text-[14px] text-gray-500 leading-relaxed">{card.description}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </SectionContainer>
        </div>
    );
}
