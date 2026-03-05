'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import SectionContainer from '@/components/landing/SectionContainer';

// TODO: Replace with real customer testimonials before production launch.
// Current names and companies are fictional placeholders.
const testimonials = [
    {
        quote: 'HireQ reduced our time-to-hire by 60%. The AI screening is incredibly accurate and the candidate ranking saves our team hours every week.',
        name: 'Priya Sharma',
        role: 'VP of Talent, TechCorp',
        company: 'TechCorp',
    },
    {
        quote: 'The interview analysis feature is a game-changer. We now have data-backed insights for every candidate conversation, not just gut feelings.',
        name: 'Rahul Mehta',
        role: 'Head of HR, InnovatePro',
        company: 'InnovatePro',
    },
    {
        quote: 'As a candidate, the portal made job hunting effortless. I could track my applications in real-time and the feedback was genuinely helpful.',
        name: 'Ananya Verma',
        role: 'Software Engineer, DataFlow',
        company: 'DataFlow',
    },
];

export default function TestimonialsSection() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <div className="relative" id="company" style={{ background: '#faf8f5' }}>
            <SectionContainer>
                <div ref={ref}>
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="text-[36px] md:text-[48px] font-bold text-center text-gray-900 tracking-tight mb-14 leading-tight"
                    >
                        What our customers say
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={t.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={isInView ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.6, delay: 0.15 + i * 0.1 }}
                                whileHover={{ y: -4 }}
                                className="bg-[#f5f0eb]/80 rounded-[24px] border border-[#ede5db] p-8 flex flex-col hover:shadow-lg transition-all duration-300"
                            >
                                {/* Company badge */}
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-[14px] font-bold text-gray-500">
                                        {t.company.charAt(0)}
                                    </div>
                                    <span className="text-[14px] font-semibold text-gray-400">{t.company}</span>
                                </div>

                                {/* Quote */}
                                <p className="text-[15px] text-gray-600 leading-relaxed flex-1 mb-6">
                                    &ldquo;{t.quote}&rdquo;
                                </p>

                                {/* Author */}
                                <div className="border-t border-gray-100 pt-5">
                                    <p className="text-[15px] font-semibold text-gray-900">{t.name}</p>
                                    <p className="text-[13px] text-gray-400">{t.role}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </SectionContainer>
        </div>
    );
}
