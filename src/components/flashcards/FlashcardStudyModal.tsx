import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Trophy,
  ArrowRight,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  List,
  ChevronDown,
  Check,
  BookOpen,
  Sparkles,
  HelpCircle,
  Smartphone,
  Keyboard,
  Shuffle,
} from 'lucide-react';
import { FlashcardFlipCard } from './FlashcardFlipCard';
import type { Flashcard, FlashcardDeck, UserCardProgress, SRSRating } from '../../lib/srsEngine';
import { calculateNextReview, computeDeckStats, getRatingPreviews } from '../../lib/srsEngine';
import { examService } from '../../lib/examService';
import { useAuth } from '../../lib/AuthContext';

interface FlashcardStudyModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: FlashcardDeck;
  cards: Flashcard[];
  initialProgressMap?: Record<string, UserCardProgress>;
  onProgressUpdated?: (deckId: string, updatedMap: Record<string, UserCardProgress>) => void;
}

interface HistoryItem {
  card: Flashcard;
  rating: SRSRating;
  previousProgress: UserCardProgress | null;
  previousProgressMap: Record<string, UserCardProgress>;
  previousIndex: number;
  wasAgain: boolean;
  wasCorrect: boolean;
}

export const FlashcardStudyModal: React.FC<FlashcardStudyModalProps> = ({
  isOpen,
  onClose,
  deck,
  cards,
  initialProgressMap = {},
  onProgressUpdated,
}) => {
  const { user } = useAuth();
  const [progressMap, setProgressMap] = useState<Record<string, UserCardProgress>>(initialProgressMap);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const originalOrderRef = useRef<Flashcard[]>([]);

  // Gemini Learning Mode & Scores
  const [trackLearning, setTrackLearning] = useState(true);
  const [wrongCount, setWrongCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [missedCards, setMissedCards] = useState<Flashcard[]>([]);
  const [historyStack, setHistoryStack] = useState<HistoryItem[]>([]);

  // Detailed statistics
  const [reviewedCount, setReviewedCount] = useState(0);
  const [againCount, setAgainCount] = useState(0);
  const [goodOrEasyCount, setGoodOrEasyCount] = useState(0);

  // Jump to card drawer
  const [isCardListOpen, setIsCardListOpen] = useState(false);

  // Onboarding Shortcuts Guide Modal & Permanent Dismissal Checkbox
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleCloseGuideModal = useCallback(() => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('odisha_fc_guide_permanently_dismissed', 'true');
      } catch {
        // ignore
      }
    }
    setShowGuideModal(false);
  }, [dontShowAgain]);

  // Initialize study queue on open
  useEffect(() => {
    if (isOpen && cards.length > 0) {
      // Prioritize due cards first, then learning, then new cards
      const now = new Date();
      const sorted = [...cards].sort((a, b) => {
        const progA = progressMap[a.id];
        const progB = progressMap[b.id];

        const isDueA = progA?.due_date ? new Date(progA.due_date) <= now : true;
        const isDueB = progB?.due_date ? new Date(progB.due_date) <= now : true;

        if (isDueA && !isDueB) return -1;
        if (!isDueA && isDueB) return 1;
        return (a.sort_order || 0) - (b.sort_order || 0);
      });

      originalOrderRef.current = sorted;
      setQueue(sorted);
      setIsShuffled(false);
      setCurrentIndex(0);
      setIsFlipped(false);
      setSessionCompleted(false);
      setReviewedCount(0);
      setAgainCount(0);
      setGoodOrEasyCount(0);
      setWrongCount(0);
      setCorrectCount(0);
      setMissedCards([]);
      setHistoryStack([]);
      setIsCardListOpen(false);

      // Auto-display guide modal if not permanently dismissed
      try {
        const isPermanentlyDismissed = Boolean(localStorage.getItem('odisha_fc_guide_permanently_dismissed'));
        if (!isPermanentlyDismissed) {
          setShowGuideModal(true);
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen, cards]);

  const currentCard = queue[currentIndex];
  const currentProgress = currentCard ? progressMap[currentCard.id] || null : null;

  // Compute spaced repetition interval previews for current card
  const ratingPreviews = useMemo(() => {
    return getRatingPreviews(currentProgress);
  }, [currentProgress]);

  // Compute SRS deck counters (Blue: New, Orange: Learn, Green: Due)
  const stats = useMemo(() => {
    return computeDeckStats(cards, progressMap);
  }, [cards, progressMap]);

  // Navigate to previous card in browse mode
  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Advance to next card in browse mode
  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    setIsFlipped(false);
    if (currentIndex + 1 < queue.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  }, [queue.length, currentIndex]);

  // Jump to specific card from drawer
  const handleJumpToCard = (index: number) => {
    if (index >= 0 && index < queue.length) {
      setIsFlipped(false);
      setCurrentIndex(index);
      setIsCardListOpen(false);
    }
  };

  // Toggle Shuffle (Randomized vs Sequential order)
  const handleToggleShuffle = useCallback(() => {
    setIsShuffled((prevIsShuffled) => {
      const willShuffle = !prevIsShuffled;

      if (willShuffle) {
        // Shuffle remaining unreviewed cards ahead of current index using Fisher-Yates
        setQueue((currentQ) => {
          if (currentQ.length <= 1) return currentQ;

          // If at start with no grading yet, shuffle the whole queue
          if (currentIndex === 0 && reviewedCount === 0) {
            const copy = [...currentQ];
            for (let i = copy.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
          }

          // Otherwise preserve past and current cards, shuffle only upcoming
          const pastAndCurrent = currentQ.slice(0, currentIndex + 1);
          const upcoming = currentQ.slice(currentIndex + 1);
          for (let i = upcoming.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
          }
          return [...pastAndCurrent, ...upcoming];
        });
      } else {
        // Revert to original natural sequence order
        setQueue((currentQ) => {
          if (originalOrderRef.current.length === 0) return currentQ;
          const orig = originalOrderRef.current;

          // If at start, revert full queue
          if (currentIndex === 0 && reviewedCount === 0) {
            return [...orig];
          }

          // Keep reviewed cards, restore upcoming to natural order
          const pastAndCurrent = currentQ.slice(0, currentIndex + 1);
          const reviewedIds = new Set(pastAndCurrent.map((c) => c.id));
          const upcomingRestored = orig.filter((c) => !reviewedIds.has(c.id));
          return [...pastAndCurrent, ...upcomingRestored];
        });
      }

      return willShuffle;
    });
  }, [currentIndex, reviewedCount]);

  // Grade card recall & update SRS schedule
  const handleRate = useCallback(
    async (rating: SRSRating) => {
      if (!currentCard) return;

      const nextCalc = calculateNextReview(currentProgress, rating);
      const userId = user?.id || 'guest';

      const updatedProgress: UserCardProgress = {
        user_id: userId,
        card_id: currentCard.id,
        deck_id: deck.id,
        state: nextCalc.state,
        ease_factor: nextCalc.ease_factor,
        interval_days: nextCalc.interval_days,
        repetitions: nextCalc.repetitions,
        lapses: nextCalc.lapses,
        due_date: nextCalc.due_date,
        last_reviewed_at: new Date().toISOString(),
      };

      const prevMap = { ...progressMap };
      const nextMap = {
        ...progressMap,
        [currentCard.id]: updatedProgress,
      };
      setProgressMap(nextMap);

      const wasAgain = rating === 1;
      const wasCorrect = rating >= 3;

      // Update undo history stack
      setHistoryStack((prev) => [
        ...prev,
        {
          card: currentCard,
          rating,
          previousProgress: currentProgress,
          previousProgressMap: prevMap,
          previousIndex: currentIndex,
          wasAgain,
          wasCorrect,
        },
      ]);

      // Gemini Score counters
      setReviewedCount((prev) => prev + 1);
      if (wasAgain) {
        setAgainCount((prev) => prev + 1);
        setWrongCount((prev) => prev + 1);
        setMissedCards((prev) => (prev.some((c) => c.id === currentCard.id) ? prev : [...prev, currentCard]));
        // Re-queue card to end of review queue
        setQueue((prev) => [...prev, currentCard]);
      } else {
        setGoodOrEasyCount((prev) => prev + 1);
        setCorrectCount((prev) => prev + 1);
      }

      // Persist to Supabase if logged in
      if (user?.id) {
        examService.saveUserCardProgress(updatedProgress).catch((err) => {
          console.warn('Failed to save flashcard progress:', err);
        });
      }

      if (onProgressUpdated) {
        onProgressUpdated(deck.id, nextMap);
      }

      // Advance or complete
      if (currentIndex + 1 < queue.length) {
        setIsFlipped(false);
        setCurrentIndex((prev) => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    },
    [currentCard, currentProgress, user, deck.id, progressMap, currentIndex, queue.length, onProgressUpdated]
  );

  // Undo last rating action
  const handleUndo = useCallback(() => {
    if (historyStack.length === 0) return;

    const lastEntry = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, -1));

    // Restore previous progress map
    setProgressMap(lastEntry.previousProgressMap);
    if (onProgressUpdated) {
      onProgressUpdated(deck.id, lastEntry.previousProgressMap);
    }

    // Revert counters
    setReviewedCount((prev) => Math.max(0, prev - 1));
    if (lastEntry.wasAgain) {
      setAgainCount((prev) => Math.max(0, prev - 1));
      setWrongCount((prev) => Math.max(0, prev - 1));
      // Remove re-queued card from tail of queue
      setQueue((prev) => {
        const lastIdx = prev.map((c) => c.id).lastIndexOf(lastEntry.card.id);
        if (lastIdx > lastEntry.previousIndex) {
          const nextQ = [...prev];
          nextQ.splice(lastIdx, 1);
          return nextQ;
        }
        return prev;
      });
      setMissedCards((prev) => prev.filter((c) => c.id !== lastEntry.card.id));
    } else {
      setGoodOrEasyCount((prev) => Math.max(0, prev - 1));
      setCorrectCount((prev) => Math.max(0, prev - 1));
    }

    // Restore card view
    setCurrentIndex(lastEntry.previousIndex);
    setIsFlipped(false);
    setSessionCompleted(false);
  }, [historyStack, deck.id, onProgressUpdated]);

  // Drill missed cards action
  const handleReviseMissedCards = useCallback(() => {
    if (missedCards.length === 0) return;
    setQueue([...missedCards]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setWrongCount(0);
    setCorrectCount(0);
    setMissedCards([]);
    setHistoryStack([]);
  }, [missedCards]);

  // Restart all cards in deck
  const handleRestartAll = useCallback(() => {
    setQueue([...cards].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionCompleted(false);
    setReviewedCount(0);
    setAgainCount(0);
    setGoodOrEasyCount(0);
    setWrongCount(0);
    setCorrectCount(0);
    setMissedCards([]);
    setHistoryStack([]);
  }, [cards]);

  // Keyboard shortcut listener
  useEffect(() => {
    if (!isOpen || sessionCompleted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped) {
          setIsFlipped(true);
        } else {
          // Space on revealed answer records "Good" (3)
          handleRate(3);
        }
      } else if (e.key === '1') {
        e.preventDefault();
        handleRate(1);
      } else if (e.key === '2') {
        e.preventDefault();
        handleRate(2);
      } else if (e.key === '3') {
        e.preventDefault();
        handleRate(3);
      } else if (e.key === '4') {
        e.preventDefault();
        handleRate(4);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (trackLearning) {
          handleRate(1); // Swipe left = Try Again
        } else {
          handlePrev();
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (trackLearning) {
          handleRate(3); // Swipe right = Got it
        } else {
          handleNext();
        }
      } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === '?') {
        e.preventDefault();
        setShowGuideModal((prev) => !prev);
      }

      if (e.key === 'Escape') {
        if (showGuideModal) {
          setShowGuideModal(false);
        } else if (isCardListOpen) {
          setIsCardListOpen(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isOpen,
    sessionCompleted,
    isFlipped,
    isCardListOpen,
    showGuideModal,
    trackLearning,
    handleRate,
    handlePrev,
    handleNext,
    handleUndo,
    onClose,
  ]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-50 dark:bg-slate-950 flex flex-col justify-between overflow-hidden text-slate-900 dark:text-slate-100 select-none">
      {/* ================= STUDY MODE HEADERS (Only visible during active study) ================= */}
      {!sessionCompleted ? (
        <>
          {/* 1. DESKTOP SEGMENTED PROGRESS & HEADER (hidden sm:block / hidden sm:flex) */}
          <div className="hidden sm:block w-full max-w-2xl mx-auto px-6 pt-3 pb-1 shrink-0">
            <div className="flex items-center gap-1.5 w-full">
              {queue.slice(0, Math.min(queue.length, 35)).map((card, idx) => {
                const isPast = idx < currentIndex;
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={card.id || idx}
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      isCurrent
                        ? 'bg-brand-500 scale-y-125'
                        : isPast
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                );
              })}
              {queue.length > 35 && (
                <span className="text-[10px] text-slate-400 font-mono ml-1">+{queue.length - 35}</span>
              )}
            </div>
          </div>

          <header className="hidden sm:flex h-16 px-8 items-center justify-between shrink-0">
            {/* Left: Deck Subject & Title */}
            <div className="flex items-center gap-2.5 min-w-0 max-w-[50%]">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {deck.title}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {deck.subject}
                </p>
              </div>
            </div>

            {/* Center: Jump to Card Dropdown Trigger */}
            {queue.length > 0 && (
              <button
                type="button"
                onClick={() => setIsCardListOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                title="Browse all cards"
              >
                <List className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>
                  {currentIndex + 1} of {queue.length}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            )}

            {/* Right: Live Learning Badges & Close Button */}
            <div className="flex items-center gap-3">
              {trackLearning && (
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 font-semibold">
                    <X className="w-3 h-3 stroke-[3]" />
                    {wrongCount}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60 font-semibold">
                    <Check className="w-3 h-3 stroke-[3]" />
                    {correctCount}
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleShuffle}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  isShuffled
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title={isShuffled ? 'Shuffle is ON (Click to turn off)' : 'Shuffle cards'}
                aria-label="Toggle shuffle cards"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Gestures & Keyboard Guide (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 2. MOBILE DEDICATED 2-ROW HEADER (sm:hidden) */}
          <div className="sm:hidden px-4 pt-3 pb-2 shrink-0 space-y-2.5">
            {/* Row 1: Deck Title + Quick Help/Close Actions */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {deck.title}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {deck.subject}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleShuffle}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                    isShuffled
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title={isShuffled ? 'Shuffle is ON (Click to turn off)' : 'Shuffle cards'}
                  aria-label="Toggle shuffle cards"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowGuideModal(true)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                  title="Gestures Guide (?)"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
                  title="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Row 2: Fluid Segmented Progress Pips + Card Index Pill + Live Scores */}
            <div className="flex items-center gap-2.5">
              {/* Segmented Progress Pips */}
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {queue.slice(0, Math.min(queue.length, 25)).map((card, idx) => {
                  const isPast = idx < currentIndex;
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={card.id || idx}
                      className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                        isCurrent
                          ? 'bg-brand-500 scale-y-125'
                          : isPast
                          ? 'bg-emerald-500'
                          : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  );
                })}
                {queue.length > 25 && (
                  <span className="text-[9px] text-slate-400 font-mono">+{queue.length - 25}</span>
                )}
              </div>

              {/* Jump to Card Trigger & Live Counters */}
              <div className="flex items-center gap-1.5 shrink-0">
                {queue.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCardListOpen(true)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                    title="Browse all cards"
                  >
                    <span>{currentIndex + 1}/{queue.length}</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                )}

                {trackLearning && (
                  <div className="flex items-center gap-1 text-[11px] font-bold">
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60">
                      <X className="w-2.5 h-2.5 stroke-[3]" />
                      {wrongCount}
                    </span>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                      {correctCount}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* ================= RESULTS / COMPLETION SCREEN HEADER ================= */
        <header className="h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
              {deck.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>
      )}

      {/* 3. Main Center Card Canvas */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center p-2 xs:p-3 sm:p-6 w-full max-w-2xl mx-auto overflow-y-auto">
        {!sessionCompleted && currentCard ? (
          <div className="w-full flex flex-col items-center my-auto">
            <FlashcardFlipCard
              key={`${currentCard.id}-${currentIndex}`}
              card={currentCard}
              progress={currentProgress}
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped((prev) => !prev)}
              onRate={handleRate}
              onSwipeRight={() => handleRate(3)}
              onSwipeLeft={() => handleRate(1)}
              trackLearning={trackLearning}
              isShuffled={isShuffled}
              onToggleShuffle={handleToggleShuffle}
            />
          </div>
        ) : (
          /* Gemini Completion Screen ("Nice work! Let's see how you did") */
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md mx-auto my-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl text-center space-y-6"
          >
            {/* Header / Celebration */}
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 border border-amber-200 dark:border-amber-800 mb-2">
                <Trophy className="w-7 h-7" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                Nice work! Let’s see how you did
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                You've completed this session for <span className="font-semibold text-slate-700 dark:text-slate-200">"{deck.title}"</span>.
              </p>
            </div>

            {/* Gemini Dual Result Summary Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {/* Needs Practice Card */}
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
                  <X className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {wrongCount}
                </div>
                <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mt-0.5">
                  Let's try these again
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Cards needing practice
                </p>
              </div>

              {/* Great Progress Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 flex flex-col items-center text-center">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {correctCount}
                </div>
                <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Great progress
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Cards recalled well
                </p>
              </div>
            </div>

            {/* Gemini "Keep learning" Section */}
            <div className="space-y-3 pt-2 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Keep learning
              </div>

              {missedCards.length > 0 ? (
                <button
                  type="button"
                  onClick={handleReviseMissedCards}
                  className="w-full p-4 rounded-2xl bg-brand-50 hover:bg-brand-100/80 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 border border-brand-200 dark:border-brand-800 flex items-center justify-between text-left transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold text-brand-900 dark:text-brand-100">
                        Revise (Flashcards)
                      </div>
                      <div className="text-[11px] text-brand-700/80 dark:text-brand-300/80">
                        Practise the {missedCards.length} concept{missedCards.length > 1 ? 's' : ''} you missed
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Flawless session! All concepts were mastered on the first try.</span>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleRestartAll}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" /> Restart All
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-500/25 transition-all cursor-pointer"
              >
                Done <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* 4. Bottom Control Bar (Balanced 3-Column Layout) */}
      {!sessionCompleted && currentCard && (
        <footer className="h-16 sm:h-20 px-4 sm:px-8 pb-3 sm:pb-0 flex items-center justify-between shrink-0">
          {/* Left Action: Undo Button or Deck Index */}
          <div className="w-24 sm:w-36 flex items-center justify-start">
            {trackLearning ? (
              <button
                type="button"
                onClick={handleUndo}
                disabled={historyStack.length === 0}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  historyStack.length === 0
                    ? 'opacity-30 cursor-not-allowed text-slate-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95'
                }`}
                title="Undo last rating (Ctrl+Z)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo</span>
              </button>
            ) : (
              <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {currentIndex + 1} of {queue.length}
              </div>
            )}
          </div>

          {/* Center Actions: Symmetrical Circular Grading (Learning ON) or Navigation (Learning OFF) */}
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            {trackLearning ? (
              <>
                {/* ✕ Again / Try Again circular button */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleRate(1)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100/90 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
                    title="Needs Practice / Again (Press 1 or swipe left)"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>
                  <span className="text-[10px] font-bold text-rose-600/90 dark:text-rose-400/90 mt-1 font-mono">
                    {ratingPreviews[0]?.intervalText || '<10m'}
                  </span>
                </div>

                {/* Micro Spaced Repetition Interval Pills (Hard & Easy for precision revision) */}
                <div className="hidden sm:flex flex-col gap-1 items-center px-1">
                  <button
                    type="button"
                    onClick={() => handleRate(2)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-all cursor-pointer"
                    title="Hard (Press 2)"
                  >
                    Hard {ratingPreviews[1]?.intervalText}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRate(4)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-all cursor-pointer"
                    title="Easy (Press 4)"
                  >
                    Easy {ratingPreviews[3]?.intervalText}
                  </button>
                </div>

                {/* ✓ Good / Got it circular button */}
                <div className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => handleRate(3)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center bg-emerald-50 hover:bg-emerald-100/90 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
                    title="Got it / Good (Press 3, Space, or swipe right)"
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  </button>
                  <span className="text-[10px] font-bold text-emerald-600/90 dark:text-emerald-400/90 mt-1 font-mono">
                    {ratingPreviews[2]?.intervalText || '2d'}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
                    currentIndex === 0
                      ? 'opacity-30 cursor-not-allowed border-slate-200 dark:border-slate-800 text-slate-400'
                      : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95'
                  }`}
                  title="Previous card"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
                  title="Next card"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Action: Track Learning Switch with Mobile Label */}
          <div className="w-24 sm:w-36 flex items-center justify-end gap-1.5 sm:gap-2">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 select-none">
              <span className="sm:hidden">Track</span>
              <span className="hidden sm:inline">Track learning</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={trackLearning}
              onClick={() => setTrackLearning((prev) => !prev)}
              className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                trackLearning ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
              title="Toggle tracking learning progress"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                  trackLearning ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </footer>
      )}

      {/* 5. Jump to Card Modal Drawer */}
      <AnimatePresence>
        {isCardListOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsCardListOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-brand-600" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Jump to Card ({queue.length})
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCardListOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {queue.map((c, idx) => {
                  const prog = progressMap[c.id];
                  const isCurrent = idx === currentIndex;
                  const plainPrompt = c.front_text.replace(/\{\{c\d+::(.*?)\}\}/g, '[$1]');

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleJumpToCard(idx)}
                      className={`w-full text-left p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-brand-50 border-brand-300 text-brand-900 dark:bg-brand-950/60 dark:border-brand-700 dark:text-brand-200 font-bold'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 ${
                            isCurrent
                              ? 'bg-brand-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <p className="text-xs font-semibold leading-snug line-clamp-2 text-slate-800 dark:text-slate-200">
                          {plainPrompt}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border capitalize bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700">
                          {prog?.state || 'New'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Context-Adaptive Guide Modal with Permanent Dismissal Checkbox */}
      <AnimatePresence>
        {showGuideModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCloseGuideModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4 sm:space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      How Flashcards Work
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Quick guide for active recall study
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseGuideModal}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                  title="Close Guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* ================= MOBILE-OPTIMIZED TOUCH GESTURES (sm:hidden) ================= */}
              <div className="sm:hidden space-y-2.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5" /> Touch Gestures
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">Flip Card</span>
                    <span className="font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                      Tap anywhere
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-900/40">
                    <span className="text-emerald-800 dark:text-emerald-300 font-medium">Mark Correct (Got it!)</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/60 px-2.5 py-1 rounded-lg">
                      Swipe Right →
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-900/40">
                    <span className="text-rose-800 dark:text-rose-300 font-medium">Needs Practice (Try again)</span>
                    <span className="font-bold text-rose-700 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-900/60 px-2.5 py-1 rounded-lg">
                      ← Swipe Left
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">One-Tap Recall</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Use bottom ✕ & ✓ buttons
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= DESKTOP-OPTIMIZED MOUSE & KEYBOARD (hidden sm:block) ================= */}
              <div className="hidden sm:block space-y-4">
                {/* Mouse Controls */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5" /> Mouse Controls
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Flip card</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Click anywhere</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Drag to Grade</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">Swipe Left / Right</span>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div className="space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Keyboard className="w-3.5 h-3.5" /> Keyboard Shortcuts
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Flip / Good</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold">Space</kbd>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Again / Hard</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold">1 / 2</kbd>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Good / Easy</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold">3 / 4</kbd>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-400 font-medium">Undo Rating</span>
                      <kbd className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px] font-bold">Ctrl+Z</kbd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permanent Dismissal Checkbox */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={dontShowAgain}
                    onChange={(e) => setDontShowAgain(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    Don't show these instructions again
                  </span>
                </label>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                onClick={handleCloseGuideModal}
                className="w-full py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 transition-all cursor-pointer active:scale-98"
              >
                Got it, Let's Study!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};
