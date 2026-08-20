import React, { useState, useRef, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Flag, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, BarChart, Award } from 'lucide-react';
import { cn } from './lib/utils';
import { Button } from './components/Button';
import { fadeSlideUpSm } from './lib/animations';
import { MathTextRenderer, DiagramRenderer } from './components/MathTextRenderer';
import { DynamicVectorCard } from './components/DynamicVectorCard';

import { evaluatePersonalBestImprovements, PersonalBestImprovement } from './lib/personalBestManager';
import { getUserXpState } from './lib/xpManager';
import { destroyLenis, initLenis } from './lib/lenisScroll';
import { useLanguage } from './lib/LanguageContext';

export default function TestResultsView({ results, onClose }: { results: any, onClose: () => void }) {
  const { t, isOdia } = useLanguage();
  const resultsTestId = results?.test?.id || '';
  const savedTestId = sessionStorage.getItem('oep_reviewTestId');
  const isSameTest = savedTestId === resultsTestId;

  React.useEffect(() => {
    destroyLenis();
    return () => {
      initLenis();
    };
  }, []);

  // Evaluate Personal Best improvements
  const pbImprovements: PersonalBestImprovement[] = React.useMemo(() => {
    try {
      const correctCountVal = (results?.test?.questions || []).reduce((acc: number, q: any, i: number) => {
        return acc + ((results?.answers && results.answers[i]) === q.correctAnswerIndex ? 1 : 0);
      }, 0);
      const totalQs = (results?.test?.questions || []).length || 1;
      const scorePctVal = Math.round((correctCountVal / totalQs) * 100);
      const accuracyPctVal = results?.accuracy || Math.round((correctCountVal / Math.max(1, results?.answers ? Object.keys(results.answers).length : totalQs)) * 100);

      return evaluatePersonalBestImprovements(undefined, {
        scorePct: scorePctVal,
        accuracyPct: accuracyPctVal,
        timeSpentSecs: results?.timeTaken || 300,
        questionsSolved: totalQs,
        testTitle: results?.test?.title || 'Practice Test'
      });
    } catch (e) {
      return [];
    }
  }, [results]);

  const [currentIdx, setCurrentIdx] = useState(() => {
    if (isSameTest) {
      const saved = sessionStorage.getItem('oep_reviewQuestionIdx');
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  React.useEffect(() => {
    if (isSameTest) {
      sessionStorage.setItem('oep_reviewQuestionIdx', currentIdx.toString());
    }
  }, [currentIdx, isSameTest]);

  const questionCardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const initialIdxRef = useRef<number | null>(null);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [questionExpanded, setQuestionExpanded] = useState(false);
  const [questionOverflows, setQuestionOverflows] = useState(false);
  const questionTextRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  React.useEffect(() => {
    document.body.setAttribute('data-review-mode', 'true');
    return () => {
      document.body.removeAttribute('data-review-mode');
    };
  }, []);

  // Sync testId changes and reset state if loading a different results object
  useLayoutEffect(() => {
    if (!isSameTest) {
      setCurrentIdx(0);
      initialIdxRef.current = null;
      sessionStorage.setItem('oep_reviewTestId', resultsTestId);
      sessionStorage.removeItem('oep_reviewQuestionIdx');
      sessionStorage.removeItem('oep_reviewScrollTop');
    }
  }, [resultsTestId, isSameTest]);
  
  const { test, answers, score: rawScore, total, timeTaken, timeSpent = {}, markedForReview = [] } = results;
  const questions = test?.questions || [];
  const currentQ = questions[currentIdx];

  // useLayoutEffect fires synchronously BEFORE the browser paints, ensuring
  // the page is at position 0 (or restored position) before the user ever sees it.
  useLayoutEffect(() => {
    setShowQuestionNav(false);
    const stId = sessionStorage.getItem('oep_reviewTestId');
    const isSame = stId === resultsTestId;
    const savedScroll = isSame ? sessionStorage.getItem('oep_reviewScrollTop') : null;
    if (savedScroll && containerRef.current) {
      containerRef.current.scrollTop = parseInt(savedScroll, 10);
    } else {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  }, [results, resultsTestId]);

  React.useEffect(() => {
    const handleScrollToTopOrSaved = () => {
      const stId = sessionStorage.getItem('oep_reviewTestId');
      const isSame = stId === resultsTestId;
      const savedScroll = isSame ? sessionStorage.getItem('oep_reviewScrollTop') : null;
      if (savedScroll && containerRef.current) {
        containerRef.current.scrollTop = parseInt(savedScroll, 10);
      } else {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (containerRef.current) {
          containerRef.current.scrollTop = 0;
        }
      }
    };
    handleScrollToTopOrSaved();
    const frameId = requestAnimationFrame(handleScrollToTopOrSaved);
    const timeoutId = setTimeout(handleScrollToTopOrSaved, 50);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeoutId);
    };
  }, [results, resultsTestId]);

  React.useEffect(() => {
    const checkAndSetAttribute = () => {
      if (showQuestionNav && window.innerWidth < 1024) {
        document.body.setAttribute('data-review-bottom-nav', 'true');
      } else {
        document.body.removeAttribute('data-review-bottom-nav');
      }
    };
    checkAndSetAttribute();
    window.addEventListener('resize', checkAndSetAttribute);
    return () => {
      document.body.removeAttribute('data-review-bottom-nav');
      window.removeEventListener('resize', checkAndSetAttribute);
    };
  }, [showQuestionNav]);

  React.useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: show nav only after a delay so the scroll-to-top can settle first
      const t = setTimeout(() => setShowQuestionNav(true), 600);
      return () => clearTimeout(t);
    }

    // Delay observer setup so the scroll-to-top (instant) has fully committed
    // before the observer fires its first callback.
    const setupTimer = setTimeout(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setShowQuestionNav(entry.isIntersecting);
        },
        {
          rootMargin: '0px 0px -10% 0px',
          threshold: 0.05
        }
      );

      const currentCard = questionCardRef.current;
      if (currentCard) {
        observer.observe(currentCard);
      }

      // Store observer on a ref so the cleanup can disconnect it
      (questionCardRef as any)._observer = observer;
    }, 250);

    return () => {
      clearTimeout(setupTimer);
      if ((questionCardRef as any)._observer) {
        (questionCardRef as any)._observer.disconnect();
        (questionCardRef as any)._observer = null;
      }
    };
  }, [results]);

  React.useEffect(() => {
    if (initialIdxRef.current === null) {
      initialIdxRef.current = currentIdx;
      return;
    }
    if (initialIdxRef.current === currentIdx) {
      return;
    }
    initialIdxRef.current = -1; // disable the initial index block for all subsequent changes

    if (questionCardRef.current && containerRef.current) {
      const cardRect = questionCardRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const offset = window.innerWidth < 1024 ? 80 : 100;
      const targetY = containerRef.current.scrollTop + cardRect.top - containerRect.top - offset;
      containerRef.current.scrollTo({ 
        top: targetY, 
        behavior: window.innerWidth < 1024 ? 'auto' : 'smooth' 
      });
    }
  }, [currentIdx]);

  // Detect if current question text overflows its container
  React.useEffect(() => {
    setQuestionExpanded(!!currentQ?.diagram);
    const el = questionTextRef.current;
    if (el) {
      setQuestionOverflows(currentQ?.diagram ? false : el.scrollHeight > 280);
    }
  }, [currentIdx, currentQ]);

  // Calculate question metrics
  const correctCount = questions.reduce((acc, q, i) => {
    return acc + ((answers && answers[i]) === q.correctAnswerIndex ? 1 : 0);
  }, 0);

  const incorrectCount = questions.reduce((acc, q, i) => {
    const uAns = answers ? answers[i] : undefined;
    const isCorrect = uAns === q.correctAnswerIndex;
    return acc + (uAns !== undefined && uAns !== null && !isCorrect ? 1 : 0);
  }, 0);

  const unansweredCount = questions.length - (correctCount + incorrectCount);

  // Calculate marks metrics
  const totalMarks = test?.totalMarks || questions.length || 100;
  const marksPerQuestion = questions.length > 0 ? (totalMarks / questions.length) : 1;
  const negativeMarkingValue = test?.negativeMarking || 0;

  const obtainedMarks = correctCount * marksPerQuestion;
  const penaltyDeduction = incorrectCount * negativeMarkingValue;
  const finalScore = obtainedMarks - penaltyDeduction;

  const totalAttempted = correctCount + incorrectCount;
  const accuracy = totalAttempted > 0 ? Math.round((correctCount / totalAttempted) * 100) : 0;
  const avgSpeed = questions.length > 0 ? (timeTaken / questions.length).toFixed(1) : "0";
  
  const userAnswer = answers ? answers[currentIdx] : undefined;
  const correctAnswerIdxRaw = currentQ?.correctAnswerIndex;
  const correctAnswerIdx = correctAnswerIdxRaw != null ? Number(correctAnswerIdxRaw) : -1;
  const isCorrect = !isNaN(correctAnswerIdx) && correctAnswerIdx >= 0 && userAnswer === correctAnswerIdx;
  const isUnanswered = userAnswer === undefined;
  const isMarked = markedForReview.includes(currentIdx);
  
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === undefined || secs === null || !secs) return '0s';
    if (secs < 60) return `${Math.floor(secs)}s`;
    return `${Math.floor(secs/60)}m ${Math.floor(secs%60)}s`;
  };

  const questionTextContent = React.useMemo(() => (
    <div
      ref={questionTextRef}
      className="text-base sm:text-[22px] md:text-[24px] lg:text-[20px] xl:text-[22px] font-semibold sm:font-extrabold text-slate-900 leading-relaxed sm:leading-[1.3] tracking-tight break-words overflow-wrap-anywhere space-y-3"
    >
      {(currentQ?.questionText || '').split('\n\n').map((para, i) => (
        <p key={i}>
          <MathTextRenderer text={para} />
        </p>
      ))}
      {currentQ?.diagram ? (
        <div className="mt-5 sm:mt-6 w-full block">
          <DiagramRenderer diagram={currentQ.diagram} data={currentQ.diagram} />
        </div>
      ) : null}
    </div>
  ), [currentQ]);

  const cardContent = React.useMemo(() => (
    <>
      <div className="flex flex-row items-center justify-between mb-3 sm:mb-6 lg:mb-5 gap-2 flex-wrap">
         <div className="flex flex-wrap items-center gap-1.5 sm:gap-4">
           <span className="px-2.5 sm:px-5 py-1 sm:py-2 bg-slate-100 text-slate-600 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-extrabold tracking-widest uppercase border border-slate-200">
             Question {currentIdx + 1}
           </span>
           <span className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-sm font-bold text-slate-500 bg-slate-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-slate-100">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4"/> {formatTime(timeSpent[currentIdx] || 0)}
           </span>
         </div>
         
         <div className="flex items-center gap-1.5 flex-wrap">
           {isMarked && (
             <span className="flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2 bg-amber-50 text-amber-600 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-extrabold border border-amber-200">
               <Flag className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-amber-500" /> Marked
             </span>
           )}
           {isUnanswered ? (
              <span className="flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2 bg-slate-100 text-slate-500 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-extrabold border border-slate-200"><div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0"/> Unanswered</span>
           ) : isCorrect ? (
              <span className="flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2 bg-emerald-50 text-emerald-600 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-extrabold border border-emerald-100"><CheckCircle2 className="w-3 h-3 sm:w-5 sm:h-5"/> Correct</span>
           ) : (
              <span className="flex items-center gap-1 sm:gap-2 px-2 sm:px-5 py-1 sm:py-2 bg-rose-50 text-rose-600 rounded-md sm:rounded-xl text-[10px] sm:text-sm font-extrabold border border-rose-100"><XCircle className="w-3 h-3 sm:w-5 sm:h-5"/> Incorrect</span>
           )}
         </div>
      </div>

       {/* Question text with expand/collapse */}
       <div className="bg-white rounded-xl sm:rounded-2xl px-3.5 py-3.5 sm:p-6 lg:p-5 border border-slate-200/50 shadow-[0_10px_30px_rgba(0,0,0,0.015)] mb-3 sm:mb-6 lg:mb-5 relative overflow-hidden">
         <div className="absolute top-0 right-0 w-40 h-40 bg-brand-500/[0.04] rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/[0.03] rounded-full blur-3xl -ml-10 -mb-10 pointer-events-none" />
         {isMobile ? (
           <div className="relative overflow-hidden" style={{ maxHeight: questionExpanded ? 'none' : 280 }}>
             {questionTextContent}
           </div>
         ) : (
           <motion.div
             animate={{ maxHeight: questionExpanded ? 9999 : 280 }}
             transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
             className="relative overflow-hidden"
           >
             {questionTextContent}
           </motion.div>
         )}

         {/* Gradient fade overlay when collapsed */}
         {!questionExpanded && questionOverflows && (
           <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
         )}

         {/* Expand/collapse button */}
         {questionOverflows && (
           <button
             onClick={() => setQuestionExpanded(prev => !prev)}
             className="mt-2 sm:mt-3 text-sm font-bold text-brand-600 hover:text-brand-700 transition-colors flex items-center gap-1.5 group cursor-pointer border-none bg-transparent"
           >
             <span>{questionExpanded ? 'Show less' : 'Show more'}</span>
             <ChevronDown className={cn("w-4 h-4 transition-transform duration-300", questionExpanded && "rotate-180")} />
           </button>
         )}
       </div>

      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-6 lg:mb-5">
         {(currentQ?.options || []).map((opt: string, i: number) => {
           const isThisSelected = userAnswer === i;
           // Use Number() coercion to handle string/number type mismatch from DB or JSON parsing
           const correctIdx = currentQ != null ? Number(currentQ.correctAnswerIndex) : -1;
           const isThisCorrect = !isNaN(correctIdx) && correctIdx === i;
           
           let ringClass = "border-slate-100 bg-slate-50 text-slate-700";
           let icon = null;
           
           if (isThisCorrect && isThisSelected) {
               // User selected the correct answer
               ringClass = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100";
               icon = <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 ml-auto shrink-0 mt-1 sm:mt-1.5" />;
           } else if (isThisCorrect) {
               // Correct answer the user did NOT select (always highlight it)
               ringClass = "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm shadow-emerald-100";
               icon = <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 ml-auto shrink-0 mt-1 sm:mt-1.5" />;
           } else if (isThisSelected && !isThisCorrect) {
               // Wrong answer the user selected
               ringClass = "border-rose-400 bg-rose-50 text-rose-900 shadow-sm shadow-rose-100";
               icon = <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 ml-auto shrink-0 mt-1 sm:mt-1.5" />;
           }

           return (
             <div key={i} className={cn("mcq-option px-2.5 py-2 sm:p-4 lg:p-3.5 rounded-xl sm:rounded-2xl border-2 flex items-start gap-2.5 sm:gap-4 lg:gap-3 transition-all text-left w-full", ringClass)}>
                <div className={cn(
                   "w-7 h-7 sm:w-9 sm:h-9 lg:w-8 lg:h-8 rounded-md sm:rounded-xl flex items-center justify-center font-extrabold text-xs sm:text-sm shrink-0 mt-0.5 sm:mt-1",
                  isThisCorrect ? "bg-emerald-500 text-white" :
                  isThisSelected ? "bg-rose-500 text-white" : "bg-slate-200 text-slate-600"
                )}>
                  {String.fromCharCode(65 + i)}
                </div>
                 <span className="text-sm sm:text-lg lg:text-base font-semibold sm:font-bold leading-tight min-w-0 flex-1">
                   <MathTextRenderer text={opt} isOption />
                 </span>
                {icon}
             </div>
           )
         })}
      </div>

      {currentQ?.explanation && (
          <div className="math-explanation bg-brand-50 px-3.5 py-3.5 sm:p-6 lg:p-5 rounded-xl sm:rounded-2xl border border-brand-100 mb-2 lg:mb-6">
           <h4 className="font-extrabold text-brand-900 flex items-center gap-2 sm:gap-2.5 mb-2 sm:mb-3 text-sm sm:text-base">
             <div className="bg-white p-1 sm:p-2 rounded-md sm:rounded-xl shadow-sm shrink-0"><AlertCircle className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-brand-600"/></div> 
             Explanation
           </h4>
           <p className="text-brand-800 font-medium leading-relaxed text-sm sm:text-base lg:text-[15px]">
             <MathTextRenderer text={currentQ.explanation} />
           </p>
         </div>
      )}
      
      {/* Desktop inline nav - hidden on mobile */}
       <div className="hidden lg:flex mt-6 justify-between gap-4">
         <Button variant="outline" disabled={currentIdx === 0} onClick={() => setCurrentIdx(p => p - 1)} className="flex-none justify-center gap-2 px-8 py-5 text-base rounded-2xl border-2 border-slate-200 cursor-pointer"><ChevronLeft className="w-5 h-5"/> Previous</Button>
         <Button disabled={currentIdx === questions.length - 1} onClick={() => setCurrentIdx(p => p + 1)} className="flex-none justify-center gap-2 px-10 py-5 text-base rounded-2xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer">Next <ChevronRight className="w-5 h-5"/></Button>
      </div>
    </>
  ), [
    currentIdx,
    isMobile,
    isMarked,
    isUnanswered,
    isCorrect,
    questionExpanded,
    questionOverflows,
    questionTextContent,
    currentQ,
    userAnswer,
    timeSpent,
    questions.length
  ]);

  return (
    <div 
      ref={containerRef}
      onScroll={(e) => {
        sessionStorage.setItem('oep_reviewScrollTop', e.currentTarget.scrollTop.toString());
      }}
      className={cn(
        "fixed inset-0 z-[200] overflow-y-auto overscroll-contain bg-[#F8FAFC] font-sans",
        showQuestionNav ? "pb-18 sm:pb-20" : "pb-12"
      )}
      data-lenis-prevent
      style={{ isolation: 'isolate' }}
    >
      {/* Full-Screen Edge-to-Edge Academic Vector Canvas Grid & HSL Glows */}
      <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] [background-size:20px_20px] opacity-40 pointer-events-none z-0" />
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-brand-300/20 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Floating Viewport Academic Study Vector Watermarks */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
        <Award className="absolute top-24 left-[5%] w-44 h-44 text-slate-800 opacity-[0.08] stroke-[1.2] rotate-12" />
        <BarChart className="absolute top-1/3 right-[5%] w-48 h-48 text-brand-600 opacity-[0.08] stroke-[1.2] -rotate-6" />
        <CheckCircle2 className="absolute bottom-1/3 left-[6%] w-44 h-44 text-amber-600 opacity-[0.08] stroke-[1.2] rotate-45" />
        <Clock className="absolute bottom-28 right-[6%] w-36 h-36 text-indigo-600 opacity-[0.08] stroke-[1.2] -rotate-12" />
      </div>

      <header className="h-16 sm:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between px-4 sm:px-10 sticky top-0 z-[100] w-full mb-4 sm:mb-8 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <Award className="w-5 h-5 stroke-[2.2]" />
          </div>
          <h1 className="font-black text-lg sm:text-2xl text-slate-900 dark:text-white tracking-tight line-clamp-1">Performance Report</h1>
        </div>
        <Button onClick={onClose} variant="outline" className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base border-2 border-slate-200 dark:border-slate-700 rounded-xl font-extrabold hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-white cursor-pointer">Back</Button>
      </header>

      {/* Personal Best Celebration Banner */}
      {pbImprovements && pbImprovements.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-xl shadow-amber-500/20 border border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 text-center sm:text-left">
              <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-950/15 shrink-0">🏆</span>
              <div>
                <h4 className="font-black text-sm sm:text-base tracking-tight text-slate-950 uppercase flex items-center gap-1.5 justify-center sm:justify-start">
                  <span>New Personal Best Record!</span>
                  <span className="text-[10px] bg-slate-950 text-amber-300 px-2 py-0.5 rounded-md font-mono">Record Broken</span>
                </h4>
                <p className="text-xs sm:text-sm font-bold text-slate-900/90 mt-0.5">
                  {pbImprovements.map(imp => `${imp.title}: ${imp.oldFormatted} ➔ ${imp.newFormatted} (${imp.improvementText})`).join(' • ')}
                </p>
              </div>
            </div>
            <span className="text-xs font-black bg-slate-950 text-amber-400 px-3 py-1.5 rounded-xl uppercase tracking-wider shrink-0 shadow-sm">
              Keep It Up! 🔥
            </span>
          </motion.div>
        </div>
      )}

      {/* TOP SECTION: Overall Performance & Results (Overview) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-5 sm:mb-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-6">
          
          {/* Overall Score Card */}
          <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.12)" className="lg:col-span-1">
            <div className="relative overflow-hidden bg-white/90 lg:bg-white/80 dark:bg-gradient-to-br dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 backdrop-blur-xl px-5 py-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border border-slate-200/80 dark:border-indigo-500/20 shadow-xl shadow-slate-200/50 dark:shadow-indigo-950/20 flex flex-col justify-between group transition-all duration-500 cursor-default min-h-full">
              {/* Radial Grid & Floating Background Watermark Icon */}
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-30 dark:opacity-[0.04] pointer-events-none" />
              <Award className="absolute -right-8 -bottom-8 w-52 h-52 opacity-10 stroke-[1.2] text-[#2563eb] pointer-events-none rotate-12 transition-transform duration-700 group-hover:scale-110" />

              <div className="relative z-10 text-center">
                <h3 className="text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-4">Total Score</h3>
                <div className="text-5xl sm:text-6xl font-serif font-black text-[#2563eb] tracking-tight mb-1 sm:mb-2 drop-shadow-sm">
                  {Number.isInteger(finalScore) ? finalScore : finalScore.toFixed(2)}
                  <span className="text-xl sm:text-2xl font-sans font-extrabold text-slate-400"> / {totalMarks}</span>
                </div>
                
                <div className="flex flex-wrap items-center justify-center gap-2 mt-3 sm:mt-4">
                  <div className="flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50/90 border border-emerald-200 px-3.5 py-1.5 rounded-2xl shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> {accuracy}% Accuracy
                  </div>
                  {(() => {
                    const xpState = getUserXpState();
                    return (
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-100/90 border border-amber-300 px-3.5 py-1.5 rounded-2xl shadow-2xs font-mono">
                        <span>🏆 Rank #{xpState.userRank.toLocaleString()} in Odisha</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Performance Calculation Breakdown */}
              <div className="relative z-10 bg-slate-50/80 border border-slate-200/80 rounded-xl sm:rounded-2xl p-3.5 sm:p-4 text-left space-y-2 mt-4 sm:mt-8">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Total Marks</span>
                  <span className="text-slate-800 font-extrabold">{totalMarks} Marks</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Obtained Marks</span>
                  <span className="text-emerald-600 font-extrabold">+{Number.isInteger(obtainedMarks) ? obtainedMarks : obtainedMarks.toFixed(2)}</span>
                </div>
                {negativeMarkingValue > 0 && (
                  <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>Negative Penalty (-{negativeMarkingValue}/wrong)</span>
                    <span className="text-rose-600 font-extrabold">-{Number.isInteger(penaltyDeduction) ? penaltyDeduction : penaltyDeduction.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200/80 pt-2 flex justify-between items-center text-xs sm:text-sm font-black text-slate-700">
                  <span>Final Score</span>
                  <span className="text-[#2563eb] font-black">{Number.isInteger(finalScore) ? finalScore : finalScore.toFixed(2)} / {totalMarks}</span>
                </div>
              </div>
            </div>
          </DynamicVectorCard>

          {/* Performance Summary Cards Grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-6">
            
            {/* Time Taken */}
            <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.08)">
              <div className="relative overflow-hidden bg-white/90 lg:bg-white/80 backdrop-blur-xl px-4 py-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200/80 shadow-md hover:shadow-lg flex flex-col justify-between group transition-all duration-300 cursor-default h-full">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                <Clock className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 stroke-[1.2] text-[#2563eb] pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">Time Taken</span>
                  <div className="p-1.5 sm:p-2 bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-lg sm:rounded-xl text-[#2563eb]">
                    <Clock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0"/>
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-sans font-black text-slate-900 leading-none tracking-tight relative z-10 truncate">
                  {formatTime(timeTaken)}
                </div>
              </div>
            </DynamicVectorCard>

            {/* Average Speed */}
            <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.08)">
              <div className="relative overflow-hidden bg-white/90 lg:bg-white/80 backdrop-blur-xl px-4 py-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200/80 shadow-md hover:shadow-lg flex flex-col justify-between group transition-all duration-300 cursor-default h-full">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                <BarChart className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 stroke-[1.2] text-[#2563eb] pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">Avg Speed</span>
                  <div className="p-1.5 sm:p-2 bg-[#2563eb]/10 border border-[#2563eb]/20 rounded-lg sm:rounded-xl text-[#2563eb]">
                    <BarChart className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0"/>
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-sans font-black text-slate-900 leading-none tracking-tight relative z-10">
                  {avgSpeed}<span className="text-[10px] sm:text-xs font-bold text-slate-400 ml-1">s/Q</span>
                </div>
              </div>
            </DynamicVectorCard>

            {/* Marked Review */}
            <DynamicVectorCard glowColor="rgba(245, 158, 11, 0.08)">
              <div className="relative overflow-hidden bg-white/90 lg:bg-white/80 backdrop-blur-xl px-4 py-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200/80 shadow-md hover:shadow-lg flex flex-col justify-between group transition-all duration-300 cursor-default h-full">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                <Flag className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 stroke-[1.2] text-amber-500 pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">Marked</span>
                  <div className="p-1.5 sm:p-2 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl text-amber-600">
                    <Flag className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0"/>
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-sans font-black text-slate-900 leading-none tracking-tight relative z-10">
                  {markedForReview.length}
                </div>
              </div>
            </DynamicVectorCard>

            {/* Correct Answers */}
            <DynamicVectorCard glowColor="rgba(16, 185, 129, 0.08)">
              <div className="relative overflow-hidden bg-white/90 lg:bg-white/80 backdrop-blur-xl px-4 py-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200/80 shadow-md hover:shadow-lg flex flex-col justify-between group transition-all duration-300 cursor-default h-full">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                <CheckCircle2 className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 stroke-[1.2] text-emerald-500 pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">Correct</span>
                  <div className="p-1.5 sm:p-2 bg-emerald-50 border border-emerald-200 rounded-lg sm:rounded-xl text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0"/>
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-sans font-black text-emerald-600 leading-none tracking-tight relative z-10">
                  {correctCount}
                </div>
              </div>
            </DynamicVectorCard>

            {/* Incorrect Answers */}
            <DynamicVectorCard glowColor="rgba(244, 63, 94, 0.08)">
              <div className="relative overflow-hidden bg-white/90 lg:bg-white/80 backdrop-blur-xl px-4 py-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200/80 shadow-md hover:shadow-lg flex flex-col justify-between group transition-all duration-300 cursor-default h-full">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                <XCircle className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 stroke-[1.2] text-rose-500 pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">Incorrect</span>
                  <div className="p-1.5 sm:p-2 bg-rose-50 border border-rose-200 rounded-lg sm:rounded-xl text-rose-600">
                    <XCircle className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0"/>
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-sans font-black text-rose-600 leading-none tracking-tight relative z-10">
                  {incorrectCount}
                </div>
              </div>
            </DynamicVectorCard>

            {/* Unanswered */}
            <DynamicVectorCard glowColor="rgba(100, 116, 139, 0.08)">
              <div className="relative overflow-hidden bg-white/90 lg:bg-white/80 backdrop-blur-xl px-4 py-4 sm:p-6 rounded-xl sm:rounded-[2rem] border border-slate-200/80 shadow-md hover:shadow-lg flex flex-col justify-between group transition-all duration-300 cursor-default h-full">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                <AlertCircle className="absolute -right-4 -bottom-4 w-28 h-28 opacity-10 stroke-[1.2] text-slate-500 pointer-events-none transition-transform duration-500 group-hover:scale-110" />
                <div className="flex items-center justify-between gap-2 mb-2.5 sm:mb-4 relative z-10">
                  <span className="text-[9px] sm:text-[10px] font-sans font-black text-slate-400 uppercase tracking-widest leading-none">Unanswered</span>
                  <div className="p-1.5 sm:p-2 bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl text-slate-500">
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 shrink-0"/>
                  </div>
                </div>
                <div className="text-xl sm:text-3xl font-sans font-black text-slate-700 leading-none tracking-tight relative z-10">
                  {unansweredCount}
                </div>
              </div>
            </DynamicVectorCard>

          </div>

        </div>
      </div>

      {/* SECTION DIVIDER & HEADING */}
      {questions.length > 0 ? (
        <>
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-3 sm:mb-8 mt-3 sm:mt-12 relative z-10">
            <div className="border-t border-slate-200/80 my-3 sm:my-8"></div>
            <div>
              <h2 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight">Detailed Question Analysis</h2>
              <p className="text-slate-500 text-[11px] sm:text-sm font-semibold mt-0.5 sm:mt-1">Review each question, your answer, and explanations below.</p>
            </div>
          </div>

          {/* BOTTOM SECTION: Detailed Question-by-Question Review */}
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8 lg:gap-6 relative z-10 mb-12">
            
            {/* Left Col: Quick Navigation (Question Navigator) */}
            <div className="lg:col-span-1">
              <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.08)">
                <div className="px-3.5 py-4 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-lg lg:sticky lg:top-24 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
                  <h3 className="font-extrabold text-slate-900 mb-3 sm:mb-6 text-sm sm:text-xl tracking-tight px-1 relative z-10">Question Navigator</h3>
                    <div className="max-h-[220px] sm:max-h-[300px] lg:max-h-[450px] overflow-y-auto p-1 no-scrollbar relative z-10">
                     <div className="grid grid-cols-6 sm:grid-cols-6 lg:grid-cols-7 gap-1.5 sm:gap-3 py-1">
                        {questions.map((q: any, i: number) => {
                          const uAns = answers ? answers[i] : undefined;
                          const isCorr = uAns === q.correctAnswerIndex;
                          const isUnans = uAns === undefined;
                          const isMarked = markedForReview.includes(i);
                          return (
                            <button 
                              key={i}
                              onClick={() => setCurrentIdx(i)}
                              className={cn(
                                "aspect-square rounded-lg sm:rounded-xl font-bold flex items-center justify-center text-[11px] sm:text-sm transition-all relative overflow-hidden cursor-pointer border-none",
                                currentIdx === i ? "ring-2 ring-brand-500 scale-105 z-10 shadow-md" : "hover:scale-105 shadow-2xs",
                                isUnans ? "bg-slate-100 text-slate-400 border border-slate-200" :
                                isCorr ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : 
                                "bg-rose-100 text-rose-700 border border-rose-200"
                              )}
                            >
                              {isMarked && <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-amber-400 rotate-45 transform translate-x-2 -translate-y-2"></div>}
                              {i + 1}
                            </button>
                          )
                        })}
                     </div>
                   </div>
                   {/* Legend */}
                   <div className="mt-3 sm:mt-6 p-3 sm:p-4 bg-slate-50/90 rounded-xl sm:rounded-2xl border border-slate-200/80 relative z-10">
                     <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-3 gap-y-1.5 sm:gap-y-3 sm:space-y-0">
                       <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-bold text-slate-600">
                         <div className="w-2.5 h-2.5 bg-emerald-100 border border-emerald-200 rounded shrink-0"></div> Correct
                       </div>
                       <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-bold text-slate-600">
                         <div className="w-2.5 h-2.5 bg-rose-100 border border-rose-200 rounded shrink-0"></div> Incorrect
                       </div>
                       <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-bold text-slate-600">
                         <div className="w-2.5 h-2.5 bg-slate-100 border border-slate-200 rounded shrink-0"></div> Unanswered
                       </div>
                       <div className="flex items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs font-bold text-slate-600">
                         <div className="w-2.5 h-2.5 overflow-hidden rounded border border-slate-200 relative shrink-0"><div className="absolute top-0 right-0 w-3 h-3 bg-amber-400 rotate-45 transform translate-x-1.5 -translate-y-1.5"></div></div> Marked
                       </div>
                     </div>
                   </div>
                </div>
              </DynamicVectorCard>
            </div>

            {/* Right Col: Detailed Question Card */}
            <div className="lg:col-span-2 space-y-6">
              <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.08)">
                <div ref={questionCardRef} className="px-4 py-5 sm:p-8 lg:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                  <div className="relative z-10">
                    {isMobile ? (
                      <div key={currentIdx}>
                        {cardContent}
                      </div>
                    ) : (
                      <motion.div 
                         key={currentIdx}
                         {...fadeSlideUpSm}
                       >
                         {cardContent}
                      </motion.div>
                    )}
                  </div>
                </div>
              </DynamicVectorCard>
            </div>

          </div>

          {/* Mobile Sticky Bottom Nav */}
          <div className={cn(
            "lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-3 flex gap-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] transition-all duration-300 transform",
            showQuestionNav ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
          )}>
            <Button
              variant="outline"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(p => p - 1)}
              className="flex-1 justify-center gap-2 py-4 text-sm font-black rounded-xl border-2 border-slate-200 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4"/> Previous
            </Button>
            <div className="flex items-center justify-center px-3 text-xs font-black text-slate-400 bg-slate-50 rounded-xl border border-slate-100 shrink-0 font-mono">
              {currentIdx + 1} / {questions.length}
            </div>
            <Button
              disabled={currentIdx === questions.length - 1}
              onClick={() => setCurrentIdx(p => p + 1)}
              className="flex-1 justify-center gap-2 py-4 text-sm font-black rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4"/>
            </Button>
          </div>
        </>
      ) : (
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-12 relative z-10">
          <DynamicVectorCard glowColor="rgba(37, 99, 235, 0.12)">
            <div className="p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] bg-white/90 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-slate-800 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto border border-brand-100 dark:border-slate-700 shadow-inner">
                <Award className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Score Performance Saved</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Your score of {Number.isInteger(finalScore) ? finalScore : finalScore.toFixed(2)} / {totalMarks} ({accuracy}% Accuracy) has been verified and permanently recorded to your student profile.</p>
              </div>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer border-none"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </DynamicVectorCard>
        </div>
      )}

    </div>
  );
}
