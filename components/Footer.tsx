import { Github, Linkedin, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-gray-300 dark:text-gray-400 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Project Info */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Smart Resume Filter & AI HR Assistant</h3>
            <p className="text-sm text-gray-400">
              Project Group 40 – B.E. Computer Engineering (2025–26)<br />
              Sinhgad Academy of Engineering, Pune
            </p>
          </div>

          {/* Team Members */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Team Members</h3>
            <ul className="text-sm space-y-2 text-gray-400">
              <li>COBA63 – Adinath Sayaji Deshmukh</li>
              <li>COBA64 – Suyash Shamrao Ahire</li>
              <li>COBA68 – Raviraj Pandurang Malule</li>
              <li>COBC10 – Prajwal Nanaso Arjun</li>
            </ul>
          </div>

          {/* Guide & Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Project Guide</h3>
            <p className="text-sm text-gray-400 mb-4">Prof. Mrs. T. S. Hashmi</p>
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
          <p>&copy; {new Date().getFullYear()} Group 40. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

