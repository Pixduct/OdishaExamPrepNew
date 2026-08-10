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

export const DEFAULT_EXAM_CATEGORIES: CategorizedExams[] = [];

/** Build dynamic categories strictly from live database exams */
export const buildCategorizedExamsFromDb = (dbExams: any[] = []): CategorizedExams[] => {
  if (!Array.isArray(dbExams) || dbExams.length === 0) return [];

  const categoryMap = new Map<string, CategorizedExams>();

  // Filter out system and blog categories
  const validExams = dbExams.filter(e => e.category !== 'blog' && e.category !== 'system' && !(e.name || '').startsWith('SYSTEM_SETTINGS_'));

  validExams.forEach(exam => {
    const rawCategory = exam.category || 'General Competitive Exams';
    const cleanCategoryName = (() => {
      const lower = rawCategory.toLowerCase();
      if (lower.includes('nursing') || lower.includes('health') || lower.includes('medical')) return 'Nursing & Healthcare';
      if (lower.includes('ossc') || lower.includes('ssc')) return 'SSC & OSSC Exams';
      if (lower.includes('civil') || lower.includes('opsc') || lower.includes('ias') || lower.includes('ocs')) return 'Civil Services & State Services';
      if (lower.includes('police') || lower.includes('defence') || lower.includes('constable')) return 'Police & Defence';
      if (lower.includes('teach') || lower.includes('bed') || lower.includes('tet')) return 'Teaching & Education';
      if (lower === 'upcoming') return 'Upcoming Recruitment Exams';
      if (lower === 'popular') return 'Popular Target Exams';
      return rawCategory.charAt(0).toUpperCase() + rawCategory.slice(1);
    })();

    const categoryIcon = (() => {
      if (cleanCategoryName.includes('Nursing')) return '🏥';
      if (cleanCategoryName.includes('SSC')) return '🏛️';
      if (cleanCategoryName.includes('Civil')) return '⚖️';
      if (cleanCategoryName.includes('Police')) return '🛡️';
      if (cleanCategoryName.includes('Teaching')) return '🎓';
      return '📚';
    })();

    const examItem = {
      id: exam.id,
      name: exam.name || 'Exam',
      category: cleanCategoryName,
      questionCount: exam.questions || exam.questionCount || 0,
      readinessScore: 70
    };

    if (!categoryMap.has(cleanCategoryName)) {
      categoryMap.set(cleanCategoryName, {
        categoryName: cleanCategoryName,
        categoryIcon,
        exams: [examItem]
      });
    } else {
      const cat = categoryMap.get(cleanCategoryName)!;
      if (!cat.exams.some(e => e.id === examItem.id)) {
        cat.exams.push(examItem);
      }
    }
  });

  return Array.from(categoryMap.values());
};

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
