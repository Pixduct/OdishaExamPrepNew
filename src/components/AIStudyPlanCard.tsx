import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Clock, Zap, ArrowRight, ShieldCheck, Flame, RefreshCw, Target, BookOpen } from 'lucide-react';
import {
  getTodayStudyPlan,
  toggleTaskCompletion,
  DailyStudyPlan,
  StudyPlanTask
} from '../lib/studyPlannerEngine';


import { useActiveExamContext } from '../lib/activeExamStore';

interface AIStudyPlanCardProps {
  userId?: string;
  onLaunchTask?: (task: StudyPlanTask) => void;
}

export const AIStudyPlanCard: React.FC<AIStudyPlanCardProps> = ({ userId, onLaunchTask }) => {
  const [activeContext] = useActiveExamContext();
  const [plan, setPlan] = useState<DailyStudyPlan>(() => getTodayStudyPlan(userId, activeContext.activeExamId, activeContext.activeExamName));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const refreshPlan = () => {
    setIsRefreshing(true);
    setScanMessage('🔍 Scanning latest test attempts & recalculating accuracy gaps...');
    setTimeout(() => {
      setPlan(getTodayStudyPlan(userId, activeContext.activeExamId, activeContext.activeExamName));
      setIsRefreshing(false);
      setScanMessage('✅ AI Study Plan updated from your latest test attempts!');
      setTimeout(() => setScanMessage(null), 3000);
    }, 450);
  };

  useEffect(() => {
    setPlan(getTodayStudyPlan(userId, activeContext.activeExamId, activeContext.activeExamName));
  }, [userId, activeContext.activeExamId, activeContext.activeExamName]);

  useEffect(() => {
    const handleUpdate = () => {
      setPlan(getTodayStudyPlan(userId, activeContext.activeExamId, activeContext.activeExamName));
    };
    window.addEventListener('oep-study-plan-updated', handleUpdate);
    window.addEventListener('oep-activity-logged', handleUpdate);
    window.addEventListener('oep-active-exam-changed', handleUpdate);

    return () => {
      window.removeEventListener('oep-study-plan-updated', handleUpdate);
      window.removeEventListener('oep-activity-logged', handleUpdate);
      window.removeEventListener('oep-active-exam-changed', handleUpdate);
    };
  }, [userId, activeContext.activeExamId, activeContext.activeExamName]);

  const handleToggle = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskCompletion(taskId, activeContext.activeExamId);
  };

  const handleTaskClick = (task: StudyPlanTask) => {
    if (onLaunchTask) {
      onLaunchTask(task);
    } else {
      window.dispatchEvent(new CustomEvent('oep-launch-topic-drill', { detail: { topicName: task.subjectName } }));
    }
  };

  if (plan.hasContent === false || plan.tasks.length === 0) {
    return (
      <div className="bg-white p-6 sm:p-10 rounded-2xl sm:rounded-[2.25rem] shadow-xs border border-slate-200/80 text-center space-y-5 mb-6 sm:mb-8 relative overflow-hidden">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto text-brand-600 shadow-inner">
          <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-brand-600 animate-float-sm" />
        </div>

        <div className="max-w-md mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-amber-700 bg-amber-50 border border-amber-200/70">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Preparing Syllabus Content
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Content Coming Soon for {activeContext.activeExamName}
          </h3>
          <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed">
            We are actively preparing question banks and mock tests for this exam syllabus. Check back soon or switch your target exam.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('oep-open-context-modal'));
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-brand-600 text-white font-extrabold text-xs sm:text-sm transition-all duration-200 shadow-md active:scale-95 cursor-pointer border-none"
          >
            <Target className="w-4 h-4" />
            <span>Switch Target Exam</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3.5 sm:p-7 rounded-2xl sm:rounded-[2.25rem] shadow-xs border border-slate-200/80 space-y-3.5 sm:space-y-4 mb-6 sm:mb-8 relative overflow-hidden">
      {/* Top Header & Dynamic Personalization Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-600 shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                Today's AI Study Plan
              </h3>
              {plan.isPersonalizedFromAttempts ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 inline-flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  <span>Real Data Personalized</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200/60 inline-flex items-center gap-1">
                  <Target className="w-2.5 h-2.5" />
                  <span>Syllabus Daily Rotation</span>
                </span>
              )}
            </div>
            <p className="text-slate-500 text-[10px] sm:text-xs font-medium pt-0.5">
              Target: <strong className="text-slate-800 font-bold">{plan.targetExamName}</strong>
              <span className="hidden sm:inline"> • Personalized schedule for maximum score gain</span>
            </p>
          </div>
        </div>

        {/* Action Header Pills & AI Refresh Trigger */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar sm:flex-wrap shrink-0 py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
          {/* Pill 1: Interactive AI Re-Analyze Button */}
          <button
            type="button"
            onClick={refreshPlan}
            disabled={isRefreshing}
            className="px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer inline-flex items-center gap-1 sm:gap-1.5 shadow-2xs shrink-0"
            title="Re-analyze test results & recalculate AI study plan"
          >
            <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isRefreshing ? 'animate-spin text-brand-600' : 'text-slate-600'}`} />
            <span>AI Re-Analyze</span>
          </button>

          {/* Pill 2: Dynamic Remaining Minutes Counter */}
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 font-mono shadow-2xs shrink-0">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
            <span>
              {plan.completedCount === plan.totalCount
                ? '0 Mins (Done 🎉)'
                : `${plan.remainingMinutes} Mins Left`}
            </span>
          </div>

          {/* Pill 3: Dynamic Score Gain Potential */}
          <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black text-brand-700 bg-brand-50 border border-brand-200 font-mono shadow-2xs shrink-0">
            <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-600 fill-current" />
            <span>{plan.expectedScoreBoost}</span>
          </div>
        </div>
      </div>

      {/* Live AI Scan Feedback Banner */}
      <AnimatePresence>
        {scanMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold flex items-center justify-between"
          >
            <span>{scanMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Track Bar */}
      <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600" />
            <span>Daily Task Progress</span>
          </span>
          <span className="font-mono text-brand-700 font-black text-[11px] sm:text-xs">
            <span className="hidden sm:inline">{plan.progressPercentage}% Completed ({plan.completedCount} of {plan.totalCount} Finished)</span>
            <span className="sm:hidden">{plan.progressPercentage}% ({plan.completedCount}/{plan.totalCount} Done)</span>
          </span>
        </div>
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-600 transition-all duration-500 shadow-2xs"
            style={{ width: `${plan.progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-2.5 sm:space-y-3 pt-1">
        {plan.tasks.map((task) => (
          <div
            key={task.id}
            onClick={() => handleTaskClick(task)}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 ${
              task.completed
                ? 'bg-slate-50/70 border-slate-200/80 opacity-75'
                : 'bg-white border-slate-200/90 hover:border-brand-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            {/* Left Checkbox & Task Information */}
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={(e) => handleToggle(task.id, e)}
                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all cursor-pointer ${
                  task.completed
                    ? 'bg-emerald-500 border-emerald-600 text-white shadow-2xs'
                    : 'bg-white border-slate-300 hover:border-brand-500 text-transparent'
                }`}
                title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
              >
                <CheckCircle2 className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
              </button>

              <div className="min-w-0 flex-1 space-y-1">
                {/* Priority Badge & Title */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shrink-0 ${task.priorityBadgeBg}`}>
                    {task.priorityLabel}
                  </span>
                  <span className={`text-xs sm:text-sm font-bold block sm:truncate leading-snug ${task.completed ? 'line-through text-slate-400' : 'text-slate-900 group-hover:text-brand-600'}`}>
                    {task.title}
                  </span>
                </div>

                {/* Metadata Details */}
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium leading-relaxed">
                  <span className="sm:hidden">
                    <strong className="text-slate-700 font-bold">{task.estimatedMinutes} Mins</strong> • <strong className="text-slate-700 font-bold">{task.questionCount} Qs</strong> • <strong className="text-slate-700 font-bold">{task.subjectName}</strong>
                  </span>
                  <span className="hidden sm:inline">
                    Est. Time: <strong className="text-slate-700 font-bold">{task.estimatedMinutes} Mins</strong> • <strong className="text-slate-700 font-bold">{task.questionCount} Questions</strong> • Subject: <strong className="text-slate-700 font-bold">{task.subjectName}</strong>
                  </span>
                </p>

                {/* AI Rationale Reason Subtext (Desktop View) */}
                <p className="hidden sm:flex text-[10px] text-brand-600 font-medium italic pt-0.5 items-center gap-1">
                  <span>💡 {task.reasonText}</span>
                </p>
              </div>
            </div>

            {/* Mobile Footer Row: Rationale + Action Button */}
            <div className="flex sm:hidden items-center justify-between gap-2 pt-2 border-t border-slate-100 shrink-0">
              <p className="text-[10px] text-brand-600 font-medium italic truncate flex-1 pr-1">
                💡 {task.reasonText}
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(task);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold inline-flex items-center justify-center gap-1 transition-all cursor-pointer shrink-0 ${
                  task.completed
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                    : 'bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 group-hover:bg-brand-600 group-hover:text-white'
                }`}
              >
                <span>{task.completed ? 'Review' : 'Start →'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Right Direct Action Button (Desktop Only) */}
            <div className="hidden sm:block shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(task);
                }}
                className={`w-full sm:w-auto px-3.5 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  task.completed
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                    : 'bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200 group-hover:bg-brand-600 group-hover:text-white'
                }`}
              >
                <span>{task.completed ? 'Review Task' : 'Start Task →'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
