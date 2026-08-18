import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, ArrowRight, Sparkles, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { getSmartWeakTopicRecommendations, SmartRecommendationResult, TopicWeakness } from '../lib/recommendationEngine';
import { Button } from './Button';


import { useActiveExamContext } from '../lib/activeExamStore';

import { DynamicVectorCard } from './DynamicVectorCard';

interface SmartRecommendationCardProps {
  userId?: string;
  onLaunchPractice?: (topicName: string) => void;
}

export const SmartRecommendationCard: React.FC<SmartRecommendationCardProps> = ({
  userId,
  onLaunchPractice
}) => {
  const [activeContext] = useActiveExamContext();
  const [data, setData] = useState<SmartRecommendationResult>(() => getSmartWeakTopicRecommendations(userId, activeContext.activeExamId, activeContext.activeExamName));

  useEffect(() => {
    setData(getSmartWeakTopicRecommendations(userId, activeContext.activeExamId, activeContext.activeExamName));
  }, [userId, activeContext.activeExamId, activeContext.activeExamName]);

  useEffect(() => {
    const handleUpdate = () => setData(getSmartWeakTopicRecommendations(userId, activeContext.activeExamId, activeContext.activeExamName));
    window.addEventListener('oep-streak-updated', handleUpdate);
    window.addEventListener('oep-streak-goal-completed', handleUpdate);
    window.addEventListener('oep-active-exam-changed', handleUpdate);

    return () => {
      window.removeEventListener('oep-streak-updated', handleUpdate);
      window.removeEventListener('oep-streak-goal-completed', handleUpdate);
      window.removeEventListener('oep-active-exam-changed', handleUpdate);
    };
  }, [userId, activeContext.activeExamId, activeContext.activeExamName]);

  const { primaryRecommendation, secondaryRecommendations } = data;

  if (!primaryRecommendation) return null;

  return (
    <DynamicVectorCard glowColor="rgba(20, 184, 166, 0.15)" className="mb-6 sm:mb-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-5 sm:p-7 text-white rounded-[2.2rem] bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 border-none shadow-xl shadow-teal-950/20 relative group"
      >
        {/* Inner Watermark & Grid Background Wrapper */}
        <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.2rem] [clip-path:inset(0_round_2.2rem)]">
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
          <Sparkles className="absolute -right-8 -bottom-8 w-52 h-52 opacity-15 stroke-[1.2] text-teal-300 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>

      {/* Mobile View: Structured 2-Row Compact Banner */}
      <div
        className="sm:hidden space-y-2 cursor-pointer relative z-10"
        onClick={() => onLaunchPractice?.(primaryRecommendation.topicName)}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 font-mono font-black text-amber-400 text-[10px] uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
            <Zap className="w-3 h-3 text-amber-400 fill-current animate-pulse" />
            Weak Area
          </span>

          <span className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span>Launch Drill</span>
            <ArrowRight className="w-3 h-3 text-brand-400" />
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-white truncate min-w-0">
            {primaryRecommendation.topicName}
          </span>
          <span className="text-[10px] font-mono font-extrabold text-amber-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 shrink-0">
            {primaryRecommendation.accuracy}% Accuracy
          </span>
        </div>
      </div>

      {/* Desktop View: Full Spacious Smart Recommendation Banner */}
      <div className="hidden sm:flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2.5 flex-1 min-w-0">
          {/* Header Pill & Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Zap className="w-3.5 h-3.5 fill-current text-amber-400 animate-pulse" />
              Smart Weak Topic Recommendation
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-slate-800 text-slate-300 border border-slate-700">
              🎯 {primaryRecommendation.weightageMarks} Exam Marks Weight
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-slate-800 text-amber-400 border border-slate-700">
              {primaryRecommendation.accuracy}% Accuracy Rate
            </span>
          </div>

          {/* Title */}
          <h3 className="text-lg font-black text-white tracking-tight leading-tight">
            Focus Area: <span className="text-amber-400">{primaryRecommendation.topicName}</span>
          </h3>

          {/* Rationale Explanation */}
          <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-2xl">
            {primaryRecommendation.rationale}
          </p>

          {/* Secondary Weak Topic Teaser Pills */}
          {secondaryRecommendations.length > 0 && (
            <div className="pt-1 flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
              <span className="font-bold text-slate-400">Next Priority Areas:</span>
              {secondaryRecommendations.map((sec, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-750 text-slate-300 font-mono text-[10px]"
                >
                  {sec.topicName} ({sec.accuracy}%)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 shrink-0">
          <Button
            onClick={() => onLaunchPractice?.(primaryRecommendation.topicName)}
            className="w-full sm:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-current text-slate-950" />
            <span>Start Focused Drill (15 Mins)</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            +{primaryRecommendation.estimatedReadinessGain}% Estimated Readiness Gain
          </span>
        </div>
      </div>
    </motion.div>
  </DynamicVectorCard>
  );
};
