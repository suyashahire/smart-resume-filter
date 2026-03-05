'use client';

import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/sections/HeroSection';
import AIIntroSection from '@/sections/AIIntroSection';
import InfrastructureSection from '@/sections/InfrastructureSection';
import ScrollStackSection from '@/sections/ScrollStackSection';
import ModelShowcaseSection from '@/sections/ModelShowcaseSection';
import CandidateSection from '@/sections/CandidateSection';
import TestimonialsSection from '@/sections/TestimonialsSection';
import CTASection from '@/sections/CTASection';
import FooterSection from '@/sections/FooterSection';

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #faf8f5 0%, #f8f5f0 30%, #faf8f5 60%, #f8f5f0 100%)' }}>
      <LandingNavbar />
      <HeroSection />
      <AIIntroSection />
      <InfrastructureSection />
      <ScrollStackSection />
      <ModelShowcaseSection />
      <CandidateSection />
      <TestimonialsSection />
      <CTASection />
      <FooterSection />
    </div>
  );
}
