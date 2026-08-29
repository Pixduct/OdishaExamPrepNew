import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { cn } from '../lib/utils';

export interface LanguageToggleProps {
  className?: string;
  variant?: 'default' | 'compact' | 'pill';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '',
  variant = 'default'
}) => {
  const { toggleLanguage, isOdia } = useLanguage();

  const targetTitle = isOdia ? 'Switch to English / ଇଂରାଜୀ ଭାଷା କରନ୍ତୁ' : 'Switch to Odia / ଓଡ଼ିଆ ଭାଷା କରନ୍ତୁ';

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={cn(
          "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs font-black cursor-pointer shadow-xs border select-none group shrink-0",
          !isOdia 
            ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-white hover:border-brand-300"
            : "bg-brand-50/90 dark:bg-brand-950/60 border-brand-300/80 dark:border-brand-700/60 text-[#2563EB] dark:text-brand-300 hover:bg-brand-100/80",
          className
        )}
        title={targetTitle}
        aria-label={targetTitle}
      >
        <Globe className={cn(
          "w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45",
          !isOdia ? "text-[#2563EB] dark:text-brand-400" : "text-[#2563EB] dark:text-brand-300"
        )} />
        <span className="font-extrabold text-[11px] tracking-wide flex items-center gap-1">
          {isOdia ? (
            <>
              <span className="hidden sm:inline font-bold text-slate-600 dark:text-slate-400">ଭାଷା:</span>
              <span>English</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline font-bold text-slate-600 dark:text-slate-400">Language:</span>
              <span>ଓଡ଼ିଆ</span>
            </>
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={cn(
        "relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none shadow-2xs",
        !isOdia
          ? "bg-white border-slate-200 text-slate-700 hover:border-brand-300 shadow-slate-200/50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
          : "bg-brand-50/90 border-brand-300/80 text-[#2563EB] hover:bg-brand-100/80 shadow-brand-500/10 dark:bg-brand-950/60 dark:border-brand-700/60 dark:text-brand-300",
        className
      )}
      title={targetTitle}
      aria-label={targetTitle}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
      >
        <Globe className={cn(
          "w-3.5 h-3.5 transition-transform duration-300",
          !isOdia ? "text-[#2563EB] dark:text-brand-400" : "text-[#2563EB] dark:text-brand-300"
        )} />
        <span className="text-[10px] font-mono font-black tracking-wide flex items-center gap-1">
          {isOdia ? (
            <>
              <span className="hidden sm:inline font-bold text-slate-600 dark:text-slate-400">ଭାଷା:</span>
              <span>English</span>
            </>
          ) : (
            <>
              <span className="hidden sm:inline font-bold text-slate-600 dark:text-slate-400">Language:</span>
              <span>ଓଡ଼ିଆ</span>
            </>
          )}
        </span>
      </motion.div>
    </button>
  );
};


