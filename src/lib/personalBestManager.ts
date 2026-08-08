import { activityTracker, UserActivity } from './activityTracker';
import { getStreakState } from './streakManager';

export interface PersonalBestRecordItem {
  value: number;
  formattedValue: string;
  testTitle?: string;
  timestamp?: string;
  detail?: string;
}

export interface SubjectPersonalBest {
  subjectName: string;
  highestAccuracy: number;
  totalAttempted: number;
  attemptCount: number;
  bestCorrect: number;
}

export interface PersonalBestsData {
  highestScore: PersonalBestRecordItem;
  highestAccuracy: PersonalBestRecordItem;
  fastestSpeed: PersonalBestRecordItem;
  longestStreak: PersonalBestRecordItem;
  maxDailyQuestions: PersonalBestRecordItem;
  subjectBests: SubjectPersonalBest[];
}

export interface PersonalBestImprovement {
  id: string;
  title: string;
  description: string;
  oldFormatted: string;
  newFormatted: string;
  improvementText: string;
  icon: string;
}

/** Retrieve lifetime Personal Bests calculated strictly from live activity tracker & streak history */
export const getPersonalBests = (userId?: string): PersonalBestsData => {
  try {
    const activities: UserActivity[] = activityTracker.getActivities(userId);
    const streakState = getStreakState(userId);

    let highestScoreVal = 0;
    let highestScoreTitle = '';
    let highestScoreTime = '';
    let highestScoreDetail = '';

    let highestAccuracyVal = 0;
    let highestAccuracyTitle = '';
    let highestAccuracyTime = '';
    let highestAccuracyDetail = '';

    let fastestSpeedVal = 999; // seconds per question
    let fastestSpeedTitle = '';
    let fastestSpeedTime = '';
    let fastestSpeedDetail = '';

    const dailyQsMap: Record<string, number> = {};
    const subjectStatsMap: Record<string, { correct: number; attempted: number; attempts: number; maxAccuracy: number }> = {};

    activities.forEach(act => {
      const correct = typeof act.correct === 'number' ? act.correct : (act.metadata?.correctCount || act.metadata?.correct || 0);
      const incorrect = typeof act.incorrect === 'number' ? act.incorrect : (act.metadata?.incorrectCount || act.metadata?.incorrect || 0);
      const solved = correct + incorrect;
      const totalInTest = act.metadata?.test?.questions?.length || act.metadata?.totalQuestions || solved || 1;
      const timeSpentSecs = act.metadata?.timeSpentSeconds || act.metadata?.timeTaken || (solved * 45);

      const rawSub = act.metadata?.subjectName || act.metadata?.bankType || act.title || 'General Subject';
      const cleanSub = rawSub.replace(/(\s*-\s*Practice Session)+$/gi, '').replace(/(\s*-\s*Mock Test)+$/gi, '').trim();

      if (solved > 0 && (act.type === 'mock_test_completed' || act.type === 'practice_test_completed')) {
        // 1. Highest Score %
        const scorePct = Math.round((correct / Math.max(totalInTest, solved)) * 100);
        if (scorePct > highestScoreVal) {
          highestScoreVal = scorePct;
          highestScoreTitle = cleanSub;
          highestScoreTime = act.timestamp;
          highestScoreDetail = `${correct} / ${totalInTest} marks scored`;
        }

        // 2. Highest Accuracy %
        const accuracyPct = Math.round((correct / solved) * 100);
        if (accuracyPct > highestAccuracyVal) {
          highestAccuracyVal = accuracyPct;
          highestAccuracyTitle = cleanSub;
          highestAccuracyTime = act.timestamp;
          highestAccuracyDetail = `${correct} right out of ${solved} answered`;
        }

        // 3. Fastest Speed (Seconds per Question)
        const secPerQ = Number((timeSpentSecs / solved).toFixed(1));
        if (secPerQ > 1.5 && secPerQ < fastestSpeedVal) {
          fastestSpeedVal = secPerQ;
          fastestSpeedTitle = cleanSub;
          fastestSpeedTime = act.timestamp;
          fastestSpeedDetail = `${secPerQ}s per question in ${cleanSub}`;
        }

        // Daily question aggregator
        const dateStr = act.timestamp.split('T')[0];
        dailyQsMap[dateStr] = (dailyQsMap[dateStr] || 0) + solved;

        // Subject aggregator
        if (!subjectStatsMap[cleanSub]) {
          subjectStatsMap[cleanSub] = { correct: 0, attempted: 0, attempts: 0, maxAccuracy: 0 };
        }
        subjectStatsMap[cleanSub].correct += correct;
        subjectStatsMap[cleanSub].attempted += solved;
        subjectStatsMap[cleanSub].attempts += 1;
        if (accuracyPct > subjectStatsMap[cleanSub].maxAccuracy) {
          subjectStatsMap[cleanSub].maxAccuracy = accuracyPct;
        }
      }
    });

    // Calculate max questions in a single day
    let maxDailyQsVal = streakState.todayQuestionsSolved || 0;
    for (const count of Object.values(dailyQsMap)) {
      if (count > maxDailyQsVal) maxDailyQsVal = count;
    }

    // Process Subject Bests
    const subjectBests: SubjectPersonalBest[] = Object.entries(subjectStatsMap).map(([subjectName, stats]) => {
      const acc = stats.maxAccuracy || (stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0);
      return {
        subjectName,
        highestAccuracy: acc,
        totalAttempted: stats.attempted,
        attemptCount: stats.attempts,
        bestCorrect: stats.correct
      };
    }).sort((a, b) => b.highestAccuracy - a.highestAccuracy);

    return {
      highestScore: {
        value: highestScoreVal,
        formattedValue: highestScoreVal > 0 ? `${highestScoreVal}% Score` : 'No Record Yet',
        testTitle: highestScoreTitle || 'Complete a test to set record',
        timestamp: highestScoreTime,
        detail: highestScoreDetail || 'Complete a test to unlock'
      },
      highestAccuracy: {
        value: highestAccuracyVal,
        formattedValue: highestAccuracyVal > 0 ? `${highestAccuracyVal}% Correct` : 'No Record Yet',
        testTitle: highestAccuracyTitle || 'Complete a test to set record',
        timestamp: highestAccuracyTime,
        detail: highestAccuracyDetail || 'Highest test accuracy'
      },
      fastestSpeed: {
        value: fastestSpeedVal === 999 ? 0 : fastestSpeedVal,
        formattedValue: fastestSpeedVal < 999 ? `${fastestSpeedVal}s / Question` : 'No Record Yet',
        testTitle: fastestSpeedTitle || 'Complete a test to set record',
        timestamp: fastestSpeedTime,
        detail: fastestSpeedDetail || 'Average time per question'
      },
      longestStreak: {
        value: streakState.highestStreak || 1,
        formattedValue: `${streakState.highestStreak || 1} Days In A Row`,
        detail: 'Max consecutive study days'
      },
      maxDailyQuestions: {
        value: maxDailyQsVal,
        formattedValue: `${maxDailyQsVal} Questions Solved`,
        detail: 'Most questions answered in 1 day'
      },
      subjectBests
    };
  } catch (e) {
    return {
      highestScore: { value: 0, formattedValue: 'No Record Yet', detail: 'Complete a test' },
      highestAccuracy: { value: 0, formattedValue: 'No Record Yet', detail: 'Complete a test' },
      fastestSpeed: { value: 0, formattedValue: 'No Record Yet', detail: 'Complete a test' },
      longestStreak: { value: 1, formattedValue: '1 Day', detail: 'Consecutive study days' },
      maxDailyQuestions: { value: 0, formattedValue: '0 Questions', detail: 'Questions in 1 day' },
      subjectBests: []
    };
  }
};

