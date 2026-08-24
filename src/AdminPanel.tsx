import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Upload, 
  FileText, 
  Layers, 
  Users, 
  Settings,
  X,
  Check,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Search,
  Trash2,
  Edit2,
  LogOut,
  Award,
  BookMarked,
  GripVertical,
  Bell,
  Mail,
  ArrowUp,
  ArrowDown,
  Calendar,
  RotateCcw,
  FileCode,
  Code,
  KeyRound,
  Sparkles,
  BookOpen,
  Eye,
  CheckCircle2,
  HelpCircle,
  Target,
  Save,
  FileJson
} from 'lucide-react';
import { Reorder } from 'framer-motion';
import { examService, Question, TestSeries, MockTest, Exam } from './lib/examService';
import { destroyLenis, initLenis } from './lib/lenisScroll';
import { DEFAULT_ACHIEVERS_JOURNAL, AchieverStory } from './lib/defaultAchievers';
import { cn, getDirectImageUrl } from './lib/utils';
import { supabase } from './lib/supabase';
import { dropdown, modalContent, scaleIn } from './lib/animations';
import { MathTextRenderer, DiagramRenderer, cleanJsonString, extractEmbeddedDiagram, diagramValidator } from './components/MathTextRenderer';
import DiagramTemplateSelector from './components/DiagramTemplateSelector';
import { validateCatalogEntitlements } from './lib/entitlementManager';

