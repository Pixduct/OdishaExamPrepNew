import React from 'react';
import { BookOpen } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export const LoadingPortal = () => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF8F5] dark:bg-[#060B16] text-slate-900 dark:text-white transition-colors duration-300 relative overflow-hidden">
      {/* Ambient background grid and glowing orb */}
      <div className="absolute inset-0 grid-bg opacity-30 dark:opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col items-center space-y-4 sm:space-y-5 z-10">
        {/* Concentric Portal Spinner */}
        <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          {/* Outer Slow Orbit */}
          <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/30 dark:border-blue-400/30 animate-[spin_15s_linear_infinite]" />
          
          {/* Middle Counter-Orbit */}
          <div className="absolute inset-1.5 rounded-full border border-blue-500/10 dark:border-blue-400/20 border-t-blue-500/50 dark:border-t-blue-400/70 animate-[spin_3s_linear_infinite_reverse]" />
          
          {/* Inner Glowing Core */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white dark:bg-[#0B1528] border border-blue-500/20 dark:border-slate-800 flex items-center justify-center shadow-md shadow-blue-500/10 dark:shadow-blue-500/20">
            <BookOpen className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#2563EB] dark:text-blue-400 animate-pulse" />
          </div>
        </div>

        {/* Typography Details */}
        <div className="text-center space-y-1">
          <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            Odisha<span className="text-[#2563EB] dark:text-blue-400">Exam</span>Prep
          </h1>
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 dark:text-slate-500">
            {t('common.loadingPortal', 'Loading Portal...')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingPortal;
