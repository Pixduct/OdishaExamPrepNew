import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Award, Sparkles, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { calculateExamReadiness, ReadinessResult } from '../lib/readinessEngine';
import { ReadinessDetailModal } from './ReadinessDetailModal';
import { Button } from './Button';


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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 text-white rounded-2xl sm:rounded-[2.2rem] p-4 sm:p-7 shadow-xl shadow-slate-950/20 relative overflow-hidden group mb-6 sm:mb-10"
      >
        {/* Subtle Background Glow Accent */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mobile View: Thin 44px 1-line bar */}
        <div
          className="sm:hidden flex items-center justify-between gap-3 text-xs cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="flex items-center gap-1 font-mono font-black text-brand-400 shrink-0 bg-brand-500/10 px-2 py-0.5 rounded-lg border border-brand-500/20">
              <Target className="w-3.5 h-3.5 text-brand-400" />
              {score}%
            </span>

            <div className="flex-1 min-w-0">
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>

            <span className="text-[10px] font-mono text-slate-300 shrink-0">
              {rankBadgeIcon} {rankTitle.split(' ')[0]}
            </span>
          </div>

          <span className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase tracking-wider shrink-0">
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
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r={radius}
                  className="stroke-brand-500"
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
                <span className="text-2xl font-black font-mono text-white tracking-tight leading-none">
                  {score}%
                </span>
                <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Ready</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-white tracking-tight leading-tight group-hover/title:text-brand-400 transition-colors">
                  Exam Readiness Score
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border ${rankBadgeBg} ${rankBadgeColor} ${rankBadgeBorder}`}>
                  {rankBadgeIcon} {rankTitle}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-medium">
                Real-time exam readiness score based on your study progress.
              </p>
            </div>
          </div>

          {/* 4 Mini Component Indicators */}
          <div className="flex-1 max-w-md grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Target className="w-3 h-3" />
                  Accuracy
                </span>
                <span className="font-mono text-emerald-400 font-black">{breakdown.accuracy.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${breakdown.accuracy.percentage}%` }} />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-indigo-400">
                  <BookOpen className="w-3 h-3" />
                  Subjects
                </span>
                <span className="font-mono text-indigo-400 font-black">{readiness.topicsAttemptedCount}/10</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${breakdown.syllabus.percentage}%` }} />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-amber-400">
                  <Layers className="w-3 h-3" />
                  Questions
                </span>
                <span className="font-mono text-amber-400 font-black">{readiness.questionsSolved} Qs</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${breakdown.volume.percentage}%` }} />
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-750 space-y-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                <span className="flex items-center gap-1 text-cyan-400">
                  <Award className="w-3 h-3" />
                  Mocks
                </span>
                <span className="font-mono text-cyan-400 font-black">{readiness.mocksCompleted} Taken</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${breakdown.mocks.percentage}%` }} />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 px-5 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-black text-xs shadow-lg shadow-brand-500/25 shrink-0 cursor-pointer flex items-center gap-2"
          >
            <span>View Score Details</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

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
