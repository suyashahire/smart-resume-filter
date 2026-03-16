'use client';

import { Brain } from 'lucide-react';
import Link from 'next/link';

const footerLinks: Record<string, { label: string; href: string; external?: boolean }[]> = {
    PRODUCTS: [
        { label: 'Recruiter Portal', href: '/login' },
        { label: 'Candidate Portal', href: '/candidate/login' },
    ],
    API: [
        { label: 'Sentence-BERT', href: '#models' },
        { label: 'spaCy NLP', href: '#models' },
        { label: 'Whisper', href: '#models' },
        { label: 'DistilBERT', href: '#models' },
    ],
    COMPANY: [
        { label: 'About us', href: '#company' },
        { label: 'Blogs', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Terms of service', href: '#' },
        { label: 'Privacy policy', href: '#' },
    ],
    SOCIALS: [
        { label: 'LinkedIn', href: '#', external: true },
        { label: 'X', href: '#', external: true },
        { label: 'YouTube', href: '#', external: true },
    ],
};

export default function FooterSection() {
    return (
        <footer className="relative border-t border-gray-100/50" style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #f5ede4 40%, #f0e6da 100%)' }}>
            {/* Decorative blobs */}
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[300px] bg-gradient-to-r from-orange-200/15 to-blue-200/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-[300px] h-[200px] bg-gradient-to-r from-purple-200/10 to-pink-200/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-14 lg:py-18">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-10 lg:gap-12">
                    {/* Logo + Tagline */}
                    <div className="col-span-2">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center">
                                <Brain className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-[20px] font-bold text-gray-900 tracking-tight">HireQ</span>
                        </Link>
                        <p className="text-[14px] text-gray-400 leading-relaxed">AI for modern hiring</p>
                    </div>

                    {/* Link columns */}
                    {Object.entries(footerLinks).map(([section, links]) => (
                        <div key={section}>
                            <h4 className="text-[11px] font-semibold tracking-[0.14em] uppercase text-gray-400 mb-4">
                                {section}
                            </h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-[14px] text-gray-500 hover:text-gray-900 transition-colors"
                                            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div className="flex flex-col md:flex-row items-center justify-between mt-14 pt-7 border-t border-gray-200/60 gap-4">
                    <p className="text-[13px] text-gray-400">Copyright HireQ {new Date().getFullYear()}</p>
                    <p className="text-[13px] text-gray-400">All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
