import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Award, Sparkles, ArrowRight, BookOpen, Layers, Gauge } from 'lucide-react';
import { calculateExamReadiness, ReadinessResult } from '../lib/readinessEngine';
import { ReadinessDetailModal } from './ReadinessDetailModal';
import { Button } from './Button';
import { DynamicVectorCard } from './DynamicVectorCard';

interface ExamReadinessCardProps {
  userId?: string;
  onStartPracticeClick?: () => void;
}

export const ExamReadinessCard: React.FC<ExamReadinessCardProps> = ({
  userId,
  onStartPracticeClick
}) => {
  const [readiness, setReadiness] = useState<ReadinessResult>(() => calculateExamReadiness(userId));
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    setReadiness(calculateExamReadiness(userId));
  }, [userId]);

  useEffect(() => {
    const handleUpdate = () => setReadiness(calculateExamReadiness(userId));
    window.addEventListener('oep-streak-updated', handleUpdate);
    window.addEventListener('oep-streak-goal-completed', handleUpdate);
    window.addEventListener('oep-open-readiness-modal', () => setIsModalOpen(true));

    return () => {
      window.removeEventListener('oep-streak-updated', handleUpdate);
      window.removeEventListener('oep-streak-goal-completed', handleUpdate);
      window.removeEventListener('oep-open-readiness-modal', () => setIsModalOpen(true));
    };
  }, [userId]);

  const { score, rankTitle, rankBadgeColor, rankBadgeBg, rankBadgeBorder, rankBadgeIcon, breakdown } = readiness;

  // SVG Radial Ring calculation
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <>
      <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.15)" className="mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 sm:p-7 text-slate-900 dark:text-white rounded-[2.2rem] bg-white dark:bg-slate-900 border-none shadow-xl shadow-slate-900/10 relative group"
        >
          {/* Inner Watermark & Grid Background Wrapper */}
          <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.2rem] [clip-path:inset(0_round_2.2rem)]">
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-10" />
            <Gauge className="absolute -right-8 -bottom-8 w-52 h-52 opacity-10 dark:opacity-15 stroke-[1.2] text-[#2563eb] dark:text-indigo-300 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl" />
          </div>

          {/* Mobile View: Thin 44px 1-line bar */}
          <div
            className="sm:hidden flex items-center justify-between gap-3 text-xs cursor-pointer relative z-10"
            onClick={() => setIsModalOpen(true)}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="flex items-center gap-1 font-mono font-black text-brand-600 dark:text-brand-400 shrink-0 bg-brand-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-brand-200 dark:border-slate-700">
                <Target className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                {score}%
              </span>

              <div className="flex-1 min-w-0">
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <span className="text-[10px] font-mono text-slate-700 dark:text-slate-300 shrink-0 font-bold">
                {rankBadgeIcon} {rankTitle.split(' ')[0]}
              </span>
            </div>

            <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 hover:text-brand-700 uppercase tracking-wider shrink-0">
              Details →
            </span>
          </div>

          {/* Desktop View: Full Spacious Readiness Banner */}
          <div className="hidden sm:flex items-center justify-between gap-8 relative z-10">
            {/* Radial Ring Hero Box */}
            <div
              className="flex items-center gap-5 cursor-pointer group/title"
              onClick={() => setIsModalOpen(true)}
            >
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0 group-hover/title:scale-105 transition-transform">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r={radius}
                    className="stroke-[#2563eb]"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black font-mono text-[#2563eb] dark:text-brand-400 tracking-tight leading-none">
                    {score}%
                  </span>
                  <span className="text-[8.5px] font-black uppercase text-slate-400 dark:text-slate-400 tracking-wider mt-0.5">Ready</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-tight group-hover/title:text-brand-600 dark:group-hover/title:text-brand-400 transition-colors uppercase">
                    Exam Readiness Score
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${rankBadgeBg} ${rankBadgeColor} ${rankBadgeBorder}`}>
                    {rankBadgeIcon} {rankTitle}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Real-time exam readiness score based on your study progress.
                </p>
              </div>
            </div>

            {/* 4 Mini Component Indicators */}
            <div className="flex-1 max-w-md grid grid-cols-2 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-black">
                    <Target className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Accuracy
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-black">{breakdown.accuracy.percentage}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${breakdown.accuracy.percentage}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-indigo-700 dark:text-indigo-400 font-black">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    Subjects
                  </span>
                  <span className="font-mono text-indigo-700 dark:text-indigo-400 font-black">{readiness.topicsAttemptedCount}/10</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${breakdown.syllabus.percentage}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-amber-800 dark:text-amber-300 font-black">
                    <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Questions
                  </span>
                  <span className="font-mono text-amber-800 dark:text-amber-300 font-black">{readiness.questionsSolved} Qs</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${breakdown.volume.percentage}%` }} />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1 text-cyan-800 dark:text-cyan-300 font-black">
                    <Award className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    Mocks
                  </span>
                  <span className="font-mono text-cyan-800 dark:text-cyan-300 font-black">{readiness.mocksCompleted} Taken</span>
                </div>
                <div className="w-full h-1.5 bg-slate-200/80 dark:bg-slate-700 rounded-full overflow-hidden border border-slate-200 dark:border-slate-600">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${breakdown.mocks.percentage}%` }} />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="h-11 px-5 rounded-xl bg-gradient-to-r from-brand-600 via-blue-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-brand-500/25 shrink-0 cursor-pointer flex items-center gap-2"
            >
              <span>View Score Details</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      </DynamicVectorCard>

      {/* Readiness Detail Modal */}
      <ReadinessDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        readiness={readiness}
        onActionClick={onStartPracticeClick}
      />
    </>
  );
};
