import React, { useState } from 'react';
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

  const isAll = context.activeExamId === 'all';

  return (
    <>
      {/* Active Context Bar Container */}
      <div className={`w-full bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-2.5 sm:p-3.5 shadow-xs mb-6 sticky top-16 z-30 transition-all ${className}`}>
        <div className="flex items-center justify-between gap-3 min-w-0">
          
          {/* Left Side: Active Target Indicator */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isAll
                ? 'bg-brand-50 border border-brand-200 text-brand-600'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
            }`}>
              {isAll ? <Layers className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Target className="w-4 h-4 sm:w-4.5 sm:h-4.5" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Target Exam Context
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${isAll ? 'bg-brand-500' : 'bg-emerald-500 animate-pulse'}`} />
              </div>

              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate leading-snug">
                {context.activeExamName}
              </h4>
            </div>
          </div>

          {/* Right Side: Switch Context Pill Trigger */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-slate-900 hover:bg-brand-600 text-white text-xs font-extrabold transition-all duration-200 shadow-sm active:scale-95 shrink-0"
          >
            <span>{isAll ? 'Switch Target' : 'Change Target'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-white/80" />
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
