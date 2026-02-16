import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  animate?: boolean;
}

export default function Card({ children, className = '', hover = false, animate = true }: CardProps) {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-6 transition-colors';
  const hoverClasses = hover ? 'hover:shadow-xl dark:hover:shadow-gray-900/70 transition-shadow duration-300' : '';
  
  const content = (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {content}
      </motion.div>
    );
  }

  return content;
}

