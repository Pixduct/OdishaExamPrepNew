/**
 * Spaced Repetition System (SRS) SM-2 Engine
 * Designed for Odisha competitive exams active recall
 */

export type SRSRating = 1 | 2 | 3 | 4; // 1: Again, 2: Hard, 3: Good, 4: Easy
export type CardState = 'new' | 'learning' | 'review' | 'mastered';

export interface Flashcard {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  key_points?: string[];
  diagram?: Record<string, any> | null;
  sort_order?: number;
  created_at?: string;
}

export interface FlashcardDeck {
  id: string;
  exam_id: string;
  subject: string;
  sub_subject?: string;
  chapter?: string;
  stage: string;
  title: string;
  description: string;
  icon: string;
  card_count: number;
  is_premium: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
  // Dynamic client stats
  stats?: DeckProgressStats;
}

export interface UserCardProgress {
  id?: string;
  user_id: string;
  card_id: string;
  deck_id: string;
  state: CardState;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_date: string; // ISO string
  last_reviewed_at?: string;
}

export interface DeckProgressStats {
  total: number;
  newCount: number;
  learningCount: number;
  dueCount: number;
  masteredCount: number;
  retentionRate: number; // 0 to 100%
}

export interface RatingPreview {
  rating: SRSRating;
  label: string;
  shortcut: string;
  intervalText: string;
  nextIntervalDays: number;
  colorClass: string;
}

const MIN_EASE = 1.30;
const MAX_EASE = 3.00;
const DEFAULT_EASE = 2.50;

/**
 * Calculates the next SRS review interval according to the SM-2 algorithm
 * strictly preserving the monotonic invariant:
 * Interval(Again) < Interval(Hard) < Interval(Good) < Interval(Easy)
 */
export function calculateNextReview(
  current: UserCardProgress | null,
  rating: SRSRating,
  now: Date = new Date()
): {
  state: CardState;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
  due_date: string;
} {
  const ease = current ? Number(current.ease_factor) || DEFAULT_EASE : DEFAULT_EASE;
  const reps = current ? Number(current.repetitions) || 0 : 0;
  const prevInterval = current ? Number(current.interval_days) || 0 : 0;
  const lapses = current ? Number(current.lapses) || 0 : 0;
  const isNewOrLearning = !current || current.state === 'new' || current.state === 'learning' || prevInterval <= 0;

  let nextState: CardState = 'review';
  let nextEase = ease;
  let nextInterval = 0;
  let nextReps = reps;
  let nextLapses = lapses;

  if (isNewOrLearning) {
    // -------------------------------------------------------------
    // PHASE 1: NEW / LEARNING QUEUE (Initial steps)
    // -------------------------------------------------------------
    switch (rating) {
      case 1: // Again: Failed recall (repeat step in session, < 10m)
        nextLapses += 1;
        nextReps = 0;
        nextInterval = 0;
        nextEase = Math.max(MIN_EASE, ease - 0.20);
        nextState = 'learning';
        break;

      case 2: // Hard: Struggled recall (repeat step with short 1d graduation)
        nextReps = Math.max(1, reps);
        nextInterval = 1;
        nextEase = Math.max(MIN_EASE, ease - 0.15);
        nextState = 'review';
        break;

      case 3: // Good: Normal recall (graduates to 2 days)
        nextReps = reps + 1;
        nextInterval = 2;
        nextState = 'review';
        break;

      case 4: // Easy: Effortless recall (graduates to 4 days, ease bonus)
        nextReps = reps + 1;
        nextInterval = 4;
        nextEase = Math.min(MAX_EASE, ease + 0.15);
        nextState = 'review';
        break;
    }
  } else {
    // -------------------------------------------------------------
    // PHASE 2: GRADUATED REVIEW CARDS (Exponential SM-2 with Monotonic Invariant)
    // -------------------------------------------------------------
    switch (rating) {
      case 1: // Again: Card lapsed! Return to learning queue
        nextLapses += 1;
        nextReps = 0;
        nextInterval = 0; // Due today / in 10 minutes
        nextEase = Math.max(MIN_EASE, ease - 0.20);
        nextState = 'learning';
        break;

      case 2: { // Hard: Struggled recall
        nextReps = reps + 1;
        // Hard interval: 1.2x previous interval (minimum 1 day)
        nextInterval = Math.max(1, Math.round(prevInterval * 1.2));
        nextEase = Math.max(MIN_EASE, ease - 0.15);
        nextState = 'review';
        break;
      }

      case 3: { // Good: Normal recall
        nextReps = reps + 1;
        const hardInterval = Math.max(1, Math.round(prevInterval * 1.2));
        // Good interval: prevInterval * ease_factor (guaranteed strictly > Hard)
        const calculatedGood = Math.round(prevInterval * ease);
        nextInterval = Math.max(hardInterval + 1, calculatedGood);
        nextState = nextReps >= 4 && nextInterval >= 21 ? 'mastered' : 'review';
        break;
      }

      case 4: { // Easy: Effortless recall
        nextReps = reps + 1;
        const hardInterval = Math.max(1, Math.round(prevInterval * 1.2));
        const minGood = Math.max(hardInterval + 1, Math.round(prevInterval * ease));
        // Easy interval: prevInterval * ease_factor * 1.3 bonus (guaranteed strictly > Good)
        const calculatedEasy = Math.round(prevInterval * ease * 1.3);
        nextInterval = Math.max(minGood + 1, calculatedEasy);
        nextEase = Math.min(MAX_EASE, ease + 0.15);
        nextState = nextReps >= 3 && nextInterval >= 14 ? 'mastered' : 'review';
        break;
      }
    }
  }

  // Calculate next due date
  const dueDateObj = new Date(now.getTime());
  if (nextInterval === 0) {
    // 10 minutes into future for learning cards
    dueDateObj.setMinutes(dueDateObj.getMinutes() + 10);
  } else {
    // Increment by days
    dueDateObj.setDate(dueDateObj.getDate() + nextInterval);
    // Set to 4:00 AM standard study reset
    dueDateObj.setHours(4, 0, 0, 0);
  }

  return {
    state: nextState,
    ease_factor: Number(nextEase.toFixed(2)),
    interval_days: nextInterval,
    repetitions: nextReps,
    lapses: nextLapses,
    due_date: dueDateObj.toISOString()
  };
}

