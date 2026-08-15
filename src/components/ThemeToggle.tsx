import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../lib/themeStore';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [theme, setTheme] = useTheme();
  const isDark = theme === 'dark';

  const toggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 cursor-pointer select-none shadow-2xs ${
        isDark
          ? 'bg-slate-900 border-indigo-500/40 text-amber-300 hover:border-amber-400/60 shadow-indigo-950/40'
          : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 shadow-slate-200/50'
      } ${className}`}
      title={isDark ? 'Switch to Day Light Mode ☀️' : 'Switch to Night Focus Mode 🌙'}
      aria-label="Toggle Theme"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
      >
        {isDark ? (
          <>
            <Moon className="w-4 h-4 text-amber-300 fill-amber-400/20" />
            <span className="text-[10px] text-amber-200 font-mono font-black hidden sm:inline">Night Mode</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-amber-500 fill-amber-400/30" />
            <span className="text-[10px] text-slate-700 font-mono font-black hidden sm:inline">Day Mode</span>
          </>
        )}
      </motion.div>
    </button>
  );
};
