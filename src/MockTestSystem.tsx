import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown, 
  Flag, 
  CheckCircle2, 
  AlertCircle,
  Timer,
  Send,
  X,
  LayoutGrid,
  LogOut,
  BookOpen,
  Target,
  TrendingDown,
  Zap,
  FileText,
  Play,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from './lib/utils';
import { Button } from './components/Button';
import { useAuth } from './lib/AuthContext';
import { useLanguage } from './lib/LanguageContext';
import { MathTextRenderer, DiagramRenderer } from './components/MathTextRenderer';
import { fadeSlideUp, modalContent } from './lib/animations';
import { recordQuestionSolved, completeDailyGoalDirectly } from './lib/streakManager';
import { destroyLenis, initLenis } from './lib/lenisScroll';

export const requestUniversalFullscreen = () => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  // On mobile screens (< 1024px), do NOT call OS fullscreen API to avoid intrusive Android Chrome notification overlay
  if (window.innerWidth < 1024) return;
  const doc = document as any;
  const fsElement = doc.fullscreenElement || 
                    doc.webkitFullscreenElement || 
                    doc.mozFullScreenElement || 
                    doc.msFullscreenElement;

  if (!fsElement) {
    const el = (document.documentElement || document.body) as any;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch((err: any) => {
        console.warn("Auto-fullscreen failed:", err);
      });
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    } else if (el.mozRequestFullScreen) {
      el.mozRequestFullScreen();
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen();
    }
  }
};

// ─────────────────────────────────────────────────────────────
// Layout Detection Helpers
// ─────────────────────────────────────────────────────────────

/** Count math [bracket] blocks in a question string */
const countMathBlocks = (text: string): number => {
  if (!text) return 0;
  const matches = text.match(/\[[^\[\]\n]{2,120}\]/g) || [];
  return matches.filter(m => {
    const inner = m.slice(1, -1).trim();
    if (!inner || inner.length < 2) return false;
    // Must contain LaTeX commands e.g. \frac, \sqrt or math syntax ^, _, = or arithmetic operators between numbers/vars
    if (/\\[a-zA-Z]+|[\^=_]/.test(inner)) return true;
    if (/([0-9a-zA-Z]\s*[\+*/=]\s*[0-9a-zA-Z])/.test(inner)) return true;
    return false;
  }).length;
};

/** 
 * Comprehensive ASCII diagram detector.
 * Handles all common diagram types stored in question databases:
 * - Asterisk shapes: * (circles, triangles, borders)
 * - Dot shapes: . (dot diagrams, ellipses)
 * - Line art: /, \, |, -, + (geometric line art, trees, graphs)
 * - Hybrid: O, o, #, %, @, ~ mixed with above
 * - Multi-line blocks: paragraphs with \n that contain diagram lines
 */
