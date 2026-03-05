'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useInView, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Upload, Brain, Users, Mic, TrendingUp } from 'lucide-react';

const pipelineSteps = [
    {
        icon: Upload,
        title: 'Resume Upload',
        description: 'Candidates and recruiters upload resumes in any format — PDF, DOCX, or plain text.',
        color: 'from-orange-400 to-amber-400',
        glowColor: 'rgba(251,146,60,0.3)',
    },
    {
        icon: Brain,
        title: 'AI Resume Parsing',
        description: 'NLP engine extracts skills, experience, education, and contact information with state-of-the-art accuracy.',
        color: 'from-blue-400 to-indigo-400',
        glowColor: 'rgba(96,165,250,0.3)',
    },
    {
        icon: Users,
        title: 'Candidate Matching',
        description: 'Sentence-BERT embeds resumes and job descriptions into a shared space for semantic similarity scoring.',
        color: 'from-emerald-400 to-teal-400',
        glowColor: 'rgba(52,211,153,0.3)',
    },
    {
        icon: Mic,
        title: 'Interview Intelligence',
        description: 'Whisper transcription + DistilBERT sentiment analysis produces data-driven candidate insights.',
        color: 'from-purple-400 to-violet-400',
        glowColor: 'rgba(167,139,250,0.3)',
    },
    {
        icon: TrendingUp,
        title: 'Hiring Insights',
        description: 'AI-powered dashboards deliver rankings, analytics, and actionable reports to close roles faster.',
        color: 'from-pink-400 to-rose-400',
        glowColor: 'rgba(244,114,182,0.3)',
    },
];

