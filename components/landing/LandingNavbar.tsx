'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Menu, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

const navLinks = [
    { label: 'Platform', href: '#platform' },
    { label: 'Models', href: '#models' },
    { label: 'Candidates', href: '#candidates' },
    { label: 'Company', href: '#company' },
];

export default function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.05)]'
                    : 'bg-transparent'
                    }`}
                style={scrolled ? { background: 'rgba(250,248,245,0.85)' } : undefined}
            >
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex items-center justify-between h-[72px]">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-900 to-gray-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Brain className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-[22px] font-bold text-gray-900 tracking-tight">HireQ</span>
                        </Link>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    className="px-4 py-2 text-[15px] font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100/60 flex items-center gap-1"
                                >
                                    {link.label}
                                    <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                                </a>
                            ))}
                        </div>

                        {/* Desktop CTA */}
                        <div className="hidden md:flex items-center gap-3">
                            <Link
                                href="/login"
                                className="px-5 py-2.5 text-[14px] font-semibold text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all hover:shadow-lg hover:shadow-gray-900/20 active:scale-[0.97]"
                            >
                                Recruiter Portal
                            </Link>
                            <Link
                                href="/candidate/login"
                                className="px-5 py-2.5 text-[14px] font-semibold text-gray-700 border rounded-full hover:border-gray-300 transition-all active:scale-[0.97]" style={{ background: '#fefcf9', borderColor: '#ede5db' }}
                            >
                                Candidate Portal
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <button
                            onClick={() => setMobileOpen(!mobileOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="fixed inset-x-0 top-[72px] z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl md:hidden"
                    >
                        <div className="px-6 py-5 space-y-1">
                            {navLinks.map((link) => (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block px-4 py-3 text-[15px] font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-4 space-y-3 border-t border-gray-100 mt-3">
                                <Link
                                    href="/login"
                                    className="block w-full text-center px-5 py-3 text-[14px] font-semibold text-white bg-gray-900 rounded-full"
                                >
                                    Recruiter Portal
                                </Link>
                                <Link
                                    href="/candidate/login"
                                    className="block w-full text-center px-5 py-3 text-[14px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-full"
                                >
                                    Candidate Portal
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
