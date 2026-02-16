'use client';

import Link from 'next/link';
import { Briefcase, FileText, MessageSquare, Shield } from 'lucide-react';

export default function CandidateFooter() {
  return (
    <footer className="bg-candidate-900 dark:bg-gray-950 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-candidate-500 rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">H</span>
              </div>
              <div>
                <span className="text-xl font-bold">HireQ</span>
                <span className="text-xs text-candidate-300 block -mt-1">Career Portal</span>
              </div>
            </div>
            <p className="text-candidate-200 text-sm max-w-md">
              Track your job applications, view your match scores, and stay connected with recruiters. 
              Your career journey starts here.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-candidate-300">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/candidate/jobs" className="text-candidate-200 hover:text-white transition-colors flex items-center space-x-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Browse Jobs</span>
                </Link>
              </li>
              <li>
                <Link href="/candidate/applications" className="text-candidate-200 hover:text-white transition-colors flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>My Applications</span>
                </Link>
              </li>
              <li>
                <Link href="/candidate/messages" className="text-candidate-200 hover:text-white transition-colors flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Messages</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 text-candidate-300">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="text-candidate-200 hover:text-white transition-colors flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="#" className="text-candidate-200 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-candidate-200 hover:text-white transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-candidate-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-candidate-300 text-sm">
              &copy; {new Date().getFullYear()} HireQ. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link href="/login" className="text-sm text-candidate-300 hover:text-white transition-colors">
                Are you a recruiter? HR Portal &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
