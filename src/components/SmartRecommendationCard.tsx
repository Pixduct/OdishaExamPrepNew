import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, ArrowRight, Sparkles, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { getSmartWeakTopicRecommendations, SmartRecommendationResult, TopicWeakness } from '../lib/recommendationEngine';
import { Button } from './Button';


interface SmartRecommendationCardProps {
  userId?: string;
  onLaunchPractice?: (topicName: string) => void;
}

export const SmartRecommendationCard: React.FC<SmartRecommendationCardProps> = ({
  userId,
  onLaunchPractice
}) => {
  const [data, setData] = useState<SmartRecommendationResult>(() => getSmartWeakTopicRecommendations(userId));

  useEffect(() => {
    setData(getSmartWeakTopicRecommendations(userId));
  }, [userId]);

  useEffect(() => {
    const handleUpdate = () => setData(getSmartWeakTopicRecommendations(userId));
    window.addEventListener('oep-streak-updated', handleUpdate);
    window.addEventListener('oep-streak-goal-completed', handleUpdate);

    return () => {
      window.removeEventListener('oep-streak-updated', handleUpdate);
      window.removeEventListener('oep-streak-goal-completed', handleUpdate);
    };
  }, [userId]);

  const { primaryRecommendation, secondaryRecommendations } = data;

  if (!primaryRecommendation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 border border-slate-800 text-white rounded-2xl sm:rounded-[2.2rem] p-4 sm:p-7 shadow-xl shadow-slate-950/20 relative overflow-hidden group mb-6 sm:mb-8"
    >
      {/* Background Accent Glow */}
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile View: Thin 44px 1-line bar */}
      <div
        className="sm:hidden flex items-center justify-between gap-3 text-xs cursor-pointer"
        onClick={() => onLaunchPractice?.(primaryRecommendation.topicName)}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="flex items-center gap-1 font-mono font-black text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
            Weak Area
          </span>

          <span className="text-xs font-bold text-white truncate min-w-0">
            {primaryRecommendation.topicName} ({primaryRecommendation.accuracy}%)
          </span>
        </div>

        <span className="text-[10px] font-black text-brand-400 hover:text-brand-300 uppercase tracking-wider shrink-0">
          Launch Drill →
        </span>
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
  );
};
