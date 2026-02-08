import { Github, Linkedin, Mail, Brain } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  const navItems = [
    { name: 'Upload Resume', path: '/upload-resume' },
    { name: 'Job Description', path: '/job-description' },
    { name: 'Results', path: '/results' },
    { name: 'Interview Analyzer', path: '/interview-analyzer' },
    { name: 'Dashboard', path: '/dashboard' },
  ];

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 dark:text-gray-400 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-6 w-6 text-primary-400" />
              <h3 className="text-white text-lg font-semibold">HireQ</h3>
            </div>
            <p className="text-sm text-gray-400">
              AI-powered recruitment platform for intelligent<br />
              candidate screening and interview evaluation.
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Features</h3>
            <ul className="text-sm space-y-2 text-gray-400">
              <li>Resume Parsing with NLP</li>
              <li>AI-powered Job Matching</li>
              <li>Interview Transcription & Analysis</li>
              <li>Comprehensive Candidate Reports</li>
            </ul>
          </div>

          {/* Go To */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Go To</h3>
            <ul className="text-sm space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} HireQ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