const isAsciiDiagram = (para: string): boolean => {
  // Helper: checks a single line for diagram character density
  const lineIsDiagram = (line: string): boolean => {
    if (line.trim().length < 3) return false;
    const trimmed = line.trim();

    // Asterisk patterns (circles, shapes drawn with *)
    const asterisks = (trimmed.match(/\*/g) || []).length;
    if (asterisks >= 3) return true;

    // Dot-heavy patterns (dotted shapes, ellipses)
    const dots = (trimmed.match(/\./g) || []).length;
    if (dots >= 4 && dots / trimmed.length > 0.20) return true;

    // Hash/block patterns (#)
    const hashes = (trimmed.match(/#/g) || []).length;
    if (hashes >= 4) return true;

    // Standard line-art characters (/, \, |, -, +, _, ~, <, >)
    const lineArt = (trimmed.match(/[\/\\|\-+_~<>]/g) || []).length;
    if (lineArt >= 3 && lineArt / trimmed.length > 0.18) return true;

    // Mixed: line with geometry letters + symbols (like "A /|\ B---D")
    const mixedGeo = (trimmed.match(/[\/\\|\-+*\.O]/g) || []).length;
    const letters = (trimmed.match(/[A-Za-z]/g) || []).length;
    if (mixedGeo >= 3 && letters <= 6 && mixedGeo > letters) return true;

    return false;
  };

  if (!para || para.trim().length < 3) return false;

  // Multi-line paragraph: check if ANY line within it is a diagram
  if (para.includes('\n')) {
    const lines = para.split('\n');
    const diagramLineCount = lines.filter(lineIsDiagram).length;
    // If more than 40% of lines look like diagram lines → it's a diagram block
    return diagramLineCount >= 1 && diagramLineCount / lines.length >= 0.40;
  }

  // Single-line check
  return lineIsDiagram(para);
};

/** True when text contains a markdown pipe table */
const hasMarkdownTable = (text: string): boolean => {
  if (!text) return false;
  // A markdown table must have at least one line with | ... | pattern
  // AND a separator row like |---|---|
  const lines = text.split('\n');
  const pipeLines = lines.filter(l => l.trim().startsWith('|') && l.trim().endsWith('|'));
  if (pipeLines.length < 2) return false;
  // Check for at least one separator row (|---|---| pattern)
  return pipeLines.some(l => /^\|[-:\s|]+\|$/.test(l.trim()));
};

/** True when a question needs the full-width stacked layout */
const isMathHeavyQuestion = (text: string): boolean => {
  if (!text) return false;
  const blocks = countMathBlocks(text);
  // Also trigger stacked layout if question contains a diagram
  const hasDiagram = text.split('\n\n').some(p => isAsciiDiagram(p));
  // Tables need the stacked scrollable layout too — without it, options are clipped
  const table = hasMarkdownTable(text);
  return blocks >= 2 || text.length > 320 || hasDiagram || table;
};

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  diagram?: any;
}

interface MockTestProps {
  test: {
    id: string;
    title: string;
    durationMinutes: number;
    totalMarks?: number;
    negativeMarking?: number;
    questions: Question[];
  };
  mode?: 'mock' | 'practice';
  initialState?: any;
  onComplete: (results: any) => void;
  onExit: (progressState?: any) => void;
}

const MockTestSystem = ({ test, mode = 'mock', initialState, onComplete, onExit }: MockTestProps) => {
  const { user } = useAuth();
  const { t, isOdia } = useLanguage();

  // Robust parsing: Map ID-keyed progress from saved state back to current/fresh question indices
  const mappedInitialState = useMemo(() => {
    if (!initialState) return null;

    const hasIds = initialState.answersById || initialState.currentQuestionId;
    if (!hasIds) {
      return initialState; // Legacy index-keyed compatibility fallback
    }

    const questions = test.questions || [];
    const answersMap: Record<number, number> = {};
    const markedList: number[] = [];
    const timeMap: Record<number, number> = {};
    const visitedList: number[] = [];

    const answersById = initialState.answersById || {};
    const markedForReviewIds = initialState.markedForReviewIds || [];
    const timeSpentById = initialState.timeSpentById || {};
    const visitedIds = initialState.visitedIds || [];

    questions.forEach((q, idx) => {
      if (answersById[q.id] !== undefined) {
        answersMap[idx] = answersById[q.id];
      }
      if (markedForReviewIds.includes(q.id)) {
        markedList.push(idx);
      }
      if (timeSpentById[q.id] !== undefined) {
        timeMap[idx] = timeSpentById[q.id];
      }
      if (visitedIds.includes(q.id)) {
        visitedList.push(idx);
      }
    });

    let currentQuestionIndex = 0;
    if (initialState.currentQuestionId) {
      const idx = questions.findIndex(q => q.id === initialState.currentQuestionId);
      if (idx !== -1) currentQuestionIndex = idx;
    } else if (initialState.currentQuestionIndex !== undefined) {
      currentQuestionIndex = Math.min(initialState.currentQuestionIndex, Math.max(0, questions.length - 1));
    }

    return {
      ...initialState,
      currentQuestionIndex,
      answers: answersMap,
      markedForReview: markedList,
      timeSpent: timeMap,
      visited: visitedList
    };
  }, [initialState, test.questions]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(mappedInitialState?.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState<Record<number, number>>(mappedInitialState?.answers || {});
  const [markedForReview, setMarkedForReview] = useState<number[]>(mappedInitialState?.markedForReview || []);
  const [timeSpent, setTimeSpent] = useState<Record<number, number>>(mappedInitialState?.timeSpent || {});
  const [timeLeft, setTimeLeft] = useState(mappedInitialState?.timeLeft ?? test.durationMinutes * 60);
  const [visited, setVisited] = useState<number[]>(mappedInitialState?.visited || [0]);
  
  useEffect(() => {
    destroyLenis();
    requestUniversalFullscreen();
    return () => {
      initLenis();
    };
  }, []);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [isPaletteCollapsed, setIsPaletteCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as any;
    return !!(doc.fullscreenElement || 
              doc.webkitFullscreenElement || 
              doc.mozFullScreenElement || 
              doc.msFullscreenElement);
  });
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      const fsElement = doc.fullscreenElement || 
                        doc.webkitFullscreenElement || 
                        doc.mozFullScreenElement || 
                        doc.msFullscreenElement;
      setIsFullscreen(!!fsElement);
    };

    const handleFullscreenError = () => {
      setIsFullscreen(false);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    document.addEventListener('fullscreenerror', handleFullscreenError);
    document.addEventListener('webkitfullscreenerror', handleFullscreenError);
    document.addEventListener('mozfullscreenerror', handleFullscreenError);
    document.addEventListener('MSFullscreenError', handleFullscreenError);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      document.removeEventListener('fullscreenerror', handleFullscreenError);
      document.removeEventListener('webkitfullscreenerror', handleFullscreenError);
      document.removeEventListener('mozfullscreenerror', handleFullscreenError);
      document.removeEventListener('MSFullscreenError', handleFullscreenError);

      // Clean up fullscreen mode when leaving the test (unmounting)
      const doc = document as any;
      const fsElement = doc.fullscreenElement || 
                        doc.webkitFullscreenElement || 
                        doc.mozFullScreenElement || 
                        doc.msFullscreenElement;
      if (fsElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch((err) => {
            console.warn("Failed to exit fullscreen on unmount:", err);
          });
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          doc.msExitFullscreen();
        }
      }
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const doc = document as any;
    const fsElement = doc.fullscreenElement || 
                      doc.webkitFullscreenElement || 
                      doc.mozFullScreenElement || 
                      doc.msFullscreenElement;

    if (!fsElement) {
      const el = document.body as any;
      if (el.requestFullscreen) {
        el.requestFullscreen().catch((err: any) => {
          console.warn("Failed to enter fullscreen:", err);
          setIsFullscreen(false);
        });
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn("Failed to exit fullscreen:", err);
        });
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }, []);

  const [currentMode, setCurrentMode] = useState<'mock' | 'practice'>(mappedInitialState?.currentMode || mode);
  const [untimedPractice, setUntimedPractice] = useState(mappedInitialState?.untimedPractice || false);
  const [targetScore, setTargetScore] = useState(() => {
    const totalQs = (test?.questions || []).length;
    const testTotalMarks = test?.totalMarks || totalQs;
    return Math.round(testTotalMarks * 0.8);
  });
  const questionTextRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Show overview only for new tests; skip if user is genuinely resuming saved progress
  const [isStarted, setIsStarted] = useState(() => {
    if (!mappedInitialState) return false;
    if (mappedInitialState.isStarted) return true;
    const hasAnswers = Object.keys(mappedInitialState.answers || mappedInitialState.answersById || {}).length > 0;
    const hasProgress = mappedInitialState.currentQuestionIndex !== undefined || !!mappedInitialState.currentQuestionId;
    const hasPartialTime = mappedInitialState.timeLeft !== undefined && mappedInitialState.timeLeft < test.durationMinutes * 60;
    return hasAnswers || hasProgress || hasPartialTime;
  });

  // Synchronize active test state to sessionStorage on any progress/change
  useEffect(() => {
    if (isStarted && test) {
      const questions = test.questions || [];
      const answersById: Record<string, number> = {};
      const markedForReviewIds: string[] = [];
      const timeSpentById: Record<string, number> = {};
      const visitedIds: string[] = [];

      Object.entries(answers).forEach(([idxStr, val]) => {
        const idx = parseInt(idxStr);
        const q = questions[idx];
        if (q?.id) answersById[q.id] = val as number;
      });

      markedForReview.forEach(idx => {
        const q = questions[idx];
        if (q?.id) markedForReviewIds.push(q.id);
      });

      Object.entries(timeSpent).forEach(([idxStr, val]) => {
        const idx = parseInt(idxStr);
        const q = questions[idx];
        if (q?.id) timeSpentById[q.id] = val as number;
      });

      visited.forEach(idx => {
        const q = questions[idx];
        if (q?.id) visitedIds.push(q.id);
      });

      const currentQuestionId = questions[currentQuestionIndex]?.id || null;

      sessionStorage.setItem('oep_activeTestState', JSON.stringify({
        resumeSessionId: initialState?.resumeSessionId || `session-${Date.now()}`,
        userId: user?.id || null,
        test: {
          id: test.id,
          title: test.title,
          durationMinutes: test.durationMinutes,
          totalMarks: test.totalMarks,
          negativeMarking: test.negativeMarking,
          questions: test.questions
        },
        currentQuestionIndex,
        currentQuestionId,
        answers,
        answersById,
        markedForReview,
        markedForReviewIds,
        timeSpent,
        timeSpentById,
        timeLeft,
        visited,
        visitedIds,
        isStarted: true,
        currentMode,
        untimedPractice
      }));
    }
  }, [isStarted, test, currentQuestionIndex, answers, markedForReview, timeSpent, timeLeft, visited, currentMode, untimedPractice, initialState?.resumeSessionId, user]);

  // Derived test settings used on both overview & sidebar
  const totalQs = (test?.questions || []).length;
  const testTotalMarks = useMemo(() => test?.totalMarks || totalQs, [test?.totalMarks, totalQs]);
  const marksPerQ = useMemo(() => totalQs > 0 ? testTotalMarks / totalQs : 1, [totalQs, testTotalMarks]);
  const negMarkVal = useMemo(() => test?.negativeMarking || 0, [test?.negativeMarking]);
  const avgSecsPerQ = useMemo(() => totalQs > 0 ? Math.round(((test?.durationMinutes || 60) * 60) / totalQs) : 0, [totalQs, test?.durationMinutes]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const markedCount = useMemo(() => markedForReview.length, [markedForReview]);
  const unansweredCount = useMemo(() => totalQs - answeredCount, [totalQs, answeredCount]);

  const desktopPaletteRef = useRef<HTMLDivElement>(null);
  const mobilePaletteRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  currentQuestionIndexRef.current = currentQuestionIndex;

  // Scroll question text container to top when changing questions
  useEffect(() => {
    const el = questionTextRef.current;
    if (el) {
      el.scrollTop = 0;
    }
  }, [currentQuestionIndex]);

  // Update progress bar based on answered questions count (premium exam progress tracking)
  useEffect(() => {
    const bar = progressBarRef.current;
    if (!bar) return;
    const progress = totalQs > 0 ? answeredCount / totalQs : 0;
    bar.style.transform = `scaleX(${progress})`;
  }, [answeredCount, totalQs]);

  useEffect(() => {
    if (!isStarted) return; // Don't tick timer on the overview screen
    const timer = setInterval(() => {
      if (currentMode === 'practice' && untimedPractice) {
        // Untimed Practice Mode - do not tick down time
      } else {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
      setTimeSpent(prev => ({
        ...prev,
        [currentQuestionIndexRef.current]: (prev[currentQuestionIndexRef.current] || 0) + 1
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isStarted, currentMode, untimedPractice]);

  // Auto-scroll desktop palette to keep current question in view
  useEffect(() => {
    const container = desktopPaletteRef.current;
    if (!container) return;
    const btn = container.querySelector(`[data-qidx="${currentQuestionIndex}"]`) as HTMLElement | null;
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentQuestionIndex]);

  // Auto-scroll mobile palette when opened or selection changes
  useEffect(() => {
    if (!showMobilePalette) return;
    const container = mobilePaletteRef.current;
    if (!container) return;
    const raf = requestAnimationFrame(() => {
      const btn = container.querySelector(`[data-qidx="${currentQuestionIndex}"]`) as HTMLElement | null;
      if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return () => cancelAnimationFrame(raf);
  }, [showMobilePalette, currentQuestionIndex]);

  // Track visited questions for CBT status tracking
  useEffect(() => {
    if (!visited.includes(currentQuestionIndex)) {
      setVisited(prev => [...prev, currentQuestionIndex]);
    }
  }, [currentQuestionIndex]);

  // Automatically sync explanation visibility when navigating to an already answered question in Practice Mode
  useEffect(() => {
    if (currentMode === 'practice' && answers[currentQuestionIndex] !== undefined) {
      setShowExplanation(true);
    } else {
      setShowExplanation(false);
    }
  }, [currentQuestionIndex, currentMode, answers]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleAnswer = useCallback((optionIndex: number) => {
    const isNewAnswer = answers[currentQuestionIndex] === undefined;
    
    if (currentMode === 'practice' && answersRef.current[currentQuestionIndex] !== undefined) {
      setShowExplanation(true);
      return;
    }
    
    setAnswers(prev => ({ ...prev, [currentQuestionIndex]: optionIndex }));
    
    if (isNewAnswer) {
      const res = recordQuestionSolved(1, user?.id);
      if (res.goalJustCompleted) {
        window.dispatchEvent(new CustomEvent('oep-streak-goal-completed', { detail: res.newState }));
      } else {
        window.dispatchEvent(new CustomEvent('oep-streak-updated', { detail: res.newState }));
      }
    }

    if (currentMode === 'practice') {
      setShowExplanation(true);
    }
  }, [currentMode, currentQuestionIndex, answers, user?.id]);

  const toggleMarkForReview = useCallback(() => {
    setMarkedForReview(prev => 
      prev.includes(currentQuestionIndex)
        ? prev.filter(i => i !== currentQuestionIndex)
        : [...prev, currentQuestionIndex]
    );
  }, [currentQuestionIndex]);

  const handleClearResponse = useCallback(() => {
    setAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentQuestionIndex];
      return copy;
    });
    if (currentMode === 'practice') {
      setShowExplanation(false);
    }
  }, [currentMode, currentQuestionIndex]);

  const topicDistribution = useMemo(() => {
    let polity = 0;
    let geography = 0;
    let historyCount = 0;
    let math = 0;
    let general = 0;

    const questionsList = test?.questions || [];
    questionsList.forEach((q: any) => {
      const txt = (q?.questionText || '').toLowerCase();
      if (txt.includes('article') || txt.includes('president') || txt.includes('governor') || txt.includes('amendment') || txt.includes('constitution') || txt.includes('legislature') || txt.includes('parliament') || txt.includes('court') || txt.includes('high court')) {
        polity++;
      } else if (txt.includes('river') || txt.includes('lake') || txt.includes('soil') || txt.includes('district') || txt.includes('forest') || txt.includes('dam') || txt.includes('national park') || txt.includes('climate') || txt.includes('geography') || txt.includes('mineral')) {
        geography++;
      } else if (txt.includes('war') || txt.includes('battle') || txt.includes('rebellion') || txt.includes('independence') || txt.includes('dynasty') || txt.includes('king') || txt.includes('ashoka') || txt.includes('temple') || txt.includes('british') || txt.includes('freedom') || txt.includes('history')) {
        historyCount++;
      } else if (txt.includes('time') || txt.includes('work') || txt.includes('speed') || txt.includes('average') || txt.includes('ratio') || txt.includes('percent') || txt.includes('profit') || txt.includes('interest') || txt.includes('math') || txt.includes('arithmetic') || txt.includes('solve')) {
        math++;
      } else {
        general++;
      }
    });

    const total = questionsList.length;
    if (total === 0) return [];

    return [
      { name: 'Polity & Constitution', count: polity, color: 'bg-indigo-500' },
      { name: 'Geography & Environment', count: geography, color: 'bg-emerald-500' },
      { name: 'History & Art', count: historyCount, color: 'bg-amber-500' },
      { name: 'Quantitative & Logic', count: math, color: 'bg-rose-500' },
      { name: 'General Awareness', count: general, color: 'bg-slate-500' }
    ].filter(t => t.count > 0).map(t => ({
      ...t,
      percentage: Math.round((t.count / total) * 100)
    }));
  }, [test?.questions]);

  const handleSubmit = useCallback(() => {
    const questionsList = test?.questions || [];
    const totalQuestions = questionsList.length;
    const correctCount = Object.entries(answers).reduce((acc, [index, answer]) => {
      const q = questionsList[parseInt(index)];
      return acc + (q && answer === q.correctAnswerIndex ? 1 : 0);
    }, 0);
    const incorrectCount = Object.entries(answers).reduce((acc, [index, answer]) => {
      const q = questionsList[parseInt(index)];
      const isCorrect = q && answer === q.correctAnswerIndex;
      return acc + (answer !== null && answer !== undefined && !isCorrect ? 1 : 0);
    }, 0);
    const unansweredCount = totalQuestions - (correctCount + incorrectCount);

    const totalMarks = test.totalMarks || totalQuestions;
    const marksPerQuestion = totalQuestions > 0 ? (totalMarks / totalQuestions) : 1;
    const negativeMarkingValue = test.negativeMarking || 0;

    const obtainedMarks = correctCount * marksPerQuestion;
    const penaltyDeduction = incorrectCount * negativeMarkingValue;
    const finalScore = obtainedMarks - penaltyDeduction;

    const totalAttempted = correctCount + incorrectCount;
    const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;

    const streakRes = completeDailyGoalDirectly(user?.id);
    if (streakRes.goalJustCompleted) {
      window.dispatchEvent(new CustomEvent('oep-streak-goal-completed', { detail: streakRes.newState }));
    } else {
      window.dispatchEvent(new CustomEvent('oep-streak-updated', { detail: streakRes.newState }));
    }

    onComplete({
      score: finalScore,
      totalMarks: totalMarks,
      correctCount,
      incorrectCount,
      unansweredCount,
      obtainedMarks,
      penaltyDeduction,
      accuracy,
      total: totalQuestions,
      answers,
      timeTaken: currentMode === 'practice' && untimedPractice
        ? Object.keys(timeSpent).reduce((a, b) => a + (timeSpent[Number(b)] || 0), 0)
        : test.durationMinutes * 60 - timeLeft,
      timeSpent,
      markedForReview,
      test,
      mode: currentMode,
      isComplete: true
    });
  }, [test, answers, timeLeft, timeSpent, markedForReview, currentMode, untimedPractice, onComplete, user?.id]);

  const handleExit = useCallback(() => {
    const questions = test.questions || [];
    const answersById: Record<string, number> = {};
    const markedForReviewIds: string[] = [];
    const timeSpentById: Record<string, number> = {};
    const visitedIds: string[] = [];

    Object.entries(answers).forEach(([idxStr, val]) => {
      const idx = parseInt(idxStr);
      const q = questions[idx];
      if (q?.id) answersById[q.id] = val as number;
    });

    markedForReview.forEach(idx => {
      const q = questions[idx];
      if (q?.id) markedForReviewIds.push(q.id);
    });

    Object.entries(timeSpent).forEach(([idxStr, val]) => {
      const idx = parseInt(idxStr);
      const q = questions[idx];
      if (q?.id) timeSpentById[q.id] = val as number;
    });

    visited.forEach(idx => {
      const q = questions[idx];
      if (q?.id) visitedIds.push(q.id);
    });

    const currentQuestionId = questions[currentQuestionIndex]?.id || null;

    onExit({
      answers,
      answersById,
      timeLeft,
      timeSpent,
      timeSpentById,
      markedForReview,
      markedForReviewIds,
      visited,
      visitedIds,
      currentQuestionIndex,
      currentQuestionId,
      test,
      mode: currentMode,
      untimedPractice
    });
  }, [answers, timeLeft, timeSpent, markedForReview, visited, currentQuestionIndex, test, currentMode, untimedPractice, onExit]);

  const nextQuestion = useCallback(() => {
    const totalCount = (test?.questions || []).length;
    if (currentQuestionIndex < totalCount - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setShowExplanation(false);
    } else {
      setShowSubmitConfirm(true);
    }
  }, [currentQuestionIndex, test?.questions?.length]);

  const prevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setShowExplanation(false);
    }
  }, [currentQuestionIndex]);

  const currentQuestion = (test?.questions || [])[currentQuestionIndex] || { id: '', questionText: '', options: [], correctAnswerIndex: 0, explanation: '' };

  // Keyboard Shortcuts for CBT Usability (30% Modern Usability Improvements)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSubmitConfirm || showExitConfirm) return;
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key) - 1;
        if (currentQuestion && currentQuestion.options && currentQuestion.options[idx] !== undefined) {
          handleAnswer(idx);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextQuestion();
      } else if (e.key === 'ArrowLeft') {
        prevQuestion();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMarkForReview();
      } else if (e.key === 'c' || e.key === 'C') {
        handleClearResponse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQuestionIndex, showSubmitConfirm, showExitConfirm, currentQuestion, handleAnswer, nextQuestion, prevQuestion, toggleMarkForReview]);

  if (!isStarted) {
    const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(2);
    return (
      <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#FBF9F6] dark:bg-[#060B16] z-[100] flex flex-col font-sans overflow-hidden" data-lenis-prevent>
        {/* Subtle grid and gradient meshes overlay */}
        <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.3) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-[#2563eb]/5 to-transparent pointer-events-none z-[1]" />

        {/* Sticky Glassmorphic Header with Top Safe Area Inset */}
        <header className="shrink-0 flex items-center justify-between px-3.5 sm:px-10 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 sm:py-5 border-b border-slate-200/60 dark:border-slate-800 bg-white/85 dark:bg-[#060B16]/90 backdrop-blur-md z-20 relative">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2563eb]/10 dark:bg-blue-950/60 border border-[#2563eb]/20 dark:border-blue-800/60 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563eb] dark:text-blue-400" />
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500 text-[8.5px] sm:text-[10px] font-black uppercase tracking-widest block leading-none">Assessment System</span>
              <span className="text-slate-800 dark:text-white text-xs sm:text-sm font-extrabold tracking-tight mt-0.5 sm:mt-1 block">General Briefing</span>
            </div>
          </div>
          <button 
            onClick={() => onExit(undefined)} 
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/80 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all duration-200 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-3 sm:px-10 pt-3.5 sm:pt-10 pb-20 sm:pb-32 relative z-10">
          <div className="max-w-6xl mx-auto space-y-3.5 sm:space-y-8">
            
            {/* Motivation Header */}
            <div className="text-center space-y-1.5 sm:space-y-3 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2563eb]/10 dark:bg-blue-950/50 border border-[#2563eb]/20 dark:border-blue-800/60 rounded-full text-[#2563eb] dark:text-blue-400 text-[10px] font-black uppercase tracking-widest">
                <BookOpen className="w-3.5 h-3.5" /> {currentMode === 'practice' ? 'Practice Mode Active' : 'Official Mock Exam'}
              </div>
              <h1 className="text-lg sm:text-4xl font-serif font-black text-slate-900 dark:text-white tracking-tight leading-tight px-1">
                {test.title}
              </h1>
              <p className="hidden sm:block text-slate-500 dark:text-slate-400 text-sm sm:text-base font-medium leading-relaxed">
                Review the marking rubrics, select your preparation mode, analyze the distribution of topics, and initiate when ready.
              </p>
            </div>

            {/* Mode Selection Panel */}
            <div className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-[2rem] p-3.5 sm:p-6 shadow-sm max-w-4xl mx-auto space-y-3 sm:space-y-4">
              <div className="text-center">
                <span className="text-slate-400 dark:text-slate-500 text-[9.5px] sm:text-[10px] font-black uppercase tracking-widest block leading-none">Select Session Style</span>
                <h3 className="text-slate-800 dark:text-white text-xs sm:text-base font-black tracking-tight mt-1">Choose How You Want to Study</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-4">
                {/* Exam Mode Option */}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentMode('mock');
                    setUntimedPractice(false);
                  }}
                  className={cn(
                    "p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-1.5 sm:gap-0 sm:space-y-3 cursor-pointer active:scale-[0.98]",
                    currentMode === 'mock'
                      ? "border-[#2563eb] dark:border-blue-500 bg-[#2563eb]/5 dark:bg-blue-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn(
                      "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border whitespace-nowrap",
                      currentMode === 'mock'
                        ? "bg-[#2563eb] border-[#2563eb] text-white font-black"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      🏆 Exam Mode
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Strict Timed</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">Official Exam Simulation</h4>
                    <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                      Strict countdown timer. Negative markings apply. Answers and explanations will be shown only after you submit the test.
                    </p>
                    <p className="sm:hidden text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-snug">Timer · Negative marking · Results after submission</p>
                  </div>
                </button>

                {/* Practice Mode Option */}
                <button
                  type="button"
                  onClick={() => setCurrentMode('practice')}
                  className={cn(
                    "p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 text-left transition-all duration-300 flex flex-col gap-1.5 sm:gap-0 sm:space-y-3 cursor-pointer active:scale-[0.98]",
                    currentMode === 'practice'
                      ? "border-emerald-500 dark:border-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/40 shadow-sm"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={cn(
                      "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border whitespace-nowrap",
                      currentMode === 'practice'
                        ? "bg-emerald-500 border-emerald-500 text-white font-black"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    )}>
                      📖 Practice Mode
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500">Self-Paced</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">Interactive Self-Study</h4>
                    <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">
                      Immediate feedback after each response. Detailed step-by-step solutions are shown instantly. Select timed or untimed practice.
                    </p>
                    <p className="sm:hidden text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 leading-snug">Instant feedback · Step-by-step solutions</p>
                  </div>
                </button>
              </div>

              {/* Practice Mode Configurations */}
              {currentMode === 'practice' && (
                <div className="pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-6 animate-fade-in">
                  <label className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={untimedPractice}
                      onChange={(e) => setUntimedPractice(e.target.checked)}
                      className="rounded text-[#2563eb] focus:ring-[#2563eb]/40 w-3.5 h-3.5 sm:w-4 sm:h-4 accent-[#2563eb]"
                    />
                    <span>Untimed Session (Disable strict countdown timer)</span>
                  </label>
                </div>
              )}
            </div>

            {/* Asymmetric Columns (3:2 split) */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3.5 sm:gap-8 items-start">
              
              {/* Left Column: Brief details, rubrics, duration (Col Span 3) */}
              <div className="lg:col-span-3 space-y-3.5 sm:space-y-6">
                
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { label: 'Questions', value: String(totalQs), sub: 'Total count' },
                    { label: 'Duration', value: currentMode === 'practice' && untimedPractice ? 'No Limit' : test.durationMinutes + ' min', sub: 'Countdown limit' },
                    { label: 'Total Marks', value: String(testTotalMarks), sub: 'Maximum raw' },
                  ].map(s => (
                    <div key={s.label} className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-5 shadow-sm text-center sm:text-left">
                      <div className="text-lg sm:text-3xl font-serif font-extrabold text-[#2563eb] dark:text-blue-400 tracking-tight">{s.value}</div>
                      <div className="text-slate-800 dark:text-slate-200 text-[9.5px] sm:text-[11px] font-extrabold uppercase tracking-wider mt-0.5 sm:mt-1">{s.label}</div>
                      <div className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px] font-medium mt-0.5 hidden sm:block">{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Target Score & Attempts Planner */}
                <div className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-6 space-y-2.5 sm:space-y-4 shadow-sm">
                  <h3 className="text-slate-900 dark:text-white font-serif font-black flex items-center gap-2 text-sm sm:text-lg">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563eb] dark:text-blue-400" /> Target Score & Attempts Planner
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                    Set your goal for this session and analyze your permitted room for error under negative marking conditions.
                  </p>
                  
                  <div className="space-y-3 sm:space-y-4 pt-1">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-500 dark:text-slate-400">Your Target Score Goal:</span>
                      <span className="text-[#2563eb] dark:text-blue-400 font-black text-xs sm:text-sm">{targetScore} / {testTotalMarks} Marks ({Math.round(targetScore / testTotalMarks * 100)}%)</span>
                    </div>
                    
                    <input
                      type="range"
                      min={Math.round(testTotalMarks * 0.5)}
                      max={testTotalMarks}
                      step={1}
                      value={targetScore}
                      onChange={(e) => setTargetScore(parseInt(e.target.value))}
                      className="w-full accent-[#2563eb] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    
                    {/* Calculation Output Cards */}
                    {(() => {
                      const minCorrect = Math.ceil(targetScore / marksPerQ);
                      const maxIncorrect = negMarkVal > 0 
                        ? Math.floor((testTotalMarks - targetScore) / (marksPerQ + negMarkVal))
                        : totalQs - minCorrect;
                      
                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5 pt-1 sm:pt-2">
                          <div className="bg-[#FBF9F6] dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 space-y-0.5">
                            <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider block">Min. Correct Needed</span>
                            <div className="text-slate-900 dark:text-white text-sm sm:text-base font-black">{minCorrect} Questions</div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                              You must answer at least {minCorrect} questions correctly to meet your target.
                            </p>
                          </div>
                          
                          <div className="bg-[#FBF9F6] dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-3 space-y-0.5">
                            <span className="text-[8.5px] sm:text-[9px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-wider block">Max Allowed Mistakes</span>
                            <div className="text-slate-900 dark:text-white text-sm sm:text-base font-black">{maxIncorrect >= 0 ? maxIncorrect : 0} Questions</div>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                              If you attempt every question, you can afford at most {maxIncorrect >= 0 ? maxIncorrect : 0} mistakes under penalty.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Automated Topic Distribution Visualizer */}
                {topicDistribution.length > 0 && (
                  <div className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 shadow-sm">
                    <h3 className="text-slate-900 dark:text-white font-serif font-black flex items-center gap-2 text-sm sm:text-lg">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563eb] dark:text-blue-400" /> Syllabus Topic Breakdown
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">
                      Analysis of this test paper showing the concentration of core syllabus topics.
                    </p>
                    
                    {/* Visual Segmented Bar */}
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex border border-slate-200/40 dark:border-slate-700 mt-1">
                      {topicDistribution.map((t) => (
                        <div
                          key={t.name}
                          className={t.color}
                          style={{ width: `${t.percentage}%` }}
                          title={`${t.name}: ${t.count} Qs (${t.percentage}%)`}
                        />
                      ))}
                    </div>
                    
                    {/* Legends Grid */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-1">
                      {topicDistribution.map((t) => (
                        <div key={t.name} className="flex items-center gap-2 text-[10.5px] sm:text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          <span className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0", t.color)} />
                          <span className="truncate">{t.name}:</span>
                          <span className="text-slate-900 dark:text-white font-extrabold shrink-0">{t.count} Qs ({t.percentage}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marking Rubric Details */}
                <div className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-6 space-y-3 sm:space-y-5 shadow-sm">
                  <h3 className="text-slate-900 dark:text-white font-serif font-black flex items-center gap-2 text-sm sm:text-lg">
                    <Target className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563eb] dark:text-blue-400" /> Marking Rubric & Scoring
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl p-2.5 sm:p-3.5 text-center sm:text-left">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-emerald-700 dark:text-emerald-300 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Correct</div>
                        <div className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-lg mt-0.5">+{fmt(marksPerQ)}</div>
                      </div>
                    </div>

                    <div className={cn(
                      'flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 rounded-xl p-2.5 sm:p-3.5 border text-center sm:text-left', 
                      negMarkVal > 0 
                        ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60' 
                        : 'bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-800'
                    )}>
                      <div className={cn(
                        'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0',
                        negMarkVal > 0 ? 'bg-rose-500/10 dark:bg-rose-500/20' : 'bg-slate-200/50 dark:bg-slate-800'
                      )}>
                        <TrendingDown className={cn('w-4 h-4 sm:w-5 sm:h-5', negMarkVal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400')} />
                      </div>
                      <div className="min-w-0">
                        <div className={cn(
                          'text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate', 
                          negMarkVal > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-slate-400 dark:text-slate-500'
                        )}>Incorrect</div>
                        <div className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-lg mt-0.5">
                          {negMarkVal > 0 ? '-' + fmt(negMarkVal) : '0'}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-center gap-1.5 sm:gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-xl p-2.5 sm:p-3.5 text-center sm:text-left">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-slate-200/50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-slate-400 dark:text-slate-500 text-[8.5px] sm:text-[10px] font-bold uppercase tracking-wider truncate">Unanswered</div>
                        <div className="text-slate-900 dark:text-white font-extrabold text-sm sm:text-lg mt-0.5">0</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Time Allocation details */}
                <div className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3.5 sm:p-6 space-y-3 sm:space-y-4 shadow-sm">
                  <h3 className="text-slate-900 dark:text-white font-serif font-black flex items-center gap-2 text-sm sm:text-lg">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-[#2563eb] dark:text-blue-400" /> Pace & Time Budget
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
                    <div className="bg-[#FBF9F6] dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Duration Budget</div>
                      <div className="text-slate-800 dark:text-white font-serif font-extrabold text-base sm:text-2xl">
                        {currentMode === 'practice' && untimedPractice ? 'No Time Limit' : test.durationMinutes + ' min'}
                      </div>
                    </div>
                    <div className="bg-[#FBF9F6] dark:bg-slate-900 rounded-xl p-3 sm:p-4 border border-slate-200/60 dark:border-slate-800">
                      <div className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mb-0.5 sm:mb-1">Target Pace</div>
                      <div className="text-slate-800 dark:text-white font-serif font-extrabold text-base sm:text-2xl">
                        {avgSecsPerQ} <span className="text-[10px] sm:text-xs font-sans font-semibold text-slate-400 uppercase tracking-widest ml-0.5">sec / Q</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Instructions, start button (Col Span 2) */}
              <div className="lg:col-span-2 space-y-3.5 sm:space-y-6">
                
                {/* CBT Keyboard Navigation Guide */}
                <div className="hidden sm:block bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
                  <h3 className="text-slate-900 dark:text-white font-serif font-black text-base flex items-center gap-2">
                    <Zap className="w-4.5 h-4.5 text-amber-500" /> CBT Keyboard Shortcuts
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold leading-relaxed">
                     OdishaExamPrep CBT engine supports fully functional keyboard shortcuts for quick and efficient test-taking.
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { keys: ['1', '2', '3', '4'], desc: 'Select option A, B, C, or D' },
                      { keys: ['ArrowRight', 'Enter'], desc: 'Save Response & Next' },
                      { keys: ['ArrowLeft'], desc: 'Go Back to Previous' },
                      { keys: ['M'], desc: 'Flag Question for Review' },
                      { keys: ['C'], desc: 'Clear Current Response' }
                    ].map(sh => (
                      <div key={sh.desc} className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-2.5 rounded-xl text-[11px] font-semibold">
                        <div className="flex gap-1 shrink-0">
                          {sh.keys.map(k => (
                            <kbd key={k} className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm rounded text-[9px] font-black text-slate-700 dark:text-slate-200 font-mono">{k}</kbd>
                          ))}
                        </div>
                        <span className="text-slate-600 dark:text-slate-300 font-medium leading-tight">{sh.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Instructions Panel */}
                <div className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-3.5 sm:space-y-5 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563eb]/5 rounded-full blur-2xl pointer-events-none" />
                  
                  <h3 className="text-slate-900 dark:text-white font-serif font-black text-sm sm:text-lg">Instructions for Candidates</h3>
                  
                  <ul className="space-y-2.5 sm:space-y-4">
                    {[
                      'Read each problem statement carefully before selecting options.',
                      'You can bookmark questions for review and return to them anytime.',
                      currentMode === 'practice' && untimedPractice ? 'You are taking this session as an untimed practice.' : 'The count-down timer starts instantly when you click the Start button.',
                      'Closing the browser pauses progress; you can resume from your dashboard.',
                      negMarkVal > 0 && currentMode === 'mock' ? `Incorrect responses incur a penalty of ${fmt(negMarkVal)} marks.` : 'There are no scoring penalties for incorrect answers in Practice mode.',
                      'The question palette is available for quick vertical navigation.',
                    ].map((ins, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                        <span className="w-5 h-5 rounded-full bg-[#2563eb]/10 dark:bg-blue-950/80 border border-blue-200/30 dark:border-blue-800/50 flex items-center justify-center shrink-0 text-[#2563eb] dark:text-blue-400 text-[10.5px] font-extrabold font-serif mt-0.5">
                          {i + 1}
                        </span>
                        <span>{ins}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* Sticky Fixed Bottom Start Button Container with Safe Area Inset */}
        <div className="shrink-0 px-3.5 sm:p-6 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)] bg-white/95 dark:bg-[#060B16]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 z-20 flex justify-center shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => {
              requestUniversalFullscreen();
              setIsStarted(true);
            }}
            className="max-w-3xl w-full py-3 sm:py-4.5 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base transition-all duration-300 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2.5 active:scale-[0.98] cursor-pointer premium-btn-transition border-none"
          >
            <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-white" /> Initiate Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] bg-[#FBF9F6] dark:bg-[#060B16] z-[100] flex flex-col font-sans overflow-hidden" data-lenis-prevent>
      {/* Subtle print grid texture overlay */}
      <div className="absolute inset-0 pointer-events-none z-[1] opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, rgba(37,99,235,0.3) 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
      
      {/* Header (CBT Candidate + Exam details with Top Safe Area) */}
      <header className="h-auto min-h-[3.75rem] sm:min-h-[4.5rem] bg-white/85 dark:bg-[#060B16]/90 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between px-3 sm:px-8 pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 sm:pb-0 shrink-0 sticky top-0 z-40 relative shadow-sm">
        {/* Scroll Progress Bar */}
        <div ref={progressBarRef} className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563eb] origin-left transition-transform duration-75 ease-out scale-x-0 z-50" />

        <div className="flex items-center gap-2 sm:gap-4 relative z-10 min-w-0 flex-1 mr-3">
          <button 
            onClick={() => setShowExitConfirm(true)} 
            className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 hover:border-rose-100 rounded-xl transition-all duration-200 cursor-pointer text-slate-500 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-white shrink-0"
            title="Exit Assessment"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Fullscreen Toggle Button (Desktop/Laptop only) */}
          <button
            onClick={toggleFullscreen}
            className="hidden lg:flex w-10 h-10 sm:w-11 sm:h-11 items-center justify-center bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all duration-200 cursor-pointer text-slate-500 dark:text-slate-300 hover:text-[#2563eb] dark:hover:text-white shrink-0"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            ) : (
              <Maximize2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="font-serif font-extrabold text-slate-900 dark:text-white truncate tracking-tight leading-tight text-sm sm:text-xl">{test.title}</h1>
            <p className="text-[8px] sm:text-[10px] font-black text-[#2563EB] dark:text-blue-400 uppercase tracking-widest leading-none mt-0.5 sm:mt-1">Subject: General Awareness</p>
          </div>
        </div>

        {/* Central Official Timer */}
        <div className="flex items-center gap-1.5 sm:gap-4 relative z-10 shrink-0">
          <div className={cn(
            "h-10 sm:h-11 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 rounded-xl font-mono font-black text-xs sm:text-base border transition-all duration-300 shadow-sm shrink-0",
            currentMode === 'practice' && untimedPractice
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-250 dark:border-emerald-800"
              : timeLeft < 60
                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                : timeLeft < 300
                  ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700"
          )}>
            <Timer className={cn("w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#2563EB] dark:text-blue-400", timeLeft < 300 && !(currentMode === 'practice' && untimedPractice) && "animate-pulse")} />
            <span className="hidden sm:inline text-[11px] font-black uppercase text-slate-400 dark:text-slate-400 font-sans tracking-wider leading-none mt-0.5">
              {currentMode === 'practice' && untimedPractice ? t('testEngine.timer.timeElapsed', 'Time Elapsed:') : t('testEngine.timer.timeRemaining', 'Time Left:')}
            </span>
            <span className="tracking-widest">
              {currentMode === 'practice' && untimedPractice 
                ? formatTime(Object.keys(timeSpent).reduce((a, b) => a + (timeSpent[Number(b)] || 0), 0))
                : formatTime(timeLeft)}
            </span>
          </div>

          <button 
            onClick={() => setShowSubmitConfirm(true)}
            className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white w-10 h-10 sm:w-auto sm:h-11 flex items-center justify-center sm:px-6 rounded-xl font-bold transition-all duration-300 text-xs sm:text-sm uppercase tracking-widest cursor-pointer shadow-md shadow-[#2563eb]/10 hover:shadow-lg hover:shadow-[#2563eb]/20 active:scale-95 gap-1.5 sm:gap-2 shrink-0 border-none"
          >
            <Send className="w-4 h-4 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">{t('testEngine.controls.submitTest', 'Submit')}</span>
          </button>
        </div>
      </header>

      {/* Split CBT Layout Container */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left Side: Question Pane */}
        <div className="flex-1 flex flex-col min-w-0 bg-transparent border-r border-slate-200/60 dark:border-slate-800">
          {/* Question Scoring Info Bar */}
          <div className="h-9 sm:h-12 bg-slate-50/50 dark:bg-[#060B16]/90 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between px-3.5 sm:px-8 shrink-0 select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] dark:bg-blue-400 shrink-0" />
              <span className="leading-tight truncate">
                <span className="hidden sm:inline text-xs font-bold text-slate-500 dark:text-slate-300">{t('testEngine.palette.mcq', 'Multiple Choice Question (MCQ)')}</span>
                <span className="sm:hidden text-[10px] text-slate-600 dark:text-slate-300 font-extrabold uppercase tracking-widest">{t('testEngine.palette.mcq', 'MCQ')}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100/80 dark:border-emerald-800">
                {t('testEngine.palette.correct', 'Correct')}: +{marksPerQ.toFixed(2)}
              </span>
              {negMarkVal > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-100/80 dark:border-rose-800">
                  {t('testEngine.palette.negative', 'Neg')}: -{negMarkVal.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* ── Adaptive Main Content Area ──
               Detects complex/math-heavy questions and switches layout automatically.
               - Normal questions: side-by-side grid (question left, options right)
               - Math-heavy questions: stacked full-width (question top, options below)
          */}
          {(() => {
            const mathHeavy = isMathHeavyQuestion(currentQuestion.questionText) || !!currentQuestion.diagram;
            const mathBlockCount = countMathBlocks(currentQuestion.questionText);
            const useCompactBlocks = mathBlockCount >= 2;
            const paragraphs = (currentQuestion.questionText || '').split('\n\n').filter(Boolean);

            return (
              <main className={cn(
                "flex-1 px-3 py-3 sm:p-5 lg:p-6 relative bg-[#FBF9F6] dark:bg-[#060B16] flex flex-col overscroll-contain",
                (mathHeavy || showExplanation) ? "overflow-y-auto no-scrollbar" : "overflow-hidden"
              )} data-lenis-prevent>
                <div className={cn(
                  "w-full flex flex-col space-y-2.5 sm:space-y-3 lg:space-y-4 mx-auto transition-all duration-300",
                  isPaletteCollapsed ? "max-w-[96%] lg:max-w-[94%]" : "max-w-4xl lg:max-w-6xl",
                  !mathHeavy && "h-full overflow-hidden"
                )}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuestionIndex}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.15 }}
                      className={cn(
                        "flex flex-col gap-3 sm:gap-4",
                        !mathHeavy && (isPaletteCollapsed 
                          ? "lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:grid-rows-1 lg:gap-10 lg:h-full min-h-0 flex-1"
                          : "lg:grid lg:grid-cols-2 lg:grid-rows-1 lg:gap-8 lg:h-full min-h-0 flex-1")
                      )}
                    >
                      {/* ── Question Panel ── */}
                      <div className={cn(
                        "bg-white dark:bg-[#0B1528] rounded-xl sm:rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex flex-col space-y-2.5 sm:space-y-3",
                        mathHeavy
                          ? "px-3 py-4 sm:p-6"
                          : "px-2.5 py-3 sm:p-5 flex-shrink-0 lg:flex-1 lg:h-full lg:max-h-none overflow-hidden"
                      )}>
                        {/* Question label + Math badge */}
                        <div className="flex items-center justify-between flex-shrink-0 gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] sm:text-xs font-bold text-[#2563EB] dark:text-blue-400 bg-[#2563EB]/5 dark:bg-blue-950/60 rounded-lg border border-[#2563EB]/15 dark:border-blue-800">
                              <FileText className="w-3.5 h-3.5 animate-pulse-soft" />
                              {t('testEngine.palette.question', 'Question')} {currentQuestionIndex + 1} {t('testEngine.palette.of', 'of')} {(test?.questions || []).length}
                            </span>
                            {currentMode === 'practice' && answers[currentQuestionIndex] !== undefined && (
                              <button
                                onClick={() => setShowExplanation(prev => !prev)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100/80 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 rounded-lg transition-all cursor-pointer active:scale-95"
                              >
                                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span>{showExplanation ? t('testEngine.review.hideSolution', 'Hide Explanation') : t('testEngine.review.solutionBreakdown', 'Solution Breakdown')}</span>
                              </button>
                            )}
                          </div>
                          {((/(\$\$[\s\S]*?\$\$|\\\\?\[[\s\S]*?\\\\?\]|\\\\?\([\s\S]*?\\\\?\))/).test(currentQuestion.questionText || '') || countMathBlocks(currentQuestion.questionText) >= 1) && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                              <span className="text-sm leading-none select-none">∑</span> Math
                            </span>
                          )}
                        </div>

                        {/* Question text with smart paragraph rendering */}
                        <div
                          ref={questionTextRef}
                          className={cn(
                            "text-[15px] sm:text-lg lg:text-xl font-serif font-extrabold text-slate-900 dark:text-white leading-relaxed break-words overflow-wrap-anywhere",
                            !mathHeavy && "flex-1 overflow-y-auto pr-2 no-scrollbar"
                          )}
                        >
                          {paragraphs.map((para, i) => (
                            <p key={i} className="mb-3 last:mb-0">
                              <MathTextRenderer
                                text={para}
                                blockSize={useCompactBlocks ? 'sm' : 'md'}
                              />
                            </p>
                          ))}
                          {currentQuestion.diagram ? (
                            <div className="mt-4 sm:mt-5 w-full block">
                              <DiagramRenderer
                                diagram={currentQuestion.diagram}
                                data={currentQuestion.diagram}
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* ── Options & Explanation ── */}
                      <div className={cn(
                        "space-y-3 lg:space-y-4 px-1.5 pb-6",
                        (!mathHeavy && !showExplanation) && "flex-1 overflow-y-auto no-scrollbar min-h-0 py-1 lg:h-full flex flex-col justify-start",
                        (mathHeavy || showExplanation) && "py-1 overflow-y-auto no-scrollbar flex-1"
                      )}>
                        <div className={cn(
                          "grid gap-2 lg:gap-2.5",
                          mathHeavy ? "sm:grid-cols-2" : "max-w-3xl"
                        )}>
                          {(Array.isArray(currentQuestion.options) ? currentQuestion.options : []).map((option, idx) => {
                            const isSelected = answers[currentQuestionIndex] === idx;
                            const isCorrect = idx === currentQuestion.correctAnswerIndex;
                            const showResult = currentMode === 'practice' && answers[currentQuestionIndex] !== undefined;

                            return (
                              <button
                                key={`q${currentQuestionIndex}-o${idx}`}
                                onClick={() => handleAnswer(idx)}
                                className={cn(
                                  "mcq-option group w-full text-left py-3 px-3.5 sm:py-2.5 sm:px-4 rounded-xl border transition-all duration-300 relative cursor-pointer select-none flex items-start gap-3 sm:gap-4 shadow-sm active:scale-[0.98]",
                                  showResult
                                    ? isCorrect 
                                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 shadow-sm" 
                                      : isSelected ? "border-rose-500 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 shadow-sm" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1528] text-slate-800 dark:text-slate-200"
                                    : isSelected 
                                      ? "border-[#2563EB] dark:border-blue-500 bg-gradient-to-r from-[#2563EB]/5 to-white dark:to-[#0B1528] text-slate-900 dark:text-white shadow-md ring-1 ring-[#2563EB]" 
                                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B1528] text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/60 hover:shadow-md"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-black text-[11px] sm:text-xs shrink-0 transition-all duration-300 pointer-events-none mt-0.5 sm:mt-1",
                                  showResult
                                    ? isCorrect 
                                      ? "bg-emerald-600 text-white" 
                                      : isSelected ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-400"
                                    : isSelected 
                                      ? "bg-[#2563EB] dark:bg-blue-600 text-white" 
                                      : "bg-slate-100 dark:bg-[#060B16] text-slate-500 dark:text-slate-300 group-hover:bg-slate-200/70 dark:group-hover:bg-slate-800"
                                )}>
                                  {String.fromCharCode(65 + idx)}
                                </div>
                                
                                <span className={cn(
                                  "flex-1 text-slate-800 dark:text-slate-200 text-sm sm:text-base transition-all pointer-events-none min-w-0 leading-tight",
                                  isSelected ? "font-bold text-slate-900 dark:text-white" : "font-medium text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                                )}><MathTextRenderer text={option} isOption /></span>
                                
                                {showResult && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 pointer-events-none mt-1 sm:mt-1.5" />}
                                {showResult && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 pointer-events-none mt-1 sm:mt-1.5" />}
                                
                                {!showResult && (
                                  <span className={cn(
                                    "text-[10px] font-mono font-black border px-2 py-0.5 rounded-md hidden sm:inline ml-auto select-none transition-all duration-300 pointer-events-none mt-1 sm:mt-1.5",
                                    isSelected 
                                      ? "border-[#2563EB]/30 bg-[#2563EB]/5 text-[#2563EB] dark:text-blue-400" 
                                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400 opacity-0 group-hover:opacity-100"
                                  )}>
                                    Press {idx + 1}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {showExplanation && (
                          <motion.div {...fadeSlideUp}
                            className="math-explanation rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-[#0B1528] p-5 sm:p-6 space-y-3 relative shadow-sm shrink-0 mb-6"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/3 rounded-full blur-2xl pointer-events-none" />
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                              </div>
                              <div>
                                <h4 className="font-serif font-black text-slate-900 dark:text-white text-base leading-none">Expert Explanation</h4>
                                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase tracking-wider mt-1 block">Solution Breakdown</span>
                              </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-serif font-medium border-l-4 border-[#2563EB] dark:border-blue-500 pl-4 py-1">
                              <MathTextRenderer text={currentQuestion.explanation} />
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </main>
            );
          })()}


          {/* Bottom Official Exam Navigation Footer with Bottom Safe Area */}
          <div className="shrink-0 bg-white/95 dark:bg-[#060B16]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pt-2 sm:py-3 pb-[max(env(safe-area-inset-bottom),0.625rem)] px-3 sm:px-8 shadow-sm">
            <div className={cn(
              "w-full mx-auto transition-all duration-300",
              isPaletteCollapsed ? "max-w-[96%] lg:max-w-[94%]" : "max-w-4xl lg:max-w-6xl"
            )}>
              
              {/* Mobile View Navigation (hidden on lg and above) */}
              <div className="flex flex-col gap-2 lg:hidden w-full">
                {/* Upper row: Utility functions */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button 
                    onClick={toggleMarkForReview}
                    className={cn(
                      "py-2 px-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center justify-center gap-1 cursor-pointer",
                      markedForReview.includes(currentQuestionIndex)
                        ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 shadow-sm"
                        : "bg-slate-50 dark:bg-[#0B1528] border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white"
                    )}
                  >
                    <Flag className="w-3 h-3 shrink-0" />
                    <span>{t('testEngine.controls.mark', 'Mark')}</span>
                  </button>
                  
                  <button 
                    onClick={handleClearResponse}
                    className="py-2 px-2 rounded-lg bg-slate-50 dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3 shrink-0" />
                    <span>{t('testEngine.controls.clear', 'Clear')}</span>
                  </button>

                  <button 
                    onClick={() => setShowMobilePalette(true)}
                    className="py-2 px-2 rounded-lg bg-slate-50 dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                  >
                    <LayoutGrid className="w-3 h-3 shrink-0" />
                    <span>{t('testEngine.controls.palette', 'Palette')}</span>
                  </button>
                </div>

                {/* Lower row: Primary navigation */}
                <div className="grid grid-cols-5 gap-2">
                  <button 
                    disabled={currentQuestionIndex === 0}
                    onClick={prevQuestion}
                    className="col-span-2 bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 py-3 sm:py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-1 active:scale-[0.97]"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t('testEngine.controls.back', 'Back')}
                  </button>
                  <button 
                    onClick={nextQuestion}
                    className="col-span-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-3 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-md shadow-[#2563eb]/10 active:scale-95 flex items-center justify-center gap-1 cursor-pointer border-none"
                  >
                    {currentQuestionIndex === (test?.questions || []).length - 1 ? t('testEngine.controls.saveAndSubmit', 'Save & Submit') : t('testEngine.controls.saveAndNext', 'Save & Next')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Desktop View Navigation (hidden below lg) */}
              <div className="hidden lg:flex w-full items-center justify-between">
                {/* Left group */}
                <div className="flex gap-2.5">
                  <button 
                    onClick={toggleMarkForReview}
                    className={cn(
                      "px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer border flex items-center gap-1.5",
                      markedForReview.includes(currentQuestionIndex)
                        ? "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 shadow-sm"
                        : "bg-white dark:bg-[#0B1528] hover:bg-amber-50/50 dark:hover:bg-amber-950/40 border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300"
                    )}
                  >
                    <Flag className="w-3.5 h-3.5" /> {t('testEngine.controls.markForReview', 'Mark for Review')}
                  </button>
                  <button 
                    onClick={handleClearResponse}
                    className="bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-700 dark:hover:text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer"
                  >
                    {t('testEngine.controls.clearAnswer', 'Clear Answer')}
                  </button>
                </div>

                {/* Right group */}
                <div className="flex gap-2.5">
                  <button 
                    disabled={currentQuestionIndex === 0}
                    onClick={prevQuestion}
                    className="bg-white dark:bg-[#0B1528] border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> {t('testEngine.controls.back', 'Back')}
                  </button>
                  <button 
                    onClick={nextQuestion}
                    className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md shadow-[#2563eb]/10 hover:shadow-lg active:scale-95 flex items-center gap-1 font-extrabold border-none"
                  >
                    {currentQuestionIndex === (test?.questions || []).length - 1 ? t('testEngine.controls.saveAndSubmit', 'Save & Submit') : t('testEngine.controls.saveAndNext', 'Save & Next')} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Toggle Palette Button (Desktop/Laptop only) */}
        <button
          onClick={() => setIsPaletteCollapsed(!isPaletteCollapsed)}
          className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-50 bg-white dark:bg-[#0B1528] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 w-5.5 h-16 rounded-l-xl items-center justify-center cursor-pointer shadow-md transition-all duration-300 hover:w-6.5 hover:shadow-lg focus:outline-none text-slate-500 dark:text-slate-300"
          style={{
            right: isPaletteCollapsed ? '0px' : '320px',
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s'
          }}
          title={isPaletteCollapsed ? "Expand Question Palette" : "Collapse Question Palette"}
        >
          {isPaletteCollapsed ? (
            <ChevronLeft className="w-4 h-4 text-slate-500 dark:text-slate-300 animate-[pulse_2s_infinite]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-300" />
          )}
        </button>

        {/* Right Side: CBT Candidate Profile & Question Palette (Premium Redesign) */}
        <aside 
          className={cn(
            "bg-white dark:bg-[#0B1528] flex flex-col shrink-0 hidden lg:flex border-l border-slate-200/60 dark:border-slate-800 transition-all duration-300 ease-in-out overflow-hidden relative",
            isPaletteCollapsed ? "w-0 border-l-0" : "w-80"
          )}
        >
          {/* Inner wrapper with fixed width to prevent wrapping/squishing during animation */}
          <div className="w-80 h-full flex flex-col shrink-0">
          
          {/* Candidate Card */}
          <div className="p-5 border-b border-slate-200/60 dark:border-slate-800 flex items-center gap-3.5 bg-slate-50/50 dark:bg-[#060B16]/80">
            <div className="w-12 h-12 bg-gradient-to-tr from-[#2563eb] to-[#1d4ed8] text-white rounded-2xl font-serif font-black flex items-center justify-center text-lg shadow-sm border border-[#2563eb]/10">
              {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'N'}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest leading-none">Session Active</p>
              <h4 className="font-serif font-black text-slate-800 dark:text-white truncate max-w-[190px] text-sm mt-1">{user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Naresh Samal"}</h4>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] text-slate-400 dark:text-slate-400 font-extrabold uppercase tracking-wider">Candidate Verified</span>
              </div>
            </div>
          </div>

          {/* Palette Grid Header */}
          <div className="p-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
            <h3 className="font-serif font-black text-xs text-slate-900 dark:text-white uppercase tracking-wider">{t('testEngine.palette.questionPalette', 'Question Palette')}</h3>
            <span className="text-[10px] font-black text-[#2563EB] dark:text-blue-400 bg-[#2563EB]/5 dark:bg-blue-950/60 border border-[#2563EB]/10 dark:border-blue-800 px-2 py-0.5 rounded-md tracking-wider tabular-nums">
              {answeredCount}/{(test?.questions || []).length} {t('testEngine.palette.saved', 'Saved')}
            </span>
          </div>

          <div ref={desktopPaletteRef} className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar palette-scroll overscroll-contain" data-lenis-prevent>
            <div className="grid grid-cols-4 gap-3">
              {(test?.questions || []).map((_, idx) => {
                const isAnswered = answers[idx] !== undefined;
                const isMarked = markedForReview.includes(idx);
                const isCurrent = currentQuestionIndex === idx;
                const isVisited = visited.includes(idx);

                let btnStyle = "";
                let badgeElement = null;

                if (isAnswered && isMarked) {
                  // Answered & Marked for Review (Yellow/Amber bg + Green Check badge)
                  btnStyle = "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl font-bold hover:bg-amber-100/60 dark:hover:bg-amber-900/60";
                  badgeElement = <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-black shadow-sm">✓</span>;
                } else if (isMarked) {
                  // Marked for Review (Yellow/Amber bg + Amber exclamation badge)
                  btnStyle = "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl font-bold hover:bg-amber-100/60 dark:hover:bg-amber-900/60";
                  badgeElement = <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-black shadow-sm">!</span>;
                } else if (isAnswered) {
                  // Answered (Green bg)
                  btnStyle = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60";
                } else if (isVisited) {
                  // Not Answered but Visited (Rose bg)
                  btnStyle = "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold hover:bg-rose-100/60 dark:hover:bg-rose-900/60";
                } else {
                  // Not Visited (Gray bg)
                  btnStyle = "bg-slate-50 dark:bg-[#060B16] text-slate-400 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 rounded-xl font-bold hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/50 dark:hover:bg-slate-800/50";
                }

                if (isCurrent) {
                  btnStyle += " ring-2 ring-offset-2 dark:ring-offset-[#0B1528] ring-[#2563EB] dark:ring-blue-500 scale-105 z-10 shadow-sm";
                }

                return (
                  <motion.button
                    key={idx}
                    data-qidx={idx}
                    onClick={() => {
                      setCurrentQuestionIndex(idx);
                      setShowExplanation(false);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className={cn(
                      "w-11 h-11 text-xs transition-[background-color,border-color,box-shadow] duration-200 relative flex items-center justify-center cursor-pointer",
                      btnStyle
                    )}
                  >
                    {badgeElement}
                    <span>{idx + 1}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* CBT Legend Box */}
          <div className="p-5 border-t border-slate-200/60 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060B16]/80 space-y-3 shrink-0">
            <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-widest">{t('testEngine.palette.legendOverview', 'Legend Overview')}</h4>
            <div className="grid grid-cols-2 gap-2.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shrink-0" />
                <span>{t('testEngine.palette.answered', 'Answered')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 shrink-0" />
                <span>{t('testEngine.palette.notAnswered', 'Not Answered')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-slate-50 dark:bg-[#060B16] border border-slate-200 dark:border-slate-800 shrink-0" />
                <span>{t('testEngine.palette.notVisited', 'Not Visited')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 shrink-0 relative flex items-center justify-center">
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full border border-white dark:border-slate-900" />
                </span>
                <span>{t('testEngine.palette.markedForReview', 'Marked')}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <span className="w-5 h-5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 shrink-0 relative flex items-center justify-center">
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[5px] text-white font-black">✓</span>
                </span>
                <span>{t('testEngine.palette.markedAndAnswered', 'Marked & Answered')}</span>
              </div>
            </div>
          </div>
          </div>
        </aside>
      </div>

      {/* Mobile Palette Bottom Sheet */}
      <AnimatePresence>
        {showMobilePalette && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex flex-col justify-end lg:hidden"
            onClick={() => setShowMobilePalette(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="bg-white dark:bg-[#0B1528] rounded-t-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl border-t border-slate-200/80 dark:border-slate-800"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-[#060B16]">
                <div>
                  <h3 className="font-serif font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">{t('testEngine.palette.questionPalette', 'Question Palette')}</h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mt-0.5">
                    {answeredCount} of {(test?.questions || []).length} {t('testEngine.palette.saved', 'Questions Saved')}
                  </p>
                </div>
                <button 
                  onClick={() => setShowMobilePalette(false)}
                  className="p-2 text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Palette grid */}
              <div ref={mobilePaletteRef} className="overflow-y-auto px-4 py-3 flex-1 no-scrollbar palette-scroll overscroll-contain" data-lenis-prevent>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2.5">
                  {(test?.questions || []).map((_, idx) => {
                    const isAnswered = answers[idx] !== undefined;
                    const isMarked = markedForReview.includes(idx);
                    const isCurrent = currentQuestionIndex === idx;
                    const isVisited = visited.includes(idx);

                    let btnStyle = "";
                    let badgeElement = null;

                    if (isAnswered && isMarked) {
                      btnStyle = "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl font-bold";
                      badgeElement = <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[7px] text-white font-black shadow-sm">✓</span>;
                    } else if (isMarked) {
                      btnStyle = "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl font-bold";
                      badgeElement = <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-white dark:border-slate-900 flex items-center justify-center text-[7px] text-white font-black shadow-sm">!</span>;
                    } else if (isAnswered) {
                      btnStyle = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold";
                    } else if (isVisited) {
                      btnStyle = "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl font-bold";
                    } else {
                      btnStyle = "bg-slate-50 dark:bg-[#060B16] text-slate-400 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 rounded-xl font-bold";
                    }

                    if (isCurrent) {
                      btnStyle += " ring-2 ring-offset-1 dark:ring-offset-[#0B1528] ring-[#2563EB] dark:ring-blue-500 scale-105 z-10";
                    }

                    return (
                      <motion.button
                        key={idx}
                        data-qidx={idx}
                        onClick={() => {
                          setCurrentQuestionIndex(idx);
                          setShowExplanation(false);
                          setShowMobilePalette(false);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className={cn(
                          "w-11 h-11 text-xs relative flex items-center justify-center cursor-pointer mx-auto transition-[background-color,border-color,box-shadow] duration-200",
                          btnStyle
                        )}
                      >
                        {badgeElement}
                        <span>{idx + 1}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Legend */}
              <div className="px-4 pt-3 pb-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#060B16] shrink-0">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shrink-0" />
                    <span>{t('testEngine.palette.answered', 'Answered')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 shrink-0" />
                    <span>{t('testEngine.palette.notAnswered', 'Not Answered')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-slate-50 dark:bg-[#060B16] border border-slate-200 dark:border-slate-800 shrink-0" />
                    <span>{t('testEngine.palette.notVisited', 'Not Visited')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 shrink-0 relative">
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full border border-white dark:border-slate-900" />
                    </span>
                    <span>{t('testEngine.palette.markedForReview', 'Marked')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/80 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
            <motion.div {...modalContent}
              className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0B1528] shadow-2xl max-w-md w-full border border-slate-200/80 dark:border-slate-800"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#2563EB]/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="p-6 sm:p-8 text-center space-y-6 relative z-10">
                <div className="w-16 h-16 bg-[#2563EB]/10 dark:bg-blue-950/60 rounded-2xl flex items-center justify-center mx-auto border border-[#2563EB]/20 dark:border-blue-800/60">
                  <Send className="text-[#2563EB] dark:text-blue-400 w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-white tracking-tight">{t('testEngine.submitModal.title', 'Confirm Submission')}</h3>
                  <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">
                    {t('testEngine.submitModal.summary', `You have answered ${answeredCount} out of ${(test?.questions || []).length} questions.`, { answered: answeredCount, total: (test?.questions || []).length })}
                  </p>
                </div>

                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-[#2563EB] dark:bg-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(answeredCount / ((test?.questions || []).length || 1)) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleSubmit}
                    className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-md shadow-emerald-600/10 hover:shadow-lg hover:shadow-emerald-600/20 active:scale-95 premium-btn-transition border-none"
                  >
                    {t('testEngine.submitModal.confirmBtn', 'Submit Test Now')}
                  </button>
                  <button 
                    onClick={() => setShowSubmitConfirm(false)}
                    className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors rounded-xl cursor-pointer"
                  >
                    {t('common.actions.cancel', 'Cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit Confirmation Modal */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/80 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
            <motion.div {...modalContent}
              className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0B1528] shadow-2xl max-w-md w-full border border-slate-200/80 dark:border-slate-800"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#2563EB]/5 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="p-6 sm:p-8 text-center space-y-6 relative z-10">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center mx-auto">
                  <LogOut className="text-slate-600 dark:text-slate-300 w-8 h-8" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-serif font-black text-slate-900 dark:text-white tracking-tight">{t('testEngine.exitModal.title', 'Pause & Exit Exam?')}</h3>
                  <p className="text-slate-500 dark:text-slate-300 text-sm font-medium">{t('testEngine.exitModal.description', 'Your progress is automatically saved. You can easily resume exactly where you left off from your dashboard later.')}</p>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 dark:bg-[#060B16] rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-400" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {answeredCount} {t('testEngine.palette.of', 'of')} {(test?.questions || []).length} {t('testEngine.palette.answered', 'answered')}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleExit}
                    className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#2563EB] hover:bg-[#1d4ed8] text-white transition-all cursor-pointer shadow-md shadow-[#2563EB]/10 hover:shadow-lg hover:shadow-[#2563eb]/20 active:scale-95 premium-btn-transition border-none"
                  >
                    {t('testEngine.exitModal.confirmBtn', 'Save & Exit Exam')}
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors rounded-xl cursor-pointer"
                  >
                    {t('testEngine.exitModal.cancelBtn', 'Keep Solving')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MockTestSystem;
