import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Shield, Trophy, CheckCircle2, Circle, Sparkles, Lock, ChevronDown } from 'lucide-react';
import { 
  StreakState, 
  getMilestoneBadges, 
  getCurrentWeekDays 
} from '../lib/streakManager';
import { Button } from './Button';

interface StreakDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakState: StreakState;
  onSolveMoreClick?: () => void;
}

export const StreakDetailModal: React.FC<StreakDetailModalProps> = ({
  isOpen,
  onClose,
  streakState,
  onSolveMoreClick
}) => {
  const [showMilestonesList, setShowMilestonesList] = useState(false);

  if (!isOpen || typeof document === 'undefined') return null;

  const milestones = getMilestoneBadges(streakState.highestStreak);
  const weekDays = getCurrentWeekDays(streakState.weeklyHistory);
  const progressPct = Math.min(100, Math.round((streakState.todayQuestionsSolved / 20) * 100));
  const remainingQs = Math.max(0, 20 - streakState.todayQuestionsSolved);
  const unlockedCount = milestones.filter(m => m.unlocked).length;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-slate-950/75 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal / Mobile Bottom Sheet Card */}
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative w-full sm:max-w-lg bg-slate-900 border border-slate-800 text-white rounded-t-[2rem] sm:rounded-3xl p-4.5 sm:p-7 shadow-2xl overflow-hidden z-10 space-y-3.5 sm:space-y-5 max-h-[88vh] sm:max-h-none overflow-y-auto overscroll-contain no-scrollbar"
          data-lenis-prevent
        >
          {/* Mobile Drag Handle Bar */}
          <div className="w-12 h-1 rounded-full bg-slate-700/80 mx-auto sm:hidden -mt-1 mb-1 shrink-0" />

          {/* Background Glow Accents */}
          <div className="absolute -right-20 -top-20 w-56 h-56 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-56 h-56 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Title & Close Button */}
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-2">
              <span className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
              </span>
              <div>
                <h3 className="text-sm sm:text-lg font-black tracking-tight text-white leading-tight">
                  Daily Study Streak
                </h3>
                <p className="text-slate-400 text-[10px] sm:text-xs font-medium">Study every day to build confidence</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Main Streak Counter Hero Box */}
          <div className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/25 relative overflow-hidden flex items-center justify-between gap-3">
            <div className="space-y-0.5 sm:space-y-1 relative z-10">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-500/20">
                Active Streak
              </span>
              <div className="flex items-baseline gap-1.5 sm:gap-2 pt-0.5">
                <span className="text-2xl sm:text-4xl font-black text-amber-400 font-mono tracking-tight">
                  {streakState.currentStreak}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-300 uppercase tracking-wider">
                  {streakState.currentStreak === 1 ? 'Day' : 'Days'} In A Row
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-medium pt-0.5">
                Best Streak Record: <strong className="text-slate-200 font-mono">{streakState.highestStreak} Days</strong>
              </p>
            </div>

            <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 relative shadow-inner">
              <Flame className="w-7 h-7 sm:w-12 sm:h-12 text-amber-500 drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)] animate-bounce" />
            </div>
          </div>

          {/* Today's Goal Progress Bar */}
          <div className="p-3 sm:p-4 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2">
            <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Today's Study Goal
              </span>
              <span className="font-mono text-amber-400 font-bold">
                {streakState.todayQuestionsSolved} / 20 Questions Solved
              </span>
            </div>

            <div className="w-full h-2 sm:h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 relative border border-slate-750">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
              </motion.div>
            </div>

            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
              {streakState.todayGoalCompleted ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Daily goal of 20 questions achieved! Your streak is active for today.
                </span>
              ) : (
                <span>
                  Solve <strong className="text-amber-300 font-mono">{remainingQs} more questions</strong> today to extend your streak.
                </span>
              )}
            </p>
          </div>

          {/* Week-at-a-Glance Calendar Grid */}
          <div className="space-y-1.5 sm:space-y-2">
            <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>This Week's Progress</span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-normal">Mon – Sun</span>
            </h4>
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {weekDays.map((d, i) => (
                <div
                  key={i}
                  className={`py-1.5 sm:p-2 rounded-xl border flex flex-col items-center gap-0.5 sm:gap-1 text-center transition-all ${
                    d.isToday
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm'
                      : d.isCompleted
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-800/50 border-slate-750 text-slate-500'
                  }`}
                >
                  <span className="text-[9px] sm:text-[10px] font-extrabold uppercase">{d.label}</span>
                  {d.isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Streak Freeze & Badges Info Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-0.5">
            <div className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center gap-2">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Streak Protection</span>
                <span className="text-[11px] sm:text-xs font-bold text-indigo-300 font-mono">
                  {streakState.streakFreezesAvailable} Freeze Available
                </span>
                <span className="text-[8.5px] text-slate-400 block font-normal leading-tight">Protects if you miss 1 day</span>
              </div>
            </div>

            <button
              onClick={() => setShowMilestonesList(!showMilestonesList)}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-800/60 border border-slate-750 flex items-center justify-between gap-2 text-left hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Streak Badges</span>
                  <span className="text-[11px] sm:text-xs font-bold text-amber-300">
                    {unlockedCount} of 4 Unlocked
                  </span>
                  <span className="text-[8.5px] text-slate-400 block font-normal leading-tight">Click to view rewards</span>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showMilestonesList ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Expandable Milestone Badges List */}
          <AnimatePresence>
            {showMilestonesList && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-2 pt-1"
              >
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Streak Rewards & Badges
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {milestones.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all ${
                        m.unlocked
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-60'
                      }`}
                    >
                      <span className="text-xl shrink-0">{m.icon}</span>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-bold text-white block truncate">{m.name}</span>
                        <span className="text-[9px] font-medium text-slate-400 block">
                          {m.unlocked ? 'Unlocked ✓' : `${m.daysRequired} Days Streak Needed`}
                        </span>
                      </div>
                      {!m.unlocked && <Lock className="w-3 h-3 text-slate-600 shrink-0" />}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Solve More Quick Action Button */}
          {!streakState.todayGoalCompleted && onSolveMoreClick && (
            <Button
              onClick={() => {
                onClose();
                onSolveMoreClick();
              }}
              className="w-full h-11 sm:h-12 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer mt-1"
            >
              <Flame className="w-4 h-4 text-slate-950 fill-current" />
              Solve {remainingQs} More Questions to Keep Streak 🔥
            </Button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
