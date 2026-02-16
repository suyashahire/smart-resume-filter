'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/store/useStore';
import CandidateNavbar from '@/components/candidate/CandidateNavbar';
import CandidateFooter from '@/components/candidate/CandidateFooter';
import CandidateChatBot from '@/components/candidate/CandidateChatBot';

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isHydrated } = useStore();
  const [isChecking, setIsChecking] = useState(true);

  // Login page doesn't require auth
  const isLoginPage = pathname === '/candidate/login';

  useEffect(() => {
    // Wait for store to hydrate
    if (!isHydrated) return;

    // Login page is always accessible
    if (isLoginPage) {
      // If already authenticated as candidate, redirect to dashboard
      if (isAuthenticated && user?.role === 'candidate') {
        router.push('/candidate');
        return;
      }
      setIsChecking(false);
      return;
    }

    // For other pages, require authentication
    if (!isAuthenticated) {
      router.push('/candidate/login');
      return;
    }

    // Verify user is a candidate
    if (user?.role !== 'candidate') {
      // Redirect HR/Admin to their portal
      router.push('/dashboard');
      return;
    }

    setIsChecking(false);
  }, [isAuthenticated, user, router, pathname, isHydrated, isLoginPage]);

  // Show loading while checking auth
  if (!isHydrated || (isChecking && !isLoginPage)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-candidate-50 to-cyan-50 dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-candidate-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render login page without navbar/footer
  if (isLoginPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-candidate-50 to-cyan-50 dark:from-gray-950 dark:to-gray-900">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-candidate-50 to-cyan-50 dark:from-gray-950 dark:to-gray-900">
      <CandidateNavbar />
      <main className="min-h-[calc(100vh-200px)]">
        {children}
      </main>
      <CandidateFooter />
      <CandidateChatBot />
    </div>
  );
}
