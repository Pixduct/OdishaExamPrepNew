import { supabase } from './supabase';

export interface UserActivity {
  id: string;
  userId: string;
  type: 'mock_test_completed' | 'practice_test_completed' | 'test_incomplete' | 'question_bank_accessed';
  title: string;
  timestamp: string;
  score?: number;
  totalMarks?: number;
  accuracy?: number;
  timeSpent?: number; // in seconds
  correct?: number;
  incorrect?: number;
  metadata?: any;
}

const STORAGE_KEY_PREFIX = 'oep_activities_';

// Maximum activities to keep in localStorage (full data including questions)
const LOCAL_MAX = 500;
// Maximum activities to sync to cloud (lightweight, no questions)
const CLOUD_MAX = 5;

/**
 * Strip ALL heavy session state from an activity before cloud sync.
 * Cloud metadata is ONLY for dashboard display (Continue Practice card, history count).
 * Full data (answers, questions, progress) lives in localStorage for resume functionality.
 *
 * Target: < 200 bytes per activity in cloud.
 */
function sanitizeActivities(arr: any[]): UserActivity[] {
  if (!Array.isArray(arr)) return [];
  return arr.filter((a): a is UserActivity => !!(a && typeof a === 'object' && typeof a.type === 'string'));
}

function toCloudSafe(activity: UserActivity): UserActivity {
  if (!activity) return {} as any;
  try {
    const m = activity.metadata || {};
    const testId = m.test?.id || m.testId || m.bankId || (m.resumeSessionId && !m.resumeSessionId.startsWith('session-') ? m.resumeSessionId : undefined);
    const testTitle = m.test?.title || activity.title;

    // Only keep fields needed for cross-device review & dashboard display
    const lightMeta: any = {
      testId: testId,
      examId: m.examId,
      examName: m.examName,
      testCategory: m.testCategory,
      bankType: m.bankType,
      bankId: m.bankId,
      resumeSessionId: m.resumeSessionId,
      timeTaken: m.timeTaken || activity.timeSpent,
      totalMarks: activity.totalMarks || m.totalMarks || m.total,
      total: m.total || activity.totalMarks || m.totalMarks,
      score: activity.score ?? m.score,
      accuracy: activity.accuracy ?? m.accuracy,
      correctCount: activity.correct ?? m.correctCount,
      incorrectCount: activity.incorrect ?? m.incorrectCount,
    };

    if (activity.type === 'mock_test_completed' || activity.type === 'practice_test_completed') {
      // Store compact user choices map (e.g. {"0":1, "1":3} is < 150 bytes) and test metadata
      if (m.answers && typeof m.answers === 'object') {
        lightMeta.answers = m.answers;
      }
      lightMeta.test = {
        id: testId || '',
        title: testTitle || '',
        durationMinutes: m.test?.durationMinutes || 0,
        _questionCount: m.test?._questionCount || (Array.isArray(m.test?.questions) ? m.test.questions.length : (m.totalQuestions || 0)),
      };
    } else if (activity.type === 'test_incomplete') {
      // Keep minimal progress info for cross-device resume
      lightMeta.currentQuestionIndex = m.currentQuestionIndex ?? m.progressState?.currentQuestionIndex ?? 0;
      lightMeta.timeLeft = m.timeLeft ?? m.progressState?.timeLeft;
      if (m.answers && typeof m.answers === 'object') {
        lightMeta.answers = m.answers;
      } else if (m.progressState?.answers && typeof m.progressState.answers === 'object') {
        lightMeta.answers = m.progressState.answers;
      }
      // Store test identity ONLY (no heavy question arrays in cloud sync)
      if (m.test && typeof m.test === 'object') {
        lightMeta.test = {
          id: m.test.id || testId || '',
          title: m.test.title || testTitle || '',
          durationMinutes: m.test.durationMinutes || 60,
          _questionCount:
            m.test._questionCount ||
            (Array.isArray(m.test.questions) ? m.test.questions.length : 0),
        };
      }
      // totalQuestions for progress %
      lightMeta.totalQuestions =
        m.totalQuestions ||
        lightMeta.test?._questionCount ||
        0;
    }
    // Strip: markedForReview, timeSpent map, heavy question arrays, etc.
    return { ...activity, metadata: lightMeta };
  } catch {
    // On any error return a minimal safe object
    return {
      id: activity?.id || '',
      userId: activity?.userId || '',
      type: activity?.type || 'mock_test_completed',
      title: activity?.title || '',
      timestamp: activity?.timestamp || new Date().toISOString(),
      score: activity?.score,
      totalMarks: activity?.totalMarks,
      accuracy: activity?.accuracy,
      correct: activity?.correct,
      incorrect: activity?.incorrect,
    };
  }
}

