'use client';

import { usePathname } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ChatBot from '@/components/features/ChatBot';

export default function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Hide HR navbar and footer on login page, candidate portal, and admin panel
  // These have their own layouts
  const isLoginPage = pathname === '/login';
  const isCandidatePortal = pathname?.startsWith('/candidate');
  const isAdminPanel = pathname?.startsWith('/admin');
  
  const showHRLayout = !isLoginPage && !isCandidatePortal && !isAdminPanel;

  return (
    <div className="flex flex-col min-h-screen">
      {showHRLayout && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {showHRLayout && <Footer />}
      {showHRLayout && <ChatBot />}
    </div>
  );
}

