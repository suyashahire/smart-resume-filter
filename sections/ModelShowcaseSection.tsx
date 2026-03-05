'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import SectionContainer from '@/components/landing/SectionContainer';

const models = [
    {
        id: 'sentence-bert',
        label: 'Sentence-BERT',
        title: 'Sentence-BERT',
        description: 'Semantic understanding of resume text and job descriptions. Maps both to a shared embedding space for intelligent matching.',
        bullets: ['Semantic resume matching', 'Candidate similarity search', 'Job-candidate ranking'],
        gradient: 'from-blue-500 to-indigo-500',
        bg: 'from-blue-50 to-indigo-50',
    },
    {
        id: 'spacy',
        label: 'spaCy NLP',
        title: 'spaCy NLP Engine',
        description: 'Advanced natural language processing for entity extraction, skill detection, and resume structure analysis.',
        bullets: ['Named entity recognition', 'Skill extraction pipeline', 'Resume section parsing'],
        gradient: 'from-emerald-500 to-teal-500',
        bg: 'from-emerald-50 to-teal-50',
    },
    {
        id: 'whisper',
        label: 'Whisper',
        title: 'OpenAI Whisper',
        description: 'State-of-the-art speech recognition for transcribing interview recordings with high accuracy across accents.',
        bullets: ['Interview transcription', 'Multi-accent support', 'Audio analysis pipeline'],
        gradient: 'from-orange-500 to-amber-500',
        bg: 'from-orange-50 to-amber-50',
    },
    {
        id: 'distilbert',
        label: 'DistilBERT',
        title: 'DistilBERT Sentiment',
        description: 'Fine-tuned sentiment analysis model that evaluates candidate responses for confidence and positivity signals.',
        bullets: ['Response sentiment scoring', 'Confidence detection', 'Interview insight extraction'],
        gradient: 'from-purple-500 to-violet-500',
        bg: 'from-purple-50 to-violet-50',
    },
    {
        id: 'minilm',
        label: 'MiniLM',
        title: 'all-MiniLM-L6-v2',
        description: 'Lightweight but powerful sentence transformer optimized for production-speed semantic similarity at scale.',
        bullets: ['Fast embedding generation', 'Production-optimized inference', 'Scalable candidate ranking'],
        gradient: 'from-pink-500 to-rose-500',
        bg: 'from-pink-50 to-rose-50',
    },
];

export default function ModelShowcaseSection() {
    const [activeTab, setActiveTab] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const activeModel = models[activeTab];

    return (
        <div id="models" style={{ background: '#faf8f5', position: 'relative', zIndex: 1 }}>
            <SectionContainer>
                <div ref={ref}>
                    {/* Heading */}
                    <motion.h2
                        initial={{ opacity: 0, y: 30 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.6 }}
                        className="text-[36px] md:text-[48px] font-bold text-center text-gray-900 tracking-tight mb-12 leading-tight"
                    >
                        See it in action
                    </motion.h2>

                    {/* Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.15 }}
                        className="flex flex-wrap items-center justify-center gap-2.5 mb-10"
                    >
                        {models.map((model, i) => (
                            <button
                                key={model.id}
                                onClick={() => setActiveTab(i)}
                                className={`px-5 py-2.5 rounded-full text-[14px] font-semibold transition-all duration-300 border ${activeTab === i
                                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-transparent shadow-lg shadow-purple-500/20 scale-105'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                                    }`}
                            >
                                {model.label}
                            </button>
                        ))}
                    </motion.div>

                    {/* Content Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={isInView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="max-w-3xl mx-auto"
                    >
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeModel.id}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.3 }}
                                className={`bg-gradient-to-br ${activeModel.bg} rounded-[28px] border border-gray-100 p-8 md:p-10`}
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-[22px] md:text-[26px] font-bold text-gray-900">{activeModel.title}</h3>
                                    <span className="flex items-center gap-2 text-[13px] font-semibold text-emerald-600">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        LIVE
                                    </span>
                                </div>
                                <p className="text-[15px] text-gray-500 leading-relaxed mb-6">{activeModel.description}</p>
                                <div>
                                    <p className="text-[13px] font-semibold text-gray-400 uppercase tracking-wider mb-3">For you</p>
                                    <div className="space-y-2.5">
                                        {activeModel.bullets.map((bullet) => (
                                            <div key={bullet} className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${activeModel.gradient}`} />
                                                <span className="text-[15px] text-gray-700 font-medium">{bullet}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </motion.div>
                </div>
            </SectionContainer>
        </div>
    );
}
