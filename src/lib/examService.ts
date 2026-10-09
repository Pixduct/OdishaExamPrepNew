import { supabase } from './supabase';
import { cacheService } from './cacheService';
import type { Flashcard, FlashcardDeck, UserCardProgress } from './srsEngine';

const inFlightPromises = new Map<string, Promise<any>>();

export function fetchWithInFlightDeduplication<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const cached = cacheService.get<T>(key);
  if (cached) return Promise.resolve(cached);

  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .then((result) => {
      cacheService.set(key, result);
      return result;
    })
    .finally(() => {
      inFlightPromises.delete(key);
    });

  inFlightPromises.set(key, promise);
  return promise;
}

// Private: clears all cache data layers WITHOUT dispatching the event.
// Use this inside service methods after a DB write to ensure a clean slate
// before the event-bearing clearCatalogCache() fires from the UI layer.
function clearCacheData(): void {
  inFlightPromises.clear();
  cacheService.clear();
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.removeItem('oep_admin_catalog_cache_v2');
      sessionStorage.removeItem('oep_admin_catalog_cache');
      sessionStorage.removeItem('oep_cached_exams');
      sessionStorage.removeItem('oep_cached_testSeries');
      sessionStorage.removeItem('oep_cached_mockTests');
      sessionStorage.removeItem('oep_cached_dynamicQuestionBanks');
      sessionStorage.removeItem('oep_cached_loadedForUserId');
    } catch (e) {}
  }
}

// Public: clears all cache data layers AND dispatches the catalog-updated
// event so App.tsx re-fetches immediately. Call this ONCE, from the UI layer,
// after the DB write is confirmed — never before.
export function clearCatalogCache(): void {
  clearCacheData();
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new Event('oep_catalog_updated'));
    } catch (e) {}
  }
}

let schemaHasDiagram: boolean | null = null;

async function checkSchemaHasDiagram(): Promise<boolean> {
  if (schemaHasDiagram !== null) return schemaHasDiagram;
  try {
    const { error } = await supabase
      .from('questions')
      .select('diagram')
      .limit(1);
    schemaHasDiagram = !error;
  } catch (e) {
    schemaHasDiagram = false;
  }
  return schemaHasDiagram;
}

async function callAdminDbProxy(table: string, action: 'insert' | 'update' | 'delete' | 'upsert', payload?: any, id?: string, filters?: any, onConflict?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Admin authorization token is missing. Please log in again.");
  }

  const res = await fetch(`/api/admin/db/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ action, payload, id, filters, onConflict })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Failed to perform ${action} on ${table}`);
  }
  return data.data;
}

async function callCascadeDelete(entityType: 'questionBank' | 'mockTest' | 'testSeries' | 'question', entityId: string, clearOnly = false) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error("Admin authorization token is missing. Please log in again.");
  }

  const res = await fetch(`/api/admin/cascade-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ entityType, entityId, clearOnly })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Cascade delete failed for ${entityType}`);
  }
  return data;
}

// --- Topic Count Helper ---
async function fetchTopicCounts(topics: string[]): Promise<Record<string, number>> {
  const validTopics = (topics || []).filter(Boolean);
  if (validTopics.length === 0) return new Proxy({}, { get: () => 0 });

  const sortedKey = [...validTopics].sort().join('|');
  const cacheKey = `topic_counts_${sortedKey}`;
  const cachedData = cacheService.get<{ countMap: Record<string, number>; normMap: Record<string, number> }>(cacheKey);

  let countMap: Record<string, number> = {};
  let normMap: Record<string, number> = {};

  if (cachedData) {
    countMap = cachedData.countMap;
    normMap = cachedData.normMap;
  } else {
    const chunkSize = 50;
    for (let i = 0; i < validTopics.length; i += chunkSize) {
      const chunk = validTopics.slice(i, i + chunkSize);
      const pageSize = 1000;
      let page = 0;
      let keepFetching = true;

      while (keepFetching) {
        try {
          const { data, error } = await supabase
            .from('questions')
            .select('topic')
            .in('topic', chunk)
            .range(page * pageSize, (page + 1) * pageSize - 1);

          if (error || !data || data.length === 0) {
            keepFetching = false;
          } else {
            data.forEach(q => {
              if (q.topic) {
                const exact = q.topic;
                countMap[exact] = (countMap[exact] || 0) + 1;
                const norm = q.topic.toLowerCase().trim();
                normMap[norm] = (normMap[norm] || 0) + 1;
              }
            });
            if (data.length < pageSize) {
              keepFetching = false;
            } else {
              page++;
            }
          }
        } catch (err) {
          console.error("Error fetching topic counts chunk:", err);
          keepFetching = false;
        }
      }
    }
    cacheService.set(cacheKey, { countMap, normMap });
  }

  return new Proxy(countMap, {
    get(target, prop: string) {
      if (typeof prop === 'string') {
        if (prop in target) return target[prop];
        const norm = prop.toLowerCase().trim();
        if (norm in normMap) return normMap[norm];
      }
      return 0;
    }
  });
}

// --- Types ---

export interface Question {
  id?: string;
  examId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  diagram?: any;
  explanationDiagram?: any;
  sortOrder?: number;
  createdAt?: string;
}

export interface TestSeries {
  id?: string;
  examId: string;
  title: string;
  description: string;
  price: number;
  durationDays: number;
  testIds: string[];
  sortOrder?: number;
  createdAt?: string;
  is_archived?: boolean;
}

export const EXAM_STAGES = [
  'Prelims',
  'Mains',
  'Tier 1',
  'Tier 2',
  'Tier 3',
  'CBT 1',
  'CBT 2',
  'Paper 1',
  'Paper 2',
  'Screening Test',
  'Written Examination',
  'Single Stage'
] as const;

export type ExamStage = typeof EXAM_STAGES[number];

export const EXAM_STREAM_PRESETS = [
  // Engineering & Technical
  'Civil Engineering',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Computer Science & IT',
  'Electronics & Telecommunication',
  'Chemical Engineering',
  'Automobile Engineering',
  'Mining Engineering',
  // Medical & Paramedical
  'Nursing / GNM',
  'Pharmacy',
  'Medical Laboratory Technology (MLT)',
  'Radiography',
  // Agriculture & Allied
  'Agriculture',
  'Horticulture',
  'Fisheries Science',
  'Forestry',
  'Veterinary & Animal Husbandry',
  // Academic & Lecturer Disciplines
  'Physics',
  'Chemistry',
  'Mathematics',
  'Botany',
  'Zoology',
  'History',
  'Political Science',
  'Odia Literature',
  'English Literature',
  'Commerce & Management',
  'Economics'
] as const;

export type ExamStreamPreset = typeof EXAM_STREAM_PRESETS[number];

export interface ExamPricingConfig {
  starterTestCount?: number;
  starterSectionalCount?: number;
  starterBankCount?: number;
  starterPrice?: number;
  starterOriginalPrice?: number;
  fullPrice?: number;
  fullOriginalPrice?: number;
  superPrice?: number;
  superOriginalPrice?: number;
}

export interface MockTest {
  id?: string;
  seriesId: string;
  title: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking?: number;
  questions?: Question[];
  sortOrder?: number;
  createdAt?: string;
  is_archived?: boolean;
  scheduled_at?: string | null;
  examId?: string;
  category?: string;
  mockCategory?: string;
  mockSubject?: string;
  stage?: string;
  stream?: string;
  _questionCount?: number;
  questionCount?: number;
}

