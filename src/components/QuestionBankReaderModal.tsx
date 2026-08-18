import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Search, 
  Eye, 
  EyeOff, 
  Download, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  Printer,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { MathTextRenderer } from './MathTextRenderer';
import UniversalMathDiagramEngine from './UniversalMathDiagramEngine';
import { exportQuestionBankToPdf } from '../lib/pdfExportEngine';
import { examService } from '../lib/examService';
import { cn } from '../lib/utils';

export interface QuestionBankReaderItem {
  id: string;
  examId?: string;
  title: string;
  type?: string;
  questionCount?: number;
  questions?: any[];
  tagline?: string;
  pdfUrl?: string;
  image?: string;
  isPremium?: boolean;
}

interface QuestionBankReaderModalProps {
  isOpen: boolean;
  bank: QuestionBankReaderItem | null;
  examName?: string;
  onClose: () => void;
  onUnlockRequired?: () => void;
  hasAccess?: boolean;
}

interface QuestionCardItemProps {
  q: any;
  qNum: number;
  idx: number;
  showAllAnswers: boolean;
  userChoice: number | undefined;
  isExplanationExpanded: boolean;
  onOptionClick: (qIndex: number, optIndex: number) => void;
  onToggleExplanation: (qIndex: number) => void;
}

const QuestionCardItem = React.memo<QuestionCardItemProps>(({
  q,
  qNum,
  idx,
  showAllAnswers,
  userChoice,
  isExplanationExpanded,
  onOptionClick,
  onToggleExplanation,
}) => {
  const rawText = q.questionText || q.question || '';
  const ansIdx = q.correctAnswerIndex !== undefined 
    ? q.correctAnswerIndex 
    : (typeof q.answer === 'number' ? q.answer : (typeof q.answer === 'string' && ['A','B','C','D'].indexOf(q.answer.toUpperCase()) !== -1 ? ['A','B','C','D'].indexOf(q.answer.toUpperCase()) : undefined));
  
  const hasAnswer = ansIdx !== undefined;
  const isRevealed = showAllAnswers;

  return (
    <div
      className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-brand-200 dark:hover:border-brand-800/80 transition-colors duration-150 cv-card-auto"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black tracking-wider shrink-0 mt-0.5">
            Q.{qNum}
          </span>
          <div className="text-slate-900 dark:text-white font-bold text-sm sm:text-base leading-relaxed flex-1">
            <MathTextRenderer text={rawText} />
          </div>
        </div>
      </div>

      {/* Diagram if present */}
      {q.diagram && (
        <div className="my-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex justify-center">
          <UniversalMathDiagramEngine data={q.diagram} />
        </div>
      )}

      {/* Options Grid */}
      {Array.isArray(q.options) && q.options.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          {q.options.map((optionText: string, oIdx: number) => {
            const optLetter = ['A', 'B', 'C', 'D', 'E'][oIdx] || `(${oIdx + 1})`;
            const isCorrect = hasAnswer && ansIdx === oIdx;
            const isSelectedByUser = userChoice === oIdx;
            
            let tileStyle = "bg-slate-50/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800";
            let badgeStyle = "bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600";

            if (isRevealed && isCorrect) {
              tileStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs";
              badgeStyle = "bg-emerald-600 text-white border-emerald-600";
            } else if (isSelectedByUser) {
              if (hasAnswer && isRevealed && !isCorrect) {
                tileStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-bold";
                badgeStyle = "bg-rose-600 text-white border-rose-600";
              } else {
                tileStyle = "bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 text-brand-900 dark:text-brand-200 font-bold shadow-xs";
                badgeStyle = "bg-brand-600 text-white border-brand-600";
              }
            }

            return (
              <button
                key={oIdx}
                type="button"
                onClick={() => onOptionClick(idx, oIdx)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl border text-left text-xs sm:text-sm transition-all duration-150 cursor-pointer relative",
                  tileStyle
                )}
              >
                <span className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 border mt-0.5",
                  badgeStyle
                )}>
                  {optLetter}
                </span>
                <div className="flex-1 leading-snug pt-0.5">
                  <MathTextRenderer text={optionText} isOption />
                </div>
                {isRevealed && isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Reveal Answer / Explanation Action Area */}
      {hasAnswer && (
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
              Answer:
            </span>
            <span className={cn(
              "px-2.5 py-0.5 rounded-md text-xs font-black",
              isRevealed
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400"
            )}>
              {isRevealed ? `Option (${['A','B','C','D','E'][ansIdx!] || ansIdx! + 1})` : 'Hidden'}
            </span>
          </div>

          {q.explanation && (
            <button
              type="button"
              onClick={() => onToggleExplanation(idx)}
              className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 hover:text-brand-700 cursor-pointer"
            >
              <span>{isExplanationExpanded || showAllAnswers ? 'Hide Solution' : '💡 View Solution'}</span>
              {isExplanationExpanded || showAllAnswers ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      )}

      {/* Collapsible Solution Box */}
      {q.explanation && (isExplanationExpanded || showAllAnswers) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 text-xs sm:text-sm text-slate-700 dark:text-slate-300"
        >
          <div className="font-black text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Detailed Explanation:
          </div>
          <div className="leading-relaxed">
            <MathTextRenderer text={q.explanation} />
          </div>
        </motion.div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.q === nextProps.q &&
    prevProps.qNum === nextProps.qNum &&
    prevProps.idx === nextProps.idx &&
    prevProps.showAllAnswers === nextProps.showAllAnswers &&
    prevProps.userChoice === nextProps.userChoice &&
    prevProps.isExplanationExpanded === nextProps.isExplanationExpanded
  );
});

export const QuestionBankReaderModal: React.FC<QuestionBankReaderModalProps> = ({
  isOpen,
  bank,
  examName = 'Odisha Competitive Exams',
  onClose,
  onUnlockRequired,
  hasAccess = true
}) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'answered' | 'unanswered'>('all');
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [userSelectedOptions, setUserSelectedOptions] = useState<Record<number, number>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState(true);
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  // Modal Lenis Kinetic Scroll Engine — Match main website smooth scroll physics
  useEffect(() => {
    if (!isOpen || !modalScrollRef.current) return;

    const modalLenis = new Lenis({
      wrapper: modalScrollRef.current,
      lerp: 0.18,
      smoothWheel: true,
      wheelMultiplier: 0.60,
      touchMultiplier: 0,
    });

    let rafId: number;
    function raf(time: number) {
      modalLenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      modalLenis.destroy();
    };
  }, [isOpen]);

  // Parse subject/subtitle from bank tagline JSON or plain string
  const bankMeta = useMemo(() => {
    if (!bank) return { title: '', subject: '', subtitle: '', taglineText: '' };
    let parsedSubject = '';
    let parsedTagline = bank.tagline || '';
    if (bank.tagline && typeof bank.tagline === 'string' && bank.tagline.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(bank.tagline);
        parsedSubject = parsed.subject || '';
        parsedTagline = parsed.text || '';
      } catch (e) {}
    }
    return {
      title: bank.title || 'Question Bank',
      subject: parsedSubject,
      subtitle: parsedSubject || parsedTagline || 'Topic-wise Master Question Bank',
      taglineText: parsedTagline
    };
  }, [bank]);

  // Load questions when modal opens
  useEffect(() => {
    if (!isOpen || !bank) {
      setQuestions([]);
      setUserSelectedOptions({});
      setExpandedExplanations({});
      setSearchQuery('');
      setShowAllAnswers(false);
      return;
    }

    let isMounted = true;

    async function loadQuestions() {
      if (!bank) return;
      
      if (Array.isArray(bank.questions) && bank.questions.length > 0) {
        setQuestions(bank.questions);
        return;
      }

      if (bank.pdfUrl && typeof bank.pdfUrl === 'string') {
        try {
          const parsed = JSON.parse(bank.pdfUrl);
          if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].questionText || parsed[0].question)) {
            setQuestions(parsed);
            return;
          }
          if (parsed.questionsData && Array.isArray(parsed.questionsData)) {
            setQuestions(parsed.questionsData);
            return;
          }
        } catch (e) {}
      }

      setLoading(true);
      try {
        const fetched = await examService.getQuestionsForQuestionBank(bank.id, bank.title, bank.examId);
        if (isMounted) {
          setQuestions(fetched || []);
        }
      } catch (err) {
        console.error("Failed to load question bank questions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadQuestions();

    return () => {
      isMounted = false;
    };
  }, [isOpen, bank]);

  const keyedCount = useMemo(() => {
    return questions.filter(q => q.correctAnswerIndex !== undefined || q.answer !== undefined).length;
  }, [questions]);

  const unkeyedCount = useMemo(() => {
    return questions.length - keyedCount;
  }, [questions, keyedCount]);

  const filteredQuestions = useMemo(() => {
    let list = [...questions];

    if (activeFilter === 'answered') {
      list = list.filter(q => q.correctAnswerIndex !== undefined || q.answer !== undefined);
    } else if (activeFilter === 'unanswered') {
      list = list.filter(q => q.correctAnswerIndex === undefined && q.answer === undefined);
    }

    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter((q, idx) => {
        const qNumStr = `q${idx + 1}`.toLowerCase();
        const text = (q.questionText || q.question || '').toLowerCase();
        const explanation = (q.explanation || '').toLowerCase();
        const optionsMatch = (q.options || []).some((opt: string) => (opt || '').toLowerCase().includes(qLower));
        return text.includes(qLower) || explanation.includes(qLower) || optionsMatch || qNumStr.includes(qLower);
      });
    }

    return list;
  }, [questions, activeFilter, searchQuery]);

  const handleOptionClick = useCallback((qIndex: number, optIndex: number) => {
    setUserSelectedOptions(prev => ({
      ...prev,
      [qIndex]: prev[qIndex] === optIndex ? -1 : optIndex
    }));
  }, []);

  const toggleExplanation = useCallback((qIndex: number) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [qIndex]: !prev[qIndex]
    }));
  }, []);

  const handleDownloadPdf = () => {
    if (!bank) return;
    if (!hasAccess && onUnlockRequired) {
      onUnlockRequired();
      return;
    }

    exportQuestionBankToPdf({
      title: bank.title,
      subtitle: bankMeta.subtitle,
      subject: bankMeta.subject,
      examName: examName,
      totalQuestions: questions.length,
      questions: questions
    });
  };

  if (!isOpen || !bank) return null;

  return (
    <AnimatePresence>
      <div 
        className={cn(
          "fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-slate-950/80 backdrop-blur-md transition-all duration-300",
          isFullscreen ? "p-0" : "p-2 sm:p-4 md:p-6"
        )}
        data-lenis-prevent
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300",
            isFullscreen 
              ? "w-screen h-screen max-w-none max-h-none rounded-none border-0" 
              : "w-full max-w-5xl h-[92vh] max-h-[920px] rounded-[2rem] border border-slate-200/80 dark:border-slate-800"
          )}
        >
          {/* ── Top Header Navigation Bar ── */}
          <div className="px-5 sm:px-8 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-xl flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800">
                    Question Bank
                  </span>
                  {bankMeta.subject && (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                      • {bankMeta.subject}
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate mt-0.5" title={bank.title}>
                  {bank.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsToolsExpanded(prev => !prev)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer",
                  isToolsExpanded
                    ? "bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                )}
                title={isToolsExpanded ? "Collapse Search & Filters Toolbar" : "Expand Search & Filters Toolbar"}
              >
                <Filter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Search & Filters</span>
                {isToolsExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-black tracking-wide shadow-md shadow-brand-500/20 transition-all cursor-pointer"
                title="Download Question Bank PDF Booklet"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreen(prev => !prev)}
                className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                title={isFullscreen ? "Exit Fullscreen (Window Mode)" : "Open in Fullscreen Reader Mode"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Fullscreen Reader Mode"}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                aria-label="Close reader"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Collapsible Sub-Header Toolbar ── */}
          <AnimatePresence>
            {isToolsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden bg-white dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/80 shrink-0"
              >
                <div className="px-5 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search questions, topics, math equations..."
                      className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white transition-all"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-300">
                      <button
                        type="button"
                        onClick={() => setActiveFilter('all')}
                        className={cn(
                          "px-2.5 py-1 rounded-lg transition-all",
                          activeFilter === 'all' ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-black" : "hover:text-slate-900"
                        )}
                      >
                        All ({questions.length})
                      </button>
                      {keyedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter('answered')}
                          className={cn(
                            "px-2.5 py-1 rounded-lg transition-all",
                            activeFilter === 'answered' ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black" : "hover:text-slate-900"
                          )}
                        >
                          Keyed ({keyedCount})
                        </button>
                      )}
                      {unkeyedCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveFilter('unanswered')}
                          className={cn(
                            "px-2.5 py-1 rounded-lg transition-all",
                            activeFilter === 'unanswered' ? "bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-xs font-black" : "hover:text-slate-900"
                          )}
                        >
                          Practice ({unkeyedCount})
                        </button>
                      )}
                    </div>

                    {keyedCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAllAnswers(prev => !prev)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border",
                          showAllAnswers
                            ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        )}
                      >
                        {showAllAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showAllAnswers ? 'Hide Answers' : 'Show Answers'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Questions Scroll Container ── */}
          <div 
            ref={modalScrollRef}
            className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 space-y-6 overscroll-contain touch-pan-y custom-scrollbar gpu-accelerated"
            data-lenis-prevent
          >
            {loading ? (
              <div className="space-y-4 py-8">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  No questions match your query
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Try adjusting your search keywords or clearing your active filters.
                </p>
                {(searchQuery || activeFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                    className="mt-4 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 rounded-xl border border-brand-200 dark:border-brand-800"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            ) : (
              filteredQuestions.map((q, idx) => (
                <QuestionCardItem
                  key={q.id || idx}
                  q={q}
                  qNum={idx + 1}
                  idx={idx}
                  showAllAnswers={showAllAnswers}
                  userChoice={userSelectedOptions[idx]}
                  isExplanationExpanded={!!expandedExplanations[idx]}
                  onOptionClick={handleOptionClick}
                  onToggleExplanation={toggleExplanation}
                />
              ))
            )}
          </div>

          {/* ── Footer Status Bar ── */}
          <div className="px-5 sm:px-8 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
            <span>
              Showing <strong>{filteredQuestions.length}</strong> of <strong>{questions.length}</strong> questions
            </span>
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[11px] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-brand-500" />
              <span>KaTeX Math Engine Active</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
