import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, CheckCircle2, ArrowRight, ChevronDown, Clock, PlayCircle, BookOpen } from 'lucide-react';
import { getSmartWeakTopicRecommendations, SmartRecommendationResult } from '../lib/recommendationEngine';
import { useActiveExamContext } from '../lib/activeExamStore';
import { DynamicVectorCard } from './DynamicVectorCard';
import { useLanguage, toOdiaDigits } from '../lib/LanguageContext';

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
  const { t, isOdia } = useLanguage();

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

  const getLocalizedBadgeLabel = (status: string) => {
    if (!isOdia) {
      return status === 'critical' ? 'Needs Practice' : status === 'mastered' ? 'Strong Area' : 'In Progress';
    }
    return status === 'critical' ? 'ଅଭ୍ୟାସ ଆବଶ୍ୟକ' : status === 'mastered' ? 'ଦୃଢ଼ ବିଷୟ' : 'ଚାଲୁ ରହିଛି';
  };

  return (
    <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.12)" className="mb-6 sm:mb-8">
      <div className="p-5 sm:p-7 text-slate-900 dark:text-white rounded-[2.2rem] bg-white/90 lg:bg-white/80 dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 backdrop-blur-xl border-none shadow-xl shadow-slate-900/10 space-y-4 relative group">
        {/* Inner Watermark & Grid Background Wrapper */}
        <div className="absolute inset-0 overflow-hidden rounded-[2.2rem] pointer-events-none z-0">
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-10" />
          <Zap className="absolute -right-8 -bottom-8 w-52 h-52 opacity-10 dark:opacity-15 stroke-[1.2] text-[#2563eb] dark:text-amber-300 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />
        </div>

      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 dark:bg-gradient-to-br dark:from-amber-400 dark:via-amber-500 dark:to-orange-600 dark:text-slate-950 border border-brand-200 dark:border-amber-300/60 flex items-center justify-center shrink-0 shadow-2xs dark:shadow-amber-500/30 font-black">
            <Zap className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase">
              {t('Your Weak Topics & Practice Plan', 'Your Weak Topics & Practice Plan')}
            </h3>
            <p className="text-slate-500 dark:text-white/80 text-[10px] sm:text-xs font-medium">
              {isOdia
                ? 'ପରୀକ୍ଷା ସ୍କୋର ବଢ଼ାଇବାକୁ ସର୍ବପ୍ରଥମେ ନିଜର ଦୁର୍ବଳ ବିଷୟ ଉପରେ ଧ୍ୟାନ ଦିଅନ୍ତୁ'
                : 'Focus on your weakest subjects first to quickly raise your exam score'}
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-black text-brand-700 dark:text-slate-300 bg-brand-50 dark:bg-slate-800 border border-brand-200 dark:border-slate-700 font-mono">
          {isOdia ? `${toOdiaDigits(allTopicConfidence.length)} ଟି ବିଷୟ ବିଶ୍ଳେଷିତ` : `${allTopicConfidence.length} Topics Analyzed`}
        </span>
      </div>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3.5 pt-0.5 relative z-10">
        {allTopicConfidence.map((topic, idx) => {
          const isCritical = topic.status === 'critical';
          const isMastered = topic.status === 'mastered';
          const hasIncomplete = !!topic.incompleteActivity;

          const barColor = isCritical
            ? 'bg-rose-500'
            : isMastered
            ? 'bg-emerald-500'
            : 'bg-amber-500';

          const badgeBg = isCritical
            ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/40'
            : isMastered
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/40'
            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/40';

          const statusIcon = isCritical ? (
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          ) : isMastered ? (
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          );

          const badgeLabel = getLocalizedBadgeLabel(topic.status);

          return (
            <div
              key={idx}
              className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all space-y-2 relative bg-slate-50/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-600 ${
                idx >= mobileVisibleCount && !isExpanded ? 'hidden sm:block' : 'block'
              }`}
            >
              {/* Desktop Header (>= sm): Title, Status Badge, Accuracy */}
              <div className="hidden sm:flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-sm tracking-tight truncate">
                    {topic.topicName}
                  </h4>

                  <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${badgeBg}`}>
                    {statusIcon}
                    {badgeLabel}
                  </span>
                </div>

                <span className="font-bold text-slate-900 dark:text-amber-300 text-xs shrink-0 font-mono">
                  {isOdia
                    ? `${toOdiaDigits(topic.accuracy)}% ସଠିକ୍ • ${toOdiaDigits(topic.totalQuestions)} ପ୍ରଶ୍ନ`
                    : `${topic.accuracy}% Correct • ${topic.totalQuestions} Questions`}
                </span>
              </div>

              {/* Mobile Header (< sm): Structured 2-Line Title & Status Bar */}
              <div className="sm:hidden space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs tracking-tight leading-snug truncate pr-1">
                    {topic.topicName}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase tracking-wider border flex items-center gap-1 shrink-0 ${badgeBg}`}>
                    {statusIcon}
                    {badgeLabel}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                  <span className="text-slate-900 dark:text-amber-300 font-bold">
                    {isOdia ? `${toOdiaDigits(topic.accuracy)}% ସଠିକତା ହାର` : `${topic.accuracy}% Accuracy Rate`}
                  </span>
                  <span className="font-mono font-semibold text-slate-500 dark:text-slate-300">
                    {isOdia ? `${toOdiaDigits(topic.totalQuestions)} ପ୍ରଶ୍ନ` : `${topic.totalQuestions} Questions`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 sm:h-2 bg-slate-200/80 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-800">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${topic.accuracy}%` }}
                  transition={{ duration: 0.8 }}
                  className={`h-full rounded-full ${barColor}`}
                />
              </div>

              {/* Desktop Bottom Row (>= sm) */}
              <div className="hidden sm:flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-300 font-medium pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>
                    {isOdia
                      ? `${toOdiaDigits(topic.attemptCount)} ଅଭ୍ୟାସ ସେସନ୍`
                      : `${topic.attemptCount} ${topic.attemptCount === 1 ? 'practice session' : 'practice sessions'}`}
                  </span>
                  {hasIncomplete && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-400/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-400/40 font-bold text-[9.5px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-300" />
                      {isOdia
                        ? `ଅସମ୍ପୂର୍ଣ୍ଣ (ପ୍ରଶ୍ନ ${toOdiaDigits(topic.completedQuestionsCount)} / ${toOdiaDigits(topic.totalQuestionsCount)})`
                        : `Unfinished (Question ${topic.completedQuestionsCount} of ${topic.totalQuestionsCount})`}
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
                  className={`font-black inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-xl text-xs transition-all shadow-2xs shrink-0 border-none ${
                    hasIncomplete
                      ? 'bg-amber-500 hover:bg-amber-600 text-white dark:text-slate-950 font-black'
                      : 'bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-500 dark:to-indigo-500 hover:from-brand-500 hover:to-indigo-500 text-white font-black'
                  }`}
                >
                  {hasIncomplete ? (
                    <>
                      <PlayCircle className="w-3 h-3 text-white dark:text-slate-950 fill-current" />
                      <span>{isOdia ? 'ଅଭ୍ୟାସ ଜାରି ରଖନ୍ତୁ' : 'Resume Practice'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isOdia ? 'ଅଭ୍ୟାସ ଆରମ୍ଭ କରନ୍ତୁ' : 'Start Practice'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              </div>

              {/* Mobile Bottom Row (< sm): Clean Touch-Friendly Stacked Layout */}
              <div className="sm:hidden space-y-2 pt-0.5">
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-300 font-medium">
                  <span>
                    {isOdia
                      ? `${toOdiaDigits(topic.attemptCount)} ଅଭ୍ୟାସ ସେସନ୍`
                      : `${topic.attemptCount} ${topic.attemptCount === 1 ? 'practice session' : 'practice sessions'}`}
                  </span>
                  {hasIncomplete && (
                    <span className="text-amber-800 dark:text-amber-300 font-bold text-[9.5px] flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400 shrink-0" />
                      <span>{isOdia ? `ପ୍ରଶ୍ନ ${toOdiaDigits(topic.completedQuestionsCount)}/${toOdiaDigits(topic.totalQuestionsCount)} ବାକି` : `Q${topic.completedQuestionsCount}/${topic.totalQuestionsCount} Incomplete`}</span>
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
                  className={`w-full py-2.5 rounded-xl text-xs font-black inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer border-none ${
                    hasIncomplete
                      ? 'bg-amber-500 active:bg-amber-600 text-white dark:text-slate-950 font-black'
                      : 'bg-gradient-to-r from-brand-600 to-indigo-600 active:from-brand-500 active:to-indigo-500 text-white font-black'
                  }`}
                >
                  {hasIncomplete ? (
                    <>
                      <PlayCircle className="w-3.5 h-3.5 text-white dark:text-slate-950 fill-current shrink-0" />
                      <span>{isOdia ? `ଅଭ୍ୟାସ ଜାରି ରଖନ୍ତୁ (${toOdiaDigits(topic.completedQuestionsCount)}/${toOdiaDigits(topic.totalQuestionsCount)})` : `Resume Practice (Q${topic.completedQuestionsCount}/${topic.totalQuestionsCount})`}</span>
                    </>
                  ) : (
                    <>
                      <span>{isOdia ? 'ଅଭ୍ୟାସ ଆରମ୍ଭ କରନ୍ତୁ' : 'Start Practice Drill'}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white shrink-0" />
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
          <span>{isExpanded ? (isOdia ? 'କମ୍ ଦେଖନ୍ତୁ' : 'Show Less') : (isOdia ? `ସମସ୍ତ ${toOdiaDigits(allTopicConfidence.length)} ଟି ବିଷୟ ଦେଖନ୍ତୁ` : `Show All ${allTopicConfidence.length} Topics`)}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      )}
      </div>
    </DynamicVectorCard>
  );
};

