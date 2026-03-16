'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Quote } from 'lucide-react';
import SectionContainer from '@/components/landing/SectionContainer';

const testimonials = [
    {
        quote: 'HireQ reduced our time-to-hire by 60%. The AI screening is incredibly accurate and the candidate ranking saves our team hours every week.',
        name: 'Priya Sharma',
        role: 'VP of Talent',
        accent: 'from-orange-400 to-amber-400',
    },
    {
        quote: 'The interview analysis feature is a game-changer. We now have data-backed insights for every candidate conversation, not just gut feelings.',
        name: 'Rahul Mehta',
        role: 'Head of HR',
        accent: 'from-blue-400 to-indigo-400',
    },
    {
        quote: 'As a candidate, the portal made job hunting effortless. I could track my applications in real-time and the feedback was genuinely helpful.',
        name: 'Ananya Verma',
        role: 'Software Engineer',
        accent: 'from-purple-400 to-violet-400',
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
                        className="text-[34px] md:text-[46px] font-bold text-center text-gray-900 tracking-tight mb-14 leading-tight"
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
                                className="relative bg-[#f5f0eb]/80 rounded-[24px] border border-[#ede5db] p-8 flex flex-col hover:shadow-lg transition-all duration-300"
                            >
                                {/* Accent bar */}
                                <div className={`absolute top-0 left-8 right-8 h-[3px] rounded-full bg-gradient-to-r ${t.accent} opacity-50`} />

                                <p className="text-[15px] text-gray-600 leading-relaxed flex-1 mb-6">
                                    &ldquo;{t.quote}&rdquo;
                                </p>

                                <div className="border-t border-gray-200/60 pt-5">
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