export interface Exam {
  id?: string;
  name: string;
  description: string;
  icon: string;
  category: 'popular' | 'upcoming' | 'blog' | 'system' | 'current_affairs';
  examDate?: string;
  targetExamId?: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string;
  sortOrder?: number;
  createdAt?: string;
  is_archived?: boolean;
  isPremium?: boolean;
  price?: number;
  originalPrice?: number;
  pricingConfig?: ExamPricingConfig;
  stages?: string[];
  streams?: string[];
}

export interface ExamSyllabus {
  id?: string;
  exam_id: string;
  stage: string;
  stream?: string;
  syllabus_markdown: string;
  directives_markdown?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Universal Dual-Axis Visibility Predicate (Stage x Stream)
 * Evaluates whether a mock test, question bank, or deck should be displayed
 * given the user's active stage and active stream selections.
 */
export function isContentVisibleForStageAndStream(
  item: { stage?: string; stream?: string },
  activeStage?: string,
  activeStream?: string
): boolean {
  // 1. Stage Scoping
  if (activeStage && activeStage !== 'All Stages' && item.stage && item.stage !== 'All Stages') {
    if (item.stage.toLowerCase() !== activeStage.toLowerCase()) {
      return false;
    }
  }

  // 2. Stream Scoping
  if (activeStream && activeStream !== 'All Streams' && activeStream.toLowerCase() !== 'common') {
    if (item.stream && item.stream !== 'All Streams' && item.stream.toLowerCase() !== 'common') {
      if (item.stream.toLowerCase() !== activeStream.toLowerCase()) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Authoritative predicate to determine if a record represents an authentic academic competitive examination
 * (e.g. OPSC, OSSC, OSSSC) rather than an editorial article, daily current affairs digest, or system configuration object.
 */
export function isAuthenticExam(item: any): boolean {
  if (!item || item.is_archived) return false;
  const cat = (item.category || '').toLowerCase().trim();
  const name = (item.name || '').trim();
  if (
    cat === 'current_affairs' ||
    cat === 'current-affairs' ||
    cat === 'blog' ||
    cat === 'system' ||
    name.startsWith('SYSTEM_SETTINGS_') ||
    name.startsWith('SYSTEM_') ||
    name.startsWith('http://') ||
    name.startsWith('https://')
  ) {
    return false;
  }
  return true;
}

export interface QuestionBank {
  id?: string;
  examId: string;
  type: string; // 'topic-wise', 'exam-focused', 'revision-sets', 'pyq-collections'
  title: string;
  questionCount: number;
  practiceQuestionCount?: number;
  tagline: string;
  image: string;
  isPremium: boolean;
  pdfUrl?: string;
  hasPracticeMode?: boolean;
  target_mode?: 'bank' | 'practice' | 'both';
  sortOrder?: number;
  createdAt?: string;
  is_archived?: boolean;
  scheduled_at?: string | null;
  stage?: string;
  stream?: string;
}

/**
 * Universal Hierarchical Access Evaluator for Mock Tests
 * Tier 0 (Free): Test #1 or non-premium
 * Tier 1 (Starter Booster): First N tests for this exam
 * Tier 2 (Full Exam Pass): All tests for this exam
 * Tier 3 (All-Access Mega Pass): Full platform unlock
 */
export function evaluateTestAccess(
  user: any,
  test: any,
  exam?: any,
  userPurchases: string[] = []
): { hasAccess: boolean; reason: 'free' | 'all-access' | 'exam-pass' | 'starter-booster' | 'single' | 'locked' } {
  // 1. Is this Test #1 or explicitly marked non-premium?
  if (test.sortOrder === 1 || !test.isPremium) {
    return { hasAccess: true, reason: 'free' };
  }

  // Combine user metadata purchases and userPurchases array
  const metaPurchases: string[] = user?.user_metadata?.purchases || [];
  const activePasses: string[] = user?.user_metadata?.activePasses || [];
  const allPurchases = Array.from(new Set([...userPurchases, ...metaPurchases]));

  // 2. All-Access Mega Pass (Tier 3)
  if (
    activePasses.includes('all-access') || 
    allPurchases.includes('all-access') || 
    allPurchases.includes('all-access-pass') || 
    allPurchases.includes('mega_pass')
  ) {
    return { hasAccess: true, reason: 'all-access' };
  }

  // 3. Full Exam Pass (Tier 2)
  let examId = test.examId;
  if (!examId && typeof test.seriesId === 'string' && test.seriesId.startsWith('{')) {
    try {
      const parsed = JSON.parse(test.seriesId);
      examId = parsed.examId;
    } catch (e) {}
  }

  if (examId) {
    if (
      allPurchases.includes(`exam-pass_${examId}`) ||
      allPurchases.includes(`exam_bundle_${examId}`) ||
      allPurchases.includes(`exam_${examId}`) ||
      activePasses.includes(`exam_${examId}`)
    ) {
      return { hasAccess: true, reason: 'exam-pass' };
    }
  }

  // 4. Starter Booster (Tier 1)
  if (examId && (allPurchases.includes(`starter-booster_${examId}`) || allPurchases.includes(`starter_${examId}`))) {
    let starterLimit = 5;
    if (exam && exam.description && typeof exam.description === 'string' && exam.description.startsWith('JSON_METADATA_')) {
      try {
        const meta = JSON.parse(exam.description.replace('JSON_METADATA_', ''));
        if (meta.starterTestCount) starterLimit = Number(meta.starterTestCount);
      } catch (e) {}
    } else if (exam?.pricingConfig?.starterTestCount) {
      starterLimit = Number(exam.pricingConfig.starterTestCount);
    }
    const testIndex = typeof test.sortOrder === 'number' ? test.sortOrder : 1;
    if (testIndex <= starterLimit) {
      return { hasAccess: true, reason: 'starter-booster' };
    }
  }

  // 5. Single Test Purchase
  if (allPurchases.includes(`mockTest__${test.id}`) || allPurchases.includes(test.id)) {
    return { hasAccess: true, reason: 'single' };
  }

  return { hasAccess: false, reason: 'locked' };
}

/**
 * Universal Access Evaluator for Question Banks
 */
export function evaluateBankAccess(
  user: any,
  bank: any,
  _exam?: any,
  userPurchases: string[] = []
): { hasAccess: boolean; reason: 'free' | 'all-access' | 'exam-pass' | 'single' | 'locked' } {
  if (!bank.isPremium) {
    return { hasAccess: true, reason: 'free' };
  }

  const metaPurchases: string[] = user?.user_metadata?.purchases || [];
  const activePasses: string[] = user?.user_metadata?.activePasses || [];
  const allPurchases = Array.from(new Set([...userPurchases, ...metaPurchases]));

  if (
    activePasses.includes('all-access') || 
    allPurchases.includes('all-access') || 
    allPurchases.includes('all-access-pass') || 
    allPurchases.includes('mega_pass')
  ) {
    return { hasAccess: true, reason: 'all-access' };
  }

  const examId = bank.examId;
  if (examId) {
    if (
      allPurchases.includes(`exam-pass_${examId}`) ||
      allPurchases.includes(`exam_bundle_${examId}`) ||
      allPurchases.includes(`exam_${examId}`) ||
      activePasses.includes(`exam_${examId}`)
    ) {
      return { hasAccess: true, reason: 'exam-pass' };
    }
  }

  if (allPurchases.includes(bank.id) || allPurchases.includes(`bank_${bank.id}`)) {
    return { hasAccess: true, reason: 'single' };
  }

  return { hasAccess: false, reason: 'locked' };
}

// --- Services ---

export const examService = {
  // Questions
  async addQuestion(question: Question) {
    const hasDiagramCol = await checkSchemaHasDiagram();
    const payload: any = {
      examId: question.examId,
      topic: question.topic,
      difficulty: question.difficulty,
      questionText: question.questionText,
      options: question.options,
      correctAnswerIndex: question.correctAnswerIndex,
      explanation: question.explanation
    };
    if (question.diagram && hasDiagramCol) {
      payload.diagram = question.diagram;
    }
    console.log("Single Add Payload:", payload);
    const data = await callAdminDbProxy('questions', 'insert', payload);
    return data?.[0] || data;
  },

  async addQuestionsBulk(questions: Question[]) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("Admin authorization token is missing. Please log in again.");
    }

    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');

    const res = await fetch('/api/admin/questions/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ questions })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to bulk upload questions');
    }

    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    return data.data;
  },

  async getQuestionsPaginated(page = 1, limit = 50, search = '', examId = 'all', questionFilter = 'all', topic = 'all', signal?: AbortSignal) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("Admin authorization token is missing. Please log in again.");
    }

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search,
      examId,
      questionFilter,
      topic
    });

    const res = await fetch(`/api/admin/questions?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      signal // Pass the AbortSignal so the request can be cancelled
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch paginated questions');
    }
    return data;
  },


  async getAllQuestions() {
    const { data, error } = await supabase
      .from('questions')
      .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
      .order('sortOrder', { ascending: true })
      .limit(500);
    if (error) throw error;
    return data as Question[];
  },

  async deleteQuestion(id: string) {
    cacheService.clear('topic_counts');
    cacheService.clear('all_question_banks');
    cacheService.clear('all_mock_tests_lite');
    const result = await callCascadeDelete('question', id);
    cacheService.clear('topic_counts');
    cacheService.clear('all_question_banks');
    cacheService.clear('all_mock_tests_lite');
    return result;
  },

  async updateQuestion(id: string, updates: Partial<Question>) {
    cacheService.clear('topic_counts');
    cacheService.clear('all_question_banks');
    cacheService.clear('all_mock_tests_lite');
    const hasDiagramCol = await checkSchemaHasDiagram();
    const payload: any = {
      examId: updates.examId,
      topic: updates.topic,
      difficulty: updates.difficulty,
      questionText: updates.questionText,
      options: updates.options,
      correctAnswerIndex: updates.correctAnswerIndex,
      explanation: updates.explanation
    };
    // Clean undefined keys
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });
    if (updates.diagram && hasDiagramCol) {
      payload.diagram = updates.diagram;
    }
    console.log("Update Payload:", payload);
    const data = await callAdminDbProxy('questions', 'update', payload, id);
    return data?.[0] || data;
  },

  // Test Series
  async createTestSeries(series: TestSeries) {
    cacheService.clear('all_test_series');
    const data = await callAdminDbProxy('testSeries', 'insert', series);
    return data?.[0] || data;
  },

  async getAllTestSeries() {
    return fetchWithInFlightDeduplication('all_test_series', async () => {
      const { data, error } = await supabase
        .from('testSeries')
        .select('*')
        .order('sortOrder', { ascending: true });
      if (error) throw error;
      return ((data || []) as TestSeries[]).filter(s => !s.is_archived);
    });
  },

  async deleteTestSeries(id: string) {
    cacheService.clear('all_test_series');
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    const result = await callCascadeDelete('testSeries', id);
    cacheService.clear('all_test_series');
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    return result;
  },

  async updateTestSeries(id: string, updates: Partial<TestSeries>) {
    cacheService.clear('all_test_series');
    const data = await callAdminDbProxy('testSeries', 'update', updates, id);
    cacheService.clear('all_test_series');
    return data?.[0] || data;
  },

  // Mock Tests
  async createMockTest(test: MockTest) {
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    const { questions, examId, questionIds, isPremium, category, _questionCount, ...testData } = test as any;
    const data = await callAdminDbProxy('mockTests', 'insert', testData);
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    const item = data?.[0] || data;
    if (item && item.seriesId && typeof item.seriesId === 'string' && item.seriesId.startsWith('{')) {
      try {
        const meta = JSON.parse(item.seriesId);
        return {
          ...item,
          examId: meta.examId || examId || null,
          isPremium: meta.isPremium ?? isPremium ?? false,
          category: meta.category || category || null,
          _questionCount: 0
        };
      } catch (e) {}
    }
    return item ? { ...item, examId: examId || null, isPremium: isPremium ?? false, category: category || null, _questionCount: 0 } : item;
  },

  async getAllMockTests() {
    const { data: tests, error: testsError } = await supabase
      .from('mockTests')
      .select('*')
      .order('sortOrder', { ascending: true });
    if (testsError) throw testsError;

    if (!tests || tests.length === 0) return [];

    const testIds = tests.map(t => `mockTest__${t.id}`);
    
    // Fetch all questions in batches to avoid Supabase's 1000-row limit
    let questions: any[] = [];
    let page = 0;
    const pageSize = 1000;
    let keepFetching = true;
    while (keepFetching) {
      const { data, error } = await supabase
        .from('questions')
        .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
        .in('topic', testIds)
        .range(page * pageSize, (page + 1) * pageSize - 1);
      
      if (error) {
        console.error("Error fetching mock test questions", error);
        return tests as MockTest[];
      }
      
      if (!data || data.length === 0) {
        keepFetching = false;
      } else {
        questions = questions.concat(data);
        if (data.length < pageSize) {
          keepFetching = false;
        } else {
          page++;
        }
      }
    }

    return tests.map(t => {
      const qList = questions.filter(q => q.topic === `mockTest__${t.id}`);
      const cnt = qList.length;

      let seriesData = t.seriesId;
      if (typeof seriesData === 'string' && seriesData.startsWith('{')) {
        try { seriesData = JSON.parse(seriesData); } catch(e) {}
      }
      const stage = (t as any).stage || (seriesData && typeof seriesData === 'object' ? seriesData.stage : null) || null;
      const stream = (t as any).stream || (seriesData && typeof seriesData === 'object' ? seriesData.stream : null) || null;
      const examId = (t as any).examId || (seriesData && typeof seriesData === 'object' ? seriesData.examId : null) || null;
      const category = (t as any).category || (seriesData && typeof seriesData === 'object' ? seriesData.category : null) || null;

      return {
        ...t,
        examId,
        category,
        stage: stage || undefined,
        stream: stream || undefined,
        questions: qList,
        _questionCount: cnt,
        questionCount: cnt,
        actualQuestionCount: cnt,
        practiceQuestionCount: cnt,
        totalQuestions: (t as any).totalQuestions || cnt,
      };
    }) as MockTest[];
  },

  /**
   * Lightweight version for dashboard display — fetches only test metadata
   * WITHOUT the full question array. Much faster and smaller payload.
   * Use this for listing tests; use getQuestionsForMockTest() when starting a test.
   */
  async getAllMockTestsLite() {
    return fetchWithInFlightDeduplication('all_mock_tests_lite', async () => {
      const { data: tests, error } = await supabase
        .from('mockTests')
        .select('id, title, durationMinutes, totalMarks, negativeMarking, seriesId, sortOrder, is_archived, scheduled_at')
        .order('sortOrder', { ascending: true });
      if (error) throw error;

      const filteredTests = (tests ?? []).filter(t => !t.is_archived);
      // Fast paginated query to get exact question counts for all mock tests
      const testIds = filteredTests.map(t => `mockTest__${t.id}`).filter(Boolean);
      const countMap = await fetchTopicCounts(testIds);

      // The `seriesId` column may contain either:
      //   - A UUID string (for tests linked to a real testSeries row)
      //   - A JSON/JSONB object like {examId, isPremium, category, price, ...}
      //     (used by the admin panel to store exam metadata inline)
      // Parse it to expose virtual `examId` and `isPremium` fields on each test.
      const result = filteredTests.map((t: any) => {
        let examId: string | null = t.examId || null;
        let isPremium = t.isPremium ?? false;
        let category: string | null = t.category || null;
        let stage: string | null = t.stage || null;
        let stream: string | null = t.stream || null;

        let seriesData = t.seriesId;
        if (typeof seriesData === 'string' && seriesData.startsWith('{')) {
          try { seriesData = JSON.parse(seriesData); } catch(e) {}
        }

        if (seriesData && typeof seriesData === 'object') {
          examId   = examId   || seriesData.examId   || null;
          isPremium = seriesData.isPremium ?? isPremium;
          category  = category  || seriesData.category  || null;
          stage     = stage     || seriesData.stage     || null;
          stream    = stream    || seriesData.stream    || null;
        }

        const _questionCount = countMap[`mockTest__${t.id}`] || 0;

        return {
          ...t,
          examId,
          isPremium,
          category,
          stage: stage || undefined,
          stream: stream || undefined,
          _questionCount,
          questionCount: _questionCount,
          actualQuestionCount: _questionCount,
          practiceQuestionCount: _questionCount,
          totalQuestions: t.totalQuestions || _questionCount,
        };
      }) as MockTest[];

      return result;
    });
  },

  async deleteMockTest(id: string) {
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}

    const result = await callCascadeDelete('mockTest', id);

    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}
    return result;
  },

  async clearQuestionsForMockTest(id: string) {
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}

    const result = await callCascadeDelete('mockTest', id, true);

    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}
    return result;
  },

  async updateMockTest(id: string, updates: Partial<MockTest>) {
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    const { questions, examId, questionIds, isPremium, category, _questionCount, ...updateData } = updates as any;
    const data = await callAdminDbProxy('mockTests', 'update', updateData, id);
    cacheService.clear('all_mock_tests_lite');
    cacheService.clear('topic_counts');
    return data?.[0] || data;
  },

  async getQuestionsForMockTest(mockTestId: string) {
    if (!mockTestId) return [];
    try {
      let allQuestions: Question[] = [];
      let page = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from('questions')
          .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
          .eq('topic', `mockTest__${mockTestId}`)
          .order('sortOrder', { ascending: true, nullsFirst: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        allQuestions = allQuestions.concat(data as Question[]);
        if (data.length < pageSize) break;
        page++;
      }
      return allQuestions;
    } catch (e) {
      console.error(`Error fetching questions for mock test ${mockTestId}:`, e);
      return [];
    }
  },

  async addQuestionsToMockTest(mockTestId: string, examId: string, questions: Partial<Question>[]) {
    const hasDiagramCol = await checkSchemaHasDiagram();
    const payloads = questions.map(q => {
      const item: any = {
        examId: examId || 'generic',
        topic: `mockTest__${mockTestId}`,
        difficulty: q.difficulty || 'medium',
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || ''
      };
      if (q.diagram && hasDiagramCol) {
        item.diagram = q.diagram;
      }
      return item;
    });

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("Admin authorization token is missing. Please log in again.");
    }

    const res = await fetch('/api/admin/questions/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ questions: payloads })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to bulk upload mock test questions');
    }
    return data.data;
  },

  // Exams
  async addExam(exam: Exam) {
    const data = await callAdminDbProxy('exams', 'insert', exam);
    clearCacheData(); // flush stale data AFTER write is committed, before UI dispatches the event
    return data?.[0] || data;
  },

  async getAllExams(forceFresh: boolean = false, includeAllCategories: boolean = false) {
    const cacheKey = includeAllCategories ? 'all_exams_raw' : 'all_exams';
    if (forceFresh) {
      cacheService.clear(cacheKey);
      inFlightPromises.delete(cacheKey);
    }
    return fetchWithInFlightDeduplication(cacheKey, async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('sortOrder', { ascending: true });
      if (error) throw error;
      const rawList = (data || []) as any[];
      const exams = includeAllCategories
        ? rawList.filter(ex => !ex.is_archived)
        : rawList.filter(ex => !ex.is_archived && (isAuthenticExam(ex) || (typeof ex.name === 'string' && ex.name.startsWith('SYSTEM_SETTINGS_'))));
      return exams.map(ex => {
        let metaObj: any = {};
        let cleanDesc = ex.description || '';
        if (typeof ex.description === 'string' && ex.description.startsWith('JSON_METADATA_')) {
          try {
            metaObj = JSON.parse(ex.description.replace('JSON_METADATA_', ''));
            cleanDesc = metaObj.description || '';
          } catch (e) {}
        }
        const stages = Array.isArray(metaObj.stages)
          ? metaObj.stages
          : (metaObj.stage ? [metaObj.stage] : []);
        const streams = Array.isArray(metaObj.streams)
          ? metaObj.streams
          : (metaObj.stream ? [metaObj.stream] : []);
        return {
          ...ex,
          description: cleanDesc,
          rawDescription: ex.description,
          stages,
          streams,
          isPremium: metaObj.isPremium ?? (Number(metaObj.price || ex.price) > 0),
          price: Number(metaObj.price || ex.price || 99),
          originalPrice: Number(metaObj.originalPrice || ex.originalPrice || 299),
          pricingConfig: {
            starterPrice: Number(metaObj.starterPrice ?? 29),
            starterOriginalPrice: Number(metaObj.starterOriginalPrice ?? 99),
            starterTestCount: Number(metaObj.starterTestCount ?? 5),
            price: Number(metaObj.price || ex.price || 99),
            originalPrice: Number(metaObj.originalPrice || ex.originalPrice || 299),
            examPassPrice: Number(metaObj.price || metaObj.examPassPrice || ex.price || 99),
            examPassOriginalPrice: Number(metaObj.originalPrice || metaObj.examPassOriginalPrice || ex.originalPrice || 299),
            allAccessPrice: Number(metaObj.allAccessPrice ?? 199),
            allAccessOriginalPrice: Number(metaObj.allAccessOriginalPrice ?? 999)
          }
        } as Exam;
      });
    });
  },

  async getAllBlogs(forceFresh: boolean = false) {
    if (forceFresh) {
      cacheService.clear('all_blogs');
      inFlightPromises.delete('all_blogs');
    }
    return fetchWithInFlightDeduplication('all_blogs', async () => {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .eq('category', 'blog')
        .order('createdAt', { ascending: false });
      if (error) throw error;
      const blogs = ((data || []) as any[]).filter(ex => !ex.is_archived);
      return blogs.map(ex => {
        let metaObj: any = {};
        let cleanDesc = ex.description || '';
        if (typeof ex.description === 'string' && ex.description.startsWith('JSON_METADATA_')) {
          try {
            metaObj = JSON.parse(ex.description.replace('JSON_METADATA_', ''));
            cleanDesc = metaObj.description || '';
          } catch (e) {}
        }
        return {
          ...ex,
          description: cleanDesc,
          rawDescription: ex.description,
        } as Exam;
      });
    });
  },
  async deleteExam(id: string) {
    // 1. Fetch the exam details to get the name
    const { data: examData } = await supabase
      .from('exams')
      .select('name')
      .eq('id', id)
      .single();
    const examName = examData?.name;

    // 2. Fetch associated question banks
    const { data: banks } = await supabase
      .from('questionBanks')
      .select('id')
      .eq('examId', id);
    const bankIds = (banks || []).map(b => b.id);

    // 3. Fetch associated test series
    const { data: series } = await supabase
      .from('testSeries')
      .select('id')
      .eq('examId', id);
    const seriesIds = (series || []).map(s => s.id);

    // 4. Fetch associated mock tests
    const { data: allTests } = await supabase
      .from('mockTests')
      .select('id, examId, seriesId');
    
    const relatedTestIds: string[] = [];
    (allTests || []).forEach((t: any) => {
      let isRelated = t.examId === id;
      if (!isRelated && typeof t.seriesId === 'string' && t.seriesId.includes(id)) {
        isRelated = true;
      }
      if (isRelated) {
        relatedTestIds.push(t.id);
      }
    });

    // 5. Gather all content IDs to check for purchases
    const contentIdsToCheck = [
      `exam_bundle_${id}`,
      ...bankIds,
      ...seriesIds,
      ...relatedTestIds
    ];

    // Check if there are any active purchases for these items in user_purchases
    let hasPurchases = false;
    if (contentIdsToCheck.length > 0) {
      const { data: purchases } = await supabase
        .from('user_purchases')
        .select('id')
        .in('product_id', contentIdsToCheck);
      if (purchases && purchases.length > 0) {
        hasPurchases = true;
      }
    }

    if (hasPurchases) {
      console.log(`Exam ${id} has active user purchases. Performing conditional soft-delete (archiving) to protect paid users.`);
      
      // Soft-delete the exam
      await callAdminDbProxy('exams', 'update', { is_archived: true }, id);
      
      // Soft-delete associated question banks
      if (bankIds.length > 0) {
        await callAdminDbProxy('questionBanks', 'update', { is_archived: true }, undefined, { id: { op: 'in', val: bankIds } });
      }
      
      // Soft-delete associated test series
      if (seriesIds.length > 0) {
        await callAdminDbProxy('testSeries', 'update', { is_archived: true }, undefined, { id: { op: 'in', val: seriesIds } });
      }
      
      // Soft-delete associated mock tests
      if (relatedTestIds.length > 0) {
        await callAdminDbProxy('mockTests', 'update', { is_archived: true }, undefined, { id: { op: 'in', val: relatedTestIds } });
      }
      
      cacheService.clear('all_exams');
      cacheService.clear('all_question_banks');
      cacheService.clear('all_test_series');
      cacheService.clear('all_mock_tests_lite');
      cacheService.clear('topic_counts');
      return; // Stop here, do not delete from database
    }

    console.log(`Exam ${id} has no active user purchases. Proceeding with hard-delete.`);
    const contentIdsToRevoke = new Set(contentIdsToCheck);

    // Revoke access and clean activities for all users in Supabase Auth
    try {
      if (supabase.auth.admin) {
        let page = 1;
        const perPage = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({
            page,
            perPage
          });
          if (listError) throw listError;
          if (!users || users.length === 0) {
            hasMore = false;
            break;
          }

          for (const u of users) {
            let needsUpdate = false;
            const currentMetadata = u.user_metadata || {};

            // A. Clean up purchasedSeries
            let newPurchased = currentMetadata.purchasedSeries;
            if (Array.isArray(newPurchased)) {
              const filteredPurchased = newPurchased.filter(p => !contentIdsToRevoke.has(p));
              if (filteredPurchased.length !== newPurchased.length) {
                newPurchased = filteredPurchased;
                needsUpdate = true;
              }
            }

            // B. Clean up activities
            let newActivities = currentMetadata.activities;
            if (Array.isArray(newActivities)) {
              const filteredActivities = newActivities.filter((act: any) => {
                if (!act) return false;
                
                // Filter out by examName
                if (examName && act.metadata?.examName === examName) return false;

                // Filter out by bankId
                if (act.metadata?.bankId && bankIds.includes(act.metadata.bankId)) return false;

                // Filter out by mock test ID
                const testId = act.metadata?.test?.id;
                if (testId && relatedTestIds.includes(testId)) return false;

                return true;
              });

              if (filteredActivities.length !== newActivities.length) {
                needsUpdate = true;
                newActivities = filteredActivities;
              }
            }

            if (needsUpdate) {
              await supabase.auth.admin.updateUserById(u.id, {
                user_metadata: {
                  ...currentMetadata,
                  purchasedSeries: newPurchased,
                  activities: newActivities
                }
              });
            }
          }
          page++;
        }
      }
    } catch (err) {
      console.warn("Failed to clean up user metadata on cloud (likely service role key missing or unauthorized):", err);
    }

    // Delete associated mock test questions (topic matches mockTest__<mockTestId>)
    if (relatedTestIds.length > 0) {
      const topicIds = relatedTestIds.map(mtId => `mockTest__${mtId}`);
      await callAdminDbProxy('questions', 'delete', undefined, undefined, { topic: { op: 'in', val: topicIds } });
    }

    // Delete associated direct questions
    await callAdminDbProxy('questions', 'delete', undefined, undefined, { examId: { op: 'eq', val: id } });

    // Delete associated question banks
    await callAdminDbProxy('questionBanks', 'delete', undefined, undefined, { examId: { op: 'eq', val: id } });

    // Delete associated test series
    await callAdminDbProxy('testSeries', 'delete', undefined, undefined, { examId: { op: 'eq', val: id } });

    // Delete associated mock tests
    await callAdminDbProxy('mockTests', 'delete', undefined, undefined, { seriesId: { op: 'like', val: `%\"examId\":\"${id}\"%` } });

    // Delete the exam
    clearCatalogCache();
    await callAdminDbProxy('exams', 'delete', undefined, id);
    clearCatalogCache();
  },

  async updateExam(id: string, updates: Partial<Exam>) {
    const data = await callAdminDbProxy('exams', 'update', updates, id);
    clearCacheData(); // flush stale data AFTER write is committed, before UI dispatches the event
    return data?.[0] || data;
  },

  // Question Banks
  async createQuestionBank(bank: QuestionBank) {
    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    const data = await callAdminDbProxy('questionBanks', 'insert', bank);
    return data?.[0] || data;
  },

  async getAllQuestionBanks() {
    return fetchWithInFlightDeduplication('all_question_banks', async () => {
      const { data, error } = await supabase
        .from('questionBanks')
        .select('id, examId, type, title, questionCount, tagline, image, isPremium, pdfUrl, hasPracticeMode, target_mode, sortOrder, createdAt, is_archived, scheduled_at')
        .order('sortOrder', { ascending: true });
      if (error) throw error;

      const banks = ((data || []) as QuestionBank[]).filter(b => !b.is_archived);
      if (banks && banks.length > 0) {
        try {
          // Fast, RLS-bypassing aggregate topic counts via security definer RPC
          const { data: topicData, error: rpcErr } = await supabase
            .rpc('get_question_topic_counts');

          const topicCounts: Record<string, number> = {};
          const normKey = (str: string) => str.toLowerCase().replace(/[\s\-_—–:()]+/g, '').replace(/(practicesession)+$/g, '').trim();

          if (!rpcErr && Array.isArray(topicData)) {
            topicData.forEach((row: { topic: string; question_count: number | string }) => {
              if (row.topic) {
                const cnt = Number(row.question_count) || 0;
                topicCounts[row.topic] = cnt;
                topicCounts[row.topic.trim()] = cnt;
                topicCounts[row.topic.trim().toLowerCase()] = cnt;
                const clean = row.topic.toLowerCase().replace(/(\s*-\s*practice session)+$/gi, '').trim();
                topicCounts[clean] = cnt;
                const nk = normKey(row.topic);
                if (nk) topicCounts[nk] = cnt;
              }
            });
          }

          banks.forEach((b) => {
            const rawTitle = b.title || '';
            const cleanTitle = rawTitle.toLowerCase().replace(/(\s*-\s*practice session)+$/gi, '').trim();
            const nkRaw = normKey(rawTitle);
            const nkClean = normKey(cleanTitle);

            // 1. High-priority exact match by unique bank ID namespace
            let resolvedCount = topicCounts[`bank__${b.id}`] || topicCounts[b.id] || 0;

            // 2. Fallback to title ONLY if no ID-bound count exists and title is not ambiguous across multiple banks in this exam
            if (resolvedCount === 0 && rawTitle) {
              const banksWithSameTitle = banks.filter(
                other => other.examId === b.examId && (other.title || '').trim().toLowerCase() === rawTitle.trim().toLowerCase()
              );
              if (banksWithSameTitle.length <= 1) {
                resolvedCount = topicCounts[rawTitle] || topicCounts[rawTitle.trim()] || topicCounts[rawTitle.trim().toLowerCase()] || topicCounts[cleanTitle] || topicCounts[nkRaw] || topicCounts[nkClean] || 0;
              }
            }

            // Fallback: embedded questionsData in pdfUrl column
            if (resolvedCount === 0 && b.pdfUrl && typeof b.pdfUrl === 'string' && b.pdfUrl.startsWith('{')) {
              try {
                const parsed = JSON.parse(b.pdfUrl);
                if (parsed && Array.isArray(parsed.questionsData) && parsed.questionsData.length > 0) {
                  resolvedCount = parsed.questionsData.length;
                } else if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].questionText || parsed[0].question)) {
                  resolvedCount = parsed.length;
                }
              } catch (_e) {}
            }

            // Fallback: use database stored questionCount if verified
            if (resolvedCount === 0 && typeof b.questionCount === 'number' && b.questionCount > 0) {
              const banksWithSameTitle = banks.filter(
                other => other.examId === b.examId && (other.title || '').trim().toLowerCase() === rawTitle.trim().toLowerCase()
              );
              if (banksWithSameTitle.length <= 1) {
                resolvedCount = b.questionCount;
              }
            }

            b.practiceQuestionCount = resolvedCount;
            b.questionCount = resolvedCount;

            let stage: string | null = (b as any).stage || null;
            let stream: string | null = (b as any).stream || null;
            if (b.tagline && typeof b.tagline === 'string' && b.tagline.trim().startsWith('{')) {
              try {
                const parsed = JSON.parse(b.tagline);
                if (!stage && parsed && parsed.stage) stage = parsed.stage;
                if (!stream && parsed && parsed.stream) stream = parsed.stream;
              } catch (_e) {}
            }
            b.stage = stage || undefined;
            b.stream = stream || undefined;
          });
        } catch (err) {
          console.error('Failed to fetch actual question counts for question banks:', err);
        }
      }
      return banks as QuestionBank[];
    });
  },

  async deleteQuestionBank(id: string) {
    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}

    const result = await callCascadeDelete('questionBank', id);

    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}
    return result;
  },

  async clearQuestionsForBank(id: string) {
    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}

    const result = await callCascadeDelete('questionBank', id, true);

    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    try { sessionStorage.removeItem('oep_admin_catalog_cache_v2'); } catch(e) {}
    return result;
  },

  async updateQuestionBank(id: string, updates: Partial<QuestionBank>) {
    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    // If the title is being updated, we should also update the topic of all associated questions
    if (updates.title) {
      try {
        const { data: oldBank } = await supabase
          .from('questionBanks')
          .select('title, examId')
          .eq('id', id)
          .single();
        
        if (oldBank && oldBank.title && oldBank.title !== updates.title) {
          await callAdminDbProxy('questions', 'update', { topic: updates.title }, undefined, {
            topic: { op: 'eq', val: oldBank.title },
            examId: { op: 'eq', val: oldBank.examId }
          });
        }
      } catch (err) {
        console.error("Failed to cascade question bank title update to questions:", err);
      }
    }
    const data = await callAdminDbProxy('questionBanks', 'update', updates, id);
    cacheService.clear('all_question_banks');
    cacheService.clear('topic_counts');
    return data?.[0] || data;
  },

  async getQuestionsForQuestionBank(bankId: string, bankTitle?: string, examId?: string): Promise<Question[]> {
    try {
      // 1. High-priority exact match by unique bank ID namespace (with infinite auto-pagination)
      if (bankId) {
        const idCandidates = [`bank__${bankId}`, bankId];
        let allIdQuestions: Question[] = [];
        let page = 0;
        const pageSize = 1000;

        while (true) {
          let idQuery = supabase
            .from('questions')
            .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
            .in('topic', idCandidates)
            .range(page * pageSize, (page + 1) * pageSize - 1)
            .order('sortOrder', { ascending: true, nullsFirst: false });

          if (examId) {
            idQuery = idQuery.eq('examId', examId);
          }

          const { data: pageData, error: idErr } = await idQuery;
          if (idErr || !pageData || pageData.length === 0) break;
          allIdQuestions = allIdQuestions.concat(pageData);
          page++;
          if (pageData.length < pageSize) break;
        }

        if (allIdQuestions.length > 0) {
          return allIdQuestions;
        }

        // Retry without examId filter in case examId was saved differently (with pagination)
        if (examId) {
          let allRetryQuestions: Question[] = [];
          let retryPage = 0;
          while (true) {
            const { data: noExamIdData, error: noExamIdErr } = await supabase
              .from('questions')
              .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
              .in('topic', idCandidates)
              .range(retryPage * pageSize, (retryPage + 1) * pageSize - 1)
              .order('sortOrder', { ascending: true, nullsFirst: false });

            if (noExamIdErr || !noExamIdData || noExamIdData.length === 0) break;
            allRetryQuestions = allRetryQuestions.concat(noExamIdData);
            retryPage++;
            if (noExamIdData.length < pageSize) break;
          }

          if (allRetryQuestions.length > 0) {
            return allRetryQuestions;
          }
        }
      }

      // 2. Check questionBanks table for embedded pdfUrl or questions array
      if (bankId) {
        const { data: bankData } = await supabase
          .from('questionBanks')
          .select('pdfUrl, questions')
          .eq('id', bankId)
          .single();

        if (bankData) {
          if (Array.isArray(bankData.questions) && bankData.questions.length > 0) {
            return bankData.questions;
          }
          if (bankData.pdfUrl) {
            try {
              const parsed = JSON.parse(bankData.pdfUrl);
              if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].questionText || parsed[0].question)) {
                return parsed;
              }
              if (parsed.questionsData && Array.isArray(parsed.questionsData)) {
                return parsed.questionsData;
              }
            } catch (e) {}
          }
        }
      }

      // 3. Fallback for legacy plain-title topics:
      // Verify that this title is NOT shared across multiple banks in the same exam
      if (bankTitle) {
        if (examId) {
          const { data: siblingBanks } = await supabase
            .from('questionBanks')
            .select('id')
            .eq('examId', examId)
            .eq('title', bankTitle);
          if (siblingBanks && siblingBanks.length > 1) {
            // Sibling banks share this title; do NOT bleed questions across categories!
            return [];
          }
        }

        const topicCandidates = new Set<string>();
        topicCandidates.add(bankTitle);
        topicCandidates.add(bankTitle.trim());
        const stripped = bankTitle.replace(/(\s*-\s*Practice Session)+$/gi, '').trim();
        topicCandidates.add(stripped);
        topicCandidates.add(`${stripped} - Practice Session`);

        const candidateList = Array.from(topicCandidates).filter(Boolean);
        let titleQuery = supabase
          .from('questions')
          .select('id, examId, topic, difficulty, questionText, options, correctAnswerIndex, explanation, diagram, sortOrder')
          .in('topic', candidateList);

        if (examId) {
          titleQuery = titleQuery.eq('examId', examId);
        }

        const { data: titleData, error: titleErr } = await titleQuery.order('sortOrder', { ascending: true, nullsFirst: false });
        if (!titleErr && titleData && titleData.length > 0) {
          return titleData;
        }
      }

      return [];
    } catch (err) {
      console.error("Error in getQuestionsForQuestionBank:", err);
      return [];
    }
  },

  // --- Flashcard Decks & Cards Service ---
  async getAllFlashcardDecks(examId?: string, forceFresh: boolean = false): Promise<FlashcardDeck[]> {
    const cacheKey = examId ? `flashcard_decks_${examId}` : 'all_flashcard_decks';
    if (!forceFresh) {
      const cached = cacheService.get<FlashcardDeck[]>(cacheKey);
      if (cached) return cached;
    }

    try {
      let query = supabase
        .from('flashcard_decks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (examId) {
        query = query.eq('exam_id', examId);
      }

      const { data, error } = await query;
      if (error) throw error;
      const decks = data || [];
      cacheService.set(cacheKey, decks);
      return decks;
    } catch (err) {
      console.error("Failed to fetch flashcard decks:", err);
      return [];
    }
  },

  async getFlashcardsByDeckId(deckId: string): Promise<Flashcard[]> {
    try {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deckId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Failed to fetch flashcards for deck:", deckId, err);
      return [];
    }
  },

  async getUserFlashcardProgress(userId: string, deckId?: string): Promise<Record<string, UserCardProgress>> {
    if (!userId) return {};
    try {
      let query = supabase
        .from('user_flashcard_progress')
        .select('*')
        .eq('user_id', userId);

      if (deckId) {
        query = query.eq('deck_id', deckId);
      }

      const { data, error } = await query;
      if (error) throw error;
      const map: Record<string, UserCardProgress> = {};
      (data || []).forEach((row: any) => {
        map[row.card_id] = row;
      });
      return map;
    } catch (err) {
      console.error("Failed to fetch user flashcard progress:", err);
      return {};
    }
  },

  async saveUserCardProgress(progress: UserCardProgress): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_flashcard_progress')
        .upsert({
          user_id: progress.user_id,
          card_id: progress.card_id,
          deck_id: progress.deck_id,
          state: progress.state,
          ease_factor: progress.ease_factor,
          interval_days: progress.interval_days,
          repetitions: progress.repetitions,
          lapses: progress.lapses,
          due_date: progress.due_date,
          last_reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,card_id'
        });

      if (error) throw error;
    } catch (err) {
      console.error("Failed to save user card progress to Supabase:", err);
    }
  },

  async addFlashcardDeck(deck: Partial<FlashcardDeck>): Promise<FlashcardDeck> {
    const data = await callAdminDbProxy('flashcard_decks', 'insert', deck);
    cacheService.clear('all_flashcard_decks');
    if (deck.exam_id) cacheService.clear(`flashcard_decks_${deck.exam_id}`);
    try {
      if (typeof sessionStorage !== 'undefined') {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
        });
      }
    } catch (e) {}
    return data?.[0] || data;
  },

  async bulkAddFlashcardDecks(decks: Partial<FlashcardDeck>[]): Promise<FlashcardDeck[]> {
    if (!decks || decks.length === 0) return [];
    const data = await callAdminDbProxy('flashcard_decks', 'insert', decks);
    cacheService.clear('all_flashcard_decks');
    const examIds = new Set(decks.map(d => d.exam_id).filter(Boolean));
    examIds.forEach(id => cacheService.clear(`flashcard_decks_${id}`));
    try {
      if (typeof sessionStorage !== 'undefined') {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
        });
      }
    } catch (e) {}
    return Array.isArray(data) ? data : (data ? [data] : []);
  },

  async updateFlashcardDeck(id: string, updates: Partial<FlashcardDeck>): Promise<FlashcardDeck> {
    const data = await callAdminDbProxy('flashcard_decks', 'update', updates, id);
    cacheService.clear('all_flashcard_decks');
    if (updates.exam_id) cacheService.clear(`flashcard_decks_${updates.exam_id}`);
    try {
      if (typeof sessionStorage !== 'undefined') {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
        });
      }
    } catch (e) {}
    return data?.[0] || data;
  },

  async deleteFlashcardDeck(id: string): Promise<boolean> {
    await callAdminDbProxy('flashcard_decks', 'delete', undefined, id);
    cacheService.clear('all_flashcard_decks');
    try {
      if (typeof sessionStorage !== 'undefined') {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
        });
      }
    } catch (e) {}
    return true;
  },

  async bulkDeleteFlashcardDecks(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    await callAdminDbProxy('flashcard_decks', 'delete', undefined, undefined, {
      id: { op: 'in', val: ids }
    });
    cacheService.clear('all_flashcard_decks');
    try {
      if (typeof sessionStorage !== 'undefined') {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
        });
      }
    } catch (e) {}
    return true;
  },

  async bulkAddFlashcards(deckId: string, cards: Partial<Flashcard>[]): Promise<Flashcard[]> {
    const payload = cards.map((c, i) => ({
      deck_id: deckId,
      front_text: c.front_text,
      back_text: c.back_text,
      key_points: c.key_points || [],
      diagram: c.diagram || null,
      sort_order: c.sort_order ?? i
    }));
    const data = await callAdminDbProxy('flashcards', 'insert', payload);
    const { count } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('deck_id', deckId);
    if (typeof count === 'number') {
      await callAdminDbProxy('flashcard_decks', 'update', { card_count: count }, deckId);
      cacheService.clear('all_flashcard_decks');
      try {
        if (typeof sessionStorage !== 'undefined') {
          Object.keys(sessionStorage).forEach(k => {
            if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
          });
        }
      } catch (e) {}
    }
    return data || [];
  },

  async deleteFlashcard(cardId: string, deckId?: string): Promise<boolean> {
    await callAdminDbProxy('flashcards', 'delete', undefined, cardId);
    if (deckId) {
      const { count } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('deck_id', deckId);
      if (typeof count === 'number') {
        await callAdminDbProxy('flashcard_decks', 'update', { card_count: count }, deckId);
        cacheService.clear('all_flashcard_decks');
        try {
          if (typeof sessionStorage !== 'undefined') {
            Object.keys(sessionStorage).forEach(k => {
              if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
            });
          }
        } catch (e) {}
      }
    }
    return true;
  },

  async bulkDeleteFlashcards(cardIds: string[], deckId?: string): Promise<boolean> {
    if (!cardIds || cardIds.length === 0) return true;
    await callAdminDbProxy('flashcards', 'delete', undefined, undefined, {
      id: { op: 'in', val: cardIds }
    });
    if (deckId) {
      const { count } = await supabase.from('flashcards').select('*', { count: 'exact', head: true }).eq('deck_id', deckId);
      if (typeof count === 'number') {
        await callAdminDbProxy('flashcard_decks', 'update', { card_count: count }, deckId);
        cacheService.clear('all_flashcard_decks');
        try {
          if (typeof sessionStorage !== 'undefined') {
            Object.keys(sessionStorage).forEach(k => {
              if (k.startsWith('oep_cache_flashcard_decks')) sessionStorage.removeItem(k);
            });
          }
        } catch (e) {}
      }
    }
    return true;
  },

  async updateFlashcard(cardId: string, updates: Partial<Flashcard>): Promise<Flashcard> {
    const data = await callAdminDbProxy('flashcards', 'update', updates, cardId);
    return data?.[0] || data;
  },

  // --- Exam Syllabi (Stage & Stream Segregated) ---
  async getExamSyllabus(examId: string, stage?: string, stream?: string): Promise<ExamSyllabus | null> {
    if (!examId) return null;
    const cleanStage = (stage || '').trim();
    const cleanStream = (stream || '').trim();
    const cacheKey = `syllabus_${examId}_${cleanStage || 'all'}_${cleanStream || 'all'}`;

    return fetchWithInFlightDeduplication(cacheKey, async () => {
      let query = supabase
        .from('exam_syllabi')
        .select('*')
        .eq('exam_id', examId);

      if (cleanStage) {
        query = query.ilike('stage', cleanStage);
      }

      if (cleanStream && cleanStream.toLowerCase() !== 'all streams') {
        query = query.ilike('stream', cleanStream);
      }

      const { data, error } = await query;
      if (error) {
        console.warn(`[getExamSyllabus] Error for ${examId} ${cleanStage} ${cleanStream}:`, error.message);
        return null;
      }

      if (data && data.length > 0) {
        return data[0] as ExamSyllabus;
      }

      // Fallback 1: If specific stream requested was not found for this stage, check for 'All Streams', 'General', or 'Common'
      if (cleanStream && cleanStream.toLowerCase() !== 'all streams') {
        const { data: streamFallback } = await supabase
          .from('exam_syllabi')
          .select('*')
          .eq('exam_id', examId)
          .ilike('stage', cleanStage || '%')
          .in('stream', ['All Streams', 'General', 'Common']);
        if (streamFallback && streamFallback.length > 0) {
          return streamFallback[0] as ExamSyllabus;
        }
      }

      // Fallback 2: If specific stage requested was not found, check for 'All Stages', 'Single Stage', or 'General'
      if (cleanStage) {
        const { data: fallback } = await supabase
          .from('exam_syllabi')
          .select('*')
          .eq('exam_id', examId)
          .in('stage', ['All Stages', 'Single Stage', 'General']);
        if (fallback && fallback.length > 0) {
          return fallback[0] as ExamSyllabus;
        }
      }

      return null;
    });
  },

  async getAllExamSyllabi(examId: string): Promise<ExamSyllabus[]> {
    if (!examId) return [];
    const cacheKey = `all_syllabi_${examId}`;
    return fetchWithInFlightDeduplication(cacheKey, async () => {
      const { data, error } = await supabase
        .from('exam_syllabi')
        .select('*')
        .eq('exam_id', examId)
        .order('stage', { ascending: true })
        .order('stream', { ascending: true });
      if (error) {
        console.warn(`[getAllExamSyllabi] Error for ${examId}:`, error.message);
        return [];
      }
      return (data || []) as ExamSyllabus[];
    });
  },

  async saveExamSyllabus(
    examId: string, 
    stage: string, 
    syllabusMarkdown: string, 
    directivesMarkdown?: string,
    stream?: string
  ): Promise<ExamSyllabus> {
    const cleanStage = (stage || 'All Stages').trim();
    const cleanStream = (stream || 'All Streams').trim();
    const payload = {
      exam_id: examId,
      stage: cleanStage,
      stream: cleanStream,
      syllabus_markdown: syllabusMarkdown || '',
      directives_markdown: directivesMarkdown || '',
      updated_at: new Date().toISOString()
    };

    const result = await callAdminDbProxy('exam_syllabi', 'upsert', payload, undefined, undefined, 'exam_id,stage,stream');

    cacheService.clear(`syllabus_${examId}_${cleanStage}_${cleanStream}`);
    cacheService.clear(`syllabus_${examId}_${cleanStage}_all`);
    cacheService.clear(`syllabus_${examId}_all_all`);
    cacheService.clear(`syllabus_${examId}_${cleanStage}`);
    cacheService.clear(`syllabus_${examId}_all`);
    cacheService.clear(`all_syllabi_${examId}`);
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(`oep_cache_syllabus_${examId}_${cleanStage}_${cleanStream}`);
        sessionStorage.removeItem(`oep_cache_syllabus_${examId}_${cleanStage}`);
        sessionStorage.removeItem(`oep_cache_syllabus_${examId}_all`);
      }
    } catch (e) {}

    return (Array.isArray(result) ? result[0] : result) as ExamSyllabus;
  },

  async deleteExamSyllabus(examId: string, stage: string, stream?: string): Promise<boolean> {
    const cleanStage = (stage || '').trim();
    const cleanStream = (stream || '').trim();
    const matchObj: Record<string, { op: string; val: any }> = {
      exam_id: { op: 'eq', val: examId },
      stage: { op: 'eq', val: cleanStage }
    };
    if (cleanStream) {
      matchObj.stream = { op: 'eq', val: cleanStream };
    }
    await callAdminDbProxy('exam_syllabi', 'delete', undefined, undefined, matchObj);
    cacheService.clear(`syllabus_${examId}_${cleanStage}_${cleanStream}`);
    cacheService.clear(`syllabus_${examId}_${cleanStage}`);
    cacheService.clear(`all_syllabi_${examId}`);
    return true;
  },

  async reconcileBankCounts(examId: string): Promise<any> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/admin/banks/reconcile-counts', {
      method: 'POST',
      headers,
      body: JSON.stringify({ examId })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reconcile bank counts');
    }
    return res.json();
  }
};
