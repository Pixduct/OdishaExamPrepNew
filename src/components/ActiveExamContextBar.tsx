import React, { useState, useEffect } from 'react';
import { Target, ChevronDown, Layers, Sparkles } from 'lucide-react';
import { useActiveExamContext } from '../lib/activeExamStore';
import { ExamContextSelectorModal } from './ExamContextSelectorModal';
import { DynamicVectorCard } from './DynamicVectorCard';

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
      <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.15)" className={`w-full mb-6 sm:mb-8 ${className}`}>
        <div className="w-full bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 text-white border border-blue-500/30 rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-5 shadow-xl relative overflow-hidden group">
          {/* Radial Grid & 3D Watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none z-0" />
          <Target className="absolute -right-6 -bottom-6 w-44 h-44 opacity-15 stroke-[1.2] text-blue-300 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />

          <div className="flex items-center justify-between gap-3 min-w-0 relative z-10">
            
            {/* Left Side: Active Target Indicator */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isAll
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
              }`}>
                {isAll ? <Layers className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-300" /> : <Target className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-emerald-300" />}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-amber-200/90">
                    Target Exam Context
                  </span>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isAll ? 'bg-blue-400' : 'bg-emerald-400 animate-pulse'}`} />
                </div>

                <h4 className="text-xs sm:text-base font-black text-white truncate leading-tight mt-0.5 uppercase tracking-tight">
                  {context.activeExamName}
                </h4>
              </div>
            </div>

            {/* Right Side: Switch Context Pill Trigger */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1 sm:gap-2 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500 via-blue-600 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider transition-all duration-200 shadow-lg shadow-brand-500/20 active:scale-95 shrink-0 cursor-pointer border-none"
            >
              <span className="sm:hidden">Switch ⌄</span>
              <span className="hidden sm:inline-flex items-center gap-2">
                <span>{isAll ? 'Switch Target' : 'Change Target'}</span>
                <ChevronDown className="w-4 h-4 text-white/90" />
              </span>
            </button>
          </div>
        </div>
      </DynamicVectorCard>

      {/* Context Selector Modal / Bottom Sheet */}
      <ExamContextSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableExamsFromDb={availableExamsFromDb}
      />
    </>
  );
};
