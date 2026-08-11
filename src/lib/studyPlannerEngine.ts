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
  hasContent?: boolean;
  noContentReason?: 'coming_soon' | 'no_question_bank' | 'no_mock_tests';
}

const STORAGE_KEY_PLAN = 'oep_ai_study_plan_completed_tasks_v2';

/** Default exam syllabus subjects mapped for accurate fallback per target exam */
const EXAM_DEFAULT_SUBJECTS: Record<string, string[]> = {
  'nursing': ['Fundamentals of Nursing - I', 'Community Health Nursing - II', 'Medical Surgical Nursing - I', 'Microbiology & Pathology'],
  'ctsre': ['Technical Core Paper', 'General Awareness & Odisha GK', 'Reasoning & Mental Ability', 'Computer & IT Literacy'],
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

/** Get live user target exam from localStorage or parameters */
const getUserTargetExam = (examIdInput?: string, examNameInput?: string): { examId: string; examName: string; subjects: string[] } => {
  try {
    const savedExamId = examIdInput || localStorage.getItem('oep_active_exam_id') || localStorage.getItem('oep_selected_exam') || localStorage.getItem('selectedExamId') || '';
    const savedExamName = examNameInput || localStorage.getItem('oep_active_exam_name') || sessionStorage.getItem('oep_selectedExamName') || '';

    const cleanText = `${savedExamId} ${savedExamName} ${examIdInput || ''} ${examNameInput || ''}`.toLowerCase();

    if (cleanText.includes('nursing') || cleanText.includes('anm') || cleanText.includes('gnm') || cleanText.includes('health')) {
      return { examId: savedExamId || 'osssc-nursing-officer', examName: savedExamName || 'OSSSC Nursing Officer Exam', subjects: EXAM_DEFAULT_SUBJECTS.nursing };
    }
    if (cleanText.includes('ctsre') || cleanText.includes('cts') || cleanText.includes('technical')) {
      return { examId: savedExamId || 'ossc-ctsre', examName: savedExamName || 'OSSC CTSRE Examination', subjects: EXAM_DEFAULT_SUBJECTS.ctsre };
    }
    if (cleanText.includes('ossc') && !cleanText.includes('osssc')) {
      return { examId: savedExamId || 'ossc-cgl', examName: savedExamName || 'OSSC CGL Examination', subjects: EXAM_DEFAULT_SUBJECTS.ossc };
    }
    if (cleanText.includes('osssc') && !cleanText.includes('nursing')) {
      return { examId: savedExamId || 'osssc-combined', examName: savedExamName || 'OSSSC Combined Recruitment', subjects: EXAM_DEFAULT_SUBJECTS.osssc };
    }
    if (cleanText.includes('opsc') || cleanText.includes('ocs') || cleanText.includes('civil')) {
      return { examId: savedExamId || 'opsc-ocs', examName: savedExamName || 'OPSC Civil Services (OCS)', subjects: EXAM_DEFAULT_SUBJECTS.opsc };
    }
    if (cleanText.includes('police') || cleanText.includes('constable') || cleanText.includes('si')) {
      return { examId: savedExamId || 'odisha-police', examName: savedExamName || 'Odisha Police Constable Exam', subjects: EXAM_DEFAULT_SUBJECTS.police };
    }
    if (cleanText.includes('bed') || cleanText.includes('teaching') || cleanText.includes('tet')) {
      return { examId: savedExamId || 'odisha-bed', examName: savedExamName || 'Odisha B.Ed Entrance Exam', subjects: EXAM_DEFAULT_SUBJECTS.bed };
    }
    return {
      examId: savedExamId || 'general-exam',
      examName: savedExamName || 'General Competitive Exam',
      subjects: ['General Awareness & Odisha GK', 'Reasoning & Mental Ability', 'Quantitative Aptitude', 'English Language & Grammar', 'Computer Literacy']
    };
  } catch (e) {
    return {
      examId: 'general-exam',
      examName: 'General Competitive Exam',
      subjects: ['General Awareness & Odisha GK', 'Reasoning & Mental Ability', 'Quantitative Aptitude', 'English Language & Grammar', 'Computer Literacy']
    };
  }
};

/** Retrieve completed task IDs stored for today */
const getCompletedTaskIds = (examId?: string): string[] => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = examId && examId !== 'all' ? `${STORAGE_KEY_PLAN}_${examId.toLowerCase().replace(/[\s\-_]+/g, '')}_${todayStr}` : `${STORAGE_KEY_PLAN}_${todayStr}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

/** Automatically mark task completed */
export const markTaskCompleted = (taskId: string, examId?: string): void => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = examId && examId !== 'all' ? `${STORAGE_KEY_PLAN}_${examId.toLowerCase().replace(/[\s\-_]+/g, '')}_${todayStr}` : `${STORAGE_KEY_PLAN}_${todayStr}`;
    const current = getCompletedTaskIds(examId);
    if (!current.includes(taskId)) {
      const next = [...current, taskId];
      localStorage.setItem(key, JSON.stringify(next));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('oep-study-plan-updated'));
      }
    }
  } catch (e) {
    // Fallback
  }
};

/** Toggle task completion status */
export const toggleTaskCompletion = (taskId: string, examId?: string): string[] => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = examId && examId !== 'all' ? `${STORAGE_KEY_PLAN}_${examId.toLowerCase().replace(/[\s\-_]+/g, '')}_${todayStr}` : `${STORAGE_KEY_PLAN}_${todayStr}`;
    const current = getCompletedTaskIds(examId);
    const next = current.includes(taskId)
      ? current.filter(id => id !== taskId)
      : [...current, taskId];
    
    localStorage.setItem(key, JSON.stringify(next));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('oep-study-plan-updated'));
    }
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
export const getTodayStudyPlan = (userId?: string, activeExamIdInput?: string, activeExamNameInput?: string): DailyStudyPlan => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const targetExam = getUserTargetExam(activeExamIdInput, activeExamNameInput);
    const weakTopicsData = getSmartWeakTopicRecommendations(userId, targetExam.examId, targetExam.examName);
    const streakState = getStreakState(userId);
    const completedIds = getCompletedTaskIds(targetExam.examId);
    const isPersonalizedFromAttempts = weakTopicsData.hasAttempts && (weakTopicsData.allTopicConfidence?.length || 0) > 0;

    // ── Content availability check ─────────────────────────────────────────
    // Exams with confirmed zero question-banks AND zero test-series in Supabase.
    // Key: Supabase exam UUID  Value: human-readable reason for empty state
    const CONFIRMED_NO_CONTENT_EXAM_IDS: Record<string, 'coming_soon'> = {
      '3bdefd17-112b-426d-ab60-6ca6957fbe0e': 'coming_soon', // OSSC (CGL)
      '413d1646-d683-40fb-8083-d165e7fa49ec': 'coming_soon', // OSSC CTSRE
      'f6efc518-82b0-4a6b-b957-cec4a1fd0969': 'coming_soon', // OPSC Assistant Industries Officer 2026
    };

    // Also catch by ID slug patterns for local / dev environments
    const noContentBySlug = ['aiims-norcet', 'osssc-anm', 'ossc-chsle', 'ssc-cgl-national', 'opsc-aso', 'odisha-police-si', 'otet-exam'];

    const noContentReason: DailyStudyPlan['noContentReason'] =
      CONFIRMED_NO_CONTENT_EXAM_IDS[targetExam.examId] ||
      (noContentBySlug.includes(targetExam.examId.toLowerCase()) ? 'coming_soon' : undefined);

    const isUnreleasedExam = !!noContentReason;
    const hasContent = !isUnreleasedExam && (targetExam.examId === 'all' || isPersonalizedFromAttempts || targetExam.subjects.length > 0);

    if (!hasContent) {
      return {
        totalMinutes: 0,
        remainingMinutes: 0,
        expectedScoreBoost: '+0%',
        completedCount: 0,
        totalCount: 0,
        progressPercentage: 0,
        tasks: [],
        lastGeneratedTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        isPersonalizedFromAttempts: false,
        targetExamName: targetExam.examName,
        hasContent: false,
        noContentReason
      };
    }

    // Scan today's activities for automatic task completion for target exam
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
      // Real Data Personalization from student's actual test attempts in this target exam
      const topics = weakTopicsData.allTopicConfidence;
      primaryWeak = cleanSubjectTitle(topics[0]?.topicName || targetExam.subjects[0]);
      primaryReason = `Based on your low ${topics[0]?.accuracy || 35}% accuracy in recent practice attempts`;

      secondaryWeak = cleanSubjectTitle(topics[1]?.topicName || targetExam.subjects[1] || targetExam.subjects[0]);
      secondaryReason = `Identified as a high-yield weakness from your test history (${topics[1]?.accuracy || 45}% accuracy)`;

      tertiaryWeak = cleanSubjectTitle(topics[2]?.topicName || targetExam.subjects[2] || targetExam.subjects[0]);
      tertiaryReason = `Recommended error review based on recent missed questions`;
    } else {
      // Date-seeded dynamic rotation for target exam syllabus
      const seed1 = getSeededNumber(todayStr, 1) % targetExam.subjects.length;
      const seed2 = (seed1 + 1 + (getSeededNumber(todayStr, 2) % Math.max(1, targetExam.subjects.length - 1))) % targetExam.subjects.length;
      const seed3 = (seed2 + 1) % targetExam.subjects.length;

      primaryWeak = cleanSubjectTitle(targetExam.subjects[seed1]);
      secondaryWeak = cleanSubjectTitle(targetExam.subjects[seed2]);
      tertiaryWeak = cleanSubjectTitle(targetExam.subjects[seed3]);

      primaryReason = `Today's priority topic for ${targetExam.examName} syllabus — start here for maximum score gain`;
      secondaryReason = `High-yield daily topic for ${targetExam.examName} — commonly tested in past papers`;
      tertiaryReason = `Daily conceptual revision & error analysis for ${targetExam.examName}`;
    }

    // Auto-complete logic based on real test completions
    const autoTask1Done = completedIds.includes('task-weak-1') || todayCompletedTests.some(a => (a.title || '').toLowerCase().includes(primaryWeak.toLowerCase()));
    const autoTask2Done = completedIds.includes('task-weak-2') || todayCompletedTests.some(a => (a.title || '').toLowerCase().includes(secondaryWeak.toLowerCase()));
    const autoTask3Done = completedIds.includes('task-review-errors') || todayCompletedTests.some(a => (a.title || '').toLowerCase().includes(tertiaryWeak.toLowerCase()));
    const autoTask4Done = streakState.todayGoalCompleted || completedIds.includes('task-daily-streak') || todaySolvedQuestions >= 20;

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
      lastGeneratedTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
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
