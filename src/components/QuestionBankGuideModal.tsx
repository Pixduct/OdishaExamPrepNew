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
  ArrowRight,
  Zap
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
      title: "Resume Progress",
      description: "Progress saves automatically. Tap 'Resume Q. X' to jump back directly without scrolling."
    },
    {
      icon: Star,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      badge: "Revision",
      title: "Bookmark Questions",
      description: "Tap the Star icon on tricky questions to quickly revise them under the 'Saved' filter."
    },
    {
      icon: Layers,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-500/10 border-indigo-500/20",
      badge: "50-Q Sets",
      title: "Smart Sets & Jump",
      description: "Organized into rapid 50-Q sets with a 'Jump to Q' tool for lightning-fast navigation."
    },
    {
      icon: Sparkles,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      badge: "KaTeX Math",
      title: "Instant Solutions",
      description: "Test yourself with live visual feedback and step-by-step mathematical explanations."
    },
    {
      icon: Download,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      badge: "Printable",
      title: "Fullscreen & PDF",
      description: "Study in distraction-free fullscreen or export clean offline PDF booklets with answer keys."
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
          className="bg-white dark:bg-[#0B1528] rounded-3xl sm:rounded-[2rem] p-4 sm:p-6 max-w-lg w-full max-h-[88dvh] flex flex-col shadow-2xl border border-slate-200/90 dark:border-slate-800 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer z-10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-start gap-3 pr-8 pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800 text-[8.5px] font-black uppercase tracking-wider">
                <Zap className="w-2.5 h-2.5 fill-current" /> Feature Guide
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                Mastering Question Bank
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
                Key tools to maximize your practice and study efficiency:
              </p>
            </div>
          </div>

          {/* Feature List (Scrollable on small screens) */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 no-scrollbar pr-0.5">
            {guideItems.map((item, idx) => {
              const IconComponent = item.icon;
              return (
                <div 
                  key={idx}
                  className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-slate-50/80 dark:bg-[#060B16] border border-slate-200/70 dark:border-slate-800 flex items-start gap-2.5 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-900/60"
                >
                  <div className={cn(
                    "w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg sm:rounded-xl border flex items-center justify-center shrink-0 mt-0.5",
                    item.bg,
                    item.color
                  )}>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                        {item.title}
                      </h4>
                      <span className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0 whitespace-nowrap border border-slate-300/40 dark:border-slate-700/60">
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5 font-medium">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2.5">
            <label className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none font-medium">
              <input 
                type="checkbox" 
                checked={dontShowAgain} 
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4 cursor-pointer accent-blue-600" 
              />
              <span>Don't show this guide automatically</span>
            </label>

            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2.5 sm:py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-black tracking-wide shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
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