/* ─── Left pipeline (original style with descriptions) ─── */
function PipelineVisualization({ activeStep }: { activeStep: number }) {
    return (
        <div
            className="relative w-full max-w-[340px] mx-auto"
            style={{ perspective: '1200px', willChange: 'transform' }}
        >
            <div style={{ transformStyle: 'preserve-3d' }}>
                {pipelineSteps.map((step, i) => {
                    const Icon = step.icon;
                    const isActive = i <= activeStep;
                    const isCurrent = i === activeStep;

                    return (
                        <div
                            key={step.title}
                            className="relative flex items-start gap-4"
                            style={{ transform: `translateZ(${i * 10}px)` }}
                        >
                            {/* Vertical connector line */}
                            {i < pipelineSteps.length - 1 && (
                                <div className="absolute left-[23px] top-[48px] w-[2px] h-[40px] overflow-hidden">
                                    <motion.div
                                        className={`w-full h-full bg-gradient-to-b ${step.color}`}
                                        initial={{ scaleY: 0 }}
                                        animate={{ scaleY: isActive ? 1 : 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.08 }}
                                        style={{ transformOrigin: 'top' }}
                                    />
                                </div>
                            )}

                            {/* Icon node */}
                            <div className="relative flex-shrink-0 z-10">
                                <motion.div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                                        isActive
                                            ? `bg-gradient-to-br ${step.color} shadow-lg`
                                            : 'bg-[#f5f0eb] border border-[#e8e0d8]'
                                    }`}
                                    animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                                    transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                                >
                                    <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                </motion.div>
                                {isCurrent && (
                                    <motion.div
                                        className="absolute -inset-2 rounded-2xl"
                                        style={{ boxShadow: `0 0 30px ${step.glowColor}` }}
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                )}
                            </div>

                            {/* Text with description */}
                            <div className={`pt-1 pb-4 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-35'}`}>
                                <h4 className={`text-[15px] font-bold mb-1 transition-colors duration-500 ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {step.title}
                                </h4>
                                <p className={`text-[12px] leading-relaxed max-w-[220px] transition-colors duration-500 ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {step.description}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/* ─── Right side: animated step content (crossfade with slide) ─── */
function StepDetail({ activeStep }: { activeStep: number }) {
    const step = pipelineSteps[activeStep];
    const Icon = step.icon;

    return (
        <div className="relative h-full flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                    className="px-10 md:px-14 max-w-lg"
                >
                    <div className={`inline-flex p-3.5 rounded-2xl bg-gradient-to-br ${step.color} text-white mb-6`}>
                        <Icon className="h-7 w-7" />
                    </div>
                    <h3 className="text-[28px] md:text-[36px] font-bold text-gray-900 tracking-tight mb-4 leading-tight">
                        {step.title}
                    </h3>
                    <p className="text-[16px] md:text-[17px] text-gray-500 leading-relaxed">
                        {step.description}
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/* ─── Main section ─── */
export default function ScrollStackSection() {
    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-100px' });
    const [activeStep, setActiveStep] = useState(0);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: scrollContainerRef,
        offset: ['start start', 'end end'],
    });

    useMotionValueEvent(scrollYProgress, 'change', (latest) => {
        const progress = Math.max(0, Math.min(1, (latest - 0.1) / 0.8));
        const step = Math.min(Math.floor(progress * pipelineSteps.length), pipelineSteps.length - 1);
        setActiveStep(step);
    });

    return (
        <div ref={scrollContainerRef} style={{ height: '180vh', marginBottom: '-80vh', position: 'relative', zIndex: 0 }}>
            <div
                className="relative"
                style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #f7f3ee 50%, #faf8f5 100%)', minHeight: '100%' }}
            >
                {/* Soft glow orbs */}
                <div
                    className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.08) 0%, transparent 70%)', filter: 'blur(140px)' }}
                />
                <div
                    className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)', filter: 'blur(140px)' }}
                />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
                    {/* Section heading */}
                    <div ref={sectionRef} className="pt-28 pb-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            className="flex items-center justify-center gap-2 text-[12px] font-semibold tracking-[0.15em] uppercase text-gray-400 mb-6"
                        >
                            <span>FOR ENTERPRISE</span>
                            <span className="text-gray-300">|</span>
                            <span>GOVERNMENT</span>
                            <span className="text-gray-300">|</span>
                            <span>DEVELOPERS</span>
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-[36px] md:text-[48px] font-bold text-center text-gray-900 tracking-tight mb-5 leading-tight"
                        >
                            HireQ&apos;s Full-stack
                            <br />
                            AI Hiring Platform
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-[17px] text-gray-500 text-center max-w-lg mx-auto leading-relaxed"
                        >
                            From resume upload to hiring insights — our AI pipeline processes every step automatically.
                        </motion.p>
                    </div>

                    {/* ── Sticky card ── */}
                    <div className="sticky top-8 pb-4">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.7, delay: 0.3 }}
                        >
                            <div
                                className="rounded-[32px] border border-[#e8e0d8] shadow-xl overflow-hidden"
                                style={{
                                    background: '#fefcf9',
                                    height: 'calc(100vh - 6rem)',
                                    maxHeight: '740px',
                                    minHeight: '560px',
                                }}
                            >
                                {/* Desktop layout */}
                                <div className="hidden lg:grid grid-cols-[1fr_1.2fr] h-full">
                                    {/* Left — pipeline diagram */}
                                    <div
                                        className="flex items-center justify-center border-r border-[#ede5db] px-6"
                                        style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #f5f0eb 100%)' }}
                                    >
                                        <PipelineVisualization activeStep={activeStep} />
                                    </div>

                                    {/* Right — animated step detail */}
                                    <StepDetail activeStep={activeStep} />
                                </div>

                                {/* Mobile layout */}
                                <div className="lg:hidden flex flex-col h-full">
                                    <div className="flex-shrink-0 border-b border-[#ede5db] p-6" style={{ background: '#faf8f5' }}>
                                        <PipelineVisualization activeStep={activeStep} />
                                    </div>
                                    <div className="flex-1 min-h-0">
                                        <StepDetail activeStep={activeStep} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
