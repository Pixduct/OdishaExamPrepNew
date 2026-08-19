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
  const { language, toggleLanguage, isOdia } = useLanguage();

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={cn(
          "flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all text-xs font-black cursor-pointer shadow-xs border select-none group shrink-0",
          isOdia 
            ? "bg-brand-50/90 dark:bg-brand-950/60 border-brand-300/80 dark:border-brand-700/60 text-[#2563EB] dark:text-brand-300 hover:bg-brand-100/80" 
            : "bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-white",
          className
        )}
        title={isOdia ? "Switch to English / ଇଂରାଜୀ ଭାଷା କରନ୍ତୁ" : "Switch to Odia / ଓଡ଼ିଆ ଭାଷା କରନ୍ତୁ"}
        aria-label="Toggle Language"
      >
        <Globe className={cn(
          "w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-45",
          isOdia ? "text-[#2563EB] dark:text-brand-400" : "text-slate-500 dark:text-slate-400 group-hover:text-[#2563EB]"
        )} />
        <span className="font-extrabold text-[11px] tracking-wide">
          {isOdia ? 'ଓଡ଼ିଆ' : 'English'}
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
        isOdia
          ? "bg-brand-50/90 dark:bg-slate-900 border-brand-300/80 dark:border-brand-600/50 text-[#2563EB] dark:text-brand-300 hover:border-brand-400/80 shadow-brand-500/10"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-300 dark:hover:border-slate-600 shadow-slate-200/50",
        className
      )}
      title={isOdia ? "Switch to English (Click)" : "ଓଡ଼ିଆ ଭାଷା କରନ୍ତୁ (Click)"}
      aria-label="Toggle Language"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
      >
        <Globe className={cn(
          "w-3.5 h-3.5 transition-transform duration-300",
          isOdia ? "text-[#2563EB] dark:text-brand-400" : "text-slate-500 dark:text-slate-400"
        )} />
        <span className="text-[11px] font-black tracking-wide">
          {isOdia ? 'ଓଡ଼ିଆ' : 'English'}
        </span>
      </motion.div>
    </button>
  );
};
