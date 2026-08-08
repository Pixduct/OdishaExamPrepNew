import { supabase } from './supabase';
import { activityTracker } from './activityTracker';

export interface StreakState {
  currentStreak: number;
  highestStreak: number;
  lastActiveDate: string; // 'YYYY-MM-DD'
  todayQuestionsSolved: number;
  todayGoalCompleted: boolean;
  streakFreezesAvailable: number;
  weeklyHistory: Record<string, boolean>; // 'YYYY-MM-DD' -> true
}

export interface MilestoneBadge {
  id: string;
  name: string;
  daysRequired: number;
  icon: string;
  color: string;
  description: string;
  unlocked: boolean;
}

const STREAK_GOAL_QUESTIONS = 20;
const STORAGE_KEY_PREFIX = 'oep_streak_';

/** Get local timezone date string 'YYYY-MM-DD' */
export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Format ISO timestamp to YYYY-MM-DD */
export const toDateString = (isoTimestamp: string): string => {
  if (!isoTimestamp) return '';
  const d = new Date(isoTimestamp);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Get date string for N days ago */
export const getDateStringDaysAgo = (daysAgo: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Calculate difference in calendar days between two YYYY-MM-DD strings */
export const getDaysDifference = (dateStr1: string, dateStr2: string): number => {
  if (!dateStr1 || !dateStr2) return 999;
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

/** Default initial streak state */
export const getDefaultStreakState = (): StreakState => {
  const today = getTodayDateString();
  return {
    currentStreak: 0,
    highestStreak: 0,
    lastActiveDate: '',
    todayQuestionsSolved: 0,
    todayGoalCompleted: false,
    streakFreezesAvailable: 2,
    weeklyHistory: { [today]: false }
  };
};

/** Inspect activity log to compute solved questions for a given YYYY-MM-DD date */
export const getQuestionsSolvedForDate = (dateStr: string, userId?: string): number => {
  try {
    const activities = activityTracker.getActivities(userId);
    let count = 0;

    activities.forEach(act => {
      const actDate = toDateString(act.timestamp);
      if (actDate === dateStr) {
        if (act.type === 'mock_test_completed' || act.type === 'practice_test_completed') {
          const solved = (act.correct || 0) + (act.incorrect || 0);
          const totalQs = act.metadata?.totalQuestions || 20;
          count += Math.max(solved, totalQs);
        } else if (act.type === 'test_incomplete') {
          const solved = (act.correct || 0) + (act.incorrect || 0);
          const currentIdx = (act.metadata?.currentQuestionIndex || 0) + 1;
          count += Math.max(solved, currentIdx);
        }
      }
    });

    return count;
  } catch (e) {
    return 0;
  }
};

/** Get streak state from localStorage with activity auto-sync */
export const getStreakState = (userId?: string): StreakState => {
  const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  const today = getTodayDateString();

  let state: StreakState = getDefaultStreakState();

  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed: StreakState = JSON.parse(raw);
      state = sanitizeStreakState(parsed, today);
    }
  } catch (e) {
    console.error('Error parsing streak state:', e);
  }

  // Cross-reference with activity Tracker for today's progress
  const activitySolvedToday = getQuestionsSolvedForDate(today, userId);
  if (activitySolvedToday > state.todayQuestionsSolved) {
    state.todayQuestionsSolved = activitySolvedToday;
  }

  if (state.todayQuestionsSolved >= STREAK_GOAL_QUESTIONS && !state.todayGoalCompleted) {
    state.todayGoalCompleted = true;
    if (!state.lastActiveDate || getDaysDifference(state.lastActiveDate, today) > 0) {
      const daysDiff = state.lastActiveDate ? getDaysDifference(state.lastActiveDate, today) : 999;
      if (daysDiff === 1) {
        state.currentStreak += 1;
      } else if (daysDiff > 1) {
        state.currentStreak = 1;
      } else if (!state.lastActiveDate) {
        state.currentStreak = 1;
      }
      state.highestStreak = Math.max(state.highestStreak, state.currentStreak);
      state.lastActiveDate = today;
    }
  }

  if (state.todayGoalCompleted) {
    state.weeklyHistory = {
      ...(state.weeklyHistory || {}),
      [today]: true
    };
  }

  return state;
};

/** Sanitize streak state against date progression & reset logic */
const sanitizeStreakState = (state: StreakState, today: string): StreakState => {
  const updated: StreakState = { 
    ...state,
    weeklyHistory: { ...(state.weeklyHistory || {}) }
  };
  
  const lastDate = updated.lastActiveDate;

  if (!lastDate) {
    updated.todayQuestionsSolved = updated.todayGoalCompleted ? STREAK_GOAL_QUESTIONS : (updated.todayQuestionsSolved || 0);
    return updated;
  }

  const daysDiff = getDaysDifference(lastDate, today);

  if (daysDiff === 0) {
    // Same day — retain today's progress
    if (updated.todayGoalCompleted) {
      updated.weeklyHistory[today] = true;
    }
    return updated;
  } else if (daysDiff === 1) {
    // Yesterday was last active — today is fresh start for daily goal
    updated.todayQuestionsSolved = 0;
    updated.todayGoalCompleted = false;
    return updated;
  } else {
    // Missed 1+ days — check if Streak Freeze can save the streak
    if (updated.currentStreak > 0) {
      if (updated.streakFreezesAvailable > 0 && daysDiff === 2) {
        // Freeze consumes automatically for 1 missed day
        updated.streakFreezesAvailable -= 1;
        const yesterday = getDateStringDaysAgo(1);
        updated.weeklyHistory[yesterday] = true; // Protect yesterday
      } else {
        // Reset streak
        updated.currentStreak = 0;
      }
    }
    updated.todayQuestionsSolved = 0;
    updated.todayGoalCompleted = false;
    return updated;
  }
};

/** Save streak state to localStorage & sync asynchronously to Supabase */
export const saveStreakState = async (state: StreakState, userId?: string): Promise<void> => {
  const storageKey = `${STORAGE_KEY_PREFIX}${userId || 'guest'}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save streak to localStorage:', e);
  }

  if (userId && userId !== 'guest') {
    try {
      await supabase.auth.updateUser({
        data: { streak_data: state }
      });
    } catch (e) {
      console.warn('Failed to sync streak data to Supabase cloud:', e);
    }
  }
};

/** Record questions solved and evaluate goal completion / streak progression */
export const recordQuestionSolved = (
  count: number = 1,
  userId?: string
): { newState: StreakState; goalJustCompleted: boolean } => {
  const currentState = getStreakState(userId);
  const today = getTodayDateString();

  let goalJustCompleted = false;
  const newSolved = currentState.todayQuestionsSolved + count;
  const wasCompleted = currentState.todayGoalCompleted;
  const isCompletedNow = newSolved >= STREAK_GOAL_QUESTIONS;

  const newState: StreakState = {
    ...currentState,
    todayQuestionsSolved: newSolved,
    todayGoalCompleted: isCompletedNow || wasCompleted,
    weeklyHistory: { ...(currentState.weeklyHistory || {}) }
  };

  // If goal just completed today for the first time
  if (!wasCompleted && isCompletedNow) {
    goalJustCompleted = true;
    const lastDate = currentState.lastActiveDate;
    const daysDiff = lastDate ? getDaysDifference(lastDate, today) : 999;

    if (!lastDate || daysDiff > 1) {
      // First day or after reset
      newState.currentStreak = 1;
    } else if (daysDiff === 1) {
      // Consecutive day streak extension!
      newState.currentStreak += 1;
    } else if (daysDiff === 0 && newState.currentStreak === 0) {
      newState.currentStreak = 1;
    }

    newState.highestStreak = Math.max(newState.highestStreak, newState.currentStreak);
    newState.lastActiveDate = today;
    newState.weeklyHistory[today] = true;
  } else if (isCompletedNow) {
    newState.weeklyHistory[today] = true;
  }

  saveStreakState(newState, userId);
  return { newState, goalJustCompleted };
};

/** Force complete daily goal (e.g. upon submitting a test) */
export const completeDailyGoalDirectly = (userId?: string): { newState: StreakState; goalJustCompleted: boolean } => {
  return recordQuestionSolved(STREAK_GOAL_QUESTIONS, userId);
};

/** Get milestone badges status */
export const getMilestoneBadges = (highestStreak: number): MilestoneBadge[] => {
  return [
    {
      id: 'bronze',
      name: 'Bronze Scholar',
      daysRequired: 7,
      icon: '🥉',
      color: 'from-amber-600 to-amber-800 text-amber-100 border-amber-500/40',
      description: 'Maintain a 7-day preparation streak',
      unlocked: highestStreak >= 7
    },
    {
      id: 'silver',
      name: 'Silver Warrior',
      daysRequired: 30,
      icon: '🥈',
      color: 'from-slate-400 to-slate-600 text-slate-100 border-slate-300/40',
      description: 'Maintain a 30-day preparation streak',
      unlocked: highestStreak >= 30
    },
    {
      id: 'gold',
      name: 'Gold Master',
      daysRequired: 90,
      icon: '🥇',
      color: 'from-yellow-400 to-amber-500 text-amber-950 border-yellow-300/60',
      description: 'Maintain a 90-day preparation streak',
      unlocked: highestStreak >= 90
    },
    {
      id: 'legend',
      name: 'Legendary Rank',
      daysRequired: 365,
      icon: '💎',
      color: 'from-cyan-400 via-blue-500 to-indigo-600 text-white border-cyan-300/60',
      description: 'Maintain a 365-day preparation streak',
      unlocked: highestStreak >= 365
    }
  ];
};

/** Get current week's 7 days array with completion status (Mon - Sun) */
export const getCurrentWeekDays = (weeklyHistory: Record<string, boolean> = {}) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMon = (dayOfWeek + 6) % 7; // distance back to Monday
  
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMon);

  const days = [];
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const isToday = dateStr === getTodayDateString();
    const isCompleted = !!weeklyHistory[dateStr];
    
    days.push({
      label: dayLabels[i],
      dateStr,
      isToday,
      isCompleted
    });
  }

  return days;
};