// --- Custom Components ---
const SearchableDropdown = ({ value, onChange, options, placeholder, required, disabled }: { value: string, onChange: (v: string) => void, options: {value: string, label: string}[], placeholder: string, required?: boolean, disabled?: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
  const selectedLabel = options.find(o => o.value === value)?.label || '';

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div className="absolute inset-0 overflow-hidden opacity-0 pointer-events-none w-0 h-0">
        <input type="text" required={required} value={value} onChange={() => {}} tabIndex={-1} />
      </div>
      <div 
        className={cn(
          "w-full px-5 py-3 rounded-2xl border outline-none font-semibold bg-slate-50/30 cursor-pointer flex justify-between items-center group transition-all duration-200 shadow-inner", 
          isOpen ? "border-brand-500 bg-white ring-4 ring-brand-500/15 shadow-sm" : "border-slate-200 hover:border-slate-300", 
          disabled && "opacity-50 select-none pointer-events-none"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={selectedLabel ? "text-slate-900 line-clamp-1 text-left font-bold" : "text-slate-400 font-medium"}>{selectedLabel || placeholder}</span>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 group-hover:text-slate-500 transition-transform shrink-0", isOpen && "rotate-180")} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div {...dropdown}
            className="absolute z-[100] mt-2 left-0 right-0 bg-white border border-slate-200/80 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search items..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-semibold outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all text-slate-700"
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
              <div
                className={cn("px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors", !value ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50")}
                onClick={() => { onChange(''); setIsOpen(false); setSearchTerm(''); }}
              >
                {placeholder}
              </div>
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400 text-center font-bold">No results found</div>
              ) : (
                filteredOptions.map(o => (
                  <div
                    key={o.value}
                    onClick={() => { onChange(o.value); setIsOpen(false); setSearchTerm(''); }}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors", 
                      value === o.value ? "bg-brand-50 text-brand-600" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {o.label}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const getMockTestScope = (t: any) => {
  try {
    if (t.seriesId) {
      const parsed = JSON.parse(t.seriesId);
      return {
        examId: parsed.examId || '',
        category: parsed.category || 'full-length',
        subject: parsed.category === 'sectional' ? (parsed.subject || '') : null
      };
    }
  } catch (e) {}
  return { examId: '', category: 'full-length', subject: null };
};

export const getExamAdminTracker = (exam: any) => {
  let meta: any = {};
  if (exam && exam.description && typeof exam.description === 'string' && exam.description.startsWith('JSON_METADATA_')) {
    try {
      meta = JSON.parse(exam.description.replace('JSON_METADATA_', ''));
    } catch(e) {}
  }

  const examDateStr = meta?.examDate || exam?.examDate || '';
  const examDateStatus = meta?.examDateStatus || (examDateStr ? 'published' : 'tba');
  const formFillupStatus = meta?.formFillupStatus || 'tba';
  const formFillupEndDate = meta?.formFillupEndDate || '';

  // Calculate Days Remaining
  let countdownText = '📢 Date Not Published';
  let countdownType: 'urgent' | 'warning' | 'normal' | 'today' | 'passed' | 'tba' | 'expected' = 'tba';
  let daysLeft: number | null = null;

  if (examDateStatus === 'published' && examDateStr) {
    const targetDate = new Date(examDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLeft > 0) {
      countdownText = `⏳ ${daysLeft} Days Remaining`;
      if (daysLeft <= 15) countdownType = 'urgent';
      else if (daysLeft <= 45) countdownType = 'warning';
      else countdownType = 'normal';
    } else if (daysLeft === 0) {
      countdownText = `🔥 Exam Conducted Today!`;
      countdownType = 'today';
    } else {
      countdownText = `✅ Exam Conducted (${Math.abs(daysLeft)}d ago)`;
      countdownType = 'passed';
    }
  } else if (examDateStatus === 'expected') {
    countdownText = `🔮 Expected: ${examDateStr || 'Soon'}`;
    countdownType = 'expected';
  } else {
    countdownText = `📢 Date TBA / Not Published`;
    countdownType = 'tba';
  }

  // Form fillup badge info
  let formText = '⏳ Form Dates TBA';
  let formType: 'open' | 'closed' | 'awaited' | 'tba' = formFillupStatus as any;

  if (formFillupStatus === 'open') {
    if (formFillupEndDate) {
      const fillupEnd = new Date(formFillupEndDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      fillupEnd.setHours(0, 0, 0, 0);
      const days = Math.ceil((fillupEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (days >= 0) {
        formText = `📝 Form Open (${days}d left - Ends ${formFillupEndDate})`;
      } else {
        formText = `🔒 Form Fill-up Closed`;
        formType = 'closed';
      }
    } else {
      formText = `📝 Form Fill-up Open`;
    }
  } else if (formFillupStatus === 'closed') {
    formText = `🔒 Form Fill-up Closed`;
  } else if (formFillupStatus === 'awaited') {
    formText = `🔔 Notification Awaited`;
  } else {
    formText = `⏳ Form Dates TBA`;
  }

  return {
    examDateStr,
    examDateStatus,
    formFillupStatus,
    formFillupEndDate,
    daysLeft,
    countdownText,
    countdownType,
    formText,
    formType
  };
};

const AdminPanel = ({ onClose, onLogout }: { onClose: () => void, onLogout?: () => void }) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'series' | 'tests' | 'exams' | 'banks' | 'practice' | 'users' | 'updates' | 'settings' | 'subscribers' | 'notifications'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      const validTabs = ['questions', 'series', 'tests', 'exams', 'banks', 'practice', 'users', 'updates', 'settings', 'subscribers', 'notifications'];
      if (tabParam && validTabs.includes(tabParam)) return tabParam as any;
      const saved = sessionStorage.getItem('oep_adminActiveTab');
      if (saved && validTabs.includes(saved)) return saved as any;
    }
    return 'exams';
  });
  const [questionFilter, setQuestionFilter] = useState<'all' | 'practice' | 'mock'>('all');
  const [examFilter, setExamFilter] = useState<'all' | 'popular' | 'upcoming'>('all');
  const [testFilter, setTestFilter] = useState<'all' | 'full-length' | 'sectional' | 'pyq' | 'daily'>('all');
  const [testSortDirection, setTestSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedExamIdForTests, setSelectedExamIdForTests] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tests_examId') || sessionStorage.getItem('oep_tests_examId') || null;
    }
    return null;
  });
  const [selectedCategoryForTests, setSelectedCategoryForTests] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tests_cat') || sessionStorage.getItem('oep_tests_category') || null;
    }
    return null;
  });
  const [selectedExamIdForBanks, setSelectedExamIdForBanks] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('banks_examId') || sessionStorage.getItem('oep_banks_examId') || null;
    }
    return null;
  });
  const [selectedExamIdForSeries, setSelectedExamIdForSeries] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('series_examId') || sessionStorage.getItem('oep_series_examId') || null;
    }
    return null;
  });
  const [selectedExamIdForQuestions, setSelectedExamIdForQuestions] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('examId') || sessionStorage.getItem('oep_qs_examId') || null;
    }
    return null;
  });
  const [selectedTypeForQuestions, setSelectedTypeForQuestions] = useState<'mock' | 'bank' | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const t = urlParams.get('type');
      if (t === 'mock' || t === 'bank') return t;
      return (sessionStorage.getItem('oep_qs_type') as 'mock' | 'bank' | null) || null;
    }
    return null;
  });
  const [selectedCategoryForQuestions, setSelectedCategoryForQuestions] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('category') || sessionStorage.getItem('oep_qs_category') || null;
    }
    return null;
  });
  const [selectedTargetIdForQuestions, setSelectedTargetIdForQuestions] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('targetId') || sessionStorage.getItem('oep_qs_targetId') || null;
    }
    return null;
  });
  const [bankFilter, setBankFilter] = useState<'all' | 'topic-wise' | 'exam-focused' | 'revision-sets' | 'pyq-collections'>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('oep_bankFilter');
      if (saved) return saved as any;
    }
    return 'all';
  });
  const [bankTargetModeFilter, setBankTargetModeFilter] = useState<'all' | 'bank' | 'practice' | 'both'>('all');
  const [bankSubTab, setBankSubTab] = useState<'banks' | 'practice' | 'all'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const sub = urlParams.get('subTab');
      if (sub === 'banks' || sub === 'practice' || sub === 'all') return sub;
      const saved = sessionStorage.getItem('oep_bankSubTab');
      if (saved === 'banks' || saved === 'practice' || saved === 'all') return saved as any;
    }
    return 'banks';
  });
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    destroyLenis();
    return () => {
      initLenis();
    };
  }, []);
  const [filterExamId, setFilterExamId] = useState(() => {
    const savedActiveTab = sessionStorage.getItem('oep_adminActiveTab');
    if (savedActiveTab === 'questions') {
      return sessionStorage.getItem('oep_qs_examId') || 'all';
    }
    return 'all';
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [showMockUploadModal, setShowMockUploadModal] = useState(false);
  const [attachMockTestId, setAttachMockTestId] = useState<string | null>(null);
  const [bulkExamId, setBulkExamId] = useState('');
  const [bulkTopic, setBulkTopic] = useState('');
  const [bulkFileContent, setBulkFileContent] = useState('');
  const [bulkFileNames, setBulkFileNames] = useState<string[]>([]);
  // SWR Admin Catalog Cache Helper
  const getAdminCatalogCache = () => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem('oep_admin_catalog_cache');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch(e) {}
    return null;
  };

  const saveAdminCatalogCache = (data: { ss?: any[]; ts?: any[]; ex?: any[]; bks?: any[]; fetchedUsers?: any[] }) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = getAdminCatalogCache() || {};
      const updated = {
        ss: data.ss || existing.ss || [],
        ts: data.ts || existing.ts || [],
        ex: data.ex || existing.ex || [],
        bks: data.bks || existing.bks || [],
        fetchedUsers: data.fetchedUsers || existing.fetchedUsers || [],
        timestamp: Date.now()
      };
      sessionStorage.setItem('oep_admin_catalog_cache', JSON.stringify(updated));
    } catch(e) {}
  };

  const initialAdminCache = React.useMemo(() => getAdminCatalogCache(), []);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(() => !initialAdminCache);
  // Push Notification Composer State
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushClickUrl, setPushClickUrl] = useState('/');
  const [pushImageUrl, setPushImageUrl] = useState('');
  const [pushTargetType, setPushTargetType] = useState<'all' | 'users'>('all');
  const [pushScheduledAt, setPushScheduledAt] = useState('');
  const [pushSending, setPushSending] = useState(false);
  const [pushHistory, setPushHistory] = useState<any[]>([]);
  const [pushHistoryLoading, setPushHistoryLoading] = useState(false);
  const [pushHistoryPage, setPushHistoryPage] = useState(1);
  const [pushHistoryTotal, setPushHistoryTotal] = useState(0);

  // Data State — Initialized synchronously from SWR cache for 0ms instant display
  const [questions, setQuestions] = useState<Question[]>([]);
  const [series, setSeries] = useState<TestSeries[]>(() => initialAdminCache?.ss || []);
  const [mockTests, setMockTests] = useState<MockTest[]>(() => initialAdminCache?.ts || []);
  const [exams, setExams] = useState<Exam[]>(() => initialAdminCache?.ex || []);
  const [banks, setBanks] = useState<any[]>(() => initialAdminCache?.bks || []);
  const [users, setUsers] = useState<any[]>(() => initialAdminCache?.fetchedUsers || []);
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<any>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [grantTargetUser, setGrantTargetUser] = useState<any>(null);
  const [grantSelectedExamId, setGrantSelectedExamId] = useState("");
  const [grantSelectedCategory, setGrantSelectedCategory] = useState("bundle");
  const [grantSelectedContentId, setGrantSelectedContentId] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [bankSortDirection, setBankSortDirection] = useState<'asc' | 'desc'>('asc');

  // Comprehensive Form State
  const initialFormData = {
    // Exam
    name: '',
    icon: '🏛️',
    examCategory: 'popular',
    examDate: '',
    
    // Generic
    title: '',
    description: '',
    
    // Bank
    type: 'topic-wise',
    target_mode: 'both' as 'bank' | 'practice' | 'both',
    questionCount: 0,
    tagline: '',
    image: '',
    isPremium: false,
    pdfUrl: '',
    pdfLinks: [] as { title: string; url: string }[],
    hasPracticeMode: true,
    
    // Series / Test
    examId: '',
    seriesId: '',
    mockCategory: 'full-length',
    mockSubject: '',
    price: 0,
    originalPrice: 0,
    durationDays: 30,
    durationMinutes: 60,
    totalMarks: 100,
    negativeMarking: 0,
    sortOrder: '' as any,
    
    // Question
    topic: '',
    difficulty: 'medium',
    questionText: '',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    explanation: '',
    targetExamId: '',
    diagram: null,
    
    // SEO
    metaTitle: '',
    metaDescription: '',
    keywords: '',

    // Schedule & Admin Exam Tracker
    scheduled_at: '',
    examDateStatus: 'tba' as 'published' | 'tba' | 'expected',
    formFillupStatus: 'tba' as 'open' | 'closed' | 'awaited' | 'tba',
    formFillupEndDate: ''
  };

  const [formData, setFormData] = useState<any>(initialFormData);
  const [youtubeVideosInput, setYoutubeVideosInput] = useState('');
  const [newsUpdatesInput, setNewsUpdatesInput] = useState('');
  const [diagramText, setDiagramText] = useState('');
  const [showDiagramHelp, setShowDiagramHelp] = useState(false);

  // --- Question Bank Creation & Answer Key State ---
  const [bankQuestionsJson, setBankQuestionsJson] = useState('');
  const [bankAnswerKeyJson, setBankAnswerKeyJson] = useState('');
  const [bankQuestionsInputMode, setBankQuestionsInputMode] = useState<'file' | 'text'>('file');
  const [bankAnswerKeyInputMode, setBankAnswerKeyInputMode] = useState<'file' | 'text'>('file');
  const [bankQuestionsFileName, setBankQuestionsFileName] = useState('');
  const [bankAnswerKeyFileName, setBankAnswerKeyFileName] = useState('');
  const [showBankPreviewModal, setShowBankPreviewModal] = useState(false);

  // --- Bulk JSON Importer State ---
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkJsonInput, setBulkJsonInput] = useState('');
  const [bulkGlobalExamId, setBulkGlobalExamId] = useState('');
  const [bulkGlobalCategory, setBulkGlobalCategory] = useState('topic-wise');
  const [bulkGlobalTargetMode, setBulkGlobalTargetMode] = useState<'bank' | 'practice' | 'both'>('practice');
  const [bulkGlobalIsPremium, setBulkGlobalIsPremium] = useState(false);
  const [bulkGlobalPrice, setBulkGlobalPrice] = useState<number>(499);
  const [bulkGlobalOriginalPrice, setBulkGlobalOriginalPrice] = useState<number>(999);
  const [bulkGlobalScheduledAt, setBulkGlobalScheduledAt] = useState('');
  const [bulkGlobalDurationMinutes, setBulkGlobalDurationMinutes] = useState(60);
  const [bulkGlobalTotalMarks, setBulkGlobalTotalMarks] = useState(100);
  const [bulkGlobalNegativeMarking, setBulkGlobalNegativeMarking] = useState(0);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  // Helper to calculate next category-scoped sequential sort order (starting from 1, filling missing gaps)
  const getNextAvailableOrder = (
    tab: string,
    examId?: string,
    category?: string,
    targetMode?: string,
    topic?: string
  ): number => {
    if (tab === 'banks' || tab === 'practice') {
      const isPractice = (targetMode || tab) === 'practice';
      const targetCategory = (!category || category === 'all') ? 'topic-wise' : category;
      const scopedBanks = banks.filter((b: any) => {
        const matchExam = !examId || b.examId === examId;
        const matchMode = isPractice ? (b.target_mode || 'both') !== 'bank' : (b.target_mode || 'both') !== 'practice';
        const matchCategory = (b.type || 'topic-wise') === targetCategory;
        return matchExam && matchMode && matchCategory;
      });
      const existingOrders = scopedBanks
        .map((b: any) => Number(b.sortOrder))
        .filter((n: number) => !isNaN(n) && n > 0);
      let next = 1;
      while (existingOrders.includes(next)) {
        next++;
      }
      return next;
    } else if (tab === 'tests') {
      const targetCategory = (!category || category === 'all') ? 'full-length' : category;
      const scopedTests = mockTests.filter((t: any) => {
        const matchExam = !examId || t.examId === examId;
        const matchCategory = (t.category || t.mockCategory || 'full-length') === targetCategory;
        return matchExam && matchCategory;
      });
      const existingOrders = scopedTests
        .map((t: any) => Number(t.sortOrder))
        .filter((n: number) => !isNaN(n) && n > 0);
      let next = 1;
      while (existingOrders.includes(next)) {
        next++;
      }
      return next;
    } else if (tab === 'questions') {
      const scopedQuestions = questions.filter((q: any) => {
        const matchExam = !examId || q.examId === examId;
        const matchTopic = !topic || q.topic === topic;
        return matchExam && matchTopic;
      });
      const existingOrders = scopedQuestions
        .map((q: any) => Number(q.sortOrder))
        .filter((n: number) => !isNaN(n) && n > 0);
      let next = 1;
      while (existingOrders.includes(next)) {
        next++;
      }
      return next;
    }
    return 1;
  };

  // --- Sticky Creation Memory Helpers per Tab ---
  const getStickyFormData = (tab: string) => {
    let sticky: any = {};
    try {
      const stored = sessionStorage.getItem(`oep_sticky_${tab}`);
      if (stored) sticky = JSON.parse(stored);
    } catch(e) {}

    // Fallback to active drill-down filters if sticky doesn't have them
    if (tab === 'banks' || tab === 'practice') {
      if (!sticky.examId && selectedExamIdForBanks) sticky.examId = selectedExamIdForBanks;
      if (!sticky.type && bankFilter && bankFilter !== 'all') sticky.type = bankFilter;
      const effectiveMode = tab === 'practice' || (tab === 'banks' && bankSubTab === 'practice') ? 'practice' : 'bank';
      sticky.target_mode = effectiveMode;
      sticky.sortOrder = getNextAvailableOrder(tab, sticky.examId, sticky.type || 'topic-wise', sticky.target_mode);
    } else if (tab === 'tests') {
      if (!sticky.examId && selectedExamIdForTests) sticky.examId = selectedExamIdForTests;
      if (!sticky.mockCategory && selectedCategoryForTests) sticky.mockCategory = selectedCategoryForTests;
      sticky.sortOrder = getNextAvailableOrder('tests', sticky.examId, sticky.mockCategory || 'full-length');
    } else if (tab === 'questions') {
      if (!sticky.targetExamId && filterExamId && filterExamId !== 'all') sticky.targetExamId = filterExamId;
      if (!sticky.topic && selectedTargetIdForQuestions && selectedTypeForQuestions === 'bank') sticky.topic = selectedTargetIdForQuestions;
      if (!sticky.topic && selectedTargetIdForQuestions && selectedTypeForQuestions === 'mock') sticky.topic = `mockTest__${selectedTargetIdForQuestions}`;
      sticky.sortOrder = getNextAvailableOrder('questions', sticky.targetExamId, undefined, undefined, sticky.topic);
    } else if (tab === 'series') {
      if (!sticky.examId && selectedExamIdForSeries) sticky.examId = selectedExamIdForSeries;
    } else if (tab === 'exams') {
      if (!sticky.examCategory && examFilter && examFilter !== 'all') sticky.examCategory = examFilter;
    }

    return {
      ...initialFormData,
      ...sticky,
      // Always reset unique entity fields so new entry is clean
      title: '',
      name: '',
      questionText: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      explanation: '',
      diagram: null,
      pdfLinks: []
    };
  };

  const saveStickyFormData = (tab: string, currentData: any) => {
    try {
      let sticky: any = {};
      if (tab === 'banks' || tab === 'practice') {
        sticky = {
          examId: currentData.examId,
          type: currentData.type,
          target_mode: currentData.target_mode || (tab === 'practice' ? 'practice' : 'bank'),
          mockSubject: currentData.mockSubject,
          tagline: currentData.tagline,
          isPremium: currentData.isPremium,
          price: currentData.price,
          originalPrice: currentData.originalPrice,
          scheduled_at: currentData.scheduled_at
        };
      } else if (tab === 'tests') {
        sticky = {
          examId: currentData.examId,
          mockCategory: currentData.mockCategory,
          mockSubject: currentData.mockSubject,
          durationMinutes: currentData.durationMinutes,
          totalMarks: currentData.totalMarks,
          negativeMarking: currentData.negativeMarking,
          isPremium: currentData.isPremium,
          price: currentData.price,
          originalPrice: currentData.originalPrice,
          scheduled_at: currentData.scheduled_at
        };
      } else if (tab === 'questions') {
        sticky = {
          targetExamId: currentData.targetExamId || currentData.examId,
          topic: currentData.topic,
          difficulty: currentData.difficulty
        };
      } else if (tab === 'series') {
        sticky = {
          examId: currentData.examId,
          price: currentData.price,
          originalPrice: currentData.originalPrice,
          durationDays: currentData.durationDays,
          scheduled_at: currentData.scheduled_at
        };
      } else if (tab === 'exams') {
        sticky = {
          examCategory: currentData.examCategory,
          isPremium: currentData.isPremium,
          price: currentData.price,
          originalPrice: currentData.originalPrice
        };
      }
      sessionStorage.setItem(`oep_sticky_${tab}`, JSON.stringify(sticky));
    } catch(e) {}
  };

  // Real-time auto-saving of sticky configuration when editing new item in modal
  useEffect(() => {
    if (showAddModal && !editingId) {
      saveStickyFormData(activeTab, formData);
    }
  }, [formData.isPremium, formData.price, formData.originalPrice, formData.scheduled_at, formData.examId, formData.type, formData.tagline, formData.mockCategory, formData.mockSubject, showAddModal, editingId, activeTab]);

  const resetStickyFormData = (tab: string) => {
    try {
      sessionStorage.removeItem(`oep_sticky_${tab}`);
    } catch(e) {}
    const initial = { ...initialFormData };
    if (tab === 'practice' || (tab === 'banks' && bankSubTab === 'practice')) initial.target_mode = 'practice';
    else if (tab === 'banks') initial.target_mode = 'bank';
    initial.tagline = '';
    initial.isPremium = false;
    initial.price = 499;
    initial.originalPrice = 999;
    initial.scheduled_at = '';
    setFormData(initial);
    setDiagramText('');
    setBankQuestionsJson('');
    setBankAnswerKeyJson('');
    setBankQuestionsFileName('');
    setBankAnswerKeyFileName('');
  };

  // --- Sticky Bulk Memory Helpers per Tab ---
  const getStickyBulkData = (tab: string) => {
    let sticky: any = {};
    try {
      const stored = sessionStorage.getItem(`oep_sticky_bulk_${tab}`);
      if (stored) sticky = JSON.parse(stored);
    } catch(e) {}

    let defExam = sticky.examId;
    if (!defExam) {
      if (tab === 'banks' || tab === 'practice') defExam = selectedExamIdForBanks || '';
      else if (tab === 'tests') defExam = selectedExamIdForTests || '';
    }

    let defCat = sticky.category;
    if (!defCat) {
      if (tab === 'banks' || tab === 'practice') defCat = (bankFilter !== 'all' ? bankFilter : 'topic-wise') || 'topic-wise';
      else if (tab === 'tests') defCat = selectedCategoryForTests || 'full-length';
    }

    let defMode = sticky.target_mode;
    if (!defMode) {
      defMode = tab === 'practice' ? 'practice' : 'bank';
    }

    return {
      examId: defExam || '',
      category: defCat || (tab === 'tests' ? 'full-length' : 'topic-wise'),
      target_mode: defMode || (tab === 'practice' ? 'practice' : 'bank'),
      isPremium: sticky.isPremium ?? false,
      price: sticky.price ?? 499,
      originalPrice: sticky.originalPrice ?? 999,
      scheduled_at: sticky.scheduled_at || '',
      durationMinutes: sticky.durationMinutes ?? 60,
      totalMarks: sticky.totalMarks ?? 100,
      negativeMarking: sticky.negativeMarking ?? 0,
      jsonInput: sticky.jsonInput || ''
    };
  };

  const saveStickyBulkData = (tab: string, data: any) => {
    try {
      sessionStorage.setItem(`oep_sticky_bulk_${tab}`, JSON.stringify(data));
    } catch(e) {}
  };

  const resetStickyBulkData = (tab: string) => {
    try {
      sessionStorage.removeItem(`oep_sticky_bulk_${tab}`);
    } catch(e) {}
    let defExam = '';
    if (tab === 'banks' || tab === 'practice') defExam = selectedExamIdForBanks || '';
    else if (tab === 'tests') defExam = selectedExamIdForTests || '';

    let defCat = tab === 'tests' ? (selectedCategoryForTests || 'full-length') : ((bankFilter !== 'all' ? bankFilter : 'topic-wise') || 'topic-wise');
    let defMode: 'bank' | 'practice' | 'both' = tab === 'practice' ? 'practice' : 'bank';

    setBulkGlobalExamId(defExam);
    setBulkGlobalCategory(defCat);
    setBulkGlobalTargetMode(defMode);
    setBulkGlobalIsPremium(false);
    setBulkGlobalPrice(499);
    setBulkGlobalOriginalPrice(999);
    setBulkGlobalScheduledAt('');
    setBulkGlobalDurationMinutes(60);
    setBulkGlobalTotalMarks(100);
    setBulkGlobalNegativeMarking(0);
    setBulkJsonInput('');
    setBulkResults(null);
  };

  // Real-time auto-saving of sticky bulk configuration when editing in modal
  useEffect(() => {
    if (showBulkModal) {
      saveStickyBulkData(activeTab, {
        examId: bulkGlobalExamId,
        category: bulkGlobalCategory,
        target_mode: bulkGlobalTargetMode,
        isPremium: bulkGlobalIsPremium,
        price: bulkGlobalPrice,
        originalPrice: bulkGlobalOriginalPrice,
        scheduled_at: bulkGlobalScheduledAt,
        durationMinutes: bulkGlobalDurationMinutes,
        totalMarks: bulkGlobalTotalMarks,
        negativeMarking: bulkGlobalNegativeMarking,
        jsonInput: bulkJsonInput
      });
    }
  }, [
    showBulkModal,
    activeTab,
    bulkGlobalExamId,
    bulkGlobalCategory,
    bulkGlobalTargetMode,
    bulkGlobalIsPremium,
    bulkGlobalPrice,
    bulkGlobalOriginalPrice,
    bulkGlobalScheduledAt,
    bulkGlobalDurationMinutes,
    bulkGlobalTotalMarks,
    bulkGlobalNegativeMarking,
    bulkJsonInput
  ]);

  const openAddModal = (targetTab = activeTab) => {
    setEditingId(null);
    const initial = getStickyFormData(targetTab);
    if (targetTab === 'practice' || (targetTab === 'banks' && bankSubTab === 'practice')) {
      initial.target_mode = 'practice';
    } else if (targetTab === 'banks') {
      initial.target_mode = 'bank';
    }
    // Always dynamically re-calculate the fresh next available order from latest state
    initial.sortOrder = getNextAvailableOrder(
      targetTab,
      initial.examId,
      initial.type || 'topic-wise',
      initial.target_mode,
      initial.topic
    );
    setFormData(initial);
    setDiagramText('');
    setBankQuestionsJson('');
    setBankAnswerKeyJson('');
    setBankQuestionsFileName('');
    setBankAnswerKeyFileName('');
    setShowAddModal(true);
  };

  // Hero Card state
  const DEFAULT_HERO_CARD = {
    examLabel: 'OPSC Prelims Mock',
    questionNumber: 'Q. 42',
    questionText: 'The historical Sun Temple of Konark, a UNESCO World Heritage site, was constructed by which ruler of the Eastern Ganga Dynasty?',
    options: ['Anantavarman Chodagangadeva', 'Narasimhadeva I', 'Kapilendradeva', 'Purushottamadeva'],
    correctIndex: 1,
    explanation: 'King Langula Narasimhadeva I built the Konark Sun Temple in the 13th century (circa 1250 CE) to celebrate his military victories.',
    marks: 1.00,
    penalty: 0.25,
  };
  const [heroCard, setHeroCard] = useState<any>(DEFAULT_HERO_CARD);

  // Exam Registry state
  const STATUS_OPTIONS = [
    { value: 'notification', label: 'Notification Released', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    { value: 'admit-card', label: 'Admit Card Out', color: 'bg-amber-50 text-amber-700 border-amber-100' },
    { value: 'applications', label: 'Applications Active', color: 'bg-blue-50 text-blue-700 border-blue-100' },
    { value: 'result', label: 'Result Declared', color: 'bg-purple-50 text-purple-700 border-purple-100' },
    { value: 'postponed', label: 'Postponed', color: 'bg-rose-50 text-rose-700 border-rose-100' },
    { value: 'upcoming', label: 'Upcoming', color: 'bg-slate-50 text-slate-600 border-slate-200' },
  ];
  const DEFAULT_EXAM_REGISTRY = [
    { exam: 'OPSC Civil Services Examination (OCS)', status: 'notification', date: 'Prelims: July 15, 2026', actionLabel: 'Practice OPSC', examKey: 'opsc' },
    { exam: 'OSSC Combined Graduate Level (CGL)', status: 'admit-card', date: 'Exam: June 28, 2026', actionLabel: 'Practice OSSC', examKey: 'ossc' },
    { exam: 'OSSSC RI/ARI & Amin Recruitment', status: 'applications', date: 'Closing: June 30, 2026', actionLabel: 'Practice OSSSC', examKey: 'osssc' },
  ];
  const [examRegistry, setExamRegistry] = useState<any[]>(DEFAULT_EXAM_REGISTRY);
  
  const DEFAULT_NEWS_UPDATES = [
    `🚀 New Mock Test Series released for OSSC CGL ${new Date().getFullYear()}`,
    "📅 OPSC Prelims exam dates announced - Check latest schedule",
    "⭐ 500+ New PYQs added for OSSSC recruitment exams",
    "🔥 Weekly Current Affairs PDF now available for download",
    "✅ Real-time rank analysis enabled for all premium mock tests"
  ].join('\n');

  // Syllabus Roadmaps state
  const DEFAULT_SYLLABUS_ROADMAPS = [
    {
      id: 'gs', label: 'General Studies',
      topics: [
        { name: 'Odisha History & Heritage', count: 12, label: 'Crucial for OPSC Prelims' },
        { name: 'Indian Constitution & Polity', count: 8, label: 'Core Weightage' },
        { name: 'Geography of Odisha & Climate', count: 10, label: 'High-scoring Section' },
        { name: 'General Science & Technology', count: 15, label: 'Daily Current Mappings' },
      ],
    },
    {
      id: 'lang', label: 'Language Core',
      topics: [
        { name: 'Odia Grammar & Composition', count: 8, label: 'OSSC CGL Compulsory' },
        { name: 'English Comprehension', count: 6, label: 'Vocabulary & Common Errors' },
        { name: 'Translation & Precise Writing', count: 4, label: 'Mains Answer Prep' },
      ],
    },
    {
      id: 'quant', label: 'Aptitude & DI',
      topics: [
        { name: 'Number System & Arithmetic', count: 14, label: 'OSSSC Exam Primary Focus' },
        { name: 'Logical Reasoning & Analogies', count: 12, label: 'Timer Speed Practice' },
        { name: 'Data Interpretation (DI) Charts', count: 9, label: 'High-level Practice Sets' },
      ],
    },
  ];
  const [syllabusRoadmaps, setSyllabusRoadmaps] = useState<any[]>(DEFAULT_SYLLABUS_ROADMAPS);
  const [syllabusActiveTab, setSyllabusActiveTab] = useState(0);
  const [achieversJournal, setAchieversJournal] = useState<any[]>(DEFAULT_ACHIEVERS_JOURNAL);
  const [achieverSearch, setAchieverSearch] = useState('');
  const [editingAchieverIndex, setEditingAchieverIndex] = useState<number | null>(null);
  const [isAddingAchiever, setIsAddingAchiever] = useState(false);
  const [achieverForm, setAchieverForm] = useState<AchieverStory>({
    name: '',
    rank: '',
    examCategory: 'opsc',
    story: '',
    avatar: '',
    stats: { score: '', accuracy: '', time: '' },
    district: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [subscriberSearchQuery, setSubscriberSearchQuery] = useState('');
  const [focusedPrep, setFocusedPrep] = useState<any[]>([
    { label: 'OPSC CGL', examId: '' },
    { label: 'OSSC LSI', examId: '' },
    { label: 'OSSSC RI/ARI', examId: '' },
    { label: 'Police SI', examId: '' },
    { label: 'Forest Guard', examId: '' }
  ]);

  // Ref to abort in-flight question fetches when a newer request comes in
  const fetchQuestionsAbortRef = useRef<AbortController | null>(null);

  const [questionsPage, setQuestionsPage] = useState(1);
  const [questionsLimit] = useState(50);
  const [questionsTotalCount, setQuestionsTotalCount] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const fetchQuestions = async (
    page = questionsPage, 
    search = searchQuery, 
    examId = filterExamId, 
    qFilter = questionFilter,
    topicVal = selectedTypeForQuestions === 'mock' 
      ? (selectedTargetIdForQuestions ? `mockTest__${selectedTargetIdForQuestions}` : 'all')
      : (selectedTypeForQuestions === 'bank' ? (selectedTargetIdForQuestions || 'all') : 'all')
  ) => {
    // Cancel any in-flight request to prevent stale responses overwriting fresh ones
    if (fetchQuestionsAbortRef.current) {
      fetchQuestionsAbortRef.current.abort();
    }
    const abortController = new AbortController();
    fetchQuestionsAbortRef.current = abortController;

    setLoadingQuestions(true);
    try {
      const result = await examService.getQuestionsPaginated(page, questionsLimit, search, examId, qFilter, topicVal, abortController.signal);
      if (abortController.signal.aborted) return; // Superseded — ignore result
      if (result.success) {
        setQuestions(result.data || []);
        setQuestionsTotalCount(result.totalCount || 0);
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // Gracefully ignore cancelled request
      console.error("Failed to load paginated questions:", err);
    } finally {
      if (!abortController.signal.aborted) {
        setLoadingQuestions(false);
      }
    }
  };

  const fetchData = async () => {
    // Only show global loading state if there is zero cached data in memory/state
    if (!exams.length && !mockTests.length && !banks.length && !series.length) {
      setLoading(true);
    }
    try {
      // 1. Kick off catalog queries immediately in parallel
      const catalogPromise = Promise.all([
        examService.getAllTestSeries(),
        examService.getAllMockTestsLite(),
        examService.getAllExams(),
        examService.getAllQuestionBanks(),
      ]);

      // 2. Kick off user fetch in parallel
      const usersPromise = (async () => {
        try {
          const session = (await supabase.auth.getSession()).data.session;
          const token = session?.access_token;
          if (token) {
            const res = await fetch('/api/admin/users', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) return await res.json();
          }
        } catch(e) {
          console.error("Error fetching admin users:", e);
        }
        return [] as any[];
      })();

      // 3. Await all promises simultaneously for minimum network latency
      const [[ss, ts, ex, bks], fetchedUsers] = await Promise.all([
        catalogPromise,
        usersPromise
      ]);

      setSeries(ss || []);
      setMockTests(ts || []);
      setExams(ex || []);
      setBanks(bks || []);
      if (fetchedUsers && fetchedUsers.length > 0) setUsers(fetchedUsers);

      // Persist fresh catalog snapshot to SWR cache for instant 0ms subsequent loads
      saveAdminCatalogCache({ ss, ts, ex, bks, fetchedUsers });

      const settingsExam = ex.find(e => e.name === 'SYSTEM_SETTINGS_YOUTUBE_RESERVED');
      if (settingsExam && settingsExam.description) {
        try {
          const parsed = JSON.parse(settingsExam.description);
          if (parsed.videos) setYoutubeVideosInput(parsed.videos.join('\n'));
        } catch(e) {}
      }

      const newsSettings = ex.find(e => e.name === 'SYSTEM_SETTINGS_NEWS_TICKER');
      if (newsSettings && newsSettings.description) {
        try {
          const parsed = JSON.parse(newsSettings.description);
          if (parsed.updates) setNewsUpdatesInput(parsed.updates.join('\n'));
        } catch(e) {}
      } else {
        setNewsUpdatesInput(DEFAULT_NEWS_UPDATES);
      }

      const heroSettings = ex.find(e => e.name === 'SYSTEM_SETTINGS_HERO_CARD');
      if (heroSettings && heroSettings.description) {
        try {
          const parsed = JSON.parse(heroSettings.description);
          setHeroCard({ ...DEFAULT_HERO_CARD, ...parsed });
        } catch(e) {}
      }

      const registrySettings = ex.find(e => e.name === 'SYSTEM_SETTINGS_EXAM_REGISTRY');
      if (registrySettings && registrySettings.description) {
        try {
          const parsed = JSON.parse(registrySettings.description);
          if (Array.isArray(parsed) && parsed.length > 0) setExamRegistry(parsed);
        } catch(e) {}
      }

      const syllabusSettings = ex.find(e => e.name === 'SYSTEM_SETTINGS_SYLLABUS_ROADMAPS');
      if (syllabusSettings && syllabusSettings.description) {
        try {
          const parsed = JSON.parse(syllabusSettings.description);
          if (Array.isArray(parsed) && parsed.length > 0) { setSyllabusRoadmaps(parsed); setSyllabusActiveTab(0); }
        } catch(e) {}
      }

      const achieversSettings = ex.find(e => e.name === 'SYSTEM_SETTINGS_ACHIEVERS_JOURNAL');
      if (achieversSettings && achieversSettings.description) {
        try {
          const parsed = JSON.parse(achieversSettings.description);
          if (Array.isArray(parsed) && parsed.length > 0) setAchieversJournal(parsed);
        } catch(e) {}
      }

      const focusedPrepSettings = ex.find(e => e.name === 'SYSTEM_SETTINGS_FOCUSED_PREPARATION');
      if (focusedPrepSettings && focusedPrepSettings.description) {
        try {
          const parsed = JSON.parse(focusedPrepSettings.description);
          if (Array.isArray(parsed) && parsed.length > 0) setFocusedPrep(parsed);
        } catch(e) {}
      }

      const mockTestConfigSettings = ex.find(e => e.name === 'SYSTEM_SETTINGS_MOCK_TEST_CONFIG');
      if (mockTestConfigSettings && mockTestConfigSettings.description) {
        try {
          const parsed = JSON.parse(mockTestConfigSettings.description);
          if (parsed.sortDirection) setTestSortDirection(parsed.sortDirection);
        } catch(e) {}
      }

      try {
        const { data: subs, error: subsErr } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .order('created_at', { ascending: false });
        if (!subsErr && subs) setSubscribers(subs);
      } catch (e) {}

      // Questions are fetched independently by the questions useEffect below —
      // do NOT call fetchQuestions here to avoid race conditions and state wipes.
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBankInlineOrderChange = async (bankId: string, newOrder: number) => {
    try {
      const { error } = await supabase
        .from('questionBanks')
        .update({ sortOrder: newOrder })
        .eq('id', bankId);
      if (error) {
        console.error("Failed to update bank sortOrder:", error);
      } else {
        setBanks(prev => prev.map(b => b.id === bankId ? { ...b, sortOrder: newOrder } : b));
      }
    } catch (err) {
      console.error("Error updating bank sortOrder:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    sessionStorage.setItem('oep_adminActiveTab', activeTab);
  }, [activeTab]);

  // Persist questions navigation state to sessionStorage so a page refresh restores the view
  useEffect(() => {
    if (selectedExamIdForQuestions) sessionStorage.setItem('oep_qs_examId', selectedExamIdForQuestions);
    else sessionStorage.removeItem('oep_qs_examId');
  }, [selectedExamIdForQuestions]);

  useEffect(() => {
    if (selectedTypeForQuestions) sessionStorage.setItem('oep_qs_type', selectedTypeForQuestions);
    else sessionStorage.removeItem('oep_qs_type');
  }, [selectedTypeForQuestions]);

  useEffect(() => {
    if (selectedCategoryForQuestions) sessionStorage.setItem('oep_qs_category', selectedCategoryForQuestions);
    else sessionStorage.removeItem('oep_qs_category');
  }, [selectedCategoryForQuestions]);

  useEffect(() => {
    if (selectedTargetIdForQuestions) sessionStorage.setItem('oep_qs_targetId', selectedTargetIdForQuestions);
    else sessionStorage.removeItem('oep_qs_targetId');
  }, [selectedTargetIdForQuestions]);

  // Deep Page Persistence & URL Query String Synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    sessionStorage.setItem('oep_adminActiveTab', activeTab);

    if (selectedExamIdForSeries) sessionStorage.setItem('oep_series_examId', selectedExamIdForSeries);
    else sessionStorage.removeItem('oep_series_examId');

    if (selectedExamIdForBanks) sessionStorage.setItem('oep_banks_examId', selectedExamIdForBanks);
    else sessionStorage.removeItem('oep_banks_examId');

    if (selectedExamIdForTests) sessionStorage.setItem('oep_tests_examId', selectedExamIdForTests);
    else sessionStorage.removeItem('oep_tests_examId');

    if (selectedCategoryForTests) sessionStorage.setItem('oep_tests_category', selectedCategoryForTests);
    else sessionStorage.removeItem('oep_tests_category');

    sessionStorage.setItem('oep_bankSubTab', bankSubTab);
    sessionStorage.setItem('oep_bankFilter', bankFilter);

    // Synchronize browser address bar URL query params dynamically
    const params = new URLSearchParams();
    params.set('tab', activeTab);
    if (bankSubTab && bankSubTab !== 'banks') params.set('subTab', bankSubTab);
    if (selectedExamIdForSeries) params.set('series_examId', selectedExamIdForSeries);
    if (selectedExamIdForBanks) params.set('banks_examId', selectedExamIdForBanks);
    if (selectedExamIdForTests) params.set('tests_examId', selectedExamIdForTests);
    if (selectedExamIdForQuestions) params.set('examId', selectedExamIdForQuestions);
    if (selectedTypeForQuestions) params.set('type', selectedTypeForQuestions);
    if (selectedTargetIdForQuestions) params.set('targetId', selectedTargetIdForQuestions);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [
    activeTab,
    selectedExamIdForSeries,
    selectedExamIdForBanks,
    selectedExamIdForTests,
    selectedCategoryForTests,
    selectedExamIdForQuestions,
    selectedTypeForQuestions,
    selectedTargetIdForQuestions,
    bankSubTab,
    bankFilter
  ]);

  // Fetch questions whenever the active tab, page, filters, or selection changes
  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions(questionsPage, searchQuery, filterExamId, questionFilter);
    }
  }, [activeTab, questionsPage, searchQuery, filterExamId, questionFilter, selectedTargetIdForQuestions, selectedTypeForQuestions]);

  useEffect(() => {
    setQuestionsPage(1);
  }, [searchQuery, filterExamId, questionFilter, selectedTargetIdForQuestions, selectedTypeForQuestions]);

  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [
    activeTab, 
    questionsPage, 
    filterExamId, 
    questionFilter, 
    searchQuery, 
    selectedTargetIdForQuestions, 
    selectedTypeForQuestions,
    selectedExamIdForBanks,
    selectedExamIdForSeries,
    selectedExamIdForTests,
    selectedCategoryForTests
  ]);

  useEffect(() => {
    let list: any[] = [];
    if (activeTab === 'questions') {
      let filtered = questions;
      if (selectedExamIdForQuestions) {
        filtered = filtered.filter(q => q.examId === selectedExamIdForQuestions);
      }
      if (selectedTypeForQuestions === 'mock') {
        // Use exact prefix casing from DB: 'mockTest__' (capital T)
        filtered = filtered.filter(q => (q.topic || '').startsWith('mockTest__'));
        if (selectedTargetIdForQuestions) {
          filtered = filtered.filter(q => q.topic === `mockTest__${selectedTargetIdForQuestions}`);
        }
      } else if (selectedTypeForQuestions === 'bank') {
        filtered = filtered.filter(q => !(q.topic || '').startsWith('mockTest__'));
        if (selectedTargetIdForQuestions) {
          filtered = filtered.filter(q => q.topic === selectedTargetIdForQuestions);
        }
      }
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        filtered = filtered.filter(q => {
          const textMatch = (q.questionText || '').toLowerCase().includes(lowerQ);
          const topicMatch = (q.topic || '').toLowerCase().includes(lowerQ);
          let examNameMatch = false;
          let mockTitleMatch = false;
          if (q.examId) {
             const ex = exams.find(e => e.id === q.examId);
             if (ex && ex.name.toLowerCase().includes(lowerQ)) examNameMatch = true;
          }
          if ((q.topic || '').startsWith('mockTest__')) {
            const testId = q.topic.split('__')[1];
            const mt = mockTests.find(m => m.id === testId);
            if (mt && mt.title.toLowerCase().includes(lowerQ)) mockTitleMatch = true;
          }
          return textMatch || topicMatch || examNameMatch || mockTitleMatch;
        });
      }
      list = filtered;
    } else if (activeTab === 'series') {
       let filtered = series;
       if (selectedExamIdForSeries) {
         filtered = filtered.filter(s => s.examId === selectedExamIdForSeries);
       }
       if (searchQuery.trim()) {
         const lowerQ = searchQuery.toLowerCase();
         filtered = filtered.filter(s => (s.title || '').toLowerCase().includes(lowerQ));
       }
       list = filtered;
    } else if (activeTab === 'tests') {
      let filtered = mockTests;
      if (selectedCategoryForTests) {
        filtered = filtered.filter(mt => {
          let cat = 'full-length';
          try { if (mt.seriesId) cat = JSON.parse(mt.seriesId).category || 'full-length'; } catch(e){}
          return cat === selectedCategoryForTests;
        });
      }
      if (selectedExamIdForTests) {
        filtered = filtered.filter(mt => {
          let mtExam = '';
          try { if (mt.seriesId) mtExam = JSON.parse(mt.seriesId).examId || ''; } catch(e){}
          return mtExam === selectedExamIdForTests;
        });
      }
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        filtered = filtered.filter(mt => {
          const titleMatch = (mt.title || '').toLowerCase().includes(lowerQ);
          let examNameMatch = false;
          let catMatch = false;
          try {
            if (mt.seriesId) {
              const parsed = JSON.parse(mt.seriesId);
              const ex = exams.find(e => e.id === parsed.examId);
              if (ex && ex.name.toLowerCase().includes(lowerQ)) examNameMatch = true;
              if (parsed.category && parsed.category.toLowerCase().includes(lowerQ)) catMatch = true;
            }
          } catch(e){}
          return titleMatch || examNameMatch || catMatch;
        });
      }
      list = filtered;
    } else if (activeTab === 'exams') {
      let filtered = exams.filter(e => {
        const cat = (e.category || '').toLowerCase();
        const name = e.name || '';
        return cat !== 'blog' && cat !== 'system' && cat !== 'current_affairs' && cat !== 'current-affairs' && !name.startsWith('SYSTEM_SETTINGS_');
      });
      if (examFilter !== 'all') filtered = filtered.filter(e => e.category === examFilter);
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        filtered = filtered.filter(e => (e.name || '').toLowerCase().includes(lowerQ));
      }
      list = filtered;
    } else if (activeTab === 'blogs') {
      let filtered = exams.filter(e => e.category === 'blog');
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        filtered = filtered.filter(e => (e.name || '').toLowerCase().includes(lowerQ));
      }
      list = filtered;
    } else if (activeTab === 'banks' || activeTab === 'practice') {
      let filtered = banks;
      if (selectedExamIdForBanks) {
        filtered = filtered.filter(b => b.examId === selectedExamIdForBanks);
      }
      if (activeTab === 'banks') {
        if (bankSubTab === 'banks') {
          filtered = filtered.filter(b => (b.target_mode || 'both') !== 'practice');
        } else if (bankSubTab === 'practice') {
          filtered = filtered.filter(b => (b.target_mode || 'both') !== 'bank');
        }
      } else if (activeTab === 'practice') {
        filtered = filtered.filter(b => (b.target_mode || 'both') !== 'bank');
      }
      if (bankFilter !== 'all') filtered = filtered.filter(b => b.type === bankFilter);
      if (bankTargetModeFilter !== 'all') filtered = filtered.filter(b => (b.target_mode || 'both') === bankTargetModeFilter);
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        filtered = filtered.filter(b => {
          const titleMatch = (b.title || '').toLowerCase().includes(lowerQ);
          let examNameMatch = false;
          let catMatch = false;
          if (b.examId) {
             const ex = exams.find(e => e.id === b.examId);
             if (ex && ex.name.toLowerCase().includes(lowerQ)) examNameMatch = true;
          }
          if (b.type && b.type.toLowerCase().includes(lowerQ)) catMatch = true;
          return titleMatch || examNameMatch || catMatch;
        });
      }
      filtered = [...filtered].sort((a, b) => {
        const orderA = a.sortOrder ?? 9999;
        const orderB = b.sortOrder ?? 9999;
        return bankSortDirection === 'desc' ? orderB - orderA : orderA - orderB;
      });
      list = filtered;
    } else if (activeTab === 'users') {
      let filtered = users;
      if (searchQuery.trim()) {
        const lowerQ = searchQuery.toLowerCase();
        filtered = filtered.filter(u => 
          (u.email || '').toLowerCase().includes(lowerQ) || 
          (u.displayName || '').toLowerCase().includes(lowerQ)
        );
      }
      list = filtered;
    }
    
    // Strict ID deduplication across any active tab
    const uniqueMap = new Map();
    list.forEach(item => {
      if (item && item.id) uniqueMap.set(item.id, item);
    });
    list = Array.from(uniqueMap.values());

    // Sort local items by sortOrder if available
    let sorted = [...list];
    if (activeTab === 'tests') {
      const dir = testSortDirection;
      sorted.sort((a, b) => {
        let subjectA = '';
        let subjectB = '';
        try {
          if (a.seriesId) {
            const parsed = JSON.parse(a.seriesId);
            if (parsed.category === 'sectional') {
              subjectA = parsed.subject || '';
            }
          }
        } catch(e) {}
        try {
          if (b.seriesId) {
            const parsed = JSON.parse(b.seriesId);
            if (parsed.category === 'sectional') {
              subjectB = parsed.subject || '';
            }
          }
        } catch(e) {}
        
        if (subjectA !== subjectB) {
          return subjectA.localeCompare(subjectB);
        }
        
        const orderA = a.sortOrder ?? 9999;
        const orderB = b.sortOrder ?? 9999;
        return dir === 'desc' ? orderB - orderA : orderA - orderB;
      });
    } else {
      sorted.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }
    setItems(sorted);
  }, [activeTab, questions, series, mockTests, exams, banks, users, filterExamId, searchQuery, examFilter, questionFilter, testFilter, bankFilter, bankTargetModeFilter, bankSubTab, testSortDirection, selectedExamIdForTests, selectedCategoryForTests, selectedExamIdForBanks, selectedExamIdForSeries, selectedExamIdForQuestions, selectedTypeForQuestions, selectedCategoryForQuestions, selectedTargetIdForQuestions]);

  const actualExams = React.useMemo(() => {
    return exams.filter(e => {
      const cat = (e.category || '').toLowerCase();
      const name = e.name || '';
      return cat !== 'blog' && cat !== 'system' && cat !== 'current_affairs' && cat !== 'current-affairs' && !name.startsWith('SYSTEM_SETTINGS_');
    });
  }, [exams]);

  const validateChangeBeforePublish = (type: 'exam' | 'series' | 'test' | 'bank', payload: any, isEdit: boolean) => {
    let nextExams = [...exams];
    let nextSeries = [...series];
    let nextMockTests = [...mockTests];
    let nextBanks = [...banks];

    const targetId = editingId || 'new_item_temp_id';

    if (type === 'exam') {
      if (isEdit) {
        nextExams = exams.map(e => e.id === targetId ? { ...e, ...payload } : e);
      } else {
        nextExams.push({ id: targetId, ...payload });
      }
    } else if (type === 'series') {
      if (isEdit) {
        nextSeries = series.map(s => s.id === targetId ? { ...s, ...payload } : s);
      } else {
        nextSeries.push({ id: targetId, ...payload });
      }
    } else if (type === 'test') {
      if (isEdit) {
        nextMockTests = mockTests.map(t => t.id === targetId ? { ...t, ...payload } : t);
      } else {
        nextMockTests.push({ id: targetId, ...payload });
      }
    } else if (type === 'bank') {
      if (isEdit) {
        nextBanks = banks.map(b => b.id === targetId ? { ...b, ...payload } : b);
      } else {
        nextBanks.push({ id: targetId, ...payload });
      }
    }

    // Proactive Change-Impact Warning Framework
    const warnings: string[] = [];
    if (isEdit) {
      if (type === 'test') {
        const original = mockTests.find(t => t.id === targetId);
        if (original) {
          const wasPremium = original.isPremium ?? false;
          const isNowPremium = payload.isPremium ?? wasPremium;
          if (!wasPremium && isNowPremium) {
            warnings.push("• Pricing Model Transition (Free → Premium): Changing this mock test to Premium will restrict guest access. Legacy bundle/series owners will inherit access.");
          }
          const oldExam = original.examId || '';
          const newExam = payload.examId || '';
          if (oldExam && newExam && oldExam !== newExam) {
            warnings.push(`• Catalog Reorganization (Orphan Risk): Moving test from Exam '${oldExam}' to '${newExam}'. Bundle owners may lose access unless registered in HISTORICAL_BUNDLE_COMPOSITIONS.`);
          }
        }
      } else if (type === 'bank') {
        const original = banks.find(b => b.id === targetId);
        if (original) {
          const wasPremium = original.isPremium ?? false;
          const isNowPremium = payload.isPremium ?? wasPremium;
          if (!wasPremium && isNowPremium) {
            warnings.push("• Pricing Model Transition (Free → Premium): Changing this question bank to Premium will restrict guest access. Exam bundle owners will inherit access.");
          }
          const oldExam = original.examId || '';
          const newExam = payload.examId || '';
          if (oldExam && newExam && oldExam !== newExam) {
            warnings.push(`• Catalog Reorganization (Orphan Risk): Moving question bank from Exam '${oldExam}' to '${newExam}'.`);
          }
        }
      }
    }

    if (warnings.length > 0) {
      const msg = `PROACTIVE CHANGE-IMPACT WARNING:\n\n${warnings.join('\n')}\n\nDo you want to proceed and publish these modifications?`;
      if (!confirm(msg)) {
        return false;
      }
    }

    const validation = validateCatalogEntitlements({
      exams: nextExams,
      mockTests: nextMockTests,
      testSeries: nextSeries,
      questionBanks: nextBanks,
    });

    if (!validation.isValid) {
      const msg = `Conflict or Mismatch Warning:\n\n${validation.errors.join('\n')}\n\nDo you want to proceed and publish these changes anyway?`;
      return confirm(msg);
    }
    return true;
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    // Optimistic UI update: instantly remove from the local state arrays
    if (activeTab === 'questions') setQuestions(prev => prev.filter(q => q.id !== id));
    else if (activeTab === 'series') setSeries(prev => prev.filter(s => s.id !== id));
    else if (activeTab === 'tests') setMockTests(prev => prev.filter(t => t.id !== id));
    else if (activeTab === 'exams' || activeTab === 'blogs') setExams(prev => prev.filter(ex => ex.id !== id));
    else if (activeTab === 'banks') {
      const target = banks.find(b => b.id === id);
      if (target && target.target_mode === 'both') {
        setBanks(prev => prev.map(b => b.id === id ? { ...b, target_mode: 'practice' } : b));
      } else {
        setBanks(prev => prev.filter(b => b.id !== id));
      }
    } else if (activeTab === 'practice') {
      const target = banks.find(b => b.id === id);
      if (target && target.target_mode === 'both') {
        setBanks(prev => prev.map(b => b.id === id ? { ...b, target_mode: 'bank' } : b));
      } else {
        setBanks(prev => prev.filter(b => b.id !== id));
      }
    }

    try {
      if (activeTab === 'questions') await examService.deleteQuestion(id);
      else if (activeTab === 'series') await examService.deleteTestSeries(id);
      else if (activeTab === 'tests') await examService.deleteMockTest(id);
      else if (activeTab === 'exams' || activeTab === 'blogs') await examService.deleteExam(id);
      else if (activeTab === 'banks') {
        const target = banks.find(b => b.id === id);
        if (target && target.target_mode === 'both') {
          await examService.updateQuestionBank(id, { target_mode: 'practice' });
        } else {
          await examService.deleteQuestionBank(id);
        }
      } else if (activeTab === 'practice') {
        const target = banks.find(b => b.id === id);
        if (target && target.target_mode === 'both') {
          await examService.updateQuestionBank(id, { target_mode: 'bank' });
        } else {
          await examService.deleteQuestionBank(id);
        }
      }
      
      // Fetch data in the background to ensure consistency, without blocking the UI
      fetchData();
    } catch (error: any) {
      alert('Error deleting item: ' + (error.message || error));
      console.error("Delete Error:", error);
      // If error occurs, re-fetch to restore the item in the UI
      fetchData();
    }
  };

  const handleEditClick = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    
    let newData = { ...initialFormData };
    if (activeTab === 'banks' || activeTab === 'practice') {
      let parsedTagline: any = { text: '', price: 499, originalPrice: 999, subject: '' };
      try { 
        if (item.tagline && (item.tagline.includes('{"text"') || item.tagline.startsWith('{'))) {
           parsedTagline = JSON.parse(item.tagline);
        }
      } catch(e) {}

      newData = {
        ...newData,
        examId: item.examId || '',
        mockSubject: parsedTagline.subject || (item as any).subject || '',
        type: item.type || 'topic-wise',
        target_mode: (item.target_mode || 'both') as 'bank' | 'practice' | 'both',
        title: item.title || '',
        questionCount: item.questionCount || 0,
        tagline: parsedTagline.text,
        price: parsedTagline.price || 499,
        originalPrice: parsedTagline.originalPrice || ((parsedTagline.price || 499) * 2),
        image: item.image || '',
        isPremium: item.isPremium || false,
        pdfUrl: item.pdfUrl || '',
        pdfLinks: (() => {
          if (!item.pdfUrl) return [];
          try {
            const parsed = JSON.parse(item.pdfUrl);
            if (Array.isArray(parsed)) {
              return parsed.filter((l: any) => l && typeof l.url === 'string' && (l.url.startsWith('http://') || l.url.startsWith('https://') || l.url.startsWith('/')));
            }
            if (parsed && typeof parsed === 'object') {
              if (Array.isArray(parsed.pdfLinks)) {
                return parsed.pdfLinks.filter((l: any) => l && typeof l.url === 'string' && (l.url.startsWith('http://') || l.url.startsWith('https://') || l.url.startsWith('/')));
              }
              return [];
            }
            if (typeof item.pdfUrl === 'string' && (item.pdfUrl.startsWith('http://') || item.pdfUrl.startsWith('https://'))) {
              return [{ title: 'Download Attached PDF', url: item.pdfUrl }];
            }
            return [];
          } catch (e) {
            if (typeof item.pdfUrl === 'string' && (item.pdfUrl.startsWith('http://') || item.pdfUrl.startsWith('https://'))) {
              return [{ title: 'Download Attached PDF', url: item.pdfUrl }];
            }
            return [];
          }
        })(),
        hasPracticeMode: item.hasPracticeMode ?? true,
        scheduled_at: item.scheduled_at ? (() => {
          const d = new Date(item.scheduled_at);
          if (isNaN(d.getTime())) return '';
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        })() : ''
      };
    } else if (activeTab === 'exams') {
      let parsedExamMeta: any = {};
      if (item.description && typeof item.description === 'string' && item.description.startsWith('JSON_METADATA_')) {
        try {
          parsedExamMeta = JSON.parse(item.description.replace('JSON_METADATA_', ''));
        } catch(e) {}
      }

      const isExamPremium = parsedExamMeta.isPremium !== undefined
        ? Boolean(parsedExamMeta.isPremium)
        : Boolean(parsedExamMeta.price && Number(parsedExamMeta.price) > 0);

      newData = {
        ...newData,
        name: item.name || '',
        icon: item.icon || 'BookOpen',
        examCategory: item.category || 'popular',
        examDate: parsedExamMeta.examDate || item.examDate || '',
        metaTitle: item.metaTitle || '',
        metaDescription: item.metaDescription || '',
        keywords: item.keywords || '',
        targetExamId: item.targetExamId || '',
        isPremium: isExamPremium,
        price: (parsedExamMeta.price && Number(parsedExamMeta.price) > 0) ? Number(parsedExamMeta.price) : 499,
        originalPrice: (parsedExamMeta.originalPrice && Number(parsedExamMeta.originalPrice) > 0) ? Number(parsedExamMeta.originalPrice) : 999,
        description: parsedExamMeta.description !== undefined ? parsedExamMeta.description : (item.description || ''),
        examDateStatus: parsedExamMeta.examDateStatus || (parsedExamMeta.examDate || item.examDate ? 'published' : 'tba'),
        formFillupStatus: parsedExamMeta.formFillupStatus || 'tba',
        formFillupEndDate: parsedExamMeta.formFillupEndDate || ''
      };
    } else if (activeTab === 'blogs') {
      newData = {
        ...newData,
        name: item.name || '',
        description: item.description || '',
        icon: item.icon || '',
        examDate: item.examDate || '',
        metaTitle: item.metaTitle || '',
        metaDescription: item.metaDescription || '',
        keywords: item.keywords || '',
        targetExamId: item.targetExamId || ''
      };
    } else if (activeTab === 'questions') {
      let mockCategory = 'full-length';
      if ((item.topic || '').startsWith('mockTest__')) {
        const testId = item.topic.split('__')[1];
        const mt = mockTests.find(m => m.id === testId);
        if (mt && mt.seriesId) {
          try { mockCategory = JSON.parse(mt.seriesId).category || 'full-length'; } catch(e){}
        }
      }

      newData = {
        ...newData,
        examId: item.examId || '',
        topic: item.topic || '',
        mockCategory: mockCategory,
        difficulty: item.difficulty || 'medium',
        questionText: item.questionText || '',
        options: item.options || ['', '', '', ''],
        correctAnswerIndex: item.correctAnswerIndex || 0,
        explanation: item.explanation || '',
        diagram: item.diagram || null
      };
    } else if (activeTab === 'series') {
      newData = {
        ...newData,
        examId: item.examId || '',
        title: item.title || '',
        description: item.description || '',
        price: item.price || 499,
        durationDays: item.durationDays || 30
      };
    } else if (activeTab === 'tests') {
      let parsedMockConfig: any = { examId: '', category: 'full-length', subject: '', isPremium: false, price: 499, originalPrice: 999, scheduled_at: null };
      try {
        if (item.seriesId) parsedMockConfig = JSON.parse(item.seriesId);
      } catch(e) {}
      
      newData = {
        ...newData,
        examId: parsedMockConfig.examId || '',
        mockCategory: parsedMockConfig.category || 'full-length',
        mockSubject: parsedMockConfig.subject || '',
        isPremium: parsedMockConfig.isPremium || false,
        price: parsedMockConfig.price || 499,
        originalPrice: parsedMockConfig.originalPrice || ((parsedMockConfig.price || 499) * 2),
        seriesId: item.seriesId || '',
        title: item.title || '',
        durationMinutes: item.durationMinutes || 60,
        totalMarks: item.totalMarks || 100,
        negativeMarking: item.negativeMarking || 0,
        sortOrder: item.sortOrder || '',
        scheduled_at: (item.scheduled_at || parsedMockConfig.scheduled_at) ? (() => {
          const raw = item.scheduled_at || parsedMockConfig.scheduled_at;
          const d = new Date(raw);
          if (isNaN(d.getTime())) return '';
          const pad = (n: number) => n.toString().padStart(2, '0');
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        })() : ''
      };
    }
    
    if (activeTab === 'questions') {
      setDiagramText(item.diagram ? JSON.stringify(item.diagram, null, 2) : '');
    }
    setFormData(newData);
    setShowAddModal(true);
  };
  // --- Bulk JSON Importer Handler ---
  const handleBulkImport = async () => {
    if (!bulkGlobalExamId) { alert('Please select an exam first.'); return; }
    let items: any[] = [];
    try {
      const cleaned = bulkJsonInput.trim();
      items = JSON.parse(cleaned);
      if (!Array.isArray(items) || items.length === 0) {
        alert('JSON must be a non-empty array: [ { "title": "...", "subject": "..." }, ... ]');
        return;
      }
    } catch (e) {
      alert('Invalid JSON. Please check your input and try again.');
      return;
    }

    setBulkLoading(true);
    setBulkResults(null);

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    // Compute starting sortOrder for the whole batch
    let nextOrder = getNextAvailableOrder(activeTab, bulkGlobalExamId, bulkGlobalCategory, bulkGlobalTargetMode);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
        failed++;
        errors.push(`Item ${i + 1}: missing or empty "title" field`);
        continue;
      }

      const itemIsPremium = item.isPremium ?? bulkGlobalIsPremium;
      const itemPrice = item.price !== undefined ? Number(item.price) : (itemIsPremium ? (Number(bulkGlobalPrice) || 499) : 0);
      const itemOrigPrice = item.originalPrice !== undefined ? Number(item.originalPrice) : (itemIsPremium ? (Number(bulkGlobalOriginalPrice) || (itemPrice * 2)) : 0);

      try {
        if (activeTab === 'banks' || activeTab === 'practice') {
          const metaTaglineObj = {
            text: item.tagline || '',
            price: itemPrice,
            originalPrice: itemOrigPrice,
            subject: item.subject || ''
          };
          const hasTaglineMeta = itemIsPremium || item.subject || item.tagline || item.price !== undefined;
          const payload = {
            examId: bulkGlobalExamId,
            type: bulkGlobalCategory,
            target_mode: bulkGlobalTargetMode,
            title: item.title.trim(),
            sortOrder: nextOrder,
            questionCount: Number(item.questionCount) || 0,
            tagline: hasTaglineMeta ? JSON.stringify(metaTaglineObj) : '',
            image: item.image || '',
            isPremium: itemIsPremium,
            pdfUrl: '',
            hasPracticeMode: activeTab === 'practice' ? true : (item.hasPracticeMode ?? true),
            scheduled_at: bulkGlobalScheduledAt ? new Date(bulkGlobalScheduledAt).toISOString() : (item.scheduled_at || null)
          };
          await examService.createQuestionBank(payload as any);
        } else if (activeTab === 'tests') {
          const mockConfig = JSON.stringify({
            examId: bulkGlobalExamId,
            category: bulkGlobalCategory,
            subject: bulkGlobalCategory === 'sectional' ? (item.subject || '') : null,
            isPremium: itemIsPremium,
            price: itemPrice,
            originalPrice: itemOrigPrice,
            scheduled_at: bulkGlobalScheduledAt ? new Date(bulkGlobalScheduledAt).toISOString() : (item.scheduled_at || null)
          });
          const payload = {
            examId: bulkGlobalExamId,
            seriesId: mockConfig,
            title: item.title.trim(),
            durationMinutes: Number(item.durationMinutes) || bulkGlobalDurationMinutes,
            totalMarks: Number(item.totalMarks) || bulkGlobalTotalMarks,
            negativeMarking: Number(item.negativeMarking) ?? bulkGlobalNegativeMarking,
            sortOrder: nextOrder,
            questionIds: []
          };
          await examService.createMockTest(payload as any);
        }
        success++;
        nextOrder++;
      } catch (err: any) {
        failed++;
        errors.push(`Item ${i + 1} ("${item.title}"): ${err?.message || 'Unknown error'}`);
      }
    }

    setBulkLoading(false);
    setBulkResults({ success, failed, errors });
    if (success > 0) await fetchData();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (activeTab === 'questions') {
        if (!formData.examId) { alert("Please select an exam."); return; }
        let parsedDiagram = null;
        let cleanedQuestionText = formData.questionText;

        const extraction = extractEmbeddedDiagram(formData.questionText);
        if (extraction.diagram) {
          parsedDiagram = extraction.diagram;
          cleanedQuestionText = extraction.cleanedText;
        }

        if (diagramText.trim()) {
          try {
            parsedDiagram = JSON.parse(cleanJsonString(diagramText));
          } catch(e) {
            alert("Invalid Diagram JSON. Please verify syntax.");
            return;
          }
        }

        if (parsedDiagram) {
          parsedDiagram = diagramValidator(parsedDiagram);
        }

        const targetOrder = formData.sortOrder ? Number(formData.sortOrder) : getNextAvailableOrder('questions', formData.examId, undefined, undefined, formData.topic);
        const payload: any = {
          examId: formData.examId,
          topic: formData.topic,
          sortOrder: targetOrder,
          difficulty: formData.difficulty as 'easy' | 'medium' | 'hard',
          questionText: cleanedQuestionText,
          options: formData.options,
          correctAnswerIndex: Number(formData.correctAnswerIndex),
          explanation: formData.explanation
        };
        if (parsedDiagram !== null && parsedDiagram !== undefined) {
          payload.diagram = parsedDiagram;
        }
        if (editingId) {
          await examService.updateQuestion(editingId, payload);
          setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...payload, id: editingId } : q));
        } else {
          const res = await examService.addQuestion(payload);
          if (res) setQuestions(prev => [...prev.filter(q => q.id !== res.id), res]);
        }
      } else if (activeTab === 'series') {
        if (!formData.examId) { alert("Please select an exam."); return; }
        const payload = {
          examId: formData.examId,
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          durationDays: Number(formData.durationDays),
          testIds: []
        };
        if (!validateChangeBeforePublish('series', payload, !!editingId)) return;
        if (editingId) {
          await examService.updateTestSeries(editingId, payload);
          setSeries(prev => prev.map(s => s.id === editingId ? { ...s, ...payload, id: editingId } : s));
        } else {
          const res = await examService.createTestSeries(payload);
          if (res) setSeries(prev => [...prev.filter(s => s.id !== res.id), res]);
        }
      } else if (activeTab === 'tests') {
        if (!formData.examId) { alert("Please select an exam."); return; }
        const mockConfig = JSON.stringify({
           examId: formData.examId,
           category: formData.mockCategory,
           subject: formData.mockCategory === 'sectional' ? formData.mockSubject : null,
           isPremium: formData.isPremium,
           price: Number(formData.price) || 499,
           originalPrice: Number(formData.originalPrice) || ((Number(formData.price) || 499) * 2),
           scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null
        });

        const targetExamId = formData.examId;
        const targetCategory = formData.mockCategory;
        const targetSubject = targetCategory === 'sectional' ? formData.mockSubject : null;
        
        // Scope mock tests list to the same category/exam for dense sequence ordering
        const scopedTests = mockTests.filter((t: any) => {
          let cat = 'full-length';
          let subj = null;
          try {
            if (t.seriesId) {
              const cfg = JSON.parse(t.seriesId);
              cat = cfg.category || 'full-length';
              subj = cfg.subject || null;
            }
          } catch(e) {}
          return t.examId === targetExamId && cat === targetCategory && (targetCategory !== 'sectional' || subj === targetSubject);
        });

        const targetOrder = Number(formData.sortOrder) || getNextAvailableOrder('tests', formData.examId, targetCategory);

        const payload = {
          examId: formData.examId,
          seriesId: mockConfig,
          title: formData.title,
          durationMinutes: Number(formData.durationMinutes),
          totalMarks: Number(formData.totalMarks),
          negativeMarking: Number(formData.negativeMarking) || 0,
          sortOrder: targetOrder,
          questionIds: []
        };
        if (!validateChangeBeforePublish('test', payload, !!editingId)) return;
        
        if (editingId) {
          await examService.updateMockTest(editingId, payload);
          setMockTests(prev => prev.map(t => t.id === editingId ? { ...t, ...payload, id: editingId } : t));
        } else {
          const res = await examService.createMockTest(payload);
          if (res) setMockTests(prev => [...prev.filter(t => t.id !== res.id), res]);
        }
      } else if (activeTab === 'exams' || activeTab === 'blogs') {
        const isExamPremium = formData.isPremium === true;
        const metaObj = {
          description: formData.description,
          examDate: formData.examDate || '',
          examDateStatus: formData.examDateStatus || 'tba',
          formFillupStatus: formData.formFillupStatus || 'tba',
          formFillupEndDate: formData.formFillupEndDate || '',
          isPremium: isExamPremium
        };
        const payload: any = {
          name: formData.name,
          description: `JSON_METADATA_${JSON.stringify(metaObj)}`,
          icon: formData.icon,
          category: activeTab === 'blogs' ? 'blog' : (formData.examCategory as 'popular' | 'upcoming' | 'blog' | 'system'),
          examDate: formData.examDate || null,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          keywords: formData.keywords,
          targetExamId: formData.targetExamId
        };
        if (!validateChangeBeforePublish('exam', payload, !!editingId)) return;
        if (editingId) {
          await examService.updateExam(editingId, payload);
          setExams(prev => prev.map(e => e.id === editingId ? { ...e, ...payload, id: editingId } : e));
        } else {
          const res = await examService.addExam(payload);
          if (res) setExams(prev => [...prev.filter(e => e.id !== res.id), res]);
        }
        try { sessionStorage.removeItem('oep_admin_catalog_cache'); } catch(e) {}
      } else if (activeTab === 'banks' || activeTab === 'practice') {
        if (!formData.examId) { alert("Please select an exam."); return; }
        
        // Merge questions and answer key if provided
        const mergedQuestions = mergeQuestionsAndAnswerKey(bankQuestionsJson, bankAnswerKeyJson);
        const finalQuestionCount = mergedQuestions.length > 0 ? mergedQuestions.length : Number(formData.questionCount);

        let finalPdfPayload = JSON.stringify(formData.pdfLinks);
        if (mergedQuestions.length > 0) {
          finalPdfPayload = JSON.stringify({
            pdfLinks: formData.pdfLinks || [],
            questionsData: mergedQuestions
          });
        }

        const metaTaglineObj = {
          text: formData.tagline || '',
          price: Number(formData.price) || 499,
          originalPrice: Number(formData.originalPrice) || ((Number(formData.price) || 499) * 2),
          subject: formData.mockSubject || ''
        };

        const assignedTargetMode = formData.target_mode || (activeTab === 'practice' ? 'practice' : 'bank');
        const assignedCategory = formData.type || 'topic-wise';
        const targetOrder = formData.sortOrder ? Number(formData.sortOrder) : getNextAvailableOrder(activeTab, formData.examId, assignedCategory, assignedTargetMode);

        const payload = {
          examId: formData.examId,
          type: assignedCategory,
          target_mode: assignedTargetMode,
          title: formData.title,
          sortOrder: targetOrder,
          questionCount: finalQuestionCount,
          tagline: (formData.isPremium || formData.mockSubject || formData.tagline) ? JSON.stringify(metaTaglineObj) : '',
          image: formData.image,
          isPremium: formData.isPremium,
          pdfUrl: finalPdfPayload,
          hasPracticeMode: activeTab === 'practice' ? true : formData.hasPracticeMode,
          scheduled_at: formData.scheduled_at ? new Date(formData.scheduled_at).toISOString() : null
        };
        if (!validateChangeBeforePublish('bank', payload, !!editingId)) return;
        
        if (editingId) {
          await examService.updateQuestionBank(editingId, payload);
          setBanks(prev => prev.map(b => b.id === editingId ? { ...b, ...payload, id: editingId } : b));
        } else {
          const res = await examService.createQuestionBank(payload);
          if (res) {
            setBanks(prev => [...prev.filter(b => b.id !== res.id), { ...payload, ...res }]);
          }
        }

        // If questions JSON was provided, bulk-upload them into questions table with topic = bank.title
        if (mergedQuestions.length > 0) {
          try {
            const formattedQs: Question[] = mergedQuestions.map((q, idx) => ({
              examId: formData.examId,
              topic: formData.title,
              difficulty: (q.difficulty as any) || 'medium',
              questionText: q.questionText || q.question || '',
              options: Array.isArray(q.options) ? q.options : [],
              correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
              explanation: q.explanation || '',
              diagram: q.diagram || null,
              sortOrder: idx + 1
            }));
            await examService.addQuestionsBulk(formattedQs);
          } catch (qErr) {
            console.warn("Questions bulk upload notice:", qErr);
          }
        }
      }

      // Save sticky creation memory for the active tab
      saveStickyFormData(activeTab, formData);

      setShowAddModal(false);
      setFormData(getStickyFormData(activeTab));
      setDiagramText('');
      setBankQuestionsJson('');
      setBankAnswerKeyJson('');
      setBankQuestionsFileName('');
      setBankAnswerKeyFileName('');
      await fetchData();
    } catch (error: any) {
      console.error(error);
      alert('Error adding item: ' + (error.message || 'Unknown error'));
    }
  };

  const handleReorder = async (newOrder: any[]) => {
    // 1. Update local state immediately for smooth UI
    setItems(newOrder);

    // 2. Persist new sortOrder to DB
    try {
      if (activeTab === 'tests') {
        const groups: Record<string, any[]> = {};
        newOrder.forEach(item => {
          let subject = '';
          try {
            if (item.seriesId) {
              subject = JSON.parse(item.seriesId).subject || '';
            }
          } catch(e) {}
          if (!groups[subject]) groups[subject] = [];
          groups[subject].push(item);
        });

        const updates: { id: string, sortOrder: number }[] = [];
        Object.keys(groups).forEach(subject => {
          const groupItems = groups[subject];
          groupItems.forEach((item, idx) => {
            let targetOrder = idx + 1;
            if (testSortDirection === 'desc') {
              targetOrder = groupItems.length - idx;
            }
            updates.push({ id: item.id, sortOrder: targetOrder });
          });
        });

        const promises = updates.map(u => examService.updateMockTest(u.id, { sortOrder: u.sortOrder }));
        await Promise.all(promises);
      } else {
        const promises = newOrder.map((item, index) => {
          let targetOrder = index + 1; // 1-based order
          if (activeTab === 'questions') return examService.updateQuestion(item.id, { sortOrder: targetOrder });
          if (activeTab === 'series') return examService.updateTestSeries(item.id, { sortOrder: targetOrder });
          if (activeTab === 'exams' || activeTab === 'blogs') return examService.updateExam(item.id, { sortOrder: targetOrder });
          if (activeTab === 'banks' || activeTab === 'practice') return examService.updateQuestionBank(item.id, { sortOrder: targetOrder });
          return Promise.resolve();
        });
        await Promise.all(promises);
      }

      if (activeTab === 'questions') {
        await fetchQuestions(questionsPage, searchQuery, filterExamId, questionFilter);
      } else {
        await fetchData();
      }
    } catch (e) {
      console.error("Reorder failed", e);
    }
  };
  
  const saveMockTestSortDirection = async (direction: 'asc' | 'desc') => {
    try {
      setTestSortDirection(direction);
      const updated = {
        name: 'SYSTEM_SETTINGS_MOCK_TEST_CONFIG',
        description: JSON.stringify({ sortDirection: direction }),
        icon: '⚙️',
        category: 'system' as const
      };
      const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_MOCK_TEST_CONFIG');
      if (exists && exists.id) {
        await examService.updateExam(exists.id, updated);
      } else {
        await examService.addExam(updated);
      }
    } catch (err: any) {
      alert(`Failed to save sort direction preference: ${err.message || 'Unknown error'}`);
    }
  };

  const handleInlineOrderChange = async (itemId: string, newOrderVal: number) => {
    try {
      const targetTest = mockTests.find(t => t.id === itemId);
      if (!targetTest) return;
      const targetScope = getMockTestScope(targetTest);

      // 1. Save the target test with new sortOrder
      await examService.updateMockTest(itemId, { sortOrder: newOrderVal });

      const scopedTests = mockTests.filter(t => {
        const s = getMockTestScope(t);
        return s.examId === targetScope.examId && s.category === targetScope.category && s.subject === targetScope.subject;
      });

      // 2. Perform conflict resolution within the same scope
      let otherTests = scopedTests
        .filter(t => t.id !== itemId)
        .sort((a, b) => (a.sortOrder || 9999) - (b.sortOrder || 9999));

      const finalOrderList: { id: string, sortOrder: number }[] = [];
      let inserted = false;
      
      for (const test of otherTests) {
        const currentOrder = test.sortOrder || 9999;
        if (!inserted && currentOrder >= newOrderVal) {
          finalOrderList.push({ id: itemId, sortOrder: newOrderVal });
          inserted = true;
        }
        finalOrderList.push({ id: test.id!, sortOrder: currentOrder });
      }
      if (!inserted) {
        finalOrderList.push({ id: itemId, sortOrder: newOrderVal });
      }

      const promises = finalOrderList.map((test, index) => {
        const targetOrder = index + 1;
        const currentOrder = test.id === itemId ? newOrderVal : (mockTests.find(t => t.id === test.id)?.sortOrder || 9999);
        if (currentOrder !== targetOrder) {
          return examService.updateMockTest(test.id, { sortOrder: targetOrder });
        }
        return Promise.resolve();
      });

      await Promise.all(promises);
      await fetchData();
    } catch (e: any) {
      console.error("Inline order update failed", e);
      alert("Error updating order: " + e.message);
      await fetchData();
    }
  };

  // --- Flexible Question Bank Questions & Answer Key Merger ---
  const mergeQuestionsAndAnswerKey = (rawQuestionsJson: string, rawAnswerKeyJson: string): any[] => {
    if (!rawQuestionsJson || !rawQuestionsJson.trim()) return [];

    let questions: any[] = [];
    try {
      questions = parseUniversalQuestionJson(rawQuestionsJson);
    } catch (err) {
      try {
        const parsed = JSON.parse(cleanJsonString(rawQuestionsJson));
        questions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) return [];

    // Parse Answer Key if provided
    let answerKeyMap: Record<string, { answer: any; explanation?: string }> = {};

    if (rawAnswerKeyJson && rawAnswerKeyJson.trim()) {
      try {
        const cleanedKeyStr = cleanJsonString(rawAnswerKeyJson);
        let parsedKey: any = null;
        try {
          parsedKey = JSON.parse(cleanedKeyStr);
        } catch {
          parsedKey = new Function('return ' + cleanedKeyStr)();
        }

        if (Array.isArray(parsedKey)) {
          parsedKey.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              const qNum = item.qNo || item.questionNo || item.id || (index + 1);
              const ans = item.answer !== undefined ? item.answer : item.correctAnswerIndex;
              answerKeyMap[String(qNum)] = {
                answer: ans,
                explanation: item.explanation || item.solution || ''
              };
            } else {
              // Raw answer string/number in array index
              answerKeyMap[String(index + 1)] = { answer: item };
            }
          });
        } else if (typeof parsedKey === 'object' && parsedKey !== null) {
          Object.entries(parsedKey).forEach(([key, val]) => {
            const cleanKey = key.replace(/^q/i, '').trim();
            if (typeof val === 'object' && val !== null) {
              const v: any = val;
              answerKeyMap[cleanKey] = {
                answer: v.answer !== undefined ? v.answer : v.correctAnswerIndex,
                explanation: v.explanation || v.solution || ''
              };
            } else {
              answerKeyMap[cleanKey] = { answer: val };
            }
          });
        }
      } catch (e) {
        console.warn("Could not parse answer key JSON:", e);
      }
    }

    // Merge each question
    return questions.map((q, idx) => {
      const qNum = idx + 1;
      const keyData = answerKeyMap[String(qNum)] || (q.id ? answerKeyMap[String(q.id)] : undefined);

      let ansIndex = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer;
      let explanation = q.explanation || '';

      if (keyData) {
        if (keyData.answer !== undefined && keyData.answer !== null) {
          ansIndex = keyData.answer;
        }
        if (keyData.explanation) {
          explanation = keyData.explanation;
        }
      }

      // Convert letter options 'A', 'B', 'C', 'D', 'E' or string numbers to numeric index
      if (typeof ansIndex === 'string') {
        const upper = ansIndex.trim().toUpperCase();
        const letterIdx = ['A', 'B', 'C', 'D', 'E'].indexOf(upper);
        if (letterIdx !== -1) {
          ansIndex = letterIdx;
        } else {
          const num = parseInt(upper, 10);
          if (!isNaN(num)) {
            ansIndex = num >= 1 && num <= (q.options?.length || 4) ? num - 1 : num;
          }
        }
      }

      return {
        ...q,
        questionText: q.questionText || q.question || '',
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswerIndex: typeof ansIndex === 'number' && ansIndex >= 0 ? ansIndex : undefined,
        explanation: explanation || undefined
      };
    });
  };

  // --- Universal, Future-Proof Question JSON Parser & Normalizer ---
  const parseUniversalQuestionJson = (rawInput: string): any[] => {
    if (!rawInput || !rawInput.trim()) {
      throw new Error("Please upload a file or paste JSON.");
    }

    const cleaned = cleanJsonString(rawInput).trim();
    let parsedRaw: any = null;

    // Try 1: Standard JSON parse
    try {
      parsedRaw = JSON.parse(cleaned);
    } catch (e1) {
      // Try 2: Fix concatenated arrays [...][...] -> [[...],[...]]
      try {
        if (cleaned.includes('][') || /\]\s*\[/.test(cleaned)) {
          const wrappedArray = '[' + cleaned.replace(/\]\s*\[/g, '],[') + ']';
          parsedRaw = JSON.parse(wrappedArray);
        }
      } catch (e2) {
        // Try 3: Function evaluation fallback for JS object literals
        try {
          parsedRaw = new Function('return ' + cleaned)();
        } catch (e3) {
          // Try 4: Fix concatenated arrays with Function evaluation
          try {
            if (cleaned.includes('][') || /\]\s*\[/.test(cleaned)) {
              const wrappedArray = '[' + cleaned.replace(/\]\s*\[/g, '],[') + ']';
              parsedRaw = new Function('return ' + wrappedArray)();
            }
          } catch (e4) {
            // Try 5: Extract all JSON objects or arrays via regex
            const extractedItems: any[] = [];
            const matches = cleaned.match(/\{[\s\S]*?\}(?=\s*[\,\{\[\}]|$)|\[[\s\S]*?\]/g);
            if (matches && matches.length > 0) {
              for (const match of matches) {
                try {
                  const item = JSON.parse(match);
                  extractedItems.push(item);
                } catch (e5) {
                  try {
                    const item = new Function('return ' + match)();
                    extractedItems.push(item);
                  } catch (e6) {}
                }
              }
            }
            if (extractedItems.length > 0) {
              parsedRaw = extractedItems;
            } else {
              throw new Error("Unable to parse JSON format. Please check syntax or formatting.");
            }
          }
        }
      }
    }

    // Flatten & unwrap objects
    const rawList: any[] = [];
    if (Array.isArray(parsedRaw)) {
      const flattenRecursive = (arr: any[]) => {
        arr.forEach(item => {
          if (Array.isArray(item)) {
            flattenRecursive(item);
          } else if (item && typeof item === 'object') {
            const wrapperKey = ['questions', 'data', 'items', 'results', 'quiz', 'questionList'].find(k => Array.isArray(item[k]));
            if (wrapperKey) {
              flattenRecursive(item[wrapperKey]);
            } else {
              rawList.push(item);
            }
          }
        });
      };
      flattenRecursive(parsedRaw);
    } else if (parsedRaw && typeof parsedRaw === 'object') {
      const wrapperKey = ['questions', 'data', 'items', 'results', 'quiz', 'questionList'].find(k => Array.isArray(parsedRaw[k]));
      if (wrapperKey) {
        rawList.push(...parsedRaw[wrapperKey]);
      } else {
        rawList.push(parsedRaw);
      }
    }

    if (!rawList || rawList.length === 0) {
      throw new Error("No question objects found in the provided JSON.");
    }

    // Normalize each question object into standard schema
    const normalizedQuestions = rawList.map((q: any) => {
      if (!q || typeof q !== 'object') return null;

      // 1. Question Text
      let rawQuestionText = q.questionText || q.question || q.question_text || q.title || q.stem || q.text || '';
      if (typeof rawQuestionText !== 'string') {
        rawQuestionText = String(rawQuestionText);
      }

      let diagram = q.diagram || null;
      const extraction = extractEmbeddedDiagram(rawQuestionText);
      if (extraction.diagram) {
        diagram = extraction.diagram;
        rawQuestionText = extraction.cleanedText;
      }

      if (diagram) {
        diagram = diagramValidator(diagram);
      }

      // 2. Options
      let options: string[] = [];
      if (Array.isArray(q.options)) {
        options = q.options.map((opt: any) => String(opt ?? '').trim());
      } else if (q.options && typeof q.options === 'object') {
        const optsObj = q.options;
        const keys = ['A', 'B', 'C', 'D', 'a', 'b', 'c', 'd', '1', '2', '3', '4'];
        const collected = keys.map(k => optsObj[k]).filter(v => v !== undefined && v !== null);
        if (collected.length >= 2) {
          options = collected.map((opt: any) => String(opt ?? '').trim());
        }
      } else {
        const optA = q.optionA ?? q.option_a ?? q.optA ?? q.opt_a ?? q.a;
        const optB = q.optionB ?? q.option_b ?? q.optB ?? q.opt_b ?? q.b;
        const optC = q.optionC ?? q.option_c ?? q.optC ?? q.opt_c ?? q.c;
        const optD = q.optionD ?? q.option_d ?? q.optD ?? q.opt_d ?? q.d;

        if (optA !== undefined || optB !== undefined) {
          options = [
            String(optA ?? '').trim(),
            String(optB ?? '').trim(),
            String(optC ?? '').trim(),
            String(optD ?? '').trim()
          ].filter(Boolean);
        }
      }

      while (options.length < 4) {
        options.push('');
      }

      // 3. Correct Answer Index
      let correctAnswerIndex = 0;
      const rawAnswer = q.correctAnswerIndex ?? q.correctAnswer ?? q.answer ?? q.correct_option ?? q.correct_answer ?? q.ans;

      if (typeof rawAnswer === 'number') {
        if (rawAnswer >= 0 && rawAnswer < options.length) {
          correctAnswerIndex = rawAnswer;
        } else if (rawAnswer >= 1 && rawAnswer <= options.length) {
          correctAnswerIndex = rawAnswer - 1;
        }
      } else if (typeof rawAnswer === 'string') {
        const trimmedAns = rawAnswer.trim();
        const upperAns = trimmedAns.toUpperCase();

        if (upperAns === 'A' || upperAns === 'OPTION A' || upperAns === 'OPTION 1') correctAnswerIndex = 0;
        else if (upperAns === 'B' || upperAns === 'OPTION B' || upperAns === 'OPTION 2') correctAnswerIndex = 1;
        else if (upperAns === 'C' || upperAns === 'OPTION C' || upperAns === 'OPTION 3') correctAnswerIndex = 2;
        else if (upperAns === 'D' || upperAns === 'OPTION D' || upperAns === 'OPTION 4') correctAnswerIndex = 3;
        else if (/^[1-4]$/.test(trimmedAns)) {
          correctAnswerIndex = parseInt(trimmedAns, 10) - 1;
        } else {
          const matchIdx = options.findIndex(opt => opt.toLowerCase() === trimmedAns.toLowerCase());
          if (matchIdx !== -1) {
            correctAnswerIndex = matchIdx;
          }
        }
      }

      // 4. Explanation
      const explanation = String(q.explanation || q.solution || q.rationale || q.answer_explanation || q.exp || '').trim();

      return {
        questionText: rawQuestionText,
        options,
        correctAnswerIndex,
        explanation,
        difficulty: q.difficulty || 'medium',
        ...(diagram ? { diagram } : {})
      };
    }).filter(Boolean);

    if (normalizedQuestions.length === 0) {
      throw new Error("No valid question objects could be normalized from the upload data.");
    }

    return normalizedQuestions;
  };

  const handleMockBulkUpload = async () => {
    try {
      if (!attachMockTestId) {
         alert("Please select a Mock Test.");
         return;
      }
      if (!bulkFileContent) {
         alert("Please upload a file or paste JSON.");
         return;
      }
      
      const processedQuestions = parseUniversalQuestionJson(bulkFileContent);

      const targetTest = mockTests.find(mt => mt.id === attachMockTestId);
      let targetExamId = 'generic';
      try {
        if (targetTest && targetTest.seriesId) {
          targetExamId = JSON.parse(targetTest.seriesId).examId || 'generic';
        }
      } catch(e) {}
      
      await examService.addQuestionsToMockTest(attachMockTestId, targetExamId, processedQuestions);
      alert(`Successfully added ${processedQuestions.length} questions to Mock Test!`);
      setShowMockUploadModal(false);
      setBulkFileContent('');
      setAttachMockTestId(null);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error occurred during Mock Test bulk upload');
    }
  };

  const handleBulkUpload = async () => {
    try {
      if (!bulkExamId || !bulkTopic) {
         alert("Please select an exam and topic.");
         return;
      }
      if (!bulkFileContent) {
         alert("Please upload a file or paste JSON.");
         return;
      }
      
      const questionArray = parseUniversalQuestionJson(bulkFileContent);
      
      const formatted = questionArray.map(q => ({
        ...q,
        examId: bulkExamId,
        topic: bulkTopic
      }));
      
      await examService.addQuestionsBulk(formatted);
      alert(`Successfully added ${formatted.length} questions!`);
      
      // Auto-navigate to show the newly uploaded exam and target content/mock test
      setSelectedExamIdForQuestions(bulkExamId);
      if (bulkTopic.startsWith('mockTest__')) {
        setSelectedTypeForQuestions('mock');
        setSelectedTargetIdForQuestions(bulkTopic.replace('mockTest__', ''));
      } else {
        setSelectedTypeForQuestions('bank');
        setSelectedTargetIdForQuestions(bulkTopic);
      }
      setFilterExamId(bulkExamId);

      setShowBulkUploadModal(false);
      setBulkFileContent('');
      setBulkFileNames([]);
      setBulkExamId('');
      setBulkTopic('');
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Error occurred during bulk upload');
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };


  // Render modal forms dynamically
  const renderFormFields = () => {
    // Professional Form Style Constants
    const labelClass = "text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2";
    const inputClass = "w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/30 text-slate-800 placeholder-slate-400 font-semibold focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200 shadow-inner";
    const selectClass = "w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/30 text-slate-800 font-semibold focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200 appearance-none cursor-pointer pr-10 shadow-inner";
    const selectWrapperClass = "relative w-full";
    const textareaClass = "w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/30 text-slate-800 placeholder-slate-400 font-semibold focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 outline-none transition-all duration-200 shadow-inner";

    switch (activeTab) {
      case 'exams':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Exam Name *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="e.g. OPSC Civil Services" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Category</label>
                <div className={selectWrapperClass}>
                  <select value={formData.examCategory} onChange={e => setFormData({ ...formData, examCategory: e.target.value })} className={selectClass}>
                    <option value="popular">Popular</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Icon (Emoji or Image URL)</label>
                <input required type="text" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className={inputClass} placeholder="🏛️ or https://..." />
              </div>
            <div className="md:col-span-2 p-6 bg-slate-100/60 rounded-3xl border border-slate-200/80 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-600" />
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Exam Schedule & Form Fill-up Monitoring</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600">Exam Date Status</label>
                  <div className={selectWrapperClass}>
                    <select 
                      value={formData.examDateStatus || 'tba'} 
                      onChange={e => setFormData({ ...formData, examDateStatus: e.target.value as any })}
                      className={selectClass}
                    >
                      <option value="published">✅ Date Officially Published</option>
                      <option value="tba">📢 To Be Announced (TBA)</option>
                      <option value="expected">🔮 Tentative / Expected</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600">Exam Target Date</label>
                  <input type="date" value={formData.examDate} onChange={e => setFormData({ ...formData, examDate: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600">Form Fill-up Status</label>
                  <div className={selectWrapperClass}>
                    <select 
                      value={formData.formFillupStatus || 'tba'} 
                      onChange={e => setFormData({ ...formData, formFillupStatus: e.target.value as any })}
                      className={selectClass}
                    >
                      <option value="open">📝 Form Fill-up Open / Continuing</option>
                      <option value="closed">🔒 Form Fill-up Closed / Ended</option>
                      <option value="awaited">🔔 Official Notification Awaited</option>
                      <option value="tba">⏳ Form Dates TBA / Coming Soon</option>
                    </select>
                    <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-600">Form Fill-up End Date</label>
                  <input type="date" value={formData.formFillupEndDate} onChange={e => setFormData({ ...formData, formFillupEndDate: e.target.value })} className={inputClass} />
                </div>
              </div>
            </div>
            </div>
            
            <div className="md:col-span-2 p-6 bg-brand-50/40 rounded-3xl border border-brand-100/50 space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-brand-500/10">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <label className="text-base font-black text-slate-900 leading-tight">Full Exam Access Bundle</label>
                    <p className="text-xs font-bold text-slate-400 italic mt-0.5">Allow users to unlock ALL question banks and mock tests for this exam at once</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formData.isPremium} onChange={e => setFormData({ ...formData, isPremium: e.target.checked })} className="sr-only peer" />
                  <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-brand-500"></div>
                </label>
              </div>
              {formData.isPremium && (
                <div className="grid grid-cols-2 gap-6 pt-4 border-t border-brand-100/30 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Bundle Price (₹)</label>
                    <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className={inputClass} placeholder="e.g. 499" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Original Price (₹)</label>
                    <input type="number" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: e.target.value })} className={inputClass} placeholder="e.g. 999" />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2 mt-6">
              <label className={labelClass}>Exam Description / Detailed Content</label>
              <textarea 
                rows={4} 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                className={textareaClass} 
                placeholder="Describe the exam and what's included in the bundle..."
              />
            </div>
          </>
        );
      case 'blogs':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Blog Title *</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="e.g. How to Crack OPSC 2026" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Cover Image URL *</label>
                <input required type="url" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} className={inputClass} placeholder="https://..." />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Publish Date *</label>
                <input required type="date" value={formData.examDate} onChange={e => setFormData({ ...formData, examDate: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Related Exam (For Promotion)</label>
                <SearchableDropdown 
                  value={formData.targetExamId} 
                  onChange={v => setFormData({ ...formData, targetExamId: v })} 
                  options={actualExams.map(ex => ({ value: ex.id as string, label: ex.name }))}
                  placeholder="-- No Related Exam --"
                />
                <p className="text-[10px] font-bold text-slate-400 mt-1">If selected, this blog will promote Question Banks & Mock Tests for this exam.</p>
              </div>
            </div>

            <div className="bg-slate-50/40 p-6 rounded-3xl border border-slate-200/60 mt-8 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-5 h-5 text-brand-600" />
                <h3 className="text-lg font-black text-slate-900 tracking-tight">SEO Options</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass}>Meta Title</label>
                  <input type="text" value={formData.metaTitle} onChange={e => setFormData({ ...formData, metaTitle: e.target.value })} className={inputClass} placeholder="SEO Title Tag" />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Meta Keywords</label>
                  <input type="text" value={formData.keywords} onChange={e => setFormData({ ...formData, keywords: e.target.value })} className={inputClass} placeholder="odisha, exams, prep..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Meta Description</label>
                <textarea value={formData.metaDescription} onChange={e => setFormData({ ...formData, metaDescription: e.target.value })} className={textareaClass} placeholder="Search result snippet..."></textarea>
              </div>
            </div>
            <div className="space-y-2 mt-6">
              <label className={labelClass}>HTML/Code Content *</label>
              <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={`${textareaClass} font-mono min-h-[350px]`} placeholder="<h1>Main Strategy</h1><p>Here is how...</p>"></textarea>
              <p className="text-xs font-semibold text-slate-400 mt-1">Paste raw HTML here. The frontend will render it automatically.</p>
            </div>
          </>
        );
      case 'series':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Select Exam *</label>
                <SearchableDropdown 
                  required 
                  value={formData.examId} 
                  onChange={v => setFormData({ ...formData, examId: v })} 
                  options={actualExams.map(ex => ({ value: ex.id as string, label: ex.name }))}
                  placeholder="-- Choose Exam --"
                  disabled={!!selectedExamIdForSeries}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Series Title *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="e.g. Advanced Mock Series" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Price (₹) *</label>
                <input required type="number" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Duration (Days) *</label>
                <input required type="number" min="1" value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="space-y-2 mt-6">
              <label className={labelClass}>Description *</label>
              <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className={textareaClass} placeholder="Series details..."></textarea>
            </div>
          </>
        );
      case 'tests':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Select Exam *</label>
                <SearchableDropdown 
                  required 
                  value={formData.examId} 
                  onChange={v => setFormData({ ...formData, examId: v })} 
                  options={actualExams.map(ex => ({ value: ex.id as string, label: ex.name }))}
                  placeholder="-- Choose Exam --"
                  disabled={!!selectedExamIdForTests}
                />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Select Category *</label>
                <div className={selectWrapperClass}>
                  <select required value={formData.mockCategory} onChange={e => setFormData({ ...formData, mockCategory: e.target.value })} className={selectClass} disabled={!!selectedCategoryForTests}>
                    <option value="full-length">Full-Length Mock Tests</option>
                    <option value="sectional">Sectional Tests</option>
                    <option value="pyq">PYQ Tests</option>
                    <option value="daily">Daily / Weekly Tests</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
              
              {formData.mockCategory === 'sectional' && (() => {
                const testTitlePatterns = /Solved PYQ|Master Practice|Daily Quiz|Set \d+|Practice Set|Mock Test|Quiz \d+/i;
                const bankSubjects = banks
                  .filter((b: any) => b.examId === formData.examId && (b.target_mode || 'both') !== 'practice' && !testTitlePatterns.test(b.title || ''))
                  .map((b: any) => b.title?.trim())
                  .filter(Boolean);
                const mockTestSubjects = mockTests
                  .filter((t: any) => t.examId === formData.examId && t.subject)
                  .map((t: any) => t.subject?.trim())
                  .filter(Boolean);
                const subjectsList = Array.from(new Set([...bankSubjects, ...mockTestSubjects]));
                const isPreset = subjectsList.includes(formData.mockSubject);

                return (
                  <div className="space-y-2 col-span-1 md:col-span-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                    <label className={labelClass}>Select Subject *</label>
                    <div className="space-y-2">
                      <div className={selectWrapperClass}>
                        <select 
                          required={!formData.mockSubject} 
                          value={isPreset ? formData.mockSubject : (formData.mockSubject ? '__custom__' : '')} 
                          onChange={e => {
                            if (e.target.value === '__custom__') {
                              setFormData({ ...formData, mockSubject: '' });
                            } else {
                              setFormData({ ...formData, mockSubject: e.target.value });
                            }
                          }} 
                          className={selectClass} 
                          disabled={!formData.examId}
                        >
                          <option value="">-- Choose Subject --</option>
                          {subjectsList.map((subj: string) => (
                            <option key={subj} value={subj}>{subj}</option>
                          ))}
                          <option value="__custom__">✏️ + Enter Custom Subject...</option>
                        </select>
                        <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {(!isPreset) && (
                        <input 
                          type="text"
                          required
                          value={formData.mockSubject}
                          onChange={e => setFormData({ ...formData, mockSubject: e.target.value })}
                          placeholder="Type subject name (e.g. Medical-Surgical Nursing, Pharmacology...)"
                          className={inputClass}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2">
                <label className={labelClass}>Test Title *</label>
                <input required type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className={inputClass} placeholder="e.g. Full Length Mock 1" />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Duration (Mins) *</label>
                <input required type="number" min="1" value={formData.durationMinutes} onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Total Marks *</label>
                <input required type="number" min="1" value={formData.totalMarks} onChange={e => setFormData({ ...formData, totalMarks: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Negative Marking Per Incorrect Answer *</label>
                <input 
                  required 
                  type="number" 
                  step="0.01" 
                  min="0" 
                  value={formData.negativeMarking} 
                  onChange={e => setFormData({ ...formData, negativeMarking: e.target.value })} 
                  className={inputClass} 
                  placeholder="e.g. 0.25" 
                />
                <div className="flex gap-2 flex-wrap mt-2">
                  {[0, 0.25, 0.33, 0.5, 1].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFormData({ ...formData, negativeMarking: val })}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
                        Number(formData.negativeMarking) === val 
                          ? "bg-brand-500 text-white border-brand-500 shadow-sm" 
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {val === 0 ? "None (0.00)" : '-' + val}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Order Number *</label>
                <input 
                  required 
                  type="number" 
                  min="1" 
                  value={formData.sortOrder ?? ''} 
                  onChange={e => setFormData({ ...formData, sortOrder: e.target.value })} 
                  className={inputClass} 
                  placeholder="e.g. 1, 2, 3..." 
                />
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-4 bg-slate-50/40 p-6 rounded-3xl border border-slate-200/60 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Is Premium / Locked Content?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formData.isPremium} onChange={e => setFormData({ ...formData, isPremium: e.target.checked })} className="sr-only peer" />
                  <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-brand-500"></div>
                </label>
              </div>
              {formData.isPremium && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 pt-4 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className={labelClass}>Original Price (₹) *</label>
                    <input required type="number" min="0" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: e.target.value })} className={inputClass} placeholder="e.g. 999" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Discounted Price (₹) *</label>
                    <input required type="number" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className={inputClass} placeholder="e.g. 499" />
                  </div>
                </div>
              )}

              {/* Schedule Date & Time */}
              <div className="pt-4 border-t border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Schedule Release Date & Time</span>
                  {formData.scheduled_at && (
                    <button type="button" onClick={() => setFormData({ ...formData, scheduled_at: '' })} className="text-xs font-bold text-rose-500 hover:underline">
                      Clear Schedule (Publish Now)
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-semibold">Leave empty to publish immediately. Setting a future date displays a live countdown timer to students.</p>
                <input 
                  type="datetime-local" 
                  value={formData.scheduled_at || ''} 
                  onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })} 
                  className={inputClass} 
                />
                {formData.scheduled_at && (
                  <p className="text-xs font-bold text-brand-600 bg-brand-50 p-2.5 rounded-xl border border-brand-100/60 mt-1">
                    📅 Live on: {new Date(formData.scheduled_at).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                )}
              </div>
            </div>
          </>
        );
      case 'practice':
      case 'banks': {
        const isPracticeTab = activeTab === 'practice' || (activeTab === 'banks' && bankSubTab === 'practice');
        const tMode = (formData.target_mode || (isPracticeTab ? 'practice' : 'bank')) as 'bank' | 'practice' | 'both';
        const showPdf = tMode !== 'practice';
        const showTagline = true;
        const showPracticeToggle = tMode === 'both';

        // Dynamic category labels based on target_mode
        const categoryOptions: Record<'bank' | 'practice' | 'both', { value: string; label: string }[]> = {
          bank: [
            { value: 'topic-wise',      label: 'Topic-Wise Question Bank' },
            { value: 'exam-focused',    label: 'Exam-Focused Bank' },
            { value: 'revision-sets',   label: 'Revision Sets' },
            { value: 'pyq-collections', label: 'PYQ Collections' },
          ],
          practice: [
            { value: 'topic-wise',      label: 'Chapter-Wise Practice' },
            { value: 'exam-focused',    label: 'High-Yield Topic Banks' },
            { value: 'revision-sets',   label: 'Daily Speed Quizzes' },
            { value: 'pyq-collections', label: 'Topic-Wise PYQs' },
          ],
          both: [
            { value: 'topic-wise',      label: 'Chapter-Wise Practice / Topic-Wise' },
            { value: 'exam-focused',    label: 'High-Yield / Exam-Focused' },
            { value: 'revision-sets',   label: 'Daily Quizzes / Revision Sets' },
            { value: 'pyq-collections', label: 'Topic-Wise PYQs / PYQ Collections' },
          ],
        };
        const activeCategoryOptions = categoryOptions[tMode];

        // Compute live merged questions preview
        const liveMergedQuestions = mergeQuestionsAndAnswerKey(bankQuestionsJson, bankAnswerKeyJson);
        const liveKeyedCount = liveMergedQuestions.filter(q => q.correctAnswerIndex !== undefined).length;
        const liveExplanationCount = liveMergedQuestions.filter(q => !!q.explanation).length;
        const liveUnkeyedCount = liveMergedQuestions.length - liveKeyedCount;

        return (
          <>
            {/* ── Top info row helper ── */}
            {tMode !== 'both' && (
              <div className={cn(
                "mb-4 flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold animate-in fade-in slide-in-from-top-1",
                tMode === 'bank'
                  ? "bg-amber-50 border-amber-200 text-amber-700"
                  : "bg-brand-50 border-brand-200 text-brand-700"
              )}>
                <span className="text-xl shrink-0">{tMode === 'bank' ? '📦' : '🎯'}</span>
                <span>
                  {tMode === 'bank'
                    ? 'Question Bank (Step 3) — Interactive web reader & PDF downloads for students.'
                    : 'Practice Set (Step 1) — Interactive CBT drills with instant timer and answer explanations.'}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Exam */}
              <div className="space-y-2">
                <label className={labelClass}>Select Exam *</label>
                <SearchableDropdown
                  required
                  value={formData.examId}
                  onChange={v => {
                    const nextOrder = !editingId ? getNextAvailableOrder(activeTab, v, formData.type || 'topic-wise', tMode) : formData.sortOrder;
                    setFormData({ ...formData, examId: v, sortOrder: nextOrder });
                  }}
                  options={actualExams.map(ex => ({ value: ex.id as string, label: ex.name }))}
                  placeholder="-- Choose Exam --"
                  disabled={!!selectedExamIdForBanks}
                />
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className={labelClass}>{isPracticeTab ? 'Practice Set Title *' : 'Question Bank Title *'}</label>
                <input 
                  required 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({ ...formData, title: e.target.value })} 
                  className={inputClass} 
                  placeholder={isPracticeTab ? "e.g. Fundamental Rights & DPSP Chapter Drill" : "e.g. Indian Polity & Constitution Master Bank"} 
                />
              </div>

              {/* Subtitle / Topics */}
              {(() => {
                const CATEGORY_TAGLINE_PRESETS: Record<string, { label: string; value: string }[]> = {
                  'topic-wise': [
                    { label: 'Chapter-Wise High-Yield MCQs & Explanations', value: 'Chapter-Wise High-Yield MCQs & Explanations' },
                    { label: 'Concept Mastery & Topic Practice Drill', value: 'Concept Mastery & Topic Practice Drill' },
                    { label: 'Complete Chapter Revision & Formula Drills', value: 'Complete Chapter Revision & Formula Drills' },
                    { label: 'Comprehensive Subject & Topic Test Series', value: 'Comprehensive Subject & Topic Test Series' },
                  ],
                  'exam-focused': [
                    { label: 'Most Expected Questions for Upcoming Exam', value: 'Most Expected Questions for Upcoming Exam' },
                    { label: 'High-Weightage Core Topics Mastery', value: 'High-Weightage Core Topics Mastery' },
                    { label: 'Exam Pattern Mock Drills & Speed Booster', value: 'Exam Pattern Mock Drills & Speed Booster' },
                    { label: 'Target Score Booster & Critical Concepts', value: 'Target Score Booster & Critical Concepts' },
                  ],
                  'revision-sets': [
                    { label: 'Daily Speed Drill & Quick Accuracy Booster', value: 'Daily Speed Drill & Quick Accuracy Booster' },
                    { label: 'Timed Daily Practice & Rapid Revision', value: 'Timed Daily Practice & Rapid Revision' },
                    { label: '15-Min Daily Challenge & Instant Rank', value: '15-Min Daily Challenge & Instant Rank' },
                    { label: 'Daily Warmup Quiz for Exam Readiness', value: 'Daily Warmup Quiz for Exam Readiness' },
                  ],
                  'pyq-collections': [
                    { label: 'Previous Years Solved Questions (PYQ) with Solutions', value: 'Previous Years Solved Questions (PYQ) with Solutions' },
                    { label: '10-Year Trend Analysis & Official PYQ Breakdown', value: '10-Year Trend Analysis & Official PYQ Breakdown' },
                    { label: 'Topic-Wise Past Exam MCQs & Detailed Explanations', value: 'Topic-Wise Past Exam MCQs & Detailed Explanations' },
                    { label: 'Authentic Exam Board Questions & Model Answers', value: 'Authentic Exam Board Questions & Model Answers' },
                  ],
                  'general': [
                    { label: '500+ High-Yield MCQs with Step-by-Step Solutions', value: '500+ High-Yield MCQs with Step-by-Step Solutions' },
                    { label: 'Complete Syllabus Practice & Speed Drill', value: 'Complete Syllabus Practice & Speed Drill' },
                    { label: 'Topic Concepts & Standard Exam Drills', value: 'Topic Concepts & Standard Exam Drills' },
                  ]
                };

                const currentType = formData.type || 'topic-wise';
                const categoryPresets = CATEGORY_TAGLINE_PRESETS[currentType] || [];
                const generalPresets = CATEGORY_TAGLINE_PRESETS['general'] || [];
                const allPresets = [...categoryPresets, ...generalPresets];
                const presetValues = allPresets.map(p => p.value);
                const isPreset = presetValues.includes(formData.tagline);
                const selectedSelectValue = isPreset ? formData.tagline : (formData.tagline ? '__custom__' : '');

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className={labelClass}>Topic / Subject Subtitle</label>
                      {formData.tagline && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, tagline: '' })}
                          className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className={selectWrapperClass}>
                        <select 
                          value={selectedSelectValue}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__custom__') {
                              if (isPreset) {
                                setFormData({ ...formData, tagline: '' });
                              }
                            } else {
                              setFormData({ ...formData, tagline: val });
                            }
                          }}
                          className={selectClass}
                        >
                          <option value="">-- Choose Pre-made CTA Subtitle or Custom --</option>
                          <optgroup label="✨ Category-Recommended Taglines">
                            {categoryPresets.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </optgroup>
                          <optgroup label="🌟 General / Popular CTA Taglines">
                            {generalPresets.map(p => (
                              <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                          </optgroup>
                          <option value="__custom__">✏️ + Enter Custom Subtitle / Topic List...</option>
                        </select>
                        <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* Render text input if Custom is selected or when a custom subtitle is active */}
                      {(!isPreset || selectedSelectValue === '__custom__') && (
                        <input 
                          type="text" 
                          value={formData.tagline} 
                          onChange={e => setFormData({ ...formData, tagline: e.target.value })} 
                          className={inputClass} 
                          placeholder="e.g. Fundamental Rights, DPSP, Judiciary & Amendments (500 High-Yield MCQs)" 
                        />
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Category */}
              <div className="space-y-2">
                <label className={labelClass}>
                  {tMode === 'bank' ? 'Question Bank Category *' : tMode === 'practice' ? 'Practice Set Category *' : 'Bank Category *'}
                </label>
                <div className={selectWrapperClass}>
                  <select 
                    required 
                    value={formData.type} 
                    onChange={e => {
                      const newType = e.target.value;
                      const nextOrder = !editingId ? getNextAvailableOrder(activeTab, formData.examId, newType, tMode) : formData.sortOrder;
                      setFormData({ ...formData, type: newType, sortOrder: nextOrder });
                    }} 
                    className={selectClass}
                  >
                    {activeCategoryOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Subject Selection */}
              {(() => {
                const testTitlePatterns = /Solved PYQ|Master Practice|Daily Quiz|Set \d+|Practice Set|Mock Test|Quiz \d+/i;
                const bankSubjects = banks
                  .filter((b: any) => b.examId === formData.examId)
                  .map((b: any) => {
                    if (b.tagline && b.tagline.includes('"subject"')) {
                      try { return JSON.parse(b.tagline).subject; } catch(e) {}
                    }
                    if ((b.target_mode || 'both') !== 'practice' && !testTitlePatterns.test(b.title || '')) {
                      return b.title?.trim();
                    }
                    return null;
                  })
                  .filter(Boolean);
                const mockTestSubjects = mockTests
                  .filter((t: any) => t.examId === formData.examId && t.subject)
                  .map((t: any) => t.subject?.trim())
                  .filter(Boolean);
                const subjectsList = Array.from(new Set([...bankSubjects, ...mockTestSubjects]));
                const isPreset = subjectsList.includes(formData.mockSubject);

                return (
                  <div className="space-y-2 col-span-1 md:col-span-2 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                    <label className={labelClass}>Select Subject {tMode === 'practice' ? '*' : '(Optional)'}</label>
                    <div className="space-y-2">
                      <div className={selectWrapperClass}>
                        <select 
                          value={isPreset ? formData.mockSubject : (formData.mockSubject ? '__custom__' : '')} 
                          onChange={e => {
                            if (e.target.value === '__custom__') {
                              setFormData({ ...formData, mockSubject: '' });
                            } else {
                              setFormData({ ...formData, mockSubject: e.target.value });
                            }
                          }} 
                          className={selectClass} 
                          disabled={!formData.examId}
                        >
                          <option value="">-- Choose Subject --</option>
                          {subjectsList.map((subj: string) => (
                            <option key={subj} value={subj}>{subj}</option>
                          ))}
                          <option value="__custom__">✏️ + Enter Custom Subject...</option>
                        </select>
                        <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {(!isPreset) && (
                        <input 
                          type="text"
                          value={formData.mockSubject}
                          onChange={e => setFormData({ ...formData, mockSubject: e.target.value })}
                          placeholder="Type subject name (e.g. Indian Polity, Odia Language, General Science...)"
                          className={inputClass}
                        />
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* ── 1. Questions JSON Input Section ── */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl border-2 border-brand-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-black text-brand-900 uppercase tracking-wider flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-brand-600" />
                      1. Upload Questions JSON (File or Code) *
                    </label>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Upload a questions <code className="font-mono text-brand-600 bg-brand-50 px-1 py-0.5 rounded">.json</code> file or paste JSON code. Answers can be inline or added in step 2.
                    </p>
                  </div>

                  <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setBankQuestionsInputMode('file')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all",
                        bankQuestionsInputMode === 'file' ? "bg-white text-brand-600 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      📁 Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankQuestionsInputMode('text')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all",
                        bankQuestionsInputMode === 'text' ? "bg-white text-brand-600 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      ✍️ Paste Code
                    </button>
                  </div>
                </div>

                {bankQuestionsInputMode === 'file' ? (
                  <div className="border-2 border-dashed border-brand-200 hover:border-brand-400 bg-brand-50/20 hover:bg-brand-50/40 transition-all rounded-2xl p-6 text-center relative cursor-pointer group">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBankQuestionsFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            const text = re.target?.result as string;
                            setBankQuestionsJson(text || '');
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-8 h-8 text-brand-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-slate-800">
                      {bankQuestionsFileName ? `Selected: ${bankQuestionsFileName}` : 'Click or drag & drop questions JSON file here'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Accepts standard question arrays or nested question objects
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <textarea
                      rows={6}
                      value={bankQuestionsJson}
                      onChange={e => setBankQuestionsJson(e.target.value)}
                      placeholder='[&#10;  {&#10;    "question": "What is the capital of Odisha?",&#10;    "options": ["Cuttack", "Bhubaneswar", "Puri", "Rourkela"],&#10;    "answer": "B",&#10;    "explanation": "Bhubaneswar is the capital of Odisha."&#10;  }&#10;]'
                      className={`${inputClass} font-mono text-xs leading-relaxed`}
                    />
                  </div>
                )}
              </div>

              {/* ── 2. Answer Key JSON Input Section ── */}
              <div className="md:col-span-2 bg-white p-5 rounded-2xl border-2 border-emerald-100 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="text-sm font-black text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-600" />
                      2. Upload Answer Key JSON (Optional — Late / Partial Keys)
                    </label>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Provide answer keys and optional explanations for any subset of questions. Questions without a key will display as practice mode.
                    </p>
                  </div>

                  <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setBankAnswerKeyInputMode('file')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all",
                        bankAnswerKeyInputMode === 'file' ? "bg-white text-emerald-600 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      📁 Upload Key File
                    </button>
                    <button
                      type="button"
                      onClick={() => setBankAnswerKeyInputMode('text')}
                      className={cn(
                        "px-3 py-1.5 rounded-lg transition-all",
                        bankAnswerKeyInputMode === 'text' ? "bg-white text-emerald-600 shadow-xs font-black" : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      ✍️ Paste Code
                    </button>
                  </div>
                </div>

                {bankAnswerKeyInputMode === 'file' ? (
                  <div className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50/20 hover:bg-emerald-50/40 transition-all rounded-2xl p-6 text-center relative cursor-pointer group">
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setBankAnswerKeyFileName(file.name);
                          const reader = new FileReader();
                          reader.onload = (re) => {
                            const text = re.target?.result as string;
                            setBankAnswerKeyJson(text || '');
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <KeyRound className="w-8 h-8 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-slate-800">
                      {bankAnswerKeyFileName ? `Selected: ${bankAnswerKeyFileName}` : 'Click or drag & drop answer key JSON file here'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">
                      Supports map {`{"1": "A", "2": "C"}`} or array [ {`{"qNo": 1, "answer": "B", "explanation": "..."}`} ]
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <textarea
                      rows={4}
                      value={bankAnswerKeyJson}
                      onChange={e => setBankAnswerKeyJson(e.target.value)}
                      placeholder='{&#10;  "1": "B",&#10;  "2": { "answer": "C", "explanation": "Detailed step-by-step solution..." },&#10;  "3": "A"&#10;}'
                      className={`${inputClass} font-mono text-xs leading-relaxed`}
                    />
                  </div>
                )}
              </div>

              {/* ── Live Merged Preview Summary Card ── */}
              {liveMergedQuestions.length > 0 && (
                <div className="md:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-brand-50/80 via-emerald-50/80 to-brand-50/80 border border-brand-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4 animate-in fade-in">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <span className="text-xs font-black uppercase tracking-wider text-brand-950">
                        Live Merged Question Bank Summary
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700">
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        📦 Total: <strong className="text-brand-600">{liveMergedQuestions.length} Questions</strong>
                      </span>
                      <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                        ✅ Keyed: <strong className="text-emerald-600">{liveKeyedCount}</strong> ({liveExplanationCount} with solutions)
                      </span>
                      {liveUnkeyedCount > 0 && (
                        <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          🎯 Practice / Un-keyed: <strong className="text-amber-600">{liveUnkeyedCount}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowBankPreviewModal(true)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-brand-600 border border-brand-200 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview Questions ({liveMergedQuestions.length})
                    </button>
                  </div>
                </div>
              )}

              {/* Order Sequence & Questions Count Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:col-span-2">
                <div className="space-y-2">
                  <label className={labelClass}>
                    Order Sequence (Category-Scoped) *
                  </label>
                  <input 
                    required
                    type="number" 
                    min="1"
                    value={formData.sortOrder ?? ''} 
                    onChange={e => setFormData({ ...formData, sortOrder: e.target.value })} 
                    className={inputClass} 
                    placeholder="e.g. 1, 2, 3..." 
                  />
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Starts from 1 for each category. Auto-fills next sequence number or missing deleted gap.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className={labelClass}>
                    Questions Count {liveMergedQuestions.length > 0 ? <span className="text-emerald-600 font-semibold normal-case tracking-normal">(auto-calculated from JSON: {liveMergedQuestions.length})</span> : ''}
                  </label>
                  <input 
                    type="number" 
                    value={liveMergedQuestions.length > 0 ? liveMergedQuestions.length : formData.questionCount} 
                    onChange={e => setFormData({ ...formData, questionCount: e.target.value })} 
                    className={inputClass} 
                  />
                </div>
              </div>

              {/* Image URL — hidden for practice-only */}
              {tMode !== 'practice' && (
                <div className="space-y-2">
                  <label className={labelClass}>Image URL (Optional)</label>
                  <input type="text" value={formData.image} onChange={e => setFormData({ ...formData, image: e.target.value })} className={inputClass} placeholder="https://..." />
                </div>
              )}

              {/* PDF Links — hidden for practice-only */}
              {showPdf && (
                <div className="md:col-span-2 space-y-4 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Custom PDF Download Links (Optional)</label>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">Students can download the auto-generated PDF or any custom PDF files attached here.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, pdfLinks: [...formData.pdfLinks, { title: '', url: '' }] })}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl text-xs font-black hover:bg-brand-100 transition-all border border-brand-100/30"
                    >
                      <Plus className="w-4 h-4" /> Add Extra Link
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.pdfLinks.length === 0 ? (
                      <div className="py-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/20">
                        <FileText className="w-7 h-7 mb-1.5 opacity-20" />
                        <p className="text-xs font-bold uppercase tracking-widest">No extra external links added (Standard auto-generated PDF will be used)</p>
                      </div>
                    ) : (
                      formData.pdfLinks.map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-4 items-end bg-slate-50/30 p-5 rounded-2xl border border-slate-200/60 shadow-sm relative group">
                          <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Link Title</label>
                            <input
                              type="text"
                              value={link.title}
                              onChange={e => {
                                const newLinks = [...formData.pdfLinks];
                                newLinks[idx].title = e.target.value;
                                setFormData({ ...formData, pdfLinks: newLinks });
                              }}
                              placeholder="e.g. Question Bank Vol. 1"
                              className={inputClass}
                            />
                          </div>
                          <div className="flex-[2] space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">PDF URL</label>
                            <input
                              type="text"
                              value={link.url}
                              onChange={e => {
                                const newLinks = [...formData.pdfLinks];
                                newLinks[idx].url = e.target.value;
                                setFormData({ ...formData, pdfLinks: newLinks });
                              }}
                              placeholder="https://..."
                              className={`${inputClass} font-mono`}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newLinks = formData.pdfLinks.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, pdfLinks: newLinks });
                            }}
                            className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all mb-0.5 border border-transparent hover:border-red-100"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-col gap-5 bg-slate-50/40 p-6 rounded-3xl border border-slate-200/60 shadow-sm">

              {/* ── Display Target Selector ── */}
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Display Target *</span>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Where should this bank appear for students?</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'bank', icon: '📦', label: 'Question Bank Only', sub: 'Step 3 — PDF downloads & web reader' },
                    { value: 'practice', icon: '🎯', label: 'Practice Mode Only', sub: 'Step 1 — Interactive CBT drills' },
                    { value: 'both', icon: '🌟', label: 'Both', sub: 'Step 1 + Step 3 combined' }
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        target_mode: opt.value as any,
                        // Auto-manage hasPracticeMode based on target
                        hasPracticeMode: opt.value === 'bank' ? false : true,
                      })}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col gap-1",
                        formData.target_mode === opt.value
                          ? "border-brand-500 bg-brand-50 shadow-md shadow-brand-500/10"
                          : "border-slate-200 bg-white hover:border-brand-300"
                      )}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span className={cn("text-xs font-black tracking-tight", formData.target_mode === opt.value ? "text-brand-700" : "text-slate-700")}>{opt.label}</span>
                      <span className="text-[10px] font-semibold text-slate-400 leading-tight">{opt.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Is Premium ── */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Is Premium / Locked Content?</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={formData.isPremium} onChange={e => setFormData({ ...formData, isPremium: e.target.checked })} className="sr-only peer" />
                  <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-brand-500"></div>
                </label>
              </div>

              {formData.isPremium && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-200/60 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className={labelClass}>Original Price (₹) *</label>
                    <input required type="number" min="0" value={formData.originalPrice} onChange={e => setFormData({ ...formData, originalPrice: e.target.value })} className={inputClass} placeholder="e.g. 999" />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Discounted Price (₹) *</label>
                    <input required type="number" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className={inputClass} placeholder="e.g. 499" />
                  </div>
                </div>
              )}

              {/* ── Practice Now Toggle — only shown for 'both' mode ── */}
              {showPracticeToggle && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                  <div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Enable "Practice Now" in Practice Tests?</span>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Shows a "Practice Now" button on the student-facing Question Bank card.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" id="hasPracticeMode" checked={formData.hasPracticeMode} onChange={e => setFormData({ ...formData, hasPracticeMode: e.target.checked })} className="sr-only peer" />
                    <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[22px] after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-sm peer-checked:bg-brand-500"></div>
                  </label>
                </div>
              )}

              {/* ── Schedule Date & Time ── */}
              <div className="pt-4 border-t border-slate-200/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Schedule Release Date & Time</span>
                  {formData.scheduled_at && (
                    <button type="button" onClick={() => setFormData({ ...formData, scheduled_at: '' })} className="text-xs font-bold text-rose-500 hover:underline">
                      Clear Schedule (Publish Now)
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-semibold">Leave empty to publish immediately. Setting a future date displays a live countdown timer to students.</p>
                <input 
                  type="datetime-local" 
                  value={formData.scheduled_at || ''} 
                  onChange={e => setFormData({ ...formData, scheduled_at: e.target.value })} 
                  className={inputClass} 
                />
                {formData.scheduled_at && (
                  <p className="text-xs font-bold text-brand-600 bg-brand-50 p-2.5 rounded-xl border border-brand-100/60 mt-1">
                    📅 Live on: {new Date(formData.scheduled_at).toLocaleString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                )}
              </div>
            </div>
          </>
        );
      }
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className={labelClass}>Select Exam *</label>
                <SearchableDropdown 
                  required 
                  value={formData.examId} 
                  onChange={v => setFormData({ ...formData, examId: v })} 
                  options={actualExams.map(ex => ({ value: ex.id as string, label: ex.name }))}
                  placeholder="-- Choose Exam --"
                  disabled={!!selectedExamIdForQuestions}
                />
              </div>
              { ((formData.topic || '').startsWith('mockTest__') || questionFilter === 'mock' || selectedTypeForQuestions === 'mock') ? (
                <>
                  <div className="space-y-2">
                    <label className={labelClass}>Select Category *</label>
                    <div className={selectWrapperClass}>
                      <select 
                        required 
                        value={formData.mockCategory || 'full-length'} 
                        onChange={e => setFormData({ ...formData, mockCategory: e.target.value })} 
                        className={selectClass}
                        disabled={!!selectedCategoryForQuestions}
                      >
                        <option value="full-length">Full-Length Mock Tests</option>
                        <option value="sectional">Sectional Tests</option>
                        <option value="pyq">PYQ Tests</option>
                        <option value="daily">Daily / Weekly Tests</option>
                      </select>
                      <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Test Title *</label>
                    <div className={selectWrapperClass}>
                      <select 
                        required 
                        value={formData.topic} 
                        onChange={e => setFormData({ ...formData, topic: e.target.value })} 
                        className={selectClass}
                        disabled={!formData.examId || !!selectedTargetIdForQuestions}
                      >
                        <option value="">-- Choose Mock Test --</option>
                        {mockTests
                          .filter((mt: any) => {
                             let cat = 'full-length';
                             let mExam = '';
                             try { 
                               if (mt.seriesId) {
                                 const parsed = JSON.parse(mt.seriesId);
                                 cat = parsed.category || 'full-length';
                                 mExam = parsed.examId || '';
                               }
                             } catch(e){}
                             return mExam === formData.examId && cat === (formData.mockCategory || 'full-length');
                          })
                          .map((mt: any) => (
                          <option key={mt.id} value={`mockTest__${mt.id}`}>{mt.title}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className={labelClass}>Topic *</label>
                    <div className={selectWrapperClass}>
                      <select 
                        required 
                        value={formData.topic} 
                        onChange={e => setFormData({ ...formData, topic: e.target.value })} 
                        className={selectClass}
                        disabled={!formData.examId || !!selectedTargetIdForQuestions}
                      >
                        <option value="">-- Choose Topic --</option>
                        {banks.filter((b: any) => b.examId === formData.examId).map((bank: any) => (
                          <option key={bank.id} value={bank.title}>{bank.title}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Difficulty *</label>
                    <div className={selectWrapperClass}>
                      <select required value={formData.difficulty} onChange={e => setFormData({ ...formData, difficulty: e.target.value })} className={selectClass}>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                      <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Question Text *</label>
              <textarea required value={formData.questionText} onChange={e => setFormData({ ...formData, questionText: e.target.value })} className={textareaClass} placeholder="Enter question..." />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Option {i + 1}</label>
                  <input required type="text" value={formData.options[i]} onChange={e => handleOptionChange(i, e.target.value)} className={inputClass} />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Correct Answer *</label>
              <div className={selectWrapperClass}>
                <select required value={formData.correctAnswerIndex} onChange={e => setFormData({ ...formData, correctAnswerIndex: e.target.value })} className={selectClass}>
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
                <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelClass}>Explanation *</label>
              <textarea required value={formData.explanation} onChange={e => setFormData({ ...formData, explanation: e.target.value })} className={textareaClass} placeholder="Explain the answer..." />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={labelClass}>Diagram JSON (Optional)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDiagramHelp(!showDiagramHelp)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all focus:outline-none cursor-pointer"
                  >
                    <span>{showDiagramHelp ? 'Hide' : 'Show'} Guide</span>
                  </button>
                  <DiagramTemplateSelector onSelect={(jsonStr) => {
                    try {
                      const parsedArray = JSON.parse(jsonStr);
                      if (Array.isArray(parsedArray) && parsedArray.length > 0 && parsedArray[0].diagram) {
                        setDiagramText(JSON.stringify(parsedArray[0].diagram, null, 2));
                      } else {
                        setDiagramText(jsonStr);
                      }
                    } catch (_) {
                      setDiagramText(jsonStr);
                    }
                  }} />
                </div>
              </div>
              <textarea 
                value={diagramText} 
                onChange={e => setDiagramText(e.target.value)} 
                className={`${textareaClass} font-mono`} 
                placeholder='e.g. { "type": "circle", "radius": 10, "centerLabel": "O" }' 
                rows={4}
              />
              <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
                Use valid JSON formatting. Select templates above or click "Show Guide" to view layout properties and mathematical rendering rules.
              </p>

              {showDiagramHelp && (
                <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-350 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner mt-2">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Diagram Creation Quick Guide</h4>
                    <p className="font-medium">You can create mathematical diagrams using preset templates or build custom ones from vector shapes. The editor automatically fixes quote errors and trailing commas.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-400">1. Embedding Math Notations (KaTeX)</span>
                    <p className="font-medium">You can display complex math symbols, formulas, and Greek characters inside labels. Just wrap them in single dollar signs <code>$formula$</code>.</p>
                    <p className="font-mono bg-white dark:bg-slate-950 p-1.5 rounded border border-slate-200 dark:border-slate-800">
                      {"\"label\": \"Radius $r = \\\\sqrt{x^2 + y^2}$\""}
                    </p>
                    <p className="text-[10px] text-amber-600 font-bold">⚠️ Important: Backslashes inside JSON must be escaped (e.g. write \\sqrt instead of \sqrt).</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-400">2. Preset Visual Templates</span>
                    <p className="font-medium">Import presets from the template selector. Key templates include:</p>
                    <ul className="list-disc pl-4 space-y-0.5 font-medium">
                      <li><code>{"{\"type\": \"circle\", \"radius\": 10, \"chord\": \"AB\", \"distanceFromCenter\": 6}"}</code></li>
                      <li><code>{"{\"type\": \"rightTriangle\", \"leg\": 6, \"hypotenuse\": 10}"}</code></li>
                      <li><code>{"{\"type\": \"parallelogram\", \"base\": 15, \"height\": 6}"}</code></li>
                      <li><code>{"{\"type\": \"cube\", \"side\": 4}"}</code></li>
                      <li><code>{"{\"type\": \"trapezium\", \"parallelSides\": [10, 14], \"height\": 6}"}</code></li>
                      <li><code>{"{\"type\": \"cylinder\", \"radius\": 7, \"height\": 10}"}</code></li>
                    </ul>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-400">3. Generic Vector Canvas (Custom Layouts)</span>
                    <p className="font-medium">Use <code>type: \"vector\"</code> to compile multiple primitives on a grid. Supported primitives are:</p>
                    <ul className="list-disc pl-4 space-y-1 font-mono text-[10px]">
                      <li><b>line</b>: <code>{"{\"type\": \"line\", \"start\": [1,2], \"end\": [5,2], \"stroke\": \"red\", \"dashed\": true, \"label\": \"$L_1$\"}"}</code></li>
                      <li><b>rect</b>: <code>{"{\"type\": \"rect\", \"points\": [[1,1],[9,7]], \"fill\": \"blue\", \"rx\": 4}"}</code></li>
                      <li><b>circle</b>: <code>{"{\"type\": \"circle\", \"center\": [5,4], \"r\": 2.5, \"label\": \"Center\"}"}</code></li>
                      <li><b>text</b>: <code>{"{\"type\": \"text\", \"pos\": [5,4], \"text\": \"$\\theta = 30^\\circ$\"}"}</code></li>
                      <li><b>arc</b>: <code>{"{\"type\": \"arc\", \"center\": [0,0], \"r\": 2, \"startAngle\": 0, \"endAngle\": 90, \"label\": \"$\\alpha$\"}"}</code></li>
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <p className="font-extrabold">Refer to the full guide in your project directory: <code className="bg-white px-1 py-0.5 border rounded">diagram_guidelines.md</code></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case 'questions':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Exam */}
              <div className="space-y-2">
                <label className={labelClass}>Select Exam *</label>
                <SearchableDropdown
                  required
                  value={formData.examId}
                  onChange={v => setFormData({ ...formData, examId: v })}
                  options={actualExams.map(ex => ({ value: ex.id as string, label: ex.name }))}
                  placeholder="-- Choose Exam --"
                />
              </div>

              {/* Topic / Target */}
              <div className="space-y-2">
                <label className={labelClass}>Target Bank or Mock Test *</label>
                <div className={selectWrapperClass}>
                  <select 
                    required
                    value={formData.topic} 
                    onChange={e => setFormData({ ...formData, topic: e.target.value })} 
                    className={selectClass}
                  >
                    <option value="">-- Choose Target --</option>
                    <optgroup label="📦 Question Banks & Practice Sets">
                      {banks
                        .filter(b => !formData.examId || b.examId === formData.examId)
                        .map(b => (
                          <option key={b.id} value={b.title}>
                            [Bank] {b.title}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="📝 Mock Tests">
                      {mockTests
                        .filter(mt => {
                          if (!formData.examId) return true;
                          try {
                            if (mt.seriesId) {
                              const parsed = JSON.parse(mt.seriesId);
                              return parsed.examId === formData.examId;
                            }
                          } catch(e) {}
                          return true;
                        })
                        .map(mt => (
                          <option key={mt.id} value={`mockTest__${mt.id}`}>
                            [Mock Test] {mt.title}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className={labelClass}>Difficulty Level</label>
                <div className={selectWrapperClass}>
                  <select 
                    value={formData.difficulty} 
                    onChange={e => setFormData({ ...formData, difficulty: e.target.value })} 
                    className={selectClass}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className={labelClass}>Question Text *</label>
                <DiagramTemplateSelector onSelect={(jsonStr) => setDiagramText(jsonStr)} />
              </div>
              <textarea 
                required
                rows={4} 
                value={formData.questionText} 
                onChange={e => setFormData({ ...formData, questionText: e.target.value })} 
                className={textareaClass} 
                placeholder="Enter question text here..."
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className={labelClass}>Answer Options (Select Correct Answer Radio) *</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map(idx => (
                  <div key={idx} className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl border transition-all",
                    formData.correctAnswerIndex === idx 
                      ? "bg-brand-50/80 border-brand-300 ring-2 ring-brand-500/20" 
                      : "bg-slate-50/40 border-slate-200"
                  )}>
                    <input 
                      type="radio" 
                      name="correctAnswerIndex"
                      checked={formData.correctAnswerIndex === idx}
                      onChange={() => setFormData({ ...formData, correctAnswerIndex: idx })}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-black text-slate-600 uppercase shrink-0">
                      Opt {String.fromCharCode(65 + idx)}:
                    </span>
                    <input 
                      required
                      type="text" 
                      value={(formData.options && formData.options[idx]) || ''} 
                      onChange={e => {
                        const newOpts = [...(formData.options || ['', '', '', ''])];
                        newOpts[idx] = e.target.value;
                        setFormData({ ...formData, options: newOpts });
                      }} 
                      className="w-full bg-transparent text-slate-800 font-semibold outline-none text-sm" 
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`} 
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <label className={labelClass}>Explanation / Solution</label>
              <textarea 
                rows={3} 
                value={formData.explanation} 
                onChange={e => setFormData({ ...formData, explanation: e.target.value })} 
                className={textareaClass} 
                placeholder="Detailed solution or explanation for the correct answer..."
              />
            </div>

            {/* Diagram JSON (Optional) */}
            <div className="space-y-2">
              <label className={labelClass}>Diagram Data (Optional JSON)</label>
              <textarea 
                rows={3} 
                value={diagramText} 
                onChange={e => setDiagramText(e.target.value)} 
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 bg-slate-50/30 text-slate-800 font-mono text-xs outline-none focus:border-brand-500 transition-all" 
                placeholder='{"type": "geometry", "title": "...", "elements": [...]}'
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  }

  // Column helper
  const renderTableRow = (item: any) => {
    let title = '';
    let category = '';
    let details = '';

    if (activeTab === 'questions') {
      title = item.questionText;
      
      const examObj = exams.find(e => e.id === item.examId);
      const examName = examObj ? examObj.name : 'Unknown Exam';
      
      if ((item.topic || '').startsWith('mockTest__')) {
        const testId = item.topic.split('__')[1];
        const mt = mockTests.find(m => m.id === testId);
        if (mt) {
          category = `${examName} > Mock Test > ${mt.title}`;
        } else {
          category = `${examName} > Mock Test (Orphaned)`;
        }
      } else {
        category = `${examName} > ${item.topic}`;
      }
      
      details = `Diff: ${item.difficulty}`;
    } else if (activeTab === 'series') {
      title = item.title;
      category = `Duration: ${item.durationDays}d`;
      details = `Price: ₹${item.price}`;
    } else if (activeTab === 'tests') {
      title = item.title;
      category = `${item.durationMinutes} mins`;
      let isPremium = false;
      try { if (item.seriesId) isPremium = JSON.parse(item.seriesId).isPremium; } catch(e){}
      details = `Marks: ${item.totalMarks} | ${isPremium ? 'Premium' : 'Free'}`;
    } else if (activeTab === 'exams') {
      title = item.name;
      category = item.category;
      details = item.examDate || 'No Date';
    } else if (activeTab === 'blogs') {
      title = item.name;
      category = 'Blog Post';
      details = item.examDate || 'No Date';
    } else if (activeTab === 'banks') {
      title = item.title;
      category = item.type;
      details = item.isPremium ? 'Premium' : 'Free';
    }

    if (activeTab === 'users') {
      return (
        <tr key={item.uid} className="hover:bg-brand-50/30 transition-colors group border-b border-slate-100">
          <td className="px-8 py-6">
            <div className="flex items-center gap-4">
              {item.photoURL ? (
                <img src={item.photoURL} alt="avatar" loading="lazy" className="w-10 h-10 rounded-full object-cover shadow-sm border border-slate-100" />
              ) : (
                <div className="w-10 h-10 rounded-full premium-gradient text-white flex items-center justify-center font-black text-sm shadow-inner uppercase select-none">
                  <span className="drop-shadow-md">{(item.displayName || item.email || '?').charAt(0)}</span>
                </div>
              )}
              <div>
                <div className="font-extrabold text-slate-900">{item.displayName || 'Unnamed User'}</div>
                <div className="text-sm text-slate-500">{item.email}</div>
              </div>
            </div>
          </td>
          <td className="px-8 py-6">
            <span className={cn("px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider text-nowrap", item.role === 'admin' ? "bg-purple-100 text-purple-700 border border-purple-200" : "bg-slate-100 text-slate-600 border border-slate-200")}>
              {item.role === 'admin' ? 'Admin' : 'Student'}
            </span>
            <div className="mt-2 text-xs font-bold text-slate-500">
               Global Access: {item.hasFullAccess ? <span className="text-green-600">Full</span> : 'Restricted'}
            </div>
          </td>
          <td className="px-8 py-6 text-sm text-slate-700">
            <div className="font-bold mb-2 text-xs uppercase text-slate-500">Purchases ({item.purchasedSeries?.length || 0}):</div>
            <div className="flex gap-2 flex-wrap max-w-xs cursor-pointer">
              {item.purchasedSeries?.length === 0 && <span className="text-slate-400 font-medium italic text-xs">No active purchases.</span>}
              {(item.purchasedSeries || []).map((p: string) => {
                const s = series.find(x => x.id === p);
                const b = banks.find(x => x.id === p);
                const m = mockTests.find(x => x.id === p);
                const name = s?.title || b?.title || m?.title || p;
                return (
                  <span key={p} className="flex flex-col bg-brand-50 border border-brand-200 text-brand-700 px-2 py-1 rounded-md text-xs font-bold shadow-sm">
                    <span className="line-clamp-2" title={name}>{name}</span>
                    <button onClick={async (e) => {
                       e.stopPropagation();
                       if (!confirm(`Are you manually revoking content access to ${name} for ${item.email}?`)) return;
                       const newPurchased = item.purchasedSeries.filter((id: string) => id !== p);
                       
                       try {
                           const session = (await supabase.auth.getSession()).data.session;
                           const token = session?.access_token;
                           const response = await fetch('/api/admin/users/update', {
                              method: 'POST',
                              headers: {
                                 'Content-Type': 'application/json',
                                 'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                 userId: item.uid,
                                 updates: { purchasedSeries: newPurchased }
                              })
                           });
                           const resData = await response.json();
                           if (!response.ok) throw new Error(resData.error || 'Failed to revoke access');
                           alert('Access revoked successfully.');
                        } catch (err: any) {
                           alert(`Failed to revoke access: ${err.message}`);
                        }
                       
                       fetchData();
                    }} className="text-red-500 hover:text-red-700 text-[10px] uppercase mt-1 border-t border-brand-200/50 pt-0.5 self-start">Revoke</button>
                  </span>
                );
              })}
            </div>
          </td>
          <td className="px-8 py-6 text-right">
            <div className="flex flex-col gap-2 justify-end items-end w-44 ml-auto">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setGrantTargetUser(item);
                  setGrantSelectedExamId("");
                  setGrantSelectedCategory("bundle");
                  setGrantSelectedContentId("");
                  setShowGrantModal(true);
                }}
                className="w-full text-center px-3 py-1.5 text-brand-700 bg-brand-100 hover:text-white hover:bg-brand-600 rounded-lg transition-all text-[10px] uppercase font-black border border-brand-200 shadow-sm whitespace-nowrap"
              >
                Grant Content
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setPasswordTargetUser(item);
                  setNewPasswordValue("");
                  setShowPasswordModal(true);
                }}
                className="w-full text-center px-3 py-1.5 text-brand-600 bg-brand-50 hover:text-white hover:bg-brand-600 rounded-lg transition-all text-[10px] uppercase font-black border border-brand-200 shadow-sm whitespace-nowrap"
              >
                Force Set Password
              </button>
              <button 
                onClick={async (e) => {
                  e.stopPropagation();
                  if (!confirm(`Are you sure you want to globally ${item.hasFullAccess ? 'revoke' : 'grant'} full system access to ${item.email}?`)) return;
                  const newAccess = !item.hasFullAccess;
                  
                  try {
                     const session = (await supabase.auth.getSession()).data.session;
                     const token = session?.access_token;
                     const response = await fetch('/api/admin/users/update', {
                        method: 'POST',
                        headers: {
                           'Content-Type': 'application/json',
                           'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                           userId: item.uid,
                           updates: { hasFullAccess: newAccess }
                        })
                     });
                     const resData = await response.json();
                     if (!response.ok) throw new Error(resData.error || 'Failed to update access');
                  } catch (err: any) {
                     alert(`Failed to update access: ${err.message}`);
                  }
                  fetchData();
                }}
                className="w-full text-center px-3 py-1.5 text-slate-600 bg-slate-50 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-all text-xs font-bold border border-slate-200 shadow-sm"
              >
                {item.hasFullAccess ? 'Revoke Master Access' : 'Grant Master Access'}
              </button>
            </div>
          </td>
        </tr>
      );
    }

    return (
      <tr key={item.id} className="hover:bg-brand-50/30 transition-colors group">
        <td className="px-8 py-6">
          <div className="font-extrabold text-slate-900 text-lg line-clamp-2 max-w-md">
            {title}
          </div>
          <div className="text-sm text-slate-500 font-medium mt-1">
            ID: {item.id?.slice(0, 8)}...
          </div>
        </td>
        <td className="px-8 py-6">
          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-extrabold border border-slate-200 uppercase tracking-wider">
            {category}
          </span>
        </td>
        <td className="px-8 py-6 text-sm font-bold text-slate-700">
          {details}
        </td>
        <td className="px-8 py-6 text-right">
          <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            {['tests', 'series', 'banks'].includes(activeTab) && (
              <button 
                onClick={async (e) => {
                   e.stopPropagation();
                   if (!confirm('DANGER ZONE: Are you sure you want to revoke access to this content for EVERY SINGLE USER who purchased it? They will need to repurchase it if you add it to a new cycle.')) return;
                   
                   try {
                      const session = (await supabase.auth.getSession()).data.session;
                      const token = session?.access_token;
                      const response = await fetch('/api/admin/content/revoke', {
                         method: 'POST',
                         headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                         },
                         body: JSON.stringify({
                            productId: item.id
                         })
                      });
                      const resData = await response.json();
                      if (!response.ok) throw new Error(resData.error || 'Failed to revoke content');
                      alert(`Successfully revoked access from users (processed: ${resData.count || 0}).`);
                   } catch (err: any) {
                      alert(`Failed to revoke access: ${err.message}`);
                   }
                   
                   fetchData();
                }}
                className="p-2.5 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all"
                title="Revoke Content for All Users"
              >
                <Users className="w-5 h-5 pointer-events-none" />
              </button>
            )}
            {activeTab === 'tests' && (
              <button 
                onClick={() => {
                   setAttachMockTestId(item.id);
                   setShowMockUploadModal(true);
                }}
                className="p-2.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all"
                title="Upload Questions JSON"
              >
                <Upload className="w-5 h-5" />
              </button>
            )}
            <button 
              className="p-2.5 text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing"
              title="Hold and drag to reorder"
            >
              <GripVertical className="w-5 h-5" />
            </button>

            <button 
              onClick={(e) => handleEditClick(item, e)}
              className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button 
              onClick={(e) => handleDelete(item.id, e)}
              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-50 flex flex-col font-sans" data-lenis-prevent>
      {/* Header */}
      <header className="h-16 glass border-b border-slate-200/50 flex items-center justify-between px-6 shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <h1 className="text-xl font-extrabold text-slate-950 tracking-tight shrink-0 whitespace-nowrap">Admin <span className="premium-text-gradient">Control Center</span></h1>
          <div className="h-6 w-px bg-slate-200 shrink-0" />
          <nav className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 flex-1 min-w-0">
             {[
              { id: 'exams', label: 'Exams', icon: Award },
              { id: 'blogs', label: 'Blog Posts', icon: FileText },
              { id: 'banks', label: 'Question Banks', icon: BookMarked },
              { id: 'practice', label: 'Practice Sets', icon: Target },
              { id: 'series', label: 'Test Series', icon: Layers },
              { id: 'tests', label: 'Mock Tests', icon: Check },
              { id: 'questions', label: 'Questions', icon: FileText },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'updates', label: 'Exam Updates', icon: Bell },
              { id: 'settings', label: 'Site Settings', icon: Settings },
              { id: 'subscribers', label: 'Subscribers', icon: Mail },
              { id: 'notifications', label: 'Push Notify', icon: Bell },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-extrabold transition-all whitespace-nowrap",
                  activeTab === tab.id ? "bg-brand-50 text-brand-700 shadow-sm border border-brand-100" : "text-slate-500 hover:bg-slate-50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 shrink-0">
           <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all border border-slate-200 shadow-sm">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 sm:p-12 overscroll-contain" data-lenis-prevent>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <h2 className="text-4xl font-extrabold text-slate-950 capitalize tracking-tight">
                {activeTab === 'banks' ? 'Question Banks' : activeTab === 'practice' ? 'Practice Sets' : `${activeTab} Manager`}
              </h2>
              <p className="text-slate-500 font-medium text-lg">
                {activeTab === 'banks'
                  ? 'Manage interactive PDF question banks & offline reference material.'
                  : activeTab === 'practice'
                  ? 'Manage interactive chapter-wise drills, daily quizzes, and topic practice.'
                  : `Manage your ${activeTab} data efficiently.`}
              </p>
            </div>
            <div className="flex gap-3 overflow-x-auto custom-scrollbar pb-2 items-center flex-nowrap">
              {['questions', 'tests', 'banks', 'practice', 'exams', 'series', 'blogs', 'users'].includes(activeTab) && (
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium w-40 outline-none focus:border-brand-500 bg-white flex-shrink-0"
                />
              )}
              {['questions', 'banks', 'practice', 'series'].includes(activeTab) && (
                <select
                  value={filterExamId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFilterExamId(val);
                    if (activeTab === 'questions') {
                      if (val === 'all') {
                        setSelectedExamIdForQuestions(null);
                        setSelectedTypeForQuestions(null);
                        setSelectedCategoryForQuestions(null);
                        setSelectedTargetIdForQuestions(null);
                      } else {
                        setSelectedExamIdForQuestions(val);
                        setSelectedTypeForQuestions(null);
                        setSelectedCategoryForQuestions(null);
                        setSelectedTargetIdForQuestions(null);
                      }
                    } else if (activeTab === 'banks' || activeTab === 'practice') {
                      if (val === 'all') setSelectedExamIdForBanks(null);
                      else setSelectedExamIdForBanks(val);
                    } else if (activeTab === 'series') {
                      if (val === 'all') setSelectedExamIdForSeries(null);
                      else setSelectedExamIdForSeries(val);
                    }
                  }}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold bg-white text-slate-700 outline-none focus:border-brand-500 w-32 flex-shrink-0"
                >
                  <option value="all">All Exams</option>
                  {actualExams.map(ex => <option key={ex.id} value={ex.id as string}>{ex.name}</option>)}
                </select>
              )}
              {activeTab === 'questions' && (
                <>
                  <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl mr-2 h-10 border border-slate-200/50 flex-shrink-0">
                    <button onClick={() => setQuestionFilter('all')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all h-full", questionFilter === 'all' ? "bg-white shadow-sm text-brand-600" : "text-slate-500 hover:text-slate-700")}>All</button>
                    <button onClick={() => setQuestionFilter('practice')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all h-full", questionFilter === 'practice' ? "bg-white shadow-sm text-brand-600" : "text-slate-500 hover:text-slate-700")}>Practice</button>
                    <button onClick={() => setQuestionFilter('mock')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all h-full", questionFilter === 'mock' ? "bg-white shadow-sm text-brand-600" : "text-slate-500 hover:text-slate-700")}>Mock Tests</button>
                  </div>
                  <button 
                    onClick={() => setShowBulkUploadModal(true)}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 glass border border-slate-200 rounded-xl text-sm font-extrabold hover:bg-white transition-all premium-shadow flex-shrink-0"
                  >
                    <Upload className="w-4 h-4" /> Bulk Upload
                  </button>
                  {/* Selected items delete button handled generically next to Add New */}
                  {(() => {
                     if (items.length === 0 || filterExamId === 'all') return null;
                     const targetExamId = items[0].examId;
                     const targetTopic = items[0].topic;
                     // Only show button if all displayed items fall under the EXACT same exam and topic.
                     const isSpecificSelection = items.every((q: any) => q.examId === targetExamId && q.topic === targetTopic);
                     if (!isSpecificSelection) return null;
                     
                     return (
                       <button 
                         onClick={async () => {
                            const subjectName = (targetTopic || '').startsWith('mockTest__') ? 'this Mock Test' : `the subject '${targetTopic}'`;
                            const confirmMessage = `WARNING: Are you sure you want to delete ALL ${items.length} questions for ${subjectName}?\n\nThis action cannot be undone.`;
                            if (!confirm(confirmMessage)) return;
                            
                            try {
                                const promises = items.map((item: any) => examService.deleteQuestion(item.id));
                                await Promise.all(promises);
                                alert(`Successfully deleted ${items.length} questions.`);
                                fetchData();
                            } catch(e: any) {
                                alert(`Failed to delete some or all questions: ${e.message}`);
                                fetchData();
                            }
                         }}
                         className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-extrabold hover:bg-red-100 transition-all premium-shadow flex-shrink-0"
                       >
                         <Trash2 className="w-4 h-4" /> Bulk Delete Filtered
                       </button>
                     );
                  })()}
                </>
              )}
              {activeTab === 'tests' && selectedExamIdForTests && selectedCategoryForTests && (
                <>
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl mr-2 h-10 border border-slate-200/50 flex-shrink-0">
                    <button 
                      onClick={() => saveMockTestSortDirection('asc')} 
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-bold transition-all h-full flex items-center gap-1.5", 
                        testSortDirection === 'asc' ? "bg-white shadow-sm text-brand-600 font-extrabold" : "text-slate-500 hover:text-slate-700"
                      )}
                      title="Sort Ascending (1 at top)"
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span className="hidden sm:inline">Asc</span>
                    </button>
                    <button 
                      onClick={() => saveMockTestSortDirection('desc')} 
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-bold transition-all h-full flex items-center gap-1.5", 
                        testSortDirection === 'desc' ? "bg-white shadow-sm text-brand-600 font-extrabold" : "text-slate-500 hover:text-slate-700"
                      )}
                      title="Sort Descending (highest at top)"
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span className="hidden sm:inline">Desc</span>
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      setAttachMockTestId(null);
                      setShowMockUploadModal(true);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 glass border border-slate-200 rounded-xl text-sm font-extrabold hover:bg-white transition-all premium-shadow flex-shrink-0"
                  >
                    <Upload className="w-4 h-4" /> Bulk Upload Questions
                  </button>
                  {(() => {
                     if (items.length === 0 || !selectedExamIdForTests) return null;
                     return (
                       <button 
                         onClick={async () => {
                            const confirmMessage = `WARNING: Are you sure you want to delete ALL ${items.length} Mock Tests currently displayed?\n\nThis will permanently delete the test configurations. This action cannot be undone.`;
                            if (!confirm(confirmMessage)) return;
                            
                            try {
                                const promises = items.map((item: any) => examService.deleteMockTest(item.id));
                                await Promise.all(promises);
                                alert(`Successfully deleted ${items.length} Mock Tests.`);
                                fetchData();
                            } catch(e: any) {
                                alert(`Failed to delete some or all tests: ${e.message}`);
                                fetchData();
                            }
                         }}
                         className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-extrabold hover:bg-red-100 transition-all premium-shadow flex-shrink-0"
                       >
                         <Trash2 className="w-4 h-4" /> Bulk Delete Filtered
                       </button>
                     );
                  })()}
                </>
              )}
              {(activeTab === 'banks' || activeTab === 'practice') && (
                <>
                  <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl mr-2 h-10 border border-slate-200/50 flex-shrink-0">
                    <button onClick={() => setBankFilter('all')} className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all h-full", bankFilter === 'all' ? "bg-white shadow-sm text-brand-600 font-extrabold" : "text-slate-500 hover:text-slate-700")}>All</button>
                    <button onClick={() => setBankFilter('topic-wise')} className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all h-full", bankFilter === 'topic-wise' ? "bg-white shadow-sm text-brand-600 font-extrabold" : "text-slate-500 hover:text-slate-700")}>{activeTab === 'practice' ? 'Chapter Practice' : 'Chapter-Wise'}</button>
                    <button onClick={() => setBankFilter('exam-focused')} className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all h-full", bankFilter === 'exam-focused' ? "bg-white shadow-sm text-brand-600 font-extrabold" : "text-slate-500 hover:text-slate-700")}>High-Yield</button>
                    <button onClick={() => setBankFilter('revision-sets')} className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all h-full", bankFilter === 'revision-sets' ? "bg-white shadow-sm text-brand-600 font-extrabold" : "text-slate-500 hover:text-slate-700")}>{activeTab === 'practice' ? 'Daily Quizzes' : 'Revision Sets'}</button>
                    <button onClick={() => setBankFilter('pyq-collections')} className={cn("px-3 py-1.5 rounded-lg text-sm font-bold transition-all h-full", bankFilter === 'pyq-collections' ? "bg-white shadow-sm text-brand-600 font-extrabold" : "text-slate-500 hover:text-slate-700")}>Topic PYQs</button>
                  </div>
                  {(() => {
                     if (items.length === 0 || filterExamId === 'all') return null;
                     const itemLabel = activeTab === 'practice' ? 'Practice Sets' : 'Question Banks';
                     return (
                       <button 
                         onClick={async () => {
                            const confirmMessage = `WARNING: Are you sure you want to delete ALL ${items.length} ${itemLabel} currently displayed?\n\nThis will safely remove these ${itemLabel}. This action cannot be undone.`;
                            if (!confirm(confirmMessage)) return;
                            
                            try {
                                const promises = items.map((item: any) => {
                                  if (activeTab === 'practice') {
                                    if (item.target_mode === 'both') return examService.updateQuestionBank(item.id, { target_mode: 'bank' });
                                    return examService.deleteQuestionBank(item.id);
                                  } else {
                                    if (item.target_mode === 'both') return examService.updateQuestionBank(item.id, { target_mode: 'practice' });
                                    return examService.deleteQuestionBank(item.id);
                                  }
                                });
                                await Promise.all(promises);
                                alert(`Successfully processed ${items.length} ${itemLabel}.`);
                                fetchData();
                            } catch(e: any) {
                                alert(`Failed to delete some or all items: ${e.message}`);
                                fetchData();
                            }
                         }}
                         className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-extrabold hover:bg-red-100 transition-all premium-shadow flex-shrink-0"
                       >
                         <Trash2 className="w-4 h-4" /> Bulk Delete Filtered
                       </button>
                     );
                  })()}
                </>
              )}
              {activeTab === 'exams' && (
                <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-xl mr-2 h-10 border border-slate-200/50 flex-shrink-0">
                  <button onClick={() => setExamFilter('all')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all h-full", examFilter === 'all' ? "bg-white shadow-sm text-brand-600" : "text-slate-500 hover:text-slate-700")}>All</button>
                  <button onClick={() => setExamFilter('popular')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all h-full", examFilter === 'popular' ? "bg-white shadow-sm text-brand-600" : "text-slate-500 hover:text-slate-700")}>Popular</button>
                  <button onClick={() => setExamFilter('upcoming')} className={cn("px-4 py-1.5 rounded-lg text-sm font-bold transition-all h-full", examFilter === 'upcoming' ? "bg-white shadow-sm text-brand-600" : "text-slate-500 hover:text-slate-700")}>Upcoming</button>
                </div>
              )}
              {selectedItemIds.size > 0 && (
                <button 
                  onClick={async () => {
                    const tabLabelMap: Record<string, string> = {
                      questions: 'question(s)',
                      tests: 'mock test(s)',
                      series: 'test series',
                      banks: 'question bank(s)',
                      practice: 'practice set(s)',
                      exams: 'exam(s)',
                      blogs: 'blog post(s)'
                    };
                    const label = tabLabelMap[activeTab] || 'item(s)';
                    const confirmMessage = `Are you sure you want to delete the ${selectedItemIds.size} selected ${label}?\n\nThis action cannot be undone.`;
                    if (!confirm(confirmMessage)) return;
                    
                    setLoading(true);
                    const idsToDelete: string[] = Array.from(selectedItemIds);
                    
                    // Optimistically update UI
                    if (activeTab === 'questions') setQuestions(prev => prev.filter(q => !selectedItemIds.has(q.id)));
                    else if (activeTab === 'series') setSeries(prev => prev.filter(s => !selectedItemIds.has(s.id)));
                    else if (activeTab === 'tests') setMockTests(prev => prev.filter(t => !selectedItemIds.has(t.id)));
                    else if (activeTab === 'exams' || activeTab === 'blogs') setExams(prev => prev.filter(ex => !selectedItemIds.has(ex.id)));
                    else if (activeTab === 'banks') {
                      setBanks(prev => prev.map(b => {
                        if (!selectedItemIds.has(b.id)) return b;
                        if (b.target_mode === 'both') return { ...b, target_mode: 'practice' };
                        return null as any;
                      }).filter(Boolean));
                    } else if (activeTab === 'practice') {
                      setBanks(prev => prev.map(b => {
                        if (!selectedItemIds.has(b.id)) return b;
                        if (b.target_mode === 'both') return { ...b, target_mode: 'bank' };
                        return null as any;
                      }).filter(Boolean));
                    }
                    
                    setSelectedItemIds(new Set());
                    
                    try {
                      const promises = idsToDelete.map(id => {
                        if (activeTab === 'questions') return examService.deleteQuestion(id);
                        if (activeTab === 'series') return examService.deleteTestSeries(id);
                        if (activeTab === 'tests') return examService.deleteMockTest(id);
                        if (activeTab === 'exams' || activeTab === 'blogs') return examService.deleteExam(id);
                        if (activeTab === 'banks') {
                          const target = banks.find(b => b.id === id);
                          if (target && target.target_mode === 'both') {
                            return examService.updateQuestionBank(id, { target_mode: 'practice' });
                          }
                          return examService.deleteQuestionBank(id);
                        }
                        if (activeTab === 'practice') {
                          const target = banks.find(b => b.id === id);
                          if (target && target.target_mode === 'both') {
                            return examService.updateQuestionBank(id, { target_mode: 'bank' });
                          }
                          return examService.deleteQuestionBank(id);
                        }
                        return Promise.resolve();
                      });
                      await Promise.all(promises);
                      alert(`Successfully deleted ${idsToDelete.length} ${label}.`);
                    } catch (error: any) {
                      alert('Error deleting items: ' + (error.message || error));
                    } finally {
                      setLoading(false);
                      fetchData();
                    }
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-xl text-sm font-extrabold transition-all shadow-md flex-shrink-0 animate-in fade-in zoom-in-95 duration-150"
                >
                  <Trash2 className="w-4 h-4" /> Delete Selected ({selectedItemIds.size})
                </button>
              )}
              {(['questions', 'banks', 'exams', 'series', 'blogs'].includes(activeTab) || (activeTab === 'tests' && selectedExamIdForTests && selectedCategoryForTests)) && (
                <button 
                  onClick={() => openAddModal(activeTab)}
                  className="flex items-center gap-2 px-8 py-2.5 premium-gradient text-white rounded-xl text-sm font-extrabold hover:premium-glow shadow-lg shadow-brand-500/20 transition-all active:scale-95"
                >
                  <Plus className="w-5 h-5" /> Add New
                </button>
              )}
              {/* Bulk Import button — banks, practice, tests only */}
              {(['banks', 'practice', 'tests'].includes(activeTab)) && (
                <button
                  onClick={() => {
                    setBulkResults(null);
                    const sticky = getStickyBulkData(activeTab);
                    setBulkGlobalExamId(sticky.examId);
                    setBulkGlobalCategory(sticky.category);
                    setBulkGlobalTargetMode(sticky.target_mode);
                    setBulkGlobalIsPremium(sticky.isPremium);
                    setBulkGlobalPrice(sticky.price);
                    setBulkGlobalOriginalPrice(sticky.originalPrice);
                    setBulkGlobalScheduledAt(sticky.scheduled_at);
                    setBulkGlobalDurationMinutes(sticky.durationMinutes);
                    setBulkGlobalTotalMarks(sticky.totalMarks);
                    setBulkGlobalNegativeMarking(sticky.negativeMarking);
                    setBulkJsonInput(sticky.jsonInput);
                    setShowBulkModal(true);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-xl text-sm font-extrabold transition-all shadow-sm active:scale-95"
                >
                  <FileJson className="w-4 h-4 text-brand-600" /> Bulk Import
                </button>
              )}
            </div>
          </div>

          {/* Table View */}
          {activeTab === 'settings' ? (
             <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70 p-8 sm:p-12 space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">YouTube Carousel Integration</h3>
                  <p className="text-slate-500 font-medium mt-2 text-lg">Manage the YouTube videos displayed on the main student dashboard.</p>
                </div>
                
                <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100 flex gap-4 items-start shadow-sm">
                  <AlertCircle className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">You can paste full YouTube links securely!</p>
                    <p className="text-sm font-medium text-slate-600">
                      Just paste the <b>full YouTube URL</b> (e.g. <span className="text-brand-600 font-mono">https://youtu.be/dQw4w9WgXcQ?si=RandomTracker</span>). The system will automatically extract the secure <span className="text-brand-600 font-mono">11-character</span> Video ID. Put one link per line.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Active Video IDs</label>
                  <textarea 
                     rows={8}
                     className="w-full px-6 py-5 rounded-2xl border-2 border-slate-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all font-mono shadow-inner bg-white text-slate-700 font-bold"
                     placeholder="dQw4w9WgXcQ&#10;jNQXAC9IVRw&#10;EngW7tCbLHY"
                     value={youtubeVideosInput}
                     onChange={e => setYoutubeVideosInput(e.target.value)}
                  />
                </div>
                
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button onClick={async () => {
                     try {
                        const parsedIds = youtubeVideosInput.split('\n')
                           .map(s => {
                              const str = s.trim();
                              if (!str) return null;
                              
                              // Extract exactly 11 characters from any standard youtube URL
                              const match = str.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\n]{11})/);
                              if (match && match[1]) return match[1];
                              
                              // If they pasted just the 11 character string directly
                              if (str.length === 11) return str;
                              
                              return 'INVALID';
                           })
                           .filter(Boolean);
                           
                        if (parsedIds.includes('INVALID')) {
                           alert('Error: One or more of your lines is not a valid 11-character YouTube Video ID or URL. (Do not paste the 16-character tracking ID!). Please paste the FULL YouTube links instead to let the system extract it automatically.');
                           return;
                        }

                        const updated = {
                           name: 'SYSTEM_SETTINGS_YOUTUBE_RESERVED',
                           description: JSON.stringify({ videos: parsedIds }),
                           icon: '⚙️',
                           category: 'system' as const
                        };
                        const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_YOUTUBE_RESERVED');
                        if (exists && exists.id) {
                           await examService.updateExam(exists.id, updated);
                        } else {
                           await examService.addExam(updated);
                        }
                        alert("Great! Your YouTube configuration was securely saved and published globally.");
                     } catch(err: any) { alert(`Failed to save settings: ${err.message || 'Unknown error'}`); }
                  }} className="px-10 py-3.5 premium-gradient text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/20 hover:premium-glow transition-all active:scale-95 text-lg">Save YouTube Library</button>
                </div>
              {/* ── Hero Card Editor ── */}
              <div className="mt-10 border-t-2 border-dashed border-slate-200 pt-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">🃏 Hero Card Editor</h3>
                  <p className="text-slate-500 font-medium mt-2 text-lg">Customize the interactive question card displayed on the homepage hero section.</p>
                </div>

                {/* Info banner */}
                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex gap-4 items-start shadow-sm">
                  <AlertCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">Live on homepage after save!</p>
                    <p className="text-sm font-medium text-slate-600">
                      Changes publish instantly to the home page hero card. Students will see the new question next time they load the page.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  {/* LEFT: Form */}
                  <div className="space-y-6">
                    {/* Row 1: Exam Label + Question Number */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Exam Label</label>
                        <input
                          type="text"
                          value={heroCard.examLabel}
                          onChange={e => setHeroCard((h: any) => ({ ...h, examLabel: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                          placeholder="OPSC Prelims Mock"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Question Number</label>
                        <input
                          type="text"
                          value={heroCard.questionNumber}
                          onChange={e => setHeroCard((h: any) => ({ ...h, questionNumber: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                          placeholder="Q. 42"
                        />
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Question Text *</label>
                      <textarea
                        rows={3}
                        value={heroCard.questionText}
                        onChange={e => setHeroCard((h: any) => ({ ...h, questionText: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white resize-none"
                        placeholder="Enter the question..."
                      />
                    </div>

                    {/* Options A-D */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Answer Options — click the radio to set correct answer</label>
                      {['A', 'B', 'C', 'D'].map((letter, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setHeroCard((h: any) => ({ ...h, correctIndex: idx }))}
                            className={cn(
                              "shrink-0 w-8 h-8 rounded-lg font-black text-xs flex items-center justify-center border-2 transition-all",
                              heroCard.correctIndex === idx
                                ? "bg-emerald-500 text-white border-emerald-500 shadow-md"
                                : "bg-slate-100 text-slate-500 border-slate-200 hover:border-brand-400"
                            )}
                            title={heroCard.correctIndex === idx ? "Correct answer" : "Click to set as correct"}
                          >
                            {heroCard.correctIndex === idx ? '✓' : letter}
                          </button>
                          <input
                            type="text"
                            value={heroCard.options[idx] || ''}
                            onChange={e => {
                              const newOptions = [...heroCard.options];
                              newOptions[idx] = e.target.value;
                              setHeroCard((h: any) => ({ ...h, options: newOptions }));
                            }}
                            className={cn(
                              "flex-1 px-4 py-2.5 rounded-xl border-2 outline-none transition-all font-bold text-sm bg-white",
                              heroCard.correctIndex === idx
                                ? "border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-emerald-50/50"
                                : "border-slate-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                            )}
                            placeholder={`Option ${letter}`}
                          />
                        </div>
                      ))}
                      <p className="text-xs text-slate-400 font-semibold pt-1">
                        🟢 Green button = correct answer. Click any button to change.
                      </p>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Explanation</label>
                      <textarea
                        rows={3}
                        value={heroCard.explanation}
                        onChange={e => setHeroCard((h: any) => ({ ...h, explanation: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white resize-none"
                        placeholder="Explain the correct answer..."
                      />
                    </div>

                    {/* Marks + Penalty */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Marks per Q</label>
                        <input
                          type="number"
                          step="0.25"
                          min="0"
                          value={heroCard.marks}
                          onChange={e => setHeroCard((h: any) => ({ ...h, marks: parseFloat(e.target.value) || 1 }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Negative Marking</label>
                        <input
                          type="number"
                          step="0.05"
                          min="0"
                          value={heroCard.penalty}
                          onChange={e => setHeroCard((h: any) => ({ ...h, penalty: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                        />
                      </div>
                    </div>

                    {/* Save */}
                    <div className="flex justify-end pt-2 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          try {
                            const updated = {
                              name: 'SYSTEM_SETTINGS_HERO_CARD',
                              description: JSON.stringify(heroCard),
                              icon: '🃏',
                              category: 'system' as const
                            };
                            const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_HERO_CARD');
                            if (exists && exists.id) {
                              await examService.updateExam(exists.id, updated);
                            } else {
                              await examService.addExam(updated);
                            }
                            await fetchData();
                            alert('✅ Hero card saved and published to homepage!');
                          } catch (err: any) { alert(`Failed to save: ${err.message || 'Unknown error'}`); }
                        }}
                        className="px-10 py-3.5 premium-gradient text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/20 hover:premium-glow transition-all active:scale-95 text-lg"
                      >
                        Save Hero Card
                      </button>
                    </div>
                  </div>

                  {/* RIGHT: Live Preview */}
                  <div className="space-y-3">
                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Live Preview</label>
                    <div className="w-full bg-white border-2 border-slate-900/80 rounded-[1.5rem] p-6 shadow-[6px_6px_0px_rgba(37,99,235,1)] relative overflow-hidden font-sans">
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03] grid-bg" />

                      {/* Card Header */}
                      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 bg-[#2563EB] rounded-full" />
                          <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest">{heroCard.examLabel || 'EXAM LABEL'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">⏱ 08:42</span>
                          <span className="text-[10px] font-extrabold text-[#2563EB] bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">{heroCard.questionNumber || 'Q. 1'}</span>
                        </div>
                      </div>

                      {/* Question */}
                      <p className="text-xs font-bold text-slate-900 leading-relaxed mb-3 line-clamp-3">
                        <MathTextRenderer text={heroCard.questionText || 'Question text will appear here...'} />
                      </p>

                      {(() => {
                        const question = heroCard;
                        console.log("QUESTION", question);
                        console.log("DIAGRAM", question.diagram);
                        console.log("TYPE", question.diagram?.type);
                        return null;
                      })()}
                      {heroCard.diagram ? (
                        <DiagramRenderer diagram={heroCard.diagram} data={heroCard.diagram} />
                      ) : null}

                      {/* Options */}
                      <div className="space-y-1.5 mb-3">
                        {(heroCard.options || []).map((opt: string, idx: number) => (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold",
                              idx === heroCard.correctIndex
                                ? "border-emerald-400 bg-emerald-50 text-emerald-800"
                                : "border-slate-200 bg-slate-50 text-slate-700"
                            )}
                          >
                            <span className={cn(
                              "w-5 h-5 rounded flex items-center justify-center font-black text-[9px] shrink-0",
                              idx === heroCard.correctIndex ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                            )}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                             <span className="truncate">
                               <MathTextRenderer text={opt || `Option ${String.fromCharCode(65 + idx)}`} isOption />
                             </span>
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        <span>Marks: {heroCard.marks?.toFixed(2)}</span>
                        <span>Penalty: {heroCard.penalty?.toFixed(2)}</span>
                        <span>Status: Interactive Demo</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-semibold text-center">Preview updates as you type. Green = correct answer.</p>
                  </div>
                </div>
              </div>

              {/* ── Exam Registry Editor ── */}
              <div className="mt-10 border-t-2 border-dashed border-slate-200 pt-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">📋 Live Exam Registry</h3>
                  <p className="text-slate-500 font-medium mt-2 text-lg">Manage the exam status cards shown in the homepage "Live Exam Registry" section.</p>
                </div>

                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex gap-4 items-start shadow-sm">
                  <AlertCircle className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">Rows publish to homepage instantly after save!</p>
                    <p className="text-sm font-medium text-slate-600">Add, edit or remove rows. You can have 1–5 entries. Each row shows the exam name, status badge, date/deadline and a Practice button.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {examRegistry.map((row: any, idx: number) => (
                    <div key={idx} className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm relative">
                      {/* Row header */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Row {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => setExamRegistry((r: any[]) => r.filter((_: any, i: number) => i !== idx))}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                          title="Remove row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Exam Name */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Exam Name *</label>
                          <input
                            type="text"
                            value={row.exam}
                            onChange={e => {
                              const updated = [...examRegistry];
                              updated[idx] = { ...updated[idx], exam: e.target.value };
                              setExamRegistry(updated);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                            placeholder="e.g. OPSC Civil Services Examination (OCS)"
                          />
                        </div>

                        {/* Status */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Status Badge</label>
                          <select
                            value={row.status}
                            onChange={e => {
                              const updated = [...examRegistry];
                              updated[idx] = { ...updated[idx], status: e.target.value };
                              setExamRegistry(updated);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                          >
                            {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          {/* Live badge preview */}
                          <div className="mt-1">
                            <span className={cn(
                              "inline-flex px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border",
                              STATUS_OPTIONS.find(s => s.value === row.status)?.color || 'bg-slate-50 text-slate-600 border-slate-200'
                            )}>
                              {STATUS_OPTIONS.find(s => s.value === row.status)?.label || row.status}
                            </span>
                          </div>
                        </div>

                        {/* Date/Deadline */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Date / Deadline Label</label>
                          <input
                            type="text"
                            value={row.date}
                            onChange={e => {
                              const updated = [...examRegistry];
                              updated[idx] = { ...updated[idx], date: e.target.value };
                              setExamRegistry(updated);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                            placeholder="e.g. Prelims: July 15, 2026"
                          />
                        </div>

                        {/* Action Label */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Button Label</label>
                          <input
                            type="text"
                            value={row.actionLabel}
                            onChange={e => {
                              const updated = [...examRegistry];
                              updated[idx] = { ...updated[idx], actionLabel: e.target.value };
                              setExamRegistry(updated);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                            placeholder="e.g. Practice OPSC"
                          />
                        </div>

                        {/* Exam Key */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Link to Exam (for Practice button)</label>
                          <select
                            value={row.examKey || ''}
                            onChange={e => {
                              const updated = [...examRegistry];
                              updated[idx] = { ...updated[idx], examKey: e.target.value };
                              setExamRegistry(updated);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                          >
                            <option value="">— None (no scroll) —</option>
                            {actualExams.map(ex => (
                              <option key={ex.id as string} value={ex.id as string}>{ex.name}</option>
                            ))}
                          </select>
                          {row.examKey && (
                            <p className="text-[10px] font-semibold text-brand-600 mt-1">
                              ✓ Linked: {actualExams.find(ex => ex.id === row.examKey)?.name || row.examKey}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add row */}
                  {examRegistry.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setExamRegistry((r: any[]) => [
                        ...r,
                        { exam: '', status: 'notification', date: '', actionLabel: 'Practice', examKey: '' }
                      ])}
                      className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-2xl text-sm font-extrabold text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Row
                    </button>
                  )}
                </div>

                {/* Save */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      try {
                        const updated = {
                          name: 'SYSTEM_SETTINGS_EXAM_REGISTRY',
                          description: JSON.stringify(examRegistry),
                          icon: '📋',
                          category: 'system' as const
                        };
                        const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_EXAM_REGISTRY');
                        if (exists && exists.id) {
                          await examService.updateExam(exists.id, updated);
                        } else {
                          await examService.addExam(updated);
                        }
                        await fetchData();
                        alert('✅ Exam Registry saved and published to homepage!');
                      } catch (err: any) { alert(`Failed to save: ${err.message || 'Unknown error'}`); }
                    }}
                    className="px-10 py-3.5 premium-gradient text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/20 hover:premium-glow transition-all active:scale-95 text-lg"
                  >
                    Publish Registry
                  </button>
                </div>
              </div>

              {/* ── Syllabus Roadmaps Editor ── */}
              <div className="mt-10 border-t-2 border-dashed border-slate-200 pt-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">📚 Syllabus Roadmaps</h3>
                  <p className="text-slate-500 font-medium mt-2 text-lg">Manage the tabbed subject cards in the homepage "Syllabus Roadmaps" section.</p>
                </div>

                <div className="bg-violet-50 p-5 rounded-2xl border border-violet-100 flex gap-4 items-start shadow-sm">
                  <AlertCircle className="w-6 h-6 text-violet-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">Full control — tabs, topics, counts, labels!</p>
                    <p className="text-sm font-medium text-slate-600">Add up to 5 tabs (e.g. General Studies, Language Core). Each tab can have up to 8 topic cards with a name, badge label, and set count.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                  {/* LEFT: Tab list + editor */}
                  <div className="xl:col-span-3 space-y-6">
                    {/* Tab selector bar */}
                    <div className="flex gap-2 flex-wrap items-center">
                      {syllabusRoadmaps.map((tab: any, ti: number) => (
                        <div key={ti} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSyllabusActiveTab(ti)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all",
                              syllabusActiveTab === ti
                                ? "bg-brand-600 text-white border-brand-600 shadow"
                                : "bg-white text-slate-600 border-slate-200 hover:border-brand-400"
                            )}
                          >
                            {tab.label || `Tab ${ti + 1}`}
                          </button>
                          {syllabusRoadmaps.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = syllabusRoadmaps.filter((_: any, i: number) => i !== ti);
                                setSyllabusRoadmaps(updated);
                                setSyllabusActiveTab(Math.max(0, ti - 1));
                              }}
                              className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                              title="Delete tab"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                      {syllabusRoadmaps.length < 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newTab = { id: `tab${Date.now()}`, label: 'New Tab', topics: [] };
                            setSyllabusRoadmaps([...syllabusRoadmaps, newTab]);
                            setSyllabusActiveTab(syllabusRoadmaps.length);
                          }}
                          className="px-3 py-2 rounded-xl border-2 border-dashed border-slate-300 text-xs font-extrabold text-slate-400 hover:border-brand-400 hover:text-brand-600 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Tab
                        </button>
                      )}
                    </div>

                    {/* Active tab editor */}
                    {syllabusRoadmaps[syllabusActiveTab] && (() => {
                      const tab = syllabusRoadmaps[syllabusActiveTab];
                      const updateTab = (changes: any) => {
                        const updated = [...syllabusRoadmaps];
                        updated[syllabusActiveTab] = { ...updated[syllabusActiveTab], ...changes };
                        setSyllabusRoadmaps(updated);
                      };
                      return (
                        <div className="space-y-5">
                          {/* Tab label */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Tab Label</label>
                            <input
                              type="text"
                              value={tab.label}
                              onChange={e => updateTab({ label: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                              placeholder="e.g. General Studies"
                            />
                          </div>

                          {/* Topics */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Topics ({(tab.topics || []).length}/8)</label>
                            </div>
                            {(tab.topics || []).map((topic: any, ti2: number) => (
                              <div key={ti2} className="bg-white border-2 border-slate-100 rounded-xl p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Topic {ti2 + 1}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newTopics = (tab.topics || []).filter((_: any, i: number) => i !== ti2);
                                      updateTab({ topics: newTopics });
                                    }}
                                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  <div className="sm:col-span-2 space-y-1">
                                    <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Topic Name</label>
                                    <input
                                      type="text"
                                      value={topic.name}
                                      onChange={e => {
                                        const newTopics = [...(tab.topics || [])];
                                        newTopics[ti2] = { ...newTopics[ti2], name: e.target.value };
                                        updateTab({ topics: newTopics });
                                      }}
                                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-100 outline-none focus:border-brand-500 transition-all font-bold text-xs bg-slate-50"
                                      placeholder="e.g. Odisha History & Heritage"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Sets Count</label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={topic.count}
                                      onChange={e => {
                                        const newTopics = [...(tab.topics || [])];
                                        newTopics[ti2] = { ...newTopics[ti2], count: parseInt(e.target.value) || 0 };
                                        updateTab({ topics: newTopics });
                                      }}
                                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-100 outline-none focus:border-brand-500 transition-all font-bold text-xs bg-slate-50"
                                    />
                                  </div>
                                  <div className="sm:col-span-3 space-y-1">
                                    <label className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Badge Label</label>
                                    <input
                                      type="text"
                                      value={topic.label}
                                      onChange={e => {
                                        const newTopics = [...(tab.topics || [])];
                                        newTopics[ti2] = { ...newTopics[ti2], label: e.target.value };
                                        updateTab({ topics: newTopics });
                                      }}
                                      className="w-full px-3 py-2 rounded-lg border-2 border-slate-100 outline-none focus:border-brand-500 transition-all font-bold text-xs bg-slate-50"
                                      placeholder="e.g. Crucial for OPSC Prelims"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                            {(tab.topics || []).length < 8 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newTopics = [...(tab.topics || []), { name: '', count: 0, label: '' }];
                                  updateTab({ topics: newTopics });
                                }}
                                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-extrabold text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Topic Card
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* RIGHT: Live preview */}
                  <div className="xl:col-span-2 space-y-3">
                    <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider">Live Preview</label>
                    {/* Tabs */}
                    <div className="flex gap-1.5 flex-wrap p-1.5 bg-slate-100/60 rounded-xl border border-slate-200/50">
                      {syllabusRoadmaps.map((tab: any, i: number) => (
                        <span
                          key={i}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            i === syllabusActiveTab ? "bg-white text-slate-900 shadow-sm border border-slate-200" : "text-slate-400"
                          )}
                        >
                          {tab.label || `Tab ${i + 1}`}
                        </span>
                      ))}
                    </div>
                    {/* Topic cards */}
                    <div className="grid grid-cols-1 gap-2">
                      {((syllabusRoadmaps[syllabusActiveTab]?.topics) || []).slice(0, 6).map((topic: any, i: number) => (
                        <div key={i} className="bg-white border-2 border-slate-900/70 rounded-xl p-3 shadow-[3px_3px_0px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3">
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-wider text-[#2563EB] truncate">{topic.label || 'Badge Label'}</p>
                            <p className="text-xs font-serif font-extrabold text-slate-900 leading-tight truncate">{topic.name || 'Topic Name'}</p>
                          </div>
                          <span className="shrink-0 inline-flex px-2 py-0.5 bg-brand-50 text-[#2563EB] rounded font-mono text-[9px] font-black border border-brand-100">{topic.count || 0} Sets</span>
                        </div>
                      ))}
                      {((syllabusRoadmaps[syllabusActiveTab]?.topics) || []).length === 0 && (
                        <p className="text-xs text-slate-400 font-semibold text-center py-6">Add topics above to see preview</p>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold text-center">Showing active tab preview</p>
                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      try {
                        const updated = {
                          name: 'SYSTEM_SETTINGS_SYLLABUS_ROADMAPS',
                          description: JSON.stringify(syllabusRoadmaps),
                          icon: '📚',
                          category: 'system' as const
                        };
                        const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_SYLLABUS_ROADMAPS');
                        if (exists && exists.id) {
                          await examService.updateExam(exists.id, updated);
                        } else {
                          await examService.addExam(updated);
                        }
                        await fetchData();
                        alert('✅ Syllabus Roadmaps saved and published to homepage!');
                      } catch (err: any) { alert(`Failed to save: ${err.message || 'Unknown error'}`); }
                    }}
                    className="px-10 py-3.5 premium-gradient text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/20 hover:premium-glow transition-all active:scale-95 text-lg"
                  >
                  </button>
                </div>
              </div>

              {/* ── Success Journeys (Achievers Journal) Editor ── */}
              <div className="mt-10 border-t-2 border-dashed border-slate-200 pt-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">🏆 Success Journeys / Achievers Journal</h3>
                  <p className="text-slate-500 font-medium mt-2 text-lg">Manage student success journey cards, stats, and testimonials shown on the homepage.</p>
                </div>

                <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex gap-4 items-start shadow-sm">
                  <Award className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">Achievers' Card Control</p>
                    <p className="text-sm font-medium text-slate-600">You can edit stats, quotes, districts, exam categories, and rearrange the display order of the success journeys.</p>
                  </div>
                </div>

                {/* Main Editor Layout: Left Panel = List & Search, Right Panel = Form */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Panel: Search & Scrollable list of Journeys */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="flex items-center gap-4 justify-between">
                      <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Current Journeys ({achieversJournal.length})</label>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAchieverIndex(null);
                          setAchieverForm({
                            name: '',
                            rank: '',
                            examCategory: 'opsc',
                            story: '',
                            avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=New',
                            stats: { score: '', accuracy: '', time: '' },
                            district: '',
                            date: new Date().toISOString().split('T')[0]
                          });
                          setIsAddingAchiever(true);
                        }}
                        className="px-4 py-2 bg-[#2563EB] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:bg-[#1d4ed8] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-extrabold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New Story
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Quick filter by name, rank, district..."
                        value={achieverSearch}
                        onChange={e => setAchieverSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all font-bold text-sm bg-white"
                      />
                    </div>

                    <div className="border border-slate-200 rounded-2xl bg-slate-50/50 p-3 max-h-[500px] overflow-y-auto space-y-2">
                      {achieversJournal
                        .map((story, originalIdx) => ({ story, originalIdx }))
                        .filter(item => {
                          const q = achieverSearch.toLowerCase();
                          return (
                            item.story.name.toLowerCase().includes(q) ||
                            item.story.rank.toLowerCase().includes(q) ||
                            item.story.district.toLowerCase().includes(q)
                          );
                        })
                        .map(({ story, originalIdx }, displayIdx) => (
                          <div
                            key={originalIdx}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border transition-all",
                              editingAchieverIndex === originalIdx
                                ? "bg-brand-50/40 border-brand-200 shadow-sm"
                                : "bg-white border-slate-100 hover:border-slate-200"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-700 uppercase shrink-0">
                                {story.name ? story.name.substring(0, 2) : '??'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">{story.name || 'Unnamed'}</p>
                                <p className="text-[10px] font-bold text-slate-500 truncate">{story.rank || 'No rank info'} • {story.district}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 ml-4">
                              <button
                                type="button"
                                disabled={originalIdx === 0}
                                onClick={() => {
                                  const list = [...achieversJournal];
                                  const temp = list[originalIdx];
                                  list[originalIdx] = list[originalIdx - 1];
                                  list[originalIdx - 1] = temp;
                                  setAchieversJournal(list);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                disabled={originalIdx === achieversJournal.length - 1}
                                onClick={() => {
                                  const list = [...achieversJournal];
                                  const temp = list[originalIdx];
                                  list[originalIdx] = list[originalIdx + 1];
                                  list[originalIdx + 1] = temp;
                                  setAchieversJournal(list);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingAchieverIndex(originalIdx);
                                  setAchieverForm({
                                    ...story,
                                    date: story.date || new Date().toISOString().split('T')[0]
                                  });
                                  setIsAddingAchiever(false);
                                }}
                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-brand-600 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Are you sure you want to delete ${story.name || 'this story'}?`)) {
                                    const list = achieversJournal.filter((_, i) => i !== originalIdx);
                                    setAchieversJournal(list);
                                    if (editingAchieverIndex === originalIdx) {
                                      setEditingAchieverIndex(null);
                                      setIsAddingAchiever(false);
                                    }
                                  }
                                }}
                                className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      {achieversJournal.length === 0 && (
                        <p className="text-xs text-slate-400 font-semibold text-center py-8">No stories added yet. Click "Add New Story" above.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Panel: Story Add/Edit Form */}
                  <div className="lg:col-span-5 bg-slate-50/50 border border-slate-200 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                        {isAddingAchiever ? '➕ Add New Story' : editingAchieverIndex !== null ? '📝 Edit Story' : '🔍 Select a Story'}
                      </h4>
                      {(isAddingAchiever || editingAchieverIndex !== null) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAchieverIndex(null);
                            setIsAddingAchiever(false);
                          }}
                          className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {(isAddingAchiever || editingAchieverIndex !== null) ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Full Name</label>
                            <input
                              type="text"
                              required
                              value={achieverForm.name}
                              onChange={e => setAchieverForm(f => ({ ...f, name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 text-xs font-bold bg-white"
                              placeholder="e.g. Satyajit Behera"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Category</label>
                            <select
                              value={achieverForm.examCategory}
                              onChange={e => setAchieverForm(f => ({ ...f, examCategory: e.target.value as any }))}
                              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 text-xs font-bold bg-white"
                            >
                              <option value="opsc">OPSC</option>
                              <option value="ossc">OSSC</option>
                              <option value="osssc">OSSSC</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Subtitle / Rank</label>
                            <input
                              type="text"
                              value={achieverForm.rank}
                              onChange={e => setAchieverForm(f => ({ ...f, rank: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 text-xs font-bold bg-white"
                              placeholder="e.g. OPSC OAS Rank 42"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">District</label>
                            <input
                              type="text"
                              value={achieverForm.district}
                              onChange={e => setAchieverForm(f => ({ ...f, district: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 text-xs font-bold bg-white"
                              placeholder="e.g. Cuttack"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Story Text / Testimonial</label>
                          <textarea
                            rows={3}
                            required
                            value={achieverForm.story}
                            onChange={e => setAchieverForm(f => ({ ...f, story: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 text-xs font-bold bg-white resize-none"
                            placeholder="Write their preparation experience here..."
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Post Date</label>
                          <input
                            type="date"
                            required
                            value={achieverForm.date || ''}
                            onChange={e => setAchieverForm(f => ({ ...f, date: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 text-xs font-bold bg-white"
                          />
                        </div>

                        <div className="border-t border-slate-200 my-2 pt-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Metrics/Stats Cards</p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Score</label>
                              <input
                                type="text"
                                value={achieverForm.stats.score}
                                onChange={e => setAchieverForm(f => ({ ...f, stats: { ...f.stats, score: e.target.value } }))}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-brand-500 text-[11px] font-bold bg-white"
                                placeholder="128.5 / 200"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Accuracy</label>
                              <input
                                type="text"
                                value={achieverForm.stats.accuracy}
                                onChange={e => setAchieverForm(f => ({ ...f, stats: { ...f.stats, accuracy: e.target.value } }))}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-brand-500 text-[11px] font-bold bg-white"
                                placeholder="94% Accuracy"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] font-extrabold text-slate-500 uppercase">Timeline</label>
                              <input
                                type="text"
                                value={achieverForm.stats.time}
                                onChange={e => setAchieverForm(f => ({ ...f, stats: { ...f.stats, time: e.target.value } }))}
                                className="w-full px-2 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-brand-500 text-[11px] font-bold bg-white"
                                placeholder="8 Months Prep"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 items-end pt-2">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Avatar Seed</label>
                            <input
                              type="text"
                              value={achieverForm.name ? achieverForm.name.split(' ')[0] : 'Satyajit'}
                              disabled
                              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-400 text-xs font-bold"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!achieverForm.name.trim()) {
                                alert('Please enter a name first.');
                                return;
                              }
                              const seed = achieverForm.name.trim().split(' ')[0];
                              const newAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${seed}`;
                              const preparedForm = {
                                ...achieverForm,
                                avatar: newAvatar,
                                date: achieverForm.date || new Date().toISOString().split('T')[0]
                              };

                              if (isAddingAchiever) {
                                setAchieversJournal(list => [preparedForm, ...list]);
                                alert('✅ Added story to local list!');
                              } else if (editingAchieverIndex !== null) {
                                const list = [...achieversJournal];
                                list[editingAchieverIndex] = preparedForm;
                                setAchieversJournal(list);
                                alert('✅ Updated story in local list!');
                              }
                              setEditingAchieverIndex(null);
                              setIsAddingAchiever(false);
                            }}
                            className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer font-extrabold"
                          >
                            {isAddingAchiever ? 'Confirm Add' : 'Confirm Edit'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Award className="w-8 h-8 text-slate-300 mb-2" />
                        <p className="text-xs text-slate-400 font-bold">Select a story from the left panel to edit its details, or click "Add New Story" to create a new journey card.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Save Success Journeys */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    onClick={async () => {
                      try {
                        const updated = {
                          name: 'SYSTEM_SETTINGS_ACHIEVERS_JOURNAL',
                          description: JSON.stringify(achieversJournal),
                          icon: '🏆',
                          category: 'system' as const
                        };
                        const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_ACHIEVERS_JOURNAL');
                        if (exists && exists.id) {
                          await examService.updateExam(exists.id, updated);
                        } else {
                          await examService.addExam(updated);
                        }
                        await fetchData();
                        alert('✅ Success Journeys saved and published to homepage!');
                      } catch (err: any) { alert(`Failed to save: ${err.message || 'Unknown error'}`); }
                    }}
                    className="px-10 py-3.5 premium-gradient text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/20 hover:premium-glow transition-all active:scale-95 text-lg"
                  >
                    Publish Success Journeys
                  </button>
                </div>
              </div>

              {/* ── Focused Preparation Tags Editor ── */}
              <div className="mt-10 border-t-2 border-dashed border-slate-200 pt-10 space-y-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tight">🎯 Focused Preparation Tags</h3>
                  <p className="text-slate-500 font-medium mt-2 text-lg">Manage the quick-link exam tags shown on the homepage hero section.</p>
                </div>

                <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100 flex gap-4 items-start shadow-sm text-left">
                  <AlertCircle className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-800">Tag quick-links live on homepage!</p>
                    <p className="text-sm font-medium text-slate-600">
                      Add, edit, reorder, or remove tags. Linking a tag to an exam allows students to click on the tag to jump directly to that exam's page.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {focusedPrep.map((tag, idx) => (
                    <div 
                      key={idx}
                      className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm relative text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Tag {idx + 1}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const next = [...focusedPrep];
                              const temp = next[idx];
                              next[idx] = next[idx - 1];
                              next[idx - 1] = temp;
                              setFocusedPrep(next);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            disabled={idx === focusedPrep.length - 1}
                            onClick={() => {
                              const next = [...focusedPrep];
                              const temp = next[idx];
                              next[idx] = next[idx + 1];
                              next[idx + 1] = temp;
                              setFocusedPrep(next);
                            }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFocusedPrep(focusedPrep.filter((_, i) => i !== idx));
                            }}
                            className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all cursor-pointer"
                            title="Remove tag"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Tag Label *</label>
                          <input 
                            type="text" 
                            value={tag.label} 
                            onChange={e => {
                              const next = [...focusedPrep];
                              next[idx] = { ...next[idx], label: e.target.value };
                              setFocusedPrep(next);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white"
                            placeholder="e.g. OPSC CGL"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">Linked Exam</label>
                          <select 
                            value={tag.examId || ''} 
                            onChange={e => {
                              const next = [...focusedPrep];
                              next[idx] = { ...next[idx], examId: e.target.value };
                              setFocusedPrep(next);
                            }}
                            className="w-full px-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-bold text-sm bg-white cursor-pointer"
                          >
                            <option value="">— None (No Link) —</option>
                            {actualExams.map(ex => (
                              <option key={ex.id} value={ex.id}>{ex.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {focusedPrep.length < 12 && (
                    <button
                      type="button"
                      onClick={() => setFocusedPrep([...focusedPrep, { label: '', examId: '' }])}
                      className="w-full py-3.5 border-2 border-dashed border-slate-300 rounded-2xl text-sm font-extrabold text-slate-400 hover:border-brand-400 hover:text-brand-600 hover:bg-brand-50/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Add Tag
                    </button>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button 
                    onClick={async () => {
                      try {
                        if (focusedPrep.filter(t => !t.label.trim()).length > 0) {
                          alert("Please enter a label for all tags.");
                          return;
                        }
                        const updated = {
                          name: 'SYSTEM_SETTINGS_FOCUSED_PREPARATION',
                          description: JSON.stringify(focusedPrep),
                          icon: '🎯',
                          category: 'system' as const
                        };
                        const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_FOCUSED_PREPARATION');
                        if (exists && exists.id) {
                          await examService.updateExam(exists.id, updated);
                        } else {
                          await examService.addExam(updated);
                        }
                        await fetchData();
                        alert("✅ Focused Preparation Tags saved and published to homepage!");
                      } catch (err: any) {
                        alert(`Failed to save: ${err.message || 'Unknown error'}`);
                      }
                    }} 
                    className="px-10 py-3.5 premium-gradient text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/20 hover:premium-glow transition-all active:scale-95 text-lg"
                  >
                    Publish Focused Preparation
                  </button>
                </div>
              </div>
             </div>
          ) : activeTab === 'updates' ? (

            <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70 p-8 sm:p-12 space-y-8">
               <div>
                 <h3 className="text-3xl font-black text-slate-900 tracking-tight">Exam Updates & News Ticker</h3>
                 <p className="text-slate-500 font-medium mt-2 text-lg">Manage the flashing news updates shown at the top of the website.</p>
               </div>
               
               <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100 flex gap-4 items-start shadow-sm">
                 <Bell className="w-6 h-6 text-brand-600 shrink-0 mt-0.5" />
                 <div className="space-y-1">
                   <p className="font-extrabold text-slate-800">Ticker Instructions</p>
                   <p className="text-sm font-medium text-slate-600">
                     Enter each news update or announcement on a **new line**. These will be displayed in a continuous loop in the top announcement bar.
                   </p>
                 </div>
               </div>

               <div className="space-y-3">
                 <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Active Announcements</label>
                 <textarea 
                    rows={10}
                    className="w-full px-6 py-5 rounded-2xl border-2 border-slate-200 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all shadow-inner bg-white text-slate-700 font-bold"
                    placeholder="OPSC Prelims Exam Dates Announced...&#10;500+ New PYQs Added...&#10;Weekly Current Affairs PDF..."
                    value={newsUpdatesInput}
                    onChange={e => setNewsUpdatesInput(e.target.value)}
                 />
               </div>
               
               <div className="flex justify-end pt-4 border-t border-slate-100">
                 <button onClick={async () => {
                    try {
                       const updates = newsUpdatesInput.split('\n')
                          .map(s => s.trim())
                          .filter(s => s.length > 0);
                          
                       if (updates.length === 0) {
                          alert('Please enter at least one announcement.');
                          return;
                       }

                       const updated = {
                          name: 'SYSTEM_SETTINGS_NEWS_TICKER',
                          description: JSON.stringify({ updates }),
                          icon: '📢',
                          category: 'system' as const
                       };
                       const exists = exams.find(e => e.name === 'SYSTEM_SETTINGS_NEWS_TICKER');
                       if (exists && exists.id) {
                          await examService.updateExam(exists.id, updated);
                       } else {
                          await examService.addExam(updated);
                       }
                       alert("Exam updates successfully published to the live ticker!");
                    } catch(err: any) { alert(`Failed to save updates: ${err.message || 'Unknown error'}`); }
                 }} className="px-10 py-3.5 premium-gradient text-white font-extrabold rounded-xl shadow-lg shadow-brand-500/20 hover:premium-glow transition-all active:scale-95 text-lg">Publish Live Updates</button>
               </div>
            </div>
           ) : activeTab === 'subscribers' ? (
              <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70 p-8 sm:p-12 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Email Subscribers ({subscribers.length})</h3>
                    <p className="text-slate-500 font-medium mt-2 text-lg">Manage emails subscribed to receive exam alert notifications.</p>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search subscribers..."
                      value={subscriberSearchQuery}
                      onChange={e => setSubscriberSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-slate-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all font-bold text-sm bg-white"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/50 border-b border-slate-200/60 font-black text-xs uppercase text-slate-500 tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Email Address</th>
                        <th className="px-8 py-5">Subscribed At</th>
                        <th className="px-8 py-5 text-right pr-12">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {subscribers.filter(s => 
                        (s.email || '').toLowerCase().includes(subscriberSearchQuery.toLowerCase())
                      ).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-8 py-20 text-center text-slate-400 font-semibold">
                            No subscribers found.
                          </td>
                        </tr>
                      ) : (
                        subscribers
                          .filter(s => (s.email || '').toLowerCase().includes(subscriberSearchQuery.toLowerCase()))
                          .map((sub) => (
                            <tr key={sub.id} className="hover:bg-brand-50/10 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-black text-xs shrink-0 border border-brand-100">
                                    <Mail className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-extrabold text-slate-900">{sub.email}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                                {sub.created_at ? new Date(sub.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Unknown'}
                              </td>
                              <td className="px-8 py-5 text-right pr-12">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (!confirm(`Are you sure you want to unsubscribe and delete ${sub.email}?`)) return;
                                    try {
                                      const { error } = await supabase
                                        .from('newsletter_subscribers')
                                        .delete()
                                        .eq('id', sub.id);
                                      if (error) {
                                        alert(`Failed to unsubscribe: ${error.message}`);
                                      } else {
                                        setSubscribers(prev => prev.filter(item => item.id !== sub.id));
                                        alert(`Unsubscribed ${sub.email} successfully.`);
                                      }
                                    } catch (err: any) {
                                      alert(`Error: ${err.message || err}`);
                                    }
                                  }}
                                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all inline-flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'notifications' ? (
              <div className="space-y-8">
                {/* Header */}
                <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70 p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#dbeafe] border border-[#bfdbfe] flex items-center justify-center">
                      <Bell className="w-6 h-6 text-[#2563EB]" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Push Notification Composer</h3>
                      <p className="text-slate-500 font-medium text-sm mt-0.5">Send real-time push notifications to all subscribed users.</p>
                    </div>
                  </div>

                  {/* Compose Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Notification Title *</label>
                        <input
                          type="text"
                          value={pushTitle}
                          onChange={e => setPushTitle(e.target.value)}
                          placeholder="e.g. New Mock Test Available!"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-500 font-bold text-sm outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Message Body *</label>
                        <textarea
                          value={pushBody}
                          onChange={e => setPushBody(e.target.value)}
                          placeholder="e.g. OSSC CGL Full Mock Test 2026 is now live. Attempt it now!"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-500 font-semibold text-sm outline-none transition-all resize-none"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Destination URL</label>
                        <input
                          type="text"
                          value={pushClickUrl}
                          onChange={e => setPushClickUrl(e.target.value)}
                          placeholder="/ or /mock-tests or https://odishaexamprep.in"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-500 font-mono text-sm outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500">Image URL (optional banner)</label>
                        <input
                          type="text"
                          value={pushImageUrl}
                          onChange={e => setPushImageUrl(e.target.value)}
                          placeholder="https://... (shown as large banner in notification)"
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 focus:border-brand-500 font-mono text-sm outline-none transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Target</label>
                          <select
                            value={pushTargetType}
                            onChange={e => setPushTargetType(e.target.value as any)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-brand-500 font-bold text-sm outline-none"
                          >
                            <option value="all">All Subscribers</option>
                            <option value="users">Specific Users</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500">Schedule (optional)</label>
                          <input
                            type="datetime-local"
                            value={pushScheduledAt}
                            onChange={e => setPushScheduledAt(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-100 focus:border-brand-500 font-bold text-sm outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview Card */}
                    <div className="space-y-3">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-500">Live Preview</p>
                      <div className="bg-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
                        <div className="flex items-start gap-3">
                          <img src="/android-chrome-192x192.png" className="w-10 h-10 rounded-xl shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-white text-xs font-black truncate">{pushTitle || 'OdishaExamPrep'}</p>
                              <p className="text-slate-400 text-[10px] font-medium shrink-0 ml-2">now</p>
                            </div>
                            <p className="text-slate-300 text-xs font-medium mt-0.5 line-clamp-2">{pushBody || 'Your notification message will appear here.'}</p>
                          </div>
                        </div>
                        {pushImageUrl && (
                          <img src={pushImageUrl} className="w-full h-24 object-cover rounded-xl mt-2" onError={e => (e.currentTarget.style.display = 'none')} />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">This is how it will appear on Android. iOS appearance may vary.</p>

                      <button
                        disabled={!pushTitle || !pushBody || pushSending}
                        onClick={async () => {
                          if (!pushTitle.trim() || !pushBody.trim()) return alert('Title and body are required.');
                          if (!confirm(`Send push notification to ALL subscribers? This cannot be undone.`)) return;
                          setPushSending(true);
                          try {
                            const session = (await supabase.auth.getSession()).data.session;
                            const token = session?.access_token;
                            const res = await fetch('/api/push/send', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                              body: JSON.stringify({
                                title: pushTitle,
                                body: pushBody,
                                clickUrl: pushClickUrl || '/',
                                imageUrl: pushImageUrl || undefined,
                                targetType: pushTargetType,
                                scheduledAt: pushScheduledAt || undefined,
                              }),
                            });
                            const data = await res.json();
                            if (!res.ok) throw new Error(data.error || 'Failed to send');
                            if (data.scheduled) {
                              alert(`✅ Notification scheduled for ${new Date(pushScheduledAt).toLocaleString()}`);
                            } else {
                              alert(`✅ Sent! Total: ${data.total} | Success: ${data.successCount} | Failed: ${data.failCount}`);
                            }
                            setPushTitle(''); setPushBody(''); setPushClickUrl('/'); setPushImageUrl(''); setPushScheduledAt('');
                            // Reload history
                            setPushHistoryPage(1);
                            setPushHistoryLoading(true);
                            const hr = await fetch(`/api/push/history?page=1`, { headers: { 'Authorization': `Bearer ${token}` } });
                            const hd = await hr.json();
                            setPushHistory(hd.notifications || []);
                            setPushHistoryTotal(hd.total || 0);
                            setPushHistoryLoading(false);
                          } catch (err: any) {
                            alert(`Error: ${err.message}`);
                          } finally {
                            setPushSending(false);
                          }
                        }}
                        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] text-white font-black text-sm hover:shadow-lg hover:shadow-[#2563EB]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                      >
                        <Bell className="w-4 h-4" />
                        {pushSending ? 'Sending...' : pushScheduledAt ? 'Schedule Notification' : 'Send Now to All Users'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Templates */}
                <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70 p-6">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4">Quick Templates</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label: '📝 New Mock Test', title: 'New Mock Test Available!', body: 'A brand new full-length mock test is live. Attempt it now to boost your score!' },
                      { label: '📚 New Question Bank', title: 'New Question Bank Added!', body: 'A new question bank is now available in your library. Practice and improve!' },
                      { label: '📋 Exam Notification', title: 'Official Exam Notification!', body: 'An important exam notification has been released. Check details now.' },
                      { label: '⏰ Exam Reminder', title: 'Exam Alert!', body: 'Don\'t miss the upcoming exam. Check the date and prepare now!' },
                      { label: '🎉 Result Out', title: 'Result Declared!', body: 'Exam results are out! Check your performance and plan your next step.' },
                      { label: '🔧 Maintenance', title: 'Scheduled Maintenance', body: 'OdishaExamPrep will be briefly offline tonight for maintenance. We\'ll be back soon!' },
                    ].map(t => (
                      <button
                        key={t.label}
                        onClick={() => { setPushTitle(t.title); setPushBody(t.body); }}
                        className="text-left p-3.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50/30 transition-all text-xs font-bold text-slate-700"
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notification History */}
                <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Notification History</p>
                    <button
                      onClick={async () => {
                        setPushHistoryLoading(true);
                        try {
                          const session = (await supabase.auth.getSession()).data.session;
                          const token = session?.access_token;
                          const res = await fetch(`/api/push/history?page=${pushHistoryPage}`, { headers: { 'Authorization': `Bearer ${token}` } });
                          const data = await res.json();
                          setPushHistory(data.notifications || []);
                          setPushHistoryTotal(data.total || 0);
                        } catch {}
                        setPushHistoryLoading(false);
                      }}
                      className="text-xs font-black text-brand-600 hover:text-brand-700 underline"
                    >
                      {pushHistoryLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {pushHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-400 font-bold text-sm">No notifications sent yet.</p>
                      <p className="text-slate-400 text-xs mt-1">Click Refresh to load history, or send your first notification above.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left py-2 px-3 text-xs font-black uppercase tracking-wider text-slate-400">Title</th>
                            <th className="text-left py-2 px-3 text-xs font-black uppercase tracking-wider text-slate-400">Sent At</th>
                            <th className="text-left py-2 px-3 text-xs font-black uppercase tracking-wider text-slate-400">Target</th>
                            <th className="text-right py-2 px-3 text-xs font-black uppercase tracking-wider text-slate-400">Delivery</th>
                            <th className="text-right py-2 px-3 text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {pushHistory.map((n: any) => (
                            <tr key={n.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 px-3">
                                <p className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{n.title}</p>
                                <p className="text-slate-500 text-[11px] truncate max-w-[200px]">{n.body}</p>
                              </td>
                              <td className="py-3 px-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                                {n.sent_at ? new Date(n.sent_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : n.scheduled_at ? `Scheduled: ${new Date(n.scheduled_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}` : '-'}
                              </td>
                              <td className="py-3 px-3">
                                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{n.target_type}</span>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <p className="text-xs font-black text-emerald-600">{n.delivery_stats?.success ?? 0} ✓</p>
                                <p className="text-[10px] text-slate-400">{n.delivery_stats?.total ?? 0} total</p>
                              </td>
                              <td className="py-3 px-3 text-right">
                                <span className={cn(
                                  "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider",
                                  n.status === 'sent' ? 'bg-emerald-50 text-emerald-700' :
                                  n.status === 'scheduled' ? 'bg-amber-50 text-amber-700' :
                                  n.status === 'sending' ? 'bg-blue-50 text-blue-700' :
                                  'bg-red-50 text-red-700'
                                )}>{n.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
           ) : activeTab === 'users' ? (
              <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100/50 border-b border-slate-200/60 font-black text-xs uppercase text-slate-500 tracking-widest">
                      <tr>
                         <th className="px-8 py-5">User</th>
                         <th className="px-8 py-5">Status</th>
                         <th className="px-8 py-5 text-right pr-12">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                      {items.length === 0 ? (
                         <tr><td colSpan={3} className="px-8 py-20 text-center text-slate-400">No users found.</td></tr>
                      ) : (
                         items.map(renderTableRow)
                      )}
                    </tbody>
                 </table>
              </div>
            ) : (activeTab === 'banks' || activeTab === 'practice') && selectedExamIdForBanks === null ? (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select an Exam for {activeTab === 'practice' ? 'Practice Sets' : 'Question Banks'}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(() => {
                       const lowerQ = searchQuery.toLowerCase();
                       const filteredExams = actualExams.filter(exam => (exam.name || '').toLowerCase().includes(lowerQ));
                       if (filteredExams.length === 0) {
                          return (
                            <div className="col-span-full bg-white rounded-[2rem] border border-slate-200/50 p-12 text-center text-slate-400 font-extrabold shadow-sm">
                              No exams found matching your search.
                            </div>
                          );
                       }
                       return filteredExams.map(exam => {
                         const count = activeTab === 'practice' 
                           ? banks.filter(b => b.examId === exam.id && (b.target_mode || 'both') !== 'bank').length 
                           : banks.filter(b => b.examId === exam.id && (b.target_mode || 'both') !== 'practice').length;
                         return (
                           <motion.div
                             key={exam.id}
                             whileHover={{ y: -4, scale: 1.02 }}
                             whileTap={{ scale: 0.98 }}
                             onClick={() => { setSelectedExamIdForBanks(exam.id as string); setFilterExamId(exam.id as string); }}
                             className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                           >
                             <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="relative space-y-4">
                               <div className="flex justify-between items-start">
                                 <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:bg-brand-100 transition-colors">
                                   {exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/')) ? <img src={getDirectImageUrl(exam.icon)} alt="" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" /> : exam.icon || '🏛️'}
                                 </div>
                                 <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                               </div>
                               <div className="space-y-2">
                                 <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 tracking-tight leading-snug">{exam.name}</h4>
                                 <p className="text-slate-500 font-medium text-sm line-clamp-2">{exam.description || (activeTab === 'practice' ? 'Manage chapter drills and topic practice under this exam.' : 'Manage question banks and PDF material under this exam.')}</p>
                               </div>
                             </div>
                             <div className="relative pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                                 {activeTab === 'practice' ? <Target className="w-3.5 h-3.5" /> : <BookMarked className="w-3.5 h-3.5" />}
                                 {count} {activeTab === 'practice' ? (count === 1 ? 'Practice Set' : 'Practice Sets') : (count === 1 ? 'Question Bank' : 'Question Banks')}
                               </span>
                               <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">{exam.category}</span>
                             </div>
                           </motion.div>
                         );
                       });
                    })()}
                  </div>
                </div>
            ) : activeTab === 'series' && selectedExamIdForSeries === null ? (
               <div className="space-y-6 animate-in fade-in duration-200">
                 <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select an Exam for Test Series</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {(() => {
                      const lowerQ = searchQuery.toLowerCase();
                      const filteredExams = actualExams.filter(exam => (exam.name || '').toLowerCase().includes(lowerQ));
                      if (filteredExams.length === 0) {
                         return (
                           <div className="col-span-full bg-white rounded-[2rem] border border-slate-200/50 p-12 text-center text-slate-400 font-extrabold shadow-sm">
                             No exams found matching your search.
                           </div>
                         );
                      }
                      return filteredExams.map(exam => {
                        const count = series.filter(s => s.examId === exam.id).length;
                        return (
                          <motion.div
                            key={exam.id}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setSelectedExamIdForSeries(exam.id as string); setFilterExamId(exam.id as string); }}
                            className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:bg-brand-100 transition-colors">
                                  {exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/')) ? <img src={getDirectImageUrl(exam.icon)} alt="" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" /> : exam.icon || '🏛️'}
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 tracking-tight leading-snug">{exam.name}</h4>
                                <p className="text-slate-500 font-medium text-sm line-clamp-2">{exam.description || 'Manage test series packages under this exam.'}</p>
                              </div>
                            </div>
                            <div className="relative pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                                <Layers className="w-3.5 h-3.5" />
                                {count} {count === 1 ? 'Test Series' : 'Test Series Packages'}
                              </span>
                              <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">{exam.category}</span>
                            </div>
                          </motion.div>
                        );
                      });
                   })()}
                 </div>
               </div>
            ) : activeTab === 'questions' && selectedExamIdForQuestions === null ? (
               <div className="space-y-6 animate-in fade-in duration-200">
                 <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select an Exam for Questions</h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {(() => {
                      const lowerQ = searchQuery.toLowerCase();
                      const filteredExams = actualExams.filter(exam => (exam.name || '').toLowerCase().includes(lowerQ));
                      if (filteredExams.length === 0) {
                         return (
                           <div className="col-span-full bg-white rounded-[2rem] border border-slate-200/50 p-12 text-center text-slate-400 font-extrabold shadow-sm">
                             No exams found matching your search.
                           </div>
                         );
                      }
                      return filteredExams.map(exam => {
                        const count = questions.filter(q => q.examId === exam.id).length;
                        return (
                          <motion.div
                            key={exam.id}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setSelectedExamIdForQuestions(exam.id as string); setFilterExamId(exam.id as string); }}
                            className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:bg-brand-100 transition-colors">
                                  {exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/')) ? <img src={getDirectImageUrl(exam.icon)} alt="" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" /> : exam.icon || '🏛️'}
                                </div>
                                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 tracking-tight leading-snug">{exam.name}</h4>
                                <p className="text-slate-500 font-medium text-sm line-clamp-2">{exam.description || 'Manage questions under this exam.'}</p>
                              </div>
                            </div>
                            <div className="relative pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                                <FileText className="w-3.5 h-3.5" />
                                {count} {count === 1 ? 'Question' : 'Questions'}
                              </span>
                              <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">{exam.category}</span>
                            </div>
                          </motion.div>
                        );
                      });
                   })()}
                 </div>
               </div>
            ) : activeTab === 'questions' && selectedExamIdForQuestions !== null && selectedTargetIdForQuestions === null ? (
               <div className="space-y-6 animate-in fade-in duration-200">
                 <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-6 bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-slate-200/40 w-fit">
                   <button onClick={() => { setSelectedExamIdForQuestions(null); setSelectedTypeForQuestions(null); setSelectedCategoryForQuestions(null); setSelectedTargetIdForQuestions(null); setFilterExamId('all'); }} className="hover:text-brand-600 transition-colors flex items-center gap-1">
                     Exams
                   </button>
                   <ChevronRight className="w-4 h-4" />
                   <span className="text-slate-700 font-extrabold">{exams.find(e => e.id === selectedExamIdForQuestions)?.name || 'Selected Exam'}</span>
                 </div>

                 {selectedTypeForQuestions === null ? (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <motion.div
                       whileHover={{ y: -4, scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => setSelectedTypeForQuestions('bank')}
                       className="bg-white rounded-[2rem] border border-slate-200/60 p-8 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                     >
                       <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="space-y-6">
                         <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center text-4xl shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300">
                           📚
                         </div>
                         <div>
                           <h4 className="text-2xl font-black text-slate-900 group-hover:text-brand-600 transition-colors tracking-tight leading-snug">Content Bank Questions</h4>
                           <p className="text-slate-500 font-semibold text-sm mt-2 leading-relaxed">Manage practice questions mapped to topic-wise, exam-focused, revision, or PYQ content banks.</p>
                         </div>
                       </div>
                       <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                         <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                       </div>
                     </motion.div>

                     <motion.div
                       whileHover={{ y: -4, scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       onClick={() => setSelectedTypeForQuestions('mock')}
                       className="bg-white rounded-[2rem] border border-slate-200/60 p-8 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                     >
                       <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="space-y-6">
                         <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-4xl shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300">
                           🏆
                         </div>
                         <div>
                           <h4 className="text-2xl font-black text-slate-900 group-hover:text-brand-600 transition-colors tracking-tight leading-snug">Mock Test Questions</h4>
                           <p className="text-slate-500 font-semibold text-sm mt-2 leading-relaxed">Manage questions assigned to mock tests, full-length tests, sectional tests, or daily papers.</p>
                         </div>
                       </div>
                       <div className="flex justify-end pt-6 mt-6 border-t border-slate-100">
                         <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                       </div>
                     </motion.div>
                   </div>
                  ) : selectedTypeForQuestions === 'bank' ? (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-extrabold text-slate-800">Select a Content Bank</h3>
                          <p className="text-xs text-slate-500 font-bold mt-0.5">Filter by category or click Upload Qs on any bank card to bulk upload questions directly.</p>
                        </div>
                        <button onClick={() => setSelectedTypeForQuestions(null)} className="text-sm font-bold text-brand-600 hover:text-brand-700 underline shrink-0">Back to Types</button>
                      </div>

                      {/* Practice Sub-Tab Switcher & Category Filter Pills */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                        <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
                          <button
                            onClick={() => setBankSubTab('banks')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                              bankSubTab === 'banks' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            📦 Question Banks
                          </button>
                          <button
                            onClick={() => setBankSubTab('practice')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                              bankSubTab === 'practice' ? "bg-brand-600 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            🎯 Practice Sets
                          </button>
                          <button
                            onClick={() => setBankSubTab('all')}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5",
                              bankSubTab === 'all' ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            🌟 All
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider mr-1">Category:</span>
                          {[
                            { id: 'all', label: 'All' },
                            { id: 'topic-wise', label: 'Chapter-Wise' },
                            { id: 'exam-focused', label: 'High-Yield' },
                            { id: 'revision-sets', label: 'Daily Quizzes' },
                            { id: 'pyq-collections', label: 'Topic PYQs' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setBankFilter(f.id as any)}
                              className={cn(
                                "px-3 py-1 rounded-xl text-xs font-extrabold transition-all cursor-pointer border",
                                bankFilter === f.id
                                  ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600"
                              )}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {banks
                          .filter(b => b.examId === selectedExamIdForQuestions)
                          .filter(b => bankFilter === 'all' || b.type === bankFilter)
                          .filter(b => {
                            if (bankSubTab === 'banks') return (b.target_mode || 'both') !== 'practice';
                            if (bankSubTab === 'practice') return (b.target_mode || 'both') !== 'bank';
                            return true;
                          })
                          .map(bank => {
                            const count = bank.questionCount || 0;
                            const categoryBadges: Record<string, { label: string; style: string }> = {
                              'topic-wise': { label: 'Chapter-Wise', style: 'bg-blue-50 text-blue-700 border-blue-200/60' },
                              'exam-focused': { label: 'High-Yield', style: 'bg-amber-50 text-amber-700 border-amber-200/60' },
                              'revision-sets': { label: 'Daily Quizzes', style: 'bg-emerald-50 text-emerald-700 border-emerald-200/60' },
                              'pyq-collections': { label: 'Topic PYQ', style: 'bg-purple-50 text-purple-700 border-purple-200/60' }
                            };
                            const badge = categoryBadges[bank.type] || { label: bank.type, style: 'bg-slate-100 text-slate-600 border-slate-200' };

                            return (
                              <motion.div
                                key={bank.id}
                                whileHover={{ y: -4, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedTargetIdForQuestions(bank.title)}
                                className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="space-y-4 relative z-10">
                                  <div className="flex justify-between items-start flex-wrap gap-2">
                                    <div className="w-12 h-12 rounded-xl bg-slate-50 border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 shadow-2xs">
                                      📚
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border", badge.style)}>
                                        {badge.label}
                                      </span>
                                      <span className={cn(
                                        "px-2 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider border",
                                        (bank.target_mode || 'both') === 'practice'
                                          ? "bg-brand-50 text-brand-700 border-brand-200"
                                          : (bank.target_mode || 'both') === 'bank'
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                                      )}>
                                        {(bank.target_mode || 'both') === 'practice' ? '🎯 Practice Only' : (bank.target_mode || 'both') === 'bank' ? '📦 Bank Only' : '🌟 Both'}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-black text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 tracking-tight leading-snug">{bank.title}</h4>
                                  </div>
                                </div>
                                
                                <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100 relative z-10 gap-2">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                                    {count} Questions
                                  </span>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setBulkExamId(bank.examId);
                                      setBulkTopic(bank.title);
                                      setShowBulkUploadModal(true);
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-black bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white border border-brand-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                                    title="Upload questions directly to this bank"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>Upload Qs</span>
                                  </button>
                                </div>
                              </motion.div>
                            );
                          })}
{banks
                          .filter(b => b.examId === selectedExamIdForQuestions)
                          .filter(b => bankFilter === 'all' || b.type === bankFilter)
                          .filter(b => {
                            if (bankSubTab === 'banks') return (b.target_mode || 'both') !== 'practice';
                            if (bankSubTab === 'practice') return (b.target_mode || 'both') !== 'bank';
                            return true;
                          }).length === 0 && (
                          <div className="col-span-full bg-white rounded-[2rem] border border-slate-200/50 p-12 text-center text-slate-400 font-extrabold shadow-sm flex flex-col items-center gap-4">
                            <p className="text-slate-500 font-bold text-base">
                              No {bankFilter === 'all' ? '' : ({
                                'topic-wise': 'Chapter-Wise Practice',
                                'exam-focused': 'High-Yield Topic',
                                'revision-sets': 'Daily Speed Quiz',
                                'pyq-collections': 'Topic-Wise PYQ'
                              }[bankFilter] || bankFilter)} content banks found for this exam.
                            </p>
                            <button
                              onClick={() => {
                                setActiveTab('banks');
                                openAddModal('banks');
                              }}
                              className="px-6 py-3 bg-brand-600 text-white font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20 flex items-center gap-2 cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Create New Content Bank
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                 ) : (
                   selectedCategoryForQuestions === null ? (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h3 className="text-xl font-extrabold text-slate-800">Select Mock Test Category</h3>
                         <button onClick={() => setSelectedTypeForQuestions(null)} className="text-sm font-bold text-brand-600 hover:text-brand-700 underline">Back</button>
                       </div>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         {[
                           { id: 'full-length', label: 'Full Length Tests', desc: 'Complete exam-like mock tests covering all sections.', icon: '🏆', color: 'bg-emerald-50 text-emerald-600 border-emerald-100/60' },
                           { id: 'sectional', label: 'Sectional Tests', desc: 'Subject-wise or topic-wise practice sets.', icon: '📚', color: 'bg-blue-50 text-blue-600 border-blue-100/60' },
                           { id: 'pyq', label: 'Previous Year Questions (PYQ)', desc: 'Real questions from past papers with detailed solutions.', icon: '⏳', color: 'bg-amber-50 text-amber-600 border-amber-100/60' },
                           { id: 'daily', label: 'Daily Tests', desc: 'Quick daily or weekly practice sets.', icon: '📅', color: 'bg-rose-50 text-rose-600 border-rose-100/60' }
                         ].map(cat => {
                           const count = mockTests.filter(mt => {
                             try {
                               if (mt.seriesId) {
                                 const parsed = JSON.parse(mt.seriesId);
                                 return parsed.examId === selectedExamIdForQuestions && (parsed.category === cat.id || (cat.id === 'full-length' && !parsed.category));
                               }
                             } catch(e){}
                             return false;
                           }).length;
                           return (
                             <motion.div
                               key={cat.id}
                               whileHover={{ y: -4, scale: 1.02 }}
                               whileTap={{ scale: 0.98 }}
                               onClick={() => setSelectedCategoryForQuestions(cat.id)}
                               className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                             >
                               <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                               <div className="flex gap-4">
                                 <div className={`w-14 h-14 rounded-2xl ${cat.color} border flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                                   {cat.icon}
                                 </div>
                                 <div>
                                   <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 tracking-tight leading-snug">{cat.label}</h4>
                                   <p className="text-slate-500 font-semibold text-sm mt-1">{cat.desc}</p>
                                 </div>
                               </div>
                               <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
                                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                                   {count} Tests
                                 </span>
                                 <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                               </div>
                             </motion.div>
                           );
                         })}
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-6">
                       <div className="flex items-center justify-between">
                         <h3 className="text-xl font-extrabold text-slate-800">Select Mock Test</h3>
                         <button onClick={() => setSelectedCategoryForQuestions(null)} className="text-sm font-bold text-brand-600 hover:text-brand-700 underline">Back</button>
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         {mockTests
                           .filter(mt => {
                             try {
                               if (mt.seriesId) {
                                 const parsed = JSON.parse(mt.seriesId);
                                 return parsed.examId === selectedExamIdForQuestions && (parsed.category === selectedCategoryForQuestions || (selectedCategoryForQuestions === 'full-length' && !parsed.category));
                               }
                             } catch(e){}
                             return false;
                           })
                           .map(mt => {
                             const count = mt._questionCount || mt.questions?.length || 0;
                             return (
                               <motion.div
                                 key={mt.id}
                                 whileHover={{ y: -4, scale: 1.02 }}
                                 whileTap={{ scale: 0.98 }}
                                 onClick={() => setSelectedTargetIdForQuestions(mt.id)}
                                 className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                               >
                                 <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                 <div className="space-y-4">
                                   <div className="w-12 h-12 rounded-xl bg-slate-50 border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                                     📝
                                   </div>
                                   <div>
                                     <h4 className="text-lg font-black text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 tracking-tight leading-snug">{mt.title}</h4>
                                     <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{mt.durationMinutes} Mins • {mt.totalMarks} Marks</p>
                                   </div>
                                 </div>
                                 <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100 relative z-10 gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                                      {count} Questions
                                    </span>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setBulkExamId(selectedExamIdForQuestions);
                                          setBulkTopic(`mockTest__${mt.id}`);
                                          setShowBulkUploadModal(true);
                                        }}
                                        className="px-3 py-1.5 rounded-xl text-xs font-black bg-brand-50 text-brand-600 hover:bg-brand-600 hover:text-white border border-brand-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                                        title="Upload questions directly to this mock test"
                                      >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>Upload Qs</span>
                                      </button>
                                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                                    </div>
                                  </div>
                               </motion.div>
                             );
                           })}
                         {mockTests.filter(mt => {
                           try {
                             if (mt.seriesId) {
                               const parsed = JSON.parse(mt.seriesId);
                               return parsed.examId === selectedExamIdForQuestions && (parsed.category === selectedCategoryForQuestions || (selectedCategoryForQuestions === 'full-length' && !parsed.category));
                             }
                           } catch(e){}
                           return false;
                         }).length === 0 && (
                           <div className="col-span-full bg-white rounded-[2rem] border border-slate-200/50 p-12 text-center text-slate-400 font-extrabold shadow-sm">
                             No mock tests created under this category yet.
                           </div>
                         )}
                       </div>
                     </div>
                   )
                 )}
               </div>
            ) : activeTab === 'tests' && selectedExamIdForTests === null ? (
               <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Select an Exam</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(() => {
                     const lowerQ = searchQuery.toLowerCase();
                     const filteredExams = actualExams.filter(exam => (exam.name || '').toLowerCase().includes(lowerQ));
                     if (filteredExams.length === 0) {
                        return (
                          <div className="col-span-full bg-white rounded-[2rem] border border-slate-200/50 p-12 text-center text-slate-400 font-extrabold shadow-sm">
                            No exams found matching your search.
                          </div>
                        );
                     }
                     return filteredExams.map(exam => {
                       const examTestCount = mockTests.filter(mt => {
                         try { if (mt.seriesId) return JSON.parse(mt.seriesId).examId === exam.id; } catch(e) {}
                         return false;
                       }).length;
                       return (
                         <motion.div
                           key={exam.id}
                           whileHover={{ y: -4, scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => {
                             setSelectedExamIdForTests(exam.id as string);
                             setSelectedCategoryForTests(null);
                           }}
                           className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                         >
                           <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           
                           <div className="relative space-y-4">
                             <div className="flex justify-between items-start">
                               <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:bg-brand-100 transition-colors">
                                 {exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/')) ? <img src={getDirectImageUrl(exam.icon)} alt="" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" /> : exam.icon || '🏛️'}
                               </div>
                               <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                             </div>
                             
                             <div className="space-y-2">
                               <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-2 tracking-tight leading-snug">{exam.name}</h4>
                               <p className="text-slate-500 font-medium text-sm line-clamp-2">{exam.description || 'Manage mock tests under this exam.'}</p>
                             </div>
                           </div>

                           <div className="relative pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                               <Check className="w-3.5 h-3.5" />
                               {examTestCount} {examTestCount === 1 ? 'Mock Test' : 'Mock Tests'}
                             </span>
                             <span className="text-xs font-bold text-slate-400 capitalize bg-slate-100 px-2.5 py-1 rounded-lg">{exam.category}</span>
                           </div>
                         </motion.div>
                       );
                     });
                  })()}
                </div>
              </div>
           ) : activeTab === 'tests' && selectedCategoryForTests === null ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-6 bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-slate-200/40 w-fit">
                  <button onClick={() => { setSelectedExamIdForTests(null); setSelectedCategoryForTests(null); }} className="hover:text-brand-600 transition-colors flex items-center gap-1">
                    Exams
                  </button>
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-slate-700 font-extrabold">{exams.find(e => e.id === selectedExamIdForTests)?.name || 'Selected Exam'}</span>
                </div>

                {(() => {
                   const exam = exams.find(e => e.id === selectedExamIdForTests);
                   if (!exam) return null;
                   return (
                     <div className="bg-white rounded-[2rem] border border-slate-200/50 p-6 flex flex-col md:flex-row gap-5 items-center justify-between shadow-sm">
                       <div className="flex items-center gap-5">
                         <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-4xl shadow-inner shrink-0">
                           {exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/')) ? <img src={getDirectImageUrl(exam.icon)} alt="" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" /> : exam.icon || '🏛️'}
                         </div>
                         <div>
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight">{exam.name}</h3>
                           <p className="text-slate-500 font-medium text-sm mt-1">{exam.description || 'Manage mock tests under this exam.'}</p>
                         </div>
                       </div>
                       <button 
                         onClick={() => { setSelectedExamIdForTests(null); setSelectedCategoryForTests(null); }}
                         className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-extrabold transition-all border border-slate-200 shadow-sm whitespace-nowrap"
                       >
                         Back to Exams
                       </button>
                     </div>
                   );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8">
                  {(() => {
                     const examTests = mockTests.filter(mt => {
                        try { if (mt.seriesId) return JSON.parse(mt.seriesId).examId === selectedExamIdForTests; } catch(e){}
                        return false;
                     });

                     const categoriesList = [
                       { id: 'full-length', label: 'Full Length Tests', desc: 'Complete exam-like mock tests covering all sections.', icon: '🏆', color: 'bg-emerald-50 text-emerald-600 border-emerald-100/60' },
                       { id: 'sectional', label: 'Sectional Tests', desc: 'Subject-wise or topic-wise practice sets.', icon: '📚', color: 'bg-blue-50 text-blue-600 border-blue-100/60' },
                       { id: 'pyq', label: 'Previous Year Questions (PYQ)', desc: 'Real questions from past papers with detailed solutions.', icon: '⏳', color: 'bg-amber-50 text-amber-600 border-amber-100/60' },
                       { id: 'daily', label: 'Daily Tests', desc: 'Quick daily or weekly practice sets.', icon: '📅', color: 'bg-rose-50 text-rose-600 border-rose-100/60' }
                     ];

                     const customCategories = Array.from(new Set(examTests.map(mt => {
                        try { if (mt.seriesId) return JSON.parse(mt.seriesId).category || 'full-length'; } catch(e){}
                        return 'full-length';
                     }).filter(cat => !['full-length', 'sectional', 'pyq', 'daily'].includes(cat))));

                     const allCategories = [
                       ...categoriesList,
                       ...customCategories.map(cat => ({
                         id: cat,
                         label: (cat as string).charAt(0).toUpperCase() + (cat as string).slice(1).replace('-', ' ') + ' Tests',
                         desc: `Tests belonging to category: ${cat}`,
                         icon: '📝',
                         color: 'bg-purple-50 text-purple-600 border-purple-100/60'
                       }))
                     ];

                     return allCategories.map(cat => {
                       const count = examTests.filter(mt => {
                         try {
                           if (mt.seriesId) {
                             const parsed = JSON.parse(mt.seriesId);
                             return parsed.category === cat.id || (cat.id === 'full-length' && !parsed.category);
                           }
                         } catch(e) {}
                         return false;
                       }).length;
                       
                       return (
                         <motion.div
                           key={cat.id}
                           whileHover={{ y: -4, scale: 1.02 }}
                           whileTap={{ scale: 0.98 }}
                           onClick={() => setSelectedCategoryForTests(cat.id)}
                           className="bg-white rounded-[2rem] border border-slate-200/60 p-6 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 cursor-pointer premium-shadow group relative overflow-hidden"
                         >
                           <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="flex gap-4">
                             <div className={`w-14 h-14 rounded-2xl ${cat.color} border flex items-center justify-center text-3xl shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                               {cat.icon}
                             </div>
                             <div>
                               <h4 className="text-xl font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 tracking-tight leading-snug">{cat.label}</h4>
                               <p className="text-slate-500 font-semibold text-sm mt-1">{cat.desc}</p>
                             </div>
                           </div>
                           <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-slate-50 text-slate-500 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors border border-slate-100">
                               {count} {count === 1 ? 'Test' : 'Tests'}
                             </span>
                             <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-1 transition-all" />
                           </div>
                         </motion.div>
                       );
                     });
                  })()}
                </div>
              </div>
           ) : (
              <div className="space-y-6">
                {(activeTab === 'banks' || activeTab === 'practice') && selectedExamIdForBanks && (
                  <div className="animate-in fade-in duration-200 space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2 bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-slate-200/40 w-fit">
                      <button onClick={() => { setSelectedExamIdForBanks(null); setFilterExamId('all'); }} className="hover:text-brand-600 transition-colors">
                        Exams
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-slate-700 font-extrabold">{exams.find(e => e.id === selectedExamIdForBanks)?.name || 'Selected Exam'}</span>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-slate-700 font-extrabold">{activeTab === 'practice' ? 'Practice Sets' : 'Question Banks'}</span>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200/50 p-6 flex flex-col md:flex-row gap-5 items-center justify-between shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-4xl shadow-inner shrink-0">
                          {activeTab === 'practice' ? '🎯' : '📚'}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {activeTab === 'practice' ? 'Practice Sets (Interactive Drills)' : 'Question Banks (PDFs & Web Reader)'}
                          </h3>
                          <p className="text-slate-500 font-semibold text-sm mt-1">
                            Exam: <span className="font-extrabold text-slate-800">{exams.find(e => e.id === selectedExamIdForBanks)?.name}</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedExamIdForBanks(null); setFilterExamId('all'); }}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-extrabold transition-all border border-slate-200 shadow-sm whitespace-nowrap"
                      >
                        Back to Exams
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'series' && selectedExamIdForSeries && (
                  <div className="animate-in fade-in duration-200 space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2 bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-slate-200/40 w-fit">
                      <button onClick={() => { setSelectedExamIdForSeries(null); setFilterExamId('all'); }} className="hover:text-brand-600 transition-colors">
                        Exams
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-slate-700 font-extrabold">{exams.find(e => e.id === selectedExamIdForSeries)?.name || 'Selected Exam'}</span>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-slate-700 font-extrabold">Test Series</span>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200/50 p-6 flex flex-col md:flex-row gap-5 items-center justify-between shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-4xl shadow-inner shrink-0">
                          🏆
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">Test Series Packages</h3>
                          <p className="text-slate-500 font-semibold text-sm mt-1">
                            Exam: <span className="font-extrabold text-slate-800">{exams.find(e => e.id === selectedExamIdForSeries)?.name}</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedExamIdForSeries(null); setFilterExamId('all'); }}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-extrabold transition-all border border-slate-200 shadow-sm whitespace-nowrap"
                      >
                        Back to Exams
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'questions' && selectedExamIdForQuestions && selectedTypeForQuestions && selectedTargetIdForQuestions && (
                  <div className="animate-in fade-in duration-200 space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2 bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-slate-200/40 w-fit">
                      <button onClick={() => { setSelectedExamIdForQuestions(null); setSelectedTypeForQuestions(null); setSelectedCategoryForQuestions(null); setSelectedTargetIdForQuestions(null); setFilterExamId('all'); }} className="hover:text-brand-600 transition-colors">
                        Exams
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <button onClick={() => { setSelectedTargetIdForQuestions(null); setSelectedCategoryForQuestions(null); }} className="hover:text-brand-600 transition-colors">
                        {exams.find(e => e.id === selectedExamIdForQuestions)?.name || 'Selected Exam'}
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <button 
                        onClick={() => { 
                          setSelectedTargetIdForQuestions(null); 
                          setSelectedCategoryForQuestions(null); 
                        }} 
                        className="hover:text-brand-600 transition-colors capitalize"
                      >
                        {selectedTypeForQuestions === 'mock' ? 'Mock Tests' : 'Content Banks'}
                      </button>
                      {selectedTypeForQuestions === 'mock' && typeof selectedCategoryForQuestions === 'string' && (
                        <>
                          <ChevronRight className="w-4 h-4" />
                          <button onClick={() => setSelectedTargetIdForQuestions(null)} className="hover:text-brand-600 transition-colors capitalize">
                            {selectedCategoryForQuestions}
                          </button>
                        </>
                      )}
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-slate-700 font-extrabold truncate max-w-[200px]">
                        {selectedTypeForQuestions === 'mock' ? (mockTests.find(m => m.id === selectedTargetIdForQuestions)?.title || 'Selected Test') : selectedTargetIdForQuestions}
                      </span>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200/50 p-6 flex flex-col lg:flex-row gap-5 items-center justify-between shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-4xl shadow-inner shrink-0">
                          ❓
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            Questions List
                          </h3>
                          <p className="text-slate-500 font-semibold text-sm mt-1">
                            Target: <span className="font-extrabold text-slate-800">{selectedTypeForQuestions === 'mock' ? (mockTests.find(m => m.id === selectedTargetIdForQuestions)?.title || 'Selected Test') : selectedTargetIdForQuestions}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap justify-end">
                        {selectedTypeForQuestions === 'mock' && (
                          <button 
                            onClick={() => {
                              setAttachMockTestId(selectedTargetIdForQuestions);
                              setShowMockUploadModal(true);
                            }}
                            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-extrabold transition-all shadow-md flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4" /> Bulk Upload
                          </button>
                        )}
                        <button 
                          onClick={() => openAddModal('questions')}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold transition-all shadow-md flex items-center gap-2"
                        >
                          <Plus className="w-4 h-4" /> Add Question
                        </button>
                        <button 
                          onClick={() => setSelectedTargetIdForQuestions(null)}
                          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-extrabold transition-all border border-slate-200 shadow-sm whitespace-nowrap"
                        >
                          Back to Selection
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'tests' && selectedExamIdForTests && selectedCategoryForTests && (
                  <div className="animate-in fade-in duration-200 space-y-6">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400 mb-2 bg-slate-100/50 px-4 py-2.5 rounded-2xl border border-slate-200/40 w-fit">
                      <button onClick={() => { setSelectedExamIdForTests(null); setSelectedCategoryForTests(null); }} className="hover:text-brand-600 transition-colors">
                        Exams
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <button onClick={() => setSelectedCategoryForTests(null)} className="hover:text-brand-600 transition-colors">
                        {exams.find(e => e.id === selectedExamIdForTests)?.name || 'Selected Exam'}
                      </button>
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-slate-700 font-extrabold">
                        {(() => {
                           const categoriesList = [
                             { id: 'full-length', label: 'Full Length Tests' },
                             { id: 'sectional', label: 'Sectional Tests' },
                             { id: 'pyq', label: 'Previous Year Questions (PYQ)' },
                             { id: 'daily', label: 'Daily Tests' }
                           ];
                           const standardLabel = categoriesList.find(c => c.id === selectedCategoryForTests)?.label;
                           if (standardLabel) return standardLabel;
                           return selectedCategoryForTests ? (selectedCategoryForTests.charAt(0).toUpperCase() + selectedCategoryForTests.slice(1).replace('-', ' ') + ' Tests') : 'Mock Tests';
                        })()}
                      </span>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200/50 p-6 flex flex-col md:flex-row gap-5 items-center justify-between shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center text-4xl shadow-inner shrink-0">
                          📝
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                            {(() => {
                               const categoriesList = [
                                 { id: 'full-length', label: 'Full Length Tests' },
                                 { id: 'sectional', label: 'Sectional Tests' },
                                 { id: 'pyq', label: 'Previous Year Questions (PYQ)' },
                                 { id: 'daily', label: 'Daily Tests' }
                               ];
                               const standardLabel = categoriesList.find(c => c.id === selectedCategoryForTests)?.label;
                               if (standardLabel) return standardLabel;
                               return selectedCategoryForTests ? (selectedCategoryForTests.charAt(0).toUpperCase() + selectedCategoryForTests.slice(1).replace('-', ' ') + ' Tests') : 'Mock Tests';
                            })()}
                          </h3>
                          <p className="text-slate-500 font-semibold text-sm mt-1">
                            Exam: <span className="font-extrabold text-slate-800">{exams.find(e => e.id === selectedExamIdForTests)?.name}</span> • 
                            Category: <span className="font-extrabold text-slate-800">{selectedCategoryForTests}</span>
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedCategoryForTests(null)}
                        className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-extrabold transition-all border border-slate-200 shadow-sm whitespace-nowrap"
                      >
                        Back to Categories
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'banks' && (
                  <div className="space-y-4 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-2 bg-slate-100/90 rounded-2xl border border-slate-200/80">
                      <div className="flex items-center gap-1.5 w-full sm:w-auto">
                        <button
                          onClick={() => setBankSubTab('banks')}
                          className={cn(
                            "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                            bankSubTab === 'banks'
                              ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          )}
                        >
                          <span className="text-base">📦</span> Question Banks (Step 1)
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-xs font-black",
                            bankSubTab === 'banks' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                          )}>
                            {banks.filter(b => (!selectedExamIdForBanks || b.examId === selectedExamIdForBanks) && (b.target_mode || 'both') !== 'practice').length}
                          </span>
                        </button>

                        <button
                          onClick={() => setBankSubTab('practice')}
                          className={cn(
                            "flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                            bankSubTab === 'practice'
                              ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          )}
                        >
                          <span className="text-base">🎯</span> Practice Mode Sets (Step 2)
                          <span className={cn(
                            "px-2 py-0.5 rounded-lg text-xs font-black",
                            bankSubTab === 'practice' ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                          )}>
                            {banks.filter(b => (!selectedExamIdForBanks || b.examId === selectedExamIdForBanks) && (b.target_mode || 'both') !== 'bank').length}
                          </span>
                        </button>

                        <button
                          onClick={() => setBankSubTab('all')}
                          className={cn(
                            "hidden md:flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer",
                            bankSubTab === 'all'
                              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                          )}
                        >
                          <span className="text-base">🌟</span> All Items
                        </button>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                        <div className="flex items-center gap-1 bg-white/80 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                          <button
                            onClick={() => setBankSortDirection('asc')}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
                              bankSortDirection === 'asc' ? "bg-brand-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            ↑ Asc
                          </button>
                          <button
                            onClick={() => setBankSortDirection('desc')}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer",
                              bankSortDirection === 'desc' ? "bg-brand-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                            )}
                          >
                            ↓ Desc
                          </button>
                        </div>

                        <div className="text-xs font-bold text-slate-500 px-3 py-1 bg-white/60 rounded-xl border border-slate-200/50 hidden lg:block">
                          {bankSubTab === 'banks' && "Showing Question Banks only (Practice-only items hidden)"}
                          {bankSubTab === 'practice' && "Showing Practice Mode sets only (PDF-only banks hidden)"}
                          {bankSubTab === 'all' && "Showing all Content Banks & Practice Sets"}
                        </div>
                      </div>
                    </div>

                    {/* Category Hierarchy Filter Pills Bar */}
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-white/80 rounded-2xl border border-slate-200/80 shadow-2xs">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-1">
                        Hierarchy:
                      </span>
                      {([
                        { id: 'all',             label: 'All Categories',      icon: '🌟', autoTab: 'all'      as const },
                        { id: 'topic-wise',      label: 'Chapter-Wise Practice', icon: '📘', autoTab: 'banks'    as const },
                        { id: 'exam-focused',    label: 'High-Yield Topic',    icon: '🎯', autoTab: 'practice' as const },
                        { id: 'revision-sets',   label: 'Daily Speed Quiz',    icon: '⚡', autoTab: 'practice' as const },
                        { id: 'pyq-collections', label: 'Topic-Wise PYQ',      icon: '📜', autoTab: 'practice' as const },
                      ] as { id: 'all' | 'topic-wise' | 'exam-focused' | 'revision-sets' | 'pyq-collections'; label: string; icon: string; autoTab: 'all' | 'banks' | 'practice' }[]).map(cat => {
                        // Count is ALWAYS across all sub-tabs — not filtered by bankSubTab
                        // This ensures High-Yield shows 6 even when on Question Banks tab
                        const count = banks.filter(b => {
                          const matchExam = !selectedExamIdForBanks || b.examId === selectedExamIdForBanks;
                          const matchCat = cat.id === 'all' || b.type === cat.id;
                          return matchExam && matchCat;
                        }).length;

                        const isActive = bankFilter === cat.id;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => {
                              setBankFilter(cat.id);
                              // Auto-switch sub-tab to the right view for this category
                              setBankSubTab(cat.autoTab);
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer",
                              isActive
                                ? "bg-slate-900 text-white shadow-md shadow-slate-900/10"
                                : "bg-slate-100/80 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                            )}
                          >
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-black",
                              isActive ? "bg-white/20 text-white" : "bg-slate-200/80 text-slate-700"
                            )}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="glass rounded-[2rem] border border-slate-200/50 shadow-xl overflow-hidden bg-white/70">
                  <div className="grid grid-cols-12 bg-slate-100/50 border-b border-slate-200/60 px-8 py-5 text-xs font-black uppercase text-slate-500 tracking-widest">
                      {activeTab === 'tests' || activeTab === 'banks' || activeTab === 'practice' ? (
                        <>
                          <div className="col-span-1 flex items-center">
                            <input 
                              type="checkbox"
                              checked={items.length > 0 && items.every(item => selectedItemIds.has(item.id))}
                              ref={input => {
                                if (input) {
                                  const anySelected = items.some(item => selectedItemIds.has(item.id));
                                  const allSelected = items.every(item => selectedItemIds.has(item.id));
                                  input.indeterminate = anySelected && !allSelected;
                                }
                              }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemIds(new Set(items.map(item => item.id)));
                                } else {
                                  setSelectedItemIds(new Set());
                                }
                              }}
                              className="w-4 h-4 text-brand-600 border-slate-300 rounded-lg focus:ring-brand-500/10 focus:ring-2 cursor-pointer transition-all"
                            />
                          </div>
                          <div className="col-span-1">Order</div>
                          <div className="col-span-5">Basic Info</div>
                          <div className="col-span-2">Details</div>
                          <div className="col-span-3 text-right pr-4">Actions</div>
                        </>
                      ) : (
                        <>
                          <div className="col-span-1 flex items-center">
                            <input 
                              type="checkbox"
                              checked={items.length > 0 && items.every(item => selectedItemIds.has(item.id))}
                              ref={input => {
                                if (input) {
                                  const anySelected = items.some(item => selectedItemIds.has(item.id));
                                  const allSelected = items.every(item => selectedItemIds.has(item.id));
                                  input.indeterminate = anySelected && !allSelected;
                                }
                              }}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemIds(new Set(items.map(item => item.id)));
                                } else {
                                  setSelectedItemIds(new Set());
                                }
                              }}
                              className="w-4 h-4 text-brand-600 border-slate-300 rounded-lg focus:ring-brand-500/10 focus:ring-2 cursor-pointer transition-all"
                            />
                          </div>
                          <div className="col-span-5">Basic Info</div>
                          <div className="col-span-3">Details</div>
                          <div className="col-span-3 text-right pr-4">Actions</div>
                        </>
                      )}
                  </div>

                  {loading && items.length === 0 ? (
                    <div className="divide-y divide-slate-100/80 animate-pulse">
                      {[1, 2, 3, 4, 5].map((idx) => (
                        <div key={idx} className="px-8 py-6 grid grid-cols-12 items-center gap-4">
                          <div className="col-span-1 flex items-center">
                            <div className="w-4 h-4 bg-slate-200/80 rounded-lg" />
                          </div>
                          <div className="col-span-5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-200/80 shrink-0" />
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="h-4 bg-slate-200/80 rounded-md w-3/4" />
                              <div className="h-3 bg-slate-100 rounded-md w-1/2" />
                            </div>
                          </div>
                          <div className="col-span-3">
                            <div className="h-3.5 bg-slate-200/60 rounded-md w-2/3" />
                          </div>
                          <div className="col-span-3 flex items-center justify-end gap-2 pr-4">
                            <div className="w-8 h-8 bg-slate-200/70 rounded-xl" />
                            <div className="w-8 h-8 bg-slate-200/70 rounded-xl" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : items.length === 0 ? (
                     <div className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-400">
                          <AlertCircle className="w-12 h-12 text-slate-300" />
                          <p className="font-extrabold text-xl text-slate-500">No items found in {activeTab}</p>
                          <button onClick={() => openAddModal(activeTab)} className="text-brand-600 hover:text-brand-700 font-extrabold text-sm underline mt-2">Create the first record</button>
                        </div>
                     </div>
                  ) : (
                    <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <Reorder.Item key={item.id} value={item} className="bg-white/50">
                           <div className="hover:bg-brand-50/30 transition-colors group px-8 py-6 grid grid-cols-12 items-center">
                              {activeTab === 'tests' || activeTab === 'banks' || activeTab === 'practice' ? (
                                 <>
                                    <div className="col-span-1 flex items-center">
                                      <input 
                                        type="checkbox"
                                        checked={selectedItemIds.has(item.id)}
                                        onChange={(e) => {
                                          const next = new Set(selectedItemIds);
                                          if (e.target.checked) {
                                            next.add(item.id);
                                          } else {
                                            next.delete(item.id);
                                          }
                                          setSelectedItemIds(next);
                                        }}
                                        className="w-4 h-4 text-brand-600 border-slate-300 rounded-lg focus:ring-brand-500/10 focus:ring-2 cursor-pointer transition-all"
                                      />
                                    </div>
                                    <div className="col-span-1 flex items-center gap-2">
                                      <input 
                                        type="number" 
                                        min="1"
                                        value={item.sortOrder ?? ''} 
                                        onChange={(e) => {
                                          const newVal = parseInt(e.target.value);
                                          if (!isNaN(newVal) && newVal > 0) {
                                            const updatedItems = items.map(it => it.id === item.id ? { ...it, sortOrder: newVal } : it);
                                            setItems(updatedItems);
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const newVal = parseInt(e.target.value);
                                          if (!isNaN(newVal) && newVal > 0) {
                                            if (activeTab === 'tests') {
                                              if (newVal !== (mockTests.find(t => t.id === item.id)?.sortOrder || 0)) {
                                                handleInlineOrderChange(item.id, newVal);
                                              }
                                            } else if (activeTab === 'banks' || activeTab === 'practice') {
                                              if (newVal !== (banks.find(b => b.id === item.id)?.sortOrder || 0)) {
                                                handleBankInlineOrderChange(item.id, newVal);
                                              }
                                            }
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const newVal = parseInt((e.target as HTMLInputElement).value);
                                            if (!isNaN(newVal) && newVal > 0) {
                                              if (activeTab === 'tests') {
                                                if (newVal !== (mockTests.find(t => t.id === item.id)?.sortOrder || 0)) {
                                                  handleInlineOrderChange(item.id, newVal);
                                                }
                                              } else if (activeTab === 'banks' || activeTab === 'practice') {
                                                if (newVal !== (banks.find(b => b.id === item.id)?.sortOrder || 0)) {
                                                  handleBankInlineOrderChange(item.id, newVal);
                                                }
                                              }
                                              (e.target as HTMLInputElement).blur();
                                            }
                                          }
                                        }}
                                        className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-center font-black focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 outline-none transition-all shadow-sm bg-slate-50/50"
                                      />
                                    </div>
                                    <div className="col-span-5">
                                       <div className="font-extrabold text-slate-900 text-lg line-clamp-2 pr-4">{item.name || item.title || item.questionText || 'Untitled'}</div>
                                       <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                                          {(() => {
                                            if (activeTab === 'banks' || activeTab === 'practice') {
                                              let subj = '';
                                              if (item.tagline && item.tagline.includes('"subject"')) {
                                                try { subj = JSON.parse(item.tagline).subject; } catch(e) {}
                                              }
                                              const typeLabel = item.target_mode === 'both' ? 'Both' : item.target_mode === 'practice' ? 'Practice' : (item.type || 'Bank');
                                              return subj ? `${subj} • ${typeLabel}` : (item.type || 'Default');
                                            }
                                            return item.category || item.type || item.difficulty || 'Default';
                                          })()}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                       <div className="text-sm font-bold text-slate-600">
                                          {activeTab === 'banks' || activeTab === 'practice'
                                            ? `${item.questionCount || 0} Qs • ${item.isPremium ? 'Premium' : 'Free'}`
                                            : `${item.durationMinutes} Min • ${item.totalMarks} Marks`}
                                       </div>
                                       <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {item.id?.slice(0, 8)}</div>
                                    </div>
                                 </>
                              ) : (
                                 <>
                                    <div className="col-span-1 flex items-center">
                                      <input 
                                        type="checkbox"
                                        checked={selectedItemIds.has(item.id)}
                                        onChange={(e) => {
                                          const next = new Set(selectedItemIds);
                                          if (e.target.checked) {
                                            next.add(item.id);
                                          } else {
                                            next.delete(item.id);
                                          }
                                          setSelectedItemIds(next);
                                        }}
                                        className="w-4 h-4 text-brand-600 border-slate-300 rounded-lg focus:ring-brand-500/10 focus:ring-2 cursor-pointer transition-all"
                                      />
                                    </div>
                                    <div className="col-span-5">
                                       <div className="font-extrabold text-slate-900 text-lg line-clamp-2 pr-4">{item.name || item.title || item.questionText || 'Untitled'}</div>
                                       <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">{item.category || item.type || item.difficulty || 'Default'}</div>
                                    </div>
                                    <div className="col-span-3">
                                       <div className="text-sm font-bold text-slate-600">
                                          {(() => {
                                             if (activeTab === 'questions') return `${item.options?.length || 0} Options`;
                                             if (activeTab === 'series') return `₹${item.price} • ${item.durationDays} Days`;
                                             if (activeTab === 'tests') return `${item.durationMinutes} Min • ${item.totalMarks} Marks`;
                                             if (activeTab === 'exams' || activeTab === 'blogs') {
                                                const tracker = getExamAdminTracker(item);
                                                const countdownColorMap: Record<string, string> = {
                                                  urgent: 'bg-red-100 text-red-700 border-red-200',
                                                  warning: 'bg-amber-100 text-amber-700 border-amber-200',
                                                  normal: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                  today: 'bg-red-100 text-red-700 border-red-200',
                                                  passed: 'bg-slate-100 text-slate-500 border-slate-200',
                                                  tba: 'bg-blue-50 text-blue-600 border-blue-200',
                                                  expected: 'bg-purple-50 text-purple-600 border-purple-200',
                                                };
                                                const formColorMap: Record<string, string> = {
                                                  open: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                                  closed: 'bg-slate-100 text-slate-500 border-slate-200',
                                                  awaited: 'bg-amber-100 text-amber-700 border-amber-200',
                                                  tba: 'bg-blue-50 text-blue-600 border-blue-200',
                                                };
                                                return (
                                                  <div className="flex flex-col gap-1.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border ${countdownColorMap[tracker.countdownType] || 'bg-slate-100 text-slate-500 border-slate-200'} ${tracker.countdownType === 'urgent' || tracker.countdownType === 'today' ? 'animate-pulse' : ''}`}>
                                                      {tracker.countdownText}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border ${formColorMap[tracker.formType] || 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                      {tracker.formText}
                                                    </span>
                                                  </div>
                                                );
                                             }
                                             if (activeTab === 'banks' || activeTab === 'practice') return `${item.questionCount || 0} Qs • ${item.isPremium ? 'Premium' : 'Free'}`;
                                             return '-';
                                          })()}
                                       </div>
                                       <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {item.id?.slice(0, 8)}</div>
                                    </div>
                                 </>
                              )}
                              <div className="col-span-3 flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                 {['tests', 'series', 'banks'].includes(activeTab) && (
                                   <button 
                                     onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('DANGER ZONE: Are you sure you want to revoke access to this content for EVERY SINGLE USER who purchased it?')) return;
                                        
                                        try {
                                           const session = (await supabase.auth.getSession()).data.session;
                                           const token = session?.access_token;
                                           const response = await fetch('/api/admin/content/revoke', {
                                              method: 'POST',
                                              headers: {
                                                 'Content-Type': 'application/json',
                                                 'Authorization': `Bearer ${token}`
                                              },
                                              body: JSON.stringify({
                                                 productId: item.id
                                              })
                                           });
                                           const resData = await response.json();
                                           if (!response.ok) throw new Error(resData.error || 'Failed to revoke content');
                                           alert(`Access revoked from users (processed: ${resData.count || 0}).`);
                                        } catch (err: any) {
                                           alert(`Failed to revoke access: ${err.message}`);
                                        }
                                        fetchData();
                                     }}
                                     className="p-2.5 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all"
                                     title="Revoke Content for All Users"
                                   >
                                     <Users className="w-5 h-5 pointer-events-none" />
                                   </button>
                                 )}
                                 {activeTab === 'exams' && (
                                   <button 
                                     onClick={async (e) => {
                                        e.stopPropagation();
                                        if (!confirm('DANGER ZONE / END CYCLE: Are you sure you want to REVOKE ALL ACCESS to this Exam for EVERY SINGLE USER? This instantly removes access to the Exam Bundle, all individual Mock Tests, and Question Banks under this exam. This action cannot be undone and users will need to purchase again for the next cycle.')) return;
                                        
                                        const relatedIds = [
                                           `exam_bundle_${item.id}`,
                                           ...mockTests.filter((t: any) => t.examId === item.id).map((t: any) => t.id),
                                           ...banks.filter((b: any) => b.examId === item.id).map((b: any) => b.id)
                                        ];
                                        
                                         try {
                                            const session = (await supabase.auth.getSession()).data.session;
                                            const token = session?.access_token;
                                            const response = await fetch('/api/admin/content/revoke', {
                                               method: 'POST',
                                               headers: {
                                                  'Content-Type': 'application/json',
                                                  'Authorization': `Bearer ${token}`
                                               },
                                               body: JSON.stringify({
                                                  productId: `exam_bundle_${item.id}`,
                                                  relatedIds
                                               })
                                            });
                                            const resData = await response.json();
                                            if (!response.ok) throw new Error(resData.error || 'Failed to revoke exam access');
                                            alert(`Cycle Reset Complete: Exam access and all related content revoked (processed: ${resData.count || 0}).`);
                                         } catch (err: any) {
                                            alert(`Failed to revoke access: ${err.message}`);
                                         }
                                        fetchData();
                                     }}
                                     className="p-2.5 text-red-500 hover:text-white hover:bg-red-500 rounded-xl transition-all"
                                     title="End Cycle: Revoke All Exam Content Access"
                                   >
                                     <Users className="w-5 h-5 pointer-events-none" />
                                   </button>
                                 )}
                                 {activeTab === 'tests' && (
                                   <button 
                                     onClick={(e) => {
                                        e.stopPropagation();
                                        setAttachMockTestId(item.id);
                                        setShowMockUploadModal(true);
                                     }}
                                     className="p-2.5 text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl transition-all"
                                     title="Upload Questions JSON"
                                   >
                                     <Upload className="w-5 h-5" />
                                   </button>
                                 )}
                                 <div className="p-2.5 text-slate-300 group-hover:text-slate-400 cursor-grab active:cursor-grabbing" title="Drag to reorder">
                                   <GripVertical className="w-5 h-5" />
                                 </div>
                                 <button onClick={(e) => handleEditClick(item, e)} className="p-2.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-xl transition-all"><Edit2 className="w-5 h-5" /></button>
                                 <button onClick={(e) => handleDelete(item.id, e)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                              </div>
                           </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  )}

                  {/* Pagination Controls */}
                  {activeTab === 'questions' && questionsTotalCount > questionsLimit && (
                    <div className="flex items-center justify-between px-8 py-5 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
                      <div className="text-sm font-semibold text-slate-500">
                        Showing <span className="font-extrabold text-slate-800">{((questionsPage - 1) * questionsLimit) + 1}</span> to <span className="font-extrabold text-slate-800">{Math.min(questionsPage * questionsLimit, questionsTotalCount)}</span> of <span className="font-extrabold text-slate-800">{questionsTotalCount}</span> questions
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={questionsPage === 1 || loadingQuestions}
                          onClick={() => setQuestionsPage(p => Math.max(p - 1, 1))}
                          className={cn(
                            "px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0",
                            (questionsPage === 1 || loadingQuestions) && "opacity-50 cursor-not-allowed pointer-events-none"
                          )}
                        >
                          Previous
                        </button>
                        <span className="text-sm font-bold text-slate-600 px-2">Page {questionsPage}</span>
                        <button
                          disabled={questionsPage * questionsLimit >= questionsTotalCount || loadingQuestions}
                          onClick={() => setQuestionsPage(p => p + 1)}
                          className={cn(
                            "px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0",
                            (questionsPage * questionsLimit >= questionsTotalCount || loadingQuestions) && "opacity-50 cursor-not-allowed pointer-events-none"
                          )}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
           )}
        </div>
      </main>

      {/* Bulk Upload Modal */}
      <AnimatePresence>
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-slate-950/40 z-[60] flex items-center justify-center p-4 backdrop-blur-sm pt-20">
            <motion.div {...modalContent}
              className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain premium-shadow border border-slate-100 my-auto"
              data-lenis-prevent
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                      <Upload className="w-5 h-5 text-brand-600" />
                    </div>
                    Bulk Upload Questions
                  </h3>
                  <button onClick={() => setShowBulkUploadModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Target Exam *</label>
                      <SearchableDropdown 
                        required 
                        value={bulkExamId} 
                        onChange={v => setBulkExamId(v)} 
                        options={actualExams.map(ex => ({ value: ex.id as string, label: ex.name }))}
                        placeholder="-- Choose Exam --"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Target Topic *</label>
                      <select 
                        required 
                        value={bulkTopic} 
                        onChange={e => setBulkTopic(e.target.value)} 
                        className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-brand-500 transition-all font-bold bg-white disabled:opacity-50"
                        disabled={!bulkExamId}
                      >
                        <option value="">-- Choose Target Topic --</option>
                        {banks.filter((b: any) => b.examId === bulkExamId).length > 0 && (
                          <optgroup label="📦 Question Banks & Practice Sets">
                            {banks.filter((b: any) => b.examId === bulkExamId).map((bank: any) => {
                              const categoryLabels: Record<string, string> = {
                                'topic-wise': 'Chapter-Wise',
                                'exam-focused': 'High-Yield',
                                'revision-sets': 'Daily Quizzes',
                                'pyq-collections': 'Topic PYQ'
                              };
                              const catName = categoryLabels[bank.type] || bank.type;
                              return (
                                <option key={bank.id} value={bank.title}>
                                  [{catName}] {bank.title} ({bank.questionCount || 0} Qs)
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                        {mockTests.filter((mt: any) => {
                          try {
                            if (mt.seriesId) {
                              const parsed = JSON.parse(mt.seriesId);
                              return parsed.examId === bulkExamId;
                            }
                          } catch(e){}
                          return false;
                        }).length > 0 && (
                          <optgroup label="📝 Mock Tests">
                            {mockTests.filter((mt: any) => {
                              try {
                                if (mt.seriesId) {
                                  const parsed = JSON.parse(mt.seriesId);
                                  return parsed.examId === bulkExamId;
                                }
                              } catch(e){}
                              return false;
                            }).map((mt: any) => {
                              const count = mt._questionCount || mt.questions?.length || 0;
                              return (
                                <option key={mt.id} value={`mockTest__${mt.id}`}>
                                  [Mock Test] {mt.title} ({count} Qs)
                                </option>
                              );
                            })}
                          </optgroup>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Upload JSON File(s)</label>
                    <div className="relative p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                      <input 
                        type="file" 
                        accept=".json"
                        multiple
                        onChange={async (e) => {
                          const files = e.target.files;
                          if (!files || files.length === 0) return;
                          const fileArray = Array.from(files) as File[];
                          const names = fileArray.map(f => f.name);
                          setBulkFileNames(names);

                          const readPromises = fileArray.map((file: File) => {
                            return new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              reader.onload = (evt) => resolve((evt.target?.result as string) || '');
                              reader.onerror = (err) => reject(err);
                              reader.readAsText(file);
                            });
                          });

                          try {
                            const fileContents = await Promise.all(readPromises);
                            setBulkFileContent(fileContents.filter(Boolean).join('\n'));
                          } catch (err) {
                            console.error("Error reading JSON files:", err);
                            alert("Failed to read one or more files.");
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2 group-hover:text-brand-500 transition-colors" />
                      <p className="text-sm font-extrabold text-slate-700">Click or drag JSON file(s) here</p>
                      <p className="text-xs text-slate-500 mt-1 font-medium">Select single or multiple .json files at once</p>
                      {bulkFileNames.length > 0 && (
                        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold animate-fadeIn relative z-20">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{bulkFileNames.length} file{bulkFileNames.length > 1 ? 's' : ''} loaded: {bulkFileNames.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Pasted JSON Content</label>
                      <DiagramTemplateSelector onSelect={(jsonStr) => setBulkFileContent(jsonStr)} />
                    </div>
                    <textarea 
                      value={bulkFileContent}
                      onChange={(e) => setBulkFileContent(e.target.value)}
                      className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 outline-none focus:border-brand-500 transition-all font-mono text-sm min-h-[150px] bg-slate-50" 
                      placeholder="[ { &quot;questionText&quot;: &quot;...&quot;, &quot;options&quot;: [&quot;A&quot;, &quot;B&quot;, &quot;C&quot;], &quot;correctAnswerIndex&quot;: 0, &quot;explanation&quot;: &quot;&quot; } ]"
                    />
                    <p className="text-xs font-bold text-brand-600 bg-brand-50 p-3 rounded-xl border border-brand-100">
                      Format: JSON Array of Objects with keys: questionText, options (array of strings), correctAnswerIndex (0-3), explanation (optional).
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button onClick={() => setShowBulkUploadModal(false)} className="px-6 py-3 rounded-xl font-extrabold text-slate-600 hover:bg-slate-100 transition-all border-2 border-slate-200">Cancel</button>
                  <button onClick={handleBulkUpload} className="px-8 py-3 premium-gradient text-white rounded-xl font-extrabold shadow-lg shadow-brand-500/20 hover:premium-glow transition-all">Upload & Save</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 z-[60] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md overflow-y-auto overscroll-contain" data-lenis-prevent>
            <motion.div {...modalContent}
              className={cn(
                "bg-white rounded-[2.5rem] w-full overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] border border-slate-100 my-auto relative",
                activeTab === 'questions' ? 'max-w-4xl' : 'max-w-3xl'
              )}
            >
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center border border-brand-100/50 shadow-sm shrink-0">
                      <Plus className="w-5 h-5" />
                   </div>
                   <h3 className="font-black text-xl tracking-tight text-slate-900">
                     {editingId ? 'Edit ' : 'Add New '}
                     <span className="text-brand-600 capitalize">
                       {activeTab === 'banks' ? 'Question Bank' : activeTab === 'practice' ? 'Practice Set' : activeTab}
                     </span>
                   </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!editingId && (
                    <button 
                      type="button" 
                      onClick={() => resetStickyFormData(activeTab)} 
                      title="Clear prefilled memory and reset all fields"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200/60 bg-white shadow-xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Form</span>
                    </button>
                  )}
                  {/* Quick Save — submits form without scrolling to bottom */}
                  <button
                    form="add-new-form"
                    type="submit"
                    title="Save without scrolling to bottom"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 rounded-xl transition-all shadow-sm shrink-0 border border-brand-700/20"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all border border-slate-200/50 shadow-sm bg-white shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <form id="add-new-form" onSubmit={handleAdd} className="p-8 sm:p-10">
                
                {renderFormFields()}

                <div className="flex justify-end gap-3.5 mt-8 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm shrink-0 bg-white shadow-sm">Cancel</button>
                  <button type="submit" className="px-8 py-3 rounded-xl premium-gradient text-white font-black hover:premium-glow shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] text-sm shrink-0">
                    Save {activeTab === 'banks' ? 'Question Bank' : activeTab === 'practice' ? 'Practice Set' : activeTab}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Bulk JSON Importer Modal ── */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-slate-950/60 z-[65] flex items-start justify-center p-4 sm:p-6 backdrop-blur-md overflow-y-auto overscroll-contain" data-lenis-prevent>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] border border-slate-100 my-auto"
            >
              {/* Header */}
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center border border-brand-100/50 shadow-sm shrink-0">
                    <FileJson className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl tracking-tight text-slate-900">
                      Bulk Import{' '}
                      <span className="text-brand-600 capitalize">
                        {activeTab === 'banks' ? 'Question Banks' : activeTab === 'practice' ? 'Practice Sets' : 'Mock Tests'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">Paste JSON → one click → all records created with auto sortOrder</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => resetStickyBulkData(activeTab)} 
                    title="Clear prefilled memory and reset all fields"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200/60 bg-white shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Form</span>
                  </button>
                  <button type="button" onClick={() => setShowBulkModal(false)} className="p-2.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 rounded-xl transition-all border border-slate-200/50 shadow-sm bg-white shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-6">

                {/* ── GLOBAL CONFIG ── */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/60 p-5 space-y-5">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Settings — applied to every item in the batch</p>

                  {/* Exam selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Select Exam *</label>
                    <select
                      value={bulkGlobalExamId}
                      onChange={e => setBulkGlobalExamId(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none font-bold text-sm bg-white"
                    >
                      <option value="">-- Choose Exam --</option>
                      {exams.filter((ex: any) => ex.category !== 'blog' && ex.category !== 'system' && !ex.is_archived && !(ex.name || '').startsWith('SYSTEM_SETTINGS_')).map((ex: any) => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Category pills */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider">
                      {activeTab === 'tests' ? 'Mock Category *' : 'Practice Category *'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(activeTab === 'tests'
                        ? ['full-length', 'sectional', 'pyq', 'daily']
                        : ['topic-wise', 'exam-focused', 'revision-sets', 'pyq-collections']
                      ).map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setBulkGlobalCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            bulkGlobalCategory === cat
                              ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                          }`}
                        >
                          {cat.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Mode — banks/practice only */}
                  {(activeTab === 'banks' || activeTab === 'practice') && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Display Target *</label>
                      <div className="flex gap-2">
                        {(['bank', 'practice', 'both'] as const).map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setBulkGlobalTargetMode(m)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              bulkGlobalTargetMode === m
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                            }`}
                          >
                            {m === 'bank' ? '📚 Bank Only' : m === 'practice' ? '🎯 Practice Only' : '✅ Both'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Duration / Marks / Negative — tests only */}
                  {activeTab === 'tests' && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Duration (min)</label>
                        <input type="number" value={bulkGlobalDurationMinutes} onChange={e => setBulkGlobalDurationMinutes(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Marks</label>
                        <input type="number" value={bulkGlobalTotalMarks} onChange={e => setBulkGlobalTotalMarks(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none text-sm font-bold" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Negative Marking</label>
                        <input type="number" step="0.25" value={bulkGlobalNegativeMarking} onChange={e => setBulkGlobalNegativeMarking(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none text-sm font-bold" />
                      </div>
                    </div>
                  )}

                  {/* Premium + Schedule + Pricing */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-6 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <div
                          onClick={() => setBulkGlobalIsPremium(p => !p)}
                          className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${bulkGlobalIsPremium ? 'bg-brand-600' : 'bg-slate-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${bulkGlobalIsPremium ? 'translate-x-4' : ''}`} />
                        </div>
                        <span className="text-xs font-black text-slate-600">Premium / Locked Content</span>
                      </label>
                      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">Schedule:</label>
                        <input
                          type="datetime-local"
                          value={bulkGlobalScheduledAt}
                          onChange={e => setBulkGlobalScheduledAt(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none text-xs font-bold bg-white"
                        />
                      </div>
                    </div>

                    {/* Premium Price Inputs — smoothly shown when Premium is ON */}
                    {bulkGlobalIsPremium && (
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-brand-50/50 rounded-xl border border-brand-100/60 animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-brand-900 uppercase tracking-wider">Offer Price (₹) *</label>
                          <input
                            type="number"
                            min="0"
                            value={bulkGlobalPrice}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setBulkGlobalPrice(val);
                              if (!bulkGlobalOriginalPrice || bulkGlobalOriginalPrice <= val) {
                                setBulkGlobalOriginalPrice(val * 2);
                              }
                            }}
                            placeholder="e.g. 499"
                            className="w-full px-3 py-2 rounded-xl border border-brand-200 focus:border-brand-500 focus:outline-none text-sm font-bold bg-white text-slate-900"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Original / MRP (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={bulkGlobalOriginalPrice}
                            onChange={e => setBulkGlobalOriginalPrice(Number(e.target.value))}
                            placeholder="e.g. 999"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-brand-400 focus:outline-none text-sm font-bold bg-white text-slate-700"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── JSON INPUT ── */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-600 uppercase tracking-wider">Paste JSON Array *</label>
                    {(() => {
                      let count = 0;
                      try { const p = JSON.parse(bulkJsonInput.trim()); if (Array.isArray(p)) count = p.length; } catch {}
                      return count > 0 ? (
                        <span className="text-xs font-black text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-100">
                          {count} item{count !== 1 ? 's' : ''} detected
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <textarea
                    value={bulkJsonInput}
                    onChange={e => { setBulkJsonInput(e.target.value); setBulkResults(null); }}
                    rows={10}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-brand-400 focus:outline-none font-mono text-xs resize-y bg-slate-50"
                    placeholder={activeTab === 'tests'
                      ? `[\n  { "title": "Full Mock Test 1" },\n  { "title": "Full Mock Test 2" },\n  { "title": "Sectional - Physics", "subject": "Physics" }\n]`
                      : `[\n  { "title": "Force Systems & Fundamentals", "subject": "Physics" },\n  { "title": "Equilibrium of Forces", "subject": "Physics" },\n  { "title": "Community Health Nursing", "subject": "Nursing" }\n]`}
                  />
                  <p className="text-[10px] text-slate-400 font-semibold">
                    Required per item: <code className="bg-slate-100 px-1 rounded">title</code>
                    {' · '}Optional: <code className="bg-slate-100 px-1 rounded">subject</code>
                    {activeTab !== 'tests' ? <>, <code className="bg-slate-100 px-1 rounded">tagline</code>, <code className="bg-slate-100 px-1 rounded">price</code>, <code className="bg-slate-100 px-1 rounded">scheduled_at</code>, <code className="bg-slate-100 px-1 rounded">questionCount</code></> : <>, <code className="bg-slate-100 px-1 rounded">durationMinutes</code>, <code className="bg-slate-100 px-1 rounded">totalMarks</code>, <code className="bg-slate-100 px-1 rounded">scheduled_at</code></>}
                    {' '}(per-item values override global settings)
                  </p>
                </div>

                {/* ── RESULTS BANNER ── */}
                {bulkResults && (
                  <div className={`rounded-2xl p-4 border ${bulkResults.failed === 0 ? 'bg-green-50 border-green-200' : bulkResults.success === 0 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {bulkResults.failed === 0
                        ? <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
                        : bulkResults.success === 0
                        ? <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                        : <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />}
                      <p className="text-sm font-black text-slate-800">
                        {bulkResults.success} created successfully
                        {bulkResults.failed > 0 && ` · ${bulkResults.failed} failed`}
                      </p>
                    </div>
                    {bulkResults.errors.length > 0 && (
                      <ul className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
                        {bulkResults.errors.map((err, i) => (
                          <li key={i} className="text-[11px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded">⚠ {err}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all text-sm bg-white shadow-sm"
                >
                  {bulkResults?.success ? 'Close' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={bulkLoading || !bulkJsonInput.trim() || !bulkGlobalExamId}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl premium-gradient text-white font-black hover:premium-glow shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {bulkLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Importing…
                    </>
                  ) : (
                    <>
                      <FileJson className="w-4 h-4" />
                      {(() => {
                        let count = 0;
                        try { const p = JSON.parse(bulkJsonInput.trim()); if (Array.isArray(p)) count = p.length; } catch {}
                        return count > 0 ? `Import ${count} Items` : 'Import';
                      })()}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMockUploadModal && (
          <div className="fixed inset-0 bg-slate-950/40 z-[70] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div {...modalContent}
              className="glass rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl border-white/60 bg-white"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                      <Upload className="w-5 h-5" />
                   </div>
                   <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">Upload Mock Test Questions</h3>
                </div>
                <button onClick={() => setShowMockUploadModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                
                <div className="space-y-3">
                  <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Target Mock Test *</label>
                  <select 
                    value={attachMockTestId || ''} 
                    onChange={e => setAttachMockTestId(e.target.value)}
                    disabled={!!attachMockTestId}
                    className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-brand-500 font-bold bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Select Mock Test --</option>
                    {mockTests.filter(t => {
                      if (activeTab === 'questions' && selectedExamIdForQuestions) {
                        try {
                          if (t.seriesId) {
                            const parsed = JSON.parse(t.seriesId);
                            if (parsed.examId !== selectedExamIdForQuestions) return false;
                            if (selectedCategoryForQuestions && parsed.category !== selectedCategoryForQuestions) return false;
                          }
                        } catch(e) { return false; }
                      } else if (activeTab === 'tests' && selectedExamIdForTests) {
                        try {
                          if (t.seriesId) {
                            const parsed = JSON.parse(t.seriesId);
                            if (parsed.examId !== selectedExamIdForTests) return false;
                            if (selectedCategoryForTests && parsed.category !== selectedCategoryForTests) return false;
                          }
                        } catch(e) { return false; }
                      }
                      return true;
                    }).map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Paste JSON Array</label>
                    <DiagramTemplateSelector onSelect={(jsonStr) => setBulkFileContent(jsonStr)} />
                  </div>
                  <textarea 
                    value={bulkFileContent} 
                    onChange={e => setBulkFileContent(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-brand-500 min-h-[250px] font-mono text-sm" 
                    placeholder="[ { questionText: '...', options: ['A','B','C','D'], correctAnswerIndex: 0, explanation: '...' } ]" 
                  />
                </div>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowMockUploadModal(false)} className="px-8 py-3 rounded-xl border-2 border-slate-200 font-extrabold text-slate-600 hover:bg-slate-100 relative">Cancel</button>
                  <button onClick={handleMockBulkUpload} className="px-10 py-3 rounded-xl premium-gradient text-white font-extrabold hover:premium-glow shadow-lg transition-all">Upload Questions</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Force Set Password Modal */}
      <AnimatePresence>
        {showPasswordModal && passwordTargetUser && (
          <div className="fixed inset-0 bg-slate-950/40 z-[80] flex items-center justify-center p-6 backdrop-blur-sm">
            <motion.div {...modalContent}
              className="glass rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border-white/60 bg-white"
            >
              <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                      <AlertCircle className="w-5 h-5" />
                   </div>
                   <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">Force Set Password</h3>
                </div>
                <button onClick={() => setShowPasswordModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                
                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                   <p className="text-sm font-bold text-red-800">You are manually overriding the password for:</p>
                   <p className="text-sm font-mono text-red-600 mt-1">{passwordTargetUser.email}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">New Password</label>
                  <input 
                    type="text"
                    value={newPasswordValue}
                    onChange={e => setNewPasswordValue(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border-2 border-slate-100 focus:border-brand-500 font-bold" 
                    placeholder="Enter new secure password" 
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowPasswordModal(false)} className="px-6 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-600 hover:bg-slate-100">Cancel</button>
                  <button onClick={async () => {
                     if (!newPasswordValue || newPasswordValue.length < 6) return alert('Password must be at least 6 characters.');
                     
                     try {
                         const session = (await supabase.auth.getSession()).data.session;
                         const token = session?.access_token;
                         const response = await fetch('/api/admin/users/update', {
                            method: 'POST',
                            headers: {
                               'Content-Type': 'application/json',
                               'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                               userId: passwordTargetUser.uid,
                               password: newPasswordValue
                            })
                         });
                         const resData = await response.json();
                         if (!response.ok) throw new Error(resData.error || 'Failed to update password');
                         
                         alert(`Success! Password for ${passwordTargetUser.email} has been forcibly changed to: ${newPasswordValue}`);
                         setShowPasswordModal(false);
                      } catch(err: any) {
                         alert(`Error: ${err.message}`);
                      }
                  }} className="px-8 py-2.5 bg-red-600 text-white font-extrabold rounded-xl hover:bg-red-700 shadow-sm transition-all">Update Password</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Grant Content Modal */}
        {showGrantModal && grantTargetUser && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div {...scaleIn}
              className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                  <span className="p-2 bg-brand-100 text-brand-600 rounded-lg">
                    <BookMarked className="w-5 h-5" />
                  </span>
                  Manual Content Grant
                </h3>
                <button onClick={() => setShowGrantModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto overscroll-contain custom-scrollbar flex-1" data-lenis-prevent>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-1">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Target Account</p>
                   <p className="font-extrabold text-slate-900 text-lg truncate" title={grantTargetUser.email}>{grantTargetUser.email}</p>
                   {grantTargetUser.displayName && <p className="text-sm font-medium text-slate-600">{grantTargetUser.displayName}</p>}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Select Exam *</label>
                  <select 
                    value={grantSelectedExamId} 
                    onChange={e => {
                        setGrantSelectedExamId(e.target.value);
                        setGrantSelectedContentId("");
                    }} 
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 font-bold text-sm bg-white shadow-inner"
                  >
                    <option value="">-- Choose Exam --</option>
                    {actualExams.map(ex => <option key={ex.id} value={ex.id as string}>{ex.name}</option>)}
                  </select>
                </div>
                
                {grantSelectedExamId && (
                    <div className="space-y-3">
                      <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Select Category *</label>
                      <select 
                        value={grantSelectedCategory} 
                        onChange={e => {
                            setGrantSelectedCategory(e.target.value);
                            setGrantSelectedContentId("");
                        }} 
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 font-bold text-sm bg-white shadow-inner"
                      >
                        <option value="bundle">Full Exam Bundle (All Content)</option>
                        <option value="mock">Mock Tests</option>
                        <option value="bank">Question Banks</option>
                        <option value="series">Custom Test Series</option>
                      </select>
                    </div>
                )}
                
                {grantSelectedExamId && grantSelectedCategory !== 'bundle' && (
                    <div className="space-y-3">
                      <label className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">Select Specific Content *</label>
                      <select 
                        value={grantSelectedContentId} 
                        onChange={e => setGrantSelectedContentId(e.target.value)} 
                        className="w-full px-4 py-3.5 rounded-xl border-2 border-slate-200 outline-none focus:border-brand-500 font-bold text-sm bg-white shadow-inner"
                      >
                        <option value="">-- Choose Specific Content --</option>
                        {grantSelectedCategory === 'mock' && mockTests.filter(m => {
                            if (m.examId !== grantSelectedExamId) return false;
                            try { if (m.seriesId) return JSON.parse(m.seriesId).isPremium === true; } catch(e){}
                            return false;
                        }).map(m => (
                            <option key={m.id} value={m.id}>{m.title}</option>
                        ))}
                        {grantSelectedCategory === 'bank' && banks.filter(b => b.examId === grantSelectedExamId && b.isPremium === true).map(b => (
                            <option key={b.id} value={b.id}>{b.title}</option>
                        ))}
                        {grantSelectedCategory === 'series' && series.filter(s => s.examId === grantSelectedExamId).map(s => (
                            <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setShowGrantModal(false)} className="w-1/3 py-3 rounded-xl border border-slate-200 font-extrabold text-slate-600 hover:bg-slate-100 transition-all">Cancel</button>
                  <button 
                    disabled={!grantSelectedExamId || (grantSelectedCategory !== 'bundle' && !grantSelectedContentId)}
                    onClick={async () => {
                        const contentIdToGrant = grantSelectedCategory === 'bundle' ? `exam_bundle_${grantSelectedExamId}` : grantSelectedContentId;
                        const examName = actualExams.find(ex => ex.id === grantSelectedExamId)?.name || "Exam";
                        const targetContentTitle = grantSelectedCategory === 'bundle' 
                            ? `Full Access Bundle: ${examName}` 
                            : (series.find(s => s.id === contentIdToGrant)?.title || mockTests.find(m => m.id === contentIdToGrant)?.title || banks.find(b => b.id === contentIdToGrant)?.title || "Selected Content");
                            
                        const confirmMsg = `Are you sure you want to permanently unlock "${targetContentTitle}" for ${grantTargetUser.email}?`;
                        if (!confirm(confirmMsg)) return;

                        const currentPurchased = grantTargetUser.purchasedSeries || [];
                        if (currentPurchased.includes(contentIdToGrant)) {
                           alert('This user already has access to this content.');
                           return;
                        }

                        const newPurchased = [...currentPurchased, contentIdToGrant];
                        try {
                           const session = (await supabase.auth.getSession()).data.session;
                           const token = session?.access_token;
                           const response = await fetch('/api/admin/users/update', {
                              method: 'POST',
                              headers: {
                                 'Content-Type': 'application/json',
                                 'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                 userId: grantTargetUser.uid,
                                 updates: { purchasedSeries: newPurchased }
                              })
                           });
                           const resData = await response.json();
                           if (!response.ok) throw new Error(resData.error || 'Failed to grant access');
                           alert('Access granted successfully.');
                           setShowGrantModal(false);
                           fetchData();
                        } catch (err: any) {
                           alert(`Failed to grant access: ${err.message}`);
                        }
                    }} 
                    className="flex-1 bg-brand-600 text-white font-extrabold rounded-xl py-3 hover:bg-brand-700 disabled:opacity-50 shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98]"
                  >
                    Grant Access
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Question Bank Questions & Answer Key Live Preview Modal */}
      <AnimatePresence>
        {showBankPreviewModal && (
          <div className="fixed inset-0 bg-slate-950/70 z-[80] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md overflow-hidden" data-lenis-prevent>
            <motion.div {...modalContent}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-100 relative"
            >
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/50 shadow-sm shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-slate-900">
                      Question Bank Parsed Preview
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Verify questions, answer keys, and explanations before saving
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowBankPreviewModal(false)}
                  className="p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-all border border-slate-200/50 bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-4">
                {(() => {
                  const previewQs = mergeQuestionsAndAnswerKey(bankQuestionsJson, bankAnswerKeyJson);
                  if (previewQs.length === 0) {
                    return (
                      <div className="py-16 text-center text-slate-400">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-bold">No valid questions parsed yet. Please check your JSON format.</p>
                      </div>
                    );
                  }

                  return previewQs.map((q: any, idx: number) => {
                    const ansIdx = q.correctAnswerIndex;
                    const hasKey = ansIdx !== undefined;

                    return (
                      <div key={idx} className="p-5 rounded-2xl bg-slate-50/60 border border-slate-200/80 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-200/80 text-slate-700 text-xs font-black shrink-0 mt-0.5">
                            Q.{idx + 1}
                          </span>
                          <div className="text-sm font-bold text-slate-800 flex-1 leading-relaxed">
                            <MathTextRenderer text={q.questionText || q.question || ''} />
                          </div>
                        </div>

                        {Array.isArray(q.options) && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                            {q.options.map((opt: string, oIdx: number) => {
                              const isCorrect = hasKey && ansIdx === oIdx;
                              const optLetter = ['A', 'B', 'C', 'D', 'E'][oIdx] || `(${oIdx + 1})`;
                              return (
                                <div
                                  key={oIdx}
                                  className={cn(
                                    "flex items-start gap-2 p-2.5 rounded-xl border text-xs leading-snug",
                                    isCorrect 
                                      ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold shadow-2xs" 
                                      : "bg-white border-slate-200 text-slate-700"
                                  )}
                                >
                                  <span className={cn(
                                    "w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 border",
                                    isCorrect ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-100 text-slate-500 border-slate-200"
                                  )}>
                                    {optLetter}
                                  </span>
                                  <div className="flex-1 pt-0.5">
                                    <MathTextRenderer text={opt} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div className="pl-9 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md font-bold text-[11px]",
                            hasKey ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            {hasKey ? `Keyed: Option (${['A','B','C','D','E'][ansIdx] || ansIdx + 1})` : 'Un-keyed (Practice Mode)'}
                          </span>

                          {q.explanation && (
                            <span className="text-slate-500 font-medium italic">
                              💡 Solution included
                            </span>
                          )}
                        </div>

                        {q.explanation && (
                          <div className="ml-9 p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-slate-700 leading-relaxed">
                            <span className="font-bold text-emerald-800 uppercase text-[10px] tracking-wider block mb-1">Explanation:</span>
                            <MathTextRenderer text={q.explanation} />
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              <div className="px-8 py-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setShowBankPreviewModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-brand-600 text-white font-black text-xs hover:bg-brand-700 transition-all shadow-md shadow-brand-500/20"
                >
                  Close Preview
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
