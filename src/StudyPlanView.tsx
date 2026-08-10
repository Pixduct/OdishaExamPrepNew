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

        {user ? (
          <>
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
          </>
        ) : (
          <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 border border-slate-800 rounded-2xl sm:rounded-[2.25rem] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                Personalized Preparation Hub
              </div>
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Sign In to Access Your Personal AI Study Plan & Score Tracker
              </h3>
              <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
                Your daily schedule, weak topic recommendations, Odisha student rankings, and personal performance matrix are private to your user account.
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('oep-open-auth-modal'))}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-95 cursor-pointer border-none"
              >
                Sign In to Access →
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudyPlanView;
