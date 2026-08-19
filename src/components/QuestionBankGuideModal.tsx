import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  X, 
  Compass, 
  Star, 
  Layers, 
  Sparkles, 
  Download, 
  ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface QuestionBankGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const QuestionBankGuideModal: React.FC<QuestionBankGuideModalProps> = ({
  isOpen,
  onClose,
  title = "Question Bank"
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleDismiss = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem('oep_seen_qb_user_guide', 'true');
      } catch (e) {}
    }
    onClose();
  };

  const guideItems = [
    {
      icon: Compass,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      badge: "Auto-Save",
      title: "Resume Where You Left Off",
      description: "Your practice progress is saved automatically. When you return, click the 'Resume Q. X' banner to jump straight to your last question without scrolling."
    },
    {
      icon: Star,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      badge: "Quick Revision",
      title: "Bookmark Tricky Questions",
      description: "Tap the Star icon on any question to bookmark it for later. Click the 'Saved' filter chip in the toolbar to revise only your starred questions."
    },
    {
      icon: Layers,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
      badge: "High Capacity",
      title: "Smart Sets & Quick Jump",
      description: "Large question banks are organized into 50-question sets for lightning-fast loading. Use 'Jump to Q:' to jump directly to any question number instantly."
    },
    {
      icon: Sparkles,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      badge: "KaTeX Math",
      title: "Instant Feedback & Solutions",
      description: "Tap options to test yourself with instant green/red visual validation. Expand 'View Solution' to read detailed step-by-step mathematical explanations."
    },
    {
      icon: Download,
      color: "text-brand-600 dark:text-brand-400",
      bg: "bg-brand-500/10 border-brand-500/20",
      badge: "Export & Study",
      title: "Fullscreen & PDF Booklet",
      description: "Use Fullscreen mode for a distraction-free mock test feel, or click 'Download PDF' to save a clean, printable question bank with answer keys."
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 sm:p-7 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 pr-8 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black uppercase tracking-wider rounded-md bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800 px-1.5 py-0.5 text-[9px]">
                  Feature Guide
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                Mastering Question Bank
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                Key tools to maximize your practice and study efficiency:
              </p>
            </div>
          </div>

          {/* Feature List (Scrollable on small screens) */}
          <div className="flex-1 overflow-y-auto py-4 space-y-2.5 custom-scrollbar pr-1">
            {guideItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={idx}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-start gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <div className={cn(
                    "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5",
                    item.bg,
                    item.color
                  )}>
                    <IconComponent className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={dontShowAgain} 
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                  className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" 
                />
                <span>Don't show this guide automatically</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white text-xs sm:text-sm font-black tracking-wide shadow-md shadow-brand-500/25 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Got it, Let's Practice!</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuestionBankGuideModal;
