import React from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, Trophy, Zap, BookOpen } from 'lucide-react';
import { AIStudyPlanCard } from './components/AIStudyPlanCard';
import { SmartRecommendationCard } from './components/SmartRecommendationCard';
import { TopicConfidenceMatrix } from './components/TopicConfidenceMatrix';
import { OdishaLeaderboardCard } from './components/OdishaLeaderboardCard';
import { PersonalBestCard } from './components/PersonalBestCard';
import { stagger } from './lib/animations';

import { ActiveExamContextBar } from './components/ActiveExamContextBar';

interface StudyPlanViewProps {
  user?: any;
  onNavigate?: (tab: string) => void;
  onLaunchTopicPractice?: (topicName: string) => void;
}

export const StudyPlanView: React.FC<StudyPlanViewProps> = ({
  user,
  onNavigate,
  onLaunchTopicPractice
}) => {
  return (
    <div className="relative w-full min-h-screen overflow-x-hidden" style={{ isolation: 'isolate' }}>
      {/* Background ambient gradients */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.06),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.04),transparent_50%)] -z-10 pointer-events-none" />

      <motion.div
        variants={stagger.containerDelay(0.1, 0.1)}
        initial="hidden"
        animate="show"
        className="w-full mx-auto px-4 sm:px-0 pt-4 sm:pt-6 space-y-6 sm:space-y-8 pb-32 sm:pb-24 relative z-10 max-w-7xl"
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="p-2 sm:p-3 rounded-2xl bg-brand-50 border border-brand-100 text-brand-650 shrink-0 shadow-xs">
              <Target className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div>
              <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                Study Plan & Preparation Hub
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium">
                Your daily time-boxed schedule, weak subject drills, and Odisha student rankings
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold text-brand-700 bg-brand-50 border border-brand-200/60 shrink-0 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            Personalized Hub
          </span>
        </div>

        {/* Hero Context Bar for Multi-Exam Selection */}
        <ActiveExamContextBar />

        {/* 1. Today's AI Study Plan Card */}
        <AIStudyPlanCard userId={user?.id} onLaunchTask={onLaunchTopicPractice} />

        {/* 2. Odisha Rank & Student Leagues Card (PrepRank) */}
        <OdishaLeaderboardCard userId={user?.id} />

        {/* 3. Smart Weak Topic Recommendation Card */}
        <SmartRecommendationCard userId={user?.id} onLaunchPractice={onLaunchTopicPractice} />

        {/* 4. Your Weak Topics & Practice Plan Matrix */}
        <TopicConfidenceMatrix userId={user?.id} onLaunchTopicPractice={onLaunchTopicPractice} />

        {/* 5. Your Personal Records & Milestones Card */}
        <PersonalBestCard userId={user?.id} />
      </motion.div>
    </div>
  );
};

export default StudyPlanView;
