'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Menu, X, ChevronDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DropdownItem {
    label: string;
    href: string;
    desc?: string;
}

interface NavItem {
    label: string;
    items: DropdownItem[];
}

const navItems: NavItem[] = [
    {
        label: 'PLATFORM',
        items: [
            { label: 'Recruiter Portal', href: '/login', desc: 'AI-powered hiring for HR teams' },
            { label: 'Candidate Portal', href: '/candidate/login', desc: 'Find and apply to jobs effortlessly' },
        ],
    },
    {
        label: 'DEVELOPERS',
        items: [
            { label: 'API Documentation', href: '#models', desc: 'Integrate HireQ into your workflow' },
            { label: 'SDKs', href: '#models', desc: 'Client libraries for every language' },
            { label: 'AI Architecture', href: '#platform', desc: 'Models and pipeline overview' },
            { label: 'Integrations', href: '#platform', desc: 'Connect with your existing tools' },
        ],
    },
    {
        label: 'BLOGS',
        items: [
            { label: 'Engineering', href: '#', desc: 'Behind the AI that powers HireQ' },
            { label: 'AI in Hiring', href: '#', desc: 'Industry trends and insights' },
            { label: 'Product Updates', href: '#', desc: 'New features and improvements' },
            { label: 'Tutorials', href: '#', desc: 'Guides to get the most from HireQ' },
        ],
    },
    {
        label: 'COMPANY',
        items: [
            { label: 'About HireQ', href: '#company', desc: 'Our mission and team' },
            { label: 'Careers', href: '#', desc: 'Join us in building the future' },
        ],
    },
];

function DropdownMenu({ items, onClose }: { items: DropdownItem[]; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50"
        >
            <div
                className="rounded-2xl border shadow-xl overflow-hidden min-w-[260px]"
                style={{ background: '#fefcf9', borderColor: '#ede5db' }}
            >
                <div className="py-2 px-1.5">
                    {items.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={onClose}
                            className="flex flex-col gap-0.5 px-4 py-3 rounded-xl hover:bg-[#f5f0eb] transition-colors group"
                        >
                            <span className="text-[14px] font-semibold text-gray-900 group-hover:text-gray-700">{item.label}</span>
                            {item.desc && (
                                <span className="text-[12px] text-gray-400 leading-snug">{item.desc}</span>
                            )}
                        </Link>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

export default function LandingNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleEnter = (label: string) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setOpenDropdown(label);
    };

    const handleLeave = () => {
        timeoutRef.current = setTimeout(() => setOpenDropdown(null), 150);
    };

    return (
        <>
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'backdrop-blur-xl shadow-[0_1px_0_rgba(0,0,0,0.05)]'
                        : 'bg-transparent'
                }`}
                style={scrolled ? { background: 'rgba(250,248,245,0.9)' } : undefined}
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

                        {/* Desktop Nav Items */}
                        <div className="hidden md:flex items-center gap-0.5">
                            {navItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="relative"
                                    onMouseEnter={() => handleEnter(item.label)}
                                    onMouseLeave={handleLeave}
                                >
                                    <button
                                        className={`flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold tracking-[0.04em] transition-colors rounded-lg ${
                                            openDropdown === item.label
                                                ? 'text-gray-900 bg-gray-100/60'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/40'
                                        }`}
                                    >
                                        {item.label}
                                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
                                    </button>

                                    <AnimatePresence>
                                        {openDropdown === item.label && (
                                            <DropdownMenu items={item.items} onClose={() => setOpenDropdown(null)} />
                                        )}
                                    </AnimatePresence>
                                </div>
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
                                className="px-5 py-2.5 text-[14px] font-semibold text-gray-700 border rounded-full hover:border-gray-300 transition-all active:scale-[0.97]"
                                style={{ background: '#fefcf9', borderColor: '#ede5db' }}
                            >
                                Candidate Portal
                            </Link>
                        </div>

                        {/* Mobile burger */}
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
                        className="fixed inset-x-0 top-[72px] z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-xl md:hidden max-h-[calc(100vh-72px)] overflow-y-auto"
                    >
                        <div className="px-6 py-5 space-y-1">
                            {navItems.map((item) => (
                                <div key={item.label}>
                                    <button
                                        onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                                        className="flex items-center justify-between w-full px-4 py-3 text-[14px] font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors tracking-wide"
                                    >
                                        {item.label}
                                        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${mobileExpanded === item.label ? 'rotate-180' : ''}`} />
                                    </button>
                                    <AnimatePresence>
                                        {mobileExpanded === item.label && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="pl-6 pb-2 space-y-0.5">
                                                    {item.items.map((sub) => (
                                                        <Link
                                                            key={sub.label}
                                                            href={sub.href}
                                                            onClick={() => setMobileOpen(false)}
                                                            className="block px-4 py-2.5 text-[14px] text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            {sub.label}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                            <div className="pt-4 space-y-3 border-t border-gray-100 mt-3">
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block w-full text-center px-5 py-3 text-[14px] font-semibold text-white bg-gray-900 rounded-full"
                                >
                                    Recruiter Portal
                                </Link>
                                <Link
                                    href="/candidate/login"
                                    onClick={() => setMobileOpen(false)}
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
