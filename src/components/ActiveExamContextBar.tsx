import React, { useState, useEffect } from 'react';
import { Target, ChevronDown, Layers, Sparkles } from 'lucide-react';
import { useActiveExamContext } from '../lib/activeExamStore';
import { ExamContextSelectorModal } from './ExamContextSelectorModal';

interface ActiveExamContextBarProps {
  availableExamsFromDb?: any[];
  className?: string;
}

export const ActiveExamContextBar: React.FC<ActiveExamContextBarProps> = ({
  availableExamsFromDb = [],
  className = ''
}) => {
  const [context] = useActiveExamContext();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsModalOpen(true);
    window.addEventListener('oep-open-context-modal', handleOpen);
    return () => window.removeEventListener('oep-open-context-modal', handleOpen);
  }, []);

  const isAll = context.activeExamId === 'all';

  return (
    <>
      {/* Active Context Bar Container */}
      <div className={`w-full bg-gradient-to-r from-slate-50/90 via-white to-brand-50/30 sm:bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-3 sm:p-4 shadow-xs mb-6 sm:mb-8 relative z-10 transition-all ${className}`}>
        <div className="flex items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          
          {/* Left Side: Active Target Indicator */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
              isAll
                ? 'bg-brand-600 text-white border border-brand-500'
                : 'bg-emerald-600 text-white border border-emerald-500'
            }`}>
              {isAll ? <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Target className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[8.5px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Target Exam Context
                </span>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAll ? 'bg-brand-500' : 'bg-emerald-500 animate-pulse'}`} />
              </div>

              <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate leading-tight">
                {context.activeExamName}
              </h4>
            </div>
          </div>

          {/* Right Side: Switch Context Pill Trigger */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-brand-50 hover:bg-brand-100 sm:bg-slate-900 sm:hover:bg-brand-600 border border-brand-200/80 sm:border-none text-brand-700 sm:text-white text-xs font-black sm:font-extrabold transition-all duration-200 shadow-2xs active:scale-95 shrink-0 cursor-pointer"
          >
            <span className="sm:hidden">Switch ⌄</span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <span>{isAll ? 'Switch Target' : 'Change Target'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </span>
          </button>
        </div>
      </div>

      {/* Context Selector Modal / Bottom Sheet */}
      <ExamContextSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableExamsFromDb={availableExamsFromDb}
      />
    </>
  );
};
