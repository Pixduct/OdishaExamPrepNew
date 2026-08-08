import { activityTracker, UserActivity } from './activityTracker';

export interface ReadinessComponentBreakdown {
  accuracy: { percentage: number; label: string; valueText: string; subtext: string };
  syllabus: { percentage: number; label: string; valueText: string; subtext: string };
  volume: { percentage: number; label: string; valueText: string; subtext: string };
  mocks: { percentage: number; label: string; valueText: string; subtext: string };
}

export interface ReadinessResult {
  score: number; // 0 - 100
  rankTitle: string;
  rankBadgeColor: string;
  rankBadgeBg: string;
  rankBadgeBorder: string;
  rankBadgeIcon: string;
  breakdown: ReadinessComponentBreakdown;
  questionsSolved: number;
  totalCorrectAnswers: number;
  totalAttemptedQuestions: number;
  accuracyAvg: number;
  mocksCompleted: number;
  topicsAttemptedCount: number;
  recommendedDailyQs: number;
}

const QUESTION_VOLUME_TARGET = 1000;
const MOCK_COMPLETION_TARGET = 10;
const TOTAL_SYLLABUS_TOPICS_TARGET = 10;

/** Sanitize and normalize subject/topic names */
const cleanTopicName = (rawTitle: string, examName?: string): string => {
  if (!rawTitle) return 'General Studies';
  let t = rawTitle;

  if (examName) {
    const escaped = examName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    t = t.replace(new RegExp(escaped, 'gi'), '');
  }

  t = t
    .replace(/(\s*-\s*Practice Session)+$/gi, '')
    .replace(/(\s*-\s*Mock Test)+$/gi, '')
    .replace(/practice/gi, '')
    .replace(/test/gi, '')
    .replace(/mock/gi, '')
    .replace(/session/gi, '')
    .replace(/pyq/gi, '')
    .replace(/daily/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (!t || t.match(/^[0-9]+$/)) return 'General Core';

  return t.charAt(0).toUpperCase() + t.slice(1);
};

/** Compute student readiness score with beginner-friendly labels */
export const calculateExamReadiness = (userId?: string): ReadinessResult => {
  try {
    const activities: UserActivity[] = activityTracker.getActivities(userId);

    let totalQuestionsSolved = 0;
    let totalCorrectAnswers = 0;
    let totalAttemptedQuestions = 0;
    let mocksCompleted = 0;
    const uniqueTopics = new Set<string>();

    activities.forEach(act => {
      const correct = typeof act.correct === 'number' ? act.correct : (act.metadata?.correctCount || act.metadata?.correct || 0);
      const incorrect = typeof act.incorrect === 'number' ? act.incorrect : (act.metadata?.incorrectCount || act.metadata?.incorrect || 0);
      const solvedInSession = correct + incorrect;

      if (act.type === 'mock_test_completed' || act.type === 'practice_test_completed') {
        totalQuestionsSolved += Math.max(solvedInSession, act.metadata?.totalQuestions || 0);
        totalCorrectAnswers += correct;
        totalAttemptedQuestions += Math.max(solvedInSession, 1);

        const isFullMock = act.type === 'mock_test_completed' || 
          act.metadata?.testCategory?.toLowerCase().includes('full') || 
          act.metadata?.isMock === true ||
          (act.title?.toLowerCase().includes('mock') && !act.title?.toLowerCase().includes('practice'));

        if (isFullMock) {
          mocksCompleted++;
        }

        const topic = cleanTopicName(act.title, act.metadata?.examName);
        if (topic) uniqueTopics.add(topic);
      } else if (act.type === 'test_incomplete') {
        totalQuestionsSolved += solvedInSession;
        totalCorrectAnswers += correct;
        totalAttemptedQuestions += Math.max(solvedInSession, 0);

        const topic = cleanTopicName(act.title, act.metadata?.examName);
        if (topic) uniqueTopics.add(topic);
      }
    });

    // 1. Accuracy Component (40% Weight)
    const accuracyAvg = totalAttemptedQuestions > 0 
      ? Math.round((totalCorrectAnswers / totalAttemptedQuestions) * 100) 
      : 0;
    const accuracyPct = Math.min(100, Math.max(0, accuracyAvg));
    const accuracyWeightedScore = Number(((accuracyPct / 100) * 40).toFixed(1));

    // 2. Syllabus Coverage Component (20% Weight)
    const topicsAttemptedCount = uniqueTopics.size;
    const syllabusPct = Math.min(100, Math.round((topicsAttemptedCount / TOTAL_SYLLABUS_TOPICS_TARGET) * 100));
    const syllabusWeightedScore = Number(((syllabusPct / 100) * 20).toFixed(1));

    // 3. Question Volume Component (20% Weight)
    const volumePct = Math.min(100, Math.round((totalQuestionsSolved / QUESTION_VOLUME_TARGET) * 100));
    const volumeWeightedScore = Number(((volumePct / 100) * 20).toFixed(1));

    // 4. Mock Completion Component (20% Weight)
    const mockPct = Math.min(100, Math.round((mocksCompleted / MOCK_COMPLETION_TARGET) * 100));
    const mockWeightedScore = Number(((mockPct / 100) * 20).toFixed(1));

    // Overall Combined Readiness Score
    const overallScore = Math.min(100, Math.max(0, Math.round(accuracyWeightedScore + syllabusWeightedScore + volumeWeightedScore + mockWeightedScore)));

    // Beginner-friendly rank titles
    let rankTitle = 'Getting Started';
    let rankBadgeColor = 'text-emerald-400';
    let rankBadgeBg = 'bg-emerald-500/10';
    let rankBadgeBorder = 'border-emerald-500/25';
    let rankBadgeIcon = '🌱';

    if (overallScore >= 90) {
      rankTitle = 'Fully Exam Ready!';
      rankBadgeColor = 'text-cyan-300';
      rankBadgeBg = 'bg-cyan-500/15';
      rankBadgeBorder = 'border-cyan-400/40';
      rankBadgeIcon = '🏆';
    } else if (overallScore >= 75) {
      rankTitle = 'Great Progress!';
      rankBadgeColor = 'text-amber-400';
      rankBadgeBg = 'bg-amber-500/15';
      rankBadgeBorder = 'border-amber-400/40';
      rankBadgeIcon = '🔥';
    } else if (overallScore >= 50) {
      rankTitle = 'Halfway There!';
      rankBadgeColor = 'text-indigo-300';
      rankBadgeBg = 'bg-indigo-500/15';
      rankBadgeBorder = 'border-indigo-400/40';
      rankBadgeIcon = '⭐';
    } else if (overallScore >= 25) {
      rankTitle = 'Building Foundation';
      rankBadgeColor = 'text-blue-300';
      rankBadgeBg = 'bg-blue-500/15';
      rankBadgeBorder = 'border-blue-400/40';
      rankBadgeIcon = '📚';
    }

    const recommendedDailyQs = overallScore >= 75 ? 20 : (overallScore >= 50 ? 30 : 40);

    return {
      score: overallScore,
      rankTitle,
      rankBadgeColor,
      rankBadgeBg,
      rankBadgeBorder,
      rankBadgeIcon,
      breakdown: {
        accuracy: { 
          percentage: accuracyPct, 
          label: 'Accuracy (Right Answers)',
          valueText: `${accuracyAvg}% Correct`,
          subtext: `${totalCorrectAnswers} right answers out of ${totalAttemptedQuestions} questions solved`
        },
        syllabus: { 
          percentage: syllabusPct, 
          label: 'Subjects Covered',
          valueText: `${topicsAttemptedCount} of ${TOTAL_SYLLABUS_TOPICS_TARGET} Subjects`,
          subtext: `You have practiced ${topicsAttemptedCount} core topics so far`
        },
        volume: { 
          percentage: volumePct, 
          label: 'Practice Questions Solved',
          valueText: `${totalQuestionsSolved} Questions Solved`,
          subtext: `Goal: ${QUESTION_VOLUME_TARGET} practice questions for full confidence`
        },
        mocks: { 
          percentage: mockPct, 
          label: 'Mock Tests Completed',
          valueText: `${mocksCompleted} Mock Tests Taken`,
          subtext: `Target: ${MOCK_COMPLETION_TARGET} full mock tests completed`
        }
      },
      questionsSolved: totalQuestionsSolved,
      totalCorrectAnswers,
      totalAttemptedQuestions,
      accuracyAvg,
      mocksCompleted,
      topicsAttemptedCount,
      recommendedDailyQs
    };
  } catch (e) {
    return {
      score: 0,
      rankTitle: 'Getting Started',
      rankBadgeColor: 'text-emerald-400',
      rankBadgeBg: 'bg-emerald-500/10',
      rankBadgeBorder: 'border-emerald-500/25',
      rankBadgeIcon: '🌱',
      breakdown: {
        accuracy: { percentage: 0, label: 'Accuracy (Right Answers)', valueText: '0% Correct', subtext: '0 right answers out of 0 questions solved' },
        syllabus: { percentage: 0, label: 'Subjects Covered', valueText: '0 of 10 Subjects', subtext: 'Start practicing topics to build syllabus coverage' },
        volume: { percentage: 0, label: 'Practice Questions Solved', valueText: '0 Questions Solved', subtext: 'Goal: 1,000 practice questions for full confidence' },
        mocks: { percentage: 0, label: 'Mock Tests Completed', valueText: '0 Mock Tests Taken', subtext: 'Target: 10 full mock tests completed' }
      },
      questionsSolved: 0,
      totalCorrectAnswers: 0,
      totalAttemptedQuestions: 0,
      accuracyAvg: 0,
      mocksCompleted: 0,
      topicsAttemptedCount: 0,
      recommendedDailyQs: 30
    };
  }
};
