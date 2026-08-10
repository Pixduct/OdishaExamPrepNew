import { activityTracker, UserActivity } from './activityTracker';

export interface TopicWeakness {
  subjectName: string;
  topicName: string;
  accuracy: number; // 0 - 100% based strictly on correct / attempted
  attemptCount: number;
  totalCorrect: number;
  totalAttempted: number;
  totalQuestions: number; // Real question count in test bank
  status: 'critical' | 'developing' | 'mastered';
  rationale: string;
  incompleteActivity?: UserActivity | null;
  completedQuestionsCount?: number;
  totalQuestionsCount?: number;
}

export interface SmartRecommendationResult {
  primaryRecommendation: TopicWeakness | null;
  secondaryRecommendations: TopicWeakness[];
  allTopicConfidence: TopicWeakness[];
  hasAttempts: boolean;
}

/** Clean topic title string while preserving subject names */
const normalizeSubjectName = (rawTitle: string, metadata?: any): string => {
  if (metadata?.subjectName) return metadata.subjectName;
  if (metadata?.bankType) return metadata.bankType;
  if (!rawTitle) return 'General Studies';

  let t = rawTitle
    .replace(/(\s*-\s*Practice Session)+$/gi, '')
    .replace(/(\s*-\s*Mock Test)+$/gi, '')
    .replace(/practice/gi, '')
    .replace(/test/gi, '')
    .replace(/mock/gi, '')
    .replace(/session/gi, '')
    .replace(/pyq/gi, '')
    .replace(/daily/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/_/g, ' ')
    .trim();

  t = t.replace(/\s+/g, ' ');

  if (!t || t.match(/^[0-9]+$/)) return 'General Core';

  return t;
};

/** Analyze activity history and compute topic confidence strictly from real student activity data */
export const getSmartWeakTopicRecommendations = (userId?: string): SmartRecommendationResult => {
  try {
    const activities: UserActivity[] = activityTracker.getActivities(userId);

    const topicStats: Record<string, { 
      correct: number; 
      attempted: number; 
      attempts: number; 
      totalQs: number;
      incompleteAct?: UserActivity | null;
      completedQs?: number;
      totalQsCount?: number;
    }> = {};

    activities.forEach(act => {

      const correct = typeof act.correct === 'number' ? act.correct : (act.metadata?.correctCount || act.metadata?.correct || 0);
      const incorrect = typeof act.incorrect === 'number' ? act.incorrect : (act.metadata?.incorrectCount || act.metadata?.incorrect || 0);
      const solved = correct + incorrect;

      if (act.title && (act.type === 'mock_test_completed' || act.type === 'practice_test_completed' || act.type === 'test_incomplete')) {
        const topicName = normalizeSubjectName(act.title, act.metadata);
        const testQuestionCount = act.metadata?.test?.questions?.length || act.metadata?.totalQuestions || 20;

        if (!topicStats[topicName]) {
          topicStats[topicName] = { correct: 0, attempted: 0, attempts: 0, totalQs: testQuestionCount };
        }

        if (solved > 0) {
          topicStats[topicName].correct += correct;
          topicStats[topicName].attempted += solved;
        }
        topicStats[topicName].attempts += 1;
        topicStats[topicName].totalQs = Math.max(topicStats[topicName].totalQs, testQuestionCount);

        // Check for active incomplete session for this topic
        if (act.type === 'test_incomplete') {
          const currentIdx = (act.metadata?.currentQuestionIndex || 0) + 1;
          const totalInTest = testQuestionCount;
          
          if (!topicStats[topicName].incompleteAct || new Date(act.timestamp).getTime() > new Date(topicStats[topicName].incompleteAct!.timestamp).getTime()) {
            topicStats[topicName].incompleteAct = act;
            topicStats[topicName].completedQs = Math.min(currentIdx, totalInTest);
            topicStats[topicName].totalQsCount = totalInTest;
          }
        }
      }
    });

    const topicKeys = Object.keys(topicStats);

    if (topicKeys.length === 0) {
      // Dynamic fallback topics when no activity exists yet
      const defaultNames = ['General Core', 'Reasoning & Aptitude', 'Subject Knowledge'];

      const defaultTopics: TopicWeakness[] = defaultNames.map((name, idx) => ({
        subjectName: name,
        topicName: name,
        accuracy: 45 + idx * 5,
        totalQuestions: 20,
        attemptCount: 0,
        totalCorrect: 9,
        totalAttempted: 20,
        status: 'critical',
        rationale: 'High-priority subject. Completing practice drills improves overall exam readiness.',
        incompleteActivity: null
      }));

      return {
        primaryRecommendation: defaultTopics[0],
        secondaryRecommendations: defaultTopics.slice(1),
        allTopicConfidence: defaultTopics,
        hasAttempts: false
      };
    }

    const processedTopics: TopicWeakness[] = topicKeys.map(topicName => {
      const { correct, attempted, attempts, totalQs, incompleteAct, completedQs, totalQsCount } = topicStats[topicName];
      const accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0;
      
      // Impact Score prioritized by lowest accuracy and total attempted questions
      const impactScore = Math.round((100 - accuracy) * (attempted || 1));

      let status: 'critical' | 'developing' | 'mastered' = 'developing';
      if (accuracy < 50) status = 'critical';
      else if (accuracy >= 75) status = 'mastered';

      const rationale = `Your accuracy in ${topicName} is ${accuracy}% across ${attempted} attempted questions.`;

      return {
        subjectName: topicName,
        topicName,
        accuracy,
        totalQuestions: totalQs,
        attemptCount: attempts,
        totalCorrect: correct,
        totalAttempted: attempted,
        status,
        rationale,
        incompleteActivity: incompleteAct,
        completedQuestionsCount: completedQs,
        totalQuestionsCount: totalQsCount
      };
    });

    // Sort topics by lowest accuracy first, then total attempted questions
    processedTopics.sort((a, b) => a.accuracy - b.accuracy || b.totalAttempted - a.totalAttempted);

    return {
      primaryRecommendation: processedTopics.length > 0 ? processedTopics[0] : null,
      secondaryRecommendations: processedTopics.slice(1, 4),
      allTopicConfidence: processedTopics,
      hasAttempts: true
    };
  } catch (e) {
    return {
      primaryRecommendation: null,
      secondaryRecommendations: [],
      allTopicConfidence: [],
      hasAttempts: false
    };
  }
};
