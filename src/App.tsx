import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { 
  BookOpen, 
  LayoutDashboard, 
  History, 
  Settings, 
  LogOut, 
  Loader2,
  ChevronLeft,
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Clock, 
  Target, 
  Award,
  Search,
  Filter,
  Lock,
  Play,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Info,
  X,
  Trash2,
  Menu,
  Star,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Layers,
  Dumbbell,
  BookMarked,
  Zap,
  HelpCircle,
  Mail,
  Phone,
  TrendingUp,
  ShieldCheck,
  User,
  BarChart3,
  Eye,
  EyeOff,
  Scale,
  Receipt,
  Sparkles,
  ArrowRight,
  Compass,
  RotateCw,
  Timer,
  Clock3,
  MessageSquare,
  Video,
  Flame,
  HeartPulse,
  Activity,
  Laptop,
  Code,
  MapPin,
  Building2,
  PieChart,
  Calculator,
  GraduationCap,
  Wrench,
  HardHat,
  Cpu,
  Sprout,
  Youtube,
  Send
} from 'lucide-react';
import { Toaster, toast, useToasterStore } from 'react-hot-toast';
import { useAuth } from './lib/AuthContext';
import { supabase } from './lib/supabase';
import { cn, getDirectImageUrl } from './lib/utils';
import { getStreakState, recordQuestionSolved, completeDailyGoalDirectly, StreakState } from './lib/streakManager';
import { StreakDetailModal } from './components/StreakDetailModal';
import { ExamReadinessCard } from './components/ExamReadinessCard';
import { SmartRecommendationCard } from './components/SmartRecommendationCard';
import { AIStudyPlanCard } from './components/AIStudyPlanCard';
import { DynamicVectorCard } from './components/DynamicVectorCard';
import { MouseTrackingCanvas } from './components/MouseTrackingCanvas';
import { VectorCursorFollower } from './components/VectorCursorFollower';
import { stagger } from './lib/animations';
import { StudyPlanView } from './StudyPlanView';
import { useActiveExamContext } from './lib/activeExamStore';
import { ActiveExamContextBar } from './components/ActiveExamContextBar';
import { useTheme } from './lib/themeStore';
import { getInstantQuestionsForTopic } from './lib/instantQuestionCompiler';
import { examService } from './lib/examService';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { useLanguage, toOdiaDigits } from './lib/LanguageContext';
import { translatePhrase } from './lib/i18n/phraseDictionary';
import { initLenis, destroyLenis } from './lib/lenisScroll';
import { QuestionBankReaderModal } from './components/QuestionBankReaderModal';
import { exportQuestionBankToPdf } from './lib/pdfExportEngine';
import { PdfExportGuideModal } from './components/PdfExportGuideModal';
import { 
  getQuestionBankVectorTheme, 
  getBankDisplayTagline, 
  VectorCoverTextureOverlay 
} from './lib/vectorCoverThemes';

const getPracticeModeVectorTheme = (modeId: string) => {
  switch (modeId) {
    case 'topic-wise':
      return {
        cardBg: 'bg-gradient-to-br from-white via-indigo-50/25 to-blue-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-indigo-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-indigo-300/80 dark:hover:border-blue-500/40',
        logoBg: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/70 text-[#2563EB] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/70',
        tagBg: 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-indigo-600 dark:group-hover:text-blue-400',
        watermarkColor: 'text-indigo-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20',
        badgeText: 'CHAPTER-WISE DRILLS',
        MainIcon: BookOpen,
        WatermarkIcon: Layers,
      };
    case 'exam-focused':
      return {
        cardBg: 'bg-gradient-to-br from-white via-amber-50/25 to-orange-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-amber-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-amber-300/80 dark:hover:border-amber-500/40',
        logoBg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-white shadow-lg shadow-amber-500/25 border border-amber-400/40',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/70',
        tagBg: 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
        watermarkColor: 'text-amber-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md shadow-amber-500/20',
        badgeText: 'HIGH YIELD TOPIC BANKS',
        MainIcon: Flame,
        WatermarkIcon: Zap,
      };
    case 'revision-sets':
      return {
        cardBg: 'bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-emerald-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-emerald-300/80 dark:hover:border-emerald-500/40',
        logoBg: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/40',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70',
        tagBg: 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        watermarkColor: 'text-emerald-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20',
        badgeText: 'DAILY SPEED QUIZZES',
        MainIcon: Timer,
        WatermarkIcon: Activity,
      };
    case 'pyq-collections':
      return {
        cardBg: 'bg-gradient-to-br from-white via-purple-50/25 to-pink-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-purple-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-purple-300/80 dark:hover:border-purple-500/40',
        logoBg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-rose-700 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/70',
        tagBg: 'bg-purple-50/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
        watermarkColor: 'text-purple-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/20',
        badgeText: '10-YR SOLVED PYQS',
        MainIcon: Award,
        WatermarkIcon: History,
      };
    default:
      return {
        cardBg: 'bg-gradient-to-br from-white via-indigo-50/25 to-blue-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-indigo-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-indigo-300/80 dark:hover:border-blue-500/40',
        logoBg: 'bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-lg shadow-brand-500/25 border border-brand-400/40',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70',
        tagBg: 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-brand-600 dark:group-hover:text-blue-400',
        watermarkColor: 'text-indigo-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20',
        badgeText: 'PRACTICE DRILLS',
        MainIcon: BookOpen,
        WatermarkIcon: Layers,
      };
  }
};

const getMockTestVectorTheme = (mockId: string) => {
  switch (mockId) {
    case 'full-length':
      return {
        cardBg: 'bg-gradient-to-br from-white via-amber-50/25 to-orange-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-amber-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-amber-300/80 dark:hover:border-amber-500/40',
        logoBg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-amber-700 text-white shadow-lg shadow-amber-500/25 border border-amber-400/40',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/70',
        tagBg: 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
        watermarkColor: 'text-amber-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md shadow-amber-500/20',
        badgeText: 'FULL-LENGTH SIMULATION',
        MainIcon: Award,
        WatermarkIcon: Sparkles,
      };
    case 'sectional':
      return {
        cardBg: 'bg-gradient-to-br from-white via-cyan-50/25 to-blue-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-blue-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-blue-300/80 dark:hover:border-blue-500/40',
        logoBg: 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/25 border border-cyan-400/40',
        badgeBg: 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/70',
        tagBg: 'bg-cyan-50/80 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        watermarkColor: 'text-blue-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-blue-500/20',
        badgeText: 'SECTIONAL SPEED DRILLS',
        MainIcon: Target,
        WatermarkIcon: BarChart3,
      };
    case 'pyq':
      return {
        cardBg: 'bg-gradient-to-br from-white via-purple-50/25 to-pink-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-purple-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-purple-300/80 dark:hover:border-purple-500/40',
        logoBg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-rose-700 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/70',
        tagBg: 'bg-purple-50/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
        watermarkColor: 'text-purple-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/20',
        badgeText: '10-YR SOLVED PAPERS',
        MainIcon: History,
        WatermarkIcon: BookOpen,
      };
    case 'daily':
      return {
        cardBg: 'bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-emerald-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-emerald-300/80 dark:hover:border-emerald-500/40',
        logoBg: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/40',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70',
        tagBg: 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        watermarkColor: 'text-emerald-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20',
        badgeText: 'DAILY / WEEKLY ASSESSMENTS',
        MainIcon: Timer,
        WatermarkIcon: Activity,
      };
    default:
      return {
        cardBg: 'bg-gradient-to-br from-white via-indigo-50/25 to-blue-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-indigo-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-indigo-300/80 dark:hover:border-blue-500/40',
        logoBg: 'bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-lg shadow-brand-500/25 border border-brand-400/40',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70',
        tagBg: 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-brand-600 dark:group-hover:text-blue-400',
        watermarkColor: 'text-indigo-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20',
        badgeText: 'MOCK TEST SERIES',
        MainIcon: Award,
        WatermarkIcon: Sparkles,
      };
  }
};

const getReferenceLibraryVectorTheme = (libraryId: string) => {
  switch (libraryId) {
    case 'topic-wise':
      return {
        cardBg: 'bg-gradient-to-br from-white via-indigo-50/25 to-blue-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-indigo-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-indigo-300/80 dark:hover:border-blue-500/40',
        logoBg: 'bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-800 text-white shadow-lg shadow-blue-500/25 border border-blue-400/40',
        badgeBg: 'bg-blue-50 dark:bg-blue-950/70 text-[#2563EB] dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/70',
        tagBg: 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
        watermarkColor: 'text-indigo-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-brand-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-500/20',
        badgeText: 'PDF TOPIC MODULES',
        MainIcon: Layers,
        WatermarkIcon: BookOpen,
      };
    case 'exam-focused':
      return {
        cardBg: 'bg-gradient-to-br from-white via-amber-50/25 to-orange-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-amber-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-amber-300/80 dark:hover:border-amber-500/40',
        logoBg: 'bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 text-white shadow-lg shadow-amber-500/25 border border-amber-400/40',
        badgeBg: 'bg-amber-50 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/70',
        tagBg: 'bg-amber-50/80 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-amber-600 dark:group-hover:text-amber-400',
        watermarkColor: 'text-amber-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-orange-500 text-white shadow-md shadow-amber-500/20',
        badgeText: 'HIGH YIELD REVISION',
        MainIcon: Target,
        WatermarkIcon: Zap,
      };
    case 'revision-sets':
      return {
        cardBg: 'bg-gradient-to-br from-white via-emerald-50/25 to-teal-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-emerald-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-emerald-300/80 dark:hover:border-emerald-500/40',
        logoBg: 'bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 text-white shadow-lg shadow-emerald-500/25 border border-emerald-400/40',
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/70',
        tagBg: 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
        watermarkColor: 'text-emerald-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20',
        badgeText: 'CONCEPT SUMMARIES',
        MainIcon: BookMarked,
        WatermarkIcon: FileText,
      };
    case 'pyq-collections':
      return {
        cardBg: 'bg-gradient-to-br from-white via-purple-50/25 to-pink-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-purple-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-purple-300/80 dark:hover:border-purple-500/40',
        logoBg: 'bg-gradient-to-br from-purple-600 via-pink-600 to-rose-700 text-white shadow-lg shadow-purple-500/25 border border-purple-400/40',
        badgeBg: 'bg-purple-50 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/70',
        tagBg: 'bg-purple-50/80 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
        watermarkColor: 'text-purple-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-md shadow-purple-500/20',
        badgeText: 'PAST PAPER ARCHIVES',
        MainIcon: History,
        WatermarkIcon: Award,
      };
    default:
      return {
        cardBg: 'bg-gradient-to-br from-white via-indigo-50/25 to-blue-50/30 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-indigo-100/90 dark:border-slate-800/90 shadow-[0_8px_30px_rgba(0,0,0,0.035)] hover:shadow-2xl hover:border-indigo-300/80 dark:hover:border-blue-500/40',
        logoBg: 'bg-gradient-to-br from-brand-600 to-indigo-700 text-white shadow-lg shadow-brand-500/25 border border-brand-400/40',
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/70',
        tagBg: 'bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60',
        countBg: 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700',
        titleHover: 'group-hover:text-brand-600 dark:group-hover:text-blue-400',
        watermarkColor: 'text-indigo-900/[0.04] dark:text-white/[0.07]',
        btnGradient: 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/20',
        badgeText: 'PDF REFERENCE LIBRARY',
        MainIcon: BookMarked,
        WatermarkIcon: BookOpen,
      };
  }
};
import { DEFAULT_ACHIEVERS_JOURNAL } from './lib/defaultAchievers';
import { useScrollSpy } from './hooks/useScrollSpy';
import { useCountdown } from './hooks/useCountdown';
import { scrollToElement, scrollToTop } from './lib/scrollManager';
import AnimatedRoutes from './components/AnimatedRoutes';
import { sectionReveal, sectionRevealSimple, sectionRevealScale, fadeSlideRight, scaleIn, barGrow, whileHover, whileTap, modalBackdrop, slideUpPanel, durations, easings } from './lib/animations';
import { ErrorBoundary } from './ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { activityTracker } from './lib/activityTracker';
import { activityMatchesExam } from './lib/examMatcher';
import { MathTextRenderer, DiagramRenderer } from './components/MathTextRenderer';

const AdminPanel = React.lazy(() => import('./AdminPanel'));
import MockTestSystem, { requestUniversalFullscreen } from './MockTestSystem';
const TestResultsView = React.lazy(() => import('./TestResultsView'));
import AnalyticsView from './AnalyticsView';
const AdminLoginPage = React.lazy(() => import('./pages/AdminLoginPage'));
const AdminDashboardPage = React.lazy(() => import('./pages/AdminDashboardPage'));
const PrivacyPolicy = React.lazy(() => import('./PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./TermsOfService'));
const RefundPolicy = React.lazy(() => import('./RefundPolicy'));
const SearchableSelect = React.lazy(() => import('./components/SearchableSelect'));
const YouTubeCarousel = React.lazy(() => import('./components/YouTubeCarousel'));
const BlogList = React.lazy(() => import('./pages/BlogList'));
const BlogPost = React.lazy(() => import('./pages/BlogPost'));
const CurrentAffairsPage = React.lazy(() => import('./pages/CurrentAffairs').then(m => ({ default: m.CurrentAffairsPage })));
const AiMentor = React.lazy(() => import('./pages/AiMentor'));
import { ROUTE_PATHS } from './lib/routes-config';
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
import StickyAICompanion from './components/StickyAICompanion';
import LoadingPortal from './components/LoadingPortal';
import PushPermissionPrompt from './components/PushPermissionPrompt';
import { registerServiceWorker } from './lib/pushNotifications';
import { WelcomeVideoModal } from './components/WelcomeVideoModal';
import { OnboardingTour } from './components/OnboardingTour';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { NotificationCenter } from './components/NotificationCenter';


const HistoryView = ({ 
  user, 
  onViewResults, 
  onResumeTest,
  onActivityDeleted,
  onNavigate
}: { 
  user: any, 
  onViewResults?: (results: any) => void, 
  onResumeTest?: (test: any, state: any) => void,
  onActivityDeleted?: () => void,
  onNavigate?: (tab: string) => void
}) => {
  const { t, isOdia } = useLanguage();
  const [activeContext] = useActiveExamContext();
  const [activities, setActivities] = useState<any[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'completed' | 'incomplete' | 'ai_quiz' | 'download'>('all');

  const loadActivities = useCallback(() => {
    const raw = activityTracker.getActivities(user?.id, user?.user_metadata);
    setActivities(raw);
  }, [user]);

  useEffect(() => {
    loadActivities();
    window.addEventListener('oep-activity-changed', loadActivities);
    return () => window.removeEventListener('oep-activity-changed', loadActivities);
  }, [loadActivities]);

  const examFilteredActivities = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    if (activeContext.activeExamId === 'all') return activities;
    return activities.filter(a => activityMatchesExam(a, activeContext.activeExamId, activeContext.activeExamName));
  }, [activities, activeContext.activeExamId, activeContext.activeExamName]);

  const handleDeleteActivity = async (activityId: string) => {
    if (!user?.id) return;
    await activityTracker.deleteActivity(user.id, activityId);
    setConfirmDeleteId(null);
    toast.success("Activity deleted from history");
    loadActivities();
    onActivityDeleted?.();
  };

  const handleClearAll = async () => {
    if (!user?.id) return;
    await activityTracker.clearActivities(user.id);
    setConfirmClearAll(false);
    toast.success("Activity history cleared");
    loadActivities();
    onActivityDeleted?.();
  };

  if (!examFilteredActivities || examFilteredActivities.length === 0) {
    return (
      <div className="relative w-full min-h-screen bg-[#F8FAFC] dark:bg-[#060B16]" style={{ isolation: 'isolate' }}>
        <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40 dark:opacity-30 pointer-events-none z-0" />
        <div className="fixed top-20 left-1/4 w-96 h-96 bg-brand-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-indigo-200/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="w-full mx-auto space-y-6 relative z-10">
          <ActiveExamContextBar />
          <div className="flex flex-col items-center justify-center p-8 sm:p-16 text-center space-y-6 bg-white dark:bg-[#0B1528] rounded-2xl sm:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-2xl dark:shadow-slate-950/80 relative overflow-hidden py-12 sm:py-16">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 dark:bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 shadow-inner mb-2">
              <History className="w-8 h-8 sm:w-10 sm:h-10 text-brand-600 dark:text-blue-400 animate-float-sm" />
            </div>

            <div className="space-y-3 relative z-10 max-w-sm sm:max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {t('history.empty.title', 'No History For This Exam')}
              </h2>
              <p className="text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-sm leading-relaxed">
                {t('history.empty.description', `No test attempts recorded under ${activeContext.activeExamName}. Switch to "All Exams Combined" or take a test for this target exam.`, { exam: activeContext.activeExamName })}
              </p>
            </div>

            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('home');
                  setTimeout(() => {
                    scrollToElement('exams', { block: 'start' });
                  }, 100);
                } else {
                  scrollToElement('exams', { block: 'start' });
                }
              }}
              className="relative z-10 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
            >
              {t('common.actions.exploreExams', 'Explore Mock Tests')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-[#F8FAFC] dark:bg-[#060B16]" style={{ isolation: 'isolate' }}>
      {/* Full-Screen Edge-to-Edge Academic Vector Canvas Grid & HSL Glows */}
      <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40 dark:opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-brand-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-indigo-200/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Floating Viewport Academic Study Vector Watermarks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <History className="absolute top-24 left-[5%] w-44 h-44 text-slate-800 opacity-[0.08] stroke-[1.2] rotate-12" />
        <Calendar className="absolute top-1/3 right-[5%] w-48 h-48 text-brand-600 opacity-[0.08] stroke-[1.2] -rotate-6" />
        <CheckCircle2 className="absolute bottom-1/3 left-[6%] w-44 h-44 text-amber-600 opacity-[0.08] stroke-[1.2] rotate-45" />
        <Clock className="absolute bottom-28 right-[6%] w-36 h-36 text-indigo-600 opacity-[0.08] stroke-[1.2] -rotate-12" />
      </div>

      <motion.div 
        variants={stagger.containerDelay(0.1, 0.1)}
        initial="hidden"
        animate="show"
        className="w-full mx-auto space-y-4 sm:space-y-8 pb-4 sm:pb-8 relative z-10"
      >
        {/* Executive Bright Study Vector Header Card */}
        <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.30)">
          <div className="p-3.5 sm:p-8 bg-white/88 dark:bg-slate-900/88 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden z-10">
            {/* Radial Grid & Floating Header Watermark */}
            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-[0.04] pointer-events-none" />
            <History className="absolute -right-8 -bottom-8 w-52 h-52 sm:w-64 sm:h-64 opacity-10 dark:opacity-15 stroke-[1.2] text-brand-600 dark:text-indigo-300 pointer-events-none rotate-12" />

            <div className="flex items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-brand-500 via-indigo-600 to-brand-700 text-white flex items-center justify-center shrink-0 shadow-md sm:shadow-lg shadow-brand-500/25 border border-white/40">
                  <History className="w-5 h-5 sm:w-7 sm:h-7 stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-3xl font-black text-slate-955 dark:text-white tracking-tight leading-tight uppercase truncate">
                    {t('nav.history', 'Activity History')}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] sm:text-sm font-medium mt-0.5 sm:mt-1 truncate sm:whitespace-normal">
                    <span className="inline sm:hidden">{t('history.header.subtitleMobile', 'Manage and track your exam sessions')}</span>
                    <span className="hidden sm:inline">{t('history.header.subtitle', 'Manage, review, and track all your exam practice sessions')}</span>
                  </p>
                </div>
              </div>

              {examFilteredActivities.length > 0 && (
                <div className="shrink-0">
                  {confirmClearAll ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <button
                        onClick={async () => { await handleClearAll(); }}
                        className="px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider cursor-pointer border-none shadow-sm active:scale-95 transition-all"
                      >
                        {t('history.header.confirmShort', 'Confirm')}
                      </button>
                      <button
                        onClick={() => setConfirmClearAll(false)}
                        className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs font-black uppercase tracking-wider cursor-pointer border-none active:scale-95 transition-all"
                      >
                        {t('history.header.cancel', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmClearAll(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200/80 dark:border-slate-700 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
                      <span className="inline sm:hidden">{t('history.header.clearShort', 'Clear All')}</span>
                      <span className="hidden sm:inline">{t('history.header.clearAll', 'Clear All History')}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </DynamicVectorCard>

        {/* Hero Context Bar for Multi-Exam Context Selection */}
        <ActiveExamContextBar />

        {/* Filter Pills Bar */}
        {examFilteredActivities.length > 0 && (() => {
          const filterCounts = {
            all:        examFilteredActivities.length,
            completed:  examFilteredActivities.filter(a => !!a.metadata && a.type !== 'question_bank_accessed' && a.type !== 'test_incomplete' && a.type !== 'practice_test_completed').length,
            incomplete: examFilteredActivities.filter(a => a.type === 'test_incomplete').length,
            ai_quiz:    examFilteredActivities.filter(a => a.type === 'practice_test_completed').length,
            download:   examFilteredActivities.filter(a => a.type === 'question_bank_accessed').length,
          };
          const filters: { id: typeof activeFilter; label: string; icon: React.ReactNode }[] = [
            { id: 'all',        label: 'All',        icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
            { id: 'completed',  label: 'Completed',  icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
            { id: 'incomplete', label: 'Incomplete', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'ai_quiz',    label: 'AI Quiz',    icon: <Sparkles className="w-3.5 h-3.5" /> },
            { id: 'download',   label: 'Downloads',  icon: <Download className="w-3.5 h-3.5" /> },
          ];
          return (
            <div 
              className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5"
            >
              {filters.map(f => {
                const count = filterCounts[f.id];
                const isActive = activeFilter === f.id;
                return (
                  <motion.button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    disabled={count === 0}
                    whileTap={count > 0 ? { scale: 0.94 } : undefined}
                    className={cn(
                      "relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-[10.5px] sm:text-xs font-black whitespace-nowrap border shrink-0 overflow-hidden transition-all duration-200 shadow-2xs",
                      isActive
                        ? "text-white border-brand-600 shadow-md shadow-brand-500/20"
                        : count === 0
                          ? "bg-slate-100/60 dark:bg-slate-900/40 text-slate-300 dark:text-slate-600 border-slate-200/50 dark:border-slate-800 cursor-not-allowed"
                          : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-700 hover:border-brand-300 dark:hover:border-indigo-500 hover:text-brand-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="historyFilterActivePill"
                        className="absolute inset-0 bg-gradient-to-r from-brand-600 to-indigo-600"
                        transition={{ type: 'spring', stiffness: 400, damping: 30, mass: 0.8 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                      <span className="[&>svg]:w-3 [&>svg]:h-3 sm:[&>svg]:w-3.5 sm:[&>svg]:h-3.5 shrink-0">{f.icon}</span>
                      <span className="uppercase tracking-wider font-mono">{f.label}</span>
                      <span className={cn(
                        "px-1.5 sm:px-2 py-0.5 rounded sm:rounded-md text-[9px] sm:text-[10px] font-mono font-black min-w-[16px] sm:min-w-[20px] text-center",
                        isActive ? "bg-white/25 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      )}>{count}</span>
                    </span>
                  </motion.button>
                );
              })}
            </div>
          );
        })()}

        {/* Activity Cards List */}
        {(() => {
          const filteredActivities = examFilteredActivities.filter(a => {
            if (activeFilter === 'all')        return true;
            if (activeFilter === 'completed')  return !!a.metadata && a.type !== 'question_bank_accessed' && a.type !== 'test_incomplete' && a.type !== 'practice_test_completed';
            if (activeFilter === 'incomplete') return a.type === 'test_incomplete';
            if (activeFilter === 'ai_quiz')    return a.type === 'practice_test_completed';
            if (activeFilter === 'download')   return a.type === 'question_bank_accessed';
            return true;
          });
          return (
            <AnimatePresence mode="wait" initial={false}>
              {filteredActivities.length === 0 ? (
                <motion.div
                  key={`empty-${activeFilter}`}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-slate-800 flex items-center justify-center border border-brand-100 dark:border-slate-700">
                    <History className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                  </div>
                  <p className="text-base font-bold text-slate-600 dark:text-slate-300">No {activeFilter === 'ai_quiz' ? 'AI Quiz' : activeFilter} history recorded yet</p>
                  <button onClick={() => setActiveFilter('all')} className="text-xs font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 hover:text-brand-700 transition-colors cursor-pointer border-none bg-transparent">View All History</button>
                </motion.div>
              ) : (
                <motion.div
                  key={activeFilter}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, transition: { duration: 0.14 } }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-1 gap-2.5 sm:gap-3.5"
                >
                  {filteredActivities.map((a, i) => {
                    const isTestResult = !!a.metadata && a.type !== 'question_bank_accessed';
                    const isAiQuiz = a.type === 'practice_test_completed';
                    const isDownloadable = a.type === 'question_bank_accessed' && !!a.metadata?.pdfUrl;
                    const isInteractive = isTestResult || isDownloadable || a.type === 'test_incomplete';

                    const d = new Date(a.timestamp);
                    const compactDate =
                      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
                      ' · ' +
                      d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

                    const titleText =
                      !isNaN(Number(a.title)) && a.metadata?.testCategory?.toLowerCase().includes('mock')
                        ? `Mock Test #${a.title}`
                        : a.title;

                    const cardGlow =
                      a.type === 'test_incomplete' ? 'rgba(245, 158, 11, 0.28)' :
                      isAiQuiz ? 'rgba(168, 85, 247, 0.28)' :
                      isDownloadable ? 'rgba(37, 99, 235, 0.28)' :
                      'rgba(16, 185, 129, 0.28)';

                    return (
                      <DynamicVectorCard key={a.id || i} glowColor={cardGlow} roundedClass="rounded-xl sm:rounded-2xl" className="w-full">
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.03, duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                          onClick={() => {
                            if (isDownloadable) {
                              window.open(a.metadata.pdfUrl, '_blank');
                            } else if (a.type === 'test_incomplete' && onResumeTest) {
                              onResumeTest(a.metadata?.test || { title: a.title }, a.metadata || a);
                            } else if (isTestResult && onViewResults) {
                              onViewResults(a.metadata);
                            }
                          }}
                          className={cn(
                            "relative overflow-hidden bg-white dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-4.5 shadow-sm dark:shadow-none border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2 sm:gap-3 group transition-all duration-300 text-slate-900 dark:text-white",
                            isInteractive
                              ? a.type === 'test_incomplete'
                                ? "cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/40"
                                : isAiQuiz
                                  ? "cursor-pointer hover:border-purple-300 dark:hover:border-purple-500/40"
                                  : isDownloadable
                                    ? "cursor-pointer hover:border-blue-300 dark:hover:border-blue-500/40"
                                    : "cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500/40"
                              : ""
                          )}
                        >
                          {/* Radial Grid & Floating Background Watermark Icon */}
                          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-[0.04] pointer-events-none z-0" />
                          
                          {a.type === 'test_incomplete' ? (
                            <Clock className="absolute -right-3 -bottom-3 w-28 h-28 sm:w-36 sm:h-36 opacity-10 stroke-[1.2] text-amber-500 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />
                          ) : isAiQuiz ? (
                            <Sparkles className="absolute -right-3 -bottom-3 w-28 h-28 sm:w-36 sm:h-36 opacity-10 stroke-[1.2] text-purple-500 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />
                          ) : isDownloadable ? (
                            <Download className="absolute -right-3 -bottom-3 w-28 h-28 sm:w-36 sm:h-36 opacity-10 stroke-[1.2] text-blue-500 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />
                          ) : (
                            <CheckCircle2 className="absolute -right-3 -bottom-3 w-28 h-28 sm:w-36 sm:h-36 opacity-10 stroke-[1.2] text-emerald-500 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />
                          )}

                          {/* Confirm delete overlay */}
                          {confirmDeleteId === a.id && (
                            <div
                              className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center gap-2.5 px-4 z-30 rounded-[inherit]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white text-center">Delete this activity from history?</span>
                              <div className="flex gap-2.5">
                                <button
                                  onClick={async () => { await handleDeleteActivity(a.id); }}
                                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black uppercase tracking-wider cursor-pointer border-none shadow-md active:scale-95 transition-all"
                                >
                                  {t('history.actions.delete', 'Delete')}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-3.5 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-wider cursor-pointer border-none active:scale-95 transition-all"
                                >
                                  {t('history.header.cancel', 'Cancel')}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Tier 1 — Status Icon, Title & Actions */}
                          <div className="relative z-10 flex items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                              <div className={cn(
                                "w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl shrink-0 shadow-2xs border flex items-center justify-center",
                                a.type === 'test_incomplete' ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                                isAiQuiz ? "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800" :
                                isDownloadable ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                                "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                              )}>
                                {a.type === 'test_incomplete' ? <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                                 isAiQuiz ? <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                                 isDownloadable ? <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> :
                                 <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <h4 className={cn(
                                  "font-bold text-slate-900 dark:text-white text-[13px] sm:text-base leading-snug tracking-tight transition-colors line-clamp-1",
                                  a.type === 'test_incomplete'
                                    ? "group-hover:text-amber-600 dark:group-hover:text-amber-400"
                                    : isAiQuiz
                                      ? "group-hover:text-purple-600 dark:group-hover:text-purple-400"
                                      : isDownloadable
                                        ? "group-hover:text-blue-600 dark:group-hover:text-blue-400"
                                        : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                                )}>
                                  {titleText}
                                </h4>
                                {/* Desktop date shown under title */}
                                <div className="hidden sm:flex items-center gap-1.5 mt-0.5">
                                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{compactDate}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              {/* Desktop CTA Action Button */}
                              {(isTestResult || a.type === 'test_incomplete') && (
                                <div className={cn(
                                  "hidden sm:flex px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider items-center gap-1.5 transition-all shadow-2xs border",
                                  a.type === 'test_incomplete'
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800 group-hover:bg-amber-600 group-hover:text-white"
                                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 group-hover:bg-emerald-600 dark:group-hover:bg-emerald-500 group-hover:text-white"
                                )}>
                                  <span>{a.type === 'test_incomplete' ? t('history.actions.resume', 'Resume') : t('history.actions.viewResults', 'View Results')}</span>
                                  {a.type === 'test_incomplete' ? <Play className="w-3 h-3 fill-current" /> : <ChevronRight className="w-3 h-3" />}
                                </div>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(a.id); }}
                                className="p-1 sm:p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer border-none bg-transparent shrink-0"
                                title="Delete activity"
                              >
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Tier 2 — Mobile Date & Category Badges */}
                          <div className="relative z-10 flex flex-wrap items-center gap-1.5">
                            {/* Mobile-only compact date pill */}
                            <div className="flex sm:hidden items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9.5px] font-semibold">
                              <Clock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                              <span>{compactDate}</span>
                            </div>

                            {a.metadata?.testCategory && (
                              <span className={cn(
                                "px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[9.5px] font-mono font-black uppercase tracking-wider border",
                                a.type === 'test_incomplete' ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800" :
                                isAiQuiz ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800" :
                                isDownloadable ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800" :
                                "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                              )}>
                                {a.metadata.testCategory}
                              </span>
                            )}
                            {a.metadata?.examName && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 rounded-md text-[9px] sm:text-[9.5px] font-semibold uppercase tracking-wider border border-slate-200/60 dark:border-slate-700/60 max-w-[120px] sm:max-w-[180px] truncate" title={a.metadata.examName}>
                                {a.metadata.examName}
                              </span>
                            )}
                            {a.type === 'test_incomplete' && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-md text-[9px] sm:text-[9.5px] font-mono font-black uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                                {t('history.status.incomplete', 'Incomplete')}
                              </span>
                            )}
                            {a.type === 'question_bank_accessed' && (
                              <span className="px-1.5 sm:px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-md text-[9px] sm:text-[9.5px] font-mono font-black uppercase tracking-wider border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                                <Download className="w-2.5 h-2.5" />
                                {isDownloadable ? t('history.status.downloadAvailable', 'Download Available') : t('history.status.pdfDownloaded', 'PDF Downloaded')}
                              </span>
                            )}
                          </div>

                          {/* Tier 3 — Scores & Mobile Action Button */}
                          <div className="relative z-10 flex items-center justify-between gap-2 pt-2 sm:pt-2.5 border-t border-slate-100 dark:border-slate-800">
                            <div>
                              {a.type === 'test_incomplete' && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 rounded-md sm:rounded-lg border border-amber-200 dark:border-amber-800">
                                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-600 dark:text-amber-400" />
                                  <span className="text-[10px] sm:text-[11px] font-mono font-black text-amber-700 dark:text-amber-300">
                                    {Object.keys(a.metadata?.answers || {}).length} {t('history.stats.answered', 'answered')}
                                  </span>
                                </div>
                              )}
                              {((isTestResult || isAiQuiz) && a.score !== undefined && a.score !== null) && (
                                <div className="flex items-baseline gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800/80 rounded-md sm:rounded-lg border border-slate-200/80 dark:border-slate-700">
                                  <span className="font-mono font-black text-slate-900 dark:text-white text-xs sm:text-base">
                                    {typeof a.score === 'number' ? Number(a.score.toFixed(2)) : a.score}
                                  </span>
                                  <span className="text-slate-400 dark:text-slate-400 text-[9px] sm:text-[11px] font-mono font-bold">/{a.totalMarks}</span>
                                  {!isAiQuiz && (
                                    <span className="ml-1 text-[9px] sm:text-[10px] font-mono font-black text-brand-600 dark:text-brand-400">
                                      · {Math.round(a.accuracy || 0)}%
                                    </span>
                                  )}
                                </div>
                              )}
                              {isDownloadable && (
                                <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                                  PDF Document
                                </div>
                              )}
                            </div>

                            {/* Mobile-only Action CTA Button */}
                            <div className="flex sm:hidden items-center">
                              {(isTestResult || a.type === 'test_incomplete') && (
                                <div className={cn(
                                  "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-2xs border",
                                  a.type === 'test_incomplete'
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                )}>
                                  <span>{a.type === 'test_incomplete' ? t('history.actions.resume', 'Resume') : t('history.actions.viewResults', 'View Results')}</span>
                                  {a.type === 'test_incomplete' ? <Play className="w-2.5 h-2.5 fill-current" /> : <ChevronRight className="w-2.5 h-2.5" />}
                                </div>
                              )}
                              {isDownloadable && (
                                <div className="px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shadow-2xs">
                                  <span>{t('history.actions.openPdf', 'Open PDF')}</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      </DynamicVectorCard>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })()}
      </motion.div>
    </div>
  );
};

// --- Razorpay Helper ---
const loadRazorpay = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// --- Components ---

export const Button = ({ 
  children, 
  className, 
  variant = 'primary', 
  ...props 
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' }) => {
  const variants = {
    primary: 'premium-gradient text-white shadow-lg shadow-brand-500/20 hover:premium-glow hover:scale-[1.03] active:scale-95',
    secondary: 'glass text-brand-600 hover:bg-brand-50 border-brand-100 shadow-sm hover:scale-[1.02] active:scale-95',
    outline: 'bg-transparent border-2 border-slate-200 hover:border-brand-400 hover:text-brand-600 text-slate-700 active:scale-95',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 active:scale-95'
  };

  return (
    <button 
      className={cn(
        'px-6 py-3 rounded-2xl font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Card = ({ children, className, ...props }: { children: React.ReactNode, className?: string } & React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('glass rounded-2xl premium-shadow hover:shadow-xl transition-all duration-500 overflow-hidden', className)} {...props}>
    {children}
  </div>
);

export const UserAvatar = ({ 
  user, 
  profile, 
  className, 
  size = 'md' 
}: { 
  user?: any, 
  profile?: any, 
  className?: string, 
  size?: 'sm' | 'md' | 'lg' | 'xl' 
}) => {
  const [imgError, setImgError] = React.useState(false);
  
  const photoURL = profile?.photoURL || user?.user_metadata?.avatar_url;
  const displayName = profile?.displayName || user?.user_metadata?.full_name || user?.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
    xl: 'w-20 h-20 text-2xl'
  };

  const initialView = (
    <div className={cn(
      "rounded-xl flex items-center justify-center font-black text-white premium-gradient shadow-inner select-none",
      sizeClasses[size],
      className
    )}>
      <span className="drop-shadow-md">{initial}</span>
    </div>
  );

  if (!photoURL || imgError) {
    return initialView;
  }

  return (
    <div className={cn("relative overflow-hidden rounded-xl border border-slate-200/50 bg-white shadow-sm", sizeClasses[size], className)}>
      <img 
        src={photoURL} 
        alt={displayName} 
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const VisualEffects = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden hidden md:block">
    <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 bg-brand-400/20 rounded-full animate-float-slow transform-gpu" />
    <div className="absolute top-3/4 left-1/2 w-2 h-2 bg-indigo-400/20 rounded-full animate-float-delayed transform-gpu" />
    <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-purple-400/20 rounded-full animate-float-slow transform-gpu" style={{ animationDelay: '-4s' }} />
    <div className="absolute bottom-1/4 right-1/3 w-2.5 h-2.5 bg-brand-400/10 rounded-full animate-float-delayed transform-gpu" style={{ animationDelay: '-1s' }} />
    <div className="absolute inset-0 grid-bg opacity-[0.03]" />
  </div>
);

// --- Sections ---

// --- Custom Portal Sections (Refined Educational Editorial) ---

const EXAM_REGISTRY_STATUS_MAP: Record<string, { label: string; color: string }> = {
  'notification': { label: 'Notification Released', color: 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  'admit-card':   { label: 'Admit Card Out',        color: 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  'applications': { label: 'Applications Active',   color: 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  'result':       { label: 'Result Declared',       color: 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  'postponed':    { label: 'Postponed',             color: 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  'upcoming':     { label: 'Upcoming',              color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

const EXAM_REGISTRY_STATUS_COLOR_MAP: Record<string, string> = {
  'notification': 'border-l-emerald-500',
  'admit-card':   'border-l-amber-500',
  'applications': 'border-l-blue-500',
  'result':       'border-l-purple-500',
  'postponed':    'border-l-rose-500',
  'upcoming':     'border-l-slate-400',
};

const EXAM_REGISTRY_DEFAULT = [
  { exam: 'OPSC Civil Services Examination (OCS)', status: 'notification', date: 'Prelims: July 15, 2026', actionLabel: 'Practice OPSC', examKey: 'opsc' },
  { exam: 'OSSC Combined Graduate Level (CGL)', status: 'admit-card', date: 'Exam: June 28, 2026', actionLabel: 'Practice OSSC', examKey: 'ossc' },
  { exam: 'OSSSC RI/ARI & Amin Recruitment', status: 'applications', date: 'Closing: June 30, 2026', actionLabel: 'Practice OSSSC', examKey: 'osssc' },
];

const ExamRegistrySection = ({ 
  setSelectedExam, 
  exams 
}: { 
  setSelectedExam: (id: string | null) => void; 
  exams: any[] 
}) => {
  const { t, isOdia } = useLanguage();
  const [announcements, setAnnouncements] = useState<any[]>(EXAM_REGISTRY_DEFAULT);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    examService.getAllExams().then((allExams: any[]) => {
      const setting = allExams.find((e: any) => e.name === 'SYSTEM_SETTINGS_EXAM_REGISTRY');
      if (setting && setting.description) {
        try {
          const parsed = JSON.parse(setting.description);
          if (Array.isArray(parsed) && parsed.length > 0) setAnnouncements(parsed);
        } catch (e) { /* keep defaults */ }
      }
    }).catch(() => { /* keep defaults */ });
  }, []);

  const handlePracticeClick = (item: any) => {
    const key = (item.examKey || '').toLowerCase();
    let matched = null;

    // First: try direct UUID match (new format — admin picked a real exam ID)
    if (item.examKey) {
      matched = exams.find(e => e.id === item.examKey);
    }

    // Fallback: legacy keyword matching (opsc/ossc/osssc/police/forest)
    if (!matched) {
      if (key === 'opsc') matched = exams.find(e => e.name.toLowerCase().includes('opsc'));
      else if (key === 'osssc') matched = exams.find(e => e.name.toLowerCase().includes('osssc'));
      else if (key === 'ossc') matched = exams.find(e => e.name.toLowerCase().includes('ossc') && !e.name.toLowerCase().includes('osssc'));
      else if (key === 'police') matched = exams.find(e => e.name.toLowerCase().includes('police'));
      else if (key === 'forest') matched = exams.find(e => e.name.toLowerCase().includes('forest'));
      else {
        // Last resort: fuzzy match from the exam name text
        const nameLower = (item.exam || '').toLowerCase();
        if (nameLower.includes('opsc')) matched = exams.find(e => e.name.toLowerCase().includes('opsc'));
        else if (nameLower.includes('osssc')) matched = exams.find(e => e.name.toLowerCase().includes('osssc'));
        else if (nameLower.includes('ossc')) matched = exams.find(e => e.name.toLowerCase().includes('ossc') && !e.name.toLowerCase().includes('osssc'));
      }
    }

    if (matched) setSelectedExam(matched.id);
    else if (key === 'opsc' || (item.exam || '').toLowerCase().includes('opsc')) setSelectedExam('opsc-aio');
  };
  return (
    <section id="exam-registry" className={cn("bg-transparent border-y border-slate-200/50 dark:border-slate-800 scroll-mt-24", isMobile ? "py-6" : "py-12 md:py-16")}>
      <div className={cn("max-w-7xl mx-auto space-y-4 sm:space-y-8 md:space-y-12", isMobile ? "px-4" : "px-6")}>
        <div className="flex flex-col items-center space-y-2.5 sm:space-y-4 text-center">
          <span className="section-chip text-[10px] sm:text-xs">
            {t('home.bulletin.sectionBadge', '⏰ ODISHA RECRUITMENT BULLETIN')}
          </span>
          <h2 className={cn("font-serif font-extrabold text-slate-955 dark:text-white tracking-tight leading-[1.18]", isMobile ? "text-2xl xs:text-3xl" : "text-3xl md:text-5xl")}>
            {t('home.bulletin.title1', 'Official Exam Notifications')}{" "}
            <span className="premium-text-gradient font-serif font-extrabold">
              {t('home.bulletin.title2', '& Targeted Mock Tests')}
            </span>
          </h2>
          {isMobile ? null : <div className="section-divider" />}
          {/* Mobile Version (Shorter & Punchier) */}
          <p className="block md:hidden text-xs leading-relaxed text-slate-500 font-medium max-w-xl mx-auto px-2">
            {t('home.bulletin.subtitle', 'Never miss an OPSC, OSSC, or OSSSC deadline. Get real-time updates and syllabus-specific tests.')}
          </p>
          {/* Desktop Version (Optimized) */}
          <p className="max-w-2xl mx-auto md:text-lg md:leading-relaxed text-slate-600 dark:text-slate-300 hidden md:block">
            {t('home.bulletin.subtitle', 'Never miss a crucial deadline. Track real-time OPSC, OSSC, and OSSSC updates and instantly unlock syllabus-specific test series.')}
          </p>
        </div>

        <div className={cn(
          "flex flex-col items-center w-full",
          isMobile ? "gap-2.5" : "gap-6 md:items-stretch md:gap-0 md:bg-white dark:md:bg-slate-900/90 md:border-2 md:border-slate-900/80 dark:md:border-slate-700/80 md:rounded-[2.5rem] md:overflow-hidden md:shadow-[6px_6px_0px_rgba(37,99,235,0.15)] dark:md:shadow-[8px_8px_0px_rgba(37,99,235,0.4)] md:divide-y-2 md:divide-slate-100 dark:md:divide-slate-800"
        )}>
          {announcements.map((item, idx) => {
            const statusMeta = EXAM_REGISTRY_STATUS_MAP[item.status] || {
              label: item.status,
              color: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            };
            const statusBorderColor = EXAM_REGISTRY_STATUS_COLOR_MAP[item.status] || 'border-l-slate-400';
            return (
              <div 
                key={idx} 
                className={cn(
                  "w-full flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:justify-between bg-white dark:bg-slate-900 premium-shine-container",
                  isMobile 
                    ? cn("p-4 border border-slate-200/70 dark:border-slate-800 border-l-4 rounded-xl shadow-xs gap-3.5", statusBorderColor)
                    : "p-6 sm:p-8 border-2 border-slate-900/80 dark:border-slate-800 rounded-3xl md:rounded-none md:border-none shadow-[4px_4px_0px_rgba(37,99,235,0.15)] md:shadow-none hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors gap-6"
                )}
              >
                <div className={cn("w-full", isMobile ? "space-y-1.5" : "space-y-3")}>
                  <div className={cn("flex flex-wrap items-center gap-2", isMobile ? "justify-start" : "justify-center md:justify-start")}>
                    <span className={cn("px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider border", statusMeta.color)}>
                      {t(`home.bulletin.status.${item.status}`, statusMeta.label)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-300 font-mono">
                      {isOdia && translatePhrase(item.date) ? translatePhrase(item.date) : item.date}
                    </span>
                  </div>
                  <h3 className={cn("font-serif font-extrabold text-slate-900 dark:text-white", isMobile ? "text-[14px] text-left leading-snug" : "text-lg sm:text-xl text-center md:text-left")}>
                    {isOdia && translatePhrase(item.exam) ? translatePhrase(item.exam) : item.exam}
                  </h3>
                </div>
                <button 
                  onClick={() => handlePracticeClick(item)}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-5 transition-all cursor-pointer w-full md:w-auto font-black uppercase tracking-widest text-xs rounded-xl border-2 transition-all duration-200 shrink-0",
                    isMobile
                      ? "h-11 bg-[#2563EB] hover:bg-brand-600 text-white border-[#2563EB] shadow-xs active:scale-[0.97]"
                      : "py-3 bg-[#2563EB] dark:bg-[#2563EB] hover:bg-brand-500 dark:hover:bg-brand-500 text-white border-slate-900 dark:border-slate-700 shadow-[4px_4px_0px_rgba(15,23,42,1)] dark:shadow-[4px_4px_0px_rgba(37,99,235,0.4)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
                  )}
                >
                  {item.actionLabel ? (isOdia && translatePhrase(item.actionLabel) ? translatePhrase(item.actionLabel) : item.actionLabel) : t('home.bulletin.freeTest', 'FREE TEST →')}
                  {isMobile ? null : <ArrowRight className="w-4 h-4 text-white" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const SYLLABUS_ROADMAPS_DEFAULT = [
  {
    id: 'gs',
    label: 'General Studies',
    topics: [
      { name: 'Odisha History & Heritage', count: 12, label: 'Crucial for OPSC Prelims' },
      { name: 'Indian Constitution & Polity', count: 8, label: 'Core Weightage' },
      { name: 'Geography of Odisha & Climate', count: 10, label: 'High-scoring Section' },
      { name: 'General Science & Technology', count: 15, label: 'Daily Current Mappings' },
    ],
  },
  {
    id: 'lang',
    label: 'Language Core',
    topics: [
      { name: 'Odia Grammar & Composition', count: 8, label: 'OSSC CGL Compulsory' },
      { name: 'English Comprehension', count: 6, label: 'Vocabulary & Common Errors' },
      { name: 'Translation & Precise Writing', count: 4, label: 'Mains Answer Prep' },
    ],
  },
  {
    id: 'quant',
    label: 'Aptitude & DI',
    topics: [
      { name: 'Number System & Arithmetic', count: 14, label: 'OSSSC Exam Primary Focus' },
      { name: 'Logical Reasoning & Analogies', count: 12, label: 'Timer Speed Practice' },
      { name: 'Data Interpretation (DI) Charts', count: 9, label: 'High-level Practice Sets' },
    ],
  },
];const SyllabusPathsSection = () => {
  const { t, isOdia } = useLanguage();
  const [tabs, setTabs] = useState<any[]>(SYLLABUS_ROADMAPS_DEFAULT);
  const [activeTabIdx, setActiveTabIdx] = useState(0);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    examService.getAllExams().then((allExams: any[]) => {
      const setting = allExams.find((e: any) => e.name === 'SYSTEM_SETTINGS_SYLLABUS_ROADMAPS');
      if (setting && setting.description) {
        try {
          const parsed = JSON.parse(setting.description);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTabs(parsed);
            setActiveTabIdx(0);
          }
        } catch (e) { /* keep defaults */ }
      }
    }).catch(() => { /* keep defaults */ });
  }, []);

  const activeTab = tabs[activeTabIdx] || tabs[0];

  return (
    <section id="syllabus-paths" className={cn("scroll-mt-24", isMobile ? "py-6" : "py-12 md:py-16")}>
      <div className={cn("max-w-7xl mx-auto space-y-4 sm:space-y-8 md:space-y-12", isMobile ? "px-4" : "px-6")}>
        <div className="flex flex-col items-center space-y-2.5 sm:space-y-4 text-center">
          <span className="section-chip text-[10px] sm:text-xs">
            {t('exams.syllabus.badge', '🎯 SYLLABUS-MAPPED PREPARATION')}
          </span>
          <h2 className={cn("font-serif font-extrabold text-slate-955 dark:text-white tracking-tight leading-[1.18] max-w-6xl", isMobile ? "text-2xl xs:text-3xl" : "text-3xl md:text-4xl")}>
            {t('exams.syllabus.title', 'Master Every Topic with Targeted Chapter-Wise Tests')}
          </h2>
          {!isMobile && <div className="section-divider" />}
          {/* Mobile Version (Shorter) */}
          <p className="block md:hidden text-xs leading-relaxed text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto px-1">
            {t('exams.syllabus.subtitle', 'Stop blindly studying. Unlock full-length mock tests and PYQs designed exactly for the OPSC and OSSC curriculum.')}
          </p>
          {/* Desktop Version (Optimized) */}
          <p className="max-w-2xl mx-auto md:text-lg md:leading-relaxed text-slate-600 dark:text-slate-300 hidden md:block">
            {t('exams.syllabus.subtitleDesktop', 'Stop blindly studying. Master Odisha History to Indian Polity with full-length mock tests and PYQs mapped exactly to the OPSC and OSSC curriculum.')}
          </p>
        </div>

        <div 
          className={cn(
            "flex justify-start sm:justify-center max-w-3xl mx-auto relative z-10",
            isMobile 
              ? "gap-1.5 p-1 bg-slate-100/70 dark:bg-slate-800/60 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex-nowrap overflow-x-auto no-scrollbar w-full"
              : "gap-2 sm:gap-4 p-1.5 bg-slate-100/60 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex-wrap"
          )}
        >
          {tabs.map((tab, i) => {
            const isTabActive = activeTabIdx === i;
            return (
              <button
                key={tab.id || i}
                onClick={() => setActiveTabIdx(i)}
                className={cn(
                  "py-2 sm:py-2.5 transition-all cursor-pointer relative focus:outline-none shrink-0",
                  isMobile
                    ? "px-3.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                    : "flex-grow min-w-[100px] rounded-xl text-xs font-black uppercase tracking-widest",
                  isTabActive
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {isTabActive && (
                  <motion.div
                    layoutId="activeSyllabusTabBg"
                    className={cn(
                      "absolute inset-0 bg-white dark:bg-slate-900 shadow-sm border z-0",
                      isMobile ? "rounded-lg border-slate-200/60 dark:border-slate-700" : "rounded-xl border-slate-200 dark:border-slate-700"
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Pathway List */}
        {activeTab && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab.id || activeTabIdx}
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3.5 md:gap-4 max-w-7xl mx-auto"
            >
              {(activeTab.topics || []).map((topic: any, i: number) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
                  }}
                >
                  <DynamicVectorCard
                    className={cn(
                      isMobile 
                        ? "bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 border-l-4 border-l-[#2563EB] rounded-xl p-3.5 shadow-xs flex items-center justify-between gap-3 relative active:scale-[0.98] transition-transform duration-200"
                        : "bg-white dark:bg-slate-900 border-2 border-slate-900/80 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-[4px_4px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_rgba(37,99,235,0.4)] flex items-start justify-between gap-4"
                    )}
                  >
                    <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1 pr-1">
                      <p className={cn(
                        "font-black uppercase text-[#2563EB] dark:text-brand-400 truncate",
                        isMobile ? "text-[9px] tracking-wider" : "text-[10px] tracking-wider"
                      )}>
                        {topic.label}
                      </p>
                      <h3 className={cn(
                        "font-serif font-extrabold text-slate-900 dark:text-white leading-tight",
                        isMobile ? "text-[13.5px]" : "text-base sm:text-lg"
                      )}>
                        {topic.name}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={cn(
                        "inline-flex bg-brand-50 dark:bg-brand-950/60 text-[#2563EB] dark:text-brand-300 rounded font-mono font-black uppercase border border-brand-100 dark:border-brand-800",
                        isMobile ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-xs"
                      )}>
                        {topic.count} Sets
                      </span>
                    </div>
                  </DynamicVectorCard>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

const AchieversJournalSection = () => {
  const { t, isOdia } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'all' | 'opsc' | 'ossc' | 'osssc'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(4);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const [stories, setStories] = useState<any[]>(DEFAULT_ACHIEVERS_JOURNAL);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data } = await supabase
          .from('exams')
          .select('description')
          .eq('name', 'SYSTEM_SETTINGS_ACHIEVERS_JOURNAL')
          .single();
        if (data && data.description) {
          const parsed = JSON.parse(data.description);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStories(parsed);
          }
        }
      } catch (e) {
        console.error("Failed to load dynamic achiever stories:", e);
      }
    };
    fetchStories();
  }, []);

  const filteredStories = useMemo(() => {
    return stories.filter(s => {
      const matchFilter = activeFilter === 'all' || s.examCategory === activeFilter;
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.rank.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.district.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.story.toLowerCase().includes(searchQuery.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    setVisibleCount(4);
  }, [activeFilter, searchQuery]);

  return (
    <section id="achievers-journal" className={cn("bg-transparent border-y border-slate-200/60 dark:border-slate-800 scroll-mt-24", isMobile ? "py-10" : "py-12 md:py-16")}>
      <div className={cn("max-w-7xl mx-auto space-y-6 md:space-y-10", isMobile ? "px-4" : "px-6")}>
        <div className="flex flex-col items-center space-y-3 sm:space-y-4 text-center">
          <span className="section-chip">
            {t('home.achievers.sectionBadge', '🏆 VERIFIED SUCCESS STORIES')}
          </span>
          <h2 className={cn("font-serif font-extrabold text-slate-955 dark:text-white tracking-tight leading-tight max-w-4xl", isMobile ? "text-2xl" : "text-3xl md:text-4xl")}>
            {t('home.achievers.title1', 'Real Aspirants.')} <span className="premium-text-gradient font-serif font-extrabold">{t('home.achievers.title2', 'Real Results.')}</span>
          </h2>
          {!isMobile && <div className="section-divider" />}
          {/* Mobile Version (Shorter & Concise) */}
          <p className="block md:hidden text-xs leading-relaxed text-slate-500 font-medium max-w-xl mx-auto px-1">
            {t('home.achievers.subtitleMobile', 'Strategies and scorecard stories from Odisha exam toppers.')}
          </p>
          {/* Desktop Version (Full) */}
          <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-slate-600 dark:text-slate-300 hidden md:block">
            {t('home.achievers.subtitle', 'Read how thousands of students across Odisha cracked OPSC, OSSC, and OSSSC with our mock test platform.')}
          </p>
        </div>

        {/* Search and Filters bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl mx-auto pt-2">
          {/* Category Filter */}
          <div className={cn(
            "bg-white dark:bg-slate-900 p-1 flex flex-nowrap w-full sm:w-auto justify-between gap-1 shrink-0 relative z-10",
            isMobile
              ? "border border-slate-200/60 dark:border-slate-800 rounded-xl shadow-sm"
              : "border-2 border-slate-900 dark:border-slate-700 rounded-2xl shadow-[4px_4px_0px_rgba(37,99,235,0.15)] dark:shadow-[4px_4px_0px_rgba(37,99,235,0.4)]"
          )}>
            {(['all', 'opsc', 'ossc', 'osssc'] as const).map(filter => {
              const isFilterActive = activeFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "flex-1 sm:flex-initial text-center py-1.5 sm:py-2 rounded-xl font-black uppercase transition-all duration-200 cursor-pointer relative focus:outline-none",
                    isMobile ? "px-2 text-[10px] tracking-wide" : "px-1.5 sm:px-4 text-[10px] sm:text-xs tracking-wider sm:tracking-widest",
                    isFilterActive 
                      ? "text-white" 
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
                  )}
                >
                  {isFilterActive && (
                    <motion.div
                      layoutId="activeAchieverFilterBg"
                      className={cn(
                        "absolute inset-0 bg-[#2563EB] rounded-xl z-0",
                        isMobile ? "shadow-none" : "shadow-[2px_2px_0px_#0f172a]"
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">
                    {filter === 'all' ? (
                      <>
                        <span className="hidden sm:inline">{t('common.actions.viewAll', 'All Journeys')}</span>
                        <span className="inline sm:hidden">All</span>
                      </>
                    ) : (
                      filter.toUpperCase()
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder={t('home.achievers.searchPlaceholder', 'Search by name, district, keyword...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs sm:text-sm focus:outline-none transition-all duration-200",
                isMobile
                  ? "border border-slate-200/70 dark:border-slate-800 shadow-sm focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/20"
                  : "border-2 border-slate-900 dark:border-slate-700 shadow-[3px_3px_0px_rgba(37,99,235,0.1)] dark:shadow-[3px_3px_0px_rgba(37,99,235,0.4)] focus:shadow-[4px_4px_0px_#2563EB]"
              )}
            />
          </div>
        </div>

        <div className={cn("max-w-7xl mx-auto", isMobile ? "pt-1" : "pt-4")}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFilter}
              initial="hidden"
              animate="show"
              exit="hidden"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3", isMobile ? "gap-3" : "gap-6 sm:gap-8")}
            >
              {filteredStories.length === 0 ? (
                <motion.div
                  key="empty-achievers"
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className={cn(
                    "col-span-1 md:col-span-2 text-center py-12 bg-white flex flex-col items-center justify-center gap-2",
                    isMobile
                      ? "border border-slate-200/60 rounded-2xl p-5 shadow-sm"
                      : "border-2 border-slate-900 rounded-3xl p-6 shadow-[4px_4px_0px_rgba(37,99,235,0.15)]"
                  )}
                >
                  <div className="text-3xl">📝</div>
                  <h4 className="font-serif font-bold text-slate-900 text-lg">No Achiever Logs Found</h4>
                  <p className="text-slate-500 text-xs sm:text-sm">Try searching for another candidate, district or exam category.</p>
                </motion.div>
              ) : (
                filteredStories.slice(0, visibleCount).map((item, idx) => (
                  <motion.div 
                    key={item.name}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }
                    }}
                  >
                    <DynamicVectorCard
                      className={cn(
                        "bg-white dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between transition-all duration-300",
                        isMobile
                          ? "border border-slate-200/60 dark:border-slate-800 rounded-2xl p-4 shadow-md shadow-slate-100/80 dark:shadow-none active:scale-[0.99]"
                          : "border-2 border-slate-900/80 dark:border-slate-700/80 rounded-[2rem] p-6 sm:p-8 shadow-[6px_6px_0px_rgba(37,99,235,0.1)] dark:shadow-[8px_8px_0px_rgba(37,99,235,0.4)]"
                      )}
                    >
                      <div className={cn(isMobile ? "space-y-3" : "space-y-4")}>
                        {/* Avatar + Name Row */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <img 
                              src={item.avatar?.includes('dicebear.com') ? item.avatar : item.avatar?.replace(/\.(png|jpg|jpeg)$/i, '.webp')} 
                              alt={`${item.name} ${item.rank} Achiever Profile`} 
                              className={cn(
                                "rounded-full border border-slate-200 dark:border-slate-700 object-cover shrink-0",
                                isMobile ? "w-10 h-10" : "w-12 h-12"
                              )}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (target.src !== item.avatar) {
                                  target.src = item.avatar;
                                }
                              }}
                            />
                            <div className="min-w-0">
                              <h3 className={cn(
                                "font-serif font-extrabold text-slate-900 dark:text-white leading-snug",
                                isMobile ? "text-[14px] truncate" : "text-base leading-none"
                              )}>{item.name}</h3>
                              <p className="text-[9px] font-black uppercase text-[#2563EB] dark:text-brand-400 tracking-widest mt-0.5">{item.rank}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0 text-right">
                            <span className={cn(
                              "font-mono font-black text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded uppercase tracking-tight",
                              isMobile ? "text-[9px] px-1.5 py-0.5" : "text-[10px] px-2.5 py-1 rounded-md"
                            )}>
                              📍 {item.district}
                            </span>
                            <span className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 flex items-center gap-1 select-none mt-0.5">
                              <Clock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                              {(() => {
                                try {
                                  if (!item.date) return 'Recent';
                                  const d = new Date(item.date);
                                  if (isNaN(d.getTime())) return item.date;
                                  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                                } catch (e) {
                                  return item.date || 'Recent';
                                }
                              })()}
                            </span>
                          </div>
                        </div>

                        {/* Quote */}
                        <p className={cn(
                          "font-serif leading-relaxed italic text-slate-600 dark:text-slate-300",
                          isMobile
                            ? "text-[12.5px] pl-3 border-l-2 border-l-brand-200/70 dark:border-l-brand-700 py-0.5"
                            : "text-sm"
                        )}>
                          "{item.story}"
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className={cn(
                        "grid grid-cols-3 text-center text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800",
                        isMobile ? "gap-2 pt-3 mt-3" : "gap-2.5 pt-4 mt-6"
                      )}>
                        {[
                          { label: 'Score', value: item.stats.score },
                          { label: 'Accuracy', value: item.stats.accuracy },
                          { label: 'Timeline', value: item.stats.time },
                        ].map(stat => (
                          <div key={stat.label} className={cn("rounded-xl border", isMobile ? "p-2 bg-slate-50/60 dark:bg-slate-800/60 border-slate-100/50 dark:border-slate-700/50" : "p-2 bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700")}>
                            <p className="text-[8px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                            <p className={cn("font-black text-slate-900 dark:text-white", isMobile ? "text-[11px]" : "text-xs")}>{stat.value}</p>
                          </div>
                        ))}
                      </div>
                    </DynamicVectorCard>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Load More Button */}
        {filteredStories.length > visibleCount && (
          <div className="flex justify-center pt-4">
            <button 
              onClick={() => setVisibleCount(prev => prev + 6)}
              className={cn(
                "transition-all duration-200 cursor-pointer font-black uppercase tracking-widest text-xs sm:text-sm rounded-xl border-2 transition-all duration-200",
                isMobile
                  ? "w-full py-3 bg-[#2563EB] dark:bg-[#2563EB] hover:bg-brand-600 text-white border-[#2563EB] shadow-sm active:scale-[0.98]"
                  : "px-8 py-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white border-slate-900 dark:border-slate-700 shadow-[4px_4px_0px_#2563EB] dark:shadow-[4px_4px_0px_rgba(37,99,235,0.5)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
              )}
            >
              {t('home.achievers.loadMore', 'Load More preparation journals (+{count} remaining)', { count: filteredStories.length - visibleCount })}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export const Footer = () => {
  const { t, isOdia } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return;

    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .insert([{ email: cleanEmail }]);

      if (error) {
        if (error.code === '23505') {
          toast.error("You're already subscribed!");
        } else {
          toast.error(error.message || "Failed to subscribe.");
        }
        return;
      }

      setSubscribed(true);
      toast.success("Successfully subscribed for alerts!");
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    } catch (err: any) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <footer id="contact" className={cn("bg-[#0a0f1d] dark:bg-[#070a10] text-slate-200 relative overflow-hidden noise-overlay border-t-2 border-slate-900 dark:border-slate-800", isMobile ? "py-10 mt-12" : "py-16 md:py-24 mt-20")}>
      {/* Decorative background grid and orbs */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#2563eb_1px,transparent_1px),linear-gradient(to_bottom,#2563eb_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
      
      {/* Glowing blur spheres */}
      <div className="hidden md:block absolute -top-20 right-1/4 w-[500px] h-[500px] bg-brand-500/15 rounded-full blur-[120px] pointer-events-none animate-pulse-soft" />
      <div className="hidden md:block absolute -bottom-40 left-10 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none animate-pulse-soft" style={{ animationDelay: '-2s' }} />

      <div className={cn("max-w-7xl mx-auto relative z-10", isMobile ? "px-4" : "px-6")}>
        
        {/* Pre-footer Stats Dashboard */}
        <div className={cn("grid grid-cols-2 lg:grid-cols-4 border-b border-slate-800/80", isMobile ? "gap-3 pb-8 mb-8" : "gap-4 sm:gap-6 pb-16 mb-16")}>
          {[
            { label: t('footer.mockTestsAttempted', 'Mock Tests Attempted'), value: t('footer.statsTestsCount', '10,000+'), icon: BarChart3, color: "text-blue-400 bg-blue-500/15 border-blue-500/30", desc: t('footer.realSimulations', 'Real exam simulations') },
            { label: t('footer.syllabusCoverage', 'Syllabus Coverage'), value: t('footer.statsSyllabusVal', '98.4%'), icon: Target, color: "text-rose-400 bg-rose-500/15 border-rose-500/30", desc: t('footer.mappedToBoards', 'Mapped to state boards') },
            { label: t('footer.scoreAnalytics', 'Score Analytics'), value: t('footer.statsScoreVal', 'Real-Time'), icon: Zap, color: "text-amber-400 bg-amber-500/15 border-amber-500/30", desc: t('footer.rankMapping', 'Detailed rank mapping') },
            { label: t('footer.expertSupport', 'Expert Support'), value: t('footer.statsSupportVal', '24/7 Support'), icon: MessageSquare, color: "text-emerald-400 bg-emerald-500/15 border-emerald-500/30", desc: t('footer.supportChannels', 'Priority Telegram & Call') }
          ].map((stat, idx) => (
            <div 
              key={idx}
              className={cn(
                "bg-slate-900/90 border-2 border-slate-800 rounded-2xl p-4 sm:p-5 hover:border-brand-500/50 transition-all duration-300 group shadow-lg",
                isMobile ? "p-3.5" : "p-5 hover:-translate-y-1"
              )}
            >
              <div className={cn("flex items-center", isMobile ? "gap-2 mb-2" : "gap-3 mb-3")}>
                <div className={cn(`p-2 rounded-xl ${stat.color} border group-hover:scale-105 transition-transform shrink-0`, isMobile ? "p-1.5" : "p-2")}>
                  <stat.icon className={cn(isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
                </div>
                <h3 className={cn("font-black uppercase text-slate-300 leading-snug", isMobile ? "text-[10px] tracking-wide" : "text-xs tracking-wider")}>{stat.label}</h3>
              </div>
              <h5 className={cn("font-serif font-black text-white tracking-tight leading-none mb-1.5", isMobile ? "text-lg" : "text-xl sm:text-2xl")}>
                {stat.value}
              </h5>
              <p className={cn("font-semibold text-slate-300", isMobile ? "text-[10px]" : "text-[11px]")}>
                {stat.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Core footer layout */}
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4", isMobile ? "gap-6" : "gap-12 sm:gap-16")}>
          
          {/* Logo & Tagline column */}
          <div className={cn("col-span-1 md:col-span-2", isMobile ? "space-y-3.5" : "space-y-6")}>
            <div className="flex items-center gap-3">
              <div role="img" aria-label="OdishaExamPrep Platform Logo" className={cn("bg-[#2563EB] rounded-2xl flex items-center justify-center shadow-lg shadow-[#2563eb]/20 border-2 border-brand-400/40", isMobile ? "w-9 h-9 shrink-0" : "w-12 h-12")}>
                <BookOpen className={cn("text-white", isMobile ? "w-4.5 h-4.5" : "w-6 h-6")} />
              </div>
              <span className={cn("font-serif font-black tracking-tight text-white", isMobile ? "text-xl xs:text-2xl" : "text-3xl")}>
                Odisha<span className="text-brand-400 font-serif font-black">Exam</span>Prep
              </span>
            </div>
            {/* Mobile Version (Shorter) */}
            <p className="block md:hidden text-xs leading-relaxed text-slate-300 font-medium max-w-sm">
              {t('footer.aboutPlatform', 'Master OPSC, OSSC, and OSSSC exams with verified PYQs and a 24/7 AI Mentor.')}
            </p>
            {/* Desktop Version (Original) */}
            <p className="hidden md:block text-slate-300 font-medium leading-relaxed max-w-sm text-sm sm:text-base">
              {t('footer.aboutPlatform', 'The ultimate state-level civil service exam prep platform. Master the OPSC, OSSC, and OSSSC with our verified PYQs, real-time analytics, and 24/7 AI Mentor.')}
            </p>
            
            {/* Newsletter update form */}
            <div className={cn("space-y-2", isMobile ? "pt-1" : "space-y-3 pt-4")}>
              <h2 className="text-xs font-black uppercase tracking-wider text-white">{t('footer.neverMiss', 'Never Miss an Odisha Exam Update')}</h2>
              <form onSubmit={handleSubscribe} className={cn("flex max-w-md", isMobile ? "gap-1.5" : "gap-2")}>
                <input 
                  type="email" 
                  required
                  placeholder={isMobile ? "Email address…" : "Enter email to get notified..."}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-900 border-2 border-slate-700 focus:border-[#2563EB] rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-white focus:outline-none transition-all font-bold placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  className="shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 h-10 sm:h-auto bg-[#2563EB] hover:bg-brand-600 border border-brand-400/40 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-lg shadow-brand-500/20"
                >
                  {subscribed ? "Done!" : (
                    <>
                      <span>{t('footer.join', 'Join')}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-white" />
                    </>
                  )}
                </button>
              </form>
              {/* Mobile Version (Shorter) */}
              <p className="block md:hidden text-[10px] leading-relaxed text-slate-400 font-medium">
                {t('footer.newsletterSubtitle', 'Get instant alerts for OPSC, OSSC & OSSSC notifications and admit card drops.')}
              </p>
              {/* Desktop Version (Original) */}
              <p className="hidden md:block text-[10px] text-slate-400 font-medium">
                {t('footer.newsletterSubtitle', 'Join our mailing list to get instant alerts for OPSC, OSSC, and OSSSC notification drops and admit card releases.')}
              </p>
            </div>
          </div>
          
          {/* Platform + Contact — proportional on mobile */}
          <div className={cn(isMobile ? "col-span-1 grid grid-cols-[1fr_1.18fr] gap-3 xs:gap-5 pt-2" : "contents")}>

          {/* Platform navigation */}
          <div className={cn(isMobile ? "" : "space-y-6")}>
            <h4 className={cn("text-white font-black tracking-widest uppercase relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-6 after:h-[2px] after:bg-[#2563eb]", isMobile ? "text-[11px] mb-3" : "text-xs sm:text-sm mb-6")}>
              {t('footer.quickLinks', 'Platform')}
            </h4>
            <ul className={cn("font-bold text-slate-300", isMobile ? "space-y-2.5" : "space-y-4")}>
              {[
                { to: "/current-affairs", label: t('nav.currentAffairs', 'Daily Current Affairs'), icon: Globe },
                { to: "/blog", label: t('nav.blog', 'Official Blog'), icon: BookOpen },
                { to: "/privacy-policy", label: t('footer.privacyPolicy', 'Privacy Policy'), icon: ShieldCheck },
                { to: "/terms-of-service", label: t('footer.termsOfService', 'Terms'), icon: Scale },
                { to: "/refund-policy", label: t('footer.refundPolicy', 'Refund Policy'), icon: Receipt }
              ].map((link, idx) => (
                <li key={idx}>
                  <Link 
                    to={link.to} 
                    className="hover:text-brand-300 transition-all duration-300 flex items-center gap-1.5 xs:gap-2 group hover:translate-x-1"
                  >
                    <link.icon className={cn("text-brand-400 group-hover:text-brand-300 transition-colors shrink-0", isMobile ? "w-3 h-3" : "w-4 h-4")} />
                    <span className={cn(isMobile ? "text-[11px] xs:text-xs" : "text-sm")}>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact details */}
          <div className={cn(isMobile ? "" : "space-y-6")}>
            <h4 className={cn("text-white font-black tracking-widest uppercase relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-6 after:h-[2px] after:bg-[#2563eb]", isMobile ? "text-[11px] mb-3" : "text-xs sm:text-sm mb-6")}>
              {t('footer.contactUs', 'Contact')}
            </h4>
            <ul className={cn("font-bold text-slate-300", isMobile ? "space-y-2.5" : "space-y-3.5")}>
              <li>
                <a 
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=odishaexamprep365@gmail.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-2 group min-w-0"
                >
                  <div className={cn("rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center shrink-0 group-hover:border-[#2563eb] group-hover:bg-[#2563eb]/20 transition-all duration-300", isMobile ? "w-7 h-7" : "w-10 h-10")}>
                    <Mail className={cn("text-brand-400 group-hover:text-brand-300 transition-colors", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
                  </div>
                  <span className={cn("text-slate-200 group-hover:text-white transition-colors duration-300 font-bold truncate", isMobile ? "text-[10px] xs:text-[11px] leading-tight" : "text-sm lg:whitespace-nowrap")}>
                    odishaexamprep365@gmail.com
                  </span>
                </a>
              </li>
              <li>
                <a 
                  href="tel:+917377431715" 
                  className="flex items-center gap-2 group min-w-0"
                >
                  <div className={cn("rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center shrink-0 group-hover:border-[#25D366] group-hover:bg-[#25D366]/20 transition-all duration-300", isMobile ? "w-7 h-7" : "w-10 h-10")}>
                    <Phone className={cn("text-[#25D366] group-hover:text-[#25D366] transition-colors", isMobile ? "w-3.5 h-3.5" : "w-4 h-4")} />
                  </div>
                  <span className={cn("text-slate-200 group-hover:text-white transition-colors duration-300 font-bold font-mono", isMobile ? "text-[10.5px] xs:text-xs" : "text-sm")}>
                    +91 7377431715
                  </span>
                </a>
              </li>
              
              {/* Social links */}
              <li className={cn("flex", isMobile ? "gap-2 pt-0.5" : "gap-3 pt-3")}>
                <a 
                  href="https://www.youtube.com/@OdishaExamPrep365" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={cn("rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center hover:bg-[#FF0000] hover:border-[#FF0000] hover:-translate-y-1 transition-all duration-300 text-slate-300 hover:text-white shadow-lg hover:shadow-red-600/20 group", isMobile ? "w-8 h-8" : "w-11 h-11")}
                >
                  <Youtube className={cn("text-slate-300 group-hover:text-white transition-colors", isMobile ? "w-3.5 h-3.5" : "w-5 h-5")} />
                </a>
                <a 
                  href="https://t.me/OdishaExamPrep_Official" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className={cn("rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center hover:bg-[#0088cc] hover:border-[#0088cc] hover:-translate-y-1 transition-all duration-300 text-slate-300 hover:text-white shadow-lg hover:shadow-blue-600/20 group", isMobile ? "w-8 h-8" : "w-11 h-11")}
                >
                  <Send className={cn("text-slate-300 group-hover:text-white transition-colors", isMobile ? "w-3 h-3" : "w-4 h-4")} />
                </a>
              </li>
            </ul>
          </div>

          </div>{/* end mobile 2-col wrapper */}
        </div>
      </div>
      
      {/* Bottom bar with WhatsApp clearance */}
      <div className={cn("max-w-7xl mx-auto pb-14 sm:pb-4", isMobile ? "px-4 mt-8" : "px-6 mt-16 md:mt-24")}>
        <div className="pt-6 sm:pt-8 border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <p className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
            © 2026 OdishaExamPrep. All rights reserved.
          </p>
          <div className="flex justify-center md:justify-start">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-900 border-2 border-slate-800 text-slate-300">
              <span>Made with</span>
              <span className="text-rose-500 animate-pulse">❤️</span>
              <span>in Odisha</span>
            </span>
          </div>
        </div>

        {/* Big Executive Brand Watermark Headline */}
        <div className="pt-8 sm:pt-16 pb-4 flex justify-center overflow-hidden pointer-events-none select-none">
          <h1 className="font-serif font-black tracking-tighter text-center text-4xl sm:text-6xl md:text-8xl lg:text-[7.5rem] xl:text-[9.5rem] 2xl:text-[11rem] leading-none bg-gradient-to-b from-slate-700/40 via-slate-800/25 to-transparent bg-clip-text text-transparent transition-all duration-500 whitespace-nowrap">
            Odisha<span className="text-brand-500/35 font-serif font-black">Exam</span>Prep
          </h1>
        </div>
      </div>
    </footer>
  );
};

export const Navbar = ({ 
  user, 
  isAdmin, 
  onSignIn, 
  onShowAdmin,
  onHomeClick
}: { 
  user: any, 
  isAdmin: boolean, 
  onSignIn?: () => void, 
  onShowAdmin?: () => void,
  onHomeClick?: () => void
}) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scrolled = useScrollSpy(20);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const [streakState, setStreakState] = useState<StreakState>(() => getStreakState(user?.id));
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  useEffect(() => {
    setStreakState(getStreakState(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const handleStreakUpdate = (e: any) => {
      if (e.detail) setStreakState(e.detail);
      else setStreakState(getStreakState(user?.id));
    };
    const handleOpenStreakModal = () => setIsStreakModalOpen(true);

    window.addEventListener('oep-streak-updated', handleStreakUpdate);
    window.addEventListener('oep-streak-goal-completed', handleStreakUpdate);
    window.addEventListener('oep-open-streak-modal', handleOpenStreakModal);

    return () => {
      window.removeEventListener('oep-streak-updated', handleStreakUpdate);
      window.removeEventListener('oep-streak-goal-completed', handleStreakUpdate);
      window.removeEventListener('oep-open-streak-modal', handleOpenStreakModal);
    };
  }, [user?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const drawerContainerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05,
      }
    }
  };

  const drawerItemVariants = {
    hidden: { opacity: 0, y: -12 },
    show: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        type: "spring", 
        stiffness: 320, 
        damping: 25 
      } 
    }
  };

  const [activeSection, setActiveSection] = useState('');
  const isScrollingRef = useRef(false);
  const scrollLockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Viewport tracking scroll spy for active sections
  useEffect(() => {
    if (location.pathname !== '/') {
      if (location.pathname.startsWith('/blog')) {
        setActiveSection('blog');
      } else {
        setActiveSection('');
      }
      return;
    }

    const sectionIds = ['exams', 'syllabus-paths', 'exam-registry', 'achievers-journal'];
    const elements = sectionIds.map(id => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    if (elements.length > 0) {
      const activeEntries = new Map<string, boolean>();

      const observerOptions = {
        root: null,
        rootMargin: '-100px 0px -60% 0px',
        threshold: 0
      };

      const observer = new IntersectionObserver((entries) => {
        if (isScrollingRef.current || (window as any).isProgrammaticScrolling) {
          return;
        }

        entries.forEach(entry => {
          activeEntries.set(entry.target.id, entry.isIntersecting);
        });

        let currentActive = '';
        for (const id of sectionIds) {
          if (activeEntries.get(id)) {
            currentActive = id;
          }
        }

        if (window.scrollY < 100) {
          setActiveSection('');
        } else if (currentActive) {
          setActiveSection(currentActive);
        }
      }, observerOptions);

      elements.forEach(el => observer.observe(el));

      const handleScroll = () => {
        if (window.scrollY < 100) {
          setActiveSection('');
        }
      };
      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        observer.disconnect();
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [location.pathname]);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      sessionStorage.setItem('oep_scroll_target', id);
      navigate('/');
      return;
    }

    // Immediately update highlight for instant visual feedback
    setActiveSection(id);
    // Lock spy during smooth-scroll animation (~900ms)
    isScrollingRef.current = true;
    if (scrollLockTimer.current) clearTimeout(scrollLockTimer.current);
    scrollLockTimer.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 900);

    scrollToElement(id, { block: 'start', behavior: 'smooth' });
  };

  const defaultMessage = "Hello! I am reaching out from the OdishaExamPrep website. I have a query.";
  const userMessage = user?.email ? `Hello! I am ${user.email} reaching out from the OdishaExamPrep website. I have a query.` : defaultMessage;
  const supportUrl = `https://wa.me/917377431715?text=${encodeURIComponent(userMessage)}`;

  const isBlogActive = location.pathname.startsWith('/blog') || activeSection === 'blog';
  const { t, isOdia } = useLanguage();

  return (
    <header className={cn(
      "fixed top-0 left-0 right-0 w-full z-[60] transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out will-change-[transform,height]", 
      mobileMenuOpen 
        ? "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" 
        : (scrolled 
            ? "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 shadow-md shadow-slate-900/10 dark:shadow-black/60" 
            : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50")
    )}>
      <div className={cn(
        "w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between relative z-[65] transition-[height] duration-300 ease-out will-change-[height]",
        scrolled ? "h-14 sm:h-16" : "h-16 sm:h-20"
      )}>
        <div
          className="flex items-center gap-2 sm:gap-3 group cursor-pointer shrink-0"
          onClick={() => {
            if (onHomeClick) {
              onHomeClick();
            } else if (window.location.pathname === '/') {
              // Already on landing page — smooth scroll to hero (top)
              setActiveSection('');
              scrollToTop();
            } else {
              navigate('/');
            }
          }}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 border-slate-900 dark:border-slate-700 bg-[#2563EB] flex items-center justify-center shadow-[2px_2px_0px_#0f172a] dark:shadow-[2px_2px_0px_rgba(99,102,241,0.3)] group-hover:rotate-3 group-hover:scale-105 transition-all duration-300 shrink-0">
            <BookOpen className="text-white w-4 h-4 sm:w-5.5 sm:h-5.5" />
          </div>
          <span className="font-serif font-black text-[15px] xs:text-base sm:text-xl md:text-2xl tracking-tight text-slate-900 dark:text-white group-hover:text-[#2563EB] transition-colors duration-300">
            Odisha<span className="text-[#2563EB] font-serif font-black">Exam</span>Prep
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-3 lg:gap-4">
          {!user ? (
            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-1 shadow-xs">
              <a 
                href="#exams"
                onClick={(e) => scrollToSection(e, 'exams')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
                  activeSection === 'exams' 
                    ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-brand-400 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
                )}
              >
                <Target className="w-3.5 h-3.5 text-[#2563EB] dark:text-brand-400" />
                <span>{t('nav.exams', 'Exams')}</span>
              </a>

              <a 
                href="#syllabus-paths"
                onClick={(e) => scrollToSection(e, 'syllabus-paths')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
                  activeSection === 'syllabus-paths' 
                    ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-brand-400 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
                )}
              >
                <BookOpen className="w-3.5 h-3.5 text-[#2563EB] dark:text-brand-400" />
                <span>{t('nav.syllabus', 'Syllabus')}</span>
              </a>

              <a 
                href="#achievers-journal"
                onClick={(e) => scrollToSection(e, 'achievers-journal')}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
                  activeSection === 'achievers-journal' 
                    ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-brand-400 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
                )}
              >
                <Award className="w-3.5 h-3.5 text-[#2563EB] dark:text-brand-400" />
                <span>{t('nav.achievers', 'Achievers')}</span>
              </a>

              <Link 
                to="/current-affairs"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
                  location.pathname === '/current-affairs' 
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-white/60 dark:hover:bg-slate-800"
                )}
                title="Daily 360° Current Affairs"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('nav.currentAffairs', 'Current Affairs')}</span>
              </Link>

              <Link 
                to="/blog"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
                  isBlogActive 
                    ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-brand-400 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
                )}
                title="Official Educational Blog"
              >
                <FileText className="w-3.5 h-3.5 text-[#2563EB] dark:text-brand-400" />
                <span>{t('nav.blog', 'Blog')}</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-1 shadow-xs">
              <Link 
                to="/current-affairs"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
                  location.pathname === '/current-affairs' 
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-white/60 dark:hover:bg-slate-800"
                )}
                title="Daily 360° Current Affairs"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('nav.currentAffairs', 'Current Affairs')}</span>
              </Link>

              <Link 
                to="/blog"
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer select-none",
                  isBlogActive 
                    ? "bg-white dark:bg-slate-900 text-[#2563EB] dark:text-brand-400 shadow-xs font-black" 
                    : "text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800"
                )}
                title="Official Educational Blog"
              >
                <FileText className="w-3.5 h-3.5 text-[#2563EB] dark:text-brand-400" />
                <span>{t('nav.blog', 'Blog')}</span>
              </Link>
            </div>
          )}
          
          <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-700">
            {!user ? (
              <div className="flex items-center gap-2">
                <LanguageToggle />
                <ThemeToggle />
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setIsSearchModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:text-[#2563EB] dark:hover:text-white transition-all text-xs font-black cursor-pointer shadow-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group shrink-0"
                  title="Search exams, tests, practice sets (Ctrl+K)"
                >
                  <Search className="w-3.5 h-3.5 text-[#2563EB] dark:text-brand-400 group-hover:scale-110 transition-transform" />
                  <span className="hidden md:inline font-black uppercase text-[11px] tracking-wider">{t('nav.search', 'Search')}</span>
                  <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[9px] font-black text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘K</kbd>
                </button>

                <NotificationCenter
                  exams={_dashboardCache.exams || []}
                  mockTests={_dashboardCache.mockTests || []}
                  dynamicQuestionBanks={_dashboardCache.dynamicQuestionBanks || {}}
                  onViewExam={(examId) => window.dispatchEvent(new CustomEvent('oep-view-exam', { detail: examId }))}
                  onLaunchMockTest={(test: any) => window.dispatchEvent(new CustomEvent('oep-launch-mock-test', { detail: test }))}
                  onLaunchBank={(bank: any) => window.dispatchEvent(new CustomEvent('oep-launch-bank', { detail: bank }))}
                />

                <button
                  type="button"
                  onClick={() => setIsStreakModalOpen(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 shadow-2xs transition-all text-xs font-black cursor-pointer group shrink-0"
                  title="Daily Preparation Streak — Click for details"
                >
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-current animate-pulse group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[11px] sm:text-xs text-amber-700 dark:text-amber-300 font-extrabold">
                    <span className="sm:hidden">{streakState.currentStreak}d</span>
                    <span className="hidden sm:inline">{streakState.currentStreak} {streakState.currentStreak === 1 ? t('nav.day', 'Day') : t('nav.days', 'Days')}</span>
                  </span>
                </button>

                <LanguageToggle variant="compact" />
                <ThemeToggle />
              </div>
            )}

            {user && (
              <StreakDetailModal
                isOpen={isStreakModalOpen}
                onClose={() => setIsStreakModalOpen(false)}
                streakState={streakState}
                onSolveMoreClick={() => {
                  if (window.location.pathname === '/') {
                    scrollToElement('exams', { block: 'start', delay: 50 });
                  } else {
                    navigate('/');
                  }
                }}
              />
            )}

            {user ? (
               <div className="relative">
                  <div 
                    className="flex items-center gap-2.5 cursor-pointer bg-slate-100/80 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-900 p-1.5 pr-3 rounded-2xl transition-all border border-slate-200/80 dark:border-slate-700/60 shadow-xs"
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  >
                    <UserAvatar profile={profile} user={user} className="w-8 h-8 rounded-xl" />
                    <div className="hidden sm:block text-left">
                      <p className="text-xs font-black text-slate-800 dark:text-white leading-none mb-0.5">{profile?.displayName || user?.email?.split('@')[0]}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400 leading-none">{user?.email}</p>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[100]"
                      >
                        <div className="p-3 bg-slate-50 border-b border-slate-100">
                          <p className="text-xs font-black text-slate-800 truncate">{profile?.displayName || 'Student Aspirant'}</p>
                          <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</p>
                        </div>

                        <div className="p-1 space-y-0.5">
                          {isAdmin && (
                            <Link to="/admin" onClick={() => setShowProfileDropdown(false)} className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors">
                              <Settings className="w-4 h-4 text-slate-500" />
                              {t('nav.adminPanel', 'Admin Panel')}
                            </Link>
                          )}

                          <div className="h-px bg-slate-100 my-1" />

                          <button 
                            onClick={async () => {
                              setShowProfileDropdown(false);
                              await logout();
                              navigate('/');
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <LogOut className="w-4 h-4" />
                            {t('nav.signOut', 'Sign Out')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            ) : (
              onSignIn && (
                <button 
                  onClick={onSignIn}
                  className="px-6 h-10 text-xs font-black uppercase tracking-widest rounded-xl bg-[#2563EB] hover:bg-brand-700 text-white shadow-md hover:shadow-[#2563EB]/25 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer shrink-0"
                >
                  {t('nav.signIn', 'Sign In')}
                </button>
              )
            )}
          </div>
        </nav>

        {/* Mobile Menu Toggle & Controls */}
        <div className="md:hidden flex items-center gap-2 sm:gap-3">

          {/* Mobile Header Streak Flame Pill Button — Only visible when LOGGED IN */}
          {user && (
            <button
              type="button"
              onClick={() => setIsStreakModalOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 shadow-2xs transition-all text-xs font-black cursor-pointer group shrink-0"
              title="Daily Preparation Streak"
            >
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse group-hover:scale-110 transition-transform" />
              <span className="font-mono text-[11px] text-amber-700 font-extrabold">
                {streakState.currentStreak}d
              </span>
            </button>
          )}

          {!user && onSignIn && (
            <button 
              onClick={onSignIn}
              className="hidden sm:inline-flex px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border-2 border-slate-900 bg-[#2563EB] text-white shadow-[2px_2px_0px_#0f172a] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 cursor-pointer shrink-0"
            >
              {t('nav.signIn', 'Sign In')}
            </button>
          )}
          <button 
            className="p-2 sm:p-2.5 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-[3px] z-[55] md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Drawer */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-0 right-0 bg-white dark:bg-[#0B1528] border-b border-slate-200/80 dark:border-slate-800 shadow-2xl dark:shadow-slate-950/80 overflow-y-auto overscroll-contain no-scrollbar md:hidden max-h-[calc(100vh-80px)] rounded-b-2xl z-[60]"
              data-lenis-prevent
            >
              {/* Content Container */}
              <div className="p-3 flex flex-col gap-1">
                {/* Mobile Drawer Language & Theme Quick Bar */}
                <div className="py-1.5 px-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/50 mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Globe className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>{t('nav.language', 'Language')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <LanguageToggle />
                    <ThemeToggle />
                  </div>
                </div>

                {!user && onSignIn && (
                  <div className="p-3 rounded-xl border border-slate-900/20 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-white dark:from-[#060B16] dark:to-[#0B1528] shadow-xs mb-1">
                    <p className="text-[9px] font-black text-[#2563EB] dark:text-blue-400 uppercase tracking-widest mb-0.5">{t('nav.welcomeAspirant', 'Welcome Aspirant')}</p>
                    <h4 className="text-xs font-serif font-black text-slate-800 dark:text-slate-100 mb-2 leading-snug">{t('nav.welcomeSubtitle', 'Master the OPSC, OSSC, and OSSSC syllabus with precision-crafted test series.')}</h4>
                    <Button variant="primary" className="w-full py-2 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-xs active:scale-[0.98] transition-all" onClick={() => { onSignIn(); setMobileMenuOpen(false); }}>
                      {t('nav.signInToAccount', 'Sign In to Account')}
                    </Button>
                  </div>
                )}
                
                {/* Staggered Links Container */}
                <motion.div 
                  variants={drawerContainerVariants}
                  initial="hidden"
                  animate="show"
                  className="flex flex-col gap-0.5"
                >
                  {!user && (
                    <>
                      <motion.div variants={drawerItemVariants}>
                        <a 
                          href="#exams" 
                          onClick={(e) => scrollToSection(e, 'exams')} 
                          className={cn(
                            "flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative active:scale-[0.98] select-none",
                            activeSection === 'exams'
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black border-emerald-100 dark:border-emerald-800 shadow-xs"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800"
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-xs">
                             <Target className="w-3.5 h-3.5" />
                          </div>
                          <span className="tracking-wide">{t('nav.exams', 'Exams')}</span>
                          <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-250", activeSection === 'exams' ? "text-emerald-500 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5")} />
                        </a>
                      </motion.div>

                      <motion.div variants={drawerItemVariants}>
                        <a 
                          href="#syllabus-paths" 
                          onClick={(e) => scrollToSection(e, 'syllabus-paths')} 
                          className={cn(
                            "flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative active:scale-[0.98] select-none",
                            activeSection === 'syllabus-paths'
                              ? "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-black border-blue-100 dark:border-blue-800 shadow-xs"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800"
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                             <BookOpen className="w-3.5 h-3.5" />
                          </div>
                          <span className="tracking-wide">{t('nav.syllabus', 'Syllabus')}</span>
                          <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-250", activeSection === 'syllabus-paths' ? "text-blue-500 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5")} />
                        </a>
                      </motion.div>

                      <motion.div variants={drawerItemVariants}>
                        <a 
                          href="#exam-registry" 
                          onClick={(e) => scrollToSection(e, 'exam-registry')} 
                          className={cn(
                            "flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative active:scale-[0.98] select-none",
                            activeSection === 'exam-registry'
                              ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-black border-indigo-100 dark:border-indigo-800 shadow-xs"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800"
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-xs">
                             <Clock3 className="w-3.5 h-3.5" />
                          </div>
                          <span className="tracking-wide">{t('nav.notifications', 'Notifications')}</span>
                          <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-250", activeSection === 'exam-registry' ? "text-indigo-500 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5")} />
                        </a>
                      </motion.div>

                      <motion.div variants={drawerItemVariants}>
                        <a 
                          href="#achievers-journal" 
                          onClick={(e) => scrollToSection(e, 'achievers-journal')} 
                          className={cn(
                            "flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative active:scale-[0.98] select-none",
                            activeSection === 'achievers-journal'
                              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black border-amber-600 dark:border-amber-700 shadow-xs"
                              : "text-slate-700 dark:text-slate-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300"
                          )}
                        >
                          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/70 border border-amber-100 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                             <Award className="w-3.5 h-3.5" />
                          </div>
                          <span className="tracking-wide">{t('nav.achievers', 'Achievers')}</span>
                          <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-250", activeSection === 'achievers-journal' ? "text-amber-500 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5")} />
                        </a>
                      </motion.div>
                    </>
                  )}

                  <motion.div variants={drawerItemVariants}>
                    <Link 
                      to="/current-affairs"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative active:scale-[0.98] select-none",
                        location.pathname.startsWith('/current-affairs')
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black border-amber-200 dark:border-amber-800 shadow-xs"
                          : "text-slate-700 dark:text-slate-200 hover:bg-amber-50/50 dark:hover:bg-amber-950/40 hover:text-amber-800 dark:hover:text-amber-300"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0 shadow-xs">
                         <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="tracking-wide">{t('nav.currentAffairs', 'Daily 360° Current Affairs')}</span>
                      <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-250", location.pathname.startsWith('/current-affairs') ? "text-amber-600 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5")} />
                    </Link>
                  </motion.div>

                  <motion.div variants={drawerItemVariants}>
                    <Link 
                      to="/blog"
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative active:scale-[0.98] select-none",
                        isBlogActive
                          ? "bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 font-black border-blue-200 dark:border-blue-800 shadow-xs"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-slate-100 dark:active:bg-slate-800"
                      )}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                         <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="tracking-wide">{t('nav.blog', 'Latest Updates & Blog')}</span>
                      <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform duration-250", isBlogActive ? "text-blue-500 translate-x-0.5" : "text-slate-400 group-hover:translate-x-0.5")} />
                    </Link>
                  </motion.div>

                  <motion.div variants={drawerItemVariants}>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        window.dispatchEvent(new CustomEvent('oep-open-tutorial-video'));
                      }}
                      className="w-full flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-800 dark:text-slate-200 active:bg-rose-100 dark:active:bg-rose-900/50 active:scale-[0.98] select-none cursor-pointer"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/70 border border-rose-100 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 shadow-xs">
                         <Video className="w-3.5 h-3.5" />
                      </div>
                      <span className="tracking-wide text-left flex-1 font-bold">{t('nav.watchVideoGuide', 'Watch Video Guide')}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </motion.div>

                  {user && (
                    <motion.div variants={drawerItemVariants}>
                      <a 
                        href={supportUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 text-xs font-extrabold py-2 px-2.5 rounded-lg transition-all border border-transparent group relative hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800 active:scale-[0.98] select-none"
                      >
                        <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-xs">
                           <HelpCircle className="w-3.5 h-3.5" />
                        </div>
                        <span className="tracking-wide">{t('nav.helpSupport', 'Help & Support')}</span>
                        <ChevronRight className="w-3.5 h-3.5 ml-auto text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </motion.div>
                  )}
                </motion.div>

                {user && (
                  <div className="mt-1.5 p-2.5 rounded-xl bg-slate-50 dark:bg-[#060B16] border border-slate-200/70 dark:border-slate-800 shadow-xs flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <UserAvatar profile={profile} user={user} className="w-8 h-8 border border-white dark:border-slate-700 shadow-xs shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-slate-800 dark:text-white truncate leading-tight">{profile?.displayName || user?.email?.split('@')[0]}</p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-400 truncate leading-none mt-0.5">{user?.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setMobileMenuOpen(false)} 
                          className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs"
                          title={t('nav.adminPanel', 'Admin Panel')}
                        >
                          <Settings className="w-3.5 h-3.5 text-slate-500" />
                        </Link>
                      )}
                      <button 
                        onClick={async () => {
                          setMobileMenuOpen(false);
                          await logout();
                          navigate('/');
                        }} 
                        className="px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60 text-[11px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition-all"
                      >
                        <LogOut className="w-3 h-3" /> 
                        <span>{t('nav.signOut', 'Sign Out')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        exams={_dashboardCache.exams || []}
        mockTests={_dashboardCache.mockTests || []}
        dynamicQuestionBanks={_dashboardCache.dynamicQuestionBanks || {}}
        onViewExam={(examId) => window.dispatchEvent(new CustomEvent('oep-view-exam', { detail: examId }))}
        onLaunchMockTest={(test: any) => window.dispatchEvent(new CustomEvent('oep-launch-mock-test', { detail: test }))}
        onLaunchBank={(bank: any) => window.dispatchEvent(new CustomEvent('oep-launch-bank', { detail: bank }))}
      />
    </header>
  );
};

// --- Interactive Hero Preview Component ---
const HERO_CARD_DEFAULT = {
  examLabel: 'OPSC Prelims Mock',
  questionNumber: 'Q. 42',
  questionText: 'The historical Sun Temple of Konark, a UNESCO World Heritage site, was constructed by which ruler of the Eastern Ganga Dynasty?',
  options: ['Anantavarman Chodagangadeva', 'Narasimhadeva I', 'Kapilendradeva', 'Purushottamadeva'],
  correctIndex: 1,
  explanation: 'King Langula Narasimhadeva I built the Konark Sun Temple in the 13th century (circa 1250 CE) to celebrate his military victories.',
  marks: 1.00,
  penalty: 0.25,
};

const InteractiveHeroPreview = () => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(522); // 08:42
  const [card, setCard] = useState(HERO_CARD_DEFAULT);

  // Load admin-configured hero card from Supabase
  useEffect(() => {
    examService.getAllExams().then((exams: any[]) => {
      const setting = exams.find((e: any) => e.name === 'SYSTEM_SETTINGS_HERO_CARD');
      if (setting && setting.description) {
        try {
          const parsed = JSON.parse(setting.description);
          setCard({ ...HERO_CARD_DEFAULT, ...parsed });
        } catch (e) { /* keep defaults */ }
      }
    }).catch(() => { /* keep defaults on network error */ });
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset interaction when question changes
  useEffect(() => {
    setSelectedOption(null);
    setShowResult(false);
  }, [card.questionText]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelectedOption(idx);
    setShowResult(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setShowResult(false);
  };

  const marksLabel = card.marks?.toFixed(2) ?? '1.00';
  const penaltyLabel = card.penalty?.toFixed(2) ?? '0.25';

  return (
    <div className="w-full p-6 sm:p-8 relative font-sans">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.08] grid-bg" />
      
      <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-4 mb-5 shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#2563EB] rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">{card.examLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs font-black text-slate-700 dark:text-slate-200">
            <Clock3 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            {formatTimer(secondsLeft)}
          </div>
          <span className="text-xs font-extrabold text-[#2563EB] dark:text-brand-400 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-md border border-brand-100 dark:border-brand-800">
            {card.questionNumber}
          </span>
        </div>
      </div>

      <div className="space-y-4 mb-6 relative z-10">
        <h3 className="text-base sm:text-lg font-serif font-extrabold text-slate-900 dark:text-white leading-relaxed">
          <MathTextRenderer text={card.questionText} />
        </h3>
        {card.diagram ? (
          <DiagramRenderer diagram={card.diagram} data={card.diagram} />
        ) : null}
      </div>

      <div className="space-y-3 mb-6 relative z-10">
        {card.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === card.correctIndex;
          const showSuccess = showResult && isCorrect;
          const showFailure = showResult && isSelected && !isCorrect;

          let optionStyle = "border-slate-200 dark:border-slate-700 hover:border-slate-900/60 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/80 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-100";
          let badgeStyle = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300";

          if (showResult) {
            if (isCorrect) {
              optionStyle = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200";
              badgeStyle = "bg-emerald-500 text-white";
            } else if (isSelected) {
              optionStyle = "border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200";
              badgeStyle = "bg-rose-500 text-white";
            } else {
              optionStyle = "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 opacity-60 text-slate-500 dark:text-slate-400";
            }
          } else if (isSelected) {
            optionStyle = "border-[#2563EB] bg-[#2563EB]/5 dark:bg-[#2563EB]/20 text-slate-900 dark:text-white";
            badgeStyle = "bg-[#2563EB] text-white";
          }

          return (
            <button
              key={idx}
              disabled={showResult}
              onClick={() => handleSelect(idx)}
              className={cn(
                "w-full text-left p-3.5 rounded-xl border-2 font-semibold text-sm transition-all flex items-center gap-3.5 select-none relative cursor-pointer",
                optionStyle
              )}
            >
              <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs transition-colors shrink-0", badgeStyle)}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="flex-1 font-bold"><MathTextRenderer text={opt} isOption /></span>
              {showSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              {showFailure && <X className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {showResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-dashed border-slate-100 dark:border-slate-800 pt-5 space-y-3 relative z-10">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border",
                  selectedOption === card.correctIndex 
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800" 
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-800"
                )}>
                  {selectedOption === card.correctIndex ? `Correct Answer! (+${marksLabel} Marks)` : `Incorrect! (-${penaltyLabel} Marks)`}
                </span>
                <button 
                  onClick={handleReset}
                  className="text-xs font-black text-slate-400 hover:text-[#2563EB] dark:hover:text-brand-400 transition-colors ml-auto uppercase tracking-wider cursor-pointer"
                >
                  Try Again
                </button>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700 font-serif">
                <strong className="text-slate-800 dark:text-white font-extrabold block mb-1">Explanation:</strong>
                <MathTextRenderer text={card.explanation} />
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center justify-between border-t-2 border-slate-100 dark:border-slate-800 pt-4 mt-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10 shrink-0">
        <div>Marks: {marksLabel}</div>
        <div>Penalty: {penaltyLabel}</div>
        <div>Status: Interactive Demo</div>
      </div>
    </div>
  );
};

// --- Pages ---

const AuthModal = ({ isOpen, onClose, hideCloseButton = false }: { isOpen: boolean; onClose: () => void; hideCloseButton?: boolean }) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgotPassword' | 'resetPassword'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'info' | 'success', text: string } | null>(null);

  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setShowPassword(false);
    setGoogleLoading(false);
    setAuthMessage(null);
  }, [isOpen, authMode]);

  useEffect(() => {
    setAuthMessage(null);
  }, [email, password, fullName, confirmPassword]);

  useEffect(() => {
    if (window.innerWidth < 768) {
      if (isOpen) {
        document.body.setAttribute('data-modal-open', 'true');
      } else {
        document.body.removeAttribute('data-modal-open');
      }
    }
    return () => { document.body.removeAttribute('data-modal-open'); };
  }, [isOpen]);

  const handleGoogleLogin = async () => {
    setAuthMessage(null);
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ 
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Google login failed', error);
      setAuthMessage({
        type: 'error',
        text: error.message || 'Failed to connect to Google. Please try again.'
      });
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: fullName.trim()
            }
          }
        });
        if (error) throw error;
        if (data?.user && !data?.session) {
            setAuthMessage({
              type: 'info',
              text: 'Account already exists or requires email verification. Please check your inbox or try logging in!'
            });
            setAuthMode('login');
            return;
        }
        onClose();
      }
    } catch (error: any) {
      setAuthMessage({
        type: 'error',
        text: error.message || 'An unexpected error occurred. Please try again.'
      });
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setAuthMessage({
        type: 'success',
        text: 'A password reset link has been sent to your email. Please check your inbox!'
      });
    } catch (error: any) {
      setAuthMessage({
        type: 'error',
        text: error.message || 'Failed to send reset link. Please verify your email.'
      });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    if (password !== confirmPassword) {
      setAuthMessage({
        type: 'error',
        text: 'Passwords do not match!'
      });
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setAuthMessage({
        type: 'success',
        text: 'Password updated successfully! You are now logged in. Redirecting...'
      });
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setAuthMessage({
        type: 'error',
        text: error.message || 'Failed to update password.'
      });
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Animated backdrop */}
          <motion.div
            key="auth-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-slate-950/60 z-[100] backdrop-blur-md"
            style={{ willChange: 'opacity' }}
            onClick={hideCloseButton ? undefined : onClose}
          />

          {/* Modal panel */}
          <div className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div
              key="auth-modal"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 32,
                mass: 0.9,
              }}
              className="rounded-t-[2rem] sm:rounded-3xl w-full max-w-md p-6 sm:p-10 pb-10 sm:pb-10 space-y-6 sm:space-y-8 shadow-2xl border-x-0 border-b-0 sm:border max-h-[92vh] overflow-y-auto overscroll-contain no-scrollbar pointer-events-auto bg-white/90 dark:bg-slate-900/95 border-slate-200/60 dark:border-slate-700/60 backdrop-blur-2xl"
              data-lenis-prevent
              style={{ willChange: 'transform, opacity' }}
            >
            {/* Drag handle (mobile only) */}
            <div className="sm:hidden w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto -mt-2 mb-2" />

            <div className="flex justify-between items-center sticky top-0 bg-white/0 z-10">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {authMode === 'login' && 'Welcome Back'}
                {authMode === 'signup' && 'Join OdishaExamPrep'}
                {authMode === 'forgotPassword' && 'Reset Password'}
                {authMode === 'resetPassword' && 'Create New Password'}
              </h3>
              {!hideCloseButton && (
                <button onClick={onClose} className="p-2 -mr-2 bg-slate-100/70 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 rounded-full transition-colors backdrop-blur-md border border-slate-200/40 dark:border-slate-700/60 cursor-pointer">
                  <X className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </button>
              )}
            </div>

            {authMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 border rounded-2xl flex items-start gap-3 text-xs font-semibold leading-relaxed shadow-sm",
                  authMessage.type === 'error' && "bg-rose-50 dark:bg-rose-950/50 border-rose-100/80 dark:border-rose-800/60 text-rose-700 dark:text-rose-300",
                  authMessage.type === 'info' && "bg-blue-50 dark:bg-blue-950/50 border-blue-100/80 dark:border-blue-800/60 text-blue-700 dark:text-blue-300",
                  authMessage.type === 'success' && "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-100/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300"
                )}
              >
                {authMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />}
                {authMessage.type === 'info' && <Info className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />}
                {authMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />}
                <div className="flex-1">
                  {authMessage.text}
                </div>
              </motion.div>
            )}

            {(authMode === 'login' || authMode === 'signup') && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-extrabold text-base shadow-sm hover:shadow-md dark:shadow-slate-950/40 transition-all duration-200 disabled:opacity-50 cursor-pointer group"
                >
                  {googleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                  ) : (
                    <svg className="w-5 h-5 shrink-0 group-hover:scale-105 transition-transform" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.17 0 10.03 0 12s.46 3.83 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                  )}
                  <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-slate-200/80 dark:border-slate-700/60 w-full" />
                  <span className="bg-white/90 dark:bg-slate-800 backdrop-blur-md px-3 text-[11px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider absolute rounded-full border border-slate-200/40 dark:border-slate-700/60">
                    OR
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={
               authMode === 'forgotPassword'
                 ? handleForgotPasswordSubmit
                 : authMode === 'resetPassword'
                   ? handleResetPasswordSubmit
                   : handleEmailAuth
             } className="space-y-5">
               <div className="space-y-4">
                {/* Full Name field (Signup only) */}
                {authMode === 'signup' && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                      Full Name
                    </label>
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 outline-none transition-all font-medium text-base" 
                    />
                  </div>
                )}

                {/* Email field (Login, Signup, Forgot Password) */}
                {authMode !== 'resetPassword' && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      placeholder="email@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 outline-none transition-all font-medium text-base" 
                    />
                  </div>
                )}

                {/* Password field (Login, Signup, Reset Password) */}
                {authMode !== 'forgotPassword' && (
                  <div className="space-y-1.5 text-left">
                    <div className="flex justify-between items-center pl-1">
                      <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {authMode === 'resetPassword' ? "New Password" : "Password"}
                      </label>
                      {authMode === 'login' && (
                        <button
                          type="button"
                          onClick={() => setAuthMode('forgotPassword')}
                          className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline transition-all focus:outline-none border-none bg-transparent cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 outline-none transition-all font-medium text-base pr-12" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Confirm Password field (Reset Password only) */}
                {authMode === 'resetPassword' && (
                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-4 focus:ring-brand-500/15 dark:focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-400 outline-none transition-all font-medium text-base pr-12" 
                      />
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg">
                {authMode === 'login' && 'Sign In'}
                {authMode === 'signup' && 'Create Account'}
                {authMode === 'forgotPassword' && 'Send Reset Link'}
                {authMode === 'resetPassword' && 'Update Password'}
              </Button>
            </form>

            {(authMode === 'login' || authMode === 'signup') && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                {authMode === 'login' ? "New to OdishaExamPrep? " : "Already a member? "}
                <button 
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                  className="text-brand-600 dark:text-brand-400 font-extrabold hover:underline transition-all border-none bg-transparent cursor-pointer"
                >
                  {authMode === 'login' ? 'Register' : 'Login'}
                </button>
              </p>
            )}

            {authMode === 'forgotPassword' && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                Remember your password?{" "}
                <button 
                  onClick={() => setAuthMode('login')}
                  className="text-brand-600 dark:text-brand-400 font-extrabold hover:underline transition-all border-none bg-transparent cursor-pointer"
                >
                  Login
                </button>
              </p>
            )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

const LandingPage = () => {
  const { loading, user } = useAuth();
  const { t, isOdia } = useLanguage();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showGuideToast, setShowGuideToast] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleGoalCompleted = (e: any) => {
      const state: StreakState = e.detail || getStreakState(user?.id);
      toast.custom((t) => (
        <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-slate-900 border border-amber-500/40 text-white rounded-2xl shadow-2xl p-4 flex items-center gap-3.5 pointer-events-auto`}>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-7 h-7 text-amber-400 fill-current animate-bounce" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-black text-amber-400">🔥 Streak Goal Completed!</h4>
            <p className="text-xs text-slate-300 font-medium">You solved 20 questions today! You're on a <strong className="text-amber-300 font-mono">{state.currentStreak}-day roll!</strong></p>
          </div>
        </div>
      ), { duration: 5000 });
    };

    window.addEventListener('oep-streak-goal-completed', handleGoalCompleted);
    const handleOpenAuth = () => setShowAuthModal(true);
    window.addEventListener('oep-open-auth-modal', handleOpenAuth);

    return () => {
      window.removeEventListener('oep-streak-goal-completed', handleGoalCompleted);
      window.removeEventListener('oep-open-auth-modal', handleOpenAuth);
    };
  }, [user?.id]);

  // Hide WhatsApp button on mobile when auth modal is open
  useEffect(() => {
    if (window.innerWidth < 768) {
      if (showAuthModal) {
        document.body.setAttribute('data-modal-open', 'true');
      } else {
        document.body.removeAttribute('data-modal-open');
      }
    }
    return () => { document.body.removeAttribute('data-modal-open'); };
  }, [showAuthModal]);

  const [announcements, setAnnouncements] = useState<string[]>([
    `🚀 New Mock Test Series released for OSSC CGL ${new Date().getFullYear()}`,
    "📅 OPSC Prelims exam dates announced - Check latest schedule",
    "⭐ 500+ New PYQs added for OSSSC recruitment exams",
    "🔥 Weekly Current Affairs PDF now available for download",
    "✅ Real-time rank analysis enabled for all premium mock tests"
  ]);

  const navigate = useNavigate();
  const selectedExam = null;
  const setSelectedExam = (val: string | null) => {
    if (val) {
      navigate(`/exams/${val}`);
    }
  };
  const [exams, setExams] = useState<any[]>([]);
  const [focusedPrepTags, setFocusedPrepTags] = useState<any[]>([
    { label: 'OPSC CGL', examId: '' },
    { label: 'OSSC LSI', examId: '' },
    { label: 'OSSSC RI/ARI', examId: '' },
    { label: 'Police SI', examId: '' },
    { label: 'Forest Guard', examId: '' }
  ]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const fetchedExams = await examService.getAllExams();
        setExams(fetchedExams);
        const newsSettings = fetchedExams.find(e => e.name === 'SYSTEM_SETTINGS_NEWS_TICKER');
        if (newsSettings && newsSettings.description) {
          const parsed = JSON.parse(newsSettings.description);
          if (parsed.updates && parsed.updates.length > 0) {
            setAnnouncements(parsed.updates);
          }
        }
        const focusedPrepSettings = fetchedExams.find(e => e.name === 'SYSTEM_SETTINGS_FOCUSED_PREPARATION');
        if (focusedPrepSettings && focusedPrepSettings.description) {
          try {
            const parsed = JSON.parse(focusedPrepSettings.description);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setFocusedPrepTags(parsed);
            }
          } catch(e) {}
        }
      } catch(e) {}
    };
    fetchUpdates();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0b0f19] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300 relative overflow-x-clip">
      {/* Site-Wide Vector Canvas Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[0] opacity-40 dark:opacity-[0.05] bg-[radial-gradient(#94a3b8_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:24px_24px]" />
      
      {/* Floating Ambient Academic Watermarks — hidden on mobile to prevent icon collision */}
      <div className="hidden md:block fixed top-20 right-10 pointer-events-none z-[0] opacity-[0.03] dark:opacity-[0.04] text-slate-900 dark:text-white animate-watermark-spin">
        <GraduationCap className="w-96 h-96" />
      </div>
      <div className="hidden md:block fixed bottom-20 left-10 pointer-events-none z-[0] opacity-[0.03] dark:opacity-[0.04] text-slate-900 dark:text-white animate-watermark-drift">
        <Compass className="w-80 h-80" />
      </div>

      {/* Global Mouse Tracking Viewport Spotlight & Vector Cursor Follower */}
      <MouseTrackingCanvas />
      <VectorCursorFollower />



      <Navbar user={user} isAdmin={false} onSignIn={() => setShowAuthModal(true)} />

      <main className="flex-1 bg-transparent transition-colors duration-300 relative z-10">
        {/* Elite Split-Layout Hero Section */}
        <section className="relative overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-12 lg:pb-16">
          {/* Animated Mesh + Grid Background */}
          <div className="absolute inset-0 -z-10 mesh-bg opacity-100 dark:opacity-30" />
          <div className="absolute inset-0 -z-10 grid-bg opacity-60 dark:opacity-20" />
          {/* Glowing Orbs */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full -z-10 animate-orb" style={{background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', filter: 'blur(40px)'}} />
          <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full -z-10 animate-orb" style={{background: 'radial-gradient(circle, rgba(0,0,0,0.02) 0%, transparent 70%)', filter: 'blur(50px)', animationDelay: '2.5s'}} />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-12 lg:gap-16">
              {/* Specialized Content Column */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full lg:flex-1 text-center lg:text-left space-y-6 md:space-y-8 lg:space-y-10 lg:max-w-[600px] xl:max-w-[640px] lg:mx-0"
              >
                <div className="space-y-6">
                  {/* Premium Trust Badge — Mobile Zero-Truncation */}
                  <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 rounded-full sm:rounded-2xl bg-white dark:bg-slate-900 shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 dark:border-slate-800 mb-2 max-w-full">
                    <div className="flex -space-x-1.5 sm:-space-x-2 shrink-0">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-5 h-5 sm:w-7 sm:h-7 rounded-full border border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[9px] font-bold text-brand-600 dark:text-brand-400 shadow-xs">
                          {i === 1 ? <Target className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> : i === 2 ? <Award className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" /> : <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />}
                        </div>
                      ))}
                    </div>
                    <span className="text-[9.5px] sm:text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      <span className="sm:hidden">{t('home.hero.trustedByMobile', 'Trusted by 10,000+ Aspirants')}</span>
                      <span className="hidden sm:inline">{t('home.hero.trustedBy', '🎯 Trusted by 10K+ Odisha Aspirants')}</span>
                    </span>
                  </div>

                  <div className="space-y-3 md:space-y-5">
                    <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-serif font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.18] break-words">
                      {t('home.hero.title1', 'Crack Your Odisha Govt Exams with')}{" "}
                      <span className="premium-text-gradient font-serif font-extrabold">{t('home.hero.title2', 'Realistic Mock Tests')}</span>
                    </h1>
                    {/* Mobile Version (Concise 2-line hook) */}
                    <p className="block md:hidden text-xs xs:text-sm leading-relaxed text-slate-500 dark:text-slate-300 max-w-md mx-auto lg:mx-0 font-medium">
                      {t('home.hero.subtitleMobile', 'Verified PYQs, chapter practice, and mock tests for OPSC, OSSC, and OSSSC.')}
                    </p>
                    {/* Desktop Version (Original) */}
                    <p className="hidden md:block text-slate-600 dark:text-slate-300 text-sm sm:text-base md:text-lg max-w-xl mx-auto lg:mx-0 font-normal leading-relaxed">
                      {t('home.hero.subtitle', 'Stop guessing your rank. Master the OPSC, OSSC, and OSSSC syllabus with timed test series, verified PYQs, and a 24/7 AI mentor.')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 justify-center lg:justify-start pt-2 sm:pt-4 lg:pt-6 w-full">
                  <Button 
                    className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-xl rounded-2xl shadow-2xl shadow-brand-500/30 group relative overflow-hidden" 
                    onClick={() => {
                      setShowGuideToast(true);
                      setTimeout(() => setShowGuideToast(false), 6000);
                      scrollToElement('exams');
                    }}
                  >
                    <span className="relative z-10">{t('home.hero.freeMockTestBtn', 'Explore Free Mock Tests')}</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-20 group-hover:translate-y-0 transition-transform" />
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full sm:w-auto h-12 sm:h-16 px-6 sm:px-12 text-sm sm:text-xl rounded-2xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-white transition-all font-bold" 
                    onClick={() => {
                      scrollToElement('syllabus-paths');
                    }}
                  >
                    {t('home.hero.exploreExamsBtn', 'View Syllabus Paths')}
                  </Button>
                </div>

                {/* Localized Exam Categories */}
                <div className="pt-6 sm:pt-10 space-y-3 sm:space-y-4">
                  <p className="text-[10px] sm:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] lg:text-left px-4 sm:px-0">{t('home.exploreExams.title', 'Focused Preparation For:')}</p>
                  
                  {/* Horizontal scrolling row on mobile, wrapping grid on desktop */}
                  <div className="relative w-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#FAF8F5] dark:from-[#060B16] to-transparent z-10 pointer-events-none sm:hidden" />
                    <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#FAF8F5] dark:from-[#060B16] to-transparent z-10 pointer-events-none sm:hidden" />
                    
                    <div className="flex sm:flex-wrap overflow-x-auto sm:overflow-x-visible no-scrollbar justify-start sm:justify-center lg:justify-start gap-2.5 sm:gap-3 px-4 sm:px-0 -mx-4 sm:mx-0 snap-x snap-mandatory">
                      {focusedPrepTags.map((tag, idx) => {
                        const hasLink = !!tag.examId;
                        return (
                          <button 
                            key={idx} 
                            onClick={() => {
                              if (hasLink) {
                                setSelectedExam(tag.examId);
                              }
                            }}
                            className={cn(
                              "px-4 py-2 sm:px-3.5 sm:py-1.5 rounded-xl border text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-300 whitespace-nowrap shadow-sm select-none snap-center shrink-0",
                              hasLink 
                                ? "bg-brand-50/80 dark:bg-brand-950/50 border-brand-100/80 dark:border-brand-800/80 text-brand-800 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/60 hover:text-brand-900 dark:hover:text-brand-200 hover:scale-[1.03] active:scale-95 cursor-pointer" 
                                : "bg-brand-50/30 dark:bg-brand-950/20 border-brand-100/40 dark:border-brand-900/40 text-brand-700/70 dark:text-brand-400/70 cursor-default"
                            )}
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Advanced Visual Column - CBT Mock Test Preview */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="hidden lg:block flex-1 relative w-full lg:max-w-[500px]"
              >
                <DynamicVectorCard
                  glowColor="rgba(37, 99, 235, 0.25)"
                  roundedClass="rounded-[2rem]"
                  className="w-full bg-white dark:bg-slate-900 border-2 border-slate-900/80 dark:border-slate-700/80 shadow-[8px_8px_0px_rgba(37,99,235,1)] dark:shadow-[8px_8px_0px_rgba(37,99,235,0.4)]"
                >
                  <InteractiveHeroPreview />
                </DynamicVectorCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Home Dashboard Exam Readiness, Smart Recommendation & AI Study Plan System — Only render for LOGGED-IN users */}
        {user ? (
          <section className="relative z-10 py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <ExamReadinessCard userId={user?.id} onStartPracticeClick={() => scrollToElement('exams', { block: 'start', delay: 50 })} />
            <AIStudyPlanCard userId={user?.id} />
            <SmartRecommendationCard userId={user?.id} onLaunchPractice={(topic) => scrollToElement('exams', { block: 'start', delay: 50 })} />

            {(() => {
              const streak = getStreakState(user?.id);
              const progressPct = Math.min(100, Math.round((streak.todayQuestionsSolved / 20) * 100));
              const remainingQs = Math.max(0, 20 - streak.todayQuestionsSolved);

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <DynamicVectorCard className="bg-slate-900 border-2 border-slate-800 text-white p-3.5 sm:p-5 shadow-xl shadow-slate-950/20 relative overflow-hidden group">
                  <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Mobile View: Thin 44px 1-line bar */}
                  <div 
                    className="sm:hidden flex items-center justify-between gap-3 text-xs cursor-pointer"
                    onClick={() => window.dispatchEvent(new CustomEvent('oep-open-streak-modal'))}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="flex items-center gap-1 font-mono font-black text-amber-400 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        <Flame className="w-3.5 h-3.5 text-amber-400 fill-current animate-pulse" />
                        {streak.currentStreak}d
                      </span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-300 shrink-0">
                        {streak.todayQuestionsSolved}/20 Qs
                      </span>
                    </div>

                    <span className="text-[10px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider shrink-0">
                      {streak.todayGoalCompleted ? 'Goal Done ✓' : `+${remainingQs} Qs →`}
                    </span>
                  </div>

                  {/* Desktop View: Full Stat Banner */}
                  <div className="hidden sm:flex items-center justify-between gap-6">
                    <div 
                      className="flex items-center gap-3.5 cursor-pointer group/title"
                      onClick={() => window.dispatchEvent(new CustomEvent('oep-open-streak-modal'))}
                    >
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0 shadow-inner group-hover/title:scale-105 transition-transform">
                        <Flame className="w-7 h-7 text-amber-500 fill-current animate-bounce" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-white tracking-tight leading-tight group-hover/title:text-amber-400 transition-colors">
                            Daily Study Streak
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {streak.currentStreak} Day Streak
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                          Longest Record: <strong className="text-slate-200 font-mono">{streak.highestStreak} Days</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 max-w-md space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-300 text-[11px]">Today's Goal ({streak.todayQuestionsSolved}/20 Questions)</span>
                        <span className="text-amber-400 font-mono text-[11px]">{progressPct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPct}%` }}
                          transition={{ duration: 0.6 }}
                          className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={() => {
                        if (streak.todayGoalCompleted) {
                          window.dispatchEvent(new CustomEvent('oep-open-streak-modal'));
                        } else {
                          scrollToElement('exams', { block: 'start', delay: 50 });
                        }
                      }}
                      className="h-10 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 shrink-0 cursor-pointer flex items-center gap-1.5"
                    >
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      <span>{streak.todayGoalCompleted ? 'View Streak Grid' : `Solve ${remainingQs} More Qs →`}</span>
                    </Button>
                  </div>
                  </DynamicVectorCard>
                </motion.div>
              );
            })()}
          </section>
        ) : (
          <section className="relative z-10 py-3 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <DynamicVectorCard className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-7 text-slate-900 dark:text-white shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 w-full">
                <div className="space-y-2 sm:space-y-3 text-center sm:text-left max-w-2xl flex flex-col items-center sm:items-start w-full">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 border border-brand-500/20 dark:border-brand-500/30">
                    <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-600 dark:text-brand-400" />
                    {t('home.guestBanner.badge', 'Personalized Preparation Engine')}
                  </div>
                  <h3 className="text-base xs:text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-snug">
                    <span className="sm:hidden">{t('home.guestBanner.titleMobile', 'Sign In for Your AI Study Plan & Score Tracker')}</span>
                    <span className="hidden sm:inline">{t('home.guestBanner.titleDesktop', 'Sign In to Access Your Personal AI Study Plan & Score Tracker')}</span>
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t('home.guestBanner.subtitle', 'Your readiness score, daily weak-topic drills, and streak goals are securely tied to your user account.')}
                  </p>
                </div>

                <div className="w-full sm:w-auto shrink-0 flex justify-center sm:justify-start">
                  <button
                    type="button"
                    onClick={() => setShowAuthModal(true)}
                    className="w-full sm:w-auto h-11 sm:h-auto px-6 py-2.5 sm:py-3.5 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-brand-500/25 transition-all duration-200 active:scale-95 cursor-pointer border-none text-center flex items-center justify-center"
                  >
                    {t('home.guestBanner.signInBtn', 'Sign In / Register Free →')}
                  </button>
                </div>
              </div>
            </DynamicVectorCard>
          </section>
        )}

        {/* 1. Practice Core (Explore Exams) */}
        <section id="exams" className="py-6 sm:py-10 md:py-16 scroll-mt-24 bg-transparent">
          <div id="exam-gateway-wrapper" data-tour="exam-search" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
            <div id="exam-gateway-header" className="flex flex-col items-center space-y-2.5 sm:space-y-4 text-center">
              <span className="section-chip text-[10px] sm:text-xs">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {t('home.practiceModes.sectionBadge', 'Targeted Preparation Engine')}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-5xl font-serif font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.18]">
                {t('home.practiceModes.title1', 'Practice Your Way to')}{" "}
                <span className="premium-text-gradient font-serif font-extrabold">
                  {t('home.practiceModes.title2', 'Top Rank')}
                </span>
              </h2>
              {!isMobile && <div className="section-divider" />}
              {/* Mobile Version (Ultra-Short) */}
              <p className="block md:hidden text-xs xs:text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
                {t('home.practiceModes.subtitleMobile', 'Select your exam to access timed CBT mocks, chapter practice sets & verified PYQs.')}
              </p>
              {/* Desktop Version (Original) */}
              <p className="hidden md:block text-slate-500 dark:text-slate-400 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
                {t('home.practiceModes.subtitle', 'Choose between rapid untimed chapter practice, realistic timed CBT mocks, or our comprehensive reference question banks.')}
              </p>
            </div>
            <DashboardContent 
              isGuest={!user} 
              onSignIn={() => setShowAuthModal(true)} 
              selectedExam={selectedExam} 
              setSelectedExam={setSelectedExam} 
            />
          </div>
        </section>

        {/* 2. Syllabus Paths Section */}
        <SyllabusPathsSection />

        {/* 3. Exam Registry Section */}
        <ExamRegistrySection setSelectedExam={setSelectedExam} exams={exams} />

        {/* 4. Achievers' Journal Section */}
        <AchieversJournalSection />
      </main>

      <Footer />

      <AnimatePresence>
        {showGuideToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md px-4 pointer-events-none"
          >
            <div className="bg-white/80 border border-white/60 p-5 sm:p-6 rounded-[1.5rem] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] backdrop-blur-3xl saturate-150 pointer-events-auto relative overflow-hidden group flex items-start gap-4 sm:gap-5">
              <div className="absolute top-0 right-0 p-16 bg-brand-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 p-16 bg-brand-500/10 rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
              
              <div className="w-12 h-12 sm:w-14 sm:h-14 premium-gradient rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/20 group-hover:scale-110 transition-transform relative z-10">
                <HelpCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              
              <div className="space-y-1.5 pr-8 relative z-10">
                <h4 className="font-extrabold text-[15px] sm:text-lg tracking-tight text-slate-900 flex items-center gap-2">
                  How to Practice for Free?
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                  </span>
                </h4>
                <p className="text-slate-600 text-xs sm:text-[15px] font-medium leading-relaxed">
                  To access free tests, scroll down to the <span className="text-brand-600 font-extrabold bg-brand-50 px-1.5 py-0.5 rounded-md">Explore Exams</span> section and select your target exam.
                </p>
              </div>

              <button 
                onClick={() => setShowGuideToast(false)} 
                className="absolute top-4 right-4 p-2 bg-slate-100/60 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-600 z-10 backdrop-blur-sm shadow-sm"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};

const AttemptPerformanceModal = ({ isOpen, onClose, title, activity, totalQs, totalMarks, onAction }: any) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);

  const isCompleted = activity?.type === 'mock_test_completed' || activity?.type === 'practice_test_completed';
  const score = activity?.score || 0;
  const maxMarks = activity?.totalMarks || totalMarks || 100;
  const accuracy = activity?.accuracy || 0;
  const timestamp = activity?.timestamp ? new Date(activity.timestamp).toLocaleDateString() : 'Recent';
  const currentQ = (activity?.metadata?.currentQuestionIndex || 0) + 1;
  const progressPercent = totalQs > 0 ? Math.min(100, Math.round((currentQ / totalQs) * 100)) : 0;

  useEffect(() => {
    if (!isOpen) {
      setAnimatedScore(0);
      setAnimatedAccuracy(0);
      return;
    }

    const duration = 600;
    const startTime = performance.now();

    const updateCounters = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setAnimatedScore(Math.round(score * easeProgress));
      setAnimatedAccuracy(Math.round(accuracy * easeProgress));

      if (progress < 1) {
        requestAnimationFrame(updateCounters);
      }
    };

    requestAnimationFrame(updateCounters);
  }, [isOpen, score, accuracy]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl max-w-md w-full p-6 space-y-5 relative overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pr-8">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 transition-transform duration-500 scale-100 hover:scale-105",
                isCompleted ? "bg-gradient-to-br from-emerald-500 to-teal-600" : "bg-gradient-to-br from-amber-400 to-orange-500"
              )}>
                {isCompleted ? <CheckCircle2 className="w-6 h-6 animate-pulse" /> : <Clock className="w-6 h-6 animate-pulse" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Attempt Details</span>
                <h3 className="font-extrabold text-slate-900 text-base sm:text-lg leading-tight uppercase truncate">{title}</h3>
              </div>
            </div>

            {isCompleted ? (
              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-gradient-to-br from-emerald-50/90 to-emerald-100/40 rounded-2xl border border-emerald-200/60 text-center space-y-1 shadow-xs">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Score</span>
                    <p className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono tracking-tight">{animatedScore} <span className="text-xs text-emerald-700 font-semibold font-sans">/ {maxMarks}</span></p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-teal-50/90 to-teal-100/40 rounded-2xl border border-teal-200/60 text-center space-y-1 shadow-xs">
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider">Accuracy</span>
                    <p className="text-2xl sm:text-3xl font-black text-teal-950 font-mono tracking-tight">{animatedAccuracy}%</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between font-medium text-slate-600">
                  <span>Attempted Date:</span>
                  <span className="font-bold text-slate-900">{timestamp}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-100/60 space-y-2.5 text-left">
                  <div className="flex justify-between text-amber-900 text-xs font-extrabold">
                    <span>Current Progress:</span>
                    <span className="font-mono text-amber-950">Question {currentQ} of {totalQs} ({progressPercent}%)</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden p-0.5 relative">
                    <motion.div 
                      initial={{ width: "0%" }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 h-1.5 rounded-full relative overflow-hidden shadow-xs"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                    </motion.div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onAction) onAction();
                }}
                className="flex-1 py-3 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {isCompleted ? <RotateCw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isCompleted ? 'Retake Now' : 'Resume Now'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const ScheduledMockTestCard = ({ test, onLaunchMockTest }: any) => {
  let parsedSchedule = null;
  if (test?.seriesId && typeof test.seriesId === 'string' && test.seriesId.startsWith('{')) {
    try { parsedSchedule = JSON.parse(test.seriesId).scheduled_at || JSON.parse(test.seriesId).scheduledAt || null; } catch (e) {}
  }
  const rawScheduledAt = test?.scheduled_at || test?.scheduledAt || parsedSchedule;
  const countdown = useCountdown(rawScheduledAt);
  const isScheduledUpcoming = !countdown.isLive;

  return (
    <motion.div 
      key={test.id}
      {...scaleIn}
      whileHover={isScheduledUpcoming ? undefined : whileHover.liftTap}
      whileTap={isScheduledUpcoming ? undefined : whileTap.press}
      className="w-full h-full"
    >
      <DynamicVectorCard
        roundedClass="rounded-2xl"
        glowColor="rgba(99, 102, 241, 0.28)"
        className="w-full h-full"
        onClick={() => { if (!isScheduledUpcoming) onLaunchMockTest(test); }}
      >
      <div
        className={cn(
          "group relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border p-5 transition-[background-color,border-color,box-shadow] duration-500 flex flex-col justify-between gap-4 overflow-hidden h-full",
          isScheduledUpcoming
            ? "border-amber-200/90 bg-amber-50/20 cursor-not-allowed"
            : "border-slate-200/60 hover:border-brand-300 cursor-pointer"
        )}
      >
        <div className="flex items-start gap-4 relative z-10">
          <div 
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-shadow duration-300",
              isScheduledUpcoming ? "bg-gradient-to-br from-amber-500 to-orange-600" : ""
            )}
            style={!isScheduledUpcoming ? { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } : undefined}
          >
            {isScheduledUpcoming ? (
              <Calendar className="w-6 h-6 text-white" />
            ) : (
              <Timer className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-600">Mock Test</span>
              {isScheduledUpcoming ? (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200/80">
                  📅 UPCOMING
                </span>
              ) : test.scheduled_at ? (
                <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded border border-emerald-200 flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> LIVE NOW
                </span>
              ) : null}
            </div>
            <h4 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-brand-700 transition-colors line-clamp-2">
              {test.title}
            </h4>
          </div>
        </div>

        {isScheduledUpcoming ? (
          <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5 relative z-10 text-left">
            <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Release Countdown</span>
              <span className="font-mono text-xs tracking-wider font-black text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded-md border border-amber-300/60">{countdown.formattedCountdown}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 pt-0.5">
              <span>Scheduled for {countdown.formattedScheduledDate}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium relative z-10 mt-1">
            <span className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <Clock3 className="w-3.5 h-3.5 text-slate-600" />{test.durationMinutes || 60} mins
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
            </span>
          </div>
        )}

        {isScheduledUpcoming ? (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="w-full mt-auto py-3 rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm bg-amber-500/15 border-2 border-amber-400 text-amber-950 shadow-sm cursor-not-allowed pointer-events-none"
          >
            <Lock className="w-4 h-4 text-amber-800 shrink-0" />
            <span className="text-amber-950 font-black tracking-tight">Unlocks {countdown.formattedScheduledDate}</span>
          </button>
        ) : (
          <button
            className="w-full mt-auto py-3 text-sm font-bold text-white rounded-xl shadow-md transition-all duration-300 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-white">
              Start Test <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        )}
      </div>
      </DynamicVectorCard>
    </motion.div>
  );
};

const ScheduledPracticeBankCard = React.memo(({ bank, hasAccessTo, activities, handleStartDirectPractice, isMobile }: any) => {
  const { t } = useLanguage();
  const [showAttemptModal, setShowAttemptModal] = useState(false);

  let isPremium = bank.isPremium ?? false;
  let price = bank.price || 499;
  let originalPrice = bank.originalPrice || 999;

  let parsedSchedule = null;
  if (bank?.seriesId && typeof bank.seriesId === 'string' && bank.seriesId.startsWith('{')) {
    try { parsedSchedule = JSON.parse(bank.seriesId).scheduled_at || JSON.parse(bank.seriesId).scheduledAt || null; } catch (e) {}
  }

  if (bank?.tagline && typeof bank.tagline === 'string' && bank.tagline.startsWith('{')) {
    try {
      const parsedTagline = JSON.parse(bank.tagline);
      if (parsedTagline.isPremium !== undefined) isPremium = Boolean(parsedTagline.isPremium);
      if (parsedTagline.price !== undefined) price = Number(parsedTagline.price);
      if (parsedTagline.originalPrice !== undefined) originalPrice = Number(parsedTagline.originalPrice);
    } catch(e) {}
  }

  const rawScheduledAt = bank?.scheduled_at || bank?.scheduledAt || parsedSchedule;
  const countdown = useCountdown(rawScheduledAt);
  const isScheduledUpcoming = !countdown.isLive;

  const effectiveBank = { ...bank, isPremium, price, originalPrice };
  const isLocked = !isScheduledUpcoming && isPremium && !hasAccessTo(effectiveBank);
  const isPremiumUnlocked = !isScheduledUpcoming && isPremium && hasAccessTo(effectiveBank);

  const cleanBankTitle = bank.title ? bank.title.toLowerCase().replace(/(\s*-\s*Practice Session)+$/gi, '').trim() : '';

  const completedAct = activities?.find((act: any) => {
    if (act.type !== 'mock_test_completed' && act.type !== 'practice_test_completed') return false;
    const actBankId = act.metadata?.bankId || act.metadata?.test?.bankId;
    if (actBankId && bank.id && actBankId === bank.id) return true;
    const actTestId = act.metadata?.test?.id || act.id;
    if (actTestId && bank.id && actTestId === bank.id) return true;
    if (act.title) {
      const cleanActTitle = act.title.toLowerCase().replace(/(\s*-\s*Practice Session)+$/gi, '').trim();
      if (cleanActTitle && cleanBankTitle && (cleanActTitle === cleanBankTitle || cleanActTitle.includes(cleanBankTitle) || cleanBankTitle.includes(cleanActTitle))) {
        return true;
      }
    }
    return false;
  });
  const isCompleted = !isScheduledUpcoming && !!completedAct;

  const suffixMatch = bank.title.match(/(?:\s+|-\s*)(I{1,3}|IV|V|VI{0,3}|IX|X|\d{1,2})\s*$/i);
  let mainTitle = bank.title;
  let suffix = '';
  if (suffixMatch) {
    suffix = suffixMatch[1].toUpperCase();
    mainTitle = bank.title.substring(0, suffixMatch.index).trim();
    if (mainTitle.endsWith('-')) {
      mainTitle = mainTitle.substring(0, mainTitle.length - 1).trim();
    }
  }

  const incompleteAct = !isCompleted && !isScheduledUpcoming && activities?.find((act: any) => {
    if (act.type !== 'test_incomplete') return false;
    const actBankId = act.metadata?.bankId || act.metadata?.test?.bankId;
    if (actBankId && bank.id && actBankId === bank.id) return true;
    const actTestId = act.metadata?.test?.id || act.id;
    if (actTestId && bank.id && actTestId === bank.id) return true;
    if (act.title) {
      const cleanActTitle = act.title.toLowerCase().replace(/(\s*-\s*Practice Session)+$/gi, '').trim();
      if (cleanActTitle && cleanBankTitle && (cleanActTitle === cleanBankTitle || cleanActTitle.includes(cleanBankTitle) || cleanBankTitle.includes(cleanActTitle))) {
        return true;
      }
    }
    return false;
  });
  const isInProgress = !isScheduledUpcoming && !!incompleteAct;

  let parsedPdfQs = 0;
  if (bank.pdfUrl && typeof bank.pdfUrl === 'string' && bank.pdfUrl.startsWith('{')) {
    try {
      const parsed = JSON.parse(bank.pdfUrl);
      if (Array.isArray(parsed.questionsData)) parsedPdfQs = parsed.questionsData.length;
      else if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].questionText || parsed[0].question)) parsedPdfQs = parsed.length;
    } catch(e) {}
  }
  const actualQs = bank.practiceQuestionCount || bank.actualQuestionCount || 0;
  const adminQs = bank.questionCount || bank.question_count || 0;
  const arrayQs = Array.isArray(bank.questions) ? bank.questions.length : (Array.isArray(bank.questionsData) ? bank.questionsData.length : 0);
  const totalQs = actualQs > 0 ? actualQs : (parsedPdfQs > 0 ? parsedPdfQs : (arrayQs > 0 ? arrayQs : (adminQs > 0 ? adminQs : 0)));

  const currentQuestionIndex = incompleteAct ? ((incompleteAct.metadata?.currentQuestionIndex || 0) + 1) : 0;
  const progressPercent = totalQs > 0 ? Math.min(100, Math.round((currentQuestionIndex / totalQs) * 100)) : 0;

  return (
    <motion.div
      key={bank.id}
      initial={false}
      animate={isMobile ? undefined : { opacity: 1, y: 0 }}
      exit={isMobile ? undefined : { opacity: 0, scale: 0.95 }}
      whileHover={isMobile || isScheduledUpcoming ? undefined : whileHover.liftTap}
      whileTap={isScheduledUpcoming ? undefined : whileTap.press}
      className="w-full h-full cv-card-auto"
    >
      {isMobile ? (
        <div
          onClick={() => {
            if (!isScheduledUpcoming) handleStartDirectPractice(effectiveBank);
          }}
          className={cn(
            "p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 relative overflow-hidden text-slate-900 dark:text-white cv-card-auto",
            isScheduledUpcoming
              ? "border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 cursor-not-allowed opacity-90"
              : isCompleted
                ? "border-emerald-250 dark:border-emerald-800 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.04)] active:border-emerald-350 cursor-pointer"
                : isInProgress
                  ? "border-amber-255 dark:border-amber-800 shadow-[0_4px_16px_-4px_rgba(245,158,11,0.04)] active:border-amber-360 cursor-pointer"
                  : isLocked
                    ? "border-amber-200/80 dark:border-amber-800/80 shadow-[0_4px_16px_-4px_rgba(245,158,11,0.08)] active:border-amber-400 cursor-pointer"
                    : isPremiumUnlocked
                      ? "border-emerald-200/80 dark:border-emerald-800/80 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.06)] active:border-emerald-400 cursor-pointer"
                      : "border-slate-100 dark:border-slate-800 shadow-[0_4px_16px_-4px_rgba(79,70,229,0.03)] active:border-brand-300 cursor-pointer"
          )}
        >
          <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border relative",
              isScheduledUpcoming
                ? "bg-amber-50 border-amber-200 text-amber-700"
                : isCompleted
                  ? "bg-emerald-50/60 border-emerald-100/30 text-emerald-600"
                  : isInProgress
                    ? "bg-amber-50/60 border-amber-100/30 text-amber-600"
                    : isLocked
                      ? "bg-amber-50/80 border-amber-200 text-amber-700"
                      : isPremiumUnlocked
                        ? "bg-emerald-50/60 border-emerald-100/30 text-emerald-600"
                        : "bg-indigo-50/60 border-indigo-100/30 text-indigo-650"
            )}>
              {isScheduledUpcoming ? (
                <Calendar className="w-5 h-5" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5 relative z-10" />
              ) : isInProgress ? (
                <Play className="w-5 h-5 relative z-10 ml-0.5" />
              ) : isLocked ? (
                <Lock className="w-5 h-5 relative z-10" />
              ) : (
                <Play className="w-5 h-5 relative z-10 ml-0.5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-[13.5px] text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2 uppercase pr-2">{mainTitle}</h4>
                {isScheduledUpcoming ? (
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[8.5px] font-black rounded border border-amber-200 dark:border-amber-800 uppercase tracking-wider shrink-0">📅 UPCOMING</span>
                ) : isCompleted ? (
                  <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-black rounded border border-emerald-100/60 dark:border-emerald-800 uppercase tracking-wider shrink-0 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> {t('exams.cardActions.retake', 'COMPLETED')}</span>
                ) : isInProgress ? (
                  <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[8.5px] font-black rounded border border-amber-100 dark:border-amber-800 uppercase tracking-wider shrink-0 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5 animate-pulse" /> {progressPercent}%</span>
                ) : isLocked ? (
                  <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[8.5px] font-black rounded border border-amber-200 dark:border-amber-800 uppercase tracking-wider shrink-0 flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" /> ₹{price}</span>
                ) : isPremiumUnlocked ? (
                  <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-black rounded border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider shrink-0">👑 PREMIUM</span>
                ) : (
                  <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-black rounded border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider shrink-0">🎁 FREE DEMO</span>
                )}
                {suffix && (
                  <span className="px-1.5 py-0.5 bg-brand-50 dark:bg-indigo-950/60 text-brand-700 dark:text-indigo-300 text-[8.5px] font-black rounded border border-brand-100/60 dark:border-indigo-800 uppercase tracking-wider shrink-0">SET {suffix}</span>
                )}
              </div>
              {totalQs > 0 && (
                <div className="flex items-center gap-2 mt-2 text-[10px] font-extrabold text-slate-555 dark:text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-100/60 dark:border-slate-700/60"><FileText className="w-3 h-3 text-slate-400" /> {t('exams.details.questions', `${totalQs} Questions`, { count: totalQs })}</span>
                  <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-100/60 dark:border-slate-700/60"><Clock className="w-3.5 h-3.5 text-slate-400" /> {t('exams.details.duration', `${totalQs} Mins`, { mins: totalQs })}</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0 shadow-2xs">
            {isScheduledUpcoming ? (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            ) : isCompleted ? (
              <RotateCw className="w-3.5 h-3.5 text-emerald-600" />
            ) : isInProgress ? (
              <Play className="w-3.5 h-3.5 text-amber-600 fill-amber-600/20" />
            ) : isLocked ? (
              <Lock className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>
      ) : (
        <DynamicVectorCard
          roundedClass="rounded-[1.5rem]"
          glowColor={isLocked ? "rgba(245, 158, 11, 0.28)" : "rgba(99, 102, 241, 0.28)"}
          className="w-full h-full cv-card-auto"
          onClick={() => { if (!isScheduledUpcoming) handleStartDirectPractice(effectiveBank); }}
        >
        <div
          className={cn(
            "p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-indigo-500/20 shadow-lg shadow-slate-200/30 dark:shadow-indigo-950/20 rounded-[1.5rem] transition-all duration-300 flex flex-col justify-between gap-6 relative overflow-hidden h-full text-slate-900 dark:text-white cv-card-auto",
            isScheduledUpcoming
              ? "border-amber-200 dark:border-amber-800 cursor-not-allowed"
              : isCompleted
                ? "border-emerald-200 dark:border-emerald-800 cursor-pointer"
                : isInProgress
                  ? "border-amber-250 dark:border-amber-800 cursor-pointer"
                  : isLocked
                    ? "border-amber-200 dark:border-amber-800/60 hover:border-amber-400 cursor-pointer"
                    : "border-slate-200 dark:border-indigo-500/20 cursor-pointer"
          )}
        >
          <div className="flex items-start justify-between relative z-10 w-full">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white transition-transform relative mt-0.5",
                isScheduledUpcoming
                  ? "bg-amber-500"
                  : isCompleted 
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600" 
                    : isInProgress
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse"
                      : isLocked
                        ? "bg-gradient-to-br from-amber-500 to-orange-600"
                        : isPremiumUnlocked
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                          : "bg-gradient-to-br from-brand-500 to-indigo-600"
              )}>
                {isScheduledUpcoming ? (
                  <Calendar className="w-6 h-6" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : isInProgress ? (
                  <Play className="w-6 h-6 fill-white/10 ml-0.5 animate-pulse" />
                ) : isLocked ? (
                  <Lock className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 fill-white/10 ml-0.5" />
                )}
                <div className="absolute inset-0 border-2 border-white/20 rounded-xl" />
              </div>

              <div className="text-left min-w-0 flex-1">
                <h4 className="font-black text-base sm:text-lg text-slate-900 dark:text-white tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors uppercase leading-snug line-clamp-2" title={bank.title}>{mainTitle}</h4>
                <div className="flex items-center flex-wrap gap-1.5 mt-1">
                  {isScheduledUpcoming ? (
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                      📅 UPCOMING
                    </span>
                  ) : bank.scheduled_at ? (
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> {t('exams.cardActions.liveNow', 'LIVE NOW')}
                    </span>
                  ) : isCompleted ? (
                    <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest bg-emerald-100 px-2.5 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED
                    </span>
                  ) : isInProgress ? (
                    <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest bg-amber-100 px-2.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> IN PROGRESS ({progressPercent}%)
                    </span>
                  ) : isLocked ? (
                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> PREMIUM (₹{price})
                    </span>
                  ) : isPremiumUnlocked ? (
                    <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      👑 PREMIUM
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      🎁 FREE DEMO
                    </span>
                  )}
                  {suffix && (
                    <span className="text-[10px] font-black text-brand-700 dark:text-indigo-300 uppercase tracking-widest bg-brand-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-brand-100/60 dark:border-indigo-800 shadow-2xs">Set {suffix}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {isScheduledUpcoming ? (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 space-y-1.5 relative z-10 text-left">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-900">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" /> Release Countdown</span>
                <span className="font-mono text-xs tracking-wider font-black text-amber-950 bg-amber-200/60 px-2 py-0.5 rounded-md border border-amber-300/60">{countdown.formattedCountdown}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 pt-0.5">
                <span>Scheduled for {countdown.formattedScheduledDate}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1 relative z-10 pt-2 text-left">
              <div className="flex gap-4 text-xs font-bold text-slate-555 dark:text-slate-300 flex-wrap">
                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-100/60 dark:border-slate-700/60"><FileText className="w-3.5 h-3.5 text-slate-400"/> {t('exams.details.questions', `${totalQs} Questions`, { count: totalQs })}</span>
                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-100/60 dark:border-slate-700/60"><Clock className="w-3.5 h-3.5 text-slate-400"/> {t('exams.details.duration', `${totalQs} Mins`, { mins: totalQs })}</span>
              </div>
            </div>
          )}

          {isScheduledUpcoming ? (
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="w-full h-[48px] rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm bg-amber-500/15 border-2 border-amber-400 text-amber-950 shadow-sm cursor-not-allowed mt-auto pointer-events-none relative z-10"
            >
              <Lock className="w-4 h-4 text-amber-800 shrink-0" />
              <span className="text-amber-950 font-black tracking-tight">Unlocks {countdown.formattedScheduledDate}</span>
            </button>
          ) : isCompleted ? (
            <div className="flex items-center gap-2 w-full mt-auto relative z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttemptModal(true);
                }}
                className="w-1/3 h-[48px] rounded-xl flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm bg-emerald-50 text-emerald-700 border border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-xs shrink-0"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span className="truncate">Score</span>
              </button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartDirectPractice(effectiveBank);
                }}
                className="flex-1 h-[48px] rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all shadow-md bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40 cursor-pointer"
              >
                <RotateCw className="w-4 h-4" /> {t('exams.cardActions.retake', 'Retake')}
              </Button>
            </div>
          ) : isInProgress ? (
            <div className="flex items-center gap-2 w-full mt-auto relative z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttemptModal(true);
                }}
                className="w-1/3 h-[48px] rounded-xl flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm bg-amber-50 text-amber-700 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-xs shrink-0"
              >
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span className="truncate">Progress</span>
              </button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartDirectPractice(effectiveBank, incompleteAct);
                }}
                className="flex-1 h-[48px] rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm transition-all shadow-md bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20 hover:shadow-amber-500/40 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white/20" /> {t('exams.cardActions.resume', 'Resume')} ({progressPercent}%)
              </Button>
            </div>
          ) : (
            <Button 
              variant={isLocked ? "outline" : "primary"}
              onClick={(e) => {
                e.stopPropagation();
                handleStartDirectPractice(effectiveBank);
              }}
              className={cn(
                "w-full h-[48px] rounded-xl font-black text-sm relative z-10 transition-all overflow-hidden group/btn mt-auto",
                !isLocked
                  ? "premium-gradient text-white shadow-lg shadow-brand-500/20 group-hover:premium-glow cursor-pointer"
                  : "border-amber-200 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:border-amber-300 cursor-pointer"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4 mr-1" />
                    {t('exams.cardActions.unlockTest', 'Unlock Test')} (₹{price})
                  </>
                ) : (
                  <>
                    {t('exams.cardActions.practiceNow', 'Start Practice')} <ChevronRight className="w-4 h-4 sm:ml-1 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>
                )}
              </span>
            </Button>
          )}
        </div>
        </DynamicVectorCard>
      )}

      <AttemptPerformanceModal
        isOpen={showAttemptModal}
        onClose={() => setShowAttemptModal(false)}
        title={bank.title}
        activity={completedAct || incompleteAct}
        totalQs={totalQs}
        totalMarks={totalQs}
        onAction={() => {
          if (isInProgress && incompleteAct) {
            handleStartDirectPractice(effectiveBank, incompleteAct);
          } else {
            handleStartDirectPractice(effectiveBank);
          }
        }}
      />
    </motion.div>
  );
});

const ExamDetailMockTestCard = React.memo(({ test, isMobile, hasAccessTo, activities, handleStartTest }: any) => {
  const { t } = useLanguage();
  const [showAttemptModal, setShowAttemptModal] = useState(false);
  let isPremium = test.isPremium;
  let price = test.price || 499;
  let testExamId = '';
  let parsedSchedule = null;
  if (test.seriesId && typeof test.seriesId === 'string' && test.seriesId.startsWith('{')) {
    try { 
      const parsed = JSON.parse(test.seriesId);
      isPremium = parsed.isPremium !== undefined ? parsed.isPremium : isPremium; 
      price = parsed.price || 499;
      testExamId = parsed.examId || '';
      parsedSchedule = parsed.scheduled_at || parsed.scheduledAt || null;
    } catch(e) {}
  }

  const rawScheduledAt = test?.scheduled_at || test?.scheduledAt || parsedSchedule;
  const countdown = useCountdown(rawScheduledAt);
  const isScheduledUpcoming = !countdown.isLive;
  const isLocked = !isScheduledUpcoming && isPremium && !hasAccessTo(test, testExamId);
  const isPremiumUnlocked = !isScheduledUpcoming && isPremium && hasAccessTo(test, testExamId);

  const completedAct = useMemo(() => {
    if (isScheduledUpcoming || !activities) return null;
    return activities.find((act: any) => 
      (act.type === 'mock_test_completed' || act.type === 'practice_test_completed') && 
      act.metadata?.test?.id === test.id
    );
  }, [isScheduledUpcoming, activities, test.id]);
  const isCompleted = !isScheduledUpcoming && !!completedAct;

  const incompleteAct = useMemo(() => {
    if (isCompleted || isScheduledUpcoming || !activities) return null;
    return activities.find((act: any) => 
      act.type === 'test_incomplete' && 
      act.metadata?.test?.id === test.id
    );
  }, [isCompleted, isScheduledUpcoming, activities, test.id]);
  const isInProgress = !isScheduledUpcoming && !!incompleteAct;

  const actualQs = test.practiceQuestionCount || test.actualQuestionCount || 0;
  const adminQs = test.questionCount || test.question_count || test.totalQuestions || 0;
  const totalQs = actualQs > 0 ? actualQs : (adminQs > 0 ? adminQs : (test.questions?.length || test._questionCount || 0));

  const solvedCount = incompleteAct ? Object.keys(incompleteAct.metadata?.answersById || incompleteAct.metadata?.answers || {}).length : 0;
  const currentQuestionIndex = incompleteAct ? (incompleteAct.metadata?.currentQuestionIndex || 0) : 0;
  const activeProgressCount = solvedCount > 0 ? solvedCount : (incompleteAct ? (currentQuestionIndex + 1) : 0);
  const progressPercent = totalQs > 0 ? Math.min(100, Math.round((activeProgressCount / totalQs) * 100)) : 0;

  const suffixMatch = test.title.match(/(?:\s+|-\s*)(I{1,3}|IV|V|VI{0,3}|IX|X|\d{1,2})\s*$/i);
  let mainTitle = test.title;
  let suffix = '';
  if (suffixMatch) {
    suffix = suffixMatch[1].toUpperCase();
    mainTitle = test.title.substring(0, suffixMatch.index).trim();
    if (mainTitle.endsWith('-')) {
      mainTitle = mainTitle.substring(0, mainTitle.length - 1).trim();
    }
  }

  return (
    <motion.div
      initial={false}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={isMobile || isScheduledUpcoming ? undefined : whileHover.liftTap}
      whileTap={isScheduledUpcoming ? undefined : whileTap.press}
      className="w-full cv-card-auto"
    >
      {isMobile ? (
        <div
          onClick={() => {
            if (!isScheduledUpcoming) handleStartTest({ ...test, isPremium, price });
          }}
          className={cn(
            "px-3 py-2.5 sm:p-4 bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl flex items-center justify-between gap-3 group relative overflow-hidden transition-all duration-300 text-slate-900 dark:text-white",
            isScheduledUpcoming
              ? "border-amber-200 dark:border-amber-800 bg-amber-50/20 dark:bg-amber-950/20 cursor-not-allowed opacity-90"
              : isCompleted
                ? "border-emerald-250 dark:border-emerald-800 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.04)] active:border-emerald-350 cursor-pointer"
                : isInProgress
                  ? "border-amber-250 dark:border-amber-800 shadow-[0_4px_16px_-4px_rgba(245,158,11,0.04)] active:border-amber-355 cursor-pointer"
                  : isLocked 
                    ? "border-slate-100 dark:border-slate-800 shadow-[0_4px_16px_-4px_rgba(245,158,11,0.03),0_1px_2px_rgba(245,158,11,0.01)] active:border-amber-300 cursor-pointer"
                    : isPremiumUnlocked
                      ? "border-slate-100 dark:border-slate-800 shadow-[0_4px_16px_-4px_rgba(16,185,129,0.03),0_1px_2px_rgba(16,185,129,0.01)] active:border-emerald-300 cursor-pointer"
                      : "border-slate-100 dark:border-slate-800 shadow-[0_4px_16px_-4px_rgba(79,70,229,0.03),0_1px_2px_rgba(79,70,229,0.01)] active:border-brand-300 cursor-pointer"
          )}
        >
          <div className={cn(
            "absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none",
            isScheduledUpcoming
              ? "bg-amber-500/0"
              : isLocked 
                ? "bg-gradient-to-r from-amber-500/0 via-amber-500/[0.01] to-amber-500/0"
                : isPremiumUnlocked || isCompleted
                  ? "bg-gradient-to-r from-emerald-500/0 via-emerald-500/[0.01] to-emerald-500/0"
                  : "bg-gradient-to-r from-brand-500/0 via-brand-500/[0.01] to-brand-500/0"
          )} />
          <div className={cn(
            "absolute left-0 top-0 bottom-0 w-[4px] rounded-r-sm opacity-90",
            isScheduledUpcoming
              ? "bg-gradient-to-b from-amber-400 to-orange-500"
              : isCompleted
                ? "bg-gradient-to-b from-emerald-400 to-teal-500"
                : isInProgress
                  ? "bg-gradient-to-b from-amber-450 to-orange-500"
                  : isLocked 
                    ? "bg-gradient-to-b from-amber-400 to-orange-500" 
                    : isPremiumUnlocked 
                      ? "bg-gradient-to-b from-emerald-400 to-teal-500" 
                      : "bg-gradient-to-b from-indigo-500 to-purple-600"
          )} />

          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1 pl-1">
            <div className={cn(
              "w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border relative",
              isScheduledUpcoming
                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                : isCompleted
                  ? "bg-emerald-50/60 dark:bg-emerald-950/60 border-emerald-100/30 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300"
                  : isInProgress
                    ? "bg-amber-50/60 dark:bg-amber-950/60 border-amber-100/30 dark:border-amber-800 text-amber-600 dark:text-amber-300"
                    : isLocked 
                      ? "bg-amber-50/60 dark:bg-amber-950/60 border-amber-100/30 dark:border-amber-800 text-amber-600 dark:text-amber-300" 
                      : isPremiumUnlocked 
                        ? "bg-emerald-50/60 dark:bg-emerald-950/60 border-emerald-100/30 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300" 
                        : "bg-indigo-50/60 dark:bg-[#060B16] border-indigo-100/30 dark:border-slate-800 text-indigo-650 dark:text-blue-400"
            )}>
              {isScheduledUpcoming ? (
                <Calendar className="w-4.5 h-4.5 text-amber-700 dark:text-amber-300" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-4.5 h-4.5 relative z-10" />
              ) : isInProgress ? (
                <Play className="w-4 h-4 text-amber-600 fill-amber-500/10 animate-pulse relative z-10" />
              ) : (
                <Target className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
              )}
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-extrabold text-[13px] sm:text-[14px] text-slate-900 dark:text-white tracking-tight leading-snug line-clamp-2 uppercase pr-1" title={test.title}>{mainTitle}</h4>
                {suffix && (
                  <span className="px-1.5 py-0.5 bg-brand-50 dark:bg-indigo-950/60 text-brand-700 dark:text-indigo-300 text-[8.5px] font-black rounded border border-brand-100/60 dark:border-indigo-800 uppercase tracking-wider shrink-0">Set {suffix}</span>
                )}
                {isScheduledUpcoming ? (
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[8.5px] font-black rounded border border-amber-200 dark:border-amber-800 uppercase tracking-wider shrink-0">📅 UPCOMING</span>
                ) : isCompleted ? (
                  <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[8.5px] font-black rounded border border-emerald-100/60 dark:border-emerald-800 uppercase tracking-wider shrink-0 flex items-center gap-0.5"><CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" /> COMPLETED</span>
                ) : isInProgress ? (
                  <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[8.5px] font-black rounded border border-amber-100 dark:border-amber-800 uppercase tracking-wider shrink-0 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5 animate-pulse" /> {progressPercent}%</span>
                ) : isPremium && (
                  isLocked ? (
                    <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 text-[8.5px] font-black rounded border border-amber-100 dark:border-amber-800 uppercase tracking-wider shrink-0">Premium</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[8.5px] font-black rounded border border-emerald-100 dark:border-emerald-800 uppercase tracking-wider shrink-0">Active</span>
                  )
                )}
              </div>
              
              {isScheduledUpcoming ? (
                <div className="mt-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Starts in <strong className="font-mono text-amber-900 dark:text-amber-200">{countdown.formattedCountdown}</strong></span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-1.5 sm:mt-2 text-[9.5px] sm:text-[10px] font-extrabold text-slate-500 dark:text-slate-300 flex-nowrap overflow-hidden">
                  <span className="flex items-center gap-0.5 bg-slate-50 dark:bg-[#060B16] px-1.5 py-0.5 rounded-md border border-slate-100/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 dark:text-blue-400" /> {t('exams.details.duration', `${test.durationMinutes}m`, { mins: test.durationMinutes })}</span>
                  <span className="flex items-center gap-0.5 bg-slate-50 dark:bg-[#060B16] px-1.5 py-0.5 rounded-md border border-slate-100/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0"><Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 dark:text-amber-400" /> {t('exams.details.totalMarks', `${test.totalMarks}M`, { marks: test.totalMarks })}</span>
                  <span className="flex items-center gap-0.5 bg-slate-50 dark:bg-[#060B16] px-1.5 py-0.5 rounded-md border border-slate-100/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0"><FileText className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400 dark:text-emerald-400" /> {t('exams.details.questions', `${totalQs}Q`, { count: totalQs })}</span>
                  {isCompleted && completedAct && (
                    <span className="flex items-center gap-0.5 bg-emerald-50/50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md border border-emerald-100/30 dark:border-emerald-800 shrink-0">
                      Score: {completedAct.score}/{completedAct.totalMarks || test.totalMarks}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center shrink-0 shadow-2xs group-active:translate-x-0.5 transition-all duration-300",
            isScheduledUpcoming
              ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
              : isCompleted 
                ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 group-active:bg-emerald-500 group-active:text-white"
                : isInProgress
                  ? "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-300 group-active:bg-amber-500 group-active:text-white animate-pulse"
                  : isLocked
                    ? "bg-amber-50 dark:bg-amber-950/60 border-amber-100 dark:border-amber-800 text-amber-600 dark:text-amber-300 group-active:bg-amber-500 group-active:text-white"
                    : isPremiumUnlocked
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 group-active:bg-emerald-500 group-active:text-white"
                      : "bg-slate-50 dark:bg-[#060B16] border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-300 group-active:bg-blue-600 dark:group-active:bg-blue-600 group-active:text-white"
          )}>
            {isScheduledUpcoming ? (
              <Lock className="w-3.5 h-3.5 text-amber-700" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isInProgress ? (
              <Play className="w-3 h-3 fill-amber-500/10" />
            ) : isLocked ? (
              <Lock className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </div>
        </div>
      ) : (
        <Card 
          key={test.id} 
          className={cn(
            "p-6 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 border border-slate-200/80 dark:border-indigo-500/20 shadow-lg shadow-slate-200/30 dark:shadow-indigo-950/20 group transition-all duration-500 flex flex-col justify-between gap-6 relative overflow-hidden premium-shine-container h-full text-slate-900 dark:text-white", 
            isScheduledUpcoming
              ? "border-amber-200 dark:border-amber-800 bg-amber-50/10 dark:bg-amber-950/20 cursor-not-allowed"
              : isCompleted
                ? "border-emerald-200 dark:border-emerald-800 shadow-emerald-500/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-500/10 hover:border-emerald-300 cursor-pointer"
                : isInProgress
                  ? "border-amber-250 dark:border-amber-800 shadow-amber-500/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10 hover:border-amber-300 cursor-pointer"
                  : isLocked 
                    ? "border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 hover:-translate-y-2 hover:border-slate-400 hover:bg-slate-50/50 hover:shadow-md cursor-pointer"
                    : isPremiumUnlocked 
                      ? "border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 hover:-translate-y-2 hover:border-slate-400 hover:bg-slate-50/50 hover:shadow-md cursor-pointer"
                      : "border-slate-200 dark:border-indigo-500/20 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 hover:-translate-y-2 hover:border-slate-400 hover:bg-slate-50/50 hover:shadow-2xl hover:shadow-brand-500/10 hover:border-brand-200 cursor-pointer"
          )}
          onClick={() => {
            if (!isScheduledUpcoming) handleStartTest({ ...test, isPremium, price });
          }}
        >
          {isCompleted && <div className="absolute inset-0 bg-emerald-550/2 pointer-events-none" />}
          {isInProgress && <div className="absolute inset-0 bg-amber-550/2 pointer-events-none" />}
          {isPremiumUnlocked && !isCompleted && !isInProgress && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
          
          <div className="flex items-start justify-between relative z-10 w-full">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white transition-transform group-hover:scale-110 relative mt-0.5", 
                isScheduledUpcoming
                  ? "bg-gradient-to-br from-amber-400 to-orange-500"
                  : isCompleted
                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                    : isInProgress
                      ? "bg-gradient-to-br from-amber-400 to-orange-500 animate-pulse"
                      : isLocked 
                        ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                        : isPremiumUnlocked 
                          ? "bg-gradient-to-br from-emerald-500 to-teal-600" 
                          : "bg-gradient-to-br from-indigo-500 to-purple-650"
              )}>
                {isScheduledUpcoming ? (
                  <Calendar className="w-6 h-6 text-white" />
                ) : isCompleted ? (
                  <CheckCircle2 className="w-6 h-6 text-white" />
                ) : isInProgress ? (
                  <Play className="w-6 h-6 text-white fill-white/10 ml-0.5 animate-pulse" />
                ) : (
                  <Target className="w-6 h-6" />
                )}
                <div className="absolute inset-0 border-2 border-white/20 rounded-xl" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <h4 className="font-black text-base sm:text-lg text-slate-955 dark:text-white tracking-tight group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors uppercase leading-snug line-clamp-2" title={test.title}>{mainTitle}</h4>
                <div className="flex items-center flex-wrap gap-1.5 mt-1">
                  {isScheduledUpcoming ? (
                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-300 uppercase tracking-widest bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      📅 UPCOMING
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-100 dark:border-slate-700 whitespace-nowrap">Official Mock</span>
                  )}
                  {suffix && (
                    <span className="text-[10px] font-black text-brand-700 dark:text-indigo-300 uppercase tracking-widest bg-brand-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded border border-brand-100/60 dark:border-indigo-800 shadow-2xs whitespace-nowrap">Set {suffix}</span>
                  )}
                  {!isScheduledUpcoming && isCompleted && (
                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-300 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-100/60 dark:border-emerald-800 flex items-center gap-0.5 whitespace-nowrap"><CheckCircle2 className="w-3.5 h-3.5" /> Completed</span>
                  )}
                  {!isScheduledUpcoming && isInProgress && (
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest bg-amber-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded border border-amber-100/60 dark:border-amber-800 flex items-center gap-0.5 whitespace-nowrap"><Clock className="w-3.5 h-3.5 animate-pulse" /> In Progress ({progressPercent}%)</span>
                  )}
                </div>
              </div>
            </div>
            {!isScheduledUpcoming && isPremium && !isCompleted && !isInProgress && (
              <div className="flex shrink-0">
                {isLocked ? (
                  <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl border border-amber-100 flex items-center justify-center shadow-sm" aria-label="Premium Locked">
                    <Lock className="w-5 h-5 fill-amber-500/20" />
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 flex items-center gap-1.5 rounded-lg border border-emerald-100 text-[10px] font-black uppercase tracking-widest shadow-sm" aria-label="Premium Unlocked">
                    <CheckCircle2 className="w-3 h-3" />
                    Premium Active
                  </div>
                )}
              </div>
            )}
          </div>
          
          {isScheduledUpcoming ? (
            <div className="bg-amber-50/80 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800 rounded-xl p-3.5 space-y-1.5 relative z-10 text-left">
              <div className="flex items-center justify-between text-xs font-extrabold text-amber-900 dark:text-amber-300">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" /> Release Countdown</span>
                <span className="font-mono text-xs tracking-wider font-black text-amber-950 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-md border border-amber-300/60 dark:border-amber-700/60">{countdown.formattedCountdown}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-800 dark:text-amber-300 pt-0.5">
                <span>Scheduled for {countdown.formattedScheduledDate}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4 flex-1 relative z-10 pt-2 text-left">
              <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-slate-300 flex-wrap">
                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-100/60 dark:border-slate-700/60"><Clock className="w-3.5 h-3.5 text-slate-400"/> {t('exams.details.duration', `${test.durationMinutes} Mins`, { mins: test.durationMinutes })}</span>
                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-100/60 dark:border-slate-700/60"><Award className="w-3.5 h-3.5 text-slate-400"/> {t('exams.details.totalMarks', `${test.totalMarks} Marks`, { marks: test.totalMarks })}</span>
                <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-100/60 dark:border-slate-700/60"><FileText className="w-3.5 h-3.5 text-slate-400"/> {t('exams.details.questions', `${totalQs} Qs`, { count: totalQs })}</span>
              </div>
            </div>
          )}
          
          {isScheduledUpcoming ? (
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="w-full h-[48px] rounded-xl flex items-center justify-center gap-2 font-black text-xs sm:text-sm bg-amber-500/15 border-2 border-amber-400 text-amber-950 shadow-sm cursor-not-allowed mt-auto pointer-events-none relative z-10"
            >
              <Lock className="w-4 h-4 text-amber-800 shrink-0" />
              <span className="text-amber-950 font-black tracking-tight">Unlocks {countdown.formattedScheduledDate}</span>
            </button>
          ) : isCompleted ? (
            <div className="flex items-center gap-2 w-full mt-auto relative z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttemptModal(true);
                }}
                className="w-1/3 h-[48px] rounded-xl flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm bg-emerald-50 text-emerald-700 border border-emerald-200/90 hover:bg-emerald-100 hover:border-emerald-300 transition-all cursor-pointer shadow-xs shrink-0"
              >
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span className="truncate">Score</span>
              </button>
              <Button 
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTest({ ...test, isPremium, price });
                }}
                className="flex-1 h-[48px] rounded-xl font-black text-xs sm:text-sm border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 bg-white transition-all overflow-hidden group/btn"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <RotateCw className="w-4 h-4" /> {t('exams.cardActions.retake', 'Retake')}
                </span>
              </Button>
            </div>
          ) : isInProgress ? (
            <div className="flex items-center gap-2 w-full mt-auto relative z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttemptModal(true);
                }}
                className="w-1/3 h-[48px] rounded-xl flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm bg-amber-50 text-amber-700 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300 transition-all cursor-pointer shadow-xs shrink-0"
              >
                <BarChart3 className="w-4 h-4 text-amber-600" />
                <span className="truncate">Progress</span>
              </button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartTest({ ...test, isPremium, price }, incompleteAct);
                }}
                className="flex-1 h-[48px] rounded-xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-all overflow-hidden group/btn"
              >
                <span className="relative z-10 flex items-center justify-center gap-1.5">
                  <Play className="w-4 h-4 fill-white/20" /> {t('exams.cardActions.resume', 'Resume')} ({progressPercent}%)
                </span>
              </Button>
            </div>
          ) : (
            <Button 
              variant={isLocked ? "outline" : "primary"}
              onClick={(e) => {
                e.stopPropagation();
                handleStartTest({ ...test, isPremium, price });
              }}
              className={cn(
                "w-full h-[48px] rounded-xl font-black text-sm relative z-10 transition-all overflow-hidden group/btn mt-auto", 
                !isLocked 
                  ? "premium-gradient text-white shadow-lg shadow-brand-500/20 group-hover:premium-glow" 
                  : "border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />

              <span className="relative z-10 flex items-center justify-center gap-2">
                {isLocked ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    {t('exams.cardActions.unlockTest', 'Unlock to Access')}
                  </>
                ) : (
                  <>
                    {t('exams.cardActions.startMock', 'Start Test Now')}
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 duration-300" />
                  </>
                )}
              </span>
            </Button>
          )}
        </Card>
      )}

      <AttemptPerformanceModal
        isOpen={showAttemptModal}
        onClose={() => setShowAttemptModal(false)}
        title={test.title}
        activity={completedAct || incompleteAct}
        totalQs={totalQs}
        totalMarks={test.totalMarks}
        onAction={() => {
          if (isInProgress && incompleteAct) {
            handleStartTest({ ...test, isPremium, price }, incompleteAct);
          } else {
            handleStartTest({ ...test, isPremium, price });
          }
        }}
      />
    </motion.div>
  );
});

const PurchasesView = ({ user, profile, exams, mockTests, testSeries, dynamicQuestionBanks, hasAccessTo, onLaunchMockTest, onLaunchBank, onViewExam, loadingExams }: any) => {
  const { t, isOdia } = useLanguage();
  const { refreshProfile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Sync profile when the library is opened/mounted
  React.useEffect(() => {
    refreshProfile().catch((err) => console.error("Error refreshing profile on mount:", err));
  }, []);

  // Self-healing cleanup of deleted items from user purchases
  // Disabled client-side destructive cleanup to protect entitlements of users when admin panel restructures or archives items.
  React.useEffect(() => {
    // Entitlements are validated and healed directly from database user_purchases ledger in AuthContext.
  }, [user, profile?.purchasedSeries]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setRefreshing(false);
  };

  if (!user || !profile) return null;

  // Helper: is a string a URL (Supabase storage, Google Drive, etc.)?
  const isUrl = (s: string) => typeof s === 'string' && (s.startsWith('http') || s.startsWith('/'));

  // Helper: strip JSON_METADATA_ prefixed descriptions
  const cleanDesc = (d: string) => {
    if (!d) return '';
    if (d.startsWith('JSON_METADATA_')) {
      try {
        const meta = JSON.parse(d.replace('JSON_METADATA_', ''));
        return meta.description || '';
      } catch (e) {
        return '';
      }
    }
    if (d.startsWith('{')) return '';
    return d;
  };

  // Build seriesId → examId map from testSeries (needed when mockTest only has seriesId)
  const seriesExamMap: Record<string, string> = {};
  testSeries.forEach((s: any) => {
    if (s.id && s.examId) seriesExamMap[s.id] = s.examId;
  });

  // Resolve the actual examId for a mock test
  const resolveExamId = (test: any): string => {
    if (test.examId) return test.examId;
    if (test.seriesId && seriesExamMap[test.seriesId]) return seriesExamMap[test.seriesId];
    return '_misc';
  };

  // ── Build a map: examId → { exam, mockTests, questionBanks } ────────────────
  const examSections: Record<string, {
    exam: any;
    isBundle: boolean;
    mockTests: any[];
    questionBanks: any[];
  }> = {};

  const getOrCreate = (examId: string) => {
    if (!examSections[examId]) {
      const exam = exams.find((e: any) => e.id === examId) || {
        id: examId,
        name: examId === '_misc' ? 'Other Content' : examId.toUpperCase(),
        icon: '📚',
        description: '',
      };
      examSections[examId] = { exam, isBundle: false, mockTests: [], questionBanks: [] };
    }
    return examSections[examId];
  };

  // 1. Exam bundles
  (profile.purchasedSeries || []).forEach((id: string) => {
    if (id.startsWith('exam_bundle_')) {
      const examId = id.replace('exam_bundle_', '');
      getOrCreate(examId).isBundle = true;
    }
  });

  // 2. All mock tests the user can access (including individually purchased)
  mockTests.forEach((test: any) => {
    // Safety fallback: if cache is stale, parse the JSON inline
    let isPremium = test.isPremium;
    let tExamId = test.examId;
    if (typeof test.seriesId === 'string' && test.seriesId.startsWith('{')) {
      try {
        const parsed = JSON.parse(test.seriesId);
        isPremium = isPremium ?? parsed.isPremium;
        tExamId = tExamId ?? parsed.examId;
      } catch (e) {}
    }

    const examId = tExamId ? tExamId : resolveExamId(test);
    // Check access: directly purchased by ID, OR via exam bundle, OR via a purchased test series
    let accessible = hasAccessTo(test.id, examId);
    if (!accessible && test.seriesId && typeof test.seriesId === 'string' && !test.seriesId.startsWith('{')) {
      accessible = hasAccessTo(test.seriesId, examId);
    }

    if (isPremium && accessible && !(profile.hasFullAccess || profile.role === 'admin')) {
      const section = getOrCreate(examId);
      if (!section.mockTests.find((t: any) => t.id === test.id)) {
        section.mockTests.push({ ...test, isPremium, _resolvedExamId: examId });
      }
    }
  });

  // 3. All question banks the user can access
  Object.values(dynamicQuestionBanks).flat().forEach((bank: any) => {
    const b = bank as any;
    if (b.isPremium && hasAccessTo(b) && !(profile.hasFullAccess || profile.role === 'admin')) {
      const section = getOrCreate(b.examId || '_misc');
      if (!section.questionBanks.find((q: any) => q.id === b.id)) {
        section.questionBanks.push(b);
      }
    }
  });

  const sections = Object.values(examSections).filter(s => {
    const existsInExams = exams.some((e: any) => e.id === s.exam.id);
    if (!existsInExams && s.exam.id !== '_misc') {
      return false;
    }
    return s.isBundle || s.mockTests.length > 0 || s.questionBanks.length > 0;
  });

  const isFullAccess = profile.hasFullAccess || profile.role === 'admin';

  return (
    <div className="relative w-full min-h-screen bg-[#F8FAFC] dark:bg-[#060B16] overflow-x-hidden" style={{ isolation: 'isolate' }}>
      {/* Full-Screen Edge-to-Edge Academic Vector Canvas Grid & HSL Glows */}
      <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40 dark:opacity-[0.03] pointer-events-none z-0" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-brand-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-indigo-200/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Floating Viewport Academic Library Vector Watermarks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <BookMarked className="absolute top-24 left-[5%] w-44 h-44 text-slate-800 dark:text-white opacity-[0.08] dark:opacity-[0.04] stroke-[1.2] rotate-12" />
        <BookOpen className="absolute top-1/3 right-[5%] w-48 h-48 text-brand-600 dark:text-indigo-400 opacity-[0.08] dark:opacity-[0.04] stroke-[1.2] -rotate-6" />
        <Layers className="absolute bottom-1/3 left-[6%] w-44 h-44 text-amber-600 dark:text-amber-400 opacity-[0.08] dark:opacity-[0.04] stroke-[1.2] rotate-45" />
        <Award className="absolute bottom-28 right-[6%] w-36 h-36 text-indigo-600 dark:text-blue-400 opacity-[0.08] dark:opacity-[0.04] stroke-[1.2] -rotate-12" />
      </div>

      <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-4 sm:pb-8 mt-2 md:mt-8 relative z-10">
        {/* Header */}
        {/* Mobile: slim 1-row header; Desktop: centred stacked hero */}
        <div className="mb-6 md:mb-8 relative">
          {/* ── Mobile header (hidden on md+) ── */}
          <div className="flex items-center justify-between gap-3 md:hidden">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
                <BookMarked className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none">
                  {t('nav.library', 'My Library')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] font-medium truncate mt-0.5">{t('library.header.subtitle', 'Unlocked premium content')}</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-[10px] transition-all shadow-xs active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0"
            >
              <RotateCw className={cn("w-3 h-3 text-brand-600 dark:text-brand-400", refreshing && "animate-spin")} />
              {refreshing ? 'Syncing…' : 'Sync'}
            </button>
          </div>

          {/* ── Desktop stacked hero (hidden on mobile) ── */}
          <div className="hidden md:flex flex-col space-y-4 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-inner relative"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              <BookMarked className="w-10 h-10 text-white" />
              <div className="absolute inset-0 rounded-full animate-ping opacity-20"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} />
            </div>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
              {t('nav.library', 'My Library')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">{t('library.header.subtitle', 'All your unlocked premium content in one place.')}</p>
            <div className="flex justify-center mt-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs transition-[background-color,border-color,transform,box-shadow] shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none"
              >
                <RotateCw className={cn("w-3.5 h-3.5 text-brand-600 dark:text-brand-400", refreshing && "animate-spin")} />
                {refreshing ? 'Syncing Library...' : t('library.actions.sync', 'Sync Library')}
              </button>
            </div>
          </div>
        </div>

      {loadingExams ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full" />
        </div>
      ) : isFullAccess ? (
        /* Admin / Full Access Banner */
        <div className="relative overflow-hidden rounded-2xl md:rounded-[2rem] p-5 md:p-8 text-white"
          style={{ background: 'linear-gradient(135deg, #0f0a28 0%, #1e1151 50%, #0f172a 100%)' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 to-purple-500/20 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-4 md:gap-6">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
            </div>
            <div>
              <div className="text-[10px] md:text-xs font-black uppercase tracking-widest text-emerald-400 mb-0.5 md:mb-1">Unlimited Access</div>
              <h3 className="text-lg md:text-2xl font-black">All Content Unlocked</h3>
              <p className="text-white/60 text-[11px] md:text-sm mt-0.5">You have full access to every exam, mock test, and question bank.</p>
            </div>
          </div>
        </div>
      ) : sections.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 p-8 md:p-16 rounded-2xl md:rounded-[2.5rem] text-center max-w-2xl mx-auto mt-6 md:mt-12 relative overflow-hidden shadow-2xl dark:shadow-slate-950/80"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 dark:bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <motion.div 
            className="w-16 h-16 md:w-24 md:h-24 bg-slate-100 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-inner"
          >
            <Lock className="w-8 h-8 md:w-10 md:h-10 text-slate-400 dark:text-blue-400" />
          </motion.div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mb-3 md:mb-4 tracking-tight">Your Library is Empty</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6 md:mb-10 max-w-md mx-auto text-sm md:text-lg leading-relaxed font-medium">
            You haven't unlocked any premium content yet. Explore our comprehensive exams and test series to start your journey today.
          </p>
          <button
            onClick={() => onViewExam(null)}
            className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm md:text-base rounded-2xl shadow-xl shadow-blue-600/25 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95 transition-all overflow-hidden flex items-center gap-3 mx-auto cursor-pointer"
          >
            <span className="relative z-10">{t('library.exploreExams', 'Explore Exams')}</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      ) : (
        <div className="space-y-6 md:space-y-8">
          {sections.map((section, si) => {
            const { exam, isBundle, mockTests: sTests, questionBanks: sBanks } = section;
            const totalItems = sTests.length + sBanks.length;

            return (
              <motion.div
                key={exam.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.08 }}
                className="rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl shadow-slate-200/60"
              >
                {/* Exam Header — dark premium strip */}
                <div className="relative p-4 sm:p-8 text-white overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, #0f0a28 0%, #1e1151 60%, #312e81 100%)' }}>
                  {/* Glow orb */}
                  <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-30 pointer-events-none"
                    style={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)' }} />
                  <div className="relative z-10 flex items-center justify-between gap-3">
                    {/* Icon + text */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Exam icon */}
                      <div className="w-10 h-10 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                        {isUrl(exam.icon)
                          ? <img src={getDirectImageUrl(exam.icon)} alt={exam.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={(e: any) => { e.target.style.display='none'; e.target.parentNode.textContent='📚'; }} />
                          : <span className="text-lg sm:text-4xl">{exam.icon || '📚'}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {isBundle && (
                            <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-brand-500/30 border border-brand-400/40 text-brand-300 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg animate-pulse-soft">
                              Exam Bundle
                            </span>
                          )}
                          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg flex items-center gap-0.5 sm:gap-1 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Premium Unlocked
                          </span>
                        </div>
                        <h3 className="text-sm sm:text-2xl font-black text-white leading-tight line-clamp-2">{exam.name}</h3>
                        {cleanDesc(exam.description) && (
                          <p className="text-white/60 text-[10px] sm:text-sm mt-0.5 line-clamp-1 hidden sm:block">{cleanDesc(exam.description)}</p>
                        )}
                        <p className="text-white/40 text-[9px] sm:text-xs mt-0.5">
                          {totalItems} item{totalItems !== 1 ? 's' : ''} unlocked
                          {isBundle ? ' · Full Bundle Access' : ''}
                        </p>
                      </div>
                    </div>
                    {isBundle && (
                      <button
                        onClick={() => onViewExam(exam.id)}
                        className="group shrink-0 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl transition-[transform,border-color,background-color,box-shadow] duration-300 flex items-center gap-1.5 sm:gap-2 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-[0.98]"
                      >
                        Open <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Items Container */}
                {totalItems > 0 && (
                  <div className="bg-white/95 border-x border-b border-slate-100 p-4 md:p-6 rounded-b-[1.5rem] md:rounded-b-[2rem]">
                    <div className="md:max-h-[380px] md:overflow-y-auto overflow-y-visible custom-scrollbar overscroll-contain pr-0 md:pr-2 -mr-0 md:-mr-2">
                      
                      {/* Desktop Grid Layout (visible on sm and up) */}
                      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                        {/* Mock Tests */}
                        {sTests.map((test: any, i: number) => (
                          <ScheduledMockTestCard key={test.id} test={test} onLaunchMockTest={onLaunchMockTest} />
                        ))}

                        {/* Question Banks */}
                        {sBanks.map((bank: any, i: number) => (
                          <motion.div 
                            key={bank.id}
                            {...scaleIn}
                            transition={{ ...scaleIn.transition, delay: 0.15 + (i * 0.05) }}
                            whileHover={whileHover.liftTap}
                            whileTap={whileTap.press}
                            className="group premium-shine-container relative bg-white rounded-2xl border border-slate-200/60 p-5 hover:bg-white hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/20 transition-[background-color,border-color,box-shadow] duration-500 cursor-pointer flex flex-col gap-4 overflow-hidden"
                            onClick={() => onLaunchBank(bank)}
                          >
                            <div className="flex items-start gap-4 relative z-10">
                              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md group-hover:shadow-emerald-500/30 transition-shadow duration-300"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <BookOpen className="w-6 h-6 text-white group-hover:-rotate-12 transition-transform duration-300" />
                              </div>
                              <div className="flex-1 min-w-0 pt-0.5">
                                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Question Bank</div>
                                <h4 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-emerald-700 transition-colors line-clamp-2">
                                  {bank.title}
                                </h4>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500 font-medium relative z-10 mt-1">
                              <span className="flex items-center gap-1.5 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                                <BookOpen className="w-3.5 h-3.5 text-slate-600" />{bank.questions || '—'} Questions
                              </span>
                              <span className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-100/80 border border-emerald-200 px-2.5 py-1 rounded-lg shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Unlocked
                              </span>
                            </div>
                            <button className="w-full mt-2 py-2.5 text-sm font-bold text-white rounded-xl shadow-md group-hover:shadow-emerald-500/25 transition-[box-shadow] duration-300 relative overflow-hidden"
                              style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
                              <span className="relative z-10 flex items-center justify-center gap-2">
                                Practice Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </span>
                            </button>
                          </motion.div>
                        ))}
                      </div>

                      {/* Mobile List Layout (visible on mobile only) */}
                      <div className="sm:hidden space-y-3">
                        {/* Mock Tests */}
                        {sTests.map((test: any) => (
                          <div 
                            key={test.id}
                            onClick={() => onLaunchMockTest(test)}
                            className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200/50 rounded-2xl active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                <Timer className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[9px] font-black uppercase tracking-wider text-brand-600">Mock Test</div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate mt-0.5">
                                  {test.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                    <Clock3 className="w-3 h-3 text-slate-400" />
                                    {test.durationMinutes || 60} mins
                                  </span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-50 text-brand-600 shrink-0">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}

                        {/* Question Banks */}
                        {sBanks.map((bank: any) => (
                          <div 
                            key={bank.id}
                            onClick={() => onLaunchBank(bank)}
                            className="flex items-center justify-between gap-3 p-3.5 bg-slate-50/50 hover:bg-slate-50/80 border border-slate-200/50 rounded-2xl active:scale-[0.99] transition-all cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                                style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Question Bank</div>
                                <h4 className="font-extrabold text-slate-900 text-sm leading-snug truncate mt-0.5">
                                  {bank.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                                    <BookOpen className="w-3 h-3 text-slate-400" />
                                    {bank.questions || '—'} Questions
                                  </span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600">
                                    <CheckCircle2 className="w-3 h-3" /> Unlocked
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600 shrink-0">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
/** 
 * Module-level cache — survives DashboardContent remounts (tab switches).
 * This is the key fix: old Gmail accounts were seeing empty exams because
 * every tab-click unmounts/remounts DashboardContent, resetting exams=[]
 * and re-triggering a fetch that could race with a concurrent token refresh.
 * Now we immediately populate state from this cache on re-mount.
 */
const getCachedData = (key: string, fallback: any) => {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

const _dashboardCache: {
  exams: any[];
  testSeries: any[];
  mockTests: any[];
  dynamicQuestionBanks: Record<string, any[]>;
  loadedForUserId: string | null;
  hasFetchedThisSession: boolean;
} = {
  exams: getCachedData('oep_cached_exams', []),
  testSeries: getCachedData('oep_cached_testSeries', []),
  mockTests: getCachedData('oep_cached_mockTests', []),
  dynamicQuestionBanks: getCachedData('oep_cached_dynamicQuestionBanks', {}),
  loadedForUserId: sessionStorage.getItem('oep_cached_loadedForUserId') || null,
  hasFetchedThisSession: false,
};

const SPARKLE_POSITIONS = [
  { left: '12%', top: '25%', x: [-15, 15], y: [-10, 20], duration: 4.5, delay: 0.2 },
  { left: '78%', top: '18%', x: [20, -15], y: [15, -10], duration: 5.2, delay: 1.5 },
  { left: '33%', top: '65%', x: [-10, 25], y: [20, -15], duration: 4.8, delay: 0.7 },
  { left: '88%', top: '75%', x: [-25, 10], y: [-15, 15], duration: 6.0, delay: 2.1 },
  { left: '22%', top: '45%', x: [15, -20], y: [-20, 10], duration: 5.5, delay: 1.1 },
  { left: '60%', top: '30%', x: [10, -15], y: [18, -12], duration: 4.2, delay: 0.5 },
  { left: '48%', top: '85%', x: [-15, 15], y: [-12, 18], duration: 5.8, delay: 1.8 },
  { left: '92%', top: '40%', x: [12, -22], y: [-18, 12], duration: 4.9, delay: 0.9 },
];

const premiumModalVariants = {
  hidden: { 
    y: '100%', 
    opacity: 0 
  },
  visible: { 
    y: 0, 
    opacity: 1,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    y: '100%', 
    opacity: 0,
    transition: { duration: 0.28, ease: [0.7, 0, 0.84, 0] }
  }
};

const premiumScaleModalVariants = {
  hidden: { 
    scale: 0.95, 
    opacity: 0 
  },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] }
  },
  exit: { 
    scale: 0.95, 
    opacity: 0,
    transition: { duration: 0.28, ease: [0.7, 0, 0.84, 0] }
  }
};

const DashboardContent = ({ isGuest, onSignIn, mainTab = 'home', user, activities = [], onNavigate, onActivityLogged, selectedExam: propsSelectedExam, setSelectedExam: propsSetSelectedExam }: { isGuest?: boolean, onSignIn?: () => void, mainTab?: string, user?: any, activities?: any[], onNavigate?: (tab: any) => void, onActivityLogged?: () => void, selectedExam?: string | null, setSelectedExam?: (val: string | null) => void }) => {
  const { t, isOdia } = useLanguage();
  const { profile, isAdmin, hasFullAccess, grantFullAccess, hasAccessTo, unlockItem, guestUsage, incrementGuestUsage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dynamicQuestionBanks, setDynamicQuestionBanks] = useState<Record<string, any[]>>(() => _dashboardCache.dynamicQuestionBanks);
  const [exams, setExams] = useState<any[]>(() => _dashboardCache.exams);
  const [testSeries, setTestSeries] = useState<any[]>(() => _dashboardCache.testSeries);
  const [mockTests, setMockTests] = useState<any[]>(() => _dashboardCache.mockTests);
  const [loadingExams, setLoadingExams] = useState(() => _dashboardCache.exams.length === 0);
  const [loadingDashboardData, setLoadingDashboardData] = useState(() => !_dashboardCache.hasFetchedThisSession);
  const [selectedMockCategory, setSelectedMockCategory] = useState<string | null>(() => sessionStorage.getItem('oep_selectedMockCategory') || null);
  const [selectedPracticeCategory, setSelectedPracticeCategory] = useState<string | null>(() => sessionStorage.getItem('oep_selectedPracticeCategory') || null);
  const [selectedSectionalSubject, setSelectedSectionalSubject] = useState<string>('All');
  const [selectedPracticeSubject, setSelectedPracticeSubject] = useState<string>('All');
  const [internalSelectedExam, setInternalSelectedExam] = useState<string | null>(() => sessionStorage.getItem('oep_selectedExam') || null);
  
  const selectedExam = propsSelectedExam !== undefined
    ? propsSelectedExam
    : internalSelectedExam;

  const currentExam = useMemo(() => exams.find((e: any) => e.id === selectedExam), [exams, selectedExam]);

  const setSelectedExam = (val: string | null) => {
    if (val === null) {
      sessionStorage.setItem('oep_auto_navigated_dismissed', 'true');
      sessionStorage.removeItem('oep_selectedExam');
      sessionStorage.removeItem('oep_selectedExamName');
    } else {
      sessionStorage.setItem('oep_selectedExam', val);
    }
    setSelectedMockCategory(null);
    setSelectedPracticeCategory(null);
    if (propsSetSelectedExam) {
      propsSetSelectedExam(val);
    } else {
      setInternalSelectedExam(val);
    }
  };

  useEffect(() => {
    if (!selectedExam) {
      const scrollTarget = sessionStorage.getItem('oep_scroll_target');
      if (scrollTarget) {
        sessionStorage.removeItem('oep_scroll_target');
        scrollToElement(scrollTarget, { block: 'start', delay: 100 });
      }
    }
  }, [selectedExam]);


  const [showAdmin, setShowAdmin] = useState(false);
  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string } | null>(null);
  const showPremiumAlert = (title: string, message: string) => {
    setInfoModal({ isOpen: true, title, message });
  };
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isBannerDescExpanded, setIsBannerDescExpanded] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(prev => !prev);
      }
    };
    const handleOpenSearchModal = () => setIsSearchModalOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('oep-open-search-modal', handleOpenSearchModal);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('oep-open-search-modal', handleOpenSearchModal);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Refs and scroll handlers for horizontal lists
  const continuePracticeRef = useRef<HTMLDivElement>(null);
  const recentActivityRef = useRef<HTMLDivElement>(null);

  const smoothScroll = (element: HTMLDivElement | null, direction: 'left' | 'right') => {
    if (!element) return;
    const { scrollLeft, clientWidth } = element;
    const scrollAmount = clientWidth * 0.75;
    const targetOffset = direction === 'left' 
      ? Math.max(0, scrollLeft - scrollAmount) 
      : Math.min(element.scrollWidth - clientWidth, scrollLeft + scrollAmount);

    const startOffset = scrollLeft;
    const change = targetOffset - startOffset;
    if (change === 0) return;
    const duration = 500; // 500ms
    const startTime = performance.now();

    // Disable snap scroll during scroll animation to prevent stutter
    element.style.scrollSnapType = 'none';

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = easeInOutCubic(progress);

      element.scrollLeft = startOffset + change * easeProgress;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Restore snap scroll
        element.style.scrollSnapType = '';
      }
    };

    requestAnimationFrame(animate);
  };

  const scrollContinuePractice = (direction: 'left' | 'right') => {
    smoothScroll(continuePracticeRef.current, direction);
  };

  const scrollRecentActivity = (direction: 'left' | 'right') => {
    smoothScroll(recentActivityRef.current, direction);
  };

  useEffect(() => {
    if (selectedExam) {
      sessionStorage.setItem('oep_selectedExam', selectedExam);
      const name = exams.find((e: any) => e.id === selectedExam)?.name || selectedExam;
      sessionStorage.setItem('oep_selectedExamName', name);
    } else {
      sessionStorage.removeItem('oep_selectedExam');
      sessionStorage.removeItem('oep_selectedExamName');
    }
    setIsDescExpanded(false);
    setIsBannerDescExpanded(false);
    setIsBannerDismissed(false);
    window.dispatchEvent(new CustomEvent('oep-aimentor-changed'));
  }, [selectedExam, exams]);

  useEffect(() => {
    if (selectedExam) {
      if (isGuest) {
        scrollToElement('exams', { block: 'start' });
      } else {
        scrollToTop({ behavior: 'instant' });
      }
    }
  }, [selectedExam, isGuest]);

  // Prevent body scroll on mobile when the paywall modal is active
  useEffect(() => {
    if (!selectedExam) {
      document.body.style.overflow = '';
      return;
    }
    let hasBundle = false;
    if (currentExam) {
      const examDesc = currentExam.description || '';
      if (typeof examDesc === 'string' && examDesc.startsWith('JSON_METADATA_')) {
        try {
          const meta = JSON.parse(examDesc.replace('JSON_METADATA_', ''));
          hasBundle = meta.isPremium !== undefined ? Boolean(meta.isPremium) : (Number(meta.price) > 0);
        } catch(e) {}
      }
    }
    const isModalActive = isMobile && hasBundle && !hasAccessTo(`exam_bundle_${selectedExam}`) && !isBannerDismissed;
    if (isModalActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, exams, selectedExam, isBannerDismissed, hasAccessTo]);

  // Onboarding modal trigger removed



  const [activeTest, setActiveTest] = useState<any | null>(null);
  const [activeTestState, setActiveTestState] = useState<any>(null);

  // Signal to the global WhatsAppButton that a test/practice is in progress
  // so it can hide itself for a distraction-free experience.
  useEffect(() => {
    if (activeTest) {
      document.body.setAttribute('data-test-mode', 'true');
    } else {
      document.body.removeAttribute('data-test-mode');
    }
    return () => document.body.removeAttribute('data-test-mode');
  }, [activeTest]);

  // Recovery Effect: Automatically restore active test state on page reload
  useEffect(() => {
    try {
      const rawState = sessionStorage.getItem('oep_activeTestState');
      if (rawState) {
        const parsed = JSON.parse(rawState);
        const currentUserId = user?.id || null;
        if (currentUserId && parsed.userId === currentUserId && parsed.test) {
          console.log('[Recovery] Restoring active test session:', parsed.resumeSessionId);
          setActiveTest(parsed.test);
          setActiveTestState(parsed);
        }
      }
    } catch (e) {
      console.error('[Recovery] Failed to restore active test state:', e);
    }
  }, [user]);
  const [testResults, setTestResults] = useState<any | null>(() => {
    const saved = sessionStorage.getItem('oep_testResults');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse test results from sessionStorage:", e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (testResults) {
      sessionStorage.setItem('oep_testResults', JSON.stringify(testResults));
    } else {
      sessionStorage.removeItem('oep_testResults');
      sessionStorage.removeItem('oep_reviewQuestionIdx');
      sessionStorage.removeItem('oep_reviewScrollTop');
    }
  }, [testResults]);

  const handleViewResults = async (rawResults: any) => {
    if (!rawResults) {
      setTestResults(null);
      return;
    }
    // Normalize metadata and top-level fields
    let finalResults: any = {
      ...rawResults,
      ...(rawResults.metadata || {}),
      score: rawResults.score ?? rawResults.metadata?.score ?? 0,
      total: rawResults.totalMarks || rawResults.total || rawResults.metadata?.totalMarks || rawResults.metadata?.total || 20,
      totalMarks: rawResults.totalMarks || rawResults.total || rawResults.metadata?.totalMarks || rawResults.metadata?.total || 20,
      accuracy: rawResults.accuracy ?? rawResults.metadata?.accuracy ?? 0,
      answers: rawResults.answers || rawResults.metadata?.answers || {},
      timeTaken: rawResults.timeTaken || rawResults.timeSpent || rawResults.metadata?.timeTaken || 300,
    };

    const targetTestId = finalResults.test?.id || finalResults.testId || finalResults.bankId || (finalResults.resumeSessionId && !finalResults.resumeSessionId.startsWith('session-') ? finalResults.resumeSessionId : undefined);
    const targetTitle = finalResults.test?.title || finalResults.title || 'Practice Test';
    const targetExamName = finalResults.test?.examName || finalResults.examName || 'General';
    const targetCategory = finalResults.test?.testCategory || finalResults.testCategory || 'Mock Test';

    if (!finalResults.test) {
      finalResults.test = {
        id: targetTestId || '',
        title: targetTitle,
        examName: targetExamName,
        testCategory: targetCategory,
        questions: []
      };
    }

    // If questions are missing, hydrate them on-demand from the catalog
    if (!finalResults.test.questions || finalResults.test.questions.length === 0) {
      try {
        let freshQs: any[] = [];
        if (targetTestId) {
          if (targetTestId.startsWith('practice-') || finalResults.bankId) {
            freshQs = await examService.getQuestionsForQuestionBank(targetTestId, targetTitle, finalResults.examId || selectedExam);
          } else {
            freshQs = await examService.getQuestionsForMockTest(targetTestId);
          }
        }
        // If still no questions, try finding by test title in examService / exams catalog
        if (!freshQs || freshQs.length === 0) {
          if (targetTitle) {
            const allBanks = await examService.getAllQuestionBanks().catch(() => []);
            const matchingBank = allBanks.find((b: any) => b.title === targetTitle || targetTitle.includes(b.title));
            if (matchingBank) {
              freshQs = await examService.getQuestionsForQuestionBank(matchingBank.id, matchingBank.title, matchingBank.examId || selectedExam);
            }
          }
        }

        if (freshQs && freshQs.length > 0) {
          finalResults.test.questions = freshQs;
        }
      } catch (e) {
        console.error("Failed to fetch questions for results review:", e);
      }
    }

    setTestResults(finalResults);
  };
  // Stats for comparisons
  const [selectedBankItem, setSelectedBankItem] = useState<any | null>(null);
  const [activeReadingBank, setActiveReadingBank] = useState<any | null>(null);
  const [pdfGuideItem, setPdfGuideItem] = useState<any | null>(null);

  const executeExportPdf = async (bankItem: any) => {
    const toastId = toast.loading('Compiling Question Bank PDF booklet with KaTeX formulas...', { icon: '📄' });
    try {
      const fetchedQs = await examService.getQuestionsForQuestionBank(bankItem.id, bankItem.title, bankItem.examId || selectedExam);
      if (!fetchedQs || fetchedQs.length === 0) {
        if (bankItem.pdfLinks && bankItem.pdfLinks.length > 0 && bankItem.pdfLinks[0].url) {
          toast.dismiss(toastId);
          window.open(bankItem.pdfLinks[0].url, '_blank');
          return;
        }
        toast.error('No questions available in this bank to generate PDF.', { id: toastId });
        return;
      }

      const currentExamName = exams.find((e: any) => e.id === (bankItem.examId || selectedExam))?.name || 'Odisha Exam Prep';
      await exportQuestionBankToPdf({
        title: bankItem.title,
        subtitle: bankItem.tagline || 'Comprehensive Topic Practice Book',
        examName: currentExamName,
        totalQuestions: fetchedQs.length,
        questions: fetchedQs,
      });
      toast.success('PDF booklet generated successfully! Ready to save.', { id: toastId });
    } catch (err: any) {
      console.error('PDF export failed:', err);
      toast.error('Could not generate PDF booklet: ' + (err?.message || 'Error'), { id: toastId });
    }
  };

  const handleExportPdfForBank = async (bankItem: any) => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }
    if (bankItem.isPremium && !hasAccessTo(bankItem)) {
      setPaywallPrice(bankItem.price || 499);
      setPaywallOriginalPrice(bankItem.originalPrice || ((bankItem.price || 499) * 2));
      setPaywallItemTitle(bankItem.title || 'Premium Content');
      setPaywallItemId(bankItem.id);
      setPaywallProductType('question_bank');
      setShowPaywall(true);
      return;
    }

    const hasSeenGuide = typeof window !== 'undefined' && localStorage.getItem('oep_seen_pdf_export_guide') === 'true';
    if (!hasSeenGuide) {
      setPdfGuideItem(bankItem);
      return;
    }

    executeExportPdf(bankItem);
  };

  useEffect(() => {
    if (selectedBankItem) sessionStorage.setItem('oep_selectedBankItem', JSON.stringify(selectedBankItem));
    else sessionStorage.removeItem('oep_selectedBankItem');
  }, [selectedBankItem]);

  const renderCommonModals = () => {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <>
        <GlobalSearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          exams={exams}
          mockTests={mockTests}
          dynamicQuestionBanks={dynamicQuestionBanks}
          onViewExam={(examId) => setSelectedExam(examId)}
          onLaunchMockTest={(test: any) => {
            const examId = test.examId || test._resolvedExamId;
            handleStartTest({ ...test, type: 'mock_test', examId, examName: exams.find(e => e.id === examId)?.name });
          }}
          onLaunchBank={(bank: any) => {
            setSelectedBankItem(bank);
          }}
        />

        {/* Detail View Modal Backdrop */}
        <AnimatePresence>
          {selectedBankItem && (
            <motion.div
              key="detail-backdrop-color"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 bg-black/50 z-[100]"
              style={{ willChange: 'opacity' }}
              onClick={() => setSelectedBankItem(null)}
            />
          )}
        </AnimatePresence>

        {/* Detail View Modal Panel */}
        <AnimatePresence>
          {selectedBankItem && (
            <div className="fixed inset-0 z-[101] flex items-end md:items-center justify-center pointer-events-none px-3 pb-3 md:p-4" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 56px)' }}>
              <motion.div 
                key="detail-modal"
                variants={premiumModalVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="bg-[#FAF8F5] dark:bg-slate-900 rounded-[2rem] w-full md:w-full max-w-xl md:max-w-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col md:flex-row border border-slate-200/80 dark:border-slate-800 relative pointer-events-auto"
                style={{ willChange: 'transform, opacity' }}
              >
                  {/* Unified Close Button */}
                  <button 
                    onClick={() => setSelectedBankItem(null)}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white md:bg-slate-100 dark:md:bg-slate-800 md:hover:bg-slate-200 dark:md:hover:bg-slate-700 md:text-slate-500 dark:md:text-slate-300 rounded-xl transition-all z-50 hover:scale-105 active:scale-95 border-none cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                </button>

                {/* Left Column: Premium Visual Branding & Stats (Fixed height on mobile, full-height banner on laptop) */}
                <div className="relative h-28 md:h-auto md:min-h-[440px] md:w-[38%] bg-gradient-to-br from-[#12040b]/98 via-[#08020a]/99 to-[#030005]/100 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-slate-800 flex flex-col justify-center md:justify-between items-center p-4 md:p-8 overflow-hidden shrink-0">
                  {/* Ambient background grid and glowing orb */}
                  <div className="absolute inset-0 grid-bg opacity-[0.06] pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-brand-500/10 rounded-full blur-[60px] pointer-events-none" />
                  
                  {/* Category image as soft abstract overlay texture */}
                  {selectedBankItem.image && (
                    <img 
                      src={getDirectImageUrl(selectedBankItem.image)} 
                      alt={`${selectedBankItem.title || 'Odisha Exam Prep'} Category abstract background`} 
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none select-none z-0"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Dark gradient overlay to ensure text contrast and readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25 z-[1] pointer-events-none" />

                  {/* Interactive Orbital Study Seal */}
                  <div className="relative flex flex-col items-center justify-center space-y-2 md:space-y-4 w-full md:my-auto z-10">
                    <div className="relative w-12 h-12 md:w-28 md:h-28 flex items-center justify-center shrink-0">
                      {/* Outermost pulsing ambient glow */}
                      <div className="absolute inset-[-4px] md:inset-[-6px] rounded-full bg-brand-500/10 animate-ping opacity-60 pointer-events-none" style={{ animationDuration: '3s' }} />
                      {/* Outer dashed spinning ring */}
                      <div className="absolute inset-0 rounded-full border border-dashed border-brand-500/40 animate-[spin_20s_linear_infinite] hidden md:block" />
                      {/* Inner accent ring spinning in reverse */}
                      <div className="absolute inset-1 md:inset-2 rounded-full border border-brand-500/15 border-t-brand-500/60 animate-[spin_5s_linear_infinite_reverse] hidden md:block" />
                      {/* Mid subtle ring */}
                      <div className="absolute inset-2 md:inset-4 rounded-full border border-white/5 animate-[spin_12s_linear_infinite] hidden md:block" />
                      {/* Icon container with glow */}
                      <div className="w-8 h-8 md:w-16 md:h-16 rounded-lg md:rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shadow-2xl shadow-brand-500/30 backdrop-blur-md relative overflow-hidden">
                        {/* Shine sweep */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
                        <BookOpen className="w-4 h-4 md:w-7 md:h-7 text-brand-400 relative z-10 animate-[pulse_3s_ease-in-out_infinite]" />
                      </div>
                    </div>
                    
                    {/* Category tag for mobile */}
                    <div className="text-center md:hidden w-full px-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-brand-400">Question Bank Portal</p>
                    </div>

                    {/* Branding label for laptop */}
                    <div className="hidden md:block text-center space-y-1">
                      <h3 className="text-xl font-serif font-extrabold text-white">
                        Odisha<span className="font-serif italic font-normal text-brand-400">Prep</span>
                      </h3>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Study Companion</p>
                    </div>
                  </div>

                  {/* Desktop Stats Cards (translucent style, hidden on mobile) */}
                  <div className="relative hidden md:grid grid-cols-2 gap-3 z-10 w-full mt-auto">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-sm">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Questions</p>
                      <p className="text-base font-black text-white">{selectedBankItem.questionCount || selectedBankItem.questions}</p>
                    </div>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md shadow-sm">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Highlight</p>
                      <p className="text-[10px] font-black text-brand-400 line-clamp-2 leading-tight" title={getBankDisplayTagline(selectedBankItem.tagline, "Comprehensive")}>
                        {getBankDisplayTagline(selectedBankItem.tagline, "Comprehensive")}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Right Column: Metadata, List & Actions */}
                <div className={cn("relative md:w-[62%] p-5 md:p-8 flex flex-col overflow-hidden no-scrollbar max-h-full flex-1 min-h-0", !isMobile && "overflow-y-auto smooth-scroll-gpu")}>
                  {/* Subtle grid background */}
                  <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />

                  <div className="space-y-4 sm:space-y-6 relative z-10 flex-grow flex flex-col justify-between h-full min-h-0">
                    <div className="space-y-4">
                      {/* Topic Title (Visible on mobile and laptop) */}
                      <div className="space-y-1.5 text-left md:text-left">
                        <span className="inline-flex items-center px-2 py-0.5 bg-brand-50 dark:bg-brand-950/60 text-[#2563EB] dark:text-brand-400 rounded text-[9px] font-black uppercase tracking-wider border border-brand-100 dark:border-brand-800/60">
                          Topic Focus
                        </span>
                        <h2 
                          className={cn(
                            "font-serif font-extrabold text-slate-900 dark:text-white leading-tight line-clamp-3 md:line-clamp-3",
                            selectedBankItem.title.length > 55 ? "text-lg sm:text-xl md:text-2xl" : "text-xl sm:text-2xl md:text-3xl"
                          )}
                          title={selectedBankItem.title}
                        >
                          {selectedBankItem.title}
                        </h2>
                      </div>

                      {/* Description */}
                      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                        {selectedBankItem.description || (
                          selectedBankItem.title.length > 50 
                            ? 'Access official question banks, chapter notes, and exam practice materials customized for this topic.'
                            : `Access official question banks, chapter notes, and exam practice materials customized for ${selectedBankItem.title}.`
                        )}
                      </p>
                      
                      {/* Mobile Stats Cards (Rendered here on mobile viewports) */}
                      <div className="grid grid-cols-2 gap-3 md:hidden">
                        <div className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Questions</p>
                          <p className="text-base font-black text-slate-900 dark:text-white">{selectedBankItem.questionCount || selectedBankItem.questions}</p>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl shadow-sm">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Highlight</p>
                          <p className="text-[10px] font-black text-[#2563EB] dark:text-brand-400 line-clamp-2 leading-tight" title={getBankDisplayTagline(selectedBankItem.tagline, "Comprehensive")}>
                            {getBankDisplayTagline(selectedBankItem.tagline, "Comprehensive")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Unified Question Bank Action Center */}
                    <div className="space-y-3 pt-2">
                      {/* 1. Primary Action: Open & Read in Website */}
                      <Button 
                        variant="primary" 
                        className={cn(
                          "w-full h-13 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest premium-gradient text-white shadow-xl shadow-brand-500/25 flex items-center justify-center gap-2.5 cursor-pointer",
                          !isMobile && "hover:premium-glow hover:scale-[1.01] transition-all"
                        )}
                        onClick={() => {
                          if (isGuest) {
                            setShowLoginPrompt(true);
                            return;
                          }
                          if (selectedBankItem.isPremium && !hasAccessTo(selectedBankItem)) {
                            setPaywallPrice(selectedBankItem.price || 499);
                            setPaywallOriginalPrice(selectedBankItem.originalPrice || ((selectedBankItem.price || 499) * 2));
                            setPaywallItemTitle(selectedBankItem.title || 'Premium Content');
                            setPaywallFeatures([
                              `${selectedBankItem.questionCount || selectedBankItem.questions || '500+'} Questions`,
                              'Interactive Web Reader & PDF Export',
                              selectedBankItem.tagline || 'Detailed Solutions Provided',
                              'KaTeX Mathematical Formula Rendering'
                            ]);
                            setPaywallItemId(selectedBankItem.id);
                            setPaywallProductType('question_bank');
                            setShowPaywall(true);
                          } else {
                            setActiveReadingBank(selectedBankItem);
                            setSelectedBankItem(null);
                          }
                        }}
                      >
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Open & Read in Website</span>
                      </Button>

                      {/* 2. Secondary Action Row: Download PDF Booklet & Practice Mode */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleExportPdfForBank(selectedBankItem)}
                          className={cn(
                            "h-12 rounded-2xl text-xs font-black text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]",
                            !isMobile && "hover:border-brand-300 dark:hover:border-brand-500/50 hover:text-brand-600 dark:hover:text-brand-400"
                          )}
                        >
                          <Download className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                          <span>Download PDF</span>
                        </button>

                        <button
                          type="button"
                          disabled={selectedBankItem.hasPracticeMode === false}
                          onClick={() => {
                            if (selectedBankItem.hasPracticeMode === false) {
                              alert("Practice mode for this topic is coming soon!");
                              return;
                            }
                            
                            if (isGuest) {
                              setShowLoginPrompt(true);
                              return;
                            }

                            if (selectedBankItem.isPremium && !hasAccessTo(selectedBankItem)) {
                              setPaywallPrice(selectedBankItem.price || 499);
                              setPaywallOriginalPrice(selectedBankItem.originalPrice || ((selectedBankItem.price || 499) * 2));
                              setPaywallItemTitle(selectedBankItem.title || 'Premium Content');
                              setPaywallFeatures([
                                `${selectedBankItem.questionCount || selectedBankItem.questions || '500+'} Questions`,
                                selectedBankItem.hasPracticeMode !== false ? 'Interactive Practice Mode' : 'Instant PDF Access',
                                selectedBankItem.tagline || 'Detailed Solutions Provided',
                                'Advanced Performance Analytics'
                              ]);
                              setPaywallItemId(selectedBankItem.id);
                              setPaywallProductType('question_bank');
                              setShowPaywall(true);
                            } else {
                              setSelectedBankItem(null);
                              setSelectedBankType(null);
                              setShowPracticeConfig(true);
                              setPracticeSettings({
                                ...practiceSettings, 
                                examId: selectedExam || practiceSettings.examId,
                                category: selectedBankType || practiceSettings.category,
                                topic: selectedBankItem.id
                              });
                              setMobileExamTab('practice');
                              scrollToElement('practice-mode-section', { block: 'start', delay: 100 });
                            }
                          }}
                          className={cn(
                            "h-12 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]",
                            selectedBankItem.hasPracticeMode === false
                              ? "bg-slate-50 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800 cursor-not-allowed opacity-60"
                              : "bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100/80 dark:hover:bg-brand-900/80 text-brand-600 dark:text-brand-300 border border-brand-200/80 dark:border-brand-800/60"
                          )}
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Practice Mode</span>
                        </button>
                      </div>

                      {/* 3. Optional Extra Attached Materials (Only if admin explicitly added external links) */}
                      {selectedBankItem.pdfLinks && selectedBankItem.pdfLinks.length > 0 && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.18em]">
                            Supplementary Attachments
                          </p>
                          <div className="space-y-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-1">
                            {selectedBankItem.pdfLinks.map((link: any, idx: number) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => window.open(link.url, '_blank')}
                                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-brand-50/50 dark:hover:bg-slate-700/80 border border-slate-200/60 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 transition-all text-left"
                              >
                                <span className="truncate flex-1 pr-2">{link.title || `Attachment ${idx + 1}`}</span>
                                <Download className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Practice Config Modal — also available from Library tab */}
        <AnimatePresence mode="wait">
          {showPracticeConfig && (
            <React.Suspense fallback={<LoadingPortal />}>
              <>
                {/* Animated dimming layer */}
                <motion.div
                  key="practice-backdrop-color"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed inset-0 bg-slate-950/40 z-[100]"
                  style={{ willChange: 'opacity' }}
                  onClick={() => setShowPracticeConfig(false)}
                />

                {/* Modal panel — slides up on mobile, scale+fade on desktop */}
                <div className="fixed inset-0 z-[101] flex items-end md:items-center justify-center pointer-events-none p-0 md:p-6">
                  <motion.div
                    key="practice-modal"
                    variants={premiumModalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="relative w-full md:max-w-4xl max-h-[92vh] md:max-h-[90vh] flex flex-col bg-white rounded-t-[2rem] md:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border-x-0 border-b-0 md:border border-slate-200/50 overflow-hidden pointer-events-auto"
                    style={{ willChange: 'transform, opacity' }}
                  >
                {/* Background glowing effects */}
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

                {/* Drag handle (mobile only) */}
                <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto mt-3 mb-0 shrink-0" />

                <div className="p-4 sm:p-7 md:p-9 overflow-y-auto overscroll-contain no-scrollbar relative z-10 flex flex-col" data-lenis-prevent>
                  <div className="flex justify-between items-start mb-4 md:mb-8 border-b border-slate-100 pb-3 md:pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 premium-gradient rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-500/10">
                        <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-white animate-[pulse_3s_infinite]" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-2xl font-black premium-text-gradient tracking-tight">Configure Practice</h3>
                        <p className="text-[11px] sm:text-sm text-slate-500 font-semibold mt-0.5">Set your preferences for this session</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowPracticeConfig(false)} 
                      className="p-1.5 sm:p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer border border-slate-200/40"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5 md:gap-7 mb-5 md:mb-8">
                    {/* Select Exam Card */}
                    <div className="bg-slate-50/50 border border-slate-200/50 rounded-2xl p-3.5 sm:p-4.5 space-y-2.5 sm:space-y-3 flex flex-col justify-between hover:border-brand-200 hover:shadow-md hover:shadow-brand-500/2 transition-all duration-300 relative group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-brand-500/5 rounded-full blur-lg pointer-events-none" />
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
                          Select Exam
                        </label>
                        <span className="text-[9px] font-extrabold text-brand-600 bg-brand-50/80 px-2 py-0.5 rounded-full uppercase tracking-wider">Step 1</span>
                      </div>
                      <SearchableSelect
                        value={practiceSettings.examId || ''}
                        onChange={(val) => setPracticeSettings({...practiceSettings, examId: val, category: '', topic: ''})}
                        options={actualExams.map(ex => ({ value: ex.id, label: ex.name }))}
                        placeholder="Choose an exam..."
                        searchPlaceholder="Search exams..."
                        className="px-4 h-[48px] rounded-xl text-sm border-slate-200 bg-white hover:border-slate-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/5 transition-all font-bold text-slate-700 shadow-sm"
                      />
                    </div>

                    {/* Select Category Card */}
                    <div className={cn(
                      "border rounded-2xl p-3.5 sm:p-4.5 space-y-2.5 sm:space-y-3 flex flex-col justify-between transition-all duration-300 relative group",
                      practiceSettings.examId 
                        ? "bg-slate-50/50 border-slate-200/50 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/2" 
                        : "bg-slate-100/20 border-slate-200/30 opacity-75"
                    )}>
                      {practiceSettings.examId && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-lg pointer-events-none" />}
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", practiceSettings.examId ? "bg-indigo-500 animate-pulse" : "bg-slate-300")} />
                          Select Category
                        </label>
                        <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          practiceSettings.examId ? "text-indigo-650 bg-indigo-50/80" : "text-slate-400 bg-slate-100"
                        )}>Step 2</span>
                      </div>
                      {!practiceSettings.examId ? (
                        <div className="h-[48px] rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between px-3 text-slate-400/80 text-xs font-semibold select-none">
                          <span className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-300" />
                            <span>Select an exam first</span>
                          </span>
                        </div>
                      ) : (
                        <SearchableSelect
                          value={practiceSettings.category}
                          onChange={(val) => setPracticeSettings({...practiceSettings, category: val, topic: ''})}
                          disabled={!practiceSettings.examId}
                          options={[
                            { value: "topic-wise", label: "Topic-wise Question Bank" },
                            { value: "exam-focused", label: "Exam-Focused Bank" },
                            { value: "revision-sets", label: "Revision Sets" },
                            { value: "pyq-collections", label: "PYQ Collections" },
                          ]}
                          placeholder="Choose a category..."
                          searchPlaceholder="Search categories..."
                          className="px-4 h-[48px] rounded-xl text-sm border-slate-200 bg-white hover:border-slate-300 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold text-slate-700 shadow-sm"
                        />
                      )}
                    </div>

                    {/* Select Topic / Unit Card */}
                    <div className={cn(
                      "border rounded-2xl p-3.5 sm:p-4.5 space-y-2.5 sm:space-y-3 flex flex-col justify-between transition-all duration-300 relative group sm:col-span-2 lg:col-span-1",
                      practiceSettings.category 
                        ? "bg-slate-50/50 border-slate-200/50 hover:border-purple-200 hover:shadow-md hover:shadow-purple-500/2" 
                        : "bg-slate-100/20 border-slate-200/30 opacity-75"
                    )}>
                      {practiceSettings.category && <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/5 rounded-full blur-lg pointer-events-none" />}
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span className={cn("w-1.5 h-1.5 rounded-full", practiceSettings.category ? "bg-purple-500 animate-pulse" : "bg-slate-300")} />
                          Select Topic / Unit
                        </label>
                        <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider",
                          practiceSettings.category ? "text-purple-600 bg-purple-50/80" : "text-slate-400 bg-slate-100"
                        )}>Step 3</span>
                      </div>
                      {!practiceSettings.category ? (
                        <div className="h-[48px] rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between px-3 text-slate-400/80 text-xs font-semibold select-none">
                          <span className="flex items-center gap-2">
                            <Lock className="w-3.5 h-3.5 text-slate-300" />
                            <span>Select a category first</span>
                          </span>
                        </div>
                      ) : (
                        <SearchableSelect
                          value={practiceSettings.topic}
                          onChange={(val) => setPracticeSettings({...practiceSettings, topic: val})}
                          disabled={!practiceSettings.category}
                          options={(dynamicQuestionBanks[practiceSettings.category] || [])
                            .filter((item: any) => item.examId === practiceSettings.examId && (!item.is_archived || hasAccessTo(item)))
                            .map((item: any) => ({
                              value: item.id,
                              label: `${item.title} ${item.isPremium && !hasAccessTo(item) ? '(Premium)' : ''}`
                            }))}
                          placeholder="Choose a topic..."
                          searchPlaceholder="Search topics..."
                          className="px-4 h-[48px] rounded-xl text-sm border-slate-200 bg-white hover:border-slate-300 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 transition-all font-bold text-slate-700 shadow-sm"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-7">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Number of Questions
                        </label>
                        {practiceSettings.topic && (
                          <span className="text-[10px] font-bold text-indigo-650 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded-full">
                            {topicMaxQuestions} Available
                          </span>
                        )}
                      </div>
                      {!practiceSettings.topic ? (
                        <div className="w-full py-6 sm:py-9 rounded-2xl border border-dashed border-slate-300 bg-slate-50/30 text-slate-400 font-bold text-center text-xs md:text-sm flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all duration-300">
                          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="text-slate-400 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider">Select a topic first</div>
                        </div>
                      ) : topicMaxQuestions === 0 ? (
                        <div className="w-full py-6 sm:py-9 rounded-2xl border border-dashed border-rose-200 bg-rose-50/20 text-rose-500 font-bold text-center text-xs md:text-sm flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all duration-300">
                          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-rose-50 rounded-full flex items-center justify-center text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          </div>
                          <div className="text-rose-500 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider">No questions available yet</div>
                        </div>
                      ) : (
                        <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300 shadow-sm hover:border-slate-300/80">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between mb-2 md:mb-4">
                            <span className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight flex items-baseline gap-1">
                              {practiceSettings.questions}
                              <span className="text-xs font-semibold text-slate-400">questions</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-indigo-650 bg-indigo-50/80 border border-indigo-100/50 px-2 py-0.5 rounded-full">
                              Range: 1 - {topicMaxQuestions}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input 
                              type="range" 
                              min="1" 
                              max={topicMaxQuestions} 
                              value={practiceSettings.questions}
                              onChange={(e) => setPracticeSettings({...practiceSettings, questions: e.target.value})}
                              className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                            />
                            <div className="relative w-16 shrink-0">
                              <input 
                                type="number" 
                                min="1" 
                                max={topicMaxQuestions} 
                                value={practiceSettings.questions}
                                onChange={(e) => { 
                                  let val = parseInt(e.target.value); 
                                  if (isNaN(val)) val = 1; 
                                  if (val > topicMaxQuestions) val = topicMaxQuestions; 
                                  if (val < 1) val = 1; 
                                  setPracticeSettings({...practiceSettings, questions: val.toString()}); 
                                }}
                                className="w-full py-1.5 px-2 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-slate-800 text-center text-xs md:text-sm shadow-sm" 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-end mb-1">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          Time Limit
                        </label>
                      </div>
                      {!practiceSettings.topic ? (
                        <div className="w-full py-6 sm:py-9 rounded-2xl border border-dashed border-slate-300 bg-slate-50/30 text-slate-400 font-bold text-center text-xs md:text-sm flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all duration-300">
                          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="text-slate-400 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider">Select a topic first</div>
                        </div>
                      ) : topicMaxQuestions === 0 ? (
                        <div className="w-full py-6 sm:py-9 rounded-2xl border border-dashed border-slate-200 bg-slate-50/30 text-slate-400 font-bold text-center text-xs md:text-sm flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all duration-300">
                          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <Lock className="w-3.5 h-3.5 text-slate-400" />
                          </div>
                          <div className="text-slate-400 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider">-</div>
                        </div>
                      ) : (
                        <div className="bg-slate-50/50 border border-slate-200/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300 shadow-sm hover:border-slate-300/80">
                          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
                          <div className="flex items-center justify-between mb-2 md:mb-4">
                            <span className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight flex items-baseline gap-1">
                              {practiceSettings.timeLimit}
                              <span className="text-xs font-semibold text-slate-400">minutes</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-indigo-650 bg-indigo-50/80 border border-indigo-100/50 px-2 py-0.5 rounded-full">
                              Range: 1 - 180 min
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <input 
                              type="range" 
                              min="1" 
                              max="180" 
                              value={practiceSettings.timeLimit}
                              onChange={(e) => setPracticeSettings({...practiceSettings, timeLimit: e.target.value})}
                              className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer" 
                            />
                            <div className="relative w-16 shrink-0">
                              <input 
                                type="number" 
                                min="1" 
                                max="180" 
                                value={practiceSettings.timeLimit}
                                onChange={(e) => { 
                                  let val = parseInt(e.target.value); 
                                  if (isNaN(val)) val = 1; 
                                  if (val > 180) val = 180; 
                                  if (val < 1) val = 1; 
                                  setPracticeSettings({...practiceSettings, timeLimit: val.toString()}); 
                                }}
                                className="w-full py-1.5 px-2 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-black text-slate-800 text-center text-xs md:text-sm shadow-sm" 
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 md:mt-10 flex justify-center w-full">
                    <Button
                      disabled={!practiceSettings.topic || loadingPractice || topicMaxQuestions === 0}
                      className={cn(
                        "w-full sm:w-auto px-8 sm:px-16 py-3.5 rounded-2xl text-sm sm:text-base font-black transition-all sm:min-w-[280px] flex items-center justify-center gap-2 cursor-pointer shadow-lg group/btn",
                        (!practiceSettings.topic || loadingPractice || topicMaxQuestions === 0)
                          ? "bg-slate-100 text-slate-400 border border-slate-200/60 shadow-none pointer-events-none cursor-not-allowed"
                          : "premium-gradient text-white hover:premium-glow hover:scale-[1.02] shadow-brand-500/20"
                      )}
                      onClick={handleStartDynamicPractice}
                    >
                      {loadingPractice ? 'Compiling Practice...' : 'Start Practice Session'}
                      <ChevronRight className="w-5 h-5 ml-1 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </div>
                </div>
                  </motion.div>
                </div>
              </>
            </React.Suspense>
          )}
        </AnimatePresence>

        {/* Paywall Modal */}
        <AnimatePresence mode="wait">
          {showPaywall && (
            <>
              {/* Animated dimming layer */}
              <motion.div
                key="paywall-backdrop-color"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 bg-slate-950/60 z-[250]"
                style={{ willChange: 'opacity' }}
                onClick={() => {
                  if (paymentState === 'idle') {
                    setShowPaywall(false);
                    setPaywallItemId(null);
                    setPaymentState('idle');
                    setPaymentError(null);
                  }
                }}
              />

              {/* Modal panel wrapper */}
              <div className="fixed inset-0 z-[251] flex items-end md:items-center justify-center pointer-events-none p-0 md:p-4">
                <motion.div 
                  key="paywall-modal"
                  variants={premiumModalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="relative overflow-hidden rounded-t-[2.5rem] md:rounded-[2.5rem] p-[1px] bg-gradient-to-b from-white/15 via-white/5 to-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] w-full max-w-md max-h-fit md:max-h-fit flex flex-col pointer-events-auto"
                  style={{ willChange: 'transform, opacity' }}
                >
                  {/* Drag handle (mobile only) */}
                  <div className="sm:hidden w-10 h-1 bg-slate-700/50 rounded-full mx-auto mt-3 shrink-0" />

                  {/* Background ambient light */}
                  <div className="absolute top-0 left-1/4 w-[180px] h-[180px] bg-brand-500/10 rounded-full blur-[50px] pointer-events-none" />
                  <div className="absolute bottom-0 right-1/4 w-[180px] h-[180px] bg-indigo-500/10 rounded-full blur-[50px] pointer-events-none" />

                  <div className="bg-[#0B0F19] rounded-t-[2.45rem] sm:rounded-[2.45rem] p-4 sm:p-6 pb-5 sm:pb-7 relative overflow-hidden flex flex-col flex-1">
                    {/* Close button with subtle outline */}
                    {paymentState === 'idle' && (
                    <button 
                      onClick={() => { 
                        setShowPaywall(false); 
                        setPaywallItemId(null); 
                        setPaymentState('idle');
                        setPaymentError(null);
                      }}
                      className="absolute top-4 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all z-20"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <AnimatePresence mode="wait">
                    {paymentState === 'idle' && (
                      <motion.div 
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                        className="text-center space-y-3 sm:space-y-5 flex flex-col flex-1 py-1 mt-1 sm:mt-2.5 overflow-visible"
                      >
                        {/* Pulsing visual badge */}
                        <motion.div 
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                          className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-tr from-brand-600 via-brand-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-[0_6px_20px_rgba(37,99,235,0.25)] border border-white/10 relative group shrink-0"
                        >
                          <Award className="text-white w-5.5 h-5.5 sm:w-7 sm:h-7 filter drop-shadow-[0_2px_6px_rgba(255,255,255,0.2)]" />
                          <div className="absolute inset-0 border border-brand-400/25 rounded-2xl animate-ping opacity-25 pointer-events-none" />
                        </motion.div>
                        
                        <div className="space-y-1 sm:space-y-1.5 shrink-0">
                          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight px-1 font-sans">
                            {paywallItemTitle.includes('Full Access') ? (
                              <>Unlock <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-pink-200 to-indigo-300">Full Access</span></>
                            ) : (
                              <>Unlock <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-pink-200 to-indigo-300">{paywallItemTitle}</span></>
                            )}
                          </h2>
                          <p className="text-slate-400 text-[11px] sm:text-xs font-medium leading-relaxed max-w-sm mx-auto">
                            {paywallItemTitle.includes('Full Access') 
                              ? 'Unlock full lifetime access to all Question Banks, Practice Mode, Premium Mock Tests, PDF notes, and any future content added to this exam.' 
                              : `Unlock full lifetime access to this specific premium content, including detailed solutions and any future updates.`
                            }
                          </p>
                        </div>

                        {/* Features Panel */}
                        <motion.div 
                          initial="hidden"
                          animate="show"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: { staggerChildren: 0.06 }
                            }
                          }}
                          className="space-y-1.5 sm:space-y-2 text-left bg-white/[0.02] border border-white/[0.06] p-3 sm:p-4 rounded-[1.25rem] backdrop-blur-md shrink-0"
                        >
                          {paywallFeatures.map((benefit, i) => (
                            <motion.div 
                              key={i} 
                              variants={{
                                hidden: { opacity: 0, x: -8 },
                                show: { opacity: 1, x: 0 }
                              }}
                              className="flex items-center gap-2 sm:gap-2.5 text-slate-200 font-bold"
                            >
                              <div className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              </div>
                              <span className="text-[10.5px] sm:text-xs tracking-wide">{benefit}</span>
                            </motion.div>
                          ))}
                        </motion.div>

                        {/* Pricing Block */}
                        <div className="space-y-2 sm:space-y-3 pt-0.5 shrink-0">
                          <div className="flex flex-col items-center justify-center gap-1 sm:gap-0">
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm sm:text-lg font-bold text-slate-500 line-through font-mono">₹{paywallOriginalPrice}</span>
                              <span className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tighter">₹{paywallPrice}</span>
                              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 sm:hidden">
                                {Math.round(((paywallOriginalPrice - paywallPrice) / paywallOriginalPrice) * 100)}% OFF
                              </span>
                            </div>
                            <span className="hidden sm:inline-block text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mt-1">
                              {Math.round(((paywallOriginalPrice - paywallPrice) / paywallOriginalPrice) * 100)}% OFF • Lifetime Access
                            </span>
                            <span className="sm:hidden text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                              Lifetime Access Included
                            </span>
                          </div>

                          {/* CTA Button */}
                          <Button 
                            className="w-full h-11 sm:h-12 rounded-xl text-sm sm:text-base font-black bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.25)] hover:shadow-[0_12px_35px_rgba(37,99,235,0.4)] group/btn relative overflow-hidden transition-all duration-300 active:scale-[0.98] border border-white/10"
                            onClick={async () => {
                            try {
                              const res = await loadRazorpay();
                              if (!res) {
                                alert('Failed to load payment gateway SDK. Please check your internet connection.');
                                // Reset paymentState just in case
                                setPaymentState('idle');
                                return;
                              }

                              // 1. Create order on the server
                              const orderRes = await fetch('/api/payment/order', {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                  productId: paywallItemId || 'full_access',
                                  productType: paywallProductType,
                                  userId: profile?.uid || user?.id || 'unknown',
                                  currency: 'INR'
                                })
                              });

                              let orderData;
                              const orderText = await orderRes.text();
                              try {
                                orderData = orderText ? JSON.parse(orderText) : {};
                              } catch (e) {
                                throw new Error(`Invalid response from server. Status: ${orderRes.status}. If you just updated the server, please restart the dev server (npm run dev).`);
                              }

                              if (!orderRes.ok) {
                                throw new Error(orderData.message || `Failed to create payment order (status ${orderRes.status}).`);
                              }

                              if (!orderData.orderId) {
                                throw new Error('Server did not return a valid order ID. Please verify your Razorpay API key configurations in .env and restart your dev server.');
                              }

                              // Track pending payment state in localStorage (essential for auto-recovery on page reloads/switches)
                              localStorage.setItem('oep_pending_payment', JSON.stringify({
                                orderId: orderData.orderId,
                                productId: paywallItemId || 'full_access',
                                timestamp: Date.now()
                              }));

                              // 2. Open Razorpay checkout with the orderId
                              const options = {
                                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_StcJAJY1MgRGmJ',
                                amount: orderData.amount,
                                currency: orderData.currency,
                                name: 'OdishaExamPrep Premium',
                                description: paywallItemTitle === 'Full Access' ? 'Unlock Full Access' : `Unlock ${paywallItemTitle}`,
                                order_id: orderData.orderId,
                                handler: async function (response: any) {
                                  try {
                                    setPaymentState('processing');
                                    setPaymentError(null);
                                    // 3. Verify payment signature on the server and record secure entitlement
                                    const verifyRes = await fetch('/api/payment/verify', {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        userId: profile?.uid || user?.id,
                                        productId: paywallItemId || 'full_access',
                                        productType: paywallProductType,
                                        pricePaid: paywallPrice,
                                        snapshot: {
                                          id: paywallItemId || 'full_access',
                                          title: paywallItemTitle,
                                          price: paywallPrice
                                        }
                                      })
                                    });

                                    let verifyData;
                                    const verifyText = await verifyRes.text();
                                    try {
                                      verifyData = verifyText ? JSON.parse(verifyText) : {};
                                    } catch (e) {
                                      throw new Error(`Invalid verification response from server. Status: ${verifyRes.status}`);
                                    }

                                    if (!verifyRes.ok) {
                                      throw new Error(verifyData.message || 'Payment verification failed.');
                                    }
                                    if (verifyData.success) {
                                      setPaymentState('success');
                                      if (paywallItemId) {
                                        await unlockItem(paywallItemId);
                                      } else {
                                        await grantFullAccess();
                                      }
                                      setTimeout(() => {
                                        setShowPaywall(false);
                                        setPaywallItemId(null);
                                        setPaymentState('idle');
                                      }, 2000);
                                    } else {
                                      throw new Error(verifyData.message || 'Payment verification failed.');
                                    }
                                  } catch (err: any) {
                                    console.error('Verification error:', err);
                                    setPaymentState('error');
                                    setPaymentError(err.message || 'Payment verification failed.');
                                  }
                                },
                                prefill: {
                                  name: profile?.displayName || '',
                                  email: profile?.email || ''
                                },
                                theme: { color: '#4f46e5' },
                                modal: {
                                  ondismiss: function () {
                                    console.log('Payment checkout closed');
                                    localStorage.removeItem('oep_pending_payment');
                                  }
                                }
                              };

                              const rzp = new (window as any).Razorpay(options);
                              rzp.open();
                            } catch (err: any) {
                              console.error('Payment initialization failed:', err);
                              alert('Payment initialization failed: ' + err.message);
                            }
                          }}
                          >
                            {/* Button Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 z-10" />

                            <span className="relative z-10 flex items-center justify-center gap-2">
                              Unlock Now
                              <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                            </span>
                          </Button>

                          {/* Secure Info Footer */}
                          <div className="flex items-center justify-center gap-1.2 text-[9px] text-slate-400 font-semibold pt-0.5">
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>Secure payment via Razorpay • Instant Activation</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentState === 'processing' && (
                      <motion.div
                        key="processing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center space-y-8 py-10 flex-1 flex flex-col justify-center items-center"
                      >
                        {/* Glowing progress ring */}
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          {/* Pulsing outer aura */}
                          <div className="absolute inset-0 bg-brand-500/20 rounded-full blur-xl animate-pulse" />
                          {/* Spinning border ring */}
                          <div className="absolute inset-0 border-4 border-white/5 rounded-full" />
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                            className="absolute inset-0 border-4 border-t-brand-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                          />
                          <Lock className="w-8 h-8 text-slate-400 animate-bounce" />
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-xl font-extrabold text-white tracking-tight">Confirming Purchase...</h3>
                          <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                            Please do not close this window, refresh the page, or click back. We are verifying your transaction signature securely.
                          </p>
                        </div>

                        {/* Verification steps animation */}
                        <div className="w-full max-w-xs bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 text-left space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/25 border border-emerald-500/50 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-200">Secure Payment Received</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full border border-brand-500/50 flex items-center justify-center shrink-0 animate-pulse bg-brand-500/10">
                              <RotateCw className="w-3 h-3 text-brand-400 animate-spin" />
                            </div>
                            <span className="text-xs font-black text-white">Cryptographic Verification</span>
                          </div>

                          <div className="flex items-center gap-3 opacity-40">
                            <div className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center shrink-0 text-slate-500">
                              <span className="text-[9px] font-black">3</span>
                            </div>
                            <span className="text-xs font-bold text-slate-400">Activating Lifetime Access</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {paymentState === 'success' && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center space-y-8 py-10 flex-1 flex flex-col justify-center items-center"
                      >
                        {/* Celebrate circle checkmark */}
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          {/* Pulsing successful aura */}
                          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl" />
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 15 }}
                            className="w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(16,185,129,0.3)] border border-white/10"
                          >
                            <ShieldCheck className="w-10 h-10 text-white" />
                          </motion.div>
                          
                          {/* Animated Sparkles popping out */}
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1"
                          >
                            <Sparkles className="w-5 h-5 text-amber-300" />
                          </motion.div>
                          <motion.div 
                            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.8, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                            className="absolute -bottom-1 -left-1"
                          >
                            <Sparkles className="w-4 h-4 text-pink-300" />
                          </motion.div>
                        </div>

                        <div className="space-y-3">
                          <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 tracking-tight leading-tight font-sans">Payment Verified!</h3>
                          <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed font-medium">
                            {paywallItemTitle === 'Full Access' 
                              ? 'Your lifetime access package is activated! Unlocking all practice systems and mock tests now.' 
                              : `Successfully unlocked: "${paywallItemTitle}". Enjoy your learning journey!`
                            }
                          </p>
                        </div>

                        {/* Completed Verification steps */}
                        <div className="w-full max-w-xs bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-4 text-left space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/25 border border-emerald-500/50 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-300">Secure Payment Received</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/25 border border-emerald-500/50 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-bold text-slate-300">Cryptographic Verification</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/25 border border-emerald-500/50 flex items-center justify-center shrink-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <span className="text-xs font-black text-emerald-400">Access Activated Successfully</span>
                          </div>
                        </div>

                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                          <RotateCw className="w-3 h-3 animate-spin text-slate-500" />
                          Redirecting to your course...
                        </div>
                      </motion.div>
                    )}

                    {paymentState === 'error' && (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="text-center space-y-6 py-6 flex-1 flex flex-col justify-center items-center"
                      >
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <div className="absolute inset-0 bg-rose-500/20 rounded-full blur-xl animate-pulse" />
                          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/35 rounded-2xl flex items-center justify-center text-rose-500 shadow-lg shadow-rose-950/20">
                            <AlertCircle className="w-8 h-8" />
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          <h3 className="text-lg font-black text-rose-400 tracking-tight leading-tight">Verification Failed</h3>
                          <p className="text-slate-400 text-xs max-w-xs mx-auto leading-relaxed">
                            {paymentError || 'There was a problem verifying your purchase entitlement with our servers.'}
                          </p>
                        </div>

                        {/* Customer Support Reassurance Card */}
                        <div className="w-full max-w-xs bg-rose-950/15 border border-rose-500/15 p-4 rounded-xl text-left space-y-2">
                          <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest">Debited but not unlocked?</h4>
                          <p className="text-[11px] text-slate-400 leading-normal font-medium">
                            If the amount was deducted from your account, do not worry. Your money is safe. Please email us at <strong className="text-rose-200 font-bold select-all">support@odishaexamprep.com</strong> with your transaction ID, and our support team will unlock it manually within a few hours.
                          </p>
                        </div>

                        <div className="flex flex-col gap-2 w-full max-w-xs">
                          <Button 
                            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all active:scale-95 cursor-pointer"
                            onClick={() => {
                              setShowPaywall(false);
                              setPaywallItemId(null);
                              setPaymentState('idle');
                              setPaymentError(null);
                            }}
                          >
                            Close Overlay
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>

        {/* Login Prompt Popup */}
        <AnimatePresence mode="wait">
          {showLoginPrompt && (
            <>
              {/* Animated dimming layer */}
              <motion.div
                key="login-backdrop-color"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 bg-black/50 z-[200]"
                style={{ willChange: 'opacity' }}
                onClick={() => setShowLoginPrompt(false)}
              />

              {/* Modal panel — slides up from bottom on mobile, scales in on desktop */}
              <div className="fixed inset-0 z-[201] flex items-end md:items-center justify-center pointer-events-none p-0 md:p-4">
                <motion.div
                  key="login-modal"
                  variants={premiumModalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] w-full md:max-w-sm p-8 space-y-6 shadow-2xl relative overflow-hidden max-h-[92vh] md:max-h-[85vh] flex flex-col pointer-events-auto"
                  style={{ willChange: 'transform, opacity' }}
                >
                  {/* Decorative background orbs */}
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

                  {/* Drag handle (mobile) */}
                  <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-2 mb-2" />

                  <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto relative">
                    <User className="w-8 h-8 text-indigo-600" />
                    <div className="absolute inset-0 border-2 border-indigo-200 rounded-2xl animate-ping opacity-20" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-slate-900">Sign in Required</h3>
                    <p className="text-slate-500">Please sign in to access mock tests, question banks, or Practice Mode.</p>
                  </div>
                  <Button className="w-full py-4" onClick={() => { setShowLoginPrompt(false); if (onSignIn) onSignIn(); }}>
                    Sign In Now
                  </Button>
                  <button onClick={() => setShowLoginPrompt(false)} className="w-full text-slate-500 text-sm font-medium pb-1">
                    Maybe Later
                  </button>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Premium Info Modal */}
        <AnimatePresence mode="wait">
          {infoModal && infoModal.isOpen && (
            <>
              {/* Animated dimming layer */}
              <motion.div
                key="info-backdrop-color"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 bg-black/50 z-[300]"
                style={{ willChange: 'opacity' }}
                onClick={() => setInfoModal(null)}
              />

              {/* Modal panel */}
              <div className="fixed inset-0 z-[301] flex items-center justify-center pointer-events-none p-4">
                <motion.div
                  key="info-modal"
                  variants={premiumScaleModalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white rounded-[2rem] w-full max-w-sm p-6 space-y-6 shadow-2xl relative overflow-hidden flex flex-col pointer-events-auto text-center border border-slate-100"
                  style={{ willChange: 'transform, opacity' }}
                >
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto relative text-brand-600">
                    <AlertCircle className="w-7 h-7" />
                    <div className="absolute inset-0 border-2 border-brand-100 rounded-2xl animate-pulse opacity-40" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">{infoModal.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-semibold px-2">{infoModal.message}</p>
                  </div>

                  <Button 
                    className="w-full h-12 rounded-xl premium-gradient text-white font-black text-xs shadow-md shadow-brand-500/10 active:scale-[0.98] transition-transform border-none cursor-pointer"
                    onClick={() => setInfoModal(null)}
                  >
                    Got it, thanks!
                  </Button>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>

        {/* Question Bank Web Reader Modal */}
        <QuestionBankReaderModal
          isOpen={!!activeReadingBank}
          bank={activeReadingBank}
          examName={exams.find((e: any) => e.id === (activeReadingBank?.examId || selectedExam))?.name || 'Odisha Exam Prep'}
          onClose={() => setActiveReadingBank(null)}
          hasAccess={!activeReadingBank?.isPremium || hasAccessTo(activeReadingBank)}
          onUnlockRequired={() => {
            if (activeReadingBank) {
              setPaywallPrice(activeReadingBank?.price || 499);
              setPaywallOriginalPrice(activeReadingBank?.originalPrice || ((activeReadingBank?.price || 499) * 2));
              setPaywallItemTitle(activeReadingBank?.title || 'Premium Content');
              setPaywallItemId(activeReadingBank?.id);
              setPaywallProductType('question_bank');
              setShowPaywall(true);
            }
          }}
        />

        {/* Global Student PDF Export Quick Guide Modal */}
        <PdfExportGuideModal
          isOpen={!!pdfGuideItem}
          onClose={() => setPdfGuideItem(null)}
          onConfirm={() => {
            const item = pdfGuideItem;
            setPdfGuideItem(null);
            if (item) executeExportPdf(item);
          }}
          title={pdfGuideItem?.title}
        />
      </>,
      document.body
    );
  };

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState<'popular' | 'upcoming'>('upcoming');
  const [showPracticeConfig, setShowPracticeConfig] = useState<boolean>(false);
  const [selectedBankType, setSelectedBankType] = useState<string | null>(() => sessionStorage.getItem('oep_selectedBankType') || null);
  const [mobileExamTab, setMobileExamTab] = useState<'learn' | 'practice' | 'mock'>(() => {
    return (sessionStorage.getItem('oep_mobileExamTab') as 'learn' | 'practice' | 'mock') || 'practice';
  });

  useEffect(() => {
    sessionStorage.setItem('oep_mobileExamTab', mobileExamTab);
  }, [mobileExamTab]);

  // --- New Content mobile indicator tracking ---
  const [viewedCategories, setViewedCategories] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('oep_category_views');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const markCategoryAsViewed = useCallback((tabName: 'bank' | 'practice' | 'mock', categoryId: string) => {
    if (!selectedExam) return;
    const key = `${selectedExam}_${tabName}_${categoryId}`;
    const now = Date.now();
    setViewedCategories(prev => {
      const updated = { ...prev, [key]: now };
      try {
        localStorage.setItem('oep_category_views', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  }, [selectedExam]);

  // Observer hooks to automatically mark categories as read when they are viewed
  useEffect(() => {
    if (selectedBankType) {
      markCategoryAsViewed('bank', selectedBankType);
    }
  }, [selectedBankType, markCategoryAsViewed]);

  useEffect(() => {
    if (selectedPracticeCategory) {
      markCategoryAsViewed('practice', selectedPracticeCategory);
    }
  }, [selectedPracticeCategory, markCategoryAsViewed]);

  useEffect(() => {
    if (selectedMockCategory) {
      markCategoryAsViewed('mock', selectedMockCategory);
    }
  }, [selectedMockCategory, markCategoryAsViewed]);

  // Helper to determine if a specific category has new unread content
  const hasNewUnreadContent = useCallback((tabName: 'bank' | 'practice' | 'mock', categoryId: string): boolean => {
    if (!selectedExam) return false;
    const NEW_CONTENT_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const viewKey = `${selectedExam}_${tabName}_${categoryId}`;
    const lastViewTime = viewedCategories[viewKey] || 0;
    const now = Date.now();

    if (tabName === 'mock') {
      // For mock tests, check in-memory list
      const matched = mockTests.filter(mt => {
        if (mt.is_archived) return false;
        try {
          const cfg = JSON.parse(mt.seriesId);
          return cfg.examId === selectedExam && cfg.category === categoryId;
        } catch (e) {
          return false;
        }
      });
      return matched.some(mt => {
        const createTime = new Date(mt.created_at || mt.createdAt || 0).getTime();
        return (now - createTime < NEW_CONTENT_THRESHOLD_MS) && (lastViewTime < createTime);
      });
    } else {
      // For question bank or practice tests, check in-memory banks list
      const banks = (dynamicQuestionBanks[categoryId] || []).filter((b: any) => {
        if (b.is_archived) return false;
        return b.examId === selectedExam;
      });
      return banks.some(b => {
        const createTime = new Date(b.created_at || b.createdAt || 0).getTime();
        return (now - createTime < NEW_CONTENT_THRESHOLD_MS) && (lastViewTime < createTime);
      });
    }
  }, [selectedExam, viewedCategories, mockTests, dynamicQuestionBanks]);



  const [bankSearchQuery, setBankSearchQuery] = useState("");
  const [bankSortBy, setBankSortBy] = useState("Name");
  const [bankSortOpen, setBankSortOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paymentState, setPaymentState] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paywallPrice, setPaywallPrice] = useState(499);
  const [paywallOriginalPrice, setPaywallOriginalPrice] = useState(999);
  const [paywallItemTitle, setPaywallItemTitle] = useState('Full Access');
  const [paywallFeatures, setPaywallFeatures] = useState<string[]>([
    'Full Question Bank (2,500+ Qs)',
    'Unlimited Practice Mode',
    'Detailed Step-by-Step Solutions',
    'Advanced Performance Analytics'
  ]);
  const [paywallItemId, setPaywallItemId] = useState<string | null>(null);
  const [paywallProductType, setPaywallProductType] = useState<string>('full_access');
  const [loadingPractice, setLoadingPractice] = useState(false);

  // Hide WhatsApp button on mobile when any dashboard modal is open, lock body scroll, and apply background blur
  useEffect(() => {
    const isAnyModalOpen = !!(showPaywall || showLoginPrompt || showPracticeConfig || selectedBankItem || activeReadingBank || (infoModal && infoModal.isOpen));
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden'; // Lock html too to prevent swipe horizontal panning on mobile
      document.body.setAttribute('data-premium-blur', 'true');
      if (window.innerWidth < 768) {
        document.body.setAttribute('data-modal-open', 'true');
      }
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.removeAttribute('data-premium-blur');
      document.body.removeAttribute('data-modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.removeAttribute('data-premium-blur');
      document.body.removeAttribute('data-modal-open');
    };
  }, [showPaywall, showLoginPrompt, showPracticeConfig, selectedBankItem, activeReadingBank, infoModal]);
  const [topicMaxQuestions, setTopicMaxQuestions] = useState<number>(0);
  const [practiceSettings, setPracticeSettings] = useState(() => {
    const saved = sessionStorage.getItem('oep_practiceSettings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      examId: '',
      category: '',
      topic: '',
      questions: '20',
      timeLimit: '30'
    };
  });
  // handleSaveOnboarding removed


  useEffect(() => {
    if (selectedBankType) {
      sessionStorage.setItem('oep_selectedBankType', selectedBankType);
    } else {
      sessionStorage.removeItem('oep_selectedBankType');
    }
    scrollToTop({ behavior: 'instant' });
  }, [selectedBankType]);

  useEffect(() => {
    sessionStorage.setItem('oep_practiceSettings', JSON.stringify(practiceSettings));
  }, [practiceSettings]);

  useEffect(() => {
    if (selectedMockCategory) sessionStorage.setItem('oep_selectedMockCategory', selectedMockCategory);
    else sessionStorage.removeItem('oep_selectedMockCategory');
    setSelectedSectionalSubject('All');
  }, [selectedMockCategory]);

  useEffect(() => {
    if (selectedPracticeCategory) sessionStorage.setItem('oep_selectedPracticeCategory', selectedPracticeCategory);
    else sessionStorage.removeItem('oep_selectedPracticeCategory');
    setSelectedPracticeSubject('All');
  }, [selectedPracticeCategory]);
  const actualExams = useMemo(() => {
    return exams.filter(e => !e.is_archived && e.category !== 'blog' && e.category !== 'system' && !(e.name || '').startsWith('SYSTEM_SETTINGS_'));
  }, [exams]);

  useEffect(() => {
    const activeExamId = practiceSettings.examId || selectedExam;
    if (!practiceSettings.topic || !activeExamId) {
      setTopicMaxQuestions(0);
      return;
    }
    const fetchMaxQuestions = async () => {
      const topicBank = Object.values(dynamicQuestionBanks).flat().find((b: any) => b.id === practiceSettings.topic) as any;
      const bankTopicName = topicBank ? topicBank.title : practiceSettings.topic;

      let { data, error } = await supabase
        .from('questions')
        .select('topic')
        .eq('examId', activeExamId)
        .ilike('topic', bankTopicName)
        .limit(500);
        
      if (!error && (!data || data.length === 0)) {
        const fallbackRes = await supabase
          .from('questions')
          .select('topic')
          .eq('examId', activeExamId)
          .limit(500);
        if (!fallbackRes.error) {
          data = fallbackRes.data;
        }
      }

      let matchedQs = data || [];
      if (bankTopicName) {
        const normBank = bankTopicName.toLowerCase().replace(/[\s\-_—–:()]+/g, '').trim();
        matchedQs = matchedQs.filter((q: any) => {
           if (!q.topic) return false;
           const normQ = q.topic.toLowerCase().replace(/[\s\-_—–:()]+/g, '').trim();
           return normQ.includes(normBank) || normBank.includes(normQ);
        });
      }
      setTopicMaxQuestions(matchedQs.length);
      
      setPracticeSettings(prev => {
         const currentVal = Number(prev.questions) || 20;
         const safeVal = Math.min(currentVal, matchedQs.length);
         return { ...prev, questions: safeVal > 0 ? safeVal.toString() : '0' };
      });
    };
    fetchMaxQuestions();
  }, [practiceSettings.topic, practiceSettings.examId, selectedExam, dynamicQuestionBanks]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const hasValidCache = 
        _dashboardCache.hasFetchedThisSession && 
        _dashboardCache.loadedForUserId === (user?.id || 'guest') && 
        _dashboardCache.exams.length > 0 &&
        _dashboardCache.mockTests.length > 0 &&
        Object.keys(_dashboardCache.dynamicQuestionBanks).length > 0;

      if (hasValidCache) {
        setLoadingExams(false);
        setLoadingDashboardData(false);
        return;
      }

      setLoadingDashboardData(true);

      try {
        // Use allSettled so one failing table doesn't block everything else.
        // Use getAllMockTestsLite — metadata only, no question payloads.
        // This prevents large question responses from timing out and breaking the dashboard.
        const [examsResult, banksResult, seriesResult, testsResult] = await Promise.allSettled([
          examService.getAllExams(),
          examService.getAllQuestionBanks(),
          examService.getAllTestSeries(),
          examService.getAllMockTestsLite()
        ]);

        let fetchedExams   = examsResult.status   === 'fulfilled' ? examsResult.value   : [];
        const fetchedBanks   = banksResult.status   === 'fulfilled' ? banksResult.value   : [];
        const fetchedSeries  = seriesResult.status  === 'fulfilled' ? seriesResult.value  : [];
        const fetchedTests   = testsResult.status   === 'fulfilled' ? testsResult.value   : [];

        // Log any individual failures for debugging
        [examsResult, banksResult, seriesResult, testsResult].forEach((r, i) => {
          if (r.status === 'rejected') {
            console.error(`fetchDashboardData[${i}] failed:`, r.reason);
          }
        });

        // If exams returned empty, the JWT may be too large/stale.
        // Force a session refresh to get a fresh JWT, then retry.
        if (fetchedExams.length === 0) {
          try {
            const { supabase: sb } = await import('./lib/supabase');
            await sb.auth.refreshSession();
            await new Promise(r => setTimeout(r, 400)); // wait for auth to settle
          } catch (e) {
            console.warn('Session refresh before retry failed:', e);
          }
          const retry = await examService.getAllExams().catch(() => null);
          if (retry && retry.length > 0) {
            fetchedExams = retry;
            console.log('fetchDashboardData: retry after refresh succeeded,', retry.length, 'exams loaded');
          }
        }

        const finalExams = fetchedExams.length > 0
          ? fetchedExams
          : [{ id: 'opsc-aio', name: 'OPSC AIO', description: 'Odisha Public Service Commission All In One', icon: '🏛️', category: 'upcoming' }];

        // Group banks by type using practiceQuestionCount pre-computed by getAllQuestionBanks()
        const groupedBanks: Record<string, any[]> = {};
        fetchedBanks.forEach((bank: any) => {
          if (!groupedBanks[bank.type]) groupedBanks[bank.type] = [];
          let parsedTagline = { text: bank.tagline || '', price: 499, subject: '' };
          if (bank.tagline && typeof bank.tagline === 'string' && bank.tagline.trim().startsWith('{')) {
            try { 
              const parsed = JSON.parse(bank.tagline);
              if (parsed && typeof parsed === 'object') {
                parsedTagline = {
                  text: parsed.text !== undefined ? parsed.text : bank.tagline,
                  price: parsed.price || 499,
                  subject: parsed.subject || ''
                };
              }
            } catch(e) {}
          }

          const actualPracticeQs = bank.practiceQuestionCount || bank.questionCount || 0;
          const adminQuestionCount = bank.questionCount || bank.question_count || bank.questioncount || bank.questions || actualPracticeQs;

          groupedBanks[bank.type].push({
            id: bank.id,
            title: bank.title,
            target_mode: bank.target_mode || 'both',
            scheduled_at: bank.scheduled_at || null,
            questionCount: adminQuestionCount,
            questions: actualPracticeQs,
            practiceQuestionCount: actualPracticeQs,
            tagline: parsedTagline.text,
            price: parsedTagline.price || 499,
            image: bank.image,
            isPremium: bank.isPremium,
            examId: bank.examId,
            pdfUrl: bank.pdfUrl || '',
            pdfLinks: (() => {
              if (!bank.pdfUrl) return [];
              try {
                const parsed = JSON.parse(bank.pdfUrl);
                if (Array.isArray(parsed)) {
                  return parsed.filter((l: any) => l && typeof l.url === 'string' && (l.url.startsWith('http://') || l.url.startsWith('https://') || l.url.startsWith('/')));
                }
                if (parsed && typeof parsed === 'object') {
                  if (Array.isArray(parsed.pdfLinks)) {
                    return parsed.pdfLinks.filter((l: any) => l && typeof l.url === 'string' && (l.url.startsWith('http://') || l.url.startsWith('https://') || l.url.startsWith('/')));
                  }
                  return [];
                }
                if (typeof bank.pdfUrl === 'string' && (bank.pdfUrl.startsWith('http://') || bank.pdfUrl.startsWith('https://'))) {
                  return [{ title: 'Download Attached PDF', url: bank.pdfUrl }];
                }
                return [];
              } catch (e) {
                if (typeof bank.pdfUrl === 'string' && (bank.pdfUrl.startsWith('http://') || bank.pdfUrl.startsWith('https://'))) {
                  return [{ title: 'Download Attached PDF', url: bank.pdfUrl }];
                }
                return [];
              }
            })(),
            sortOrder: bank.sortOrder ?? bank.sort_order ?? null,
            hasPracticeMode: bank.hasPracticeMode,
            subject: parsedTagline.subject || '',
            is_archived: bank.is_archived || false
          });
        });

        // Sort banks within each category by sortOrder ascending
        Object.keys(groupedBanks).forEach((type) => {
          groupedBanks[type].sort((a: any, b: any) => {
            const orderA = a.sortOrder ?? 9999;
            const orderB = b.sortOrder ?? 9999;
            return orderA - orderB;
          });
        });

        const mockConfig = finalExams.find((e: any) => e.name === 'SYSTEM_SETTINGS_MOCK_TEST_CONFIG');
        let sortDirection: 'asc' | 'desc' = 'asc';
        if (mockConfig && mockConfig.description) {
          try {
            const parsed = JSON.parse(mockConfig.description);
            if (parsed.sortDirection) sortDirection = parsed.sortDirection;
          } catch (e) {}
        }

        const sortedTests = [...(fetchedTests || [])].sort((a, b) => {
          const orderA = a.sortOrder ?? 9999;
          const orderB = b.sortOrder ?? 9999;
          return sortDirection === 'desc' ? orderB - orderA : orderA - orderB;
        });

        // Write to module-level cache before updating state
        _dashboardCache.exams = finalExams;
        _dashboardCache.testSeries = fetchedSeries || [];
        _dashboardCache.mockTests = sortedTests;
        _dashboardCache.dynamicQuestionBanks = groupedBanks;
        _dashboardCache.loadedForUserId = user?.id || 'guest';
        _dashboardCache.hasFetchedThisSession = true;

        // Save to sessionStorage for persistent SWR caching across reloads
        try {
          sessionStorage.setItem('oep_cached_exams', JSON.stringify(finalExams));
          sessionStorage.setItem('oep_cached_testSeries', JSON.stringify(fetchedSeries || []));
          sessionStorage.setItem('oep_cached_mockTests', JSON.stringify(sortedTests));
          sessionStorage.setItem('oep_cached_dynamicQuestionBanks', JSON.stringify(groupedBanks));
          sessionStorage.setItem('oep_cached_loadedForUserId', user?.id || 'guest');
        } catch (e) {}

        // Update React state
        setExams(finalExams);
        setTestSeries(fetchedSeries || []);
        setMockTests(sortedTests);
        setDynamicQuestionBanks(groupedBanks);

        // Clean up activities in localStorage and state that belong to deleted exams/tests/banks (deferred to prevent main thread blocking)
        setTimeout(async () => {
          if (user?.id && finalExams.length > 1) {
            const activeExamNames = new Set(finalExams.map((e: any) => e.name));
            const activeMockTestIds = new Set(sortedTests.map((t: any) => t.id));
            const activeBankIds = new Set((fetchedBanks || []).map((b: any) => b.id));

            try {
              const localKey = `oep_activities_${user.id}`;
              const localActivitiesStr = localStorage.getItem(localKey);
              if (localActivitiesStr) {
                const localActivities = JSON.parse(localActivitiesStr);
                if (Array.isArray(localActivities)) {
                  const filtered = localActivities.filter((act: any) => {
                    if (!act) return false;

                    // 1. Filter out by examName (if deleted)
                    const actExamName = act.metadata?.examName;
                    if (actExamName && actExamName !== 'General' && !activeExamNames.has(actExamName)) {
                      return false;
                    }

                    // 2. Filter out by mockTestId (if deleted)
                    const testId = act.metadata?.test?.id;
                    if (testId && !testId.startsWith('practice-') && (act.type === 'mock_test_completed' || act.type === 'test_incomplete')) {
                      if (!activeMockTestIds.has(testId)) {
                        return false;
                      }
                    }

                    // 3. Filter out by bankId (if deleted)
                    const bankId = act.metadata?.bankId;
                    if (bankId && act.type === 'question_bank_accessed') {
                      if (!activeBankIds.has(bankId)) {
                        return false;
                      }
                    }

                    return true;
                  });

                  if (filtered.length !== localActivities.length) {
                    localStorage.setItem(localKey, JSON.stringify(filtered));
                    
                    // Sync updated activities to user cloud metadata
                    const cloudPayload = filtered.slice(0, 50).map((a: any) => {
                      try {
                        const m = a.metadata || {};
                        const lightMeta: any = {
                          examName: m.examName,
                          testCategory: m.testCategory,
                          bankType: m.bankType,
                          bankId: m.bankId,
                          resumeSessionId: m.resumeSessionId,
                        };
                        if (a.type === 'test_incomplete') {
                          lightMeta.currentQuestionIndex = m.currentQuestionIndex;
                          lightMeta.timeLeft = m.timeLeft;
                          if (m.test && typeof m.test === 'object') {
                            lightMeta.test = {
                              id: m.test.id,
                              title: m.test.title,
                              durationMinutes: m.test.durationMinutes,
                              _questionCount: m.test._questionCount || (Array.isArray(m.test.questions) ? m.test.questions.length : 0),
                            };
                          }
                          lightMeta.totalQuestions = m.totalQuestions || lightMeta.test?._questionCount || 0;
                        }
                        return { ...a, metadata: lightMeta };
                      } catch {
                        return { id: a.id, userId: a.userId, type: a.type, title: a.title, timestamp: a.timestamp, score: a.score, accuracy: a.accuracy };
                      }
                    });
                    await supabase.auth.updateUser({
                      data: { activities: cloudPayload },
                    });

                    if (onActivityLogged) onActivityLogged();
                  }
                }
              }
            } catch (e) {
              console.error("Error cleaning up local activities:", e);
            }
          }
        }, 4000);

      } catch (error) {
        console.error("Error fetching data:", error);
        // Even on total failure, show fallback so the grid is never empty
        if (_dashboardCache.exams.length === 0) {
          const fallback = [{ id: 'opsc-aio', name: 'OPSC AIO', description: 'Odisha Public Service Commission All In One', icon: '🏛️', category: 'upcoming' }];
          _dashboardCache.exams = fallback;
          setExams(fallback);
        }
      } finally {
        setLoadingExams(false);
        setLoadingDashboardData(false);
      }
    };
    fetchDashboardData();
  }, [user?.id]);

  const [examSearchQuery, setExamSearchQuery] = useState(() => {
    return (typeof window !== 'undefined' ? sessionStorage.getItem('oep_exam_search_query') : '') || '';
  });

  const filteredExams = exams.filter(exam => {
    if (exam.name && exam.name.startsWith('SYSTEM_SETTINGS_')) return false;
    if (exam.category === 'system' || exam.category === 'blog') return false;
    
    if (examSearchQuery) {
      const q = examSearchQuery.toLowerCase();
      const nameMatch = exam.name ? exam.name.toLowerCase().includes(q) : false;
      const descMatch = (exam.description && typeof exam.description === 'string') ? exam.description.toLowerCase().includes(q) : false;
      return nameMatch || descMatch;
    } else {
      return exam.category === activeTab;
    }
  });

  const sampleTest = {
    id: 'test-1',
    title: 'OPSC AIO Full Mock Test 01',
    durationMinutes: 60,
    isPremium: true,
    questions: [
      {
        id: 'q1',
        questionText: 'Which article of the Indian Constitution deals with the amendment procedure?',
        options: ['Article 352', 'Article 356', 'Article 360', 'Article 368'],
        correctAnswerIndex: 3,
        explanation: 'Article 368 of Part XX of the Constitution of India provides for two types of amendments.'
      },
      {
        id: 'q2',
        questionText: 'The Hirakud Dam is built across which river?',
        options: ['Ganga', 'Mahanadi', 'Godavari', 'Krishna'],
        correctAnswerIndex: 1,
        explanation: 'Hirakud Dam is built across the Mahanadi River, about 15 kilometres from Sambalpur in Odisha.'
      }
    ]
  };

  const allActivities = useMemo(() => activities || [], [activities, mainTab, activeTest]);

  const incompleteTests = useMemo(() => {
    if (!allActivities) return [];
    
    const incompletes = allActivities.filter(a => a.type === 'test_incomplete');
    
    // Filter out any where a completed test exists for the same session id, bank id, or topic title
    const completedSessionIds = new Set(
      allActivities.filter(a => a.type === 'mock_test_completed' || a.type === 'practice_test_completed').map(a => a.metadata?.resumeSessionId)
    );

    const completedBankIds = new Set(
      allActivities.filter(a => a.type === 'mock_test_completed' || a.type === 'practice_test_completed').map(a => a.metadata?.bankId || a.metadata?.test?.bankId || a.metadata?.test?.id)
    );

    const completedTitles = new Set(
      allActivities.filter(a => a.type === 'mock_test_completed' || a.type === 'practice_test_completed').map(a => (a.title || '').toLowerCase().replace(/(\s*-\s*Practice Session)+$/gi, '').trim())
    );
    
    // Deduplicate so we only show the LATEST incomplete state for a given topic/session
    const resumeMap = new Map();
    incompletes.forEach(a => {
       const sessionId = a.metadata?.resumeSessionId || a.metadata?.test?.id;
       const bankId = a.metadata?.bankId || a.metadata?.test?.bankId || a.metadata?.test?.id;
       const cleanTitle = (a.title || a.metadata?.test?.title || '').toLowerCase().replace(/(\s*-\s*Practice Session)+$/gi, '').trim();

       if (sessionId && completedSessionIds.has(sessionId)) return;
       if (bankId && completedBankIds.has(bankId)) return;
       if (cleanTitle && completedTitles.has(cleanTitle)) return;

       const dedupKey = bankId || cleanTitle || sessionId;
       if (dedupKey && !resumeMap.has(dedupKey)) {
          resumeMap.set(dedupKey, a);
       }
    });
    
    return Array.from(resumeMap.values()); // Since incompletes are newest-first, Map maintains newest first
  }, [allActivities]);

  const handleStartTest = async (test: any, resumeState?: any) => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    requestUniversalFullscreen();

    const actMeta = resumeState?.metadata || resumeState;
    const targetTest = actMeta?.test || test || {};
    const targetTestId = targetTest.id || test?.id || actMeta?.testId;

    // Prioritize explicitly passed examId
    let testExamId = targetTest.examId || targetTest._resolvedExamId || test?.examId || '';
    if (!testExamId && (targetTest.seriesId || test?.seriesId)) {
      try { testExamId = JSON.parse(targetTest.seriesId || test?.seriesId).examId || ''; } catch(e){}
    }

    if (targetTest.isPremium && !hasAccessTo(targetTest, testExamId)) {
      setPaywallPrice(targetTest.price || 499);
      setPaywallOriginalPrice(targetTest.originalPrice || ((targetTest.price || 499) * 2));
      setPaywallItemTitle(targetTest.title || 'Premium Test');
      setPaywallFeatures([
        `${targetTest.durationMinutes || 60} Minutes Duration`,
        `${targetTest.totalMarks || 100} Total Marks`,
        `Detailed Step-by-Step Solutions`,
        `Advanced Performance Analytics`
      ]);
      setPaywallItemId(targetTest.id);
      setPaywallProductType('mock_test');
      setShowPaywall(true);
      return;
    }

    try {
      let finalTest = { ...targetTest };

      // Ensure questions are populated before starting/resuming test
      if (!finalTest.questions || finalTest.questions.length === 0) {
        if (targetTestId && !targetTestId.startsWith('practice-')) {
          try {
            const fetchedQs = await examService.getQuestionsForMockTest(targetTestId);
            if (fetchedQs && fetchedQs.length > 0) {
              finalTest.questions = fetchedQs;
              finalTest.questionCount = fetchedQs.length;
              finalTest.totalQuestions = fetchedQs.length;
              finalTest.totalMarks = finalTest.totalMarks || fetchedQs.length;
            }
          } catch (e) {
            console.error("Failed to load questions for mock test:", e);
          }
        }

        // If still no questions (or if it's a practice session):
        if (!finalTest.questions || finalTest.questions.length === 0) {
          const rawTitle = finalTest.title || test?.title || actMeta?.title || '';
          const cleanTopic = rawTitle.replace(/(\s*-\s*Practice Session)+$/gi, '').trim() || 'General';
          const targetCount = finalTest.totalQuestions || finalTest.practiceQuestionCount || finalTest._questionCount || actMeta?.totalQuestions || 20;

          // Check if matching topic bank exists in dynamicQuestionBanks
          const flatBanks = Object.values(dynamicQuestionBanks || {}).flat() as any[];
          const topicBank = flatBanks.find(b => b.id === finalTest.bankId || (b.title && b.title.toLowerCase().includes(cleanTopic.toLowerCase())) || (b.name && b.name.toLowerCase().includes(cleanTopic.toLowerCase())));

          if (topicBank && Array.isArray(topicBank.questions) && topicBank.questions.length > 0) {
            finalTest.questions = topicBank.questions.slice(0, targetCount);
          } else {
            const instantQs = getInstantQuestionsForTopic(cleanTopic, targetCount);
            finalTest.questions = instantQs.map(q => ({
              id: q.id,
              questionText: q.questionText,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex,
              explanation: q.explanation || 'No explanation provided.'
            }));
          }
          finalTest.totalQuestions = finalTest.questions.length;
          finalTest.totalMarks = finalTest.totalMarks || finalTest.questions.length;
        }
      }

      // Immediately set active test & state synchronously
      if (actMeta && (actMeta.isStarted || actMeta.answers || actMeta.answersById || actMeta.currentQuestionIndex !== undefined)) {
        setActiveTestState({
          ...actMeta,
          isStarted: true
        });
        setActiveTest({
          ...finalTest,
          durationMinutes: finalTest.durationMinutes || 60,
        });
      } else {
        if (isGuest) incrementGuestUsage('tests');
        setActiveTestState({ resumeSessionId: `session-${Date.now()}` });
        setActiveTest({
          ...finalTest,
          durationMinutes: finalTest.durationMinutes || 60,
        });
      }
    } catch (error) {
      console.error(error);
      alert('Failed to start test.');
    }
  };

  const handleStartDynamicPractice = async () => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }
    setLoadingPractice(true);
    try {
      const flatBanks = Object.values(dynamicQuestionBanks).flat() as any[];
      const topicBank = flatBanks.find(b => b.id === practiceSettings.topic);

      // Determine the correct examId to query — prefer selectedExam, fall back to the bank's own examId
      const effectiveExamId = selectedExam || topicBank?.examId || practiceSettings.examId;

      // Access check: if the bank is premium, verify the user has purchased it OR has purchased
      // the exam bundle it belongs to. This ensures any new banks added to an exam the user already
      // purchased are automatically unlocked for that user.
      if (topicBank?.isPremium && !hasAccessTo(topicBank)) {
        setPaywallPrice(topicBank.price || 499);
        setPaywallOriginalPrice(topicBank.originalPrice || ((topicBank.price || 499) * 2));
        setPaywallItemTitle(topicBank.title || 'Premium Bank');
        setPaywallFeatures([
          `${topicBank.questions || topicBank.questionCount || topicBank.question_count || topicBank.questioncount || 500}+ Premium Questions`,
          topicBank.hasPracticeMode !== false ? 'Unlimited Practice Mode' : 'Instant PDF Access',
          'Detailed Step-by-Step Solutions',
          'Advanced Performance Analytics'
        ]);
        setPaywallItemId(topicBank.id);
        setPaywallProductType('question_bank');
        setShowPaywall(true);
        setLoadingPractice(false);
        return;
      }
      const bankTopicName = topicBank ? topicBank.title : practiceSettings.topic;

      if (!effectiveExamId) {
        alert("Could not determine which exam to load questions from. Please try opening Practice Mode from the exam page directly.");
        setLoadingPractice(false);
        return;
      }

      const reqCount = Number(practiceSettings.questions) || 20;
      const fetchLimit = Math.max(reqCount * 5, 100);

      let { data, error } = await supabase
        .from('questions')
        .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
        .eq('examId', effectiveExamId)
        .ilike('topic', bankTopicName)
        .limit(fetchLimit);

      if (!error && (!data || data.length === 0)) {
        const fallbackRes = await supabase
          .from('questions')
          .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
          .eq('examId', effectiveExamId)
          .limit(Math.max(reqCount * 10, 300));
        if (!fallbackRes.error) {
          data = fallbackRes.data;
          error = null;
        }
      }
      if (error) throw error;
      
      let matchedQs = data || [];
      if (bankTopicName) {
        const normBank = bankTopicName.toLowerCase().replace(/[\s\-_—–:()]+/g, '').trim();
        matchedQs = matchedQs.filter((q: any) => {
           if (!q.topic) return false;
           const normQ = q.topic.toLowerCase().replace(/[\s\-_—–:()]+/g, '').trim();
           return normQ.includes(normBank) || normBank.includes(normQ);
        });
      }
      
      if (matchedQs.length === 0) {
        showPremiumAlert(
          "No Questions Found",
          "No questions have been configured for this exam yet. If you are an administrator, please upload questions in the Admin Panel."
        );
        setLoadingPractice(false);
        return;
      }

      const limit = Number(practiceSettings.questions) || matchedQs.length;
      const duration = Number(practiceSettings.timeLimit) || 30;
      const shuffled = matchedQs.sort(() => 0.5 - Math.random());
      const finalQuestions = shuffled.slice(0, limit);

      const practiceTest = {
        id: `practice-${Date.now()}`,
        bankId: topicBank?.id,
        title: `${bankTopicName} - Practice Session`,
        durationMinutes: duration,
        // Access was already verified above — mark as non-premium here so
        // handleStartTest does NOT show the paywall a second time for this session.
        isPremium: false,
        examId: topicBank?.examId || effectiveExamId,
        questions: finalQuestions.map(q => {
          const item: any = {
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            explanation: q.explanation || 'No explanation provided.'
          };
          if (q.diagram !== undefined && q.diagram !== null) {
            item.diagram = q.diagram;
          }
          return item;
        })
      };

      setActiveTestState({ resumeSessionId: `session-${Date.now()}` });
      handleStartTest(practiceTest);
    } catch (err) {
      console.error(err);
      alert("Failed to compile practice session.");
    } finally {
      setLoadingPractice(false);
    }
  };

  const handleStartDirectPractice = async (topicBankInput: any, resumeState?: any) => {
    if (isGuest) {
      setShowLoginPrompt(true);
      return;
    }

    requestUniversalFullscreen();

    const topicBank = typeof topicBankInput === 'string'
      ? { id: `practice-${Date.now()}`, title: topicBankInput, name: topicBankInput }
      : topicBankInput || { id: `practice-${Date.now()}`, title: 'General Practice', name: 'General Practice' };

    const actMeta = resumeState?.metadata || resumeState;
    if (actMeta && (actMeta.isStarted || actMeta.answers || actMeta.currentQuestionIndex !== undefined)) {
      const resumeTest = actMeta.test || topicBank;
      if (resumeTest && Array.isArray(resumeTest.questions) && resumeTest.questions.length > 0) {
        if (resumeTest.title) {
          const cleanT = resumeTest.title.replace(/(\s*-\s*Practice Session)+$/gi, '').trim();
          resumeTest.title = `${cleanT} - Practice Session`;
        }
        handleStartTest(resumeTest, { ...actMeta, isStarted: true });
        return;
      }
    }

    setLoadingPractice(true);
    try {
      const effectiveExamId = selectedExam || topicBank?.examId || (exams && exams.length > 0 ? exams[0].id : 'osssc-nursing-2026') || 'default-exam';

      let isPrem = topicBank?.isPremium ?? false;
      let bPrice = topicBank?.price || 499;
      let bOrigPrice = topicBank?.originalPrice || 999;
      if (topicBank?.tagline && typeof topicBank.tagline === 'string' && topicBank.tagline.startsWith('{')) {
        try {
          const parsed = JSON.parse(topicBank.tagline);
          if (parsed.isPremium !== undefined) isPrem = Boolean(parsed.isPremium);
          if (parsed.price !== undefined) bPrice = Number(parsed.price);
          if (parsed.originalPrice !== undefined) bOrigPrice = Number(parsed.originalPrice);
        } catch(e) {}
      }
      const effectiveTopicBank = { ...topicBank, isPremium: isPrem, price: bPrice, originalPrice: bOrigPrice };

      if (isPrem && !hasAccessTo(effectiveTopicBank, effectiveExamId)) {
        setPaywallPrice(bPrice);
        setPaywallOriginalPrice(bOrigPrice);
        setPaywallItemTitle(topicBank.title || 'Premium Practice Set');
        setPaywallFeatures([
          `${topicBank.questions || topicBank.questionCount || topicBank.question_count || 500}+ Premium Questions`,
          topicBank.hasPracticeMode !== false ? 'Unlimited Practice Mode' : 'Instant PDF Access',
          'Detailed Step-by-Step Solutions',
          'Advanced Performance Analytics'
        ]);
        setPaywallItemId(topicBank.id);
        setPaywallProductType('question_bank');
        setShowPaywall(true);
        setLoadingPractice(false);
        return;
      }
      const rawBankTopic = topicBank.title || topicBank.name || '';
      const bankTopicName = rawBankTopic.replace(/(\s*-\s*Practice Session)+$/gi, '').trim();

      // Consistently calculate question count & duration to match card display
      const actualQs = topicBank.practiceQuestionCount || topicBank.actualQuestionCount || 0;
      const adminQs = topicBank.questionCount || topicBank.question_count || topicBank.questioncount || 0;
      const targetCount = actualQs > 0 
        ? actualQs 
        : (adminQs > 0 ? adminQs : (Array.isArray(topicBank.questions) ? topicBank.questions.length : (topicBank.totalQuestions || 20)));

      const targetDuration = topicBank.estimatedMinutes || topicBank.durationMinutes || topicBank.duration || targetCount;

      let finalQuestions: any[] = [];

      if (Array.isArray(topicBank?.questions) && topicBank.questions.length >= targetCount) {
        finalQuestions = topicBank.questions.slice(0, targetCount);
      } else {
        // Fast instant question retrieval (<10ms) with exact target question count
        const instantQs = getInstantQuestionsForTopic(bankTopicName, targetCount);
        finalQuestions = instantQs.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          correctAnswerIndex: q.correctAnswerIndex,
          explanation: q.explanation
        }));
      }

      const practiceTest = {
        id: `practice-${Date.now()}`,
        bankId: topicBank.id || `bank-${Date.now()}`,
        title: topicBank.title || `${bankTopicName} - Practice Session`,
        durationMinutes: targetDuration,
        totalMarks: finalQuestions.length,
        totalQuestions: finalQuestions.length,
        questions: finalQuestions,
        isPracticeMode: true,
        isPremium: false,
        examId: topicBank?.examId || effectiveExamId
      };

      setActiveTestState({ resumeSessionId: `session-${Date.now()}` });
      handleStartTest(practiceTest);
      setLoadingPractice(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to compile practice session.");
    } finally {
      setLoadingPractice(false);
    }
  };

  const handlePayment = async (test: any) => {
    try {
      const res = await loadRazorpay();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      const price = test.price || 499;
      const orderRes = await fetch('/api/payment/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: test.id,
          productType: 'mock_test',
          userId: profile?.uid || user?.id || 'unknown',
          currency: 'INR'
        })
      });

      let orderData;
      const orderText = await orderRes.text();
      try {
        orderData = orderText ? JSON.parse(orderText) : {};
      } catch (e) {
        throw new Error(`Invalid response from server. Status: ${orderRes.status}. If you just updated the server, please restart the dev server (npm run dev).`);
      }

      if (!orderRes.ok) {
        throw new Error(orderData.message || `Failed to create payment order (status ${orderRes.status}).`);
      }

      if (!orderData.orderId) {
        throw new Error('Server did not return a valid order ID. Please verify your Razorpay API key configurations in .env and restart your dev server.');
      }

      // Track pending payment state in localStorage (essential for auto-recovery on page reloads/switches)
      localStorage.setItem('oep_pending_payment', JSON.stringify({
        orderId: orderData.orderId,
        productId: test.id,
        timestamp: Date.now()
      }));

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_StcJAJY1MgRGmJ',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'OdishaExamPrep',
        description: `Purchase ${test.title}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                userId: profile?.uid || user?.id,
                productId: test.id,
                productType: 'mock_test',
                pricePaid: price,
                snapshot: test
              })
            });

            let verifyData;
            const verifyText = await verifyRes.text();
            try {
              verifyData = verifyText ? JSON.parse(verifyText) : {};
            } catch (e) {
              throw new Error(`Invalid verification response from server. Status: ${verifyRes.status}`);
            }

            if (!verifyRes.ok) {
              throw new Error(verifyData.message || 'Payment verification failed.');
            }
            if (verifyData.success) {
              await unlockItem(test.id);
              alert('Payment Successful and Verified! Course unlocked.');
            } else {
              alert('Payment verification failed. Please contact support.');
            }
          } catch (err: any) {
            console.error('Verification error:', err);
            alert('Error verifying payment: ' + err.message);
          }
        },
        prefill: {
          name: profile?.displayName || '',
          email: profile?.email || ''
        },
        theme: {
          color: '#4f46e5'
        },
        modal: {
          ondismiss: function () {
            console.log('Payment checkout closed');
            localStorage.removeItem('oep_pending_payment');
          }
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (err: any) {
      console.error('Payment initialization failed:', err);
      alert('Payment initialization failed: ' + err.message);
    }
  };

  useEffect(() => {
    const onLaunchTestEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const test = customEvent.detail;
      if (test) {
        const examId = test.examId || test._resolvedExamId;
        handleStartTest({ ...test, type: 'mock_test', examId, examName: exams.find(ex => ex.id === examId)?.name });
      }
    };

    const onLaunchBankEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const bank = customEvent.detail;
      if (bank) {
        setSelectedBankItem(bank);
      }
    };

    const onViewExamEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const examId = customEvent.detail;
      if (examId) {
        setSelectedExam(examId);
      }
    };

    const onLaunchTopicDrillEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const topicName = customEvent.detail || 'Practice Session';
      const effectiveExamId = selectedExam || exams[0]?.id || 'osssc-nursing-2026';

      // Check for saved incomplete session for this topic
      const userActivities = activityTracker.getActivities(user?.id);
      const incompleteActivity = userActivities.find(act => 
        act.type === 'test_incomplete' && 
        act.title && 
        (act.title.toLowerCase().includes(topicName.toLowerCase()) || topicName.toLowerCase().includes(act.title.toLowerCase()))
      );

      if (incompleteActivity && incompleteActivity.metadata) {
        toast.success(`Resuming test session for ${topicName}...`, {
          icon: '⏱️',
          duration: 3000
        });
        const resumeTest = incompleteActivity.metadata.test || {
          id: `bank-topic-${Date.now()}`,
          title: `${topicName} - Practice Session`,
          examId: effectiveExamId,
          isPremium: false
        };
        handleStartDirectPractice(resumeTest, incompleteActivity.metadata);
      } else {
        toast.success(`Compiling practice drill for ${topicName}...`, {
          icon: '⚡',
          duration: 3000
        });
        handleStartDirectPractice({
          id: `bank-topic-${Date.now()}`,
          title: topicName,
          examId: effectiveExamId,
          isPremium: false
        });
      }
    };

    window.addEventListener('oep-launch-mock-test', onLaunchTestEvent);
    window.addEventListener('oep-launch-bank', onLaunchBankEvent);
    window.addEventListener('oep-view-exam', onViewExamEvent);
    window.addEventListener('oep-launch-topic-drill', onLaunchTopicDrillEvent);

    return () => {
      window.removeEventListener('oep-launch-mock-test', onLaunchTestEvent);
      window.removeEventListener('oep-launch-bank', onLaunchBankEvent);
      window.removeEventListener('oep-view-exam', onViewExamEvent);
      window.removeEventListener('oep-launch-topic-drill', onLaunchTopicDrillEvent);
    };
  }, [exams]);

  if (showAdmin) {
    return (
      <React.Suspense fallback={<LoadingPortal />}>
        <AdminPanel onClose={() => setShowAdmin(false)} />
      </React.Suspense>
    );
  }

  if (testResults) {
    // Find previous result for comparison
    const previousResult = activities
      .filter(a => a.type === 'mock_test_completed' && a.title === (testResults.test?.title || testResults.title))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]; // Most recent from history

    if (typeof document === 'undefined') return null;
    return createPortal(
      <React.Suspense fallback={<LoadingPortal />}>
        <TestResultsView results={testResults} previousResult={previousResult} onClose={() => setTestResults(null)} />
      </React.Suspense>,
      document.body
    );
  }

  if (activeTest) {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <ErrorBoundary>
      <React.Suspense fallback={<LoadingPortal />}>
        <MockTestSystem 
          test={activeTest} 
          mode={activeTest?.id?.startsWith('practice-') ? 'practice' : 'mock'}
          initialState={activeTestState}
          onExit={(progressState) => {
            sessionStorage.removeItem('oep_activeTestState');
            const test = activeTest;
            setActiveTest(null);
            setActiveTestState(null);
            // Log as incomplete whenever the user exits a test — even if they answered 0 questions.
            // "progressState.test" confirms the user actually entered the test (not a spurious exit).
            if (progressState && progressState.test && test) {
              const currentExamName = exams.find(e => e.id === selectedExam)?.name || 'General';
              
              let testCategory = 'Mock Test';
              if (test.id.startsWith('practice-')) {
                testCategory = 'Practice Test';
              } else if (selectedMockCategory) {
                const categories: Record<string, string> = {
                  'full-length': 'Full-Length Mock Test',
                  'sectional': 'Sectional Test',
                  'pyq': 'PYQ Test',
                  'daily': 'Daily / Weekly Test'
                };
                testCategory = categories[selectedMockCategory] || 'Mock Test';
              }

              activityTracker.logActivity(user?.id, {
                type: 'test_incomplete',
                title: test.title,
                metadata: {
                  ...progressState,
                  resumeSessionId: activeTestState?.resumeSessionId || `session-${Date.now()}`,
                  examId: selectedExam,
                  examName: currentExamName,
                  testCategory
                }
              });
              if (onActivityLogged) onActivityLogged();
            }
          }} 
          onComplete={(results) => {
            sessionStorage.removeItem('oep_activeTestState');
            scrollToTop({ behavior: 'instant' });
            const test = activeTest;
            setActiveTest(null);
            setTestResults(results);
            if (test) {
              const currentExamName = exams.find(e => e.id === selectedExam)?.name || 'General';
              
              let testCategory = 'Mock Test';
              if (test.id.startsWith('practice-')) {
                testCategory = 'Practice Test';
              } else if (selectedMockCategory) {
                const categories: Record<string, string> = {
                  'full-length': 'Full-Length Mock Test',
                  'sectional': 'Sectional Test',
                  'pyq': 'PYQ Test',
                  'daily': 'Daily / Weekly Test'
                };
                testCategory = categories[selectedMockCategory] || 'Mock Test';
              }

              activityTracker.logActivity(user?.id, {
                type: 'mock_test_completed',
                title: test.title,
                score: results.score,
                totalMarks: results.totalMarks || results.total,
                accuracy: results.accuracy || 0,
                correct: results.correctCount,
                incorrect: results.incorrectCount,
                metadata: {
                  ...results,
                  resumeSessionId: activeTestState?.resumeSessionId,
                  examId: selectedExam,
                  examName: currentExamName,
                  testCategory: testCategory
                }
              });
              if (onActivityLogged) onActivityLogged();
            }
          }} 
        />
      </React.Suspense>
      </ErrorBoundary>,
      document.body
    );
  }

  const renderActiveTabContent = () => {
    if (mainTab === 'courses') {
      return (
        <StudyPlanView
          user={user}
          onNavigate={onNavigate}
          onLaunchTopicPractice={(topic) => handleStartDirectPractice(topic)}
        />
      );
    }

  if (mainTab === 'analytics') {
    return <AnalyticsView user={user} activities={activities} onNavigate={onNavigate} />;
  }

  if (mainTab === 'history') {
    return (
      <HistoryView 
        user={user} 
        onViewResults={handleViewResults} 
        onResumeTest={(test, state) => {
          handleStartTest(test, state);
        }} 
        onActivityDeleted={onActivityLogged} 
        onNavigate={onNavigate} 
      />
    );
  }

  if (mainTab === 'library') {
    return (
      <>
        <PurchasesView 
          user={user} 
          profile={profile}
          exams={exams.filter(e => e.category !== 'blog' && e.category !== 'system' && !(e.name || '').startsWith('SYSTEM_SETTINGS_'))}
          mockTests={mockTests}
          testSeries={testSeries}
          dynamicQuestionBanks={dynamicQuestionBanks}
          hasAccessTo={hasAccessTo}
          loadingExams={loadingExams}
          onLaunchMockTest={(test: any) => {
             // Pass it to handleStartTest to ensure questions are loaded from DB before starting
             const examId = test.examId || test._resolvedExamId;
             handleStartTest({ ...test, type: 'mock_test', examId, examName: exams.find(e => e.id === examId)?.name });
          }}
          onLaunchBank={(bank: any) => {
             setSelectedBankItem(bank);
          }}
          onViewExam={(examId: string | null) => {
             setSelectedExam(examId);
             if (onNavigate) onNavigate('home');
          }}
        />
        {renderCommonModals()}
      </>
    );
  }

    if (mainTab === 'ai_mentor') {
      return null;
    }

  if (!selectedExam) {
    let globalVideoIds: string[] | null = exams.length === 0 ? null : [];
    
    const sysSettings = exams.find(e => e.name === 'SYSTEM_SETTINGS_YOUTUBE_RESERVED');
    if (sysSettings && sysSettings.description) {
       try {
         const parsed = JSON.parse(sysSettings.description);
         if (parsed.videos && parsed.videos.length > 0) globalVideoIds = parsed.videos;
       } catch(e) {}
    }

    return (
      <div className="relative w-full">
        <div className="w-full max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 space-y-4 sm:space-y-10 pt-2 sm:pt-4 pb-4 sm:pb-8 relative z-10">
          <YouTubeCarousel videoIds={globalVideoIds} />
        
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div 
              onClick={() => navigate('/admin')}
              className="p-5 sm:p-8 soft-card bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200/80 dark:border-slate-800 shadow-xl cursor-pointer group relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] premium-shine-container"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-purple-600/10 dark:from-brand-600/20 dark:to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <VisualEffects />
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-[100px] group-hover:scale-150 transition-all duration-1000" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-brand-600 dark:bg-white/20 rounded-[1.75rem] flex items-center justify-center backdrop-blur-xl">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Admin Control Center</h3>
                    <p className="text-slate-600 dark:text-brand-100 font-bold opacity-90 text-sm sm:text-base">Manage all system content & users</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-brand-200 dark:border-slate-700 backdrop-blur-xl group-hover:bg-brand-600 group-hover:text-white transition-all duration-300 shadow-md shrink-0">
                  Open Dashboard
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Continue Practice (horizontal snap-scroll slider) ── */}
        {!isGuest && incompleteTests.length > 0 && (
          <div className="space-y-2 sm:space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{t('common.activity.continuePractice', 'Continue Practice')}</h2>
                <p className="text-[10.5px] text-slate-400 font-medium mt-0.5 sm:hidden">{t('common.activity.testHistoryGlance', 'Pick up where you left off')}</p>
              </div>
              <button
                onClick={() => onNavigate?.('history')}
                className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors shrink-0 ml-2"
              >
                {t('common.activity.viewAll', 'View All')}
              </button>
            </div>

            {/* Horizontal snap-scroll — bleeds to screen edges on mobile */}
            <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 group/scroll">
              {/* Left Scroll Button */}
              <button 
                type="button"
                onClick={() => scrollContinuePractice('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-brand-600 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 z-20 opacity-0 group-hover/scroll:opacity-100 hover:scale-105 active:scale-95 hidden md:flex"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Right Scroll Button */}
              <button 
                type="button"
                onClick={() => scrollContinuePractice('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-brand-600 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 z-20 opacity-0 group-hover/scroll:opacity-100 hover:scale-105 active:scale-95 hidden md:flex"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div 
                ref={continuePracticeRef}
                onWheel={(e) => {
                  const container = e.currentTarget;
                  const isAtRightEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
                  const isAtLeftEnd = container.scrollLeft <= 2;
                  if ((e.deltaY > 0 && !isAtRightEnd) || (e.deltaY < 0 && !isAtLeftEnd)) {
                    container.scrollLeft += e.deltaY * 0.85;
                  }
                }}
                className="flex gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory py-2.5 sm:py-4 px-1 sm:px-1"
              >
                {incompleteTests.slice(0, 6).map((a: any, i: number) => {
                  // Support both full-question activities (local) and lite cloud-synced ones
                  const answeredCount = (() => {
                    try {
                      if (a.metadata?.answers && typeof a.metadata.answers === 'object') {
                        const k = Object.keys(a.metadata.answers).length;
                        if (k > 0) return k;
                      }
                      if (typeof a.metadata?.currentQuestionIndex === 'number' && a.metadata.currentQuestionIndex > 0) {
                        return a.metadata.currentQuestionIndex;
                      }
                      return 0;
                    } catch { return 0; }
                  })();
                  const totalCount =
                    a.metadata?.totalQuestions ||
                    a.metadata?.test?.questions?.length ||
                    a.metadata?.test?._questionCount ||
                    1;
                  const progressPct = Math.min(100, Math.round((answeredCount / totalCount) * 100));
                  const timeAgo = (() => {
                    try {
                      const diff = Date.now() - new Date(a.timestamp).getTime();
                      const days = Math.floor(diff / 86400000);
                      const hours = Math.floor(diff / 3600000);
                      const mins = Math.floor(diff / 60000);
                      if (days > 1) return t('common.activity.daysAgo', `${days} days ago`, { days: isOdia ? toOdiaDigits(days) : days });
                      if (days === 1) return t('common.activity.dayAgo', '1 day ago');
                      if (hours > 0) return t('common.activity.hoursAgo', `${hours}h ago`, { hours: isOdia ? toOdiaDigits(hours) : hours });
                      if (mins > 0) return t('common.activity.minsAgo', `${mins}m ago`, { mins: isOdia ? toOdiaDigits(mins) : mins });
                      return t('common.activity.justNow', 'recently');
                    } catch { return t('common.activity.justNow', 'recently'); }
                  })();

                  // Can resume locally or across devices if test ID or title is present
                  const canResume = !!(
                    a.metadata?.test?.id ||
                    a.metadata?.test?.title ||
                    a.title ||
                    (Array.isArray(a.metadata?.test?.questions) && a.metadata.test.questions.length > 0)
                  );

                  return (
                    <DynamicVectorCard key={i} glowColor="rgba(37, 99, 235, 0.28)" roundedClass="rounded-2xl" className="snap-start shrink-0 w-[66vw] xs:w-[250px] sm:w-[280px] lg:w-[320px]">
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: i * 0.06 }}
                        whileTap={whileTap.press}
                        onClick={async () => {
                          if (!canResume) return;
                          requestUniversalFullscreen();
                          
                          let testToResume = { ...a.metadata?.test };
                          if (!testToResume.title && a.title) {
                            testToResume.title = a.title;
                          }
                          if (!testToResume.id && a.metadata?.testId) {
                            testToResume.id = a.metadata.testId;
                          }
                          handleStartTest(testToResume, a);
                        }}
                        className={`w-full h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0A1628] hover:border-brand-300 dark:hover:border-brand-500/50 shadow-md dark:shadow-xl dark:shadow-slate-950/40 transition-all duration-300 group p-3.5 sm:p-5 flex flex-col gap-2.5 premium-shine-container relative overflow-hidden ${
                          canResume ? 'cursor-pointer active:scale-[0.98]' : 'opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {/* Inner Vector Grid Overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-[0.04] pointer-events-none z-0" />
                        {/* Top row: icon + text */}
                        <div className="flex items-center gap-2.5 sm:gap-3 relative z-10">
                          {/* Play icon with brand gradient */}
                          <div className="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-xs shadow-brand-500/20 group-hover:scale-105 transition-transform duration-300">
                            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white fill-white ml-0.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-extrabold text-[12.5px] sm:text-sm text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors duration-300">{a.title || t('common.activity.continuePractice', 'Practice Session')}</h4>
                            <p className="text-[9.5px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{t('common.activity.lastPracticed', 'Last practiced {time}', { time: timeAgo })}</p>
                            {a.metadata?.testCategory && (
                              <span className="inline-block mt-0.5 text-[8px] sm:text-[8.5px] font-black uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50/70 dark:bg-brand-950/50 border border-brand-100/40 dark:border-brand-800/50 px-1.5 py-0.5 rounded">{a.metadata.testCategory}</span>
                            )}
                            {!canResume && (
                              <span className="block text-[8px] sm:text-[8.5px] font-bold text-slate-400 mt-0.5">{t('common.activity.openAppToResume', 'Open app to resume')}</span>
                            )}
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="flex flex-col gap-0.5 relative z-10 pt-0.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[8px] sm:text-[8.5px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('common.activity.progress', 'Progress')}</span>
                            <span className="text-[9.5px] sm:text-[10.5px] font-black text-brand-600">{isOdia ? toOdiaDigits(progressPct) : progressPct}%</span>
                          </div>
                          <div className="w-full h-1 sm:h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
                              style={{ width: `${Math.max(progressPct, progressPct === 0 ? 0 : 4)}%` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    </DynamicVectorCard>
                  );
                })}
              </div>
            </div>
            {incompleteTests.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-0.5 sm:hidden pointer-events-none px-4">
                <div className="h-[1px] flex-1 bg-slate-200/60" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('common.activity.swipeToExplore', 'Swipe to explore')}</span>
                <div className="h-[1px] flex-1 bg-slate-200/60" />
              </div>
            )}
          </div>
        )}

        {/* ── Recent Activity (completed tests & other) ── */}
        {!isGuest && activities.filter((a: any) => a.type !== 'test_incomplete').length > 0 && (
          <div className="space-y-2 sm:space-y-4">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">{t('common.activity.recentActivity', 'Recent Activity')}</h2>
                <p className="text-[10.5px] text-slate-400 font-medium mt-0.5 sm:hidden">{t('common.activity.testHistoryGlance', 'Your test history at a glance')}</p>
              </div>
              <button
                onClick={() => onNavigate?.('history')}
                className="text-xs sm:text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors shrink-0 ml-2"
              >
                {t('common.activity.viewAll', 'View All')}
              </button>
            </div>

            {/* Horizontal snap-scroll slider — bleeds to screen edges on mobile */}
            <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0 group/scroll-recent">
              {/* Left Scroll Button */}
              <button 
                type="button"
                onClick={() => scrollRecentActivity('left')}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-brand-600 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 z-20 opacity-0 group-hover/scroll-recent:opacity-100 hover:scale-105 active:scale-95 hidden md:flex"
                title="Scroll Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {/* Right Scroll Button */}
              <button 
                type="button"
                onClick={() => scrollRecentActivity('right')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-brand-600 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 z-20 opacity-0 group-hover/scroll-recent:opacity-100 hover:scale-105 active:scale-95 hidden md:flex"
                title="Scroll Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div 
                ref={recentActivityRef}
                onWheel={(e) => {
                  const container = e.currentTarget;
                  const isAtRightEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
                  const isAtLeftEnd = container.scrollLeft <= 2;
                  if ((e.deltaY > 0 && !isAtRightEnd) || (e.deltaY < 0 && !isAtLeftEnd)) {
                    container.scrollLeft += e.deltaY * 0.85;
                  }
                }}
                className="flex gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory py-2.5 sm:py-4 px-1 sm:px-1"
              >
                {activities.filter((a: any) => a.type !== 'test_incomplete').slice(0, 6).map((a: any, i: number) => {
                  const isTestResult = a.type === 'mock_test_completed' || a.type === 'practice_test_completed';
                  const rawScore = a.metadata?.score ?? a.score;
                  const rawTotal = a.metadata?.totalMarks ?? a.metadata?.total ?? a.totalMarks;
                  const scoreNum = typeof rawScore === 'number' ? rawScore : parseFloat(rawScore);
                  const totalNum = typeof rawTotal === 'number' ? rawTotal : parseFloat(rawTotal);
                  const scoreLabel = rawScore !== undefined
                    ? `${Number(isNaN(scoreNum) ? rawScore : scoreNum.toFixed(2))}/${isNaN(totalNum) ? (rawTotal ?? '?') : totalNum}`
                    : null;
                  // Derive percentage for colour coding
                  const scorePct = (!isNaN(scoreNum) && !isNaN(totalNum) && totalNum > 0) ? (scoreNum / totalNum) * 100 : null;
                  const scoreColour = scorePct === null
                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    : scorePct >= 60
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                    : scorePct >= 35
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                    : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400';
                  return (
                    <DynamicVectorCard key={i} glowColor="rgba(37, 99, 235, 0.28)" roundedClass="rounded-2xl" className="snap-start shrink-0 w-[66vw] xs:w-[250px] sm:w-[280px] lg:w-[320px]">
                      <motion.div
                        initial={{ opacity: 0, y: 15, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 22, delay: i * 0.06 }}
                        whileTap={whileTap.press}
                        onClick={() => {
                          if (isTestResult) handleViewResults(a.metadata);
                          else if (a.type === 'question_bank_accessed' && a.metadata?.pdfUrl) window.open(a.metadata.pdfUrl, '_blank');
                        }}
                        className="w-full h-full rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#0A1628] hover:border-brand-300 dark:hover:border-brand-500/50 shadow-md dark:shadow-xl dark:shadow-slate-950/40 transition-all duration-300 cursor-pointer group p-3.5 sm:p-5 flex flex-col gap-2.5 premium-shine-container relative overflow-hidden active:scale-[0.98]"
                      >
                        {/* Inner Vector Grid Overlay */}
                        <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-[0.04] pointer-events-none z-0" />
                      {/* Top row: icon + title + arrow */}
                      <div className="flex items-start gap-2.5 sm:gap-3 relative z-10">
                        {/* Completed icon — branded circle */}
                        <div className="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800/50 group-hover:scale-105 transition-transform relative z-10">
                          <CheckCircle2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-extrabold text-[12.5px] sm:text-sm text-slate-900 dark:text-white line-clamp-1 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">{a.title}</h4>
                          <p className="text-[9.5px] sm:text-[10.5px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{new Date(a.timestamp).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 shrink-0 mt-0.5 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all relative z-10" />
                      </div>

                      {/* Bottom row: score chip + category label */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-slate-700/60 relative z-10">
                        <span className="text-[8px] sm:text-[8.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 truncate">
                          {a.metadata?.testCategory || t('common.activity.recentActivity', 'Activity')}
                        </span>
                        {scoreLabel && (
                          <span className={`text-[9.5px] sm:text-[10.5px] font-black px-2 py-0.5 rounded-md shrink-0 ml-2 ${scoreColour}`}>
                            {scoreLabel}
                          </span>
                        )}
                      </div>
                      </motion.div>
                    </DynamicVectorCard>
                  );
                })}
              </div>
            </div>
            {activities.filter((a: any) => a.type !== 'test_incomplete').length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-0.5 sm:hidden pointer-events-none px-4">
                <div className="h-[1px] flex-1 bg-slate-200/60" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('common.activity.swipeToExplore', 'Swipe to explore')}</span>
                <div className="h-[1px] flex-1 bg-slate-200/60" />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col space-y-5 sm:space-y-7">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="border border-slate-200/80 dark:border-slate-700/80 sm:border-2 sm:border-slate-900 bg-slate-50/50 dark:bg-slate-800/60 sm:bg-white sm:dark:bg-slate-800/80 p-1 rounded-2xl flex gap-1.5 w-full sm:w-auto shrink-0 shadow-none sm:shadow-[4px_4px_0px_rgba(37,99,235,0.15)] relative">
              {(['upcoming', 'popular'] as const).map((tab) => {
                const isTabActive = examSearchQuery 
                  ? filteredExams.some(e => e.category === tab) 
                  : activeTab === tab;
                
                const tabLabel = tab === 'upcoming' 
                  ? t('exams.upcomingTab', 'Upcoming') 
                  : t('exams.popularTab', 'Popular');

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => { 
                      setActiveTab(tab); 
                      setExamSearchQuery(''); 
                      sessionStorage.removeItem('oep_exam_search_query');
                    }}
                    className={cn(
                      "px-5 sm:px-8 py-2 sm:py-3 rounded-xl font-extrabold text-xs sm:text-sm cursor-pointer relative transition-all duration-300 focus:outline-none select-none flex-1 sm:flex-initial text-center",
                      isTabActive 
                        ? "text-white sm:-translate-y-0.5" 
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/60 dark:hover:bg-slate-700/60"
                    )}
                  >
                    {isTabActive && (
                      <motion.div
                        layoutId="activeExamTabBg"
                        className="absolute inset-0 bg-[#2563EB] rounded-xl shadow-[1px_2px_4px_rgba(37,99,235,0.2)] sm:shadow-[2px_2px_0px_#0f172a] z-0"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 capitalize">{tabLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 sm:left-5 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500" />
              <input 
                type="text"
                placeholder={t('exams.searchPlaceholder', 'Search exams...')}
                value={examSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setExamSearchQuery(val);
                  sessionStorage.setItem('oep_exam_search_query', val);
                }}
                className="pl-10 sm:pl-14 pr-12 py-2.5 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base w-full border border-slate-200 bg-white/95 dark:bg-slate-900/90 dark:border-slate-700 dark:text-white dark:placeholder-slate-500 sm:border-2 sm:border-slate-900 shadow-sm sm:shadow-[4px_4px_0px_rgba(37,99,235,0.15)] focus:border-brand-500/80 sm:focus:border-slate-900 focus:ring-2 focus:ring-brand-500/10 sm:focus:ring-0 focus:shadow-none sm:focus:shadow-[6px_6px_0px_#2563EB] focus:outline-none transition-all duration-200"
              />
              {examSearchQuery && (
                <button onClick={() => { setExamSearchQuery(''); sessionStorage.removeItem('oep_exam_search_query'); }} className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>

          <motion.div 
            className={cn(
              isMobile 
                ? "flex flex-col gap-2.5 sm:gap-3" 
                : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 md:gap-6"
            )}
          >
            <AnimatePresence mode="wait">
              {loadingExams ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    className="h-28 sm:h-40 md:h-56 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-white dark:bg-slate-800 animate-pulse shadow-[4px_4px_0px_rgba(37,99,235,0.1)]"
                  />
                ))
              ) : filteredExams.length === 0 ? (
                <motion.div
                  key="empty-exams"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="col-span-2 sm:col-span-3 lg:col-span-4 flex flex-col items-center justify-center py-12 text-center gap-3 bg-white dark:bg-slate-900/90 border-2 border-slate-900 dark:border-slate-800 rounded-2xl p-6 shadow-[4px_4px_0px_rgba(37,99,235,0.15)]"
                >
                  <div className="w-14 h-14 rounded-2xl border-2 border-slate-900 dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-800 flex items-center justify-center text-3xl shadow-[2px_2px_0px_#2563EB]">📚</div>
                  <p className="font-serif font-bold text-slate-900 dark:text-white text-lg">
                    {examSearchQuery ? `No results for "${examSearchQuery}"` : `No ${activeTab} exams yet`}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium max-w-xs">
                    {examSearchQuery ? 'Try a different search term' : activeTab === 'upcoming' ? 'Switch to Popular to see available exams' : 'Exams will appear here once added'}
                  </p>
                  {!examSearchQuery && activeTab === 'upcoming' && (
                    <button 
                      onClick={() => setActiveTab('popular')} 
                      className="mt-1 px-5 py-2 text-sm font-extrabold text-white bg-[#2563EB] hover:bg-[#1d4ed8] border-2 border-slate-900 rounded-xl transition-all duration-200 shadow-[2px_2px_0px_#0f172a] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#0f172a] cursor-pointer"
                    >
                      {t('exams.viewPopular', 'View Popular Exams')}
                    </button>
                  )}
                </motion.div>
              ) : (
                filteredExams.map((exam) => {
                  let displayDesc = exam.description || 'Practice mock tests and quizzes';
                  if (typeof displayDesc === 'string' && displayDesc.startsWith('JSON_METADATA_')) {
                    try {
                      const meta = JSON.parse(displayDesc.replace('JSON_METADATA_', ''));
                      displayDesc = meta.description || 'Practice mock tests and quizzes';
                    } catch(e) {}
                  }

                  // Replace generic AI placeholder descriptions if empty
                  if (!displayDesc || displayDesc.trim() === '') {
                    const nameLower = exam.name.toLowerCase();
                    if (nameLower.includes('amin')) {
                      displayDesc = 'Comprehensive practice tests covering Mathematics, Computer Awareness, English, and Odia for the OSSSC Amin recruitment.';
                    } else if (nameLower.includes('ri') || nameLower === 'ri') {
                      displayDesc = 'Mock examinations covering General Awareness, Mathematics, Odia, English, and Computer concepts for Revenue Inspector.';
                    } else if (nameLower.includes('upsc')) {
                      displayDesc = 'Mock tests and previous year papers for Civil Services Prelims, focusing on General Studies and CSAT paper preparation.';
                    } else if (nameLower.includes('opsc')) {
                      displayDesc = 'Mock tests tailored for OPSC OAS Prelims & Mains exams, containing detailed solutions and performance analytics.';
                    } else if (nameLower.includes('ossc')) {
                      displayDesc = 'Comprehensive syllabus coverage for OSSC CGL and other graduate level examinations, featuring daily practice quizzes.';
                    } else if (nameLower.includes('osssc')) {
                      displayDesc = 'Dedicated preparation tests for various OSSSC cadre posts, including targeted section tests and full-length papers.';
                    } else {
                      displayDesc = 'Access specialized syllabus-aligned mock exams, topic-wise practice questions, and previous year papers.';
                    }
                  }

                  return (
                    <motion.div 
                      key={exam.id}
                      initial={{ opacity: 0, scale: 0.95, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => {
                        setSelectedExam(exam.id);
                      }}
                      className="cursor-pointer h-full group/card"
                    >
                      {isMobile ? (
                        // Sleek Premium Mobile Row Item
                        <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.28)" roundedClass="rounded-2xl" className="w-full">
                          <div className="p-3.5 bg-white dark:bg-slate-900/90 border border-slate-100/90 dark:border-slate-800 rounded-2xl flex flex-row items-center justify-between gap-3.5 relative shadow-[0_4px_16px_rgba(0,0,0,0.035)] active:scale-[0.98] active:border-brand-300 transition-all duration-300 overflow-hidden">
                            {/* Inner Vector Grid Overlay */}
                            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-[0.04] pointer-events-none z-0" />
                            
                            {/* Soft brand left indicator */}
                            <div className="absolute left-0 top-3.5 bottom-3.5 w-1 bg-gradient-to-b from-[#2563EB] to-brand-700 rounded-r-md opacity-80 z-10" />
                            
                            {/* Left Content (Icon & Text) */}
                            <div className="flex items-center gap-3.5 min-w-0 flex-1 pl-1.5 relative z-10">
                              {/* Icon container */}
                              <div className="w-12 h-12 rounded-xl border border-brand-100/20 bg-brand-50/50 dark:bg-slate-800 flex justify-center items-center shrink-0 shadow-sm relative overflow-hidden">
                                {(exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/'))) ? (
                                  <img src={getDirectImageUrl(exam.icon)} alt={`Odisha Exam Prep Icon: ${exam.name}`} className="w-8/12 h-8/12 object-contain relative z-10" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-xl relative z-10">{exam.icon || '📚'}</span>
                                )}
                              </div>
                              
                              {/* Title and Subtitle */}
                              <div className="min-w-0 flex-1">
                                <h3 className="text-[13.5px] font-extrabold text-slate-900 dark:text-white leading-snug tracking-tight uppercase line-clamp-1">
                                  {exam.name}
                                </h3>
                                <p className="text-slate-455 dark:text-slate-400 text-[11px] font-medium leading-normal mt-0.5 line-clamp-1 pr-1">
                                  {displayDesc}
                                </p>
                              </div>
                            </div>

                            {/* Right Icon Chevron */}
                            <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 shrink-0 shadow-2xs relative z-10">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </DynamicVectorCard>
                      ) : (
                        // Desktop Card
                        <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.15)" roundedClass="rounded-2xl sm:rounded-3xl" className="h-full">
                          <div className="p-3 sm:p-5 md:p-6 h-full bg-white dark:bg-gradient-to-br dark:from-[#0d1b3e] dark:via-[#0f2257] dark:to-[#0b1730] border sm:border-2 border-slate-900 dark:border-brand-800/50 rounded-2xl sm:rounded-3xl flex flex-col items-center text-center justify-center space-y-2 sm:space-y-4 md:space-y-5 relative shadow-[0_4px_16px_rgba(0,0,0,0.035)] sm:shadow-[4px_4px_0px_#2563EB] md:group-hover/card:shadow-[8px_8px_0px_#2563EB] transition-all duration-300 active:scale-[0.98] sm:active:scale-100 active:bg-slate-50/70 sm:active:bg-white dark:active:bg-[#0d1b3e] text-slate-900 dark:text-white overflow-hidden">
                            {/* Inner Vector Grid Overlay */}
                            <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-[0.04] pointer-events-none z-0" />
                          {/* Corner arrow - structured circle */}
                          <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-5 md:right-5 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 rounded-full border-2 border-slate-900 dark:border-brand-700/70 bg-white dark:bg-brand-900/60 flex items-center justify-center transition-all duration-300 shadow-[2px_2px_0px_#2563EB] group-hover/card:bg-[#2563EB] group-hover/card:shadow-none group-hover/card:translate-x-0.5 group-hover/card:translate-y-0.5">
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 dark:text-blue-200 group-hover/card:text-white transition-colors" />
                          </div>

                          {/* Icon Container */}
                          <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl border sm:border-2 border-brand-100/20 sm:border-slate-900 dark:border-brand-700/40 bg-brand-50/60 sm:bg-[#FAF8F5] dark:bg-white/10 dark:sm:bg-white/10 flex justify-center items-center shrink-0 shadow-none sm:shadow-[3px_3px_0px_rgba(37,99,235,0.15)] md:group-hover/card:shadow-[4px_4px_0px_#2563EB] transition-all duration-300 relative overflow-hidden">
                            {(exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/'))) ? (
                              <img src={getDirectImageUrl(exam.icon)} alt={`Odisha Exam Prep Icon: ${exam.name}`} className="w-8/12 h-8/12 object-contain relative z-10" referrerPolicy="no-referrer" />
                            ) : (
                              <span className="text-xl sm:text-2xl md:text-4xl relative z-10">{exam.icon || '📚'}</span>
                            )}
                          </div>
                          
                          <div className="flex-1 w-full flex flex-col justify-start">
                            <h3 
                              className="text-[12px] sm:text-base md:text-lg lg:text-xl font-serif font-black text-slate-900 dark:text-white md:group-hover/card:text-[#2563EB] dark:md:group-hover/card:text-brand-300 transition-all duration-300 leading-snug tracking-tight uppercase"
                              style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {exam.name}
                            </h3>
                            <div className="w-full mt-2">
                              <p 
                                className="text-slate-400 sm:text-slate-500 dark:text-blue-200/70 dark:sm:text-blue-200/70 text-[10px] sm:text-xs font-medium sm:font-bold leading-normal sm:leading-relaxed opacity-85 md:group-hover/card:opacity-100 transition-opacity"
                                style={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}
                              >
                                {displayDesc}
                              </p>
                            </div>
                          </div>
                        </div>
                      </DynamicVectorCard>
                    )}
                  </motion.div>
                );
              })
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
  }

  if (selectedBankType) {
    let items = (dynamicQuestionBanks[selectedBankType] || []).filter(item => {
      if (item.is_archived && !hasAccessTo(item.id, selectedExam)) return false;
      if (item.examId !== selectedExam) return false;
      // target_mode filter: 'practice' items are ONLY for Practice Mode (Step 2), not Step 1
      const mode = item.target_mode || 'both';
      if (mode === 'practice') return false;
      return true;
    });
    const bankTitle = selectedBankType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (bankSearchQuery.trim()) {
      items = items.filter(i => i.title.toLowerCase().includes(bankSearchQuery.toLowerCase()));
    }
    
    if (bankSortBy === "Most Questions") {
      items.sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
    } else if (bankSortBy === "Least Questions") {
      items.sort((a, b) => (a.questions?.length || 0) - (b.questions?.length || 0));
    } else {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    return (
      <div className="space-y-8 md:space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="ghost" onClick={() => setSelectedBankType(null)} className="p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rotate-180 text-brand-600 dark:text-indigo-400" />
            </Button>
            <div>
              <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{bankTitle}</h1>
              <p className="text-xs sm:text-base text-slate-500 dark:text-slate-400 font-medium">{t('exams.step3.browsePdfLibrary', 'Browse available question banks')}</p>
            </div>
          </div>
          
          <div className="w-full lg:w-auto flex flex-row items-center gap-2 sm:gap-3">
             <div className="relative flex-1 sm:w-64">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500" />
               <input 
                 type="text" 
                 placeholder={t('exams.step3.searchBanks', 'Search banks...')} 
                 value={bankSearchQuery}
                 onChange={e => setBankSearchQuery(e.target.value)}
                 className="w-full pl-8.5 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm font-medium outline-none transition-all shadow-xs"
               />
             </div>
              {/* Premium Custom Sort Dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setBankSortOpen(o => !o)}
                  className={cn(
                    "flex items-center justify-between gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl border text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer outline-none whitespace-nowrap",
                    bankSortOpen
                      ? "bg-blue-50 dark:bg-blue-950/60 border-blue-400 dark:border-blue-800 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "bg-white dark:bg-[#0B1528] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-blue-400/40 hover:bg-slate-50 dark:hover:bg-slate-800/60 shadow-xs"
                  )}
                >
                  <Filter className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>
                    {bankSortBy === "Name" ? 'Name' : bankSortBy === "Most Questions" ? 'Most Qs' : 'Least Qs'}
                  </span>
                  <motion.div animate={{ rotate: bankSortOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {bankSortOpen && (
                    <>
                      {/* Click-outside overlay */}
                      <div className="fixed inset-0 z-40" onClick={() => setBankSortOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[160px] bg-white dark:bg-[#0B1528] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-200/70 dark:shadow-black/70 overflow-hidden"
                      >
                        <div className="p-1.5">
                          {[
                            { value: "Name", label: t('exams.step3.sortName', 'Sort by Name') },
                            { value: "Most Questions", label: t('exams.step3.sortMost', 'Most Questions') },
                            { value: "Least Questions", label: t('exams.step3.sortLeast', 'Least Questions') },
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => { setBankSortBy(opt.value); setBankSortOpen(false); }}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer flex items-center gap-2",
                                bankSortBy === opt.value
                                  ? "bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-extrabold"
                                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                              )}
                            >
                              {bankSortBy === opt.value && (
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                              )}
                              {bankSortBy !== opt.value && (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 shrink-0" />
                              )}
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </div>

        {items.length === 0 ? (
          loadingDashboardData ? (
            <div className="flex flex-col items-center justify-center p-24 space-y-4 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-[#2563EB] animate-[spin_1s_linear_infinite]" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide animate-pulse">Loading question banks...</p>
            </div>
          ) : (
            <div className="w-full p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('exams.step3.noBanks', 'No matching banks found')}</h3>
                <p className="text-slate-500 dark:text-slate-400">{t('exams.step3.noBanksDesc', 'Try adjusting your search filters.')}</p>
              </div>
            </div>
          )
        ) : (
          <div className="relative">
            <div className="pb-12 pt-4 gpu-accelerated">
            <motion.div 
              initial={isMobile ? "show" : "hidden"}
              animate={isMobile ? "show" : undefined}
              whileInView={isMobile ? undefined : "show"}
              viewport={isMobile ? undefined : { once: true }}
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: isMobile ? 0.05 : 0.1 }
                }
              }}
              className={cn(
                isMobile
                  ? "flex flex-col gap-3.5"
                  : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              )}
            >
          {items.map((item) => {
            const isLocked = item.isPremium && !hasAccessTo(item);
            const vecTheme = getQuestionBankVectorTheme(item, currentExam?.name);
            const VecMainIcon = vecTheme.MainIcon;
            const VecWatermarkIcon = vecTheme.WatermarkIcon;

            return (
              <motion.div
                key={item.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  show: { opacity: 1, y: 0 }
                }}
                whileHover={isMobile ? undefined : whileHover.liftTap}
                whileTap={whileTap.press}
                className="w-full cv-card-auto"
              >
                {isMobile ? (
                  <div
                    onClick={() => setSelectedBankItem(item)}
                    className={cn(
                      "p-3 sm:p-4 bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-3 cursor-pointer group relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md",
                      isLocked 
                        ? "shadow-[0_4px_16px_-4px_rgba(245,158,11,0.06)] active:border-amber-400"
                        : "shadow-[0_4px_16px_-4px_rgba(37,99,235,0.06)] active:border-brand-400"
                    )}
                  >
                    <div className={cn(
                      "absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity pointer-events-none",
                      isLocked 
                        ? "bg-gradient-to-r from-amber-500/0 via-amber-500/[0.012] to-amber-500/0"
                        : "bg-gradient-to-r from-brand-500/0 via-brand-500/[0.012] to-brand-500/0"
                    )} />
                    <div className={cn(
                      "absolute left-0 top-3 bottom-3 w-1 rounded-r-md",
                      isLocked 
                        ? "bg-gradient-to-b from-amber-400 to-orange-500" 
                        : "bg-gradient-to-b from-brand-500 to-indigo-600"
                    )} />

                    <div className="flex items-center gap-3 min-w-0 flex-1 pl-1.5">
                      <div className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 shadow-xs relative border border-slate-200/50 dark:border-slate-800 flex items-center justify-center p-2 text-white select-none", vecTheme.gradient)}>
                        <VectorCoverTextureOverlay pattern={vecTheme.pattern} className="absolute inset-0 pointer-events-none opacity-25 select-none" />
                        <VecMainIcon className="w-5 h-5 text-white stroke-[2] relative z-10" />
                        {isLocked && (
                          <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center z-20">
                            <Lock className="w-3 h-3 text-amber-300" />
                          </div>
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-extrabold text-[13.5px] sm:text-sm text-slate-900 dark:text-white tracking-tight leading-snug truncate capitalize">
                            {item.title.toLowerCase()}
                          </h4>
                          {isLocked ? (
                            <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-300 text-[8.5px] font-black rounded border border-amber-200/60 dark:border-amber-800/80 uppercase tracking-wider shrink-0">
                              Premium
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 text-[8.5px] font-black rounded border border-emerald-200/60 dark:border-emerald-800/80 uppercase tracking-wider shrink-0">
                              Free
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200/60 dark:border-slate-800 text-[10px] text-slate-600 dark:text-slate-300 shrink-0">
                            <FileText className="w-3 h-3 text-slate-400" />
                            {(item.questionCount || (Array.isArray(item.questions) ? item.questions.length : 0))} Qs
                          </span>
                          
                          {getBankDisplayTagline(item.tagline, '') && (
                            <span className="flex items-center gap-1 bg-brand-50/60 dark:bg-blue-950/60 text-brand-700 dark:text-blue-300 px-1.5 py-0.5 rounded border border-brand-200/40 dark:border-blue-800/60 text-[9.5px] font-black uppercase tracking-wider truncate max-w-[140px] xs:max-w-[190px]">
                              <Zap className="w-2.5 h-2.5 fill-brand-600 text-brand-600 dark:fill-blue-400 dark:text-blue-400 shrink-0" />
                              <span className="truncate">{getBankDisplayTagline(item.tagline, '').replace(/QUESTION BANK WITH ANSWER KEY/gi, 'Answer Key').replace(/QUESTION BANK/gi, 'Q-Bank')}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={cn(
                      "w-7 h-7 rounded-full border flex items-center justify-center shrink-0 shadow-2xs group-active:translate-x-0.5 transition-all duration-300",
                      isLocked
                        ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800 text-amber-600 dark:text-amber-400 group-active:bg-amber-500 group-active:text-white"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-400 group-active:bg-brand-50 group-active:border-brand-100 group-active:text-brand-600"
                    )}>
                      {isLocked ? <Lock className="w-3 h-3" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                ) : (
                  <Card 
                    onClick={() => setSelectedBankItem(item)}
                    className={cn(
                      "group cursor-pointer relative overflow-hidden rounded-[2rem] h-full border-slate-200/50 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col",
                      !isMobile && "hover:border-brand-300/80 dark:hover:border-indigo-500/80 transition-all duration-500 hover:shadow-xl hover:shadow-brand-500/5 premium-shine-container"
                    )}
                  >
                    {/* Ambient grid-bg inside the card */}
                    <div className={cn("absolute inset-0 grid-bg opacity-[0.02] pointer-events-none", !isMobile && "group-hover:opacity-[0.04] transition-opacity duration-500")} />
                    
                    {/* Hero Vector Banner Section */}
                    <div className={cn(
                      "h-44 overflow-hidden relative shrink-0 border-b border-slate-100 flex flex-col justify-between p-5 text-white select-none transition-all duration-500",
                      vecTheme.gradient,
                      isLocked && "blur-[1px]"
                    )}>
                      {/* Procedural Vector Texture Layer */}
                      <VectorCoverTextureOverlay pattern={vecTheme.pattern} />
                      
                      {/* Large Vector Watermark Icon */}
                      <VecWatermarkIcon className="absolute -right-4 -bottom-4 w-32 h-32 opacity-15 stroke-[1.2] text-white pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />

                      {/* Top Badge Row */}
                      <div className="flex items-center justify-between relative z-10">
                        <span className={cn("text-[9.5px] font-mono tracking-wider font-extrabold px-2.5 py-1 rounded-md uppercase border backdrop-blur-xs shadow-xs", vecTheme.badgeBg)}>
                          {vecTheme.badgeText}
                        </span>
                        {isLocked ? (
                          <span className="px-2 py-0.5 bg-rose-500/20 border border-rose-400/30 text-rose-200 text-[8px] font-black uppercase tracking-wider rounded">
                            Premium
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[8px] font-black uppercase tracking-wider rounded">
                            Free
                          </span>
                        )}
                      </div>

                      {/* Bottom Exam Target Info */}
                      <div className="relative z-10 space-y-1">
                        <div className="flex items-center gap-1.5 text-white/90 text-xs font-black uppercase tracking-wider">
                          <VecMainIcon className="w-4 h-4 shrink-0 text-white" />
                          <span className="line-clamp-1">{vecTheme.examTag}</span>
                        </div>
                        <div className="text-[10.5px] text-white/75 font-semibold tracking-wide flex items-center gap-1">
                          <span>
                            {(item.questionCount || (Array.isArray(item.questions) ? item.questions.length : 0)) > 0
                              ? `${item.questionCount || item.questions.length} Practice Questions`
                              : 'Chapter Practice Bank'}
                          </span>
                          <span>•</span>
                          <span>Answer Key & Solutions</span>
                        </div>
                      </div>
                      
                      {isLocked && (
                        <div className={cn("absolute inset-0 bg-slate-950/40 flex items-center justify-center z-20", !isMobile && "backdrop-blur-[2px]")}>
                          <div className="w-12 h-12 bg-white/95 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200/50">
                             <Lock className="w-5 h-5 text-[#2563EB]" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Card Content Body */}
                    <div className={cn("p-6 flex flex-col flex-1 relative z-10 bg-white/90 dark:bg-slate-900/95", !isMobile && "bg-white/50 dark:bg-slate-900/80 backdrop-blur-sm", isLocked && "opacity-60")}>
                      <div className="flex justify-between items-start mb-3">
                        <h3 className={cn("text-lg font-serif font-extrabold text-slate-900 dark:text-white capitalize tracking-tight leading-snug line-clamp-1", !isMobile && "group-hover:text-brand-650 dark:group-hover:text-brand-400 transition-colors")}>
                          {item.title.toLowerCase()}
                        </h3>
                        {isLocked ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
                            <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-[#2563EB] dark:text-rose-300 text-[8px] font-black uppercase tracking-wider rounded border border-rose-200/40 dark:border-rose-800">
                              Premium
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[8px] font-black uppercase tracking-wider rounded border border-emerald-200/40 dark:border-emerald-800 shrink-0">
                            Free
                          </span>
                        )}
                      </div>
                      
                      {/* Stats and Highlights */}
                      <div className="space-y-3.5 mb-6">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <div className={cn("w-6.5 h-6.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100/60 dark:border-slate-700 flex items-center justify-center text-slate-400 shadow-sm", !isMobile && "group-hover:text-brand-500 dark:group-hover:text-brand-400 group-hover:bg-brand-50/50 dark:group-hover:bg-slate-700 transition-all")}>
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <span className={cn("text-xs font-bold text-slate-500 dark:text-slate-300", !isMobile && "group-hover:text-slate-700 dark:group-hover:text-white transition-colors")}>
                            {item.questionCount || item.questions} Questions
                          </span>
                        </div>
                        
                        {item.tagline && (
                          <div className="flex items-center gap-2 text-brand-650 dark:text-indigo-300 bg-gradient-to-r from-brand-50/70 to-indigo-50/40 dark:from-indigo-950/80 dark:to-slate-900/80 px-3 py-1.5 rounded-xl w-fit border border-brand-100/30 dark:border-indigo-800">
                            <Zap className="w-3.5 h-3.5 fill-brand-650 dark:fill-indigo-300 text-brand-650 dark:text-indigo-300 shrink-0" />
                            <span className="text-[10px] font-black uppercase tracking-wider">{item.tagline}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* View Details Button */}
                      <div className="mt-auto pt-2">
                        <button 
                          className={cn(
                            "w-full py-3 px-6 rounded-xl font-black text-xs uppercase tracking-wider relative overflow-hidden flex items-center justify-center gap-2 border border-brand-100 dark:border-indigo-800/80 bg-brand-50/40 dark:bg-indigo-950/60 text-brand-600 dark:text-indigo-300 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
                            !isMobile && "transition-all duration-500 hover:scale-[1.02] active:scale-95 group-hover:bg-gradient-to-r group-hover:from-brand-600 group-hover:to-brand-500 group-hover:text-white group-hover:border-transparent group-hover:shadow-lg group-hover:shadow-brand-500/20"
                          )}
                        >
                          {/* Button Shine Effect */}
                          {!isMobile && (
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
                          )}
                          <span className="relative z-10 flex items-center justify-center gap-1.5">
                            {isLocked ? 'Unlock to View' : 'View Details'}
                            <ArrowRight className={cn("w-3.5 h-3.5 relative -top-[0.5px]", !isMobile && "group-hover:translate-x-1 transition-transform")} />
                          </span>
                        </button>
                      </div>
                    </div>
                  </Card>
                )}
              </motion.div>
            );
          })}
            </motion.div>
          </div>
        </div>
        )}
        
        {/* Common View Elements */}
        {renderCommonModals()}
      </div>
    );
  }

    if (loadingDashboardData && !currentExam) {
      return <LoadingPortal />;
    }

    let bundlePrice = 0;
    let bundleOriginalPrice = 0;
    let examDescription = currentExam?.description || '';
    let hasBundle = false;

    if (typeof examDescription === 'string' && examDescription.startsWith('JSON_METADATA_')) {
      try {
        const meta = JSON.parse(examDescription.replace('JSON_METADATA_', ''));
        bundlePrice = meta.price;
        bundleOriginalPrice = meta.originalPrice;
        examDescription = meta.description;
        hasBundle = meta.isPremium !== undefined ? Boolean(meta.isPremium) : (Number(meta.price) > 0);
      } catch(e) {}
    }

    return (
      <ErrorBoundary>
      <div className="relative w-full min-h-screen bg-[#F8FAFC] dark:bg-[#060B16]" style={{ isolation: 'isolate' }}>
        {/* Full-Screen Edge-to-Edge Academic Vector Canvas Grid & HSL Glows */}
        <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40 dark:opacity-30 pointer-events-none z-0" />
        <div className="fixed top-20 left-1/4 w-96 h-96 bg-brand-300/20 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-indigo-200/15 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none z-0" />

        {/* Floating Viewport Academic Study Vector Watermarks */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
          <GraduationCap className="absolute top-24 left-[5%] w-44 h-44 text-slate-800 opacity-[0.08] stroke-[1.2] rotate-12" />
          <BookOpen className="absolute top-1/3 right-[5%] w-48 h-48 text-brand-600 opacity-[0.08] stroke-[1.2] -rotate-6" />
          <Award className="absolute bottom-1/3 left-[6%] w-44 h-44 text-amber-600 opacity-[0.08] stroke-[1.2] rotate-45" />
          <Compass className="absolute bottom-28 right-[6%] w-36 h-36 text-indigo-600 opacity-[0.08] stroke-[1.2] -rotate-12" />
        </div>

        <div className="w-full mx-auto space-y-4 sm:space-y-8 pb-4 sm:pb-8 relative z-10">

        {/* Executive Bright Study Vector Header Card */}
        <div className="p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50/95 to-brand-50/30 dark:bg-gradient-to-br dark:from-[#0B1528] dark:via-[#060B16] dark:to-[#0B1528] border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-slate-950/80 rounded-[2.2rem] relative overflow-hidden z-10 mb-8 sm:mb-10">
          {/* Radial Grid & Floating Header Watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-[0.04] pointer-events-none" />
          <GraduationCap className="absolute -right-8 -bottom-8 w-52 h-52 sm:w-64 sm:h-64 opacity-10 stroke-[1.2] text-brand-600 pointer-events-none rotate-12" />

          <div className="flex flex-col gap-6 relative z-10">
            <div className="flex items-start gap-3.5 sm:gap-5">
              <Button 
                variant="ghost" 
                onClick={() => { 
                  setSelectedExam(null); 
                  if (location.pathname === '/') {
                    scrollToElement('exams', { block: 'start', delay: 100 }); 
                  }
                }} 
                className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white dark:bg-[#060B16] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-300 dark:hover:border-slate-700 hover:bg-brand-50 dark:hover:bg-slate-800 text-slate-700 dark:text-white transition-all shrink-0 flex items-center justify-center p-0"
              >
                <ChevronRight className="w-6 h-6 rotate-180 text-brand-600 dark:text-brand-400" />
              </Button>
              <div className="min-w-0 flex-1">
                {/* Desktop Title with inline badge */}
                <h1 className="hidden sm:flex flex-wrap items-center gap-3 text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight leading-tight mb-1.5">
                  {currentExam?.name}
                  {hasAccessTo(`exam_bundle_${selectedExam}`) && (
                    <span className="px-3.5 py-1 bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[10px] font-black rounded-lg uppercase tracking-wider inline-flex items-center gap-1.5 h-6">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {t('exams.gateway.premiumUnlocked', 'Premium Unlocked')}
                    </span>
                  )}
                </h1>
                
                {/* Mobile Title with stacked badge */}
                <div className="sm:hidden flex flex-col">
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                    {currentExam?.name}
                  </h1>
                  {hasAccessTo(`exam_bundle_${selectedExam}`) && (
                    <div className="mt-1.5 self-start">
                      <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-wider inline-flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        {t('exams.gateway.premiumUnlocked', 'Premium Unlocked')}
                      </span>
                    </div>
                  )}
                </div>

                <div className="max-w-3xl mt-1.5 sm:mt-0">
                  <p 
                    className={cn(
                      "text-slate-600 dark:text-slate-300 font-medium text-xs sm:text-base leading-relaxed transition-all duration-300",
                      !isDescExpanded && "line-clamp-2"
                    )}
                  >
                    {!hasBundle && examDescription ? examDescription : t('exams.gateway.selectPrepPath', 'Select your preparation path')}
                  </p>
                  {!hasBundle && examDescription && examDescription.length > 150 && (
                    <button 
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="text-xs font-black text-brand-600 hover:text-brand-700 transition-colors uppercase tracking-wider mt-1.5 focus:outline-none inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isDescExpanded ? t('exams.gateway.readLess', 'Read Less') : t('exams.gateway.readMore', 'Read More')}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Quick Navigation Pills */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="hidden sm:flex flex-wrap items-center gap-2 sm:gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/60"
            >
              <Button variant="outline" className="rounded-full bg-white/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-xs text-slate-700 dark:text-slate-200 font-bold hover:bg-brand-50 dark:hover:bg-slate-700 hover:text-brand-700 dark:hover:text-white hover:border-brand-200 h-9.5 px-4.5 text-xs sm:text-sm transition-all" onClick={() => scrollToElement('question-bank-section', { block: 'start' })}>
                <Layers className="w-4 h-4 mr-2 text-brand-500" />
                {t('exams.gateway.quickPills.questionBank', 'Question Bank')}
              </Button>
              <Button variant="outline" className="rounded-full bg-white/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-xs text-slate-700 dark:text-slate-200 font-bold hover:bg-indigo-50 dark:hover:bg-slate-700 hover:text-indigo-700 dark:hover:text-white hover:border-indigo-200 h-9.5 px-4.5 text-xs sm:text-sm transition-all" onClick={() => scrollToElement('practice-mode-section', { block: 'start' })}>
                <Dumbbell className="w-4 h-4 mr-2 text-indigo-500" />
                {t('exams.gateway.quickPills.practiceTests', 'Practice Tests')}
              </Button>
              <Button variant="outline" className="rounded-full bg-white/90 dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700 shadow-xs text-slate-700 dark:text-slate-200 font-bold hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-700 dark:hover:text-white hover:border-amber-200 h-9.5 px-4.5 text-xs sm:text-sm transition-all" onClick={() => scrollToElement('test-series', { block: 'start' })}>
                <Award className="w-4 h-4 mr-2 text-amber-500" />
                {t('exams.gateway.quickPills.mockTests', 'Mock Tests')}
              </Button>
            </motion.div>
          </div>
        </div>

          {/* Mobile Premium Segmented Tab Switcher */}
          {isMobile && (
            <div className="sticky top-16 z-20 -mx-4 px-4 py-2.5 bg-slate-50/95 dark:bg-[#060B16]/95 backdrop-blur-md mt-1">
              <div className="flex bg-slate-100 dark:bg-[#0B1528] p-1 rounded-xl relative shadow-inner border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMobileExamTab('practice')}
                  className={cn(
                    "flex-grow flex-shrink-0 flex-1 py-2 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 relative cursor-pointer",
                    mobileExamTab === 'practice' ? "text-indigo-700 dark:text-blue-400 font-extrabold" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  {mobileExamTab === 'practice' && (
                    <motion.div
                      layoutId="mobileActiveSubTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-[#060B16] rounded-lg shadow-sm border border-slate-200/50 dark:border-blue-500/30 z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Dumbbell className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{t('exams.gateway.quickPills.practiceTests', 'Practice Tests')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileExamTab('mock')}
                  className={cn(
                    "flex-grow flex-shrink-0 flex-1 py-2 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 relative cursor-pointer",
                    mobileExamTab === 'mock' ? "text-amber-700 dark:text-amber-300 font-extrabold" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  {mobileExamTab === 'mock' && (
                    <motion.div
                      layoutId="mobileActiveSubTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-[#060B16] rounded-lg shadow-sm border border-slate-200/50 dark:border-amber-500/30 z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Award className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{t('exams.gateway.quickPills.mockTests', 'Mock Tests')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileExamTab('learn')}
                  className={cn(
                    "flex-grow flex-shrink-0 flex-1 py-2 text-[11px] font-black rounded-lg transition-all flex items-center justify-center gap-1.5 relative cursor-pointer",
                    mobileExamTab === 'learn' ? "text-brand-700 dark:text-emerald-400 font-extrabold" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                >
                  {mobileExamTab === 'learn' && (
                    <motion.div
                      layoutId="mobileActiveSubTabIndicator"
                      className="absolute inset-0 bg-white dark:bg-[#060B16] rounded-lg shadow-sm border border-slate-200/50 dark:border-emerald-500/30 z-0"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Layers className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{t('exams.gateway.quickPills.questionBank', 'Question Bank')}</span>
                </button>
              </div>
            </div>
          )}

      {/* Tier 1: Guided Next Step Hero Module */}
      {(!isMobile || mobileExamTab === 'practice') && (() => {
        const incompleteActivity = activities?.find((act: any) => {
          if (act.type !== 'test_incomplete') return false;

          // Check if a completed test activity already exists for this same session/topic/bank
          const sessionId = act.metadata?.resumeSessionId || act.metadata?.test?.id;
          const actTitle = (act.title || act.metadata?.test?.title || '').replace(/(\s*-\s*Practice Session)+$/gi, '').trim().toLowerCase();
          const actBankId = act.metadata?.test?.bankId || act.metadata?.bankId;

          const isAlreadyCompleted = activities.some((comp: any) => {
            if (comp.type !== 'mock_test_completed' && comp.type !== 'practice_test_completed') return false;
            
            if (sessionId && comp.metadata?.resumeSessionId === sessionId) return true;
            if (actBankId && (comp.metadata?.bankId === actBankId || comp.metadata?.test?.bankId === actBankId)) return true;
            
            if (actTitle && comp.title) {
              const compTitle = comp.title.replace(/(\s*-\s*Practice Session)+$/gi, '').trim().toLowerCase();
              if (compTitle && (compTitle === actTitle || compTitle.includes(actTitle) || actTitle.includes(compTitle))) return true;
            }
            return false;
          });

          if (isAlreadyCompleted) return false;

          // 1. Direct examId match on metadata or test object
          const actExamId = act.metadata?.test?.examId || act.metadata?.examId;
          if (actExamId && selectedExam && actExamId === selectedExam) return true;

          // 2. Match bankId against question banks of current exam
          const bankId = act.metadata?.test?.bankId || act.metadata?.bankId;
          if (bankId) {
            const allExamBanks = (dynamicQuestionBanks['topic-wise'] || [])
              .concat(dynamicQuestionBanks['exam-focused'] || [])
              .concat(dynamicQuestionBanks['revision-sets'] || [])
              .concat(dynamicQuestionBanks['pyq-collections'] || []);
            const matchingBank = allExamBanks.find((b: any) => b.id === bankId);
            if (matchingBank && matchingBank.examId === selectedExam) return true;
          }

          // 3. Match title against topic banks of current exam
          if (act.title) {
            const cleanActTitle = act.title.replace(/(\s*-\s*Practice Session)+$/gi, '').trim().toLowerCase();
            const allExamBanks = (dynamicQuestionBanks['topic-wise'] || [])
              .concat(dynamicQuestionBanks['exam-focused'] || [])
              .concat(dynamicQuestionBanks['revision-sets'] || [])
              .concat(dynamicQuestionBanks['pyq-collections'] || []);
            const matchesTitle = allExamBanks.some((b: any) => b.examId === selectedExam && b.title.toLowerCase().includes(cleanActTitle));
            if (matchesTitle) return true;
          }

          // 4. Fallback if no explicit examId is set: match if selectedExam is active
          if (!actExamId && selectedExam) return true;

          return false;
        });
        
        const firstTopicBank = (dynamicQuestionBanks['topic-wise'] || []).find((b: any) => b.examId === selectedExam && !b.is_archived);
        
        // Calculate user performance stats for selectedExam
        const completedExamActs = (activities || []).filter((act: any) => 
          (act.type === 'mock_test_completed' || act.type === 'practice_test_completed') &&
          (act.metadata?.test?.examId === selectedExam || act.metadata?.examId === selectedExam || act.metadata?.test?.id?.includes(selectedExam))
        );
        const totalCompleted = completedExamActs.length;
        const avgAcc = totalCompleted > 0
          ? Math.round(completedExamActs.reduce((acc: number, act: any) => acc + (act.accuracy || act.score || 0), 0) / totalCompleted)
          : 0;

        let recTitle = "Start Chapter 1 Practice Drill";
        let recDesc = "Begin with core fundamental questions to assess your base score and build topic accuracy.";
        let recBadge = "RECOMMENDED STARTING POINT";
        let recButtonText = "Start Diagnostic Practice";
        let recTargetScore = avgAcc > 0 ? `Your Avg: ${avgAcc}% | Goal: 85%+` : "85% Qualifying Target";
        let recDurationText = "~15 Mins Drill";
        let recCategoryPill = "Step-by-Step Guidance";
        let recAction = () => {
          setSelectedPracticeCategory('topic-wise');
          scrollToElement('practice-mode-section', { block: 'start', delay: 50 });
        };

        if (incompleteActivity) {
          const rawTitle = incompleteActivity.title || incompleteActivity.metadata?.test?.title || 'In-Progress Session';
          const testTitle = rawTitle.replace(/(\s*-\s*Practice Session)+$/gi, '').trim();
          const solvedCount = incompleteActivity.metadata?.answers 
            ? Object.keys(incompleteActivity.metadata.answers).length 
            : (incompleteActivity.metadata?.currentQuestionIndex || 0);
          
          const actualQsCount = Array.isArray(incompleteActivity.metadata?.test?.questions)
            ? incompleteActivity.metadata.test.questions.length
            : 0;

          const totalCount = actualQsCount > 0 
            ? actualQsCount 
            : (incompleteActivity.metadata?.totalQuestions || 0);

          // Calculate exact remaining time for in-progress session (minutes & seconds)
          let leftSeconds = 0;
          if (incompleteActivity.metadata?.timeLeft !== undefined && incompleteActivity.metadata.timeLeft > 0) {
            leftSeconds = Math.max(0, Math.floor(incompleteActivity.metadata.timeLeft));
          } else if (incompleteActivity.metadata?.timeSpentSeconds !== undefined && totalCount > 0) {
            const totalSecs = (incompleteActivity.metadata?.test?.durationMinutes || totalCount) * 60;
            leftSeconds = Math.max(0, totalSecs - Math.floor(incompleteActivity.metadata.timeSpentSeconds));
          } else {
            leftSeconds = (incompleteActivity.metadata?.test?.durationMinutes || totalCount || 10) * 60;
          }

          const remMins = Math.floor(leftSeconds / 60);
          const remSecs = leftSeconds % 60;
          const exactTimeStr = remSecs > 0 
            ? `${remMins}m ${remSecs}s`
            : `${remMins} Mins`;

          // Calculate real-time session accuracy if answers exist
          let sessionAcc: number | null = null;
          if (incompleteActivity.metadata?.answers && typeof incompleteActivity.metadata.answers === 'object') {
            const answersMap = incompleteActivity.metadata.answers;
            const testQuestions = incompleteActivity.metadata.test?.questions || [];
            const answeredIds = Object.keys(answersMap);
            if (answeredIds.length > 0 && testQuestions.length > 0) {
              let correctCnt = 0;
              answeredIds.forEach((qId) => {
                const qObj = testQuestions.find((item: any) => String(item.id) === String(qId));
                if (qObj && qObj.correctAnswerIndex !== undefined && Number(answersMap[qId]) === Number(qObj.correctAnswerIndex)) {
                  correctCnt++;
                }
              });
              sessionAcc = Math.round((correctCnt / answeredIds.length) * 100);
            }
          }

          recTitle = `${t('exams.cardActions.resume', 'Resume')}: ${testTitle}`;
          recDesc = t('exams.resumeHero.unfinishedNotice', `You have an unfinished practice session for "${testTitle}" (${solvedCount}${totalCount ? ` / ${totalCount}` : ''} questions solved). Jump back in to finish!`, { title: testTitle, solved: solvedCount, total: totalCount || solvedCount });
          recBadge = t('exams.resumeHero.inProgress', 'IN PROGRESS SESSION');
          recButtonText = t('exams.resumeHero.resumeBtn', 'Resume Practice Now');
          recTargetScore = sessionAcc !== null
            ? t('exams.resumeHero.sessionAccuracy', `${sessionAcc}% Session Accuracy (${solvedCount}/${totalCount} Solved)`, { acc: sessionAcc, solved: solvedCount, total: totalCount || solvedCount })
            : (avgAcc > 0 ? t('exams.resumeHero.targetScoreAvg', `Your Avg: ${avgAcc}% | Goal: 85%+`, { avg: avgAcc }) : t('exams.resumeHero.targetScore', '85% Target Goal'));
          recDurationText = t('exams.resumeHero.timeRemaining', `${exactTimeStr} Remaining`, { time: exactTimeStr });
          recCategoryPill = incompleteActivity.metadata?.testCategory || t('exams.step1.chapterWise', 'In-Progress Practice');

          let recMobileDesc = t('exams.resumeHero.unfinishedNoticeMobile', `${solvedCount}${totalCount ? ` of ${totalCount}` : ''} questions completed. Tap to continue session.`, { solved: solvedCount, total: totalCount || solvedCount });
          let recMobileTargetScore = sessionAcc !== null
            ? t('exams.resumeHero.accuracy', `${sessionAcc}% Accuracy`, { acc: sessionAcc })
            : (avgAcc > 0 ? `Avg: ${avgAcc}%` : t('exams.resumeHero.targetScore', '85% Goal'));
          let recMobileDurationText = t('exams.resumeHero.timeRemainingLeft', `${exactTimeStr} Left`, { time: exactTimeStr });
          
          recAction = () => {
            const targetTest = incompleteActivity.metadata?.test || {
              id: incompleteActivity.metadata?.testId || `practice-${Date.now()}`,
              title: `${testTitle} - Practice Session`
            };
            handleStartDirectPractice(targetTest, incompleteActivity);
          };

          const recVecTheme = getQuestionBankVectorTheme(incompleteActivity?.metadata?.test || testTitle || recTitle, currentExam?.name || recCategoryPill);
          const RecWatermarkIcon = recVecTheme.WatermarkIcon;

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative rounded-2xl sm:rounded-[2.2rem] text-white p-4 sm:p-8 md:p-10 shadow-2xl border-none transition-all duration-500 card-3d-deep group mb-6 sm:mb-10",
                recVecTheme.gradient,
                "shadow-slate-950/30"
              )}
            >
              {/* Inner Watermark & Grid Background Wrapper */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-[2.2rem] pointer-events-none z-0">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <RecWatermarkIcon className="absolute -right-6 -bottom-6 w-48 h-48 sm:w-64 sm:h-64 opacity-15 stroke-[1.2] text-white transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-8">
                <div className="space-y-2 sm:space-y-4 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-recommended flex items-center gap-1.5 shadow-sm text-[9px] sm:text-xs py-0.5 sm:py-1 px-2.5 sm:px-3">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 animate-pulse shrink-0" />
                      {recBadge}
                    </span>
                    <span className={cn("px-2.5 py-0.5 sm:px-3 sm:py-1 text-[8.5px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border backdrop-blur-md shadow-xs", recVecTheme.badgeBg)}>
                      {recCategoryPill}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-snug">
                      {recTitle}
                    </h2>
                    <p className="text-white/80 font-medium text-xs sm:text-sm md:text-base leading-relaxed mt-1 sm:mt-2">
                      <span className="sm:hidden">{recMobileDesc}</span>
                      <span className="hidden sm:inline">{recDesc}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-6 pt-1 sm:pt-0.5 text-[11px] sm:text-xs font-bold text-white/90 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-black/20 sm:bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/15 backdrop-blur-xs">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                      <span className="sm:hidden">{recMobileTargetScore}</span>
                      <span className="hidden sm:inline">{recTargetScore}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/20 sm:bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/15 backdrop-blur-xs">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                      <span className="sm:hidden">{recMobileDurationText}</span>
                      <span className="hidden sm:inline">{recDurationText}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col shrink-0 items-stretch sm:items-center lg:items-end gap-3 pt-1 sm:pt-0">
                  <Button
                    onClick={recAction}
                    className="h-11 sm:h-16 px-5 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-600 to-brand-600 hover:from-brand-400 hover:to-indigo-500 text-white font-black text-xs sm:text-base shadow-lg shadow-brand-500/25 hover:shadow-brand-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 group/btn relative overflow-hidden cursor-pointer w-full sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 z-10" />
                    <span className="relative z-10">{recButtonText}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1.5 transition-transform relative z-10" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        } else if (firstTopicBank) {
          const cleanBankTitle = (firstTopicBank.title || '').replace(/(\s*-\s*Practice Session)+$/gi, '').trim();
          const qsCount = firstTopicBank.practiceQuestionCount || firstTopicBank.actualQuestionCount || firstTopicBank.questionCount || 20;
          const durMins = firstTopicBank.durationMinutes || firstTopicBank.duration || qsCount;

          recTitle = `Recommended Drill: ${cleanBankTitle}`;
          recDesc = `Master high-yield questions for "${cleanBankTitle}" (${qsCount} questions). Complete instant practice drills with step-by-step explanations.`;
          recBadge = "WHAT TO STUDY NEXT";
          recButtonText = "Begin Practice Set";
          recTargetScore = avgAcc > 0 ? `Your Avg: ${avgAcc}% | Goal: 85%+` : "85% Pass Benchmark";
          recDurationText = `~${durMins} Mins Drill`;
          recCategoryPill = "Chapter-Wise Practice";

          let recMobileDesc = `Practice ${qsCount} core questions for "${cleanBankTitle}" with step-by-step explanations.`;
          let recMobileTargetScore = avgAcc > 0 ? `Avg: ${avgAcc}%` : "85% Target";
          let recMobileDurationText = `~${durMins}m Drill`;

          recAction = () => {
            handleStartDirectPractice(firstTopicBank);
          };

          const recVecTheme = getQuestionBankVectorTheme(firstTopicBank || cleanBankTitle, currentExam?.name || recCategoryPill);
          const RecWatermarkIcon = recVecTheme.WatermarkIcon;

          return (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative rounded-2xl sm:rounded-[2.2rem] text-white p-4 sm:p-8 md:p-10 shadow-2xl border-none transition-all duration-500 card-3d-deep group mb-6 sm:mb-10",
                recVecTheme.gradient,
                "shadow-slate-950/30"
              )}
            >
              {/* Inner Watermark & Grid Background Wrapper */}
              <div className="absolute inset-0 overflow-hidden rounded-2xl sm:rounded-[2.2rem] pointer-events-none z-0">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <RecWatermarkIcon className="absolute -right-6 -bottom-6 w-48 h-48 sm:w-64 sm:h-64 opacity-15 stroke-[1.2] text-white transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6" />
              </div>

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-8">
                <div className="space-y-2 sm:space-y-4 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge-recommended flex items-center gap-1.5 shadow-sm text-[9px] sm:text-xs py-0.5 sm:py-1 px-2.5 sm:px-3">
                      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300 animate-pulse shrink-0" />
                      {recBadge}
                    </span>
                    <span className={cn("px-2.5 py-0.5 sm:px-3 sm:py-1 text-[8.5px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border backdrop-blur-md shadow-xs", recVecTheme.badgeBg)}>
                      {recCategoryPill}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-snug">
                      {recTitle}
                    </h2>
                    <p className="text-white/80 font-medium text-xs sm:text-sm md:text-base leading-relaxed mt-1 sm:mt-2">
                      <span className="sm:hidden">{recMobileDesc}</span>
                      <span className="hidden sm:inline">{recDesc}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-6 pt-1 sm:pt-0.5 text-[11px] sm:text-xs font-bold text-white/90 flex-wrap">
                    <div className="flex items-center gap-1.5 bg-black/20 sm:bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/15 backdrop-blur-xs">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-300 shrink-0" />
                      <span className="sm:hidden">{recMobileTargetScore}</span>
                      <span className="hidden sm:inline">{recTargetScore}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/20 sm:bg-white/10 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border border-white/15 backdrop-blur-xs">
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 shrink-0" />
                      <span className="sm:hidden">{recMobileDurationText}</span>
                      <span className="hidden sm:inline">{recDurationText}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col shrink-0 items-stretch sm:items-center lg:items-end gap-3 pt-1 sm:pt-0">
                  <Button
                    onClick={recAction}
                    className="h-11 sm:h-16 px-5 sm:px-8 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500 via-indigo-600 to-brand-600 hover:from-brand-400 hover:to-indigo-500 text-white font-black text-xs sm:text-base shadow-lg shadow-brand-500/25 hover:shadow-brand-500/50 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 sm:gap-3 group/btn relative overflow-hidden cursor-pointer w-full sm:w-auto"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 z-10" />
                    <span className="relative z-10">{recButtonText}</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/btn:translate-x-1.5 transition-transform relative z-10" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        }

        return null;
      })()}

      {/* Mobile Premium Unlock Modal Popup */}
      {isMobile && (
        <AnimatePresence>
          {hasBundle && !hasAccessTo(`exam_bundle_${selectedExam}`) && !isBannerDismissed && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-[#0b0307]/75 backdrop-blur-xs"
                onClick={() => setIsBannerDismissed(true)}
              />

              {/* Centered Modal Content Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.93, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.93, y: 15 }}
                transition={{ type: "spring", stiffness: 350, damping: 26 }}
                className="relative w-full max-w-sm rounded-[2.5rem] p-[1.5px] premium-shine-container shadow-2xl overflow-hidden z-10 bg-gradient-to-b from-brand-500/20 via-transparent to-brand-500/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative rounded-[2.45rem] overflow-hidden bg-gradient-to-br from-[#12040b]/98 via-[#08020a]/99 to-[#030005]/100 border border-brand-500/15 p-6 flex flex-col items-center text-center gap-5">
                  <VisualEffects />

                  {/* Premium Close Button */}
                  <button
                    onClick={() => setIsBannerDismissed(true)}
                    className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
                    aria-label="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Emblem */}
                  <div className="relative shrink-0 flex items-center justify-center w-24 h-24 mt-2">
                    <div className="absolute inset-0 rounded-full border border-dashed border-brand-400 opacity-40 animate-[spin_35s_linear_infinite]" />
                    <div className="absolute inset-2 rounded-full border border-dashed border-indigo-400 opacity-20 animate-[spin_20s_linear_infinite_reverse]" />
                    <div className="absolute inset-4 rounded-full border border-brand-400 opacity-15 animate-[ping_4s_ease-in-out_infinite]" />
                    <div className="absolute inset-4 rounded-full flex items-center justify-center bg-brand-950/45 border border-brand-400/30 text-brand-300 shadow-2xl shadow-brand-950/50">
                      <Award className="w-8 h-8 text-brand-200 filter drop-shadow-[0_0_8px_rgba(244,176,190,0.3)] animate-pulse" />
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.18em] border border-brand-500/25 bg-brand-500/10 text-brand-300 backdrop-blur-sm">
                      Selection Special
                    </span>
                    <span className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.18em] border border-indigo-400/25 bg-indigo-500/10 text-indigo-300 backdrop-blur-sm">
                      Unlimited Access
                    </span>
                  </div>

                  {/* Heading & Description */}
                  <div className="space-y-2">
                    <h2 className="text-xl font-extrabold text-white leading-tight tracking-tight px-2">
                      Get Full Access to <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-pink-200 to-indigo-300 drop-shadow-[0_2px_10px_rgba(244,176,190,0.15)]">{currentExam?.name}</span> Pack
                    </h2>
                    <p className="text-xs text-brand-100/70 leading-relaxed font-normal tracking-wide max-w-xs">
                      Get full lifetime access to all Question Banks, Practice Mode, Premium Mock Tests, PDF notes, and all future updates.
                    </p>
                  </div>

                  {/* Pricing and Action Section */}
                  <div className="w-full space-y-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-brand-300/40 text-sm line-through font-bold">₹{bundleOriginalPrice}</span>
                      <span className="text-3xl font-black text-white font-mono tracking-tighter">₹{bundlePrice}</span>
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-300 text-[9px] font-black rounded-lg border border-amber-500/20 uppercase tracking-widest">
                        Save {Math.round(((bundleOriginalPrice - bundlePrice) / bundleOriginalPrice) * 100)}% Instant
                      </span>
                    </div>

                    <Button
                      onClick={() => {
                        if (isGuest) {
                          setShowLoginPrompt(true);
                          return;
                        }
                        setPaywallPrice(bundlePrice);
                        setPaywallOriginalPrice(bundleOriginalPrice);
                        setPaywallItemTitle(`${currentExam?.name} Full Access Pack`);
                        setPaywallFeatures([
                          'Unlocks ALL Premium Mock Tests',
                          'Unlocks ALL Question Banks',
                          'Full Interactive Practice Mode',
                          'Advanced Performance Analytics',
                          'All PDF Downloads Included',
                          'Lifetime Validity & Updates'
                        ]);
                        setPaywallItemId(`exam_bundle_${selectedExam}`);
                        setPaywallProductType('exam_bundle');
                        setShowPaywall(true);
                      }}
                      className="w-full h-12 rounded-2xl bg-gradient-to-r from-white via-slate-100 to-white hover:from-brand-100 hover:to-white text-brand-950 font-black text-sm shadow-xl shadow-brand-500/10 hover:shadow-brand-500/20 transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 z-10" />
                      <span className="relative z-10">Unlock All Access</span>
                      <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform relative z-10" />
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-brand-300/60 font-bold text-[9px] uppercase tracking-widest">
                      <Zap className="w-3.5 h-3.5 fill-brand-300/60 animate-pulse" />
                      Instant Activation
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Desktop Premium Unlock Banner */}
      {!isMobile && hasBundle && !hasAccessTo(`exam_bundle_${selectedExam}`) && !isBannerDismissed && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="group relative overflow-hidden rounded-[2rem] lg:rounded-[3rem] p-[1px] premium-shine-container mb-10"
        >
          {/* Animated Outer Gradient Border */}
          <div className="absolute inset-0 opacity-90 transition-all duration-500 animate-gradient-x bg-gradient-to-r from-brand-500/60 via-amber-400/40 to-indigo-600/60" />
          
          <div className="relative rounded-[1.95rem] lg:rounded-[2.95rem] overflow-hidden transition-all duration-500 bg-gradient-to-br from-[#12040b]/98 via-[#08020a]/99 to-[#030005]/100 border border-brand-500/10">
            <VisualEffects />
            
            {/* Premium Close Button */}
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-all duration-300 hover:scale-110 active:scale-95 group focus:outline-none cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:rotate-90" />
            </button>
            
            {/* Dynamic Glowing Ambient Mesh / Orbs */}
            <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-[100px] pointer-events-none transform-gpu" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none transform-gpu" />
            <div className="absolute top-1/2 left-2/3 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/[0.03] blur-[80px] pointer-events-none transform-gpu" />

            {/* Sparkle Particles */}
            <div className="absolute inset-0 pointer-events-none hidden md:block">
              {SPARKLE_POSITIONS.map((sparkle, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ 
                    opacity: [0, 0.8, 0], 
                    scale: [0, 1.3, 0],
                    x: sparkle.x,
                    y: sparkle.y
                  }}
                  transition={{ 
                    duration: sparkle.duration, 
                    repeat: Infinity, 
                    delay: sparkle.delay 
                  }}
                  className="absolute w-1 h-1 rounded-full blur-[0.5px] transform-gpu bg-brand-300"
                />
              ))}
            </div>
            <div className="relative z-10 px-4 py-6 sm:p-10 lg:p-14 flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10">
              <motion.div 
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.08
                    }
                  }
                }}
                className="flex flex-col sm:flex-row items-center gap-4 sm:gap-10 flex-1 w-full"
              >
                {/* Rotating Orbital Emblem */}
                <motion.div 
                  variants={{
                    hidden: { scale: 0.8, opacity: 0 },
                    show: { scale: 1, opacity: 1 }
                  }}
                  className="relative shrink-0 flex items-center justify-center w-14 h-14 sm:w-28 sm:h-28 lg:w-32 lg:h-32"
                >
                  {/* Rotating Dashed Orbit 1 */}
                  <div className="absolute inset-0 rounded-full border border-dashed opacity-40 transform-gpu will-change-transform border-brand-400 animate-[spin_35s_linear_infinite]" />
                  
                  {/* Rotating Dashed Orbit 2 (Counter-rotated) */}
                  <div className="absolute inset-1 sm:inset-2 rounded-full border border-dashed opacity-20 transform-gpu will-change-transform border-indigo-400 animate-[spin_20s_linear_infinite_reverse]" />

                  {/* Ring Pulse Glow */}
                  <div className="absolute inset-2 sm:inset-4 rounded-full border opacity-15 transform-gpu border-brand-400 animate-[ping_4s_ease-in-out_infinite]" />

                  {/* Core Glass Sphere */}
                  <div className="absolute inset-2 sm:inset-4 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-700 hover:scale-105 backdrop-blur-xl bg-brand-950/45 border border-brand-400/30 text-brand-300 shadow-brand-950/50">
                     <Award className="w-5 h-5 sm:w-10 sm:h-10 lg:w-11 lg:h-11 text-brand-200 filter drop-shadow-[0_0_8px_rgba(244,176,190,0.3)] animate-pulse" />
                  </div>
                </motion.div>

                <div className="text-center sm:text-left space-y-2.5 sm:space-y-4 w-full">
                  <motion.div 
                    variants={{
                      hidden: { y: 8, opacity: 0 },
                      show: { y: 0, opacity: 1 }
                    }}
                    className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5"
                  >
                    <span className="px-2.5 sm:px-3.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] border backdrop-blur-sm bg-brand-500/10 border-brand-500/25 text-brand-300">
                      Selection Special
                    </span>
                    <span className="px-2.5 sm:px-3.5 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-[0.18em] border backdrop-blur-sm bg-indigo-500/10 border-indigo-400/25 text-indigo-300">
                      Unlimited Access
                    </span>
                  </motion.div>

                  <div className="max-w-2xl space-y-2.5">
                    <motion.h2 
                      variants={{
                        hidden: { y: 8, opacity: 0 },
                        show: { y: 0, opacity: 1 }
                      }}
                      className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight tracking-tight"
                    >
                      <>Get Full Access to <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-brand-300 via-pink-200 to-indigo-300 drop-shadow-[0_2px_10px_rgba(244,176,190,0.15)]">{currentExam?.name}</span> Pack</>
                    </motion.h2>
                    <motion.p 
                      variants={{
                        hidden: { y: 8, opacity: 0 },
                        show: { y: 0, opacity: 1 }
                      }}
                      className={cn(
                        "text-xs sm:text-base lg:text-[1.05rem] leading-relaxed font-normal tracking-wide max-w-xl transition-all duration-300 text-brand-100/70",
                        !isBannerDescExpanded && "line-clamp-2"
                      )}
                    >
                      {examDescription || 'Get full lifetime access to all Question Banks, Practice Mode, Premium Mock Tests, PDF notes, and any future content added to this exam. Complete your preparation with the ultimate bundle.'}
                    </motion.p>
                    {examDescription && examDescription.length > 150 && (
                      <button 
                        onClick={() => setIsBannerDescExpanded(!isBannerDescExpanded)}
                        className="text-xs font-black transition-colors uppercase tracking-wider focus:outline-none inline-flex items-center gap-1 cursor-pointer mt-1 text-brand-300 hover:text-brand-200"
                      >
                        {isBannerDescExpanded ? 'Read Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Action Section - Compact on Laptop */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center lg:items-center gap-4 sm:gap-5 shrink-0 lg:border-l lg:border-white/5 lg:pl-12 lg:min-w-[280px] w-full lg:w-auto"
              >
                <div className="text-center lg:text-center">
                  <div className="flex flex-row sm:flex-row lg:flex-col items-center justify-center lg:items-center gap-2.5 sm:gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-brand-300/40 text-sm sm:text-base lg:text-lg line-through font-bold">₹{bundleOriginalPrice}</span>
                      <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-white font-mono tracking-tighter">₹{bundlePrice}</span>
                    </div>
                    <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-amber-500/10 text-amber-300 text-[9px] sm:text-[10px] font-black rounded-lg border border-amber-500/20 uppercase tracking-widest">
                      Save {Math.round(((bundleOriginalPrice - bundlePrice) / bundleOriginalPrice) * 100)}% Instant
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => {
                    if (isGuest) {
                      setShowLoginPrompt(true);
                      return;
                    }
                    setPaywallPrice(bundlePrice);
                    setPaywallOriginalPrice(bundleOriginalPrice);
                    setPaywallItemTitle(`${currentExam?.name} Full Access Pack`);
                    setPaywallFeatures([
                      'Unlocks ALL Premium Mock Tests',
                      'Unlocks ALL Question Banks',
                      'Full Interactive Practice Mode',
                      'Advanced Performance Analytics',
                      'All PDF Downloads Included',
                      'Lifetime Validity & Updates'
                    ]);
                    setPaywallItemId(`exam_bundle_${selectedExam}`);
                    setPaywallProductType('exam_bundle');
                    setShowPaywall(true);
                  }}
                  className="w-full sm:w-auto h-12 lg:h-16 px-8 rounded-2xl bg-gradient-to-r from-white via-slate-100 to-white hover:from-brand-100 hover:to-white text-brand-950 font-black text-base lg:text-lg shadow-xl shadow-brand-500/10 hover:shadow-brand-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group/btn relative overflow-hidden"
                >
                  {/* Button Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 z-10" />
                  
                  <span className="relative z-10">Unlock All Access</span>
                  <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1.5 transition-transform relative z-10" />
                </Button>
                
                <div className="flex items-center gap-1.5 text-brand-300/60 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">
                  <Zap className="w-3.5 h-3.5 fill-brand-300/60 animate-pulse" />
                  Instant Activation
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 1: Practice Tests */}
      {(!isMobile || mobileExamTab === 'practice') && (
        <section id="practice-mode-section" className="space-y-4 sm:space-y-6 scroll-mt-24">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl sm:rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-800 shrink-0 mt-0.5">
              <Dumbbell className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                <Zap className="w-2.5 h-2.5 fill-indigo-600 dark:fill-indigo-400" /> Step 1 · Topic Practice
              </div>
              <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{t('exams.step1.title', 'Practice Tests & Chapter Drills')}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed">{t('exams.step1.subtitle', 'Master topics with instant answers, explanations & interactive drills.')}</p>
            </div>
          </div>

          {(() => {
            if (!selectedPracticeCategory) {
              return (
                <motion.div 
                  initial={isMobile ? "show" : "hidden"}
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: isMobile ? 0.05 : 0.1 }
                    }
                  }}
                  className={cn(
                    isMobile
                      ? "flex flex-col gap-3.5"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:gap-8 gap-4 sm:gap-6"
                  )}
                >
                  {[
                    { id: 'topic-wise', title: t('exams.step1.chapterWise', 'Chapter-Wise Practice'), desc: t('exams.step1.chapterWiseDesc', 'Master individual chapters with structured question sets & instant solutions.'), tag: t('exams.step1.chapterWiseTag', 'Structured Drills') },
                    { id: 'exam-focused', title: t('exams.step1.highYield', 'High-Yield Topic Banks'), desc: t('exams.step1.highYieldDesc', 'Focus on most frequently asked questions and core exam topics.'), tag: t('exams.step1.highYieldTag', 'High Yield') },
                    { id: 'revision-sets', title: t('exams.step1.speedQuizzes', 'Daily Speed & Accuracy Quizzes'), desc: t('exams.step1.speedQuizzesDesc', '10-minute micro-quizzes to boost solving speed and accuracy.'), tag: t('exams.step1.speedQuizzesTag', 'Daily Boost') },
                    { id: 'pyq-collections', title: t('exams.step1.pyqTopic', 'Topic-Wise Solved PYQs'), desc: t('exams.step1.pyqTopicDesc', 'Previous year exam questions categorized topic-by-topic.'), tag: t('exams.step1.pyqTopicTag', '10-Yr PYQs') },
                  ].map((test, i) => {
                    const vecTheme = getPracticeModeVectorTheme(test.id);
                    const MainIcon = vecTheme.MainIcon;
                    const WatermarkIcon = vecTheme.WatermarkIcon;

                    const count = (dynamicQuestionBanks[test.id] || []).filter((b: any) => {
                      if (b.is_archived && !hasAccessTo(b.id, selectedExam)) return false;
                      if (b.examId !== selectedExam) return false;
                      const mode = b.target_mode || 'both';
                      return mode !== 'bank';
                    }).length;

                    return (
                      <motion.div
                        key={i}
                        variants={{
                          hidden: { opacity: 0, scale: 0.95, y: 10 },
                          show: { opacity: 1, scale: 1, y: 0 }
                        }}
                        whileHover={isMobile ? undefined : whileHover.liftTap}
                        whileTap={whileTap.press}
                        className="w-full"
                      >
                        {isMobile ? (
                          <div
                            onClick={() => {
                              setSelectedPracticeCategory(test.id);
                              scrollToElement('practice-mode-section', { block: 'start', delay: 50 });
                            }}
                            className="p-4 bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 cursor-pointer group relative overflow-hidden transition-all duration-300 shadow-sm active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md relative text-white", vecTheme.logoBg)}>
                                <MainIcon className="w-6 h-6 stroke-[2.2]" />
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h4 className="font-extrabold text-[14.5px] text-slate-900 dark:text-white tracking-tight leading-snug">{test.title}</h4>
                                  <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8.5px] font-black uppercase tracking-wider rounded border border-slate-200/50 dark:border-slate-700 shrink-0">
                                    {count === 1 ? t('exams.step1.setCountSingle', '1 Set', { count: 1 }) : t('exams.step1.setsCount', `${count} Sets`, { count })}
                                  </span>
                                  {hasNewUnreadContent('practice', test.id) ? (
                                    <span className="px-1.5 py-0.5 bg-brand-500 text-white text-[8.5px] font-black uppercase tracking-wider rounded-md shrink-0 flex items-center gap-1 animate-pulse">
                                      <span className="w-1 h-1 rounded-full bg-white animate-ping shrink-0" />
                                      {t('exams.step1.newBadge', 'New')}
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[8.5px] font-black rounded border border-slate-200/60 dark:border-slate-700 uppercase tracking-wider shrink-0">{test.tag}</span>
                                  )}
                                </div>
                                <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5 line-clamp-2 pr-1">{test.desc}</p>
                              </div>
                            </div>
                            
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-active:translate-x-0.5 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div 
                            className={cn(
                              "p-6 sm:p-7 lg:p-8 rounded-[2.2rem] transition-all duration-500 cursor-pointer flex flex-col justify-between gap-6 relative w-full h-full card-3d-deep group",
                              vecTheme.cardBg
                            )}
                            onClick={() => {
                              setSelectedPracticeCategory(test.id);
                              scrollToElement('practice-mode-section', { block: 'start', delay: 50 });
                            }}
                          >
                            {/* Inner Watermark & Grid Background Wrapper */}
                            <div className="absolute inset-0 overflow-hidden rounded-[2.2rem] pointer-events-none z-0">
                              <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] bg-[radial-gradient(#0f172a_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:14px_14px]" />
                              <WatermarkIcon className={cn("absolute -right-6 -bottom-6 w-44 h-44 stroke-[1.2] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6", vecTheme.watermarkColor)} />
                            </div>

                            <div className="space-y-4 relative z-10">
                              <div className="flex items-center justify-between gap-3">
                                <div className={cn(
                                  "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-110 relative",
                                  vecTheme.logoBg
                                )}>
                                  <MainIcon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                                  <div className="absolute inset-0 border border-white/30 rounded-2xl animate-pulse" />
                                </div>
                                
                                <span className={cn("px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border backdrop-blur-md shadow-xs", vecTheme.badgeBg)}>
                                  {vecTheme.badgeText}
                                </span>
                              </div>

                              <div>
                                <h4 className={cn("font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-tight transition-colors uppercase", vecTheme.titleHover)}>{test.title}</h4>
                                <p className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed mt-2">{test.desc}</p>
                              </div>
                            </div>
                            
                            <div className="space-y-4 relative z-10">
                              <div className="flex items-center gap-2 flex-wrap">
                                {hasNewUnreadContent('practice', test.id) ? (
                                  <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-brand-500 text-white rounded-lg flex items-center gap-1 animate-pulse shadow-xs">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                    {t('exams.step1.newBadge', 'New')}
                                  </span>
                                ) : (
                                  <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg backdrop-blur-xs", vecTheme.tagBg)}>
                                    {test.tag}
                                  </span>
                                )}
                                <span className={cn("text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg backdrop-blur-xs", vecTheme.countBg)}>
                                  {count === 1 ? t('exams.step1.setCountSingle', '1 Set', { count: 1 }) : t('exams.step1.setsCount', `${count} Sets`, { count })}
                                </span>
                              </div>

                              <Button 
                                className={cn(
                                  "w-full h-[48px] sm:h-[54px] rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base text-white transition-all relative z-10 pointer-events-none overflow-hidden cursor-pointer shadow-lg",
                                  vecTheme.btnGradient
                                )}
                              >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
                                <span className="relative z-10">{t('exams.step1.exploreSets', 'Explore Sets')}</span>
                                <ChevronRight className="w-4 h-4 sm:ml-1 group-hover:translate-x-1.5 transition-transform relative z-10" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              );
            }

            return (
              <div className="space-y-6 sm:space-y-8">
                <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-6">
                  <Button variant="ghost" onClick={() => {
                    setSelectedPracticeCategory(null);
                    scrollToElement('practice-mode-section', { block: 'start', delay: 50 });
                  }} className="p-1.5 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-brand-50 dark:hover:bg-slate-800 shrink-0">
                    <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 rotate-180 text-brand-600 dark:text-indigo-400" />
                  </Button>
                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white capitalize tracking-tight leading-tight">
                      {({
                        'topic-wise': t('exams.step1.chapterWise', 'Chapter-Wise Practice'),
                        'exam-focused': t('exams.step1.highYield', 'High-Yield Topic Banks'),
                        'revision-sets': t('exams.step1.speedQuizzes', 'Daily Speed & Accuracy Quizzes'),
                        'pyq-collections': t('exams.step1.pyqTopic', 'Topic-Wise Solved PYQs')
                      } as Record<string, string>)[selectedPracticeCategory] || selectedPracticeCategory.replace('-', ' ')}
                    </h3>
                    {selectedPracticeCategory === 'topic-wise' && (dynamicQuestionBanks['topic-wise'] || []).some((b: any) => b.examId === selectedExam && b.subject) && (
                      <span className="bg-brand-100 dark:bg-indigo-950/60 text-brand-600 dark:text-indigo-300 text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 sm:py-1 rounded-full border border-brand-200 dark:border-indigo-800 shrink-0">
                        {t('exams.step2.subjectWise', 'Subject-Wise')}
                      </span>
                    )}
                  </div>
                </div>

                {(() => {
                  const matchingBanks = (dynamicQuestionBanks[selectedPracticeCategory] || [])
                    .filter((item: any) => {
                      if (item.examId !== selectedExam) return false;
                      if (item.is_archived && !hasAccessTo(item)) return false;
                      if (item.hasPracticeMode === false) return false;
                      // target_mode filter: 'bank' items are ONLY for Step 1 PDF store, NOT Practice Mode
                      const mode = item.target_mode || 'both';
                      if (mode === 'bank') return false;
                      return true;
                    });

                  if (matchingBanks.length === 0) {
                    if (loadingDashboardData) {
                      return (
                        <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                          <div className="relative w-12 h-12 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-[#2563EB] animate-[spin_1s_linear_infinite]" />
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide animate-pulse">{t('exams.step1.loadingSets', 'Loading practice sets...')}</p>
                        </div>
                      );
                    }
                    return (
                      <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                        {t('exams.step1.noSets', 'No practice sets found in this category for the selected exam.')}
                      </div>
                    );
                  }

                  // Derive unique non-empty subjects for topic-wise category
                  const practiceSubjects = selectedPracticeCategory === 'topic-wise'
                    ? Array.from(new Set(
                        matchingBanks
                          .map((b: any) => b.subject || '')
                          .filter(Boolean)
                      )).sort()
                    : [];

                  const subjectsList = practiceSubjects.length > 0 ? ['All', ...practiceSubjects] : [];

                  // Apply subject filter
                  const visibleBanks = (subjectsList.length > 0 && selectedPracticeSubject !== 'All')
                    ? matchingBanks.filter((b: any) => (b.subject || '') === selectedPracticeSubject)
                    : matchingBanks;

                  return (
                    <div className="space-y-6">
                      {/* Subject filter pill bar — only renders when subjects exist */}
                      {subjectsList.length > 0 && (
                        <div
                          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 sm:mx-0"
                          onWheel={(e) => {
                            const container = e.currentTarget;
                            const isAtRightEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
                            const isAtLeftEnd = container.scrollLeft <= 2;
                            if ((e.deltaY > 0 && !isAtRightEnd) || (e.deltaY < 0 && !isAtLeftEnd)) {
                              container.scrollLeft += e.deltaY * 0.85;
                            }
                          }}
                        >
                          {subjectsList.map((subj) => {
                            const isActive = selectedPracticeSubject === subj;
                            return (
                              <button
                                key={subj}
                                onClick={() => setSelectedPracticeSubject(subj)}
                                className={cn(
                                  "px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200 border cursor-pointer shadow-sm",
                                  isActive
                                    ? "bg-blue-600 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white font-black scale-[1.02] shadow-md shadow-blue-600/25"
                                    : "bg-white dark:bg-[#0B1528] hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                                )}
                              >
                                {subj === 'All' ? t('exams.step2.allSubjects', 'All') : subj}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {visibleBanks.map((bank: any) => (
                          <ScheduledPracticeBankCard
                            key={bank.id}
                            bank={bank}
                            isMobile={isMobile}
                            hasAccessTo={hasAccessTo}
                            activities={activities}
                            handleStartDirectPractice={handleStartDirectPractice}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            );
          })()}

        </section>
      )}

      {/* Section 2: Mock Tests */}
      {(!isMobile || mobileExamTab === 'mock') && (
        <section id="test-series" className="space-y-4 sm:space-y-10 scroll-mt-24">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-brand-50 dark:bg-blue-950/60 rounded-xl sm:rounded-2xl flex items-center justify-center border border-brand-100 dark:border-blue-800 shrink-0 mt-0.5">
              <Award className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-brand-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brand-50 dark:bg-blue-950/60 text-brand-700 dark:text-blue-300 border border-brand-100 dark:border-blue-800 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                  <Award className="w-2.5 h-2.5" /> Step 2 · Mock Test Series
                </div>
                <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-800 text-[9.5px] sm:text-xs font-bold text-slate-700 dark:text-slate-300">
                  <Sparkles className="w-3 h-3 text-brand-500 dark:text-brand-400" />
                  <span>{t('exams.step2.updatedPattern', `Updated for ${new Date().getFullYear()} Exam Pattern`, { year: new Date().getFullYear() })}</span>
                </div>
              </div>
              <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{t('exams.step2.title', 'Official Mock Test Series')}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed">{t('exams.step2.subtitle', 'Simulate the real exam environment with our expert-curated test series.')}</p>
            </div>
          </div>

        {(() => {
          if (!selectedMockCategory) return (
              <motion.div 
                initial={isMobile ? "show" : "hidden"}
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: isMobile ? 0.05 : 0.1 }
                  }
                }}
                className={cn(
                  isMobile
                    ? "flex flex-col gap-3.5"
                    : "grid grid-cols-1 sm:grid-cols-2 lg:gap-8 gap-4 sm:gap-6"
                )}
              >
                {[
                  { id: 'full-length', title: t('exams.step2.fullLength', 'Full-Length Mock Tests'), desc: t('exams.step2.fullLengthDesc', 'Complete exam simulation with real-time ranking.'), tag: t('exams.step2.fullLengthTag', 'Most Popular') },
                  { id: 'sectional', title: t('exams.step2.sectional', 'Sectional Tests'), desc: t('exams.step2.sectionalDesc', 'Focus on specific sections to improve your score.'), tag: t('exams.step2.sectionalTag', 'Recommended') },
                  { id: 'pyq', title: t('exams.step2.pyqTests', 'PYQ Tests'), desc: t('exams.step2.pyqTestsDesc', 'Practice with actual previous year papers.'), tag: t('exams.step2.pyqTestsTag', 'High Yield') },
                  { id: 'daily', title: t('exams.step2.dailyWeekly', 'Daily / Weekly Tests'), desc: t('exams.step2.dailyWeeklyDesc', 'Regular assessments to track your progress.'), tag: t('exams.step2.dailyWeeklyTag', 'Consistency') },
                ].map((test, i) => {
                  const vecTheme = getMockTestVectorTheme(test.id);
                  const MainIcon = vecTheme.MainIcon;
                  const WatermarkIcon = vecTheme.WatermarkIcon;

                  const count = mockTests.filter(mt => {
                    if (mt.is_archived && !hasAccessTo(mt.id, selectedExam)) return false;
                    try {
                      const cfg = JSON.parse(mt.seriesId);
                      return cfg.examId === selectedExam && cfg.category === test.id;
                    } catch (e) {
                      return false;
                    }
                  }).length;

                  return (
                    <motion.div
                      key={i}
                      variants={{
                        hidden: { opacity: 0, scale: 0.95, y: 10 },
                        show: { opacity: 1, scale: 1, y: 0 }
                      }}
                      whileHover={isMobile ? undefined : whileHover.liftTap}
                      whileTap={whileTap.press}
                      className="w-full"
                    >
                      {isMobile ? (
                        <div
                          onClick={() => {
                            setSelectedMockCategory(test.id);
                            scrollToElement('test-series', { block: 'start', delay: 50 });
                          }}
                          className="p-4 bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 cursor-pointer group relative overflow-hidden transition-all duration-300 shadow-sm active:scale-[0.98]"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md relative text-white", vecTheme.logoBg)}>
                              <MainIcon className="w-6 h-6 stroke-[2.2]" />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-[14.5px] text-slate-900 dark:text-white tracking-tight leading-snug">{test.title}</h4>
                                <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8.5px] font-black uppercase tracking-wider rounded border border-slate-200/50 dark:border-slate-700 shrink-0">
                                  {count} {count === 1 ? 'Test' : 'Tests'}
                                </span>
                                {hasNewUnreadContent('mock', test.id) ? (
                                  <span className="px-1.5 py-0.5 bg-brand-500 text-white text-[8.5px] font-black uppercase tracking-wider rounded-md shrink-0 flex items-center gap-1 animate-pulse">
                                    <span className="w-1 h-1 rounded-full bg-white animate-ping shrink-0" />
                                    New
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[8.5px] font-black rounded border border-slate-200/60 dark:border-slate-700 uppercase tracking-wider shrink-0">{test.tag}</span>
                                )}
                              </div>
                              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5 line-clamp-2 pr-1">{test.desc}</p>
                            </div>
                          </div>
                          
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-active:translate-x-0.5 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "p-6 sm:p-7 lg:p-8 rounded-[2.2rem] transition-all duration-500 cursor-pointer flex flex-col justify-between gap-6 relative w-full h-full card-3d-deep group",
                            vecTheme.cardBg
                          )}
                          onClick={() => {
                            setSelectedMockCategory(test.id);
                            scrollToElement('test-series', { block: 'start', delay: 50 });
                          }}
                        >
                          {/* Inner Watermark & Grid Background Wrapper */}
                          <div className="absolute inset-0 overflow-hidden rounded-[2.2rem] pointer-events-none z-0">
                            <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] bg-[radial-gradient(#0f172a_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:14px_14px]" />
                            <WatermarkIcon className={cn("absolute -right-6 -bottom-6 w-44 h-44 stroke-[1.2] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6", vecTheme.watermarkColor)} />
                          </div>

                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between gap-3">
                              <div className={cn(
                                "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-110 relative",
                                vecTheme.logoBg
                              )}>
                                <MainIcon className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
                                <div className="absolute inset-0 border border-white/30 rounded-2xl animate-pulse" />
                              </div>
                              
                              <span className={cn("px-3 py-1 text-[9px] sm:text-[10px] font-black uppercase tracking-widest rounded-full border backdrop-blur-md shadow-xs", vecTheme.badgeBg)}>
                                {vecTheme.badgeText}
                              </span>
                            </div>

                            <div>
                              <h4 className={cn("font-black text-xl sm:text-2xl text-slate-900 dark:text-white tracking-tight leading-tight transition-colors uppercase", vecTheme.titleHover)}>{test.title}</h4>
                              <p className="text-slate-600 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed mt-2">{test.desc}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-2 flex-wrap">
                              {hasNewUnreadContent('mock', test.id) ? (
                                <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 bg-brand-500 text-white rounded-lg flex items-center gap-1 animate-pulse shadow-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping shrink-0" />
                                  New
                                </span>
                              ) : (
                                <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg backdrop-blur-xs", vecTheme.tagBg)}>
                                  {test.tag}
                                </span>
                              )}
                              <span className={cn("text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-lg backdrop-blur-xs", vecTheme.countBg)}>
                                {count} {count === 1 ? 'Test' : 'Tests'}
                              </span>
                            </div>

                            <Button 
                              className={cn(
                                "w-full h-[48px] sm:h-[54px] rounded-xl sm:rounded-2xl flex items-center justify-center gap-2 font-black text-sm sm:text-base text-white transition-all relative z-10 pointer-events-none overflow-hidden cursor-pointer shadow-lg",
                                vecTheme.btnGradient
                              )}
                            >
                              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />
                              <span className="relative z-10">Explore Tests</span>
                              <ChevronRight className="w-4 h-4 sm:ml-1 group-hover:translate-x-1.5 transition-transform relative z-10" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            );

          return (
            <div className="space-y-5 sm:space-y-8">
              <div className="flex items-center gap-2 sm:gap-4 border-b border-slate-100 dark:border-slate-800 pb-3 sm:pb-6">
                <Button variant="ghost" onClick={() => {
                  setSelectedMockCategory(null);
                  scrollToElement('test-series', { block: 'start', delay: 50 });
                }} className="p-2 sm:p-3 rounded-xl sm:rounded-2xl hover:bg-brand-50 dark:hover:bg-slate-800 shrink-0">
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 rotate-180 text-brand-600 dark:text-indigo-400" />
                </Button>
                <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                  <h3 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white capitalize truncate flex items-center gap-2">
                    {({
                      'full-length': t('exams.step2.fullLength', 'Full-Length Mock Tests'),
                      'sectional': t('exams.step2.sectional', 'Sectional Tests'),
                      'pyq': t('exams.step2.pyqTests', 'PYQ Tests'),
                      'daily': t('exams.step2.dailyWeekly', 'Daily / Weekly Tests')
                    } as Record<string, string>)[selectedMockCategory] || selectedMockCategory.replace('-', ' ') + ' Tests'}
                  </h3>
                  {selectedMockCategory === 'sectional' && (
                    <span className="bg-brand-100 dark:bg-indigo-950/60 text-brand-600 dark:text-indigo-300 text-[10px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 sm:py-1 rounded-full border border-brand-200 dark:border-indigo-800 shrink-0">{t('exams.step2.subjectWise', 'Subject-Wise')}</span>
                  )}
                </div>
              </div>
            
              {(() => {
                const matchingTests = mockTests.filter(mt => {
                  if (mt.is_archived && !hasAccessTo(mt.id, selectedExam)) return false;
                  try {
                    const cfg = JSON.parse(mt.seriesId);
                    return cfg.examId === selectedExam && cfg.category === selectedMockCategory;
                  } catch(e) { return false; }
                });

                if (matchingTests.length === 0) {
                  if (loadingDashboardData) {
                    return (
                      <div className="flex flex-col items-center justify-center p-12 space-y-4 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <div className="relative w-12 h-12 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800 border-t-[#2563EB] animate-[spin_1s_linear_infinite]" />
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm tracking-wide animate-pulse">Loading mock tests...</p>
                      </div>
                    );
                  }
                  return (
                    <div className="w-full p-12 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 bg-brand-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-brand-100/50 dark:border-slate-700">
                        <Sparkles className="w-8 h-8 text-brand-600 dark:text-brand-400 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-slate-900">{t('exams.step2.testsComingSoon', 'Tests Coming Soon')}</h3>
                        <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                          {t('exams.step2.testsComingSoonDesc', "We're preparing high-quality mock tests for this category. Stay tuned—new tests will be available soon.")}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (selectedMockCategory === 'sectional') {
                  const subjects = Array.from(new Set(matchingTests.map(mt => {
                    try {
                      return JSON.parse(mt.seriesId).subject || 'General';
                    } catch(e) {
                      return 'General';
                    }
                  }))).sort();

                  const subjectsList = ['All', ...subjects];

                  const groupedBySubject = matchingTests.reduce((acc, mt) => {
                    const subj = JSON.parse(mt.seriesId).subject || 'General';
                    if (!acc[subj]) acc[subj] = [];
                    acc[subj].push(mt);
                    return acc;
                  }, {} as Record<string, any[]>);

                  const filteredGroupedBySubject = Object.entries(groupedBySubject).filter(([subject]) => {
                    if (selectedSectionalSubject === 'All') return true;
                    return subject === selectedSectionalSubject;
                  });

                  return (
                    <div className="space-y-6 sm:space-y-8">
                      {/* Horizontal Scrollable Subject Tabs */}
                      <div 
                        className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1 sm:mx-0"
                        onWheel={(e) => {
                          const container = e.currentTarget;
                          const isAtRightEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
                          const isAtLeftEnd = container.scrollLeft <= 2;
                          if ((e.deltaY > 0 && !isAtRightEnd) || (e.deltaY < 0 && !isAtLeftEnd)) {
                            container.scrollLeft += e.deltaY * 0.85;
                          }
                        }}
                      >
                        {subjectsList.map((subj) => {
                          const isActive = selectedSectionalSubject === subj;
                          return (
                            <button
                              key={subj}
                              onClick={() => setSelectedSectionalSubject(subj)}
                              className={cn(
                                "px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all duration-200 border cursor-pointer shadow-sm",
                                isActive
                                    ? "bg-blue-600 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white font-black scale-[1.02] shadow-md shadow-blue-600/25"
                                    : "bg-white dark:bg-[#0B1528] hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                              )}
                            >
                              {subj === 'All' ? t('exams.step2.allSubjects', 'All') : subj}
                            </button>
                          );
                        })}
                      </div>

                      {/* Sectional Mocks List */}
                      <div className="space-y-5 sm:space-y-10">
                        {filteredGroupedBySubject.map(([subject, tests]) => (
                          <div key={subject} className="space-y-2.5 sm:space-y-5 cv-card-auto">
                            <h4 className="text-[13px] sm:text-xl font-black text-brand-700 dark:text-indigo-300 px-3 py-1.5 sm:px-5 sm:py-2.5 bg-brand-50/80 dark:bg-[#0B1528] rounded-lg sm:rounded-xl inline-flex items-center gap-1.5 border border-brand-100/50 dark:border-slate-800 shadow-sm">{subject}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-6">
                              {(tests as any[]).map(test => (
                                <ExamDetailMockTestCard
                                  key={test.id}
                                  test={test}
                                  isMobile={isMobile}
                                  hasAccessTo={hasAccessTo}
                                  activities={activities}
                                  handleStartTest={handleStartTest}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {matchingTests.map(test => (
                      <ExamDetailMockTestCard
                        key={test.id}
                        test={test}
                        isMobile={isMobile}
                        hasAccessTo={hasAccessTo}
                        activities={activities}
                        handleStartTest={handleStartTest}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          );
        })()}
      </section>
      )}

      {/* Section 3: Reference Library & Downloadable Question Banks */}
      {(!isMobile || mobileExamTab === 'learn') && (
        <section id="question-bank-section" className="space-y-4 sm:space-y-6 scroll-mt-24 pt-6 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-slate-100 dark:bg-slate-900 rounded-xl sm:rounded-2xl flex items-center justify-center border border-slate-200/80 dark:border-slate-800 shrink-0 mt-0.5">
              <BookMarked className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300" />
            </div>
            <div className="space-y-1 min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                <BookOpen className="w-2.5 h-2.5" /> Step 3 · PDF Reference Library
              </div>
              <h2 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">{t('exams.step3.title', 'Question Banks & Revision PDFs')}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm leading-relaxed">{t('exams.step3.subtitle', 'Downloadable PDF question modules, revision sets, and past paper collections.')}</p>
            </div>
          </div>
          
          <motion.div 
            initial={isMobile ? "show" : "hidden"}
            animate={isMobile ? "show" : undefined}
            whileInView={isMobile ? undefined : "show"}
            viewport={isMobile ? undefined : { once: true }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: isMobile ? 0.05 : 0.1 }
              }
            }}
            className={cn(
              isMobile 
                ? "flex flex-col gap-3" 
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            )}
          >
            {[
              { id: 'topic-wise', title: t('exams.step3.topicBank', 'Topic-wise Question Bank'), desc: t('exams.step3.topicBankDesc', 'Curated PDF modules categorized by subject topic.') },
              { id: 'exam-focused', title: t('exams.step3.examFocused', 'Exam-Focused High Yield'), desc: t('exams.step3.examFocusedDesc', 'Targeted high-yield questions for fast revision.') },
              { id: 'revision-sets', title: t('exams.step3.revisionSets', 'Last-Minute Revision Sets'), desc: t('exams.step3.revisionSetsDesc', 'Compact formula & key concept quick summaries.') },
              { id: 'pyq-collections', title: t('exams.step3.pyqArchives', 'PYQ Question Archives'), desc: t('exams.step3.pyqArchivesDesc', 'Previous year paper PDF archives with solutions.') },
            ].map((item, i) => {
              const vecTheme = getReferenceLibraryVectorTheme(item.id);
              const MainIcon = vecTheme.MainIcon;
              const WatermarkIcon = vecTheme.WatermarkIcon;

              const count = (dynamicQuestionBanks[item.id] || []).filter((b: any) => {
                if (b.is_archived && !hasAccessTo(b.id, selectedExam)) return false;
                if (b.examId !== selectedExam) return false;
                const mode = b.target_mode || 'both';
                return mode !== 'practice';
              }).length;

              return (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { y: 10, opacity: 0 },
                    show: { y: 0, opacity: 1 }
                  }}
                  whileHover={isMobile ? undefined : whileHover.liftTap}
                  whileTap={whileTap.press}
                  className="w-full h-full"
                >
                  {isMobile ? (
                    <div
                      onClick={() => setSelectedBankType(item.id)}
                      className="p-4 bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl flex items-center justify-between gap-4 cursor-pointer group relative overflow-hidden transition-all duration-300 shadow-sm active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md relative text-white", vecTheme.logoBg)}>
                          <MainIcon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-[14.5px] text-slate-900 dark:text-white tracking-tight leading-snug">{item.title}</h4>
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[8.5px] font-black uppercase tracking-wider rounded border border-slate-200/50 dark:border-slate-700 shrink-0">
                              {count === 1 ? t('exams.step3.resourceCountSingle', '1 Resource', { count: 1 }) : t('exams.step3.resourceCount', `${count} Resources`, { count })}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-0.5 line-clamp-2 pr-1">{item.desc}</p>
                        </div>
                      </div>
                      
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0 group-active:translate-x-0.5 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setSelectedBankType(item.id)}
                      className={cn(
                        "p-5 sm:p-6 rounded-[2.2rem] transition-all duration-500 cursor-pointer flex flex-col justify-between gap-5 relative w-full h-full card-3d-deep min-h-[260px] group",
                        vecTheme.cardBg
                      )}
                    >
                      {/* Inner Watermark & Grid Background Wrapper */}
                      <div className="absolute inset-0 pointer-events-none z-0 rounded-[2.2rem] [clip-path:inset(0_round_2.2rem)]">
                        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] bg-[radial-gradient(#0f172a_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:14px_14px]" />
                        <WatermarkIcon className={cn("absolute -right-6 -bottom-6 w-40 h-40 stroke-[1.2] transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6", vecTheme.watermarkColor)} />
                      </div>

                      <div className="space-y-3.5 relative z-10">
                        <div className="flex items-center justify-between gap-3">
                          <div className={cn(
                            "w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 text-white transition-transform group-hover:scale-110 relative",
                            vecTheme.logoBg
                          )}>
                            <MainIcon className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.2]" />
                            <div className="absolute inset-0 border border-white/30 rounded-2xl animate-pulse" />
                          </div>
                          
                          <span className={cn("px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg backdrop-blur-xs", vecTheme.countBg)}>
                            {count === 1 ? t('exams.step3.resourceCountSingle', '1 Resource', { count: 1 }) : t('exams.step3.resourceCount', `${count} Resources`, { count })}
                          </span>
                        </div>

                        <div>
                          <h4 className={cn("font-black text-lg sm:text-xl text-slate-900 dark:text-white tracking-tight leading-tight transition-colors uppercase", vecTheme.titleHover)}>{item.title}</h4>
                          <p className="text-slate-600 dark:text-slate-400 font-medium text-xs leading-relaxed mt-1.5">{item.desc}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-blue-400 relative z-10 transition-colors">
                        <span>{t('exams.step3.browsePdfLibrary', 'Browse PDF Library')}</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {/* Common View Elements */}
      {renderCommonModals()}
        </div>
      </div>
    </ErrorBoundary>
    );
  };

  return (
    <ErrorBoundary>
      <div className="w-full">
        {/* Main dashboard tabs */}
        <div>
          {renderActiveTabContent()}
        </div>
      </div>
    </ErrorBoundary>
  );
};

const WhatsAppButton = () => {
  const { user } = useAuth();
  const [isTestMode, setIsTestMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Listen for body attribute changes set by DashboardContent when a test is active
  // Also listens for data-modal-open set when any modal is shown on mobile
  useEffect(() => {
    const update = () => {
      setIsTestMode(document.body.hasAttribute('data-test-mode'));
      setIsModalOpen(document.body.hasAttribute('data-modal-open'));
    };
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-test-mode', 'data-modal-open'] });
    update(); // sync on mount
    return () => observer.disconnect();
  }, []);

  if (isTestMode) return null;
  if (user) return null; // Hide for logged-in users
  if (isModalOpen) return null; // Hide on mobile when any modal is open


  const defaultMessage = "Hello! I am reaching out from the OdishaExamPrep website. I have a query.";
  const userMessage = user?.email ? `Hello! I am ${user.email} reaching out from the OdishaExamPrep website. I have a query.` : defaultMessage;
  const whatsappUrl = `https://wa.me/917377431715?text=${encodeURIComponent(userMessage)}`;

  return (
    <motion.a 
      href={whatsappUrl}
      target="_blank" 
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.5, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={whileHover.subtle}
      whileTap={whileTap.pressMedium}
      className={cn(
        "fixed right-4 sm:right-8 z-[100] group transition-all duration-500",
        user ? "bottom-[100px] sm:bottom-8" : "bottom-6 sm:bottom-8"
      )}
    >
      {/* Outer Pulsing Ring */}
      <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-20 group-hover:opacity-40 transition-opacity" />
      
      {/* Main Button */}
      <div className="relative w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#25D366] to-[#128C7E] text-white rounded-2xl flex items-center justify-center shadow-[0_8px_30px_rgb(37,211,102,0.4)] group-hover:shadow-[0_15px_45px_rgb(37,211,102,0.6)] transition-all duration-500 overflow-hidden">
        {/* Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 sm:w-9 sm:h-9 drop-shadow-md">
          <path d="M12.031 0C5.385 0 0 5.385 0 12.029a12.022 12.022 0 001.6 6.02L0 24l6.15-1.611a12.012 12.012 0 005.881 1.523h.004c6.645 0 12.03-5.386 12.03-12.031S18.675 0 12.031 0zm0 21.936a9.988 9.988 0 01-5.086-1.385l-.364-.216-3.774.99.998-3.682-.236-.376A9.957 9.957 0 012.064 12.03c0-5.497 4.475-9.972 9.972-9.972 5.497 0 9.97 4.475 9.97 9.972s-4.473 9.97-9.97 9.97z"/>
          <path d="M17.481 14.159c-.297-.149-1.758-.868-2.03-.968-.27-.099-.467-.149-.665.149-.198.298-.767.967-.94 1.165-.173.198-.346.223-.644.074a8.214 8.214 0 01-4.041-2.518c-.282-.326.319-.314.901-1.479.098-.198.05-.371-.025-.52-.075-.149-.665-1.605-.91-2.196-.241-.578-.485-.5-.665-.509-.174-.01-.57-.01-.198 0-.52.074-.792.371C6.822 7.027 6 7.82 6 9.381c0 1.56 1.015 3.07 1.164 3.268.149.198 2.228 3.4 5.397 4.76 2.656 1.139 3.554 1.259 4.314 1.05.76-.208 2.03-.896 2.316-1.761.286-.865.286-1.605.2-1.76-.086-.15-.286-.24-.584-.388z"/>
        </svg>

        {/* Live Indicator Dot */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white rounded-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
      </div>

      {/* Premium Tooltip */}
      <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500 pointer-events-none hidden md:block">
        <div className="glass px-5 py-3 rounded-2xl shadow-2xl border border-white/20 min-w-[180px] space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support Online</span>
          </div>
          <p className="text-slate-800 font-extrabold text-sm">Need any help?</p>
          <p className="text-slate-500 text-[11px] font-medium leading-tight">Chat with our experts now for instant support.</p>
        </div>
        {/* Triangle Arrow */}
        <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-4 glass border-r border-t border-white/20 rotate-45 rounded-sm" />
      </div>
    </motion.a>
  );
};

// --- Main App ---

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    const scrollTarget = typeof window !== 'undefined' ? sessionStorage.getItem('oep_scroll_target') : null;
    if (scrollTarget) {
      sessionStorage.removeItem('oep_scroll_target');
      scrollToElement(scrollTarget, { block: 'start', behavior: 'instant', delay: 0 });
      return;
    }

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    scrollToTop({ behavior: 'instant', delay: 100 });
  }, [pathname]);

  return null;
};

function NotificationSoundListener() {
  const { toasts } = useToasterStore();
  const playedToastsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    toasts.forEach((t) => {
      if (t.visible && !playedToastsRef.current.has(t.id)) {
        playedToastsRef.current.add(t.id);
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.55;
        audio.play().catch((err) => {
          console.warn('Notification sound autoplay failed:', err);
        });
      }
    });

    const activeIds = new Set(toasts.map((t) => t.id));
    playedToastsRef.current.forEach((id) => {
      if (!activeIds.has(id)) {
        playedToastsRef.current.delete(id);
      }
    });
  }, [toasts]);

  return null;
}

const GlobalToaster = () => {
  const [theme] = useTheme();
  const isDark = theme === 'dark';

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3500,
        style: {
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: '13px',
          borderRadius: '16px',
          padding: '12px 18px',
          background: isDark ? '#0B1528' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          border: isDark ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(226, 232, 240, 0.8)',
          boxShadow: isDark ? '0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.4)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
      }}
    />
  );
};

const GlobalHorizontalScrollEngine = () => {
  useEffect(() => {
    let activeDragEl: HTMLElement | null = null;
    let startX = 0;
    let scrollLeft = 0;
    let hasMoved = false;

    const findHorizontalContainer = (target: HTMLElement | null): HTMLElement | null => {
      let curr = target;
      while (curr && curr !== document.body && curr !== document.documentElement) {
        if (
          curr.classList.contains('overflow-x-auto') ||
          curr.classList.contains('no-scrollbar') ||
          curr.dataset.horizontalScroll
        ) {
          if (curr.scrollWidth > curr.clientWidth + 1) {
            return curr;
          }
        }
        curr = curr.parentElement;
      }
      return null;
    };

    // 1. Universal Wheel Scroll Delegation: Only convert to horizontal when shiftKey is held
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey) return; // Allow natural vertical smooth scrolling via Lenis when shift is not held
      const container = findHorizontalContainer(e.target as HTMLElement);
      if (!container) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll > 0) {
        const atLeft = container.scrollLeft <= 0;
        const atRight = container.scrollLeft >= maxScroll - 1;

        if ((e.deltaY > 0 && !atRight) || (e.deltaY < 0 && !atLeft)) {
          container.scrollLeft += e.deltaY;
        }
      }
    };

    // 2. Universal Mouse Drag-to-Scroll: Grab and slide any horizontal track without blocking buttons/links
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Left-click only
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.tagName === 'BUTTON' ||
        target.closest('button, a, [role="button"]')
      ) return;

      const container = findHorizontalContainer(target);
      if (container) {
        activeDragEl = container;
        hasMoved = false;
        startX = e.pageX - container.offsetLeft;
        scrollLeft = container.scrollLeft;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!activeDragEl) return;
      const x = e.pageX - activeDragEl.offsetLeft;
      const walk = (x - startX) * 1.35;
      if (Math.abs(walk) > 4) {
        hasMoved = true;
        activeDragEl.scrollLeft = scrollLeft - walk;
      }
    };

    const onMouseUp = () => {
      if (activeDragEl && hasMoved) {
        const preventClick = (clickE: MouseEvent) => {
          clickE.stopPropagation();
          window.removeEventListener('click', preventClick, true);
        };
        window.addEventListener('click', preventClick, true);
      }
      activeDragEl = null;
      hasMoved = false;
    };

    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return null;
};

export default function App() {
  return (
    <BrowserRouter>
      {/* Single global Toaster — must be here (root) so StrictMode never renders two instances */}
      <GlobalToaster />
      <NotificationSoundListener />
      <ScrollToTop />
      <GlobalHorizontalScrollEngine />
      <AppContent />
    </BrowserRouter>
  );
}

const ExamDetailPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const { t, isOdia } = useLanguage();

  const [activities, setActivities] = useState<any[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [mainTab, setMainTab] = useState<'home' | 'courses' | 'analytics' | 'history' | 'library' | 'ai_mentor'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'courses' || tab === 'analytics' || tab === 'history' || tab === 'library' || tab === 'ai_mentor') {
      return tab as 'courses' | 'analytics' | 'history' | 'library' | 'ai_mentor';
    }
    return 'home';
  });

  const [announcements, setAnnouncements] = useState<string[]>([
    `🚀 New Mock Test Series released for OSSC CGL ${new Date().getFullYear()}`,
    "📅 OPSC Prelims exam dates announced - Check latest schedule",
    "⭐ 500+ New PYQs added for OSSSC recruitment exams",
    "🔥 Weekly Current Affairs PDF now available for download",
    "✅ Real-time rank analysis enabled for all premium mock tests"
  ]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const refreshActivities = () => {
    if (user?.id) {
      const updated = activityTracker.getActivities(user.id, user.user_metadata);
      setActivities(updated);
    }
  };

  useEffect(() => {
    refreshActivities();
  }, [user?.id]);

  // Sync tab changes to URL without navigating away from the exam detail page
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (mainTab === 'home') {
      params.delete('tab');
    } else {
      params.set('tab', mainTab);
    }
    const newSearch = params.toString();
    const newUrl = `/exams/${examId}${newSearch ? '?' + newSearch : ''}`;
    window.history.replaceState(null, '', newUrl);
  }, [mainTab, examId]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('oep-bottom-nav-visible', { detail: isBottomNavVisible }));
  }, [isBottomNavVisible]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const fetchedExams = await examService.getAllExams();
        const newsSettings = fetchedExams.find(e => e.name === 'SYSTEM_SETTINGS_NEWS_TICKER');
        if (newsSettings && newsSettings.description) {
          const parsed = JSON.parse(newsSettings.description);
          if (parsed.updates && parsed.updates.length > 0) {
            setAnnouncements(parsed.updates);
          }
        }
      } catch (e) {}
    };
    fetchUpdates();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
    scrollToTop({ behavior: 'instant', delay: 50 });
  }, [examId]);

  if (loading) {
    return <LoadingPortal />;
  }

  const handleSetSelectedExam = (val: string | null) => {
    if (val === null) {
      sessionStorage.removeItem('oep_selectedExam');
      sessionStorage.removeItem('oep_selectedExamName');
      sessionStorage.setItem('oep_scroll_target', 'exams');
      navigate('/');
    } else {
      navigate(`/exams/${val}`);
    }
  };

  const handleTabClick = (tab: 'home' | 'courses' | 'analytics' | 'history' | 'library' | 'ai_mentor') => {
    // Stay on exam detail page — tab content switches in-place, URL updated via replaceState effect
    setMainTab(tab);
  };

  const handleHomeClick = () => {
    // Return to exam home tab without leaving the exam detail page
    setMainTab('home');
  };

  if (!user) {
    // Guest view
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#060B16] flex flex-col">


        <Navbar user={null} isAdmin={false} onSignIn={() => setShowAuthModal(true)} />

        <main className="flex-1 px-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full pt-20 sm:pt-24 md:pt-28 pb-16">
          <DashboardContent 
            isGuest={true} 
            onSignIn={() => setShowAuthModal(true)} 
            selectedExam={examId} 
            setSelectedExam={handleSetSelectedExam} 
          />
        </main>
        
        <Footer />
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </div>
    );
  }

  // Authenticated user view
  return (
    <div className="flex flex-col min-h-screen min-h-[100dvh]">
      <Navbar user={user} isAdmin={isAdmin} onHomeClick={handleHomeClick} />

      <main className={cn(
        "relative flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-24 sm:pt-28 md:pt-32",
        isBottomNavVisible 
          ? "pb-20 sm:pb-24 lg:pb-28" 
          : "pb-6 sm:pb-12 lg:pb-16"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`exam-detail-${examId}`}
            initial={{ opacity: 0, scale: 0.99, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: -4 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {mainTab === 'ai_mentor' ? (
              <React.Suspense fallback={<LoadingPortal />}>
                <AiMentor user={user} />
              </React.Suspense>
            ) : (
              <DashboardContent 
                mainTab={mainTab} 
                user={user} 
                activities={activities} 
                onNavigate={handleTabClick} 
                onActivityLogged={refreshActivities} 
                selectedExam={examId} 
                setSelectedExam={handleSetSelectedExam} 
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Nav */}
      <motion.nav 
        initial={false}
        animate={{ y: isBottomNavVisible ? 0 : '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white/92 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/30 dark:border-slate-700/60 sm:glass sm:border-t sm:border-white/25 border-x-transparent border-b-transparent px-2 sm:px-8 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:py-4 flex justify-around items-center fixed bottom-0 left-0 right-0 z-30 rounded-t-[2rem] shadow-[0_-10px_35px_rgba(0,0,0,0.06)] dark:shadow-slate-950/60"
      >
        <button 
          type="button"
          onClick={() => setIsBottomNavVisible(false)}
          className="absolute -top-6 left-1/2 -translate-x-1/2 glass border-t border-l border-r border-white/35 text-slate-500 hover:text-slate-800 rounded-t-xl px-4 py-1 flex items-center justify-center cursor-pointer shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-[2px] z-40 group focus:outline-none"
          title="Hide Navigation"
        >
          <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5 duration-200" />
        </button>

        <button onClick={handleHomeClick} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'home' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
          <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
            {mainTab === 'home' && (
              <motion.div
                layoutId="activeExamDetailBottomTabPill"
                className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
              />
            )}
            <LayoutDashboard className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
          </div>
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'home' ? 'font-black' : 'font-extrabold'}`}>{t('nav.home', 'Home')}</span>
        </button>
        <button onClick={() => handleTabClick('courses')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'courses' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
          <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
            {mainTab === 'courses' && (
              <motion.div
                layoutId="activeExamDetailBottomTabPill"
                className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
              />
            )}
            <Target className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
          </div>
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'courses' ? 'font-black' : 'font-extrabold'}`}>{t('nav.studyPlan', 'Study Plan')}</span>
        </button>
        <button onClick={() => handleTabClick('analytics')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'analytics' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
          <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
            {mainTab === 'analytics' && (
              <motion.div
                layoutId="activeExamDetailBottomTabPill"
                className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
              />
            )}
            <BarChart3 className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
          </div>
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'analytics' ? 'font-black' : 'font-extrabold'}`}>{t('nav.analytics', 'Analytics')}</span>
        </button>
        <button onClick={() => handleTabClick('history')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'history' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
          <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
            {mainTab === 'history' && (
              <motion.div
                layoutId="activeExamDetailBottomTabPill"
                className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
              />
            )}
            <History className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
          </div>
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'history' ? 'font-black' : 'font-extrabold'}`}>{t('nav.history', 'History')}</span>
        </button>
        <button onClick={() => handleTabClick('library')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'library' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
          <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
            {mainTab === 'library' && (
              <motion.div
                layoutId="activeExamDetailBottomTabPill"
                className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
              />
            )}
            <BookMarked className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
          </div>
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'library' ? 'font-black' : 'font-extrabold'}`}>{t('nav.library', 'Library')}</span>
        </button>
        <button onClick={() => handleTabClick('ai_mentor')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'ai_mentor' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
          <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
            {mainTab === 'ai_mentor' && (
              <motion.div
                layoutId="activeExamDetailBottomTabPill"
                className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                transition={{ type: "spring", stiffness: 380, damping: 25 }}
              />
            )}
            <Sparkles className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
          </div>
          <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'ai_mentor' ? 'font-black' : 'font-extrabold'}`}>{t('nav.aiMentor', 'AI Mentor')}</span>
        </button>
      </motion.nav>

      <AnimatePresence>
        {!isBottomNavVisible && (
          <motion.button 
            initial={{ y: 50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 50, opacity: 0, x: '-50%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            type="button"
            onClick={() => setIsBottomNavVisible(true)}
            className="fixed bottom-0 left-1/2 glass border-t border-l border-r border-white/35 text-slate-500 hover:text-slate-800 rounded-t-xl px-5 py-1.5 flex items-center justify-center cursor-pointer shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md z-40 group focus:outline-none transition-all duration-300 hover:-translate-y-[2px]"
            title="Show Navigation"
          >
            <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 duration-200" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const tabVariants = {
  enter: (dir: number) => ({
    x: dir === 0 ? 0 : (dir > 0 ? 20 : -20),
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir === 0 ? 0 : (dir > 0 ? -20 : 20),
    opacity: 0,
  }),
};

function AppContent() {
  const { user, loading, isAdmin, logout } = useAuth();
  const { t, isOdia } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear stale bank item modal state on every app load.
  // This prevents a hard refresh from restoring a sessionStorage key that causes
  // the body to be blurred/locked before the modal has a chance to render.
  useEffect(() => {
    sessionStorage.removeItem('oep_selectedBankItem');
    const lenis = initLenis();
    return () => {
      destroyLenis();
    };
  }, []);

  // Register service worker on app start (for push notifications)
  useEffect(() => {
    registerServiceWorker().catch(console.error);
  }, []);

  // Listen for navigation messages from the service worker (e.g. on push notification click)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'NAVIGATE' && event.data.url) {
        try {
          const url = new URL(event.data.url);
          const path = url.pathname + url.search + url.hash;
          navigate(path);
        } catch (err) {
          console.error('[SW Message] Failed to parse URL:', err);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, [navigate]);

  const [mainTab, setMainTab] = useState<'home' | 'courses' | 'analytics' | 'history' | 'library' | 'ai_mentor'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'courses' || tab === 'analytics' || tab === 'history' || tab === 'library' || tab === 'ai_mentor') {
      return tab as 'courses' | 'analytics' | 'history' | 'library' | 'ai_mentor';
    }
    return 'home';
  });

  // Track previous tab to determine slide direction
  const prevTabRef = useRef(mainTab);
  const prevTab = prevTabRef.current;
  let tabDirection = 0;
  if (prevTab !== mainTab) {
    const tabsOrder = ['home', 'courses', 'analytics', 'history', 'library', 'ai_mentor'];
    const prevIdx = tabsOrder.indexOf(prevTab);
    const currentIdx = tabsOrder.indexOf(mainTab);
    if (prevIdx !== -1 && currentIdx !== -1) {
      tabDirection = currentIdx > prevIdx ? 1 : -1;
    }
    prevTabRef.current = mainTab;
  }

  const [isBottomNavVisible, setIsBottomNavVisible] = useState(true);
  const [showWelcomeVideoModal, setShowWelcomeVideoModal] = useState(false);
  const [showOnboardingTourModal, setShowOnboardingTourModal] = useState(false);

  // Auto show tutorial video for newly registered logged-in users ONLY
  useEffect(() => {
    if (!user || loading) {
      setShowWelcomeVideoModal(false);
      return;
    }
    const userKey = `oep_welcome_video_seen_${user.id}`;
    const hasSeenVideo = localStorage.getItem(userKey) || localStorage.getItem('oep_welcome_video_seen');
    if (!hasSeenVideo) {
      setShowWelcomeVideoModal(true);
    }
  }, [user, loading]);

  const handleCloseWelcomeVideo = () => {
    setShowWelcomeVideoModal(false);
    localStorage.setItem('oep_welcome_video_seen', 'true');
    if (user?.id) {
      localStorage.setItem(`oep_welcome_video_seen_${user.id}`, 'true');
    }
  };

  // Listen for custom event to open video tutorial anytime on demand
  useEffect(() => {
    const handleOpenVideo = () => setShowWelcomeVideoModal(true);
    window.addEventListener('oep-open-tutorial-video', handleOpenVideo);
    return () => window.removeEventListener('oep-open-tutorial-video', handleOpenVideo);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('oep-bottom-nav-visible', { detail: isBottomNavVisible }));
  }, [isBottomNavVisible]);

  const handleTabClick = (tab: 'home' | 'courses' | 'analytics' | 'history' | 'library' | 'ai_mentor') => {
    setMainTab(tab);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  // Reset Password recovery states
  const [showResetModal, setShowResetModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setShowResetModal(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setResetMessage(null);
  }, [newPassword, confirmNewPassword]);

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    if (newPassword !== confirmNewPassword) {
      setResetMessage({
        type: 'error',
        text: 'Passwords do not match!'
      });
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setResetMessage({
        type: 'success',
        text: 'Password updated successfully! Redirecting...'
      });
      setTimeout(() => {
        setShowResetModal(false);
        setNewPassword('');
        setConfirmNewPassword('');
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      setResetMessage({
        type: 'error',
        text: error.message || 'Failed to update password.'
      });
    } finally {
      setIsResetting(false);
    }
  };

  useEffect(() => {
    if (location.pathname !== '/') return;
    const params = new URLSearchParams(window.location.search);
    if (mainTab === 'home') {
      params.delete('tab');
    } else {
      params.set('tab', mainTab);
    }
    const newSearch = params.toString();
    const newUrl = `${window.location.pathname}${newSearch ? '?' + newSearch : ''}${window.location.hash}`;
    window.history.replaceState(null, '', newUrl);
  }, [mainTab, location.pathname]);

  // Sync URL query tab parameter to local state when location/URL changes (e.g. back navigation or direct tab link)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (location.pathname === '/') {
      if (tab === 'courses' || tab === 'analytics' || tab === 'history' || tab === 'library' || tab === 'ai_mentor') {
        if (mainTab !== tab) {
          setMainTab(tab as any);
        }
      } else {
        if (mainTab !== 'home') {
          setMainTab('home');
        }
      }
    }
  }, [location.search, location.pathname]);

  const [dashboardKey, setDashboardKey] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);

  // Fetch activities from DB asynchronously (lightweight metadata, bounded limit)
  const fetchActivitiesFromDB = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('activities')
        .select('id, userId, type, title, timestamp, score, totalMarks, accuracy, timeSpent, metadata')
        .eq('userId', userId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const localKey = `oep_activities_${userId}`;
        let localActivities: any[] = [];
        try {
          const raw = localStorage.getItem(localKey);
          if (raw) localActivities = JSON.parse(raw);
        } catch { /* ignore */ }

        const localMap = new Map((Array.isArray(localActivities) ? localActivities : []).map(a => [a.id, a]));

        // Merge DB rows while preserving any local heavy test questions for offline resume
        const merged = data.map(dbItem => {
          const localItem = localMap.get(dbItem.id);
          if (localItem && Array.isArray(localItem.metadata?.test?.questions) && localItem.metadata.test.questions.length > 0) {
            return localItem; // Preserve local heavy version for resume
          }
          return dbItem;
        });

        // Save merged list to localStorage so synchronous getActivities reads fresh state
        try {
          localStorage.setItem(localKey, JSON.stringify(merged));
        } catch { /* ignore storage errors */ }
        
        // Update state in App.tsx
        setActivities(merged);
        
        // Dispatch event to notify AnalyticsView and other listeners
        window.dispatchEvent(new CustomEvent('oep-activity-changed'));
      }
    } catch (err) {
      console.error('Error fetching activities from DB:', err);
    }
  }, []);

  // Clean up stale sessionStorage key that previously caused Practice Mode
  // to reopen unexpectedly when navigating to Dashboard from Library tab.
  useEffect(() => {
    sessionStorage.removeItem('oep_showPracticeConfig');
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setActivities([]);
      return;
    }

    // Load initial activities (merges local + cloud, prefers local which has full question data)
    const initialActivities = activityTracker.getActivities(user.id, user.user_metadata);
    setActivities(initialActivities);

    // Fetch fresh from DB in the background
    fetchActivitiesFromDB(user.id);

    // Set up Realtime subscription to receive updates from other devices instantly
    // Update local state directly without re-downloading the entire DB table
    const channel = supabase
      .channel(`realtime-activities-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'activities',
          filter: `userId=eq.${user.id}`
        },
        (payload) => {
          console.log('[Realtime] Activity change received:', payload);
          if (payload.eventType === 'INSERT' && payload.new) {
            setActivities(prev => {
              const exists = prev.some(a => a.id === payload.new.id);
              if (exists) return prev;
              return [payload.new, ...prev].slice(0, 50);
            });
            window.dispatchEvent(new CustomEvent('oep-activity-changed'));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setActivities(prev => prev.map(a => a.id === payload.new.id ? { ...a, ...payload.new } : a));
            window.dispatchEvent(new CustomEvent('oep-activity-changed'));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setActivities(prev => prev.filter(a => a.id !== payload.old.id));
            window.dispatchEvent(new CustomEvent('oep-activity-changed'));
          }
        }
      )
      .subscribe();

    // ── One-time metadata repair for old accounts (deferred to idle time) ────────
    const repairTimer = setTimeout(() => {
      const cloudActivities = user?.user_metadata?.activities;
      const metaSize = JSON.stringify(user?.user_metadata || {}).length;
      if (Array.isArray(cloudActivities) && metaSize > 2000) {
        const repaired = cloudActivities.slice(0, 30).map((a: any) => {
          if (!a) return null;
          const m = a.metadata || {};
          const lightMeta: any = {
            examName: m.examName,
            testCategory: m.testCategory,
            bankType: m.bankType,
            bankId: m.bankId,
            resumeSessionId: m.resumeSessionId,
          };
          if (a.type === 'test_incomplete') {
            lightMeta.currentQuestionIndex = m.currentQuestionIndex;
            lightMeta.timeLeft = m.timeLeft;
            lightMeta.totalQuestions = m.totalQuestions || 0;
            if (m.test && typeof m.test === 'object') {
              lightMeta.test = {
                id: m.test.id,
                title: m.test.title,
                durationMinutes: m.test.durationMinutes,
                _questionCount: m.test._questionCount ||
                  (Array.isArray(m.test.questions) ? m.test.questions.length : 0),
              };
            }
          }
          return { id: a.id, type: a.type, title: a.title, timestamp: a.timestamp,
                   score: a.score, accuracy: a.accuracy, metadata: lightMeta };
        }).filter(Boolean);
        supabase.auth.updateUser({ data: { activities: repaired } }).catch(
          (e: any) => console.warn('Metadata repair failed (non-fatal):', e)
        );
      }
    }, 3000);

    return () => {
      clearTimeout(repairTimer);
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchActivitiesFromDB]);

  // Clear dashboard cache on logout so a different account sees fresh data
  useEffect(() => {
    if (!loading && !user) {
      _dashboardCache.exams = [];
      _dashboardCache.testSeries = [];
      _dashboardCache.mockTests = [];
      _dashboardCache.dynamicQuestionBanks = {};
      _dashboardCache.loadedForUserId = null;
      _dashboardCache.hasFetchedThisSession = false;
      sessionStorage.removeItem('oep_selectedExam');
      sessionStorage.removeItem('oep_selectedBankType');
      sessionStorage.removeItem('oep_practiceSettings');
      sessionStorage.removeItem('oep_selectedMockCategory');
      sessionStorage.removeItem('oep_selectedPracticeCategory');
      sessionStorage.removeItem('oep_auto_navigated_dismissed');
      sessionStorage.removeItem('oep_cached_exams');
      sessionStorage.removeItem('oep_cached_testSeries');
      sessionStorage.removeItem('oep_cached_mockTests');
      sessionStorage.removeItem('oep_cached_dynamicQuestionBanks');
      sessionStorage.removeItem('oep_cached_loadedForUserId');
      setMainTab('home');
    }
  }, [user, loading]);

  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Only clear session data if we transition between different user sessions
    if (prevUserIdRef.current !== null && user?.id !== prevUserIdRef.current) {
      sessionStorage.removeItem('oep_selectedExam');
      sessionStorage.removeItem('oep_selectedBankType');
      sessionStorage.removeItem('oep_practiceSettings');
      sessionStorage.removeItem('oep_selectedMockCategory');
      sessionStorage.removeItem('oep_selectedPracticeCategory');
      sessionStorage.removeItem('oep_auto_navigated_dismissed');
      sessionStorage.removeItem('oep_cached_exams');
      sessionStorage.removeItem('oep_cached_testSeries');
      sessionStorage.removeItem('oep_cached_mockTests');
      sessionStorage.removeItem('oep_cached_dynamicQuestionBanks');
      sessionStorage.removeItem('oep_cached_loadedForUserId');
      _dashboardCache.exams = [];
      _dashboardCache.testSeries = [];
      _dashboardCache.mockTests = [];
      _dashboardCache.dynamicQuestionBanks = {};
      _dashboardCache.loadedForUserId = null;
      _dashboardCache.hasFetchedThisSession = false;
    }
    prevUserIdRef.current = user?.id || null;
  }, [user?.id]);

  const refreshActivities = () => {
    if (user?.id) {
       fetchActivitiesFromDB(user.id);
    }
  };

  const handleHomeClick = () => {
    setMainTab('home');
    setDashboardKey(prev => prev + 1);
    navigate('/');
  };


  const isMobileApp = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('app') === 'true') {
      localStorage.setItem('oep_is_mobile_app', 'true');
      return true;
    }
    return localStorage.getItem('oep_is_mobile_app') === 'true' || navigator.userAgent.includes('OdishaExamPrepApp');
  }, []);

  const isAIOctive = !!(user && mainTab === 'ai_mentor' && location.pathname === '/');

  if (loading) {
    return <LoadingPortal />;
  }

  if (isMobileApp && !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Same mesh and grid backgrounds as LandingPage to feel premium and continuous */}
        <div className="absolute inset-0 -z-10 mesh-bg" />
        <div className="absolute inset-0 -z-10 grid-bg opacity-60" />
        <AuthModal isOpen={true} onClose={() => {}} hideCloseButton={true} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden min-h-screen min-h-[100dvh] bg-[#F8FAFC] dark:bg-[#060B16] font-sans text-slate-900 dark:text-slate-100">
      {isAIOctive && (
        <div className="w-full max-w-full overflow-x-hidden flex flex-col min-h-screen min-h-[100dvh]">
          <Navbar user={user} isAdmin={isAdmin} onHomeClick={handleHomeClick} />

          <main className={cn(
            "relative flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full overflow-x-hidden pt-20 sm:pt-24 md:pt-28",
            isBottomNavVisible 
              ? "pb-20 sm:pb-24 lg:pb-28" 
              : "pb-6 sm:pb-12 lg:pb-16"
          )}>
            <React.Suspense fallback={<LoadingPortal />}>
              <AiMentor user={user} />
            </React.Suspense>
          </main>

          {/* Mobile Bottom Nav */}
          <motion.nav 
            initial={false}
            animate={{ y: isBottomNavVisible ? 0 : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white/92 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/30 dark:border-slate-700/60 sm:glass sm:border-t sm:border-white/25 border-x-transparent border-b-transparent px-2 sm:px-8 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:py-4 flex justify-around items-center fixed bottom-0 left-0 right-0 z-30 rounded-t-[2rem] shadow-[0_-10px_35px_rgba(0,0,0,0.06)] dark:shadow-slate-950/60"
          >
            {/* Hide Navigation Toggle Tab */}
            <button 
              type="button"
              onClick={() => setIsBottomNavVisible(false)}
              className="absolute -top-6 left-1/2 -translate-x-1/2 glass border-t border-l border-r border-white/35 text-slate-500 hover:text-slate-800 rounded-t-xl px-4 py-1 flex items-center justify-center cursor-pointer shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-[2px] z-40 group focus:outline-none"
              title="Hide Navigation"
            >
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5 duration-200" />
            </button>

            <button data-tour="bottom-nav-home" onClick={handleHomeClick} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'home' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
              <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                {mainTab === 'home' && (
                  <motion.div
                    layoutId="activeAppContentBottomTabPill"
                    className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  />
                )}
                <LayoutDashboard className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
              </div>
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'home' ? 'font-black' : 'font-extrabold'}`}>{t('nav.home', 'Home')}</span>
            </button>
            <button data-tour="bottom-nav-courses" onClick={() => handleTabClick('courses')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'courses' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
              <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                {mainTab === 'courses' && (
                  <motion.div
                    layoutId="activeAppContentBottomTabPill"
                    className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  />
                )}
                <Target className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
              </div>
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'courses' ? 'font-black' : 'font-extrabold'}`}>{t('nav.studyPlan', 'Study Plan')}</span>
            </button>
            <button data-tour="bottom-nav-analytics" onClick={() => handleTabClick('analytics')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'analytics' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
              <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                {mainTab === 'analytics' && (
                  <motion.div
                    layoutId="activeAppContentBottomTabPill"
                    className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  />
                )}
                <BarChart3 className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
              </div>
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'analytics' ? 'font-black' : 'font-extrabold'}`}>{t('nav.analytics', 'Analytics')}</span>
            </button>
            <button data-tour="bottom-nav-history" onClick={() => handleTabClick('history')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'history' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
              <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                {mainTab === 'history' && (
                  <motion.div
                    layoutId="activeAppContentBottomTabPill"
                    className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  />
                )}
                <History className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
              </div>
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'history' ? 'font-black' : 'font-extrabold'}`}>{t('nav.history', 'History')}</span>
            </button>
            <button data-tour="bottom-nav-library" onClick={() => handleTabClick('library')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'library' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
              <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                {mainTab === 'library' && (
                  <motion.div
                    layoutId="activeAppContentBottomTabPill"
                    className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  />
                )}
                <BookMarked className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
              </div>
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'library' ? 'font-black' : 'font-extrabold'}`}>{t('nav.library', 'Library')}</span>
            </button>
            <button data-tour="bottom-nav-ai_mentor" onClick={() => handleTabClick('ai_mentor')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'ai_mentor' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
              <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                {mainTab === 'ai_mentor' && (
                  <motion.div
                    layoutId="activeAppContentBottomTabPill"
                    className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                    transition={{ type: "spring", stiffness: 380, damping: 25 }}
                  />
                )}
                <Sparkles className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
              </div>
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'ai_mentor' ? 'font-black' : 'font-extrabold'}`}>{t('nav.aiMentor', 'AI Mentor')}</span>
            </button>
          </motion.nav>

          {/* Show Navigation Trigger Tab */}
          <AnimatePresence>
            {!isBottomNavVisible && (
              <motion.button 
                initial={{ y: 50, opacity: 0, x: '-50%' }}
                animate={{ y: 0, opacity: 1, x: '-50%' }}
                exit={{ y: 50, opacity: 0, x: '-50%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                type="button"
                onClick={() => setIsBottomNavVisible(true)}
                className="fixed bottom-0 left-1/2 glass border-t border-l border-r border-white/35 text-slate-500 hover:text-slate-800 rounded-t-xl px-5 py-1.5 flex items-center justify-center cursor-pointer shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md z-40 group focus:outline-none transition-all duration-300 hover:-translate-y-[2px]"
                title="Show Navigation"
              >
                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 duration-200" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      <div className={isAIOctive ? 'hidden' : 'block'}>
        <AnimatedRoutes>
        <Route path={ROUTE_PATHS.ADMIN_LOGIN} element={<AdminLoginPage />} />
        <Route path={ROUTE_PATHS.PRIVACY_POLICY} element={<PrivacyPolicy />} />
        <Route path={ROUTE_PATHS.TERMS_OF_SERVICE} element={<TermsOfService />} />
        <Route path={ROUTE_PATHS.REFUND_POLICY} element={<RefundPolicy />} />
        <Route path={ROUTE_PATHS.BLOG} element={<BlogList />} />
        <Route path={ROUTE_PATHS.BLOG_DETAIL} element={<BlogPost />} />
        <Route path="/blog/preview/:id" element={<BlogPost />} />
        <Route path={ROUTE_PATHS.CURRENT_AFFAIRS} element={<CurrentAffairsPage />} />
        <Route 
          path={ROUTE_PATHS.ADMIN} 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route path={ROUTE_PATHS.EXAM_DETAIL} element={<ExamDetailPage />} />
        <Route 
          path={ROUTE_PATHS.HOME} 
          element={
            !user ? (
              <LandingPage />
            ) : (
              <div className="flex flex-col min-h-screen min-h-[100dvh]">
                <Navbar user={user} isAdmin={isAdmin} onHomeClick={handleHomeClick} />

                <main className={cn(
                  "relative flex-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pt-24 sm:pt-28 md:pt-32",
                  isBottomNavVisible 
                    ? "pb-20 sm:pb-24 lg:pb-28" 
                    : "pb-6 sm:pb-12 lg:pb-16"
                )}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={`${mainTab}-${dashboardKey}`}
                      custom={tabDirection}
                      variants={tabVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 350, damping: 30 },
                        opacity: { duration: 0.18, ease: "easeInOut" }
                      }}
                      className="w-full"
                    >
                      <DashboardContent 
                        mainTab={mainTab} 
                        user={user} 
                        activities={activities} 
                        onNavigate={setMainTab} 
                        onActivityLogged={refreshActivities} 
                        selectedExam={null}
                        setSelectedExam={(id) => {
                          if (id) navigate(`/exams/${id}`);
                        }}
                      />
                    </motion.div>
                  </AnimatePresence>
                </main>

                {/* Mobile Bottom Nav */}
                <motion.nav 
                  initial={false}
                  animate={{ y: isBottomNavVisible ? 0 : '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="bg-white/92 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/30 dark:border-slate-700/60 sm:glass sm:border-t sm:border-white/25 border-x-transparent border-b-transparent px-2 sm:px-8 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] sm:py-4 flex justify-around items-center fixed bottom-0 left-0 right-0 z-30 rounded-t-[2rem] shadow-[0_-10px_35px_rgba(0,0,0,0.06)] dark:shadow-slate-950/60"
                >
                  {/* Hide Navigation Toggle Tab */}
                  <button 
                    type="button"
                    onClick={() => setIsBottomNavVisible(false)}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 glass border-t border-l border-r border-white/35 text-slate-500 hover:text-slate-800 rounded-t-xl px-4 py-1 flex items-center justify-center cursor-pointer shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-[2px] z-40 group focus:outline-none"
                    title="Hide Navigation"
                  >
                    <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5 duration-200" />
                  </button>

                  <button onClick={handleHomeClick} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'home' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
                    <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                      {mainTab === 'home' && (
                        <motion.div
                          layoutId="activeAppContentBottomTabPill"
                          className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                          transition={{ type: "spring", stiffness: 380, damping: 25 }}
                        />
                      )}
                      <LayoutDashboard className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'home' ? 'font-black' : 'font-extrabold'}`}>{t('nav.home', 'Home')}</span>
                  </button>
                  <button onClick={() => handleTabClick('courses')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'courses' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
                    <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                      {mainTab === 'courses' && (
                        <motion.div
                          layoutId="activeAppContentBottomTabPill"
                          className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                          transition={{ type: "spring", stiffness: 380, damping: 25 }}
                        />
                      )}
                      <Target className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'courses' ? 'font-black' : 'font-extrabold'}`}>{t('nav.studyPlan', 'Study Plan')}</span>
                  </button>
                  <button onClick={() => handleTabClick('analytics')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'analytics' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
                    <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                      {mainTab === 'analytics' && (
                        <motion.div
                          layoutId="activeAppContentBottomTabPill"
                          className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                          transition={{ type: "spring", stiffness: 380, damping: 25 }}
                        />
                      )}
                      <BarChart3 className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'analytics' ? 'font-black' : 'font-extrabold'}`}>{t('nav.analytics', 'Analytics')}</span>
                  </button>
                  <button onClick={() => handleTabClick('history')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'history' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
                    <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                      {mainTab === 'history' && (
                        <motion.div
                          layoutId="activeAppContentBottomTabPill"
                          className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                          transition={{ type: "spring", stiffness: 380, damping: 25 }}
                        />
                      )}
                      <History className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'history' ? 'font-black' : 'font-extrabold'}`}>{t('nav.history', 'History')}</span>
                  </button>
                  <button onClick={() => handleTabClick('library')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'library' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
                    <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                      {mainTab === 'library' && (
                        <motion.div
                          layoutId="activeAppContentBottomTabPill"
                          className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                          transition={{ type: "spring", stiffness: 380, damping: 25 }}
                        />
                      )}
                      <BookMarked className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'library' ? 'font-black' : 'font-extrabold'}`}>{t('nav.library', 'Library')}</span>
                  </button>
                  <button onClick={() => handleTabClick('ai_mentor')} className={`flex flex-col items-center gap-1 sm:gap-1.5 group ${mainTab === 'ai_mentor' ? 'text-brand-650' : 'text-slate-500 hover:text-slate-800'}`}>
                    <div className="relative p-1.5 sm:p-2 rounded-xl group-hover:scale-115 transition-all duration-300 border border-transparent flex items-center justify-center">
                      {mainTab === 'ai_mentor' && (
                        <motion.div
                          layoutId="activeAppContentBottomTabPill"
                          className="absolute inset-0 bg-brand-500/12 border border-brand-500/20 rounded-xl shadow-xs backdrop-blur-xs z-0"
                          transition={{ type: "spring", stiffness: 380, damping: 25 }}
                        />
                      )}
                      <Sparkles className="w-5.5 h-5.5 sm:w-6 sm:h-6 relative z-10" />
                    </div>
                    <span className={`text-[9px] sm:text-[10px] uppercase tracking-wide sm:tracking-widest ${mainTab === 'ai_mentor' ? 'font-black' : 'font-extrabold'}`}>{t('nav.aiMentor', 'AI Mentor')}</span>
                  </button>
                </motion.nav>

                {/* Show Navigation Trigger Tab */}
                <AnimatePresence>
                  {!isBottomNavVisible && (
                    <motion.button 
                      initial={{ y: 50, opacity: 0, x: '-50%' }}
                      animate={{ y: 0, opacity: 1, x: '-50%' }}
                      exit={{ y: 50, opacity: 0, x: '-50%' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      type="button"
                      onClick={() => setIsBottomNavVisible(true)}
                      className="fixed bottom-0 left-1/2 glass border-t border-l border-r border-white/35 text-slate-500 hover:text-slate-800 rounded-t-xl px-5 py-1.5 flex items-center justify-center cursor-pointer shadow-[0_-4px_12px_rgba(0,0,0,0.04)] backdrop-blur-md z-40 group focus:outline-none transition-all duration-300 hover:-translate-y-[2px]"
                      title="Show Navigation"
                    >
                      <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 duration-200" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )
          } 
        />
        <Route path={ROUTE_PATHS.NOT_FOUND} element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </AnimatedRoutes>
    </div>
      {!(location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-login')) && (
        <WhatsAppButton />
      )}
      {!(location.pathname.startsWith('/admin') || location.pathname.startsWith('/admin-login')) && (
        <StickyAICompanion 
          isBottomNavVisible={isBottomNavVisible} 
          activeTab={location.pathname.startsWith('/blog') ? 'blog' : mainTab} 
        />
      )}

      {/* Push Notification Permission Prompt - only for logged-in users */}
      {user && !location.pathname.startsWith('/admin') && (
        <PushPermissionPrompt userId={user.id} trigger="auto" />
      )}

      <AnimatePresence mode="wait">
        {showResetModal && (
          <>
            {/* Animated backdrop */}
            <motion.div
              key="reset-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 bg-slate-950/50 z-[999] backdrop-blur-md"
              style={{ willChange: 'opacity' }}
              onClick={() => setShowResetModal(false)}
            />

            {/* Modal panel wrapper */}
            <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center pointer-events-none p-0 sm:p-6">
              <motion.div 
                key="reset-modal"
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 320,
                  damping: 32,
                  mass: 0.9,
                }}
                className="glass rounded-t-[2rem] sm:rounded-3xl w-full max-w-md p-6 sm:p-10 pb-10 sm:pb-10 space-y-6 sm:space-y-8 shadow-2xl border-x-0 border-b-0 sm:border border-white/40 max-h-[92vh] overflow-y-auto no-scrollbar pointer-events-auto"
                style={{ willChange: 'transform, opacity' }}
              >
                {/* Drag handle (mobile only) */}
                <div className="sm:hidden w-10 h-1 bg-slate-200 rounded-full mx-auto -mt-2 mb-2 shrink-0" />

                <div className="flex justify-between items-center sticky top-0 bg-white/0 z-10">
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
                    Create New Password
                  </h3>
                  <button 
                    onClick={() => setShowResetModal(false)} 
                    className="p-2 -mr-2 bg-slate-100/50 hover:bg-slate-200/50 rounded-full transition-colors backdrop-blur-md cursor-pointer"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {resetMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 border rounded-2xl flex items-start gap-3 text-xs font-semibold leading-relaxed shadow-sm",
                      resetMessage.type === 'error' && "bg-rose-50 border-rose-100/80 text-rose-700",
                      resetMessage.type === 'success' && "bg-emerald-50 border-emerald-100/80 text-emerald-700"
                    )}
                  >
                    {resetMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                    {resetMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                    <div className="flex-1">
                      {resetMessage.text}
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleResetSubmit} className="space-y-5">
                  <div className="space-y-4">
                    {/* New Password field */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider pl-1">
                        New Password
                      </label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/60 bg-white/50 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium text-base pr-12" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password field */}
                    <div className="space-y-1.5 text-left">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider pl-1">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          placeholder="••••••••" 
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          required
                          className="w-full px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border border-slate-200/60 bg-white/50 focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium text-base pr-12" 
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isResetting}
                    className="w-full py-3.5 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg"
                  >
                    {isResetting ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {user && (
        <>
          <WelcomeVideoModal 
            isOpen={showWelcomeVideoModal} 
            onClose={handleCloseWelcomeVideo} 
            onStartTour={() => {
              handleCloseWelcomeVideo();
              setShowOnboardingTourModal(true);
            }} 
          />
          <OnboardingTour 
            userId={user.id}
            mainTab={mainTab}
            onNavigate={(tab) => handleTabClick(tab)}
            isOpenManual={showOnboardingTourModal} 
            onCloseManual={() => setShowOnboardingTourModal(false)} 
          />
        </>
      )}
    </div>
  );
}