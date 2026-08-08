import { getSmartWeakTopicRecommendations } from './recommendationEngine';
import { getStreakState } from './streakManager';
import { activityTracker, UserActivity } from './activityTracker';

export interface StudyPlanTask {
  id: string;
  title: string;
  subjectName: string;
  questionCount: number;
  estimatedMinutes: number;
  priorityLabel: string;
  priorityBadgeBg: string;
  taskType: 'practice' | 'review' | 'streak_goal';
  completed: boolean;
  actionText: string;
  reasonText: string;
}

export interface DailyStudyPlan {
  totalMinutes: number;
  remainingMinutes: number;
  expectedScoreBoost: string;
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  tasks: StudyPlanTask[];
  lastGeneratedTime: string;
  isPersonalizedFromAttempts: boolean;
  targetExamName: string;
}

const STORAGE_KEY_PLAN = 'oep_ai_study_plan_completed_tasks_v2';

/** Default exam syllabus subjects mapped for accurate fallback per target exam */
const EXAM_DEFAULT_SUBJECTS: Record<string, string[]> = {
  'nursing': ['Fundamentals of Nursing - I', 'Community Health Nursing - II', 'Medical Surgical Nursing - I', 'Microbiology & Pathology'],
  'ossc': ['Odisha History & Culture', 'Arithmetic & Reasoning', 'General English Grammar', 'Computer Awareness & IT'],
  'osssc': ['Odisha Geography & Wildlife', 'Quantitative Aptitude', 'Logical Reasoning & DI', 'Odia Language & Grammar'],
  'opsc': ['Indian Polity & Odisha Governance', 'General Studies Paper I', 'Economy & Odisha Budget', 'History & Heritage of Odisha'],
  'police': ['Odisha Police GK & Current Affairs', 'Reasoning & Mental Ability', 'Numerical Ability & Math', 'Odia & English Language'],
  'bed': ['Teaching Aptitude & Pedagogy', 'Educational General Awareness', 'Logical & Analytical Reasoning', 'General Odia & English']
};

/** Clean topic title string while preserving subject names */
export const cleanSubjectTitle = (rawName: string): string => {
  if (!rawName) return 'General Core';

  let s = rawName
    .replace(/^Solve\s+\d+\s+questions?\s+in\s+/gi, '')
    .replace(/^Solve\s+\d+\s+practice\s+questions?\s+in\s+/gi, '')
    .replace(/^Review\s+recent\s+incorrect\s+answers?\s+in\s+/gi, '')
    .replace(/(\s*-\s*Practice Session)+$/gi, '')
    .replace(/(\s*-\s*Mock Test)+$/gi, '')
    .replace(/practice/gi, '')
    .replace(/session/gi, '')
    .replace(/mock/gi, '')
    .replace(/\[.*?\]/g, '')
    .replace(/_/g, ' ')
    .trim();

  s = s.replace(/\s+/g, ' ');

  if (!s || s.match(/^[0-9]+$/)) return 'General Core';
  return s;
};

/** Get live user target exam from localStorage */
const getUserTargetExam = (): { examId: string; examName: string; subjects: string[] } => {
  try {
    const savedExamId = localStorage.getItem('oep_selected_exam') || localStorage.getItem('selectedExamId') || 'osssc-nursing-2026';
    const cleanId = savedExamId.toLowerCase();

    if (cleanId.includes('ossc') && !cleanId.includes('osssc')) {
      return { examId: savedExamId, examName: 'OSSC CGL Examination', subjects: EXAM_DEFAULT_SUBJECTS.ossc };
    }
    if (cleanId.includes('osssc') && !cleanId.includes('nursing')) {
      return { examId: savedExamId, examName: 'OSSSC Combined Recruitment', subjects: EXAM_DEFAULT_SUBJECTS.osssc };
    }
    if (cleanId.includes('opsc')) {
      return { examId: savedExamId, examName: 'OPSC Civil Services (OCS)', subjects: EXAM_DEFAULT_SUBJECTS.opsc };
    }
    if (cleanId.includes('police')) {
      return { examId: savedExamId, examName: 'Odisha Police Constable Exam', subjects: EXAM_DEFAULT_SUBJECTS.police };
    }
    if (cleanId.includes('bed')) {
      return { examId: savedExamId, examName: 'Odisha B.Ed Entrance Exam', subjects: EXAM_DEFAULT_SUBJECTS.bed };
    }
    return { examId: savedExamId, examName: 'OSSSC Nursing Officer Exam', subjects: EXAM_DEFAULT_SUBJECTS.nursing };
  } catch (e) {
    return { examId: 'osssc-nursing-2026', examName: 'OSSSC Nursing Officer Exam', subjects: EXAM_DEFAULT_SUBJECTS.nursing };
  }
};

