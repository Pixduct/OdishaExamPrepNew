import React from 'react';
import { motion } from 'framer-motion';
import { Target, Sparkles, Trophy, Zap, BookOpen, GraduationCap, Calendar, TrendingUp, Compass, Award } from 'lucide-react';
import { AIStudyPlanCard } from './components/AIStudyPlanCard';
import { SmartRecommendationCard } from './components/SmartRecommendationCard';
import { TopicConfidenceMatrix } from './components/TopicConfidenceMatrix';
import { OdishaLeaderboardCard } from './components/OdishaLeaderboardCard';
import { PersonalBestCard } from './components/PersonalBestCard';
import { DynamicVectorCard } from './components/DynamicVectorCard';
import { stagger } from './lib/animations';

import { ActiveExamContextBar } from './components/ActiveExamContextBar';
import { useLanguage } from './lib/LanguageContext';

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
  const { t, isOdia } = useLanguage();

  return (
    <div className="relative w-full min-h-screen bg-[#F8FAFC] dark:bg-transparent overflow-x-hidden" style={{ isolation: 'isolate' }}>
      {/* Full-Screen Edge-to-Edge Academic Vector Canvas Grid & HSL Glows */}
      <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40 dark:opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-brand-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0 gpu-accelerated" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-indigo-200/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none z-0 gpu-accelerated" />

      {/* Floating Viewport Academic Study Vector Watermarks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <GraduationCap className="absolute top-24 left-[5%] w-44 h-44 text-slate-800 opacity-[0.08] stroke-[1.2] rotate-12" />
        <Calendar className="absolute top-1/3 right-[5%] w-48 h-48 text-brand-600 opacity-[0.08] stroke-[1.2] -rotate-6" />
        <Trophy className="absolute bottom-1/3 left-[6%] w-44 h-44 text-amber-600 opacity-[0.08] stroke-[1.2] rotate-45" />
        <TrendingUp className="absolute bottom-28 right-[6%] w-36 h-36 text-indigo-600 opacity-[0.08] stroke-[1.2] -rotate-12" />
      </div>

      <motion.div
        variants={stagger.containerDelay(0.1, 0.1)}
        initial="hidden"
        animate="show"
        className="w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-4 sm:space-y-8 pb-4 sm:pb-8 relative z-10"
      >
        {/* Executive Bright Study Vector Header Card */}
        <DynamicVectorCard 
          glowColor="rgba(37, 99, 235, 0.15)"
          roundedClass="rounded-2xl sm:rounded-[2.5rem]"
          className="w-full bg-gradient-to-br from-white via-slate-50/95 to-brand-50/30 dark:bg-gradient-to-br dark:from-[#0B1528] dark:via-[#112240] dark:to-[#0B1528] border border-slate-200/80 dark:border-blue-500/30 shadow-xl shadow-slate-200/40 dark:shadow-2xl dark:shadow-slate-950/60"
        >
          <div className="p-4 sm:p-8 relative overflow-hidden z-10 w-full">
            {/* Radial Grid & Floating Header Watermark */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#60a5fa_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-10 pointer-events-none" />
            <Calendar className="absolute -right-8 -bottom-8 w-52 h-52 sm:w-64 sm:h-64 opacity-10 dark:opacity-15 stroke-[1.2] text-brand-600 dark:text-blue-400 pointer-events-none rotate-12" />

            <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-600 to-brand-700 text-white flex items-center justify-center shrink-0 shadow-md sm:shadow-lg shadow-brand-500/25 border border-white/40 mt-0.5 sm:mt-0">
                  <Target className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1 space-y-1 sm:space-y-0.5">
                  <div className="sm:hidden mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-brand-700 dark:text-blue-300 bg-brand-50/90 dark:bg-blue-900/40 border border-brand-200/70 dark:border-blue-700/50 font-mono">
                      <Sparkles className="w-2.5 h-2.5 text-brand-600 dark:text-blue-400 animate-pulse" />
                      {t('studyPlan.header.badge', 'Personalized Hub')}
                    </span>
                  </div>
                  <h2 className="text-sm sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-snug uppercase">
                    {t('studyPlan.header.title', 'Study Plan & Preparation Hub')}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-medium leading-relaxed">
                    {t('studyPlan.header.subtitle', 'Your daily time-boxed schedule, weak subject drills, and Odisha student rankings')}
                  </p>
                </div>
              </div>

              {/* Desktop badge (>= 640px) */}
              <span className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black text-brand-700 dark:text-blue-300 bg-brand-50/80 dark:bg-blue-900/40 border border-brand-200/70 dark:border-blue-700/50 shrink-0 font-mono shadow-2xs backdrop-blur-md whitespace-nowrap self-center">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-blue-400 animate-pulse" />
                <span>{t('studyPlan.header.badge', 'Personalized Hub')}</span>
              </span>
            </div>
          </div>
        </DynamicVectorCard>

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
          <div>
            <div className="bg-gradient-to-r from-[#0B1528] via-[#112240] to-[#0B1528] border border-blue-500/30 rounded-2xl sm:rounded-[2.25rem] p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  {t('studyPlan.header.badge', 'Personalized Preparation Hub')}
                </div>
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {t('studyPlan.signedOut.title', 'Sign In to Access Your Personal AI Study Plan & Score Tracker')}
                </h3>
                <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed">
                  {t('studyPlan.signedOut.description', 'Your daily schedule, weak topic recommendations, Odisha student rankings, and personal performance matrix are private to your user account.')}
                </p>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('oep-open-auth-modal'))}
                  className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-95 cursor-pointer border-none"
                >
                  {t('common.auth.signInBtn', 'Sign In to Access →')}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default StudyPlanView;