/**
 * Previews interval labels for all 4 rating buttons on the card UI
 */
export function getRatingPreviews(current: UserCardProgress | null): RatingPreview[] {
  const p1 = calculateNextReview(current, 1);
  const p2 = calculateNextReview(current, 2);
  const p3 = calculateNextReview(current, 3);
  const p4 = calculateNextReview(current, 4);

  const formatInterval = (days: number): string => {
    if (days === 0) return '< 10m';
    if (days === 1) return '1d';
    if (days < 30) return `${days}d`;
    if (days < 365) return `${Math.round(days / 30)}mo`;
    return `${(days / 365).toFixed(1)}y`;
  };

  return [
    {
      rating: 1,
      label: 'Again',
      shortcut: '1',
      intervalText: formatInterval(p1.interval_days),
      nextIntervalDays: p1.interval_days,
      colorClass: 'text-rose-500 bg-rose-50 hover:bg-rose-100 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/50'
    },
    {
      rating: 2,
      label: 'Hard',
      shortcut: '2',
      intervalText: formatInterval(p2.interval_days),
      nextIntervalDays: p2.interval_days,
      colorClass: 'text-amber-500 bg-amber-50 hover:bg-amber-100 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/50'
    },
    {
      rating: 3,
      label: 'Good',
      shortcut: '3 / Space',
      intervalText: formatInterval(p3.interval_days),
      nextIntervalDays: p3.interval_days,
      colorClass: 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/50'
    },
    {
      rating: 4,
      label: 'Easy',
      shortcut: '4',
      intervalText: formatInterval(p4.interval_days),
      nextIntervalDays: p4.interval_days,
      colorClass: 'text-brand-600 bg-brand-50 hover:bg-brand-100 border-brand-200 dark:bg-brand-950/30 dark:border-brand-900/50'
    }
  ];
}

/**
 * Computes deck statistics given a list of cards and their progress records
 */
export function computeDeckStats(
  cards: Flashcard[],
  progressMap: Record<string, UserCardProgress>,
  now: Date = new Date()
): DeckProgressStats {
  const total = cards.length;
  let newCount = 0;
  let learningCount = 0;
  let dueCount = 0;
  let masteredCount = 0;
  let successfulReviews = 0;
  let totalReviews = 0;

  for (const card of cards) {
    const prog = progressMap[card.id];
    if (!prog || prog.state === 'new') {
      newCount++;
    } else {
      if (prog.state === 'learning') {
        learningCount++;
      } else if (prog.state === 'mastered') {
        masteredCount++;
      }

      // Check if due for review
      const dueDate = new Date(prog.due_date);
      if (dueDate <= now) {
        dueCount++;
      }

      totalReviews += (prog.repetitions + prog.lapses);
      successfulReviews += prog.repetitions;
    }
  }

  const retentionRate = totalReviews > 0
    ? Math.round((successfulReviews / totalReviews) * 100)
    : 0;

  return {
    total,
    newCount,
    learningCount,
    dueCount,
    masteredCount,
    retentionRate
  };
}

/**
 * Client Local Storage Cache Helpers
 */
const STORAGE_PREFIX = 'oep_flashcards_progress_';

export function getLocalCardProgress(userId: string): Record<string, UserCardProgress> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId || 'guest'}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalCardProgress(
  userId: string,
  progressMap: Record<string, UserCardProgress>
): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${userId || 'guest'}`, JSON.stringify(progressMap));
  } catch (e) {
    console.warn('Failed to save flashcards local progress', e);
  }
}
