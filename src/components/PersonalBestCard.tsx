import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Flame, Target, BookOpen, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getPersonalBests, PersonalBestsData } from '../lib/personalBestManager';

import { DynamicVectorCard } from './DynamicVectorCard';

interface PersonalBestCardProps {
  userId?: string;
}

export const PersonalBestCard: React.FC<PersonalBestCardProps> = ({ userId }) => {
  const [bests, setBests] = useState<PersonalBestsData>(() => getPersonalBests(userId));
  const [showSubjectBests, setShowSubjectBests] = useState(false);

  useEffect(() => {
    setBests(getPersonalBests(userId));
  }, [userId]);

  useEffect(() => {
    const handleUpdate = () => setBests(getPersonalBests(userId));
    window.addEventListener('oep-streak-updated', handleUpdate);
    window.addEventListener('oep-streak-goal-completed', handleUpdate);
    window.addEventListener('oep-readiness-updated', handleUpdate);
    window.addEventListener('oep-activity-logged', handleUpdate);

    return () => {
      window.removeEventListener('oep-streak-updated', handleUpdate);
      window.removeEventListener('oep-streak-goal-completed', handleUpdate);
      window.removeEventListener('oep-readiness-updated', handleUpdate);
      window.removeEventListener('oep-activity-logged', handleUpdate);
    };
  }, [userId]);

  const { highestScore, highestAccuracy, fastestSpeed, longestStreak, subjectBests } = bests;

  return (
    <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.15)">
      <div className="p-5 sm:p-7 text-slate-900 rounded-[2.2rem] bg-white/90 lg:bg-white/80 backdrop-blur-xl border border-slate-200/80 shadow-xl shadow-slate-200/50 space-y-4 relative overflow-hidden group">
        {/* Radial Grid & Floating Watermark Icon */}
        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none z-0" />
        <Trophy className="absolute -right-8 -bottom-8 w-52 h-52 opacity-10 stroke-[1.2] text-[#2563eb] pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 flex items-center justify-center shrink-0 shadow-2xs font-black">
            <Trophy className="w-6 h-6 stroke-[2.2] text-brand-600" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight leading-tight uppercase">
              Your Personal Records & Milestones
            </h3>
            <p className="text-slate-500 text-[10px] sm:text-xs font-medium">Track your best achievements and beat your own records</p>
          </div>
        </div>

        {/* Live Account Data Audit Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 shrink-0 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>100% Real Account Data</span>
        </div>
      </div>

      {/* 4 Main Personal Best Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 relative z-10">
        {/* Tile 1: Highest Score */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Best Score</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-black shrink-0 border border-amber-200">Score</span>
          </div>
          <div className="text-xs sm:text-xl font-black text-slate-900 font-mono pt-0.5 tracking-tight leading-snug">
            {highestScore.value > 0 ? highestScore.formattedValue : <span className="text-slate-400 font-sans font-bold">No Record Yet</span>}
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate" title={highestScore.testTitle}>
            {highestScore.value > 0 && highestScore.testTitle && !highestScore.testTitle.includes('Complete a test')
              ? highestScore.testTitle
              : 'Complete a test to unlock'}
          </p>
          {highestScore.value > 0 && highestScore.detail && (
            <span className="text-[9px] font-bold text-amber-700 block pt-0.5 truncate">
              {highestScore.detail}
            </span>
          )}
        </div>

        {/* Tile 2: Highest Accuracy */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Best Accuracy</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-black shrink-0 border border-emerald-200">Accuracy</span>
          </div>
          <div className="text-xs sm:text-xl font-black text-slate-900 font-mono pt-0.5 tracking-tight leading-snug">
            {highestAccuracy.value > 0 ? highestAccuracy.formattedValue : <span className="text-slate-400 font-sans font-bold">No Record Yet</span>}
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate" title={highestAccuracy.testTitle}>
            {highestAccuracy.value > 0 && highestAccuracy.testTitle && !highestAccuracy.testTitle.includes('Complete a test')
              ? highestAccuracy.testTitle
              : 'Highest test accuracy'}
          </p>
          {highestAccuracy.value > 0 && highestAccuracy.detail && (
            <span className="text-[9px] font-bold text-emerald-700 block pt-0.5 truncate">
              {highestAccuracy.detail}
            </span>
          )}
        </div>

        {/* Tile 3: Fastest Speed */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-cyan-700 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Zap className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Fastest Speed</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded font-black shrink-0 border border-cyan-200">Speed</span>
          </div>
          <div className="text-xs sm:text-xl font-black text-slate-900 font-mono pt-0.5 tracking-tight leading-snug">
            {fastestSpeed.value > 0 ? fastestSpeed.formattedValue : <span className="text-slate-400 font-sans font-bold">No Record Yet</span>}
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate" title={fastestSpeed.testTitle}>
            {fastestSpeed.value > 0 && fastestSpeed.testTitle && !fastestSpeed.testTitle.includes('Complete a test')
              ? fastestSpeed.testTitle
              : 'Avg time per question'}
          </p>
          {fastestSpeed.value > 0 && fastestSpeed.detail && (
            <span className="text-[9px] font-bold text-cyan-700 block pt-0.5 truncate">
              {fastestSpeed.detail}
            </span>
          )}
        </div>

        {/* Tile 4: Longest Streak */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1 hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-xs text-orange-700 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>Best Streak</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded font-black shrink-0 border border-orange-200">Streak</span>
          </div>
          <div className="text-xs sm:text-xl font-black text-slate-900 font-mono pt-0.5 tracking-tight leading-snug">
            <span className="sm:hidden">{longestStreak.formattedValue.replace('In A Row', 'Streak')}</span>
            <span className="hidden sm:inline">{longestStreak.formattedValue}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium truncate">
            Max study streak
          </p>
          {longestStreak.detail && (
            <span className="text-[9px] font-bold text-orange-700 block pt-0.5 truncate">
              {longestStreak.detail}
            </span>
          )}
        </div>
      </div>

      {/* Expandable Subject Personal Bests Drawer Toggle */}
      {subjectBests.length > 0 && (
        <div className="pt-1 relative z-10">
          <button
            type="button"
            onClick={() => setShowSubjectBests(!showSubjectBests)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200 text-slate-900 text-xs font-black flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Subject-Wise Best Scores ({subjectBests.length} Subjects)</span>
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${showSubjectBests ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showSubjectBests && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pt-3 space-y-2"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {subjectBests.map((sub, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-900"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 block truncate">{sub.subjectName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {sub.attemptCount} {sub.attemptCount === 1 ? 'practice session' : 'practice sessions'} ({sub.totalAttempted} questions)
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-black text-xs shrink-0">
                        {sub.highestAccuracy}% Correct
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      </div>
    </DynamicVectorCard>
  );
};
