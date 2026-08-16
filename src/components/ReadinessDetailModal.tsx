import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Award, Sparkles, TrendingUp, BookOpen, Layers, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { ReadinessResult } from '../lib/readinessEngine';
import { Button } from './Button';

interface ReadinessDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  readiness: ReadinessResult;
  onActionClick?: () => void;
}

export const ReadinessDetailModal: React.FC<ReadinessDetailModalProps> = ({
  isOpen,
  onClose,
  readiness,
  onActionClick
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const { 
    score, 
    rankTitle, 
    rankBadgeColor, 
    rankBadgeBg, 
    rankBadgeBorder, 
    rankBadgeIcon, 
    breakdown, 
    recommendedDailyQs,
    totalCorrectAnswers,
    totalAttemptedQuestions,
    topicsAttemptedCount
  } = readiness;

  // SVG Radial Ring Calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Executive 3D Vector Modal Panel / Mobile Bottom Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative w-full sm:max-w-lg bg-slate-900 border border-blue-500/30 text-white rounded-t-[2.5rem] sm:rounded-[2.5rem] p-5 sm:p-7 shadow-2xl shadow-slate-950/60 overflow-hidden z-10 space-y-4 sm:space-y-5 max-h-[90vh] sm:max-h-none overflow-y-auto overscroll-contain no-scrollbar group"
          data-lenis-prevent
        >
          {/* Radial Grid & 3D Background Watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none z-0" />
          <Target className="absolute -right-10 -bottom-10 w-72 h-72 opacity-10 stroke-[1.2] text-blue-300 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />

          {/* Mobile Drag Handle */}
          <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto sm:hidden -mt-1 mb-1 shrink-0 relative z-10" />

          {/* Background Glows */}
          <div className="absolute -right-24 -top-24 w-60 h-60 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-24 -bottom-24 w-60 h-60 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shadow-md">
                <Target className="w-5.5 h-5.5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-tight uppercase">
                  Your Exam Readiness Score
                </h3>
                <p className="text-amber-200/90 text-xs font-mono font-bold">How ready are you for the exam today?</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Radial Ring Hero Box */}
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden z-10">
            {/* Radial SVG Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="10"
                  fill="transparent"
                />
                <motion.circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-brand-400"
                  strokeWidth="10"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-3xl font-black font-mono text-white tracking-tight leading-none">
                  {score}%
                </span>
                <span className="text-[9px] font-black uppercase text-brand-300 tracking-wider mt-1">Ready</span>
              </div>
            </div>

            {/* Rank Description */}
            <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-black uppercase tracking-wider border ${rankBadgeBg} ${rankBadgeColor} ${rankBadgeBorder}`}>
                <span>{rankBadgeIcon}</span>
                <span>{rankTitle}</span>
              </span>

              <p className="text-xs text-slate-200 font-medium leading-relaxed">
                You are <strong className="text-amber-300 font-mono font-black">{score}% ready</strong> for the exam! Keep solving daily practice sets to reach 100%.
              </p>
            </div>
          </div>

          {/* Real Data Live Audit Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 font-medium flex items-center gap-2.5 relative z-10">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong className="text-white font-black">Based on your real study activity:</strong> You have answered <strong className="text-amber-300 font-mono font-black">{totalAttemptedQuestions} questions</strong> ({totalCorrectAnswers} correct) across <strong className="text-blue-300 font-mono font-black">{topicsAttemptedCount} subjects</strong>.
            </span>
          </div>

          {/* 4 Simple Progress Component Cards */}
          <div className="space-y-3 pt-1 relative z-10">
            <h4 className="text-xs font-mono font-black uppercase tracking-wider text-amber-200/90">
              4 Steps to Full Exam Readiness
            </h4>

            <div className="space-y-2.5">
              {/* Accuracy Bar */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white font-black flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    {breakdown.accuracy.label}
                  </span>
                  <span className="font-mono text-emerald-300 text-xs font-black">
                    {breakdown.accuracy.valueText}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${breakdown.accuracy.percentage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-emerald-400"
                  />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">{breakdown.accuracy.subtext}</p>
              </div>

              {/* Syllabus Bar */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white font-black flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    {breakdown.syllabus.label}
                  </span>
                  <span className="font-mono text-indigo-300 text-xs font-black">
                    {breakdown.syllabus.valueText}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${breakdown.syllabus.percentage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-indigo-400"
                  />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">{breakdown.syllabus.subtext}</p>
              </div>

              {/* Volume Bar */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white font-black flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    {breakdown.volume.label}
                  </span>
                  <span className="font-mono text-amber-300 text-xs font-black">
                    {breakdown.volume.valueText}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${breakdown.volume.percentage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-amber-400"
                  />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">{breakdown.volume.subtext}</p>
              </div>

              {/* Mock Bar */}
              <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-white font-black flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    {breakdown.mocks.label}
                  </span>
                  <span className="font-mono text-cyan-300 text-xs font-black">
                    {breakdown.mocks.valueText}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${breakdown.mocks.percentage}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full bg-cyan-400"
                  />
                </div>
                <p className="text-[10px] text-slate-300 font-medium">{breakdown.mocks.subtext}</p>
              </div>
            </div>
          </div>

          {/* Action Plan Card */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-[10px] font-mono font-black uppercase text-amber-200/90 tracking-wider flex items-center gap-1 justify-center sm:justify-start">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Next Step For You
              </span>
              <p className="text-xs text-slate-200 font-medium">
                Solve <strong className="text-amber-300 font-mono font-black">{recommendedDailyQs} practice questions</strong> today to increase your score!
              </p>
            </div>

            <Button
              onClick={() => {
                onClose();
                if (onActionClick) onActionClick();
              }}
              size="sm"
              className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-brand-500 via-blue-600 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-brand-500/20"
            >
              Start Today's Practice <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