/** Evaluate post-test results and return broken Personal Best records if any */
export const evaluatePersonalBestImprovements = (
  userId: string | undefined,
  currentTestResult: {
    scorePct: number;
    accuracyPct: number;
    timeSpentSecs: number;
    questionsSolved: number;
    testTitle?: string;
  }
): PersonalBestImprovement[] => {
  const currentPBs = getPersonalBests(userId);
  const improvements: PersonalBestImprovement[] = [];

  // 1. Check Highest Score Improvement
  if (currentTestResult.scorePct > currentPBs.highestScore.value && currentPBs.highestScore.value > 0) {
    const diff = currentTestResult.scorePct - currentPBs.highestScore.value;
    improvements.push({
      id: 'highest-score',
      title: 'New Highest Score Record!',
      description: 'You set a new personal record for your highest test score.',
      oldFormatted: `${currentPBs.highestScore.value}%`,
      newFormatted: `${currentTestResult.scorePct}%`,
      improvementText: `+${diff}% Higher Score!`,
      icon: '🏆'
    });
  }

  // 2. Check Highest Accuracy Improvement
  if (currentTestResult.accuracyPct > currentPBs.highestAccuracy.value && currentPBs.highestAccuracy.value > 0) {
    const diff = currentTestResult.accuracyPct - currentPBs.highestAccuracy.value;
    improvements.push({
      id: 'highest-accuracy',
      title: 'New High Accuracy Record!',
      description: 'Your accuracy reached a new personal record.',
      oldFormatted: `${currentPBs.highestAccuracy.value}% Correct`,
      newFormatted: `${currentTestResult.accuracyPct}% Correct`,
      improvementText: `+${diff}% Better Accuracy!`,
      icon: '🎯'
    });
  }

  // 3. Check Speed Improvement
  if (currentTestResult.questionsSolved > 0 && currentTestResult.timeSpentSecs > 0) {
    const currentSpeed = Number((currentTestResult.timeSpentSecs / currentTestResult.questionsSolved).toFixed(1));
    if (currentPBs.fastestSpeed.value > 0 && currentSpeed < currentPBs.fastestSpeed.value && currentSpeed >= 1.5) {
      const diff = Number((currentPBs.fastestSpeed.value - currentSpeed).toFixed(1));
      improvements.push({
        id: 'fastest-speed',
        title: 'New Speed Record!',
        description: 'You solved questions faster than ever before.',
        oldFormatted: `${currentPBs.fastestSpeed.value}s / Q`,
        newFormatted: `${currentSpeed}s / Q`,
        improvementText: `${diff}s faster per question!`,
        icon: '⚡'
      });
    }
  }

  return improvements;
};
