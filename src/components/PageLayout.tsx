import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  backTo?: { path: string; label: string };
}

export default function PageLayout({ children, className, backTo }: PageLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-[#F8FAFC] dark:bg-[#060B16] text-slate-900 dark:text-white font-sans transition-colors duration-200', className)}>
      {backTo && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
          <Link
            to={backTo.path}
            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-extrabold bg-white dark:bg-[#0B1528] backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all shadow-xs border border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700/80 text-xs sm:text-sm active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> <span>{backTo.label}</span>
          </Link>
        </div>
      )}
      {children}
    </div>
  );
}
