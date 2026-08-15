import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Zap, Flame, Target, BookOpen, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getPersonalBests, PersonalBestsData } from '../lib/personalBestManager';

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
    <div className="p-5 sm:p-7 text-white rounded-[2.2rem] bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/20 shadow-xl shadow-amber-950/20 space-y-4 relative overflow-hidden card-3d-deep">
      {/* Radial Grid & Floating Watermark Icon */}
      <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none z-0" />
      <Trophy className="absolute -right-8 -bottom-8 w-52 h-52 opacity-15 stroke-[1.2] text-amber-300 pointer-events-none transition-transform duration-700 hover:scale-110 hover:rotate-6 z-0" />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30 border border-amber-300/60 font-black">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black text-white tracking-tight leading-tight uppercase">
              Your Personal Records & Milestones
            </h3>
            <p className="text-white/80 text-[10px] sm:text-xs font-medium">Track your best achievements and beat your own records</p>
          </div>
        </div>

        {/* Live Account Data Audit Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black text-emerald-300 bg-emerald-400/20 border border-emerald-400/40 shrink-0 backdrop-blur-md">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>100% Real Account Data</span>
        </div>
      </div>

      {/* 4 Main Personal Best Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Tile 1: Highest Score */}
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-200/70 space-y-1">
          <div className="flex items-center justify-between text-xs text-amber-800 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Best Score</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded font-bold shrink-0">Score</span>
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
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/70 space-y-1">
          <div className="flex items-center justify-between text-xs text-emerald-800 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Best Accuracy</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded font-bold shrink-0">Accuracy</span>
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
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-cyan-50/70 to-blue-50/40 border border-cyan-200/70 space-y-1">
          <div className="flex items-center justify-between text-xs text-cyan-800 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Zap className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
              <span>Fastest Speed</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-700 bg-cyan-100/80 px-1.5 py-0.5 rounded font-bold shrink-0">Speed</span>
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
        <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-orange-50/70 to-amber-50/40 border border-orange-200/70 space-y-1">
          <div className="flex items-center justify-between text-xs text-orange-800 font-bold gap-1">
            <span className="flex items-center gap-1 min-w-0 font-extrabold truncate">
              <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>Best Streak</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono text-orange-700 bg-orange-100/80 px-1.5 py-0.5 rounded font-bold shrink-0">Streak</span>
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
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowSubjectBests(!showSubjectBests)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-600" />
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
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-800 block truncate">{sub.subjectName}</span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {sub.attemptCount} {sub.attemptCount === 1 ? 'practice session' : 'practice sessions'} ({sub.totalAttempted} questions)
                        </span>
                      </div>

                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-mono font-black text-xs shrink-0">
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
  );
};