/** Retrieve completed task IDs stored for today */
const getCompletedTaskIds = (): string[] => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(`${STORAGE_KEY_PLAN}_${todayStr}`);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/** Automatically mark task completed */
export const markTaskCompleted = (taskId: string): void => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const current = getCompletedTaskIds();
    if (!current.includes(taskId)) {
      const next = [...current, taskId];
      localStorage.setItem(`${STORAGE_KEY_PLAN}_${todayStr}`, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('oep-study-plan-updated'));
    }
  } catch (e) {
    // Fallback
  }
};

/** Toggle task completion status */
export const toggleTaskCompletion = (taskId: string): string[] => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const current = getCompletedTaskIds();
    const next = current.includes(taskId)
      ? current.filter(id => id !== taskId)
      : [...current, taskId];
    
    localStorage.setItem(`${STORAGE_KEY_PLAN}_${todayStr}`, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('oep-study-plan-updated'));
    return next;
  } catch (e) {
    return [];
  }
};

/** Hash helper for date-seeded daily task rotation */
const getSeededNumber = (seedStr: string, offset: number): number => {
  let hash = 0;
  const str = `${seedStr}-${offset}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

/** Dynamically compile Today's AI Study Plan using REAL student test performance & target exam syllabus */
export const getTodayStudyPlan = (userId?: string): DailyStudyPlan => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const weakTopicsData = getSmartWeakTopicRecommendations(userId);
    const streakState = getStreakState(userId);
    const completedIds = getCompletedTaskIds();
    const targetExam = getUserTargetExam();
    const isPersonalizedFromAttempts = weakTopicsData.hasAttempts && (weakTopicsData.allTopicConfidence?.length || 0) > 0;

    // Scan today's activities for automatic task completion
    const activities: UserActivity[] = activityTracker.getActivities(userId);
    const todayActivities = activities.filter(a => a.timestamp.startsWith(todayStr));
    const todayCompletedTests = todayActivities.filter(a => a.type === 'mock_test_completed' || a.type === 'practice_test_completed');
    const todaySolvedQuestions = todayActivities.reduce((sum, a) => {
      const correct = typeof a.correct === 'number' ? a.correct : (a.metadata?.correctCount || 0);
      const incorrect = typeof a.incorrect === 'number' ? a.incorrect : (a.metadata?.incorrectCount || 0);
      return sum + correct + incorrect;
    }, 0);

    let primaryWeak = '';
    let secondaryWeak = '';
    let tertiaryWeak = '';
    let primaryReason = '';
    let secondaryReason = '';
    let tertiaryReason = '';

    if (isPersonalizedFromAttempts && weakTopicsData.allTopicConfidence.length > 0) {
      // Real Data Personalization from student's actual test attempts
      const topics = weakTopicsData.allTopicConfidence;
      primaryWeak = cleanSubjectTitle(topics[0]?.topicName || targetExam.subjects[0]);
      primaryReason = `Based on your low ${topics[0]?.accuracy || 35}% accuracy in recent practice attempts`;

      secondaryWeak = cleanSubjectTitle(topics[1]?.topicName || targetExam.subjects[1]);
      secondaryReason = `Identified as a high-yield weakness from your test history (${topics[1]?.accuracy || 45}% accuracy)`;

      tertiaryWeak = cleanSubjectTitle(topics[2]?.topicName || targetExam.subjects[2]);
      tertiaryReason = `Recommended error review based on recent missed questions`;
    } else {
      // Date-seeded dynamic rotation for new students based on target exam syllabus
      const seed1 = getSeededNumber(todayStr, 1) % targetExam.subjects.length;
      const seed2 = (seed1 + 1 + (getSeededNumber(todayStr, 2) % (targetExam.subjects.length - 1))) % targetExam.subjects.length;
      const seed3 = (seed2 + 1) % targetExam.subjects.length;

      primaryWeak = cleanSubjectTitle(targetExam.subjects[seed1]);
      secondaryWeak = cleanSubjectTitle(targetExam.subjects[seed2]);
      tertiaryWeak = cleanSubjectTitle(targetExam.subjects[seed3]);

      primaryReason = `Daily priority topic for ${targetExam.examName} syllabus`;
      secondaryReason = `High-yield daily topic selected for score improvement`;
      tertiaryReason = `Daily conceptual revision & error analysis task`;
    }

    // Auto-complete logic based on real test completions
    const autoTask1Done = completedIds.includes('task-weak-1') || todayCompletedTests.some(a => (a.title || '').toLowerCase().includes(primaryWeak.toLowerCase()) || todayCompletedTests.length >= 1);
    const autoTask2Done = completedIds.includes('task-weak-2') || todayCompletedTests.some(a => (a.title || '').toLowerCase().includes(secondaryWeak.toLowerCase()) || todayCompletedTests.length >= 2);
    const autoTask3Done = completedIds.includes('task-review-errors') || todayCompletedTests.some(a => (a.title || '').toLowerCase().includes(tertiaryWeak.toLowerCase()) || todayCompletedTests.length >= 3);
    const autoTask4Done = streakState.todayGoalCompleted || completedIds.includes('task-daily-streak') || todaySolvedQuestions >= 20 || todayCompletedTests.length >= 1;

    const tasks: StudyPlanTask[] = [
      {
        id: `task-weak-1`,
        title: `Solve 15 practice questions in ${primaryWeak}`,
        subjectName: primaryWeak,
        questionCount: 15,
        estimatedMinutes: 15,
        priorityLabel: 'Priority 1 • High Impact',
        priorityBadgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        taskType: 'practice',
        completed: autoTask1Done,
        actionText: 'Start Practice',
        reasonText: primaryReason
      },
      {
        id: `task-weak-2`,
        title: `Solve 15 practice questions in ${secondaryWeak}`,
        subjectName: secondaryWeak,
        questionCount: 15,
        estimatedMinutes: 15,
        priorityLabel: 'Priority 2 • High Yield',
        priorityBadgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        taskType: 'practice',
        completed: autoTask2Done,
        actionText: 'Start Practice',
        reasonText: secondaryReason
      },
      {
        id: `task-review-errors`,
        title: `Review 10 recent incorrect questions & key rationales`,
        subjectName: tertiaryWeak,
        questionCount: 10,
        estimatedMinutes: 10,
        priorityLabel: 'Error Fix',
        priorityBadgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        taskType: 'review',
        completed: autoTask3Done,
        actionText: 'Review Errors',
        reasonText: tertiaryReason
      },
      {
        id: `task-daily-streak`,
        title: `Reach 20 total solved questions today to maintain streak`,
        subjectName: primaryWeak,
        questionCount: 20,
        estimatedMinutes: 15,
        priorityLabel: 'Daily Target',
        priorityBadgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        taskType: 'streak_goal',
        completed: autoTask4Done,
        actionText: 'Complete Goal',
        reasonText: `Maintain your active ${streakState.currentStreak || 1}-day practice streak 🔥`
      }
    ];

    const uncompletedTasks = tasks.filter(t => !t.completed);
    const completedCount = tasks.filter(t => t.completed).length;
    const totalCount = tasks.length;
    const progressPercentage = Math.round((completedCount / totalCount) * 100);
    const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
    const remainingMinutes = uncompletedTasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

    // Dynamic Score Gain Potential based on real accuracy gap
    const lowestAccuracy = isPersonalizedFromAttempts ? (weakTopicsData.allTopicConfidence[0]?.accuracy || 35) : 35;
    const accuracyGap = 100 - lowestAccuracy;
    const potentialBoostPct = Math.min(15, Math.max(4, Math.round(accuracyGap * 0.12)));
    const achievedBoostPct = Math.round((completedCount / totalCount) * potentialBoostPct);

    const expectedScoreBoost = completedCount === totalCount
      ? `+${potentialBoostPct}% Mastered! 🎉`
      : completedCount > 0
      ? `+${potentialBoostPct}% Gain (${achievedBoostPct}% Done)`
      : `+${potentialBoostPct}% Score Gain`;

    return {
      totalMinutes,
      remainingMinutes,
      expectedScoreBoost,
      completedCount,
      totalCount,
      progressPercentage,
      tasks,
      lastGeneratedTime: 'Updated Today at 00:00 AM',
      isPersonalizedFromAttempts,
      targetExamName: targetExam.examName
    };
  } catch (e) {
    return {
      totalMinutes: 55,
      remainingMinutes: 55,
      expectedScoreBoost: '+8% Score Gain',
      completedCount: 0,
      totalCount: 4,
      progressPercentage: 0,
      tasks: [],
      lastGeneratedTime: 'Updated Today',
      isPersonalizedFromAttempts: false,
      targetExamName: 'Odisha Competitive Exams'
    };
  }
};