/**
 * Safely parse a JSON string, returning fallback on any error.
 */
function safeParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    const parsed = JSON.parse(json);
    return (Array.isArray(fallback) ? (Array.isArray(parsed) ? parsed : fallback) : parsed) as T;
  } catch {
    return fallback;
  }
}

export const activityTracker = {
  getActivities: (userId: string, userMetadata?: any): UserActivity[] => {
    if (!userId) return [];
    try {
      const localKey = `${STORAGE_KEY_PREFIX}${userId}`;
      const localActivities = sanitizeActivities(safeParse<UserActivity[]>(
        localStorage.getItem(localKey),
        []
      ));

      const cloudActivities = sanitizeActivities((
        userMetadata?.activities && Array.isArray(userMetadata.activities)
      ) ? userMetadata.activities : []);

      if (cloudActivities.length === 0) {
        return localActivities;
      }

      if (localActivities.length === 0) {
        try {
          localStorage.setItem(localKey, JSON.stringify(cloudActivities));
        } catch { /* storage full — ignore */ }
        return cloudActivities;
      }

      // Synchronously merge local and cloud activities so any recent changes from other devices appear immediately on refresh
      const localMap = new Map(localActivities.map(a => [a.id || a.title, a]));
      const merged: UserActivity[] = [];
      const processedKeys = new Set<string>();

      // 1. Process cloud items (prefer local version if local has full question arrays, but keep fresh cloud metadata)
      for (const cloudItem of cloudActivities) {
        const key = cloudItem.id || cloudItem.title;
        processedKeys.add(key);
        const localItem = localMap.get(key);
        if (localItem && Array.isArray(localItem.metadata?.test?.questions) && localItem.metadata.test.questions.length > 0) {
          merged.push({
            ...cloudItem,
            ...localItem,
            metadata: {
              ...cloudItem.metadata,
              ...localItem.metadata,
            }
          });
        } else {
          merged.push(localItem ? { ...localItem, ...cloudItem } : cloudItem);
        }
      }

      // 2. Add any local items not present in cloud (e.g. offline attempts)
      for (const localItem of localActivities) {
        const key = localItem.id || localItem.title;
        if (!processedKeys.has(key)) {
          merged.push(localItem);
        }
      }

      // Sort chronologically by timestamp (newest first)
      merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      const finalMerged = merged.slice(0, LOCAL_MAX);
      try {
        localStorage.setItem(localKey, JSON.stringify(finalMerged));
      } catch { /* ignore storage error */ }

      return finalMerged;
    } catch (e) {
      console.error('Failed to load activities', e);
      return [];
    }
  },

  logActivity: async (
    userId: string | undefined | null,
    activity: Omit<UserActivity, 'id' | 'userId' | 'timestamp'>
  ) => {
    if (!userId) return;

    try {
      const localKey = `${STORAGE_KEY_PREFIX}${userId}`;
      const existing = sanitizeActivities(safeParse<UserActivity[]>(
        localStorage.getItem(localKey),
        []
      ));

      const newActivity: UserActivity = {
        ...activity,
        id: Math.random().toString(36).substring(2, 15),
        userId,
        timestamp: new Date().toISOString(),
      } as UserActivity;

      let filteredExisting = existing;
      if (activity.type === 'mock_test_completed' || activity.type === 'practice_test_completed') {
        const completedBankId = activity.metadata?.test?.bankId || activity.metadata?.bankId || activity.metadata?.test?.id;
        const completedTitle = activity.title;
        filteredExisting = existing.filter(act => {
          if (act.type !== 'test_incomplete') return true;
          const actBankId = act.metadata?.test?.bankId || act.metadata?.bankId || act.metadata?.test?.id;
          if (completedBankId && actBankId && completedBankId === actBankId) return false;
          if (completedTitle && (act.title === completedTitle || act.title === `${completedTitle} - Practice Session` || completedTitle.startsWith(act.title?.replace(' - Practice Session', '')))) return false;
          return true;
        });
      } else if (activity.type === 'test_incomplete') {
        const newBankId = activity.metadata?.test?.bankId || activity.metadata?.bankId || activity.metadata?.test?.id;
        const newTitle = activity.title;
        filteredExisting = existing.filter(act => {
          if (act.type !== 'test_incomplete') return true;
          const actBankId = act.metadata?.test?.bankId || act.metadata?.bankId || act.metadata?.test?.id;
          if (newBankId && actBankId && newBankId === actBankId) return false;
          if (newTitle && act.title === newTitle) return false;
          return true;
        });
      }

      // Keep full data (with questions) in localStorage for resume functionality
      const updated = sanitizeActivities([newActivity, ...filteredExisting]).slice(0, LOCAL_MAX);
      try {
        localStorage.setItem(localKey, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('oep-activity-changed'));
      } catch (storageErr) {
        // If storage is full, try trimming older entries
        try {
          const trimmed = sanitizeActivities([newActivity, ...existing]).slice(0, 100);
          localStorage.setItem(localKey, JSON.stringify(trimmed));
          window.dispatchEvent(new CustomEvent('oep-activity-changed'));
        } catch { /* give up on local storage */ }
      }

      // Sync LIGHTWEIGHT version to cloud (no questions, no large timeSpent maps)
      // Only send the most recent CLOUD_MAX activities to keep metadata small
      const cloudPayload = updated.slice(0, CLOUD_MAX).map(toCloudSafe);

      // Relational database attempts logging
      if (activity.type === 'mock_test_completed' || activity.type === 'practice_test_completed') {
        try {
          const testId = activity.metadata?.test?.id || (activity.metadata?.resumeSessionId?.startsWith('session-') ? undefined : activity.metadata?.resumeSessionId);
          if (testId) {
            await supabase
              .from('attempts')
              .insert([{
                userId: userId,
                testId: testId,
                score: activity.score || 0,
                accuracy: activity.accuracy || 0,
                answers: activity.metadata?.answers || {},
                completedAt: new Date().toISOString()
              }]);
          }
        } catch (dbErr) {
          console.error('[Attempts System] Failed to write attempt to database:', dbErr);
        }
      }

      // Sync lightweight activity details to the public.activities table (no heavy question payloads)
      try {
        const cloudSafeActivity = toCloudSafe(newActivity);
        await supabase
          .from('activities')
          .upsert([{
            id: newActivity.id,
            userId: newActivity.userId,
            type: newActivity.type,
            title: newActivity.title,
            timestamp: newActivity.timestamp,
            score: newActivity.score,
            totalMarks: newActivity.totalMarks,
            accuracy: newActivity.accuracy,
            timeSpent: newActivity.timeSpent,
            metadata: cloudSafeActivity.metadata
          }]);
      } catch (dbErr) {
        console.error('[Activities System] Failed to write activity to database:', dbErr);
      }

      try {
        await supabase.auth.updateUser({
          data: { activities: cloudPayload },
        });
      } catch (cloudErr) {
        // Cloud sync failure is non-fatal — local data is still intact
        console.warn('Cloud activity sync failed (non-fatal):', cloudErr);
      }
    } catch (e) {
      console.error('Failed to log activity:', e);
    }
  },

  deleteActivity: async (userId: string, activityId: string) => {
    if (!userId || !activityId) return;
    try {
      const localKey = `${STORAGE_KEY_PREFIX}${userId}`;
      const existing = sanitizeActivities(safeParse<UserActivity[]>(
        localStorage.getItem(localKey),
        []
      ));
      const updated = existing.filter((a) => a && a.id !== activityId);
      try {
        localStorage.setItem(localKey, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('oep-activity-changed'));
      } catch { /* ignore */ }

      // Sync LIGHTWEIGHT version to cloud (no questions, no large timeSpent maps)
      const cloudPayload = updated.slice(0, CLOUD_MAX).map(toCloudSafe);

      // Delete from activities database table
      try {
        await supabase
          .from('activities')
          .delete()
          .eq('id', activityId)
          .eq('userId', userId);
      } catch (dbErr) {
        console.error('[Activities System] Failed to delete activity from database:', dbErr);
      }

      try {
        await supabase.auth.updateUser({
          data: { activities: cloudPayload },
        });
      } catch (cloudErr) {
        console.warn('Cloud activity sync failed (non-fatal):', cloudErr);
      }
    } catch (e) {
      console.error('Failed to delete activity:', e);
    }
  },

  clearActivities: async (userId: string) => {
    if (!userId) return;
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
      window.dispatchEvent(new CustomEvent('oep-activity-changed'));
    } catch { /* ignore */ }

    // Clear from activities database table
    try {
      await supabase
        .from('activities')
        .delete()
        .eq('userId', userId);
    } catch (dbErr) {
      console.error('[Activities System] Failed to clear activities from database:', dbErr);
    }

    try {
      await supabase.auth.updateUser({ data: { activities: [] } });
    } catch (e) {
      console.warn('Failed to clear cloud activities:', e);
    }
  },
};
