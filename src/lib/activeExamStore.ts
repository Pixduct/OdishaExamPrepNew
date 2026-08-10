import { useState, useEffect } from 'react';

export interface ActiveExamContext {
  activeExamId: string;
  activeExamName: string;
  enrolledExamIds: string[];
}

export interface CategorizedExams {
  categoryName: string;
  categoryIcon?: string;
  exams: {
    id: string;
    name: string;
    category: string;
    questionCount?: number;
    readinessScore?: number;
    isEnrolled?: boolean;
  }[];
}

const STORAGE_KEY = 'oep_active_exam_context_v1';

export const DEFAULT_EXAM_CATEGORIES: CategorizedExams[] = [
  {
    categoryName: 'Nursing & Healthcare',
    categoryIcon: '🏥',
    exams: [
      { id: 'osssc-nursing-officer', name: 'OSSSC Nursing Officer Exam', category: 'Nursing & Healthcare', readinessScore: 78, isEnrolled: true },
      { id: 'aiims-norcet', name: 'AIIMS NORCET Examination', category: 'Nursing & Healthcare', readinessScore: 65, isEnrolled: true },
      { id: 'osssc-anm', name: 'OSSSC ANM Recruitment', category: 'Nursing & Healthcare', readinessScore: 40 }
    ]
  },
  {
    categoryName: 'SSC & OSSC Exams',
    categoryIcon: '🏛️',
    exams: [
      { id: 'ossc-cgl', name: 'OSSC CGL Examination', category: 'SSC & OSSC Exams', readinessScore: 82, isEnrolled: true },
      { id: 'osssc-combined', name: 'OSSSC Combined Recruitment', category: 'SSC & OSSC Exams', readinessScore: 70, isEnrolled: true },
      { id: 'ossc-chsle', name: 'OSSC CHSLE (10+2) Exam', category: 'SSC & OSSC Exams', readinessScore: 55 },
      { id: 'ssc-cgl-national', name: 'SSC CGL Tier I & II', category: 'SSC & OSSC Exams', readinessScore: 60 }
    ]
  },
  {
    categoryName: 'Civil Services & State Services',
    categoryIcon: '⚖️',
    exams: [
      { id: 'opsc-ocs', name: 'OPSC Civil Services (OCS)', category: 'Civil Services & State Services', readinessScore: 60, isEnrolled: true },
      { id: 'opsc-aso', name: 'OPSC ASO Examination', category: 'Civil Services & State Services', readinessScore: 75 }
    ]
  },
  {
    categoryName: 'Police & Defence',
    categoryIcon: '🛡️',
    exams: [
      { id: 'odisha-police-constable', name: 'Odisha Police Constable Exam', category: 'Police & Defence', readinessScore: 85 },
      { id: 'odisha-police-si', name: 'Odisha Police Sub-Inspector', category: 'Police & Defence', readinessScore: 50 }
    ]
  },
  {
    categoryName: 'Teaching & B.Ed',
    categoryIcon: '🎓',
    exams: [
      { id: 'odisha-bed', name: 'Odisha B.Ed Entrance Exam', category: 'Teaching & B.Ed', readinessScore: 70 },
      { id: 'otet-exam', name: 'OTET / OSSTET Teacher Exam', category: 'Teaching & B.Ed', readinessScore: 62 }
    ]
  }
];

export const getActiveExamContext = (): ActiveExamContext => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.activeExamId === 'string') {
        return {
          activeExamId: parsed.activeExamId,
          activeExamName: parsed.activeExamName || 'All Exams Combined',
          enrolledExamIds: Array.isArray(parsed.enrolledExamIds) ? parsed.enrolledExamIds : ['osssc-nursing-officer', 'ossc-cgl']
        };
      }
    }
  } catch (e) {
    console.error("Failed to parse activeExamContext from localStorage:", e);
  }

  // Fallback check legacy oep_selectedExam
  const legacyId = localStorage.getItem('oep_selected_exam') || sessionStorage.getItem('oep_selectedExam') || 'all';
  const legacyName = sessionStorage.getItem('oep_selectedExamName') || (legacyId === 'all' ? 'All Exams Combined' : legacyId);

  return {
    activeExamId: legacyId,
    activeExamName: legacyName,
    enrolledExamIds: ['osssc-nursing-officer', 'ossc-cgl', 'opsc-ocs']
  };
};

export const setActiveExamContext = (examId: string, examName?: string): ActiveExamContext => {
  const current = getActiveExamContext();
  
  let resolvedName = examName;
  if (!resolvedName) {
    if (examId === 'all') {
      resolvedName = 'All Exams Combined';
    } else {
      // Find name in default categories
      for (const cat of DEFAULT_EXAM_CATEGORIES) {
        const found = cat.exams.find(e => e.id === examId);
        if (found) {
          resolvedName = found.name;
          break;
        }
      }
      if (!resolvedName) resolvedName = examId.toUpperCase();
    }
  }

  const updated: ActiveExamContext = {
    ...current,
    activeExamId: examId,
    activeExamName: resolvedName
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem('oep_active_exam_id', examId);
    localStorage.setItem('oep_active_exam_name', resolvedName);
    sessionStorage.setItem('oep_selectedExam', examId === 'all' ? '' : examId);
    sessionStorage.setItem('oep_selectedExamName', resolvedName);
  } catch (e) {
    console.error("Failed to save activeExamContext:", e);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('oep-active-exam-changed', { detail: updated }));
  }
  return updated;
};

export const useActiveExamContext = (): [ActiveExamContext, (id: string, name?: string) => void] => {
  const [context, setContext] = useState<ActiveExamContext>(getActiveExamContext);

  useEffect(() => {
    const handleChanged = (e: Event) => {
      const customEv = e as CustomEvent<ActiveExamContext>;
      if (customEv.detail) {
        setContext(customEv.detail);
      } else {
        setContext(getActiveExamContext());
      }
    };

    window.addEventListener('oep-active-exam-changed', handleChanged);
    window.addEventListener('storage', handleChanged);

    return () => {
      window.removeEventListener('oep-active-exam-changed', handleChanged);
      window.removeEventListener('storage', handleChanged);
    };
  }, []);

  const changeExam = (id: string, name?: string) => {
    const next = setActiveExamContext(id, name);
    setContext(next);
  };

  return [context, changeExam];
};
