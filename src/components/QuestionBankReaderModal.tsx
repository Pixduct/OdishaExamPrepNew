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
  Maximize2,
  Minimize2,
  Star,
  Compass,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { MathTextRenderer } from './MathTextRenderer';
import UniversalMathDiagramEngine from './UniversalMathDiagramEngine';
import { exportQuestionBankToPdf } from '../lib/pdfExportEngine';
import { PdfExportGuideModal } from './PdfExportGuideModal';
import { QuestionBankGuideModal } from './QuestionBankGuideModal';
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
  isFullscreen?: boolean;
  isBookmarked?: boolean;
  onOptionClick: (qIndex: number, optIndex: number) => void;
  onToggleExplanation: (qIndex: number) => void;
  onToggleBookmark?: (qIndex: number) => void;
}

const PAGE_SIZE = 50;

const QuestionCardItem = React.memo<QuestionCardItemProps>(({
  q,
  qNum,
  idx,
  showAllAnswers,
  userChoice,
  isExplanationExpanded,
  isFullscreen = false,
  isBookmarked = false,
  onOptionClick,
  onToggleExplanation,
  onToggleBookmark,
}) => {
  const rawText = q.questionText || q.question || '';
  const ansIdx = q.correctAnswerIndex !== undefined 
    ? q.correctAnswerIndex 
    : (typeof q.answer === 'number' ? q.answer : (typeof q.answer === 'string' && ['A','B','C','D'].indexOf(q.answer.toUpperCase()) !== -1 ? ['A','B','C','D'].indexOf(q.answer.toUpperCase()) : undefined));
  
  const hasAnswer = ansIdx !== undefined;
  const isRevealed = showAllAnswers;

  return (
    <div
      id={`qb-question-${idx}`}
      className={cn(
        "bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-800/80 transition-colors duration-150 cv-card-auto",
        isFullscreen ? "p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-3xl" : "p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl"
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className={cn(
            "rounded-lg bg-blue-50/80 dark:bg-[#060B16] text-blue-700 dark:text-blue-400 font-black tracking-wider border border-blue-100 dark:border-slate-800 shrink-0",
            isFullscreen ? "px-3.5 py-1 text-xs sm:text-sm md:text-base" : "px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10.5px] sm:text-xs"
          )}>
            Q. {String(qNum).padStart(2, '0')}
          </span>
          {q.topic && (
            <span className={cn(
              "font-bold text-slate-500 dark:text-slate-400 truncate max-w-[200px] xs:max-w-[280px] sm:max-w-md",
              isFullscreen ? "text-xs sm:text-sm md:text-base" : "text-[10px] sm:text-[11.5px]"
            )}>
              • {q.topic}
            </span>
          )}
        </div>

        {onToggleBookmark && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(idx); }}
            className={cn(
              "rounded-lg sm:rounded-xl border transition-all cursor-pointer flex items-center gap-1 font-bold active:scale-90 shrink-0",
              isFullscreen ? "px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm" : "p-1.5 sm:px-2.5 sm:py-1 text-xs",
              isBookmarked
                ? "bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700/80 text-amber-600 dark:text-amber-400 shadow-xs"
                : "bg-slate-50 dark:bg-[#060B16] border-slate-200/80 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={isBookmarked ? "Remove Bookmark" : "Bookmark for quick revision"}
          >
            <Star className={cn(isFullscreen ? "w-4 h-4" : "w-3.5 h-3.5", isBookmarked ? "fill-amber-400 text-amber-500" : "text-slate-400")} />
            <span className="hidden sm:inline">{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
          </button>
        )}
      </div>

      <div className={cn(
        "text-slate-900 dark:text-white font-bold leading-relaxed w-full overflow-x-auto",
        isFullscreen ? "text-base sm:text-lg md:text-xl lg:text-2xl mt-2" : "text-[13px] sm:text-base"
      )}>
        <MathTextRenderer text={rawText} />
      </div>

      {q.diagram && (
        <div className={cn(
          "my-3 sm:my-4 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-[#060B16] border border-slate-200/60 dark:border-slate-800 flex justify-center overflow-x-auto",
          isFullscreen ? "p-6 md:p-8" : "p-3 sm:p-4"
        )}>
          <UniversalMathDiagramEngine data={q.diagram} />
        </div>
      )}

      {Array.isArray(q.options) && q.options.length > 0 && (
        <div className={cn(
          "grid grid-cols-1 sm:grid-cols-2",
          isFullscreen ? "gap-3.5 sm:gap-4 md:gap-5 mt-5 sm:mt-6" : "gap-2 sm:gap-2.5 mt-2.5 sm:mt-3"
        )}>
          {q.options.map((optionText: string, oIdx: number) => {
            const optLetter = ['A', 'B', 'C', 'D', 'E'][oIdx] || `(${oIdx + 1})`;
            const isCorrect = hasAnswer && ansIdx === oIdx;
            const isSelectedByUser = userChoice === oIdx;
            
            let tileStyle = "bg-slate-50/70 dark:bg-[#060B16] border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80";
            let badgeStyle = "bg-white dark:bg-[#0B1528] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700";

            if (isRevealed && isCorrect) {
              tileStyle = "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold shadow-xs";
              badgeStyle = "bg-emerald-600 text-white border-emerald-600";
            } else if (isSelectedByUser) {
              if (hasAnswer && isRevealed && !isCorrect) {
                tileStyle = "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200 font-bold";
                badgeStyle = "bg-rose-600 text-white border-rose-600";
              } else {
                tileStyle = "bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-200 font-bold shadow-xs";
                badgeStyle = "bg-blue-600 text-white border-blue-600";
              }
            }

            return (
              <button
                key={oIdx}
                type="button"
                onClick={() => onOptionClick(idx, oIdx)}
                className={cn(
                  "flex items-start border text-left transition-all duration-150 cursor-pointer relative active:scale-[0.99]",
                  isFullscreen 
                    ? "gap-3.5 sm:gap-4 p-4 sm:p-5 md:p-5.5 rounded-xl md:rounded-2xl text-sm sm:text-base md:text-lg" 
                    : "gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl text-xs sm:text-sm",
                  tileStyle
                )}
              >
                <span className={cn(
                  "rounded-lg md:rounded-xl flex items-center justify-center font-black shrink-0 border mt-0.5",
                  isFullscreen 
                    ? "w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 text-xs sm:text-sm md:text-base" 
                    : "w-5.5 h-5.5 sm:w-6 sm:h-6 text-[11px] sm:text-xs",
                  badgeStyle
                )}>
                  {optLetter}
                </span>
                <div className="flex-1 leading-snug pt-0.5 overflow-x-auto">
                  <MathTextRenderer text={optionText} isOption />
                </div>
                {isRevealed && isCorrect && (
                  <CheckCircle2 className={cn(
                    "text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5",
                    isFullscreen ? "w-5 h-5 md:w-6 md:h-6" : "w-4 h-4"
                  )} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {hasAnswer && (
        <div className={cn(
          "border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2",
          isFullscreen ? "mt-5 sm:mt-6 pt-3.5 sm:pt-4" : "mt-3 sm:mt-4 pt-2.5 sm:pt-3"
        )}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={cn(
              "font-bold text-slate-500 dark:text-slate-400",
              isFullscreen ? "text-xs sm:text-sm md:text-base" : "text-[10.5px] sm:text-[11px]"
            )}>
              Answer:
            </span>
            <span className={cn(
              "rounded-md font-black",
              isFullscreen ? "px-3.5 py-1 text-xs sm:text-sm md:text-base" : "px-2 sm:px-2.5 py-0.5 text-[10.5px] sm:text-xs",
              isRevealed
                ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            )}>
              {isRevealed ? `Option (${['A','B','C','D','E'][ansIdx!] || ansIdx! + 1})` : 'Hidden'}
            </span>
          </div>

          {q.explanation && (
            <button
              type="button"
              onClick={() => onToggleExplanation(idx)}
              className={cn(
                "flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 active:scale-95 transition-transform cursor-pointer",
                isFullscreen ? "text-xs sm:text-sm md:text-base" : "text-[11px] sm:text-xs"
              )}
            >
              <span>{isExplanationExpanded || showAllAnswers ? 'Hide Solution' : '💡 View Solution'}</span>
              {isExplanationExpanded || showAllAnswers ? (
                <ChevronUp className={cn(isFullscreen ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5 md:w-4 md:h-4")} />
              ) : (
                <ChevronDown className={cn(isFullscreen ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5 md:w-4 md:h-4")} />
              )}
            </button>
          )}
        </div>
      )}

      {q.explanation && (isExplanationExpanded || showAllAnswers) && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className={cn(
            "mt-3 sm:mt-4 rounded-xl md:rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/50 text-slate-700 dark:text-slate-300",
            isFullscreen ? "p-5 sm:p-7 md:p-8 text-sm sm:text-base md:text-lg" : "p-3 sm:p-4 text-xs sm:text-sm"
          )}
        >
          <div className={cn(
            "font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2",
            isFullscreen ? "text-xs sm:text-sm md:text-base" : "text-[11px] sm:text-xs"
          )}>
            <Sparkles className={cn(isFullscreen ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5 md:w-4 md:h-4")} /> Detailed Explanation:
          </div>
          <div className="leading-relaxed overflow-x-auto">
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
    prevProps.isExplanationExpanded === nextProps.isExplanationExpanded &&
    prevProps.isFullscreen === nextProps.isFullscreen &&
    prevProps.isBookmarked === nextProps.isBookmarked
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
  const [activeFilter, setActiveFilter] = useState<'all' | 'answered' | 'unanswered' | 'bookmarked'>('all');
  const [showAllAnswers, setShowAllAnswers] = useState(false);
  const [userSelectedOptions, setUserSelectedOptions] = useState<Record<number, number>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<number, boolean>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolsExpanded, setIsToolsExpanded] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPdfGuideModal, setShowPdfGuideModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<number, boolean>>({});
  const [lastReadQNum, setLastReadQNum] = useState<number | null>(null);
  const [showResumeBanner, setShowResumeBanner] = useState(false);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [jumpQInput, setJumpQInput] = useState('');

  const modalScrollRef = useRef<HTMLDivElement | null>(null);

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

    const innerContent = modalScrollRef.current.firstElementChild;
    let resizeObserver: ResizeObserver | null = null;

    if (innerContent && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        modalLenis.resize();
      });
      resizeObserver.observe(innerContent);
    }

    const timer1 = setTimeout(() => modalLenis.resize(), 100);
    const timer2 = setTimeout(() => modalLenis.resize(), 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      cancelAnimationFrame(rafId);
      modalLenis.destroy();
    };
  }, [isOpen, loading, currentSetIndex]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const onFullscreenChange = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFs);
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    try {
      const isCurrentlyFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      if (!isCurrentlyFs) {
        const el = document.documentElement as any;
        if (el.requestFullscreen) {
          el.requestFullscreen().catch(() => {});
        } else if (el.webkitRequestFullscreen) {
          el.webkitRequestFullscreen();
        } else if (el.mozRequestFullScreen) {
          el.mozRequestFullScreen();
        } else if (el.msRequestFullscreen) {
          el.msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        const doc = document as any;
        if (doc.exitFullscreen) {
          doc.exitFullscreen().catch(() => {});
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn('Fullscreen toggle failed:', e);
      setIsFullscreen(prev => !prev);
    }
  }, []);

  const handleModalClose = useCallback(() => {
    if (typeof document !== 'undefined') {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (isFs) {
        try {
          const doc = document as any;
          if (doc.exitFullscreen) {
            doc.exitFullscreen().catch(() => {});
          } else if (doc.webkitExitFullscreen) {
            doc.webkitExitFullscreen();
          }
        } catch (e) {}
      }
    }
    onClose();
  }, [onClose]);

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

  useEffect(() => {
    if (!isOpen || !bank) {
      setQuestions([]);
      setUserSelectedOptions({});
      setExpandedExplanations({});
      setSearchQuery('');
      setShowAllAnswers(false);
      setBookmarkedIds({});
      setLastReadQNum(null);
      setShowResumeBanner(false);
      setCurrentSetIndex(0);
      return;
    }

    if (bank.id) {
      try {
        const savedBookmarks = localStorage.getItem(`oep_qb_bookmarks_${bank.id}`);
        if (savedBookmarks) {
          setBookmarkedIds(JSON.parse(savedBookmarks));
        }
        const savedLastRead = localStorage.getItem(`oep_qb_progress_${bank.id}`);
        if (savedLastRead) {
          const parsedQ = parseInt(savedLastRead, 10);
          if (!isNaN(parsedQ) && parsedQ > 1) {
            setLastReadQNum(parsedQ);
            setShowResumeBanner(true);
          }
        }
      } catch (e) {}
    }

    // Auto-open interactive feature guide for first-time students
    if (typeof window !== 'undefined') {
      try {
        const hasSeenGuide = localStorage.getItem('oep_seen_qb_user_guide') === 'true';
        if (!hasSeenGuide) {
          const guideTimer = setTimeout(() => {
            setShowGuideModal(true);
          }, 450);
        }
      } catch (e) {}
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

  const handleToggleBookmark = useCallback((qIndex: number) => {
    setBookmarkedIds(prev => {
      const next = { ...prev, [qIndex]: !prev[qIndex] };
      if (!next[qIndex]) {
        delete next[qIndex];
      }
      if (bank?.id) {
        try {
          localStorage.setItem(`oep_qb_bookmarks_${bank.id}`, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  }, [bank?.id]);

  const keyedCount = useMemo(() => {
    return questions.filter(q => q.correctAnswerIndex !== undefined || q.answer !== undefined).length;
  }, [questions]);

  const unkeyedCount = useMemo(() => {
    return questions.length - keyedCount;
  }, [questions, keyedCount]);

  const bookmarkedCount = useMemo(() => {
    return Object.values(bookmarkedIds).filter(Boolean).length;
  }, [bookmarkedIds]);

  const filteredQuestions = useMemo(() => {
    let list = questions.map((q, originalIdx) => ({ ...q, _originalIdx: originalIdx }));

    if (activeFilter === 'answered') {
      list = list.filter(q => q.correctAnswerIndex !== undefined || q.answer !== undefined);
    } else if (activeFilter === 'unanswered') {
      list = list.filter(q => q.correctAnswerIndex === undefined && q.answer === undefined);
    } else if (activeFilter === 'bookmarked') {
      list = list.filter(q => !!bookmarkedIds[q._originalIdx]);
    }

    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase();
      list = list.filter((q) => {
        const qNumStr = `q${q._originalIdx + 1}`.toLowerCase();
        const text = (q.questionText || q.question || '').toLowerCase();
        const explanation = (q.explanation || '').toLowerCase();
        const optionsMatch = (q.options || []).some((opt: string) => (opt || '').toLowerCase().includes(qLower));
        return text.includes(qLower) || explanation.includes(qLower) || optionsMatch || qNumStr.includes(qLower);
      });
    }

    return list;
  }, [questions, activeFilter, searchQuery, bookmarkedIds]);

  const totalSets = useMemo(() => {
    return Math.max(1, Math.ceil(filteredQuestions.length / PAGE_SIZE));
  }, [filteredQuestions.length]);

  const clampedSetIndex = useMemo(() => {
    return Math.min(currentSetIndex, totalSets - 1);
  }, [currentSetIndex, totalSets]);

  const displayedQuestions = useMemo(() => {
    const start = clampedSetIndex * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, clampedSetIndex]);

  const startQuestionNum = clampedSetIndex * PAGE_SIZE + 1;
  const endQuestionNum = Math.min((clampedSetIndex + 1) * PAGE_SIZE, filteredQuestions.length);

  const attemptedCount = useMemo(() => {
    return Object.keys(userSelectedOptions).filter(k => userSelectedOptions[Number(k)] !== -1).length;
  }, [userSelectedOptions]);

  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.min(100, Math.round((attemptedCount / questions.length) * 100));
  }, [attemptedCount, questions.length]);

  const handleOptionClick = useCallback((qIndex: number, optIndex: number) => {
    setUserSelectedOptions(prev => ({
      ...prev,
      [qIndex]: prev[qIndex] === optIndex ? -1 : optIndex
    }));
    if (bank?.id) {
      try {
        localStorage.setItem(`oep_qb_progress_${bank.id}`, String(qIndex + 1));
      } catch (e) {}
    }
  }, [bank?.id]);

  const toggleExplanation = useCallback((qIndex: number) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [qIndex]: !prev[qIndex]
    }));
  }, []);

  const handleResumeLastRead = useCallback(() => {
    if (!lastReadQNum) return;
    const targetSet = Math.floor((lastReadQNum - 1) / PAGE_SIZE);
    setCurrentSetIndex(targetSet);
    setShowResumeBanner(false);
    setTimeout(() => {
      const el = document.getElementById(`qb-question-${lastReadQNum - 1}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  }, [lastReadQNum]);

  const handleJumpToQuestion = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseInt(jumpQInput.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= questions.length) {
      const targetSet = Math.floor((num - 1) / PAGE_SIZE);
      setCurrentSetIndex(targetSet);
      setJumpQInput('');
      setTimeout(() => {
        const el = document.getElementById(`qb-question-${num - 1}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [jumpQInput, questions.length]);

  const executePdfExport = async () => {
    if (!bank || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      await exportQuestionBankToPdf({
        title: bank.title,
        subtitle: bankMeta.subtitle,
        subject: bankMeta.subject,
        examName: examName,
        totalQuestions: questions.length,
        questions: questions
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = () => {
    if (!bank || isGeneratingPdf) return;
    if (!hasAccess && onUnlockRequired) {
      onUnlockRequired();
      return;
    }

    const hasSeenGuide = typeof window !== 'undefined' && localStorage.getItem('oep_seen_pdf_export_guide') === 'true';
    if (hasSeenGuide) {
      executePdfExport();
    } else {
      setShowPdfGuideModal(true);
    }
  };

  if (!isOpen || !bank) return null;

  return (
    <AnimatePresence>
      <div 
        className={cn(
          "fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-slate-950/85 backdrop-blur-md transition-all duration-300",
          isFullscreen ? "p-0" : "p-0 sm:p-4 md:p-6"
        )}
        data-lenis-prevent
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300",
            isFullscreen 
              ? "w-screen h-screen max-w-none max-h-none rounded-none border-0" 
              : "w-full h-full sm:h-[92vh] sm:max-h-[920px] sm:max-w-5xl rounded-none sm:rounded-[2rem] border-0 sm:border border-slate-200/80 dark:border-slate-800"
          )}
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)'
          }}
        >
          <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-xl shrink-0 transition-all relative">
            <div className={cn(
              "w-full flex items-center justify-between gap-3 sm:gap-6",
              !isFullscreen && "max-w-5xl mx-auto"
            )}>
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="sm:hidden p-2 -ml-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 active:scale-90 transition-all cursor-pointer shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className={cn(
                  "hidden sm:flex rounded-2xl bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/20 dark:border-brand-500/30 items-center justify-center text-brand-600 dark:text-brand-400 shrink-0 shadow-xs",
                  isFullscreen ? "w-11 h-11 md:w-12 md:h-12" : "w-10 h-10"
                )}>
                  <BookOpen className={cn(isFullscreen ? "w-5 h-5 md:w-6 md:h-6" : "w-5 h-5")} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-black uppercase tracking-wider rounded-md bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200/60 dark:border-brand-800 px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] shrink-0">
                      Question Bank
                    </span>
                    {bankMeta.subject && (
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs truncate">
                        • {bankMeta.subject}
                      </span>
                    )}
                    {questions.length > 0 && (
                      <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold border border-slate-200/60 dark:border-slate-700/60">
                        {questions.length.toLocaleString()} Questions
                      </span>
                    )}
                    {attemptedCount > 0 && (
                      <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                        {progressPercent}% Practiced ({attemptedCount})
                      </span>
                    )}
                  </div>
                  <h2 className={cn(
                    "font-black text-slate-900 dark:text-white truncate mt-0.5",
                    isFullscreen ? "text-base sm:text-xl md:text-2xl" : "text-sm sm:text-lg"
                  )} title={bank.title}>
                    {bank.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
                {/* Feature Guide Help Button */}
                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl font-black transition-all border cursor-pointer active:scale-95 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700",
                    isFullscreen ? "px-3 py-2.5 text-xs md:text-sm" : "px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs"
                  )}
                  title="How to use Question Bank (Interactive Guide)"
                >
                  <HelpCircle className={cn(isFullscreen ? "w-4 h-4 text-brand-500" : "w-3.5 h-3.5 text-brand-500")} />
                  <span className="hidden md:inline">Guide</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsToolsExpanded(prev => !prev)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-xl font-black transition-all border cursor-pointer active:scale-95",
                    isFullscreen ? "px-3.5 py-2.5 text-xs md:text-sm" : "px-2.5 sm:px-3 py-2 sm:py-2.5 text-xs",
                    isToolsExpanded
                      ? "bg-brand-50 dark:bg-brand-950/60 border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  )}
                >
                  <Filter className={cn(isFullscreen ? "w-4 h-4" : "w-3.5 h-3.5")} />
                  <span className="hidden sm:inline">Search & Filters</span>
                  {isToolsExpanded ? <ChevronUp className="w-3.5 h-3.5 hidden sm:inline" /> : <ChevronDown className="w-3.5 h-3.5 hidden sm:inline" />}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className={cn(
                    "flex items-center gap-1.5 sm:gap-2 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 disabled:opacity-80 disabled:cursor-wait text-white font-black tracking-wide shadow-md shadow-brand-500/20 transition-all cursor-pointer shrink-0",
                    isFullscreen ? "px-4 md:px-5 py-2.5 text-xs md:text-sm" : "px-3 sm:px-4 py-2 sm:py-2.5 text-xs"
                  )}
                >
                  {isGeneratingPdf ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Download className={cn(isFullscreen ? "w-4 h-4" : "w-3.5 h-3.5 sm:w-4 sm:h-4")} />}
                  <span className="hidden sm:inline">{isGeneratingPdf ? 'Saving PDF...' : 'Download PDF'}</span>
                </button>

                <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700/80 mx-0.5" />

                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  className={cn(
                    "hidden sm:flex rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer",
                    isFullscreen ? "p-2.5 md:p-3" : "p-2 sm:p-2.5"
                  )}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>

                <button
                  type="button"
                  onClick={handleModalClose}
                  className={cn(
                    "hidden sm:flex rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer",
                    isFullscreen ? "p-2.5 md:p-3" : "p-2 sm:p-2.5"
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {questions.length > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-200/60 dark:bg-slate-800">
                <div 
                  className="h-full bg-gradient-to-r from-brand-500 via-brand-600 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>

          <AnimatePresence>
            {isToolsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden bg-white dark:bg-[#0B1528] border-b border-slate-200/60 dark:border-slate-800 shrink-0"
              >
                <div className="px-3.5 sm:px-6 md:px-8 py-2.5 sm:py-3">
                  <div className={cn(
                    "w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3",
                    !isFullscreen && "max-w-5xl mx-auto"
                  )}>
                    <div className={cn(
                      "relative w-full sm:flex-1",
                      isFullscreen ? "sm:max-w-md md:max-w-lg" : "sm:max-w-md"
                    )}>
                      <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); setCurrentSetIndex(0); }}
                        placeholder="Search questions, formulas..."
                        className={cn(
                          "w-full pl-8.5 sm:pl-9 pr-7 sm:pr-8 bg-slate-50 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all font-medium",
                          isFullscreen ? "py-2 sm:py-2.5 text-xs sm:text-base" : "py-1.5 sm:py-2 text-xs sm:text-sm"
                        )}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => { setSearchQuery(''); setCurrentSetIndex(0); }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="w-full sm:w-auto">
                      <div className="flex items-center p-1 bg-slate-100/90 dark:bg-[#060B16] border border-slate-200/60 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => { setActiveFilter('all'); setCurrentSetIndex(0); }}
                          className={cn(
                            "flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                            activeFilter === 'all' ? "bg-white dark:bg-[#0B1528] text-blue-600 dark:text-blue-400 shadow-xs font-black" : "hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          All ({questions.length})
                        </button>
                        {bookmarkedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => { setActiveFilter('bookmarked'); setCurrentSetIndex(0); }}
                            className={cn(
                              "flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1",
                              activeFilter === 'bookmarked' ? "bg-white dark:bg-[#0B1528] text-amber-600 dark:text-amber-400 shadow-xs font-black" : "hover:text-slate-900 dark:hover:text-white"
                            )}
                          >
                            <Star className="w-3 h-3 fill-current" />
                            <span>Saved ({bookmarkedCount})</span>
                          </button>
                        )}
                        {keyedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => { setActiveFilter('answered'); setCurrentSetIndex(0); }}
                            className={cn(
                              "flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                              activeFilter === 'answered' ? "bg-white dark:bg-[#0B1528] text-emerald-600 dark:text-emerald-400 shadow-xs font-black" : "hover:text-slate-900 dark:hover:text-white"
                            )}
                          >
                            Keyed ({keyedCount})
                          </button>
                        )}
                        {unkeyedCount > 0 && (
                          <button
                            type="button"
                            onClick={() => { setActiveFilter('unanswered'); setCurrentSetIndex(0); }}
                            className={cn(
                              "flex-1 sm:flex-initial text-center px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer whitespace-nowrap",
                              activeFilter === 'unanswered' ? "bg-white dark:bg-[#0B1528] text-blue-600 dark:text-blue-400 shadow-xs font-black" : "hover:text-slate-900 dark:hover:text-white"
                            )}
                          >
                            Practice ({unkeyedCount})
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            ref={modalScrollRef}
            className={cn(
              "flex-1 overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar gpu-accelerated",
              isFullscreen ? "px-6 sm:px-10 md:px-12 py-5 sm:py-7" : "px-4 sm:px-6 md:px-8 py-4 sm:py-6"
            )}
            data-lenis-prevent
          >
            <div className={cn(
              "w-full mx-auto pb-10 sm:pb-16",
              isFullscreen ? "max-w-[1440px] space-y-5 sm:space-y-7" : "max-w-5xl space-y-3.5 sm:space-y-6"
            )}>
              <AnimatePresence>
                {showResumeBanner && lastReadQNum && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-200/80 dark:border-blue-800/80 shadow-xs",
                      isFullscreen ? "p-4 sm:p-5" : "p-3 sm:p-4"
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <div className={cn(
                          "rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs",
                          isFullscreen ? "w-10 h-10 md:w-11 md:h-11" : "w-8.5 h-8.5 sm:w-9 sm:h-9"
                        )}>
                          <Compass className={cn(isFullscreen ? "w-5 h-5 md:w-6 md:h-6" : "w-4 h-4 sm:w-5 sm:h-5", "animate-spin-slow")} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn(
                            "font-extrabold text-slate-900 dark:text-white tracking-tight",
                            isFullscreen ? "text-sm sm:text-base md:text-lg" : "text-xs sm:text-sm"
                          )}>
                            Resume at <strong>Q. #{lastReadQNum}</strong>
                          </p>
                          <p className={cn(
                            "text-slate-500 dark:text-slate-400 truncate font-medium",
                            isFullscreen ? "text-xs sm:text-sm mt-0.5" : "text-[10.5px] sm:text-[11px]"
                          )}>
                            Jump directly back into your practice session
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleResumeLastRead}
                          className={cn(
                            "rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black cursor-pointer shadow-xs shadow-blue-500/25 transition-all flex items-center gap-1.5",
                            isFullscreen ? "px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm" : "px-3 py-1.5 text-xs"
                          )}
                        >
                          <span>Resume Q. {lastReadQNum}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowResumeBanner(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                          aria-label="Dismiss"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {totalSets > 1 && (
                <div className={cn(
                  "rounded-2xl bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 shadow-xs",
                  isFullscreen ? "p-3 sm:p-4" : "p-2 sm:p-3"
                )}>
                  <div className="flex items-center justify-between gap-2">
                    {/* Stepper group */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={clampedSetIndex === 0}
                        onClick={() => {
                          setCurrentSetIndex(prev => Math.max(0, prev - 1));
                          modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "rounded-lg sm:rounded-xl bg-slate-50 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-all",
                          isFullscreen ? "px-3 py-1.5 text-xs sm:text-sm" : "w-7.5 h-7.5 sm:px-2.5 sm:py-1 text-xs"
                        )}
                        title="Previous 50 Questions"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden md:inline ml-0.5">Prev</span>
                      </button>

                      <div className={cn(
                        "flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-blue-50/70 dark:bg-[#060B16] border border-blue-100/80 dark:border-slate-800 font-extrabold text-slate-800 dark:text-slate-200",
                        isFullscreen ? "px-3 py-1.5 text-xs sm:text-sm" : "px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs"
                      )}>
                        <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>Set {clampedSetIndex + 1}/{totalSets}</span>
                        <span className="text-[9.5px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium hidden xs:inline">({startQuestionNum}–{endQuestionNum})</span>
                      </div>

                      <button
                        type="button"
                        disabled={clampedSetIndex >= totalSets - 1}
                        onClick={() => {
                          setCurrentSetIndex(prev => Math.min(totalSets - 1, prev + 1));
                          modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className={cn(
                          "rounded-lg sm:rounded-xl bg-slate-50 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-all",
                          isFullscreen ? "px-3 py-1.5 text-xs sm:text-sm" : "w-7.5 h-7.5 sm:px-2.5 sm:py-1 text-xs"
                        )}
                        title="Next 50 Questions"
                      >
                        <span className="hidden md:inline mr-0.5">Next</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>

                    {/* Quick Jump Input */}
                    <form onSubmit={handleJumpToQuestion} className="flex items-center justify-end gap-1 shrink-0">
                      <span className={cn(
                        "font-bold text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs",
                        isFullscreen ? "text-xs sm:text-sm" : "text-[11px]"
                      )}>
                        Q:
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={questions.length}
                        value={jumpQInput}
                        onChange={e => setJumpQInput(e.target.value)}
                        placeholder={`1-${questions.length}`}
                        className={cn(
                          "bg-slate-50 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 rounded-lg sm:rounded-xl font-bold text-slate-900 dark:text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                          isFullscreen ? "w-16 sm:w-20 px-2 py-1 text-xs sm:text-sm" : "w-13 sm:w-16 px-1.5 py-1 text-[11px] sm:text-xs"
                        )}
                      />
                      <button
                        type="submit"
                        disabled={!jumpQInput.trim()}
                        className={cn(
                          "rounded-lg sm:rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 cursor-pointer shadow-xs",
                          isFullscreen ? "px-3 py-1 text-xs sm:text-sm" : "px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs"
                        )}
                      >
                        Go
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="space-y-3 sm:space-y-4 py-6 sm:py-8">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 animate-pulse space-y-3">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                      <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="py-12 sm:py-16 text-center flex flex-col items-center justify-center max-w-md mx-auto px-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3.5 sm:mb-4">
                    <FileText className="w-7 h-7 sm:w-8 sm:h-8" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
                    No questions match your query
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    Try adjusting your search keywords or clearing your active filters.
                  </p>
                  {(searchQuery || activeFilter !== 'all') && (
                    <button
                      type="button"
                      onClick={() => { setSearchQuery(''); setActiveFilter('all'); setCurrentSetIndex(0); }}
                      className="mt-3.5 sm:mt-4 px-4 py-2 text-xs font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 rounded-xl border border-brand-200 dark:border-brand-800 cursor-pointer"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              ) : (
                displayedQuestions.map((q) => {
                  const originalIdx = q._originalIdx;
                  return (
                    <QuestionCardItem
                      key={q.id || originalIdx}
                      q={q}
                      qNum={originalIdx + 1}
                      idx={originalIdx}
                      showAllAnswers={showAllAnswers}
                      userChoice={userSelectedOptions[originalIdx]}
                      isExplanationExpanded={!!expandedExplanations[originalIdx]}
                      isFullscreen={isFullscreen}
                      isBookmarked={!!bookmarkedIds[originalIdx]}
                      onOptionClick={handleOptionClick}
                      onToggleExplanation={toggleExplanation}
                      onToggleBookmark={handleToggleBookmark}
                    />
                  );
                })
              )}

              {totalSets > 1 && filteredQuestions.length > 0 && (
                <div className="pt-4 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={clampedSetIndex === 0}
                    onClick={() => {
                      setCurrentSetIndex(prev => Math.max(0, prev - 1));
                      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer flex items-center gap-1.5 shadow-xs",
                      isFullscreen ? "px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm" : "px-3.5 py-2 text-xs"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous Set</span>
                  </button>

                  <span className={cn(
                    "font-bold text-slate-500 dark:text-slate-400",
                    isFullscreen ? "text-xs sm:text-sm" : "text-xs"
                  )}>
                    Set {clampedSetIndex + 1} of {totalSets}
                  </span>

                  <button
                    type="button"
                    disabled={clampedSetIndex >= totalSets - 1}
                    onClick={() => {
                      setCurrentSetIndex(prev => Math.min(totalSets - 1, prev + 1));
                      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={cn(
                      "rounded-xl bg-brand-600 hover:bg-brand-700 font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-xs",
                      isFullscreen ? "px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm" : "px-3.5 py-2 text-xs"
                    )}
                  >
                    <span>Next Set</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-8 py-3 sm:py-3.5 bg-white/95 dark:bg-[#060B16]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 shrink-0 transition-all">
            <div className={cn(
              "w-full flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium",
              isFullscreen ? "text-xs sm:text-sm" : "max-w-5xl mx-auto text-[11px] sm:text-xs"
            )}>
              <div className="flex items-center gap-3">
                <span>
                  Showing <strong className="text-slate-900 dark:text-white">{startQuestionNum}–{endQuestionNum}</strong> of <strong className="text-slate-900 dark:text-white">{filteredQuestions.length.toLocaleString()}</strong> questions
                </span>
                {bookmarkedCount > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    • <Star className="w-3 h-3 fill-current" /> {bookmarkedCount} Bookmarked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 dark:text-slate-500 text-[10px] sm:text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-500" />
                <span className="hidden sm:inline">KaTeX Math Engine Active</span>
                <span className="sm:hidden">KaTeX Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Student Friendly PDF Export Quick Guide Modal ── */}
        <PdfExportGuideModal
          isOpen={showPdfGuideModal}
          onClose={() => setShowPdfGuideModal(false)}
          onConfirm={() => {
            setShowPdfGuideModal(false);
            executePdfExport();
          }}
          title={bank.title}
        />

        {/* ── Interactive Question Bank Feature Guide Modal ── */}
        <QuestionBankGuideModal
          isOpen={showGuideModal}
          onClose={() => setShowGuideModal(false)}
          title={bank.title}
        />
      </div>
    </AnimatePresence>
  );
};
