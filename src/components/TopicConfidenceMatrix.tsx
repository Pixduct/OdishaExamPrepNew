import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle2, ArrowRight, ChevronDown, Clock, PlayCircle, BookOpen } from 'lucide-react';
import { getSmartWeakTopicRecommendations, SmartRecommendationResult } from '../lib/recommendationEngine';

import { useActiveExamContext } from '../lib/activeExamStore';

import { DynamicVectorCard } from './DynamicVectorCard';

interface TopicConfidenceMatrixProps {
  userId?: string;
  onLaunchTopicPractice?: (topicName: string) => void;
}

export const TopicConfidenceMatrix: React.FC<TopicConfidenceMatrixProps> = ({
  userId,
  onLaunchTopicPractice
}) => {
  const [activeContext] = useActiveExamContext();
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<SmartRecommendationResult>(() => getSmartWeakTopicRecommendations(userId, activeContext.activeExamId, activeContext.activeExamName));

  useEffect(() => {
    setData(getSmartWeakTopicRecommendations(userId, activeContext.activeExamId, activeContext.activeExamName));
  }, [userId, activeContext.activeExamId, activeContext.activeExamName]);

  useEffect(() => {
    const handleUpdate = () => setData(getSmartWeakTopicRecommendations(userId, activeContext.activeExamId, activeContext.activeExamName));
    window.addEventListener('oep-streak-updated', handleUpdate);
    window.addEventListener('oep-streak-goal-completed', handleUpdate);
    window.addEventListener('oep-readiness-updated', handleUpdate);
    window.addEventListener('oep-active-exam-changed', handleUpdate);

    return () => {
      window.removeEventListener('oep-streak-updated', handleUpdate);
      window.removeEventListener('oep-streak-goal-completed', handleUpdate);
      window.removeEventListener('oep-readiness-updated', handleUpdate);
      window.removeEventListener('oep-active-exam-changed', handleUpdate);
    };
  }, [userId, activeContext.activeExamId, activeContext.activeExamName]);

  const { allTopicConfidence } = data;

  if (!allTopicConfidence || allTopicConfidence.length === 0) return null;

  // Show top 2 topics on mobile by default unless expanded
  const mobileVisibleCount = 2;
  const hasMoreTopics = allTopicConfidence.length > mobileVisibleCount;

  return (
    <DynamicVectorCard glowColor="rgba(99, 102, 241, 0.15)" className="mb-6 sm:mb-8">
      <div className="p-5 sm:p-7 text-white rounded-[2.2rem] bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl shadow-indigo-950/20 space-y-4 relative overflow-hidden">
        {/* Radial Grid & Floating Watermark Icon */}
        <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none z-0" />
        <Zap className="absolute -right-8 -bottom-8 w-52 h-52 opacity-15 stroke-[1.2] text-amber-300 pointer-events-none transition-transform duration-700 hover:scale-110 hover:rotate-6 z-0" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30 border border-amber-300/60 font-black">
            <Zap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black text-white tracking-tight leading-tight uppercase">
              Your Weak Topics & Practice Plan
            </h3>
            <p className="text-white/80 text-[10px] sm:text-xs font-medium">Focus on your weakest subjects first to quickly raise your exam score</p>
          </div>
        </div>

        <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-bold text-slate-600 bg-slate-100 font-mono">
          {allTopicConfidence.length} Topics Analyzed
        </span>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 pt-0.5">
        {allTopicConfidence.map((topic, idx) => {
          const isHiddenOnMobile = !isExpanded && idx >= mobileVisibleCount;

          const isCritical = topic.status === 'critical';
          const isMastered = topic.status === 'mastered';
          const hasIncomplete = !!topic.incompleteActivity;

          const barColor = isCritical
            ? 'bg-rose-500'
            : isMastered
            ? 'bg-emerald-500'
            : 'bg-amber-500';

          const badgeBg = isCritical
            ? 'bg-rose-50 text-rose-700 border-rose-200'
            : isMastered
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200';

          const badgeLabel = isCritical ? 'Needs Practice' : isMastered ? 'Strong Area' : 'In Progress';

          const statusIcon = isCritical ? (
            <AlertTriangle className="w-3 h-3 text-rose-600" />
          ) : isMastered ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          ) : (
            <Zap className="w-3 h-3 text-amber-600" />
          );

          return (
            <div
              key={idx}
              className={`p-3 sm:p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5 hover:border-slate-300 transition-colors ${
                isHiddenOnMobile ? 'hidden md:block' : 'block'
              }`}
            >
              {/* Desktop Header (>= sm) */}
              <div className="hidden sm:flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-800 text-xs truncate">{topic.topicName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${badgeBg}`}>
                    {statusIcon}
                    {badgeLabel}
                  </span>
                </div>

                <span className="font-bold text-slate-700 text-xs shrink-0">
                  {topic.accuracy}% Correct • {topic.totalQuestions} Questions
                </span>
              </div>

              {/* Mobile Header (< sm): Structured 2-Line Title & Status Bar */}
              <div className="sm:hidden space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-slate-900 text-xs tracking-tight leading-snug truncate pr-1">
                    {topic.topicName}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${badgeBg}`}>
                    {statusIcon}
                    {badgeLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>{topic.accuracy}% Accuracy Rate</span>
                  <span className="font-mono font-semibold">{topic.totalQuestions} Questions</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 sm:h-2 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${topic.accuracy}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>

              {/* Desktop Bottom Row (>= sm) */}
              <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>{topic.attemptCount} {topic.attemptCount === 1 ? 'practice session' : 'practice sessions'}</span>
                  {hasIncomplete && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-300 font-bold text-[9.5px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-700" />
                      Unfinished (Question {topic.completedQuestionsCount} of {topic.totalQuestionsCount})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('oep-launch-topic-drill', { detail: topic.topicName }));
                    if (onLaunchTopicPractice) {
                      onLaunchTopicPractice(topic.topicName);
                    }
                  }}
                  className={`font-bold inline-flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-lg text-xs transition-colors shadow-2xs shrink-0 ${
                    hasIncomplete
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                      : 'bg-brand-50 hover:bg-brand-100 text-brand-600 font-bold'
                  }`}
                >
                  {hasIncomplete ? (
                    <>
                      <PlayCircle className="w-3 h-3 text-slate-950 fill-current" />
                      <span>Resume Practice</span>
                    </>
                  ) : (
                    <>
                      <span>Start Practice</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

              {/* Mobile Bottom Row (< sm): Clean Touch-Friendly Stacked Layout */}
              <div className="sm:hidden space-y-2 pt-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <span>{topic.attemptCount} {topic.attemptCount === 1 ? 'practice session' : 'practice sessions'}</span>
                  {hasIncomplete && (
                    <span className="text-amber-800 font-bold text-[9.5px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                      <span>Q{topic.completedQuestionsCount}/{topic.totalQuestionsCount} Incomplete</span>
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.dispatchEvent(new CustomEvent('oep-launch-topic-drill', { detail: topic.topicName }));
                    if (onLaunchTopicPractice) {
                      onLaunchTopicPractice(topic.topicName);
                    }
                  }}
                  className={`w-full py-2 rounded-lg text-xs font-black inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                    hasIncomplete
                      ? 'bg-amber-500 active:bg-amber-600 text-slate-950 border border-amber-600/40'
                      : 'bg-brand-50 active:bg-brand-100 text-brand-700 border border-brand-200/60'
                  }`}
                >
                  {hasIncomplete ? (
                    <>
                      <PlayCircle className="w-3.5 h-3.5 text-slate-950 fill-current shrink-0" />
                      <span>Resume Practice (Q{topic.completedQuestionsCount}/{topic.totalQuestionsCount})</span>
                    </>
                  ) : (
                    <>
                      <span>Start Practice Drill</span>
                      <ArrowRight className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile Expand / Collapse Button */}
      {hasMoreTopics && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="md:hidden w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>{isExpanded ? 'Show Less' : `Show All ${allTopicConfidence.length} Topics`}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}
      </div>
    </DynamicVectorCard>
  );
};
