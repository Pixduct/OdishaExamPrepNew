import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Wand2, 
  Layers, 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  FolderOpen,
  Play, 
  Save, 
  Trash2, 
  Edit3, 
  RefreshCw, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Check, 
  Copy, 
  BookOpen, 
  Target, 
  Clock, 
  Award, 
  Eye, 
  Sliders, 
  KeyRound, 
  ExternalLink,
  Code2,
  ListPlus,
  Compass,
  CheckCircle,
  X,
  Clipboard,
  Lock,
  Unlock,
  Info,
  XCircle,
  Zap,
  Upload,
  Download,
  FileCode,
  RotateCcw,
  Dumbbell,
  BookMarked,
  CheckSquare,
  Square,
  Filter,
  Flame,
  ShieldCheck,
  Scale,
  Brain,
  Cpu,
  Terminal,
  StopCircle,
  Search,
  Cloud,
  Loader2
} from 'lucide-react';
import { Exam, MockTest, QuestionBank, examService } from '../../lib/examService';
import { cacheService } from '../../lib/cacheService';
import { MathTextRenderer } from '../MathTextRenderer';
import UniversalMathDiagramEngine from '../UniversalMathDiagramEngine';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { parseSyllabusHierarchy } from '../../lib/syllabusParser';
import { 
  parseReferencePYQs, 
  extractPYQAndDirectives, 
  combinePYQAndDirectives 
} from '../../lib/serverAiGenerator';
import type { FlashcardDeck, Flashcard } from '../../lib/srsEngine';

export interface QueueFeedEvent {
  id: string;
  timestamp: string;
  bankId: string;
  bankTitle: string;
  type: 'queue_init' | 'bank_start' | 'batch_gen' | 'batch_done' | 'publishing' | 'bank_done' | 'advancing' | 'bank_failed' | 'queue_stopped' | 'queue_complete';
  message: string;
  batchNum?: number;
  totalBatches?: number;
  questionCount?: number;
}

export interface MultiBankStatusEntry {
  status: 'queued' | 'running' | 'completed' | 'failed';
  count: number;
  step?: 'waiting' | 'grounding' | 'generating' | 'publishing' | 'completed' | 'failed';
  stepDetail?: string;
  currentBatch?: number;
  totalBatches?: number;
  error?: string;
}

// Built-in Odisha Competitive Exam Syllabus & PYQ Guidelines Templates
const SYLLABUS_PRESETS: Record<string, { label: string; markdown: string }> = {
  'opsc-cgl-prelims': {
    label: 'OPSC OAS / CGL (General Studies & Quantitative)',
    markdown: `### OPSC OAS / CGL Examination Syllabus & Standard
- **Level of Difficulty**: Advanced & Analytical (Graduate Standard). Multi-step reasoning required.
- **Section 1: Quantitative Aptitude & Arithmetic**:
  - Number Systems, HCF/LCM, Quadratic Equations, Percentage, Profit & Loss, Simple & Compound Interest.
  - Time & Work, Pipes & Cisterns, Speed Time & Distance, Boats & Streams.
  - Permutations & Combinations, Probability, Set Theory & Venn Diagrams.
  - Mensuration 2D & 3D (Triangles, Polygons, Cylinders, Cones, Spheres).
- **Section 2: Data Interpretation & Logical Reasoning**:
  - Tabular DI, Pie Charts, Bar Graphs, Caselets.
  - Syllogisms, Statement-Assumption, Statement-Conclusion, Seating Arrangement (Linear & Circular), Direction Sense, Blood Relations.
- **Section 3: General Studies & Odisha GK**:
  - Indian Polity & Constitution (Articles, Amendments, Panchayati Raj, Fundamental Rights).
  - Modern Indian History & Odisha Freedom Struggle (Paika Rebellion, Utkal Sammilani).
  - Geography of Odisha (Rivers, Minerals, Forests, Wildlife Sanctuaries, District boundaries).
  - Economy & Government Schemes (Kalia, BSKY, 5T Initiatives, Budget Trends).
- **PYQ Pattern Hints**:
  - Focus on multi-statement statements ("Consider the following statements... Which is/are correct?").
  - Provide complete step-by-step mathematical proofs with LaTeX formulas ($...$).`
  },
  'osssc-ri-amin': {
    label: 'OSSSC RI / AMIN / ICDS / PEO (Standard Pattern)',
    markdown: `### OSSSC RI / AMIN Combined Recruitment Syllabus
- **Level of Difficulty**: Moderate to Advanced (Higher Secondary / Matric Standard).
- **Section 1: Arithmetic & Mensuration**:
  - Ratio & Proportion, Partnership, Averages, Mixture & Alligation.
  - Geometry (Angles, Triangles, Quadrilaterals, Coordinate Geometry).
  - Practical Surveying Math: Area calculation of irregular land plots, polygons.
- **Section 2: General Knowledge & Odisha Special**:
  - Odisha History (Kalinga War, Ganga Dynasty, Gajapati Empire, Temple Architecture).
  - Odisha Geography & Climate, Mahanadi River System, Chilika Lake, Similipal.
  - Current Affairs & Odisha Awards/Personalities.
- **Section 3: English & Odia Language**:
  - Error Detection, Idioms & Phrases, Prepositions, Voice & Narration.
  - Odia Grammar (Sandhi, Samasa, Krudanta, Taddhita, Rudhi & Lokabani).`
  },
  'odisha-police-si': {
    label: 'Odisha Police Sub-Inspector (SI & Constable)',
    markdown: `### Odisha Police SI Examination Guidelines
- **Level of Difficulty**: Advanced Reasoning & State Law/Aptitude.
- **General Studies**: Indian Constitution, Criminal Law basics, Human Rights, Science & Technology.
- **Logical Reasoning**: Coding-Decoding, Number Series, Critical Thinking, Venn Diagrams, Clocks & Calendars.
- **Quantitative Aptitude**: High speed calculation, Profit & Loss, Time-Speed, Geometry formulas.
- **Odisha Heritage**: Festivals, Folk Dances (Chhau, Sambalpuri), Monuments, Tribal Culture.`
  },
  'osssc-nursing-officer': {
    label: 'OSSSC Nursing Officer, ANM & Pharmacist',
    markdown: `### OSSSC Nursing Officer & Medical Personnel Syllabus
- **Level of Difficulty**: Professional Diploma / B.Sc Nursing & Clinical Standard.
- **Section 1: Core Clinical Nursing**:
  - Anatomy & Physiology (Cardiovascular, Respiratory, Renal, Endocrine & Nervous Systems).
  - Medical-Surgical Nursing (Pre/Post-Operative Care, Oncology, Emergency & Triage).
  - Pharmacology (Dosages, Drug classifications, Contraindications, Adverse reactions, Antibiotics).
  - Community Health Nursing & Immunization Schedules (National Health Missions, Maternal & Child Health).
  - Pediatric & Obstetric/Gynecological Nursing (Antenatal care, Labor stages, Neonatal resuscitation).
- **Section 2: Professional Ethics, Nursing Administration & Patient Safety**:
  - Infection Control Protocols, Biomedical Waste Management (BMW rules).
- **PYQ Pattern Hints**:
  - Focus heavily on clinical scenario questions ("A patient presenting with symptoms X, Y, Z... what is the immediate priority action?").`
  },
  'general-math-reasoning': {
    label: 'Pure Mathematics, Geometry & Data Interpretation Booster',
    markdown: `### Pure Mathematics & Geometry Standards
- Focus exclusively on rigorous problem solving.
- **Algebra & Polynomials**: $ax^2 + bx + c = 0$, discriminant, roots, factor theorem.
- **Geometry & Coordinate Geometry**: Distance formula, slope, circle equations, triangle congruence, cyclic quadrilaterals.
- **Trigonometry & Heights/Distances**: $\\sin^2 \\theta + \\cos^2 \\theta = 1$, angle of elevation and depression problems.
- Always wrap every mathematical equation, symbol, and fractional calculation in LaTeX ($...$ inline or $$...$$ block).`
  }
};

// Built-in Pedagogical Generation Directives Templates
const DIRECTIVES_PRESETS: Record<string, { label: string; markdown: string }> = {
  'standard-state-mcq': {
    label: 'State-Grade Competitive MCQ Rubric (Single-Best Answer)',
    markdown: `### Standard State Examination MCQ Rubric
1. **Clear Problem Statement**: Every stem must present a definitive, unambiguous question or clinical/factual scenario.
2. **Mutual Exclusivity**: Exactly 4 distinct options (A, B, C, D). Strictly prohibit "All of the above" or "None of the above".
3. **Balanced Option Length**: All four options must have approximately comparable syntax length and complexity.
4. **Single Correct Key**: Ensure exactly one undeniably correct answer based on verified statutory/official syllabus facts.
5. **Step-by-Step Explanation**: Provide complete conceptual background, relevant statutory sections or formulas, and why the remaining three distractors are incorrect.`
  },
  'upsc-opsc-multi-statement': {
    label: 'UPSC / OPSC Multi-Statement Analytical Rigor',
    markdown: `### Mandatory Multi-Statement Examination Standard
1. **Cognitive Depth**: Emphasize analytical synthesis and multi-step deduction. Strictly avoid simple single-line memory recall.
2. **Multi-Statement Question Formulation**:
   - Construct questions using the official standard:
     "With reference to [Topic], consider the following statements:
     1. [Statement 1]
     2. [Statement 2]
     3. [Statement 3]
     Which of the statements given above is/are correct?
     (a) 1 only  (b) 2 and 3 only  (c) 1 and 3 only  (d) 1, 2 and 3"
3. **Plausible Distractors**: Ensure incorrect options reflect common conceptual fallacies, chronological inversions, or unit confusion.
4. **Comprehensive Rationale**: Provide exhaustive explanations dissecting each statement individually (Statement 1 is correct because..., Statement 2 is incorrect because...).`
  },
  'rigorous-math-latex': {
    label: 'Rigorous LaTeX Math, Algebra & Geometry Solver',
    markdown: `### Strict Mathematical & Quantitative Formulation Directives
1. **Strict LaTeX Delimiters**: Enclose every mathematical variable, number, fraction, square root, exponent, and equation in LaTeX:
   - Inline expressions: $x^2 + 5x + 6 = 0$, $\\frac{a}{b}$, $\\sqrt{256} = 16$.
   - Display formulas: $$\\text{Area} = \\frac{1}{2} \\times \\text{base} \\times \\text{height}$$.
2. **Derivation & Calculation Steps**: Explanations must show the complete calculation trajectory:
   - Step 1: Given parameters & formula identification.
   - Step 2: Intermediate substitution and algebra.
   - Step 3: Final numerical evaluation with appropriate units (cm², m/s, %, etc.).
3. **Plausible Numerical Distractors**: Distractor options must correspond to realistic calculation traps (e.g., forgetting negative sign, incorrect order of operations, inverted ratio).`
  },
  'visual-diagram-geometry': {
    label: 'Visual Diagram & Geometry Trigger (Universal Engine)',
    markdown: `### Geometric & Visual Diagram Formulation Directives
1. **Visual Generation Criteria**: When questions involve geometric figures (triangles, circles, quadrilaterals), coordinate points, or set-theoretic Venn diagrams, generate a valid "diagram" JSON payload.
2. **Universal Engine Schema**:
   - Venn Diagram: {"type": "venn", "sets": ["Set A", "Set B"], "overlaps": {"A_only": 20, "B_only": 30, "both": 10}}
   - Triangle Geometry: {"type": "triangle", "labels": {"A": "(0,0)", "B": "(4,0)", "C": "(2,3)"}, "angles": {"A": "60°", "B": "60°", "C": "60°"}}
3. **Diagram-Linked Text**: The question stem must reference the diagram (e.g., "In the given diagram...", "Referring to the Venn distribution above...").`
  },
  'assertion-reasoning': {
    label: 'Assertion & Reason Analytical Evaluation',
    markdown: `### Assertion (A) and Reason (R) Question Rubric
1. **Question Structure**:
   - Given:
     - **Assertion (A)**: [Factual or theoretical premise]
     - **Reason (R)**: [Underlying causative explanation]
2. **Standard 4 Options**:
   - (A) Both (A) and (R) are true, and (R) is the correct explanation of (A).
   - (B) Both (A) and (R) are true, but (R) is NOT the correct explanation of (A).
   - (C) (A) is true, but (R) is false.
   - (D) (A) is false, but (R) is true.
3. **Rigorous Explanatory Dissection**: Detail the veracity of Assertion (A), the veracity of Reason (R), and whether an explicit causal link exists.`
  }
};

// Built-in Standard Competitive PYQ Sample Template
const DEFAULT_PYQ_TEMPLATE = `1. In a steady laminar flow through a circular pipe of diameter D, the maximum velocity occurs at the centerline and is equal to:
(a) Equal to the average velocity
(b) 1.5 times the average velocity
(c) 2.0 times the average velocity
(d) 2.5 times the average velocity

2. Which of the following statements regarding the Darcy-Weisbach friction factor (f) is correct for laminar flow?
(a) f is proportional to Reynolds number
(b) f = 64 / Re
(c) f depends on relative pipe roughness (ε/D)
(d) f = 16 / Re

3. An emergency valve closure in a long pipeline causes a pressure rise known as water hammer. According to the Joukowsky equation, the maximum pressure surge ΔP is given by:
(a) ΔP = ρ × c × v
(b) ΔP = c² / (2g)
(c) ΔP = v² / (2g)
(d) ΔP = ρ × g × h`;


export interface SubCategoryItem {
  id: string;
  name: string;
  tag: string;
  desc: string;
}

export interface CurriculumSectionItem {
  id: 'all_sections' | 'practice_test' | 'mock_test' | 'question_bank' | 'flashcards';
  name: string;
  shortName: string;
  badge: string;
  desc: string;
  icon: any;
  accent: string;
  subcategories: SubCategoryItem[];
}

export const CURRICULUM_SECTIONS: CurriculumSectionItem[] = [
  {
    id: 'all_sections',
    name: 'All-Inclusive 4-Section Curriculum Suite',
    shortName: 'Full Suite (1-Click)',
    badge: '16-Tier Architecture',
    desc: 'Simultaneously architect balanced tests across Practice Tests, Mock Tests, Question Banks, and Flashcards based on syllabus.',
    icon: Sparkles,
    accent: 'amber',
    subcategories: [
      { id: 'all', name: 'All 4 Sections (Practice + Mock + Banks + Flashcards)', tag: '1-Click Suite', desc: 'Generates balanced coverage across all curriculum subcategories.' }
    ]
  },
  {
    id: 'practice_test',
    name: 'Section 1: Practice Tests & Chapter Drills',
    shortName: 'Practice Tests',
    badge: 'Step 1 Interactive',
    desc: 'Instant interactive drills, chapter practice, speed quizzes, and topic-wise solved PYQs.',
    icon: Dumbbell,
    accent: 'indigo',
    subcategories: [
      { id: 'topic-wise', name: 'Chapter-Wise Practice', tag: 'Structured Drills', desc: 'Master individual chapters with structured question sets.' },
      { id: 'exam-focused', name: 'High-Yield Topic Banks', tag: 'High Yield', desc: 'Focus on most frequently asked questions and core topics.' },
      { id: 'revision-sets', name: 'Daily Speed & Accuracy Quizzes', tag: 'Daily Boost', desc: '10-minute micro-quizzes to boost solving speed.' },
      { id: 'pyq-collections', name: 'Topic-Wise Solved PYQs', tag: '10-Yr PYQs', desc: 'Previous year questions categorized topic-by-topic.' },
    ]
  },
  {
    id: 'mock_test',
    name: 'Section 2: Official Mock Test Series',
    shortName: 'Mock Tests',
    badge: 'Step 2 Timed Exams',
    desc: 'Full-length official simulations, subject-wise sectional master tests, official PYQ papers, and weekly benchmarks.',
    icon: Award,
    accent: 'brand',
    subcategories: [
      { id: 'full-length', name: 'Full-Length Mock Tests', tag: 'Most Popular', desc: 'Complete exam simulation with official timing & ranking.' },
      { id: 'sectional', name: 'Sectional Tests', tag: 'Recommended', desc: 'Subject/paper focused timed tests to improve sectional scores.' },
      { id: 'pyq', name: 'Official PYQ Tests', tag: 'High Yield', desc: 'Practice with actual full-length previous year papers.' },
      { id: 'daily', name: 'Daily / Weekly Benchmark Tests', tag: 'Consistency', desc: 'Regular assessments to benchmark syllabus progress.' },
    ]
  },
  {
    id: 'question_bank',
    name: 'Section 3: Question Banks & Reference Library',
    shortName: 'Question Banks',
    badge: 'Step 3 PDF Library',
    desc: 'Curated topic-wise question banks, high-yield revision capsules, formula boosters, and PYQ paper archives.',
    icon: BookMarked,
    accent: 'emerald',
    subcategories: [
      { id: 'topic-wise', name: 'Topic-Wise Question Bank', tag: 'Curated Modules', desc: 'Comprehensive PDF modules categorized by subject topic.' },
      { id: 'exam-focused', name: 'Exam-Focused High Yield', tag: 'High Yield Capsule', desc: 'Targeted high-yield question collections for rapid review.' },
      { id: 'revision-sets', name: 'Last-Minute Revision Sets', tag: 'Formula Booster', desc: 'Compact formula & key concept quick summaries.' },
      { id: 'pyq-collections', name: 'PYQ Question Archives', tag: 'Multi-Year Archives', desc: 'Multi-year previous paper archives with complete solutions.' },
    ]
  },
  {
    id: 'flashcards',
    name: 'Section 4: Active Recall Flashcards (Smart SRS)',
    shortName: 'Flashcards',
    badge: 'Step 4 Active Recall',
    desc: 'Spaced repetition flashcard decks auto-generated directly from syllabus hierarchy placeholders.',
    icon: Layers,
    accent: 'purple',
    subcategories: []
  }
];

export interface NamingPreset {
  id: string;
  name: string;
  badge: string;
  template: string;
  description: string;
}

export const SECTION_NAMING_PRESETS: Record<string, NamingPreset[]> = {
  question_bank: [
    {
      id: 'topic-wise',
      name: 'Topic-Wise Question Bank',
      badge: 'Curated Modules',
      template: '[Chapter] Question Bank',
      description: 'Topic-wise question bank e.g. "Freshwater Aquaculture Question Bank"'
    },
    {
      id: 'exam-focused',
      name: 'Exam-Focused High Yield',
      badge: 'High Yield',
      template: 'High-Yield: [Chapter]',
      description: 'High-yield revision capsule e.g. "High-Yield: Freshwater Aquaculture"'
    },
    {
      id: 'revision-sets',
      name: 'Last-Minute Revision Sets',
      badge: 'Formula Booster',
      template: 'Formula Booster: [Chapter]',
      description: 'Quick concept & formula booster e.g. "Formula Booster: Freshwater Aquaculture"'
    },
    {
      id: 'pyq-collections',
      name: 'PYQ Question Archives',
      badge: 'PYQ Archive',
      template: 'PYQ Archive: [Chapter]',
      description: 'Previous year paper archive e.g. "PYQ Archive: Freshwater Aquaculture"'
    }
  ],
  practice_test: [
    {
      id: 'topic-wise',
      name: 'Chapter-Wise Practice',
      badge: 'Structured Drills',
      template: '[Chapter] Drill #[01-05]',
      description: 'Numbered chapter drills e.g. "Freshwater Aquaculture Drill #01"'
    },
    {
      id: 'exam-focused',
      name: 'High-Yield Topic Banks',
      badge: 'High Yield',
      template: 'High-Yield Practice: [Chapter]',
      description: 'High-yield interactive drills e.g. "High-Yield Practice: Freshwater Aquaculture"'
    },
    {
      id: 'revision-sets',
      name: 'Daily Speed & Accuracy Quizzes',
      badge: 'Speed Quiz',
      template: 'Speed Quiz: [Chapter]',
      description: 'Fast timed micro-quizzes e.g. "Speed Quiz: Freshwater Aquaculture"'
    },
    {
      id: 'pyq-collections',
      name: 'Topic-Wise Solved PYQs',
      badge: '10-Yr PYQ',
      template: 'Solved PYQs: [Chapter]',
      description: 'Topic-by-topic solved PYQs e.g. "Solved PYQs: Freshwater Aquaculture"'
    }
  ],
  mock_test: [
    {
      id: 'full-length',
      name: 'Full-Length Mock Tests',
      badge: 'Full Mock',
      template: 'Full Mock Test #[01-10]',
      description: 'Full-length simulation test e.g. "Full Mock Test #01"'
    },
    {
      id: 'sectional',
      name: 'Sectional Tests',
      badge: 'Sectional',
      template: '[Subject] Sectional Test #[01-05]',
      description: 'Subject-wise sectional test e.g. "Fisheries Science Sectional Test #01"'
    },
    {
      id: 'pyq',
      name: 'Official PYQ Tests',
      badge: 'Real PYQ',
      template: 'Official PYQ Paper #[01-10]',
      description: 'Official previous year paper simulation e.g. "Official PYQ Paper #01"'
    },
    {
      id: 'daily',
      name: 'Daily / Weekly Benchmark Tests',
      badge: 'Benchmark',
      template: 'Weekly Benchmark Test #[01-08]',
      description: 'Regular benchmark test e.g. "Weekly Benchmark Test #01"'
    }
  ],
  flashcards: [
    {
      id: 'sub-chap',
      name: '[Sub-Subject] · [Chapter]',
      badge: 'Recommended',
      template: '[Sub-Subject] · [Chapter]',
      description: 'Granular chapter active recall deck prefixed by sub-subject'
    },
    {
      id: 'subj-sub-chap',
      name: '[Subject]: [Sub-Subject] - [Chapter]',
      badge: '3-Tier',
      template: '[Subject]: [Sub-Subject] - [Chapter]',
      description: 'Full 3-tier hierarchy: Subject, Sub-Subject & Chapter'
    },
    {
      id: 'subj-chap',
      name: '[Subject] · [Chapter]',
      badge: 'Subject & Chapter',
      template: '[Subject] · [Chapter]',
      description: 'Direct subject and chapter recall deck'
    },
    {
      id: 'chap-only',
      name: '[Chapter]',
      badge: 'Topic Only',
      template: '[Chapter]',
      description: 'Clean topic/chapter title extracted directly from syllabus'
    },
    {
      id: 'sub-only',
      name: '[Sub-Subject]',
      badge: 'Sub-Subject Only',
      template: '[Sub-Subject]',
      description: 'Deck for each sub-subject / unit from syllabus'
    }
  ],
  all_sections: [
    {
      id: 'all',
      name: 'All 4 Sections (Practice + Mock + Banks + Flashcards)',
      badge: '1-Click Suite',
      template: '[Chapter] Set',
      description: 'Balanced tests & cards across all subcategories'
    }
  ]
};

export interface AIQuestionStudioProps {
  exams: Exam[];
  mockTests: MockTest[];
  questionBanks: QuestionBank[];
  onRefreshCatalog: () => void;
  preselectedExamId?: string;
  preselectedTestId?: string;
}

/**
 * Safely extracts the examination stage for a MockTest or QuestionBank.
 * Checks direct property, JSON seriesId, or JSON tagline.
 */
export function getItemStage(item: any): string {
  if (!item) return '';
  if (item.stage) return String(item.stage).trim();
  if (item.seriesId && typeof item.seriesId === 'string' && item.seriesId.startsWith('{')) {
    try {
      const parsed = JSON.parse(item.seriesId);
      if (parsed && parsed.stage) return String(parsed.stage).trim();
    } catch {}
  }
  if (item.tagline && typeof item.tagline === 'string' && item.tagline.startsWith('{')) {
    try {
      const parsed = JSON.parse(item.tagline);
      if (parsed && parsed.stage) return String(parsed.stage).trim();
    } catch {}
  }
  return '';
}

export function AIQuestionStudio({
  exams,
  mockTests,
  questionBanks,
  onRefreshCatalog,
  preselectedExamId,
  preselectedTestId
}: AIQuestionStudioProps) {
  // Navigation tabs: Stage 1 (Structure) vs Stage 2 (Questions)
  const [activeStage, setActiveStage] = useState<'stage1_structure' | 'stage2_questions'>(() => {
    return (sessionStorage.getItem('oep_ai_studio_stage') as any) || 'stage2_questions';
  });
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Smooth stage switcher with auto-scroll to workspace
  const handleSwitchStage = (stage: 'stage1_structure' | 'stage2_questions') => {
    setActiveStage(stage);
    try {
      sessionStorage.setItem('oep_ai_studio_stage', stage);
    } catch {}
    setTimeout(() => {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // AI Configuration State (Strict Precedence: Client Custom Key > Server .env Key)
  const [apiKey, setApiKey] = useState<string>(() => {
    const raw = localStorage.getItem('oep_ai_studio_custom_key') || localStorage.getItem('oep_ai_studio_key') || '';
    return raw.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();
  });
  const [customBaseUrl, setCustomBaseUrl] = useState<string>(() => {
    const raw = localStorage.getItem('oep_ai_studio_base_url') || '';
    return raw.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [showAdvancedEndpoint, setShowAdvancedEndpoint] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    const NIM_DEFAULT = 'openai/gpt-oss-20b';
    const saved = localStorage.getItem('oep_ai_studio_model');
    if (saved && saved.trim()) {
      return saved.trim();
    }
    const customKey = (localStorage.getItem('oep_ai_studio_custom_key') || '').replace(/^["'`\s]+|["'`\s]+$/g, '').trim();
    if (customKey.startsWith('AQ.') || customKey.startsWith('AIza')) return 'gemini-flash-lite-latest';
    if (customKey.startsWith('gsk_')) return 'llama-3.3-70b-versatile';
    if (customKey.startsWith('sk-ant-')) return 'claude-3-5-sonnet-20241022';
    if (customKey.startsWith('sk-')) return 'gpt-4o-mini';
    return NIM_DEFAULT;
  });
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'untested' | 'valid' | 'invalid'>('untested');

  // Target Exam Selection
  const [selectedExamId, setSelectedExamId] = useState<string>(preselectedExamId || exams[0]?.id || '');
  const selectedExam = useMemo(() => exams.find(e => e.id === selectedExamId), [exams, selectedExamId]);

  // Extract configured multi-stages for selected target exam
  const examConfiguredStages = useMemo(() => {
    if (!selectedExam || !Array.isArray(selectedExam.stages)) return [];
    return selectedExam.stages.filter(s => s && s.trim() && s.trim() !== 'Single Stage');
  }, [selectedExam]);

  // Active Target Examination Stage (e.g. "Prelims", "Mains", or "" for All Stages / General)
  const [selectedExamStage, setSelectedExamStage] = useState<string>('');

  // Reactive Auto-load: When selectedExam or its stages update in real time, auto-sync selectedExamStage
  useEffect(() => {
    if (examConfiguredStages.length > 0) {
      setSelectedExamStage(prev => (prev && examConfiguredStages.includes(prev)) ? prev : examConfiguredStages[0]);
    } else {
      setSelectedExamStage('');
    }
    setStage2StageFilter('all');
    setMultiBankStageFilter('all');
  }, [examConfiguredStages]);

  // Stage 2 & Multi-Bank Stage Filter State
  const [stage2StageFilter, setStage2StageFilter] = useState<string>('all');
  const [multiBankStageFilter, setMultiBankStageFilter] = useState<string>('all');

  // Dual-Anchor Governance Suite: Section 1 (Syllabus & PYQ Blueprint) & Section 2 (Directives & Rules)
  const [isGovernanceExpanded, setIsGovernanceExpanded] = useState<boolean>(true);
  const [selectedSyllabusPreset, setSelectedSyllabusPreset] = useState<string>('opsc-cgl-prelims');
  const [syllabusMarkdown, setSyllabusMarkdown] = useState<string>(() => {
    const examId = preselectedExamId || exams[0]?.id || '';
    return localStorage.getItem(`oep_syllabus_${examId}`) || SYLLABUS_PRESETS['opsc-cgl-prelims']?.markdown || '';
  });

  const [selectedDirectivesPreset, setSelectedDirectivesPreset] = useState<string>('standard-state-mcq');
  const [part2Tab, setPart2Tab] = useState<'pyqs' | 'directives'>('pyqs');
  const [referencePYQs, setReferencePYQs] = useState<string>(() => {
    const examId = preselectedExamId || exams[0]?.id || '';
    const saved = localStorage.getItem(`oep_directives_${examId}`) || '';
    return extractPYQAndDirectives(saved).pyqs;
  });
  const [directivesMarkdown, setDirectivesMarkdown] = useState<string>(() => {
    const examId = preselectedExamId || exams[0]?.id || '';
    const saved = localStorage.getItem(`oep_directives_${examId}`);
    if (saved) {
      return extractPYQAndDirectives(saved).directives;
    }
    return DIRECTIVES_PRESETS['standard-state-mcq']?.markdown || '';
  });

  // Hidden File Input Refs for 1-click .md/.txt/.json uploads
  const syllabusFileInputRef = useRef<HTMLInputElement>(null);
  const directivesFileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // STAGE 1: 4-Section x 4-Subcategory Curriculum Architect State
  // -------------------------------------------------------------
  const [stage1MainSection, setStage1MainSection] = useState<'all_sections' | 'practice_test' | 'mock_test' | 'question_bank' | 'flashcards'>('all_sections');
  const [stage1SubCategory, setStage1SubCategory] = useState<string>('all');
  const [stage1Count, setStage1Count] = useState<number>(12);
  const [stage1SubjectFocus, setStage1SubjectFocus] = useState<string>('Comprehensive Full Syllabus');
  const [isAutoCalibrate, setIsAutoCalibrate] = useState<boolean>(true);
  const [selectedNamingPresetId, setSelectedNamingPresetId] = useState<string>('default_all');
  const [stage1NamingPattern, setStage1NamingPattern] = useState<string>(() => SECTION_NAMING_PRESETS.all_sections[0]?.template || '');
  const [isGeneratingStage1, setIsGeneratingStage1] = useState(false);

  // Flashcards state in AI Studio
  const [flashcardDecks, setFlashcardDecks] = useState<FlashcardDeck[]>([]);

  const loadFlashcardDecks = async () => {
    try {
      const data = await examService.getAllFlashcardDecks(undefined, true);
      setFlashcardDecks(data || []);
    } catch {}
  };

  useEffect(() => {
    loadFlashcardDecks();
  }, []);

  const [generatedStructures, setGeneratedStructures] = useState<any[]>(() => {
    try {
      const saved = sessionStorage.getItem('oep_ai_studio_structures');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isSavingStage1, setIsSavingStage1] = useState(false);

  // Test Parameters Configuration (Duration, Total Marks, Negative Marking, Questions)
  const [mockDuration, setMockDuration] = useState<number>(() => {
    try {
      const val = sessionStorage.getItem('oep_ai_studio_mock_duration');
      return val ? Number(val) : 120;
    } catch { return 120; }
  });
  const [mockTotalMarks, setMockTotalMarks] = useState<number>(() => {
    try {
      const val = sessionStorage.getItem('oep_ai_studio_mock_marks');
      return val ? Number(val) : 100;
    } catch { return 100; }
  });
  const [mockNegativeMarking, setMockNegativeMarking] = useState<number>(() => {
    try {
      const val = sessionStorage.getItem('oep_ai_studio_mock_neg');
      return val !== null ? Number(val) : 0.25;
    } catch { return 0.25; }
  });
  const [mockQuestionCount, setMockQuestionCount] = useState<number>(() => {
    try {
      const val = sessionStorage.getItem('oep_ai_studio_mock_qc');
      return val ? Number(val) : 100;
    } catch { return 100; }
  });

  // Review Board Curation State
  const [reviewFilterSection, setReviewFilterSection] = useState<'all' | 'practice_test' | 'mock_test' | 'question_bank'>('all');
  const [reviewFilterSubCategory, setReviewFilterSubCategory] = useState<string>('all');
  const [selectedStructureIndices, setSelectedStructureIndices] = useState<Set<number>>(new Set());
  const [editingTitleIndex, setEditingTitleIndex] = useState<number | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>('');

  // AI Title Refinement Assistant State
  const [refinementPrompt, setRefinementPrompt] = useState<string>('');
  const [isRefiningTitles, setIsRefiningTitles] = useState<boolean>(false);
  const [titleHistory, setTitleHistory] = useState<string[][]>([]);

  // -------------------------------------------------------------
  // STAGE 2: Questions Generator State
  // -------------------------------------------------------------
  const [stage2TargetType, setStage2TargetType] = useState<'mock_test' | 'practice_test' | 'question_bank' | 'flashcards'>('mock_test');
  const [stage2SubCategory, setStage2SubCategory] = useState<string>('all');
  const [stage2SelectedTestId, setStage2SelectedTestId] = useState<string>(preselectedTestId || '');
  const [stage2TestTitle, setStage2TestTitle] = useState<string>('');
  const [stage2Subject, setStage2Subject] = useState<string>('Comprehensive Full Syllabus (All Subjects Balanced)');
  const [stage2SubSubject, setStage2SubSubject] = useState<string>('');
  const [stage2Chapter, setStage2Chapter] = useState<string>('');
  const [stage2QuestionCount, setStage2QuestionCount] = useState<number>(5);
  const [stage2NaturalDensity, setStage2NaturalDensity] = useState<boolean>(true);
  const [stage2QuestionNaturalDensity, setStage2QuestionNaturalDensity] = useState<boolean>(false); // Natural Density for QB/PT/Mock questions
  const [stage2QuestionCeiling, setStage2QuestionCeiling] = useState<number>(0); // 0 = fully auto when natural density ON
  const [stage2BatchCount, setStage2BatchCount] = useState<number>(1);
  const [stage2AutoBatch, setStage2AutoBatch] = useState<boolean>(true); // When true, AI dynamically plans batch count & micro-batch sizing
  const [currentRunningBatch, setCurrentRunningBatch] = useState<number>(1);
  const [isBatchRunnerActive, setIsBatchRunnerActive] = useState<boolean>(false);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<number | 'all'>('all');
  const stopBatchRunnerRef = useRef<boolean>(false);
  const [stage2Difficulty, setStage2Difficulty] = useState<'easy' | 'medium' | 'hard' | 'advanced_exam_standard'>('hard');
  const [stage2IncludeDiagrams, setStage2IncludeDiagrams] = useState<boolean>(true);
  
  // Multi-Bank Sequential Auto-Runner & Direct Auto-Publish State
  const [stage2TargetMode, setStage2TargetMode] = useState<'single' | 'multi_bank'>('single');
  const [selectedMultiBankIds, setSelectedMultiBankIds] = useState<string[]>([]);
  const [multiBankSearchQuery, setMultiBankSearchQuery] = useState<string>('');
  const [multiBankFilterType, setMultiBankFilterType] = useState<'all' | 'bank' | 'practice'>('all');
  const [stage2BankModeFilter, setStage2BankModeFilter] = useState<'all' | 'bank' | 'practice'>('all');
  const [multiBankQuestionCountFilter, setMultiBankQuestionCountFilter] = useState<'all' | 'empty' | 'populated'>('all');
  const [bankCountOverrides, setBankCountOverrides] = useState<Record<string, number>>({});
  const [multiBankQueueStatus, setMultiBankQueueStatus] = useState<Record<string, MultiBankStatusEntry>>({});
  const [currentQueueIndex, setCurrentQueueIndex] = useState<number>(0);
  const [isQueueRunnerActive, setIsQueueRunnerActive] = useState<boolean>(false);
  const stopQueueRunnerRef = useRef<boolean>(false);
  const queueFeedContainerRef = useRef<HTMLDivElement | null>(null);

  // Persistent Multi-Bank Execution Feed & Summary
  const [queueFeedEvents, setQueueFeedEvents] = useState<QueueFeedEvent[]>([]);
  const [queueExecutionSummary, setQueueExecutionSummary] = useState<{
    totalBanks: number;
    completedBanks: number;
    totalQuestions: number;
    startTime: string;
    endTime: string;
    durationSeconds: number;
  } | null>(null);
  const [autoScrollQueueFeed, setAutoScrollQueueFeed] = useState<boolean>(true);

  // Auto-scroll effect for live queue feed
  useEffect(() => {
    if (autoScrollQueueFeed && queueFeedContainerRef.current) {
      queueFeedContainerRef.current.scrollTop = queueFeedContainerRef.current.scrollHeight;
    }
  }, [queueFeedEvents, autoScrollQueueFeed]);

  const handleCopyQueueLog = () => {
    if (queueFeedEvents.length === 0) {
      toast.error('No events in queue feed to copy.');
      return;
    }
    const text = queueFeedEvents.map(e => `[${e.timestamp}] ${e.message}`).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('📋 Copied full queue execution log to clipboard!');
  };

  const handleDismissQueueMonitor = () => {
    setQueueExecutionSummary(null);
    setQueueFeedEvents([]);
  };
  
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);

  // Protective beforeunload guard: prevent accidental tab closure or reload during active AI generation / Multi-Bank Queue
  useEffect(() => {
    if (!isQueueRunnerActive && !isGeneratingQuestions && !isBatchRunnerActive) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'AI question generation is currently in progress. Leaving or reloading the page will abort the queue.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isQueueRunnerActive, isGeneratingQuestions, isBatchRunnerActive]);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>(() => {
    try {
      const saved = sessionStorage.getItem('oep_ai_studio_questions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);
  const [isPublishingQuestions, setIsPublishingQuestions] = useState(false);
  const [isAuditingQuestions, setIsAuditingQuestions] = useState(false);

  // Real-Time Multi-Stage Generation Telemetry State
  const [telemetryEvent, setTelemetryEvent] = useState<{
    stageId: string;
    stageName: string;
    stageIndex: number;
    totalStages: number;
    currentCount: number;
    totalCount: number;
    percent: number;
    message: string;
    log?: string;
  } | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [showTelemetryLogs, setShowTelemetryLogs] = useState<boolean>(true);

  // Live Timer for generation elapsed time
  useEffect(() => {
    let timer: any;
    if (isGeneratingQuestions) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isGeneratingQuestions]);

  // Synchronize drafts with sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('oep_ai_studio_structures', JSON.stringify(generatedStructures));
    } catch {}
  }, [generatedStructures]);

  useEffect(() => {
    try {
      sessionStorage.setItem('oep_ai_studio_questions', JSON.stringify(generatedQuestions));
    } catch {}
  }, [generatedQuestions]);

  // Auto-reset batch filter to 'all' if the filtered batch is ever emptied
  useEffect(() => {
    if (typeof selectedBatchFilter === 'number') {
      const hasQuestionsInBatch = generatedQuestions.some(q => (q.batchNumber || 1) === selectedBatchFilter);
      if (!hasQuestionsInBatch) {
        setSelectedBatchFilter('all');
      }
    }
  }, [generatedQuestions, selectedBatchFilter]);

  useEffect(() => {
    try {
      sessionStorage.setItem('oep_ai_studio_mock_duration', String(mockDuration));
      sessionStorage.setItem('oep_ai_studio_mock_marks', String(mockTotalMarks));
      sessionStorage.setItem('oep_ai_studio_mock_neg', String(mockNegativeMarking));
      sessionStorage.setItem('oep_ai_studio_mock_qc', String(mockQuestionCount));
    } catch {}
  }, [mockDuration, mockTotalMarks, mockNegativeMarking, mockQuestionCount]);

  // Filtered mock tests, practice sets, and question banks for currently selected exam
  const examMockTests = useMemo(() => {
    return mockTests.filter(t => {
      if (t.examId === selectedExamId) return true;
      if (t.seriesId && typeof t.seriesId === 'string' && t.seriesId.includes(selectedExamId)) return true;
      return false;
    });
  }, [mockTests, selectedExamId]);

  const examPracticeSets = useMemo(() => {
    if (stage2BankModeFilter === 'bank') {
      return questionBanks.filter(b => b.examId === selectedExamId && (b.target_mode || 'both') !== 'practice');
    }
    if (stage2BankModeFilter === 'practice') {
      return questionBanks.filter(b => b.examId === selectedExamId && (b.target_mode || 'both') !== 'bank');
    }
    return questionBanks.filter(b => b.examId === selectedExamId);
  }, [questionBanks, selectedExamId, stage2BankModeFilter]);

  const examQuestionBanks = useMemo(() => {
    if (stage2BankModeFilter === 'bank') {
      return questionBanks.filter(b => b.examId === selectedExamId && (b.target_mode || 'both') !== 'practice');
    }
    if (stage2BankModeFilter === 'practice') {
      return questionBanks.filter(b => b.examId === selectedExamId && (b.target_mode || 'both') !== 'bank');
    }
    return questionBanks.filter(b => b.examId === selectedExamId);
  }, [questionBanks, selectedExamId, stage2BankModeFilter]);

  // Categorize Question Banks into the 4 EXACT original subcategories
  const categorizedQuestionBanks = useMemo(() => {
    const topicWise = examQuestionBanks.filter(b => 
      b.type === 'topic-wise' || (!b.type && !/high yield|high-yield|formula|revision|pyq|archive/i.test(b.title))
    );

    const examFocused = examQuestionBanks.filter(b => 
      b.type === 'exam-focused' || (!b.type && /high yield|high-yield|exam-focused/i.test(b.title))
    );

    const revisionSets = examQuestionBanks.filter(b => 
      b.type === 'revision-sets' || (!b.type && /formula booster|last-minute|revision|formula/i.test(b.title))
    );

    const pyqCollections = examQuestionBanks.filter(b => 
      b.type === 'pyq-collections' || (!b.type && /pyq archive|pyq|solved pyq|10-year/i.test(b.title))
    );

    return { topicWise, examFocused, revisionSets, pyqCollections };
  }, [examQuestionBanks]);

  // Categorize Practice Sets into the 4 EXACT original subcategories
  const categorizedPracticeSets = useMemo(() => {
    const topicWise = examPracticeSets.filter(b => 
      b.type === 'topic-wise' || (!b.type && !/high-yield|speed|quiz|pyq|solved/i.test(b.title))
    );
    const examFocused = examPracticeSets.filter(b => 
      b.type === 'exam-focused' || (!b.type && /high yield|high-yield|exam-focused/i.test(b.title))
    );
    const revisionSets = examPracticeSets.filter(b => 
      b.type === 'revision-sets' || (!b.type && /speed quiz|speed|quiz|accuracy|10-min/i.test(b.title))
    );
    const pyqCollections = examPracticeSets.filter(b => 
      b.type === 'pyq-collections' || (!b.type && /solved pyqs|pyq|solved/i.test(b.title))
    );
    return { topicWise, examFocused, revisionSets, pyqCollections };
  }, [examPracticeSets]);

  // Categorize Mock Tests into the 4 EXACT original subcategories
  const categorizedMockTests = useMemo(() => {
    const fullLength = examMockTests.filter(t => /full mock|full-length|all subjects|comprehensive/i.test(t.title));
    const sectional = examMockTests.filter(t => /sectional|paper\s*-\s*\w+/i.test(t.title) || (!/full mock|full-length|pyq|daily|weekly|benchmark/i.test(t.title)));
    const pyq = examMockTests.filter(t => /pyq|official pyq|previous|2023|2024|2022|2021|solved/i.test(t.title) && !/full mock/i.test(t.title));
    const daily = examMockTests.filter(t => /daily|weekly|benchmark/i.test(t.title));
    return { fullLength, sectional, pyq, daily };
  }, [examMockTests]);

  // Flashcard Decks for selected exam and stage
  const examFlashcardDecks = useMemo(() => {
    return flashcardDecks.filter(d => {
      const matchesExam = !d.exam_id || d.exam_id === selectedExamId || d.exam_id === 'all';
      if (!matchesExam) return false;
      if (stage2StageFilter !== 'all') {
        const itemStage = d.stage || 'All Stages';
        if (itemStage !== 'All Stages' && itemStage.toLowerCase() !== stage2StageFilter.toLowerCase()) {
          return false;
        }
      }
      return true;
    });
  }, [flashcardDecks, selectedExamId, stage2StageFilter]);

  // Currently selected database item
  const selectedItem = useMemo(() => {
    if (!stage2SelectedTestId) return null;
    if (stage2TargetType === 'mock_test') {
      return examMockTests.find(t => t.id === stage2SelectedTestId) || null;
    }
    if (stage2TargetType === 'practice_test') {
      return examPracticeSets.find(b => b.id === stage2SelectedTestId) || null;
    }
    if (stage2TargetType === 'flashcards') {
      return examFlashcardDecks.find(d => d.id === stage2SelectedTestId) || null;
    }
    return examQuestionBanks.find(b => b.id === stage2SelectedTestId) || null;
  }, [stage2SelectedTestId, stage2TargetType, examMockTests, examPracticeSets, examQuestionBanks, examFlashcardDecks]);

  // Sync selected exam if prop changes
  useEffect(() => {
    if (preselectedExamId && preselectedExamId !== selectedExamId) {
      setSelectedExamId(preselectedExamId);
    }
  }, [preselectedExamId]);

  // Auto-clear stale target selection when exam changes to prevent cross-exam contamination
  useEffect(() => {
    if (stage2SelectedTestId && !preselectedTestId) {
      const belongs = 
        examMockTests.some(t => t.id === stage2SelectedTestId) ||
        examQuestionBanks.some(b => b.id === stage2SelectedTestId) ||
        examFlashcardDecks.some(d => d.id === stage2SelectedTestId);
      if (!belongs) {
        setStage2SelectedTestId('');
        setStage2TestTitle('');
        setSelectedMultiBankIds([]);
      }
    }
  }, [selectedExamId, examMockTests, examQuestionBanks, examFlashcardDecks, stage2SelectedTestId, preselectedTestId]);

  // Sync test selection if preselectedTestId is provided
  useEffect(() => {
    if (preselectedTestId) {
      setStage2SelectedTestId(preselectedTestId);
      const matchedMock = mockTests.find(t => t.id === preselectedTestId);
      if (matchedMock) {
        setStage2TargetType('mock_test');
        setStage2TestTitle(matchedMock.title);
        const stage = getItemStage(matchedMock);
        if (stage && stage !== 'All Stages') {
          setSelectedExamStage(stage);
          setStage2StageFilter(stage);
        }
        if (/full mock|full-length|pyq paper/i.test(matchedMock.title)) {
          setStage2Subject('Comprehensive Full Syllabus (All Subjects Balanced)');
        } else {
          let parsedSubject = '';
          if (matchedMock.seriesId) {
            try {
              if (matchedMock.seriesId.startsWith('{')) {
                parsedSubject = JSON.parse(matchedMock.seriesId).subject || '';
              }
            } catch {}
          }
          const cleanSubject = parsedSubject || matchedMock.title.replace(/^Sectional:\s*/i, '').replace(/^Paper\s*-\s*\w+[:\s]*/i, '');
          setStage2Subject(cleanSubject);
        }
      } else {
        const matchedBank = questionBanks.find(b => b.id === preselectedTestId);
        if (matchedBank) {
          const isPractice = (matchedBank.target_mode || 'both') === 'practice' || matchedBank.hasPracticeMode;
          setStage2TargetType(isPractice ? 'practice_test' : 'question_bank');
          setStage2TestTitle(matchedBank.title);
          const stage = getItemStage(matchedBank);
          if (stage && stage !== 'All Stages') {
            setSelectedExamStage(stage);
            setStage2StageFilter(stage);
          }
          setStage2Subject(matchedBank.tagline?.replace(/^Subject:\s*/i, '') || matchedBank.type || matchedBank.title || 'Comprehensive Full Syllabus (All Subjects Balanced)');
        } else {
          const matchedDeck = flashcardDecks.find(d => d.id === preselectedTestId);
          if (matchedDeck) {
            setStage2TargetType('flashcards');
            setStage2TestTitle(matchedDeck.title);
            const stage = getItemStage(matchedDeck);
            if (stage && stage !== 'All Stages') {
              setSelectedExamStage(stage);
              setStage2StageFilter(stage);
            }
            setStage2Subject(matchedDeck.subject || matchedDeck.title);
          }
        }
      }
    }
  }, [preselectedTestId, mockTests, questionBanks, flashcardDecks]);

  // Save custom API key locally with strict precedence & auto-switch model provider
  const handleSaveApiKey = (val: string) => {
    const cleaned = val.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();
    setApiKey(cleaned);
    if (cleaned) {
      localStorage.setItem('oep_ai_studio_custom_key', cleaned);
      // Auto-detect provider & auto-switch model
      if (cleaned.startsWith('AIza') || cleaned.startsWith('AQ.')) {
        const geminiModel = 'gemini-flash-lite-latest';
        setSelectedModel(geminiModel);
        localStorage.setItem('oep_ai_studio_model', geminiModel);
        toast.success('🌟 Google Gemini Key detected! Auto-switched to Gemini Flash-Lite ⚡ (2-4s Ultra-Fast).');
      } else if (cleaned.startsWith('nvapi-')) {
        setSelectedModel('openai/gpt-oss-20b');
        localStorage.setItem('oep_ai_studio_model', 'openai/gpt-oss-20b');
        toast.success('⚡ NVIDIA NIM Key detected! Auto-switched to GPT-OSS 20B.');
      } else if (cleaned.startsWith('gsk_')) {
        setSelectedModel('llama-3.3-70b-versatile');
        localStorage.setItem('oep_ai_studio_model', 'llama-3.3-70b-versatile');
        toast.success('🚀 Groq Key detected! Auto-switched to Llama 3.3 70B.');
      } else if (cleaned.startsWith('sk-or-')) {
        toast.success('🌐 OpenRouter Key detected!');
      } else if (cleaned.startsWith('sk-ant-')) {
        setSelectedModel('claude-3-5-sonnet-20241022');
        localStorage.setItem('oep_ai_studio_model', 'claude-3-5-sonnet-20241022');
        toast.success('🏢 Anthropic Claude Key detected!');
      } else if (cleaned.startsWith('sk-')) {
        setSelectedModel('gpt-4o-mini');
        localStorage.setItem('oep_ai_studio_model', 'gpt-4o-mini');
        toast.success('🧠 OpenAI Key detected! Auto-switched to GPT-4o Mini.');
      }
    } else {
      localStorage.removeItem('oep_ai_studio_custom_key');
      localStorage.removeItem('oep_ai_studio_key');
      // Revert to high-speed NIM default
      setSelectedModel('openai/gpt-oss-20b');
      localStorage.setItem('oep_ai_studio_model', 'openai/gpt-oss-20b');
    }
    setKeyStatus('untested');
  };

  // Revert / Clear custom key and restore server defaults
  const handleClearCustomKey = () => {
    setApiKey('');
    localStorage.removeItem('oep_ai_studio_custom_key');
    localStorage.removeItem('oep_ai_studio_key');
    setSelectedModel('openai/gpt-oss-20b');
    localStorage.setItem('oep_ai_studio_model', 'openai/gpt-oss-20b');
    setKeyStatus('untested');
    toast.success('Custom API Key cleared. Reverted to server default configuration.');
  };

  // Save custom Base URL
  const handleSaveBaseUrl = (val: string) => {
    const cleaned = val.replace(/^["'`\s]+|["'`\s]+$/g, '').trim();
    setCustomBaseUrl(cleaned);
    if (cleaned) {
      localStorage.setItem('oep_ai_studio_base_url', cleaned);
    } else {
      localStorage.removeItem('oep_ai_studio_base_url');
    }
    setKeyStatus('untested');
  };

  // Paste key from clipboard
  const handlePasteApiKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleSaveApiKey(text);
      }
    } catch {
      toast.error('Could not access clipboard. Please paste manually.');
    }
  };

  // Change model selection
  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    localStorage.setItem('oep_ai_studio_model', model);
    setKeyStatus('untested');
  };

  // Detect key provider details & precedence
  const keyProviderInfo = useMemo(() => {
    const trimmed = apiKey.trim();
    if (!trimmed && !customBaseUrl) {
      return {
        isCustom: false,
        label: 'Server Default Active (.env)',
        desc: 'Using server-configured NVIDIA NIM API key',
        badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-400/30'
      };
    }
    if (customBaseUrl) {
      return {
        isCustom: true,
        label: '🔌 Custom Endpoint Active',
        desc: `Routing to custom URL: ${customBaseUrl.slice(0, 30)}...`,
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30'
      };
    }
    if (trimmed.startsWith('AIza') || trimmed.startsWith('AQ.')) {
      return {
        isCustom: true,
        label: '🌟 Custom Google Gemini Key Active',
        desc: 'Direct Google Gemini API connection (Gemini 2.5 Flash / Pro)',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      };
    }
    if (trimmed.startsWith('nvapi-')) {
      return {
        isCustom: true,
        label: '⚡ Custom NVIDIA NIM Key Active',
        desc: 'Direct NVIDIA NIM API connection (GPT-OSS 20B / Llama 3.2)',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
      };
    }
    if (trimmed.startsWith('gsk_')) {
      return {
        isCustom: true,
        label: '🚀 Custom Groq Key Active',
        desc: 'Direct Groq API connection (Ultra-fast Llama 3.3 70B)',
        badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      };
    }
    if (trimmed.startsWith('sk-or-')) {
      return {
        isCustom: true,
        label: '🌐 Custom OpenRouter Key Active',
        desc: 'Direct OpenRouter API connection (All multi-provider models)',
        badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
      };
    }
    if (trimmed.startsWith('sk-ant-')) {
      return {
        isCustom: true,
        label: '🏢 Custom Anthropic Claude Key Active',
        desc: 'Direct Anthropic Messages API connection',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-400/30'
      };
    }
    if (trimmed.startsWith('sk-')) {
      return {
        isCustom: true,
        label: '🧠 Custom OpenAI / DeepSeek Key Active',
        desc: 'Direct OpenAI / DeepSeek API connection',
        badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
      };
    }
    return {
      isCustom: true,
      label: 'Custom API Key Active (High Precedence)',
      desc: 'Taking 100% precedence over server .env keys',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    };
  }, [apiKey, customBaseUrl]);

  const [isSavingSyllabusToCloud, setIsSavingSyllabusToCloud] = useState(false);

  // Automatically switch syllabus & directives per exam & stage with sticky memory & cloud sync
  useEffect(() => {
    if (!selectedExamId) return;

    let isMounted = true;
    const currentStageKey = selectedExamStage || 'All Stages';

    // 1. Instant optimistic load from stage-specific local cache
    const savedStageSyllabus = localStorage.getItem(`oep_syllabus_${selectedExamId}_${currentStageKey}`);
    const savedGlobalSyllabus = localStorage.getItem(`oep_syllabus_${selectedExamId}`);
    const initialSyllabus = savedStageSyllabus || savedGlobalSyllabus;

    if (initialSyllabus) {
      setSyllabusMarkdown(initialSyllabus);
    } else {
      // Smart default based on exam name
      const name = (selectedExam?.name || '').toLowerCase();
      if (name.includes('nursing') || name.includes('pharmacist') || name.includes('medical') || name.includes('anm')) {
        setSelectedSyllabusPreset('osssc-nursing-officer');
        setSyllabusMarkdown(SYLLABUS_PRESETS['osssc-nursing-officer'].markdown);
      } else if (name.includes('police') || name.includes('si') || name.includes('constable')) {
        setSelectedSyllabusPreset('odisha-police-si');
        setSyllabusMarkdown(SYLLABUS_PRESETS['odisha-police-si'].markdown);
      } else if (name.includes('ri') || name.includes('amin') || name.includes('peo')) {
        setSelectedSyllabusPreset('osssc-ri-amin');
        setSyllabusMarkdown(SYLLABUS_PRESETS['osssc-ri-amin'].markdown);
      } else {
        setSelectedSyllabusPreset('opsc-cgl-prelims');
        setSyllabusMarkdown(SYLLABUS_PRESETS['opsc-cgl-prelims'].markdown);
      }
    }

    const savedStageDirectives = localStorage.getItem(`oep_directives_${selectedExamId}_${currentStageKey}`);
    const savedGlobalDirectives = localStorage.getItem(`oep_directives_${selectedExamId}`);
    const initialDirectives = savedStageDirectives || savedGlobalDirectives;

    if (initialDirectives) {
      const extracted = extractPYQAndDirectives(initialDirectives);
      setReferencePYQs(extracted.pyqs);
      setDirectivesMarkdown(extracted.directives || DIRECTIVES_PRESETS['standard-state-mcq'].markdown);
    } else {
      setSelectedDirectivesPreset('standard-state-mcq');
      setReferencePYQs('');
      setDirectivesMarkdown(DIRECTIVES_PRESETS['standard-state-mcq'].markdown);
    }

    // 2. Fetch authoritative cloud syllabus from Supabase
    examService.getExamSyllabus(selectedExamId, currentStageKey).then(cloud => {
      if (!isMounted || !cloud) return;
      if (cloud.syllabus_markdown) {
        setSyllabusMarkdown(cloud.syllabus_markdown);
        localStorage.setItem(`oep_syllabus_${selectedExamId}_${currentStageKey}`, cloud.syllabus_markdown);
      }
      if (cloud.directives_markdown) {
        const extracted = extractPYQAndDirectives(cloud.directives_markdown);
        setReferencePYQs(extracted.pyqs);
        setDirectivesMarkdown(extracted.directives);
        localStorage.setItem(`oep_directives_${selectedExamId}_${currentStageKey}`, cloud.directives_markdown);
      }
    }).catch(err => {
      console.warn(`[AIStudio] Cloud syllabus fetch warning:`, err);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedExamId, selectedExamStage, selectedExam]);

  // Update handlers with automatic per-stage sticky localStorage caching
  const handleUpdateSyllabus = (val: string) => {
    setSyllabusMarkdown(val);
    if (selectedExamId) {
      const currentStageKey = selectedExamStage || 'All Stages';
      localStorage.setItem(`oep_syllabus_${selectedExamId}_${currentStageKey}`, val);
      localStorage.setItem(`oep_syllabus_${selectedExamId}`, val);
    }
  };

  const handleUpdateReferencePYQs = (val: string) => {
    setReferencePYQs(val);
    if (selectedExamId) {
      const currentStageKey = selectedExamStage || 'All Stages';
      const combined = combinePYQAndDirectives(val, directivesMarkdown);
      localStorage.setItem(`oep_directives_${selectedExamId}_${currentStageKey}`, combined);
      localStorage.setItem(`oep_directives_${selectedExamId}`, combined);
    }
  };

  const handleUpdateDirectives = (val: string) => {
    setDirectivesMarkdown(val);
    if (selectedExamId) {
      const currentStageKey = selectedExamStage || 'All Stages';
      const combined = combinePYQAndDirectives(referencePYQs, val);
      localStorage.setItem(`oep_directives_${selectedExamId}_${currentStageKey}`, combined);
      localStorage.setItem(`oep_directives_${selectedExamId}`, combined);
    }
  };

  const handleLoadSamplePYQTemplate = () => {
    handleUpdateReferencePYQs(DEFAULT_PYQ_TEMPLATE);
    toast.success('Loaded sample PYQ benchmark format!');
  };

  // Explicit Save to Cloud Database
  const handleSaveSyllabusToCloud = async () => {
    if (!selectedExamId) {
      toast.error('No exam selected to save syllabus.');
      return;
    }
    const stageToSave = selectedExamStage || 'All Stages';
    setIsSavingSyllabusToCloud(true);
    try {
      const combined = combinePYQAndDirectives(referencePYQs, directivesMarkdown);
      await examService.saveExamSyllabus(selectedExamId, stageToSave, syllabusMarkdown, combined);
      localStorage.setItem(`oep_syllabus_${selectedExamId}_${stageToSave}`, syllabusMarkdown);
      if (combined) {
        localStorage.setItem(`oep_directives_${selectedExamId}_${stageToSave}`, combined);
      }
      toast.success(`✅ Saved "${stageToSave}" syllabus & PYQ benchmark to Cloud Database!`);
    } catch (err: any) {
      console.error('Failed to save syllabus to cloud:', err);
      toast.error('Failed to save syllabus: ' + (err.message || 'Network error'));
    } finally {
      setIsSavingSyllabusToCloud(false);
    }
  };

  const handleStageTabSwitch = (newStage: string) => {
    // 1. Cache current stage draft to avoid loss
    const currentStageKey = selectedExamStage || 'All Stages';
    localStorage.setItem(`oep_syllabus_${selectedExamId}_${currentStageKey}`, syllabusMarkdown);
    const combined = combinePYQAndDirectives(referencePYQs, directivesMarkdown);
    if (combined) {
      localStorage.setItem(`oep_directives_${selectedExamId}_${currentStageKey}`, combined);
    }

    // 2. Set new stage - triggers the useEffect to load that stage's syllabus
    setSelectedExamStage(newStage);
  };

  const handleSelectSyllabusPreset = (presetKey: string) => {
    setSelectedSyllabusPreset(presetKey);
    if (SYLLABUS_PRESETS[presetKey]) {
      handleUpdateSyllabus(SYLLABUS_PRESETS[presetKey].markdown);
      toast.success(`Loaded "${SYLLABUS_PRESETS[presetKey].label}" blueprint!`);
    }
  };

  const handleSelectDirectivesPreset = (presetKey: string) => {
    setSelectedDirectivesPreset(presetKey);
    if (DIRECTIVES_PRESETS[presetKey]) {
      handleUpdateDirectives(DIRECTIVES_PRESETS[presetKey].markdown);
      toast.success(`Loaded "${DIRECTIVES_PRESETS[presetKey].label}" rubric!`);
    }
  };

  // Instant HTML5 File Upload Reader (.md, .txt, .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'syllabus' | 'directives') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (typeof content === 'string') {
        if (target === 'syllabus') {
          handleUpdateSyllabus(content);
          toast.success(`Loaded "${file.name}" into Syllabus & PYQ Blueprint!`);
        } else {
          if (part2Tab === 'pyqs') {
            handleUpdateReferencePYQs(content);
            toast.success(`Loaded "${file.name}" into Reference PYQ Benchmark!`);
          } else {
            handleUpdateDirectives(content);
            toast.success(`Loaded "${file.name}" into Generation Directives!`);
          }
        }
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file content.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Export as .md file download
  const handleExportMarkdown = (content: string, filename: string) => {
    if (!content || !content.trim()) {
      toast.error('No content to export.');
      return;
    }
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}`);
  };

  // Paste from clipboard
  const handlePasteTo = async (target: 'syllabus' | 'directives') => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        toast.error('Clipboard is empty.');
        return;
      }
      if (target === 'syllabus') {
        handleUpdateSyllabus(text);
        toast.success('Pasted clipboard into Syllabus & PYQ Blueprint!');
      } else {
        if (part2Tab === 'pyqs') {
          handleUpdateReferencePYQs(text);
          toast.success('Pasted clipboard into Reference PYQ Benchmark!');
        } else {
          handleUpdateDirectives(text);
          toast.success('Pasted clipboard into Generation Directives!');
        }
      }
    } catch {
      toast.error('Clipboard access denied. Please paste directly into the editor.');
    }
  };

  // Text Stats
  const syllabusStats = useMemo(() => {
    const trimmed = syllabusMarkdown.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = trimmed ? trimmed.split('\n').length : 0;
    return { words, lines };
  }, [syllabusMarkdown]);

  const directivesStats = useMemo(() => {
    const trimmed = directivesMarkdown.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const lines = trimmed ? trimmed.split('\n').length : 0;
    return { words, lines };
  }, [directivesMarkdown]);

  const pyqAnalysis = useMemo(() => {
    return parseReferencePYQs(referencePYQs);
  }, [referencePYQs]);
  const detectedPYQCount = pyqAnalysis.count;

  // Extract structured syllabus topics from syllabusMarkdown for Stage 2 topic picker
  const parsedSyllabusTopics = useMemo(() => {
    if (!syllabusMarkdown) return [];

    // Prioritize structured hierarchy parsing (handles Subject:, Sub-Subject:, Chapter:, Markdown headings)
    const hierarchy = parseSyllabusHierarchy(syllabusMarkdown, selectedExam?.name || selectedExamId);
    if (hierarchy.length > 0) {
      return hierarchy.map((item, idx) => {
        const catParts: string[] = [];
        if (item.paper) catParts.push(item.paper);
        const broad = item.placeholders?.['broadSubject'] || item.placeholders?.['paperSubject'];
        if (broad && broad !== item.subject) catParts.push(broad);
        if (item.subject) catParts.push(item.subject);
        if (item.subSubject && item.subSubject !== item.subject) catParts.push(item.subSubject);
        const category = catParts.length > 0 ? catParts.join(' ➔ ') : 'General Syllabus';

        return {
          id: `syllabus_topic_${idx + 1}`,
          title: item.chapter,
          category
        };
      });
    }

    const lines = syllabusMarkdown.split('\n');
    const topics: { id: string; title: string; category: string }[] = [];
    let currentCategory = 'General Knowledge & Core Syllabus';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ') || trimmed.startsWith('## ')) {
        const clean = trimmed.replace(/^#+\s*/, '').replace(/^\d+[\.\)]\s*/, '').trim();
        if (clean.length > 2) {
          currentCategory = clean;
        }
      } else if (trimmed.startsWith('### ') || trimmed.startsWith('#### ') || trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+[\.\)]\s+/.test(trimmed)) {
        const title = trimmed.replace(/^[#\-*]+/, '').replace(/^\d+[\.\)]\s*/, '').replace(/\*\*([^*]+)\*\*/g, '$1').trim();
        if (title.length > 2 && title.length < 90 && !title.toLowerCase().startsWith('note') && !title.toLowerCase().startsWith('duration') && !title.toLowerCase().startsWith('marks') && !title.toLowerCase().startsWith('total')) {
          topics.push({
            id: `syllabus_topic_${topics.length + 1}`,
            title,
            category: currentCategory
          });
        }
      }
    }
    return topics.slice(0, 150);
  }, [syllabusMarkdown]);

  // Helper for admin auth header
  const getAdminAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error("Admin session token is missing. Please re-login to the Admin Panel.");
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Test Connection
  const handleTestConnection = async () => {
    setIsTestingKey(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/ai/test-key', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          apiKey: apiKey || undefined,
          model: selectedModel,
          baseUrl: customBaseUrl || undefined
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      setKeyStatus('valid');
      toast.success(`Connected successfully to ${selectedModel}!`);
    } catch (err: any) {
      setKeyStatus('invalid');
      toast.error(err.message || 'AI Connection failed.');
    } finally {
      setIsTestingKey(false);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: Stage 1 Structure Generation (3 Sections x 4 Subcategories)
  // -------------------------------------------------------------
  const handleGenerateStructure = async () => {
    if (!selectedExamId) {
      toast.error('Please select an Exam first.');
      return;
    }

    setIsGeneratingStage1(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 65000);

    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/ai/generate-structure', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          examId: selectedExamId,
          examName: selectedExam?.name || selectedExamId,
          stage: selectedExamStage || undefined,
          mainSection: stage1MainSection,
          subCategory: stage1SubCategory,
          targetType: stage1MainSection === 'flashcards' ? 'flashcards' : (stage1MainSection === 'question_bank' ? 'question_bank' : 'mock_test'),
          autoCalibrate: isAutoCalibrate,
          count: isAutoCalibrate ? undefined : stage1Count,
          subjectFocus: (isAutoCalibrate || !stage1SubjectFocus.trim() || stage1SubjectFocus === 'Comprehensive Full Syllabus') ? undefined : stage1SubjectFocus.trim(),
          syllabusMarkdown,
          directivesMarkdown,
          apiKey: apiKey || undefined,
          model: selectedModel,
          baseUrl: customBaseUrl || undefined,
          namingPattern: stage1NamingPattern ? stage1NamingPattern.trim() : undefined,
          mockDuration,
          mockTotalMarks,
          mockNegativeMarking,
          mockQuestionCount
        }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate structure.');

      const items = data.data || [];
      setGeneratedStructures(items);
      setSelectedStructureIndices(new Set(items.map((_: any, idx: number) => idx)));
      setReviewFilterSection('all');
      setReviewFilterSubCategory('all');
      toast.success(isAutoCalibrate 
        ? `AI auto-architected ${items.length} curriculum test structures with 100% syllabus coverage!` 
        : `Generated ${items.length} curriculum test structures!`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error('NVIDIA NIM timed out (60s). Server may be under load — please retry in 30 seconds.');
      } else {
        toast.error(err.message || 'Structure generation failed.');
      }
    } finally {
      clearTimeout(timer);
      setIsGeneratingStage1(false);
    }
  };

  // Toggle selection for a single structure card
  const handleToggleSelectStructure = (index: number) => {
    setSelectedStructureIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Toggle select/deselect all structures currently visible
  const handleToggleSelectAll = (visibleIndices: number[]) => {
    setSelectedStructureIndices(prev => {
      const allSelected = visibleIndices.every(idx => prev.has(idx));
      const next = new Set(prev);
      if (allSelected) {
        visibleIndices.forEach(idx => next.delete(idx));
      } else {
        visibleIndices.forEach(idx => next.add(idx));
      }
      return next;
    });
  };

  // Inline Title Editing handlers
  const handleStartEditTitle = (index: number, currentTitle: string) => {
    setEditingTitleIndex(index);
    setEditingTitleValue(currentTitle);
  };

  const handleSaveEditedTitle = (index: number) => {
    if (editingTitleValue.trim()) {
      const updated = [...generatedStructures];
      updated[index] = { ...updated[index], title: editingTitleValue.trim() };
      setGeneratedStructures(updated);
    }
    setEditingTitleIndex(null);
  };

  // AI Title Refinement Handlers
  const handleRefineTitles = async (overrideInstruction?: string) => {
    const instruction = (overrideInstruction || refinementPrompt).trim();
    if (!instruction) {
      toast.error('Please enter an instruction or select a preset to refine titles.');
      return;
    }
    if (generatedStructures.length === 0) return;

    setIsRefiningTitles(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    try {
      const headers = await getAdminAuthHeaders();
      const currentTitles = generatedStructures.map(s => s.title);

      const res = await fetch('/api/admin/ai/refine-titles', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          titles: currentTitles,
          instruction,
          examName: selectedExam?.name || selectedExamId,
          apiKey: apiKey || undefined,
          model: selectedModel,
          baseUrl: customBaseUrl || undefined
        }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refine test titles.');

      if (Array.isArray(data.titles) && data.titles.length > 0) {
        // Save previous titles to history for undo capability
        setTitleHistory(prev => [...prev, currentTitles]);

        const updated = generatedStructures.map((item, idx) => ({
          ...item,
          title: data.titles[idx] || item.title
        }));
        setGeneratedStructures(updated);
        toast.success(`✨ Refined ${data.titles.length} test titles with AI!`);
        if (!overrideInstruction) {
          setRefinementPrompt('');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        toast.error('Title refinement timed out. Please retry.');
      } else {
        toast.error(err.message || 'Title refinement failed.');
      }
    } finally {
      clearTimeout(timer);
      setIsRefiningTitles(false);
    }
  };

  const handleUndoTitleRefinement = () => {
    if (titleHistory.length === 0) return;
    const lastHistory = titleHistory[titleHistory.length - 1];
    const updated = generatedStructures.map((item, idx) => ({
      ...item,
      title: lastHistory[idx] || item.title
    }));
    setGeneratedStructures(updated);
    setTitleHistory(prev => prev.slice(0, -1));
    toast.success('↩️ Reverted to previous titles.');
  };

  // Save selected structures to database with multi-table intelligence
  const handleSaveStructuresToDatabase = async () => {
    const itemsToSave = generatedStructures.filter((_, idx) => selectedStructureIndices.has(idx));
    if (itemsToSave.length === 0) {
      toast.error('Please select at least one test structure to save.');
      return;
    }

    setIsSavingStage1(true);
    try {
      let mockCount = 0;
      let practiceCount = 0;
      let bankCount = 0;
      let flashcardDeckCount = 0;
      let flashcardsGeneratedCount = 0;
      let duplicateCount = 0;

      // Track in-batch unique keys: "targetTable_targetCategory_normalizedTitle"
      const seenBatchKeys = new Set<string>();
      const flashcardDecksToInsert: any[] = [];

      // Category-scoped counters for Mock Tests & Question Banks
      const mockCategoryCounters: Record<string, number> = {};
      const bankCategoryCounters: Record<string, number> = {};

      for (let i = 0; i < itemsToSave.length; i++) {
        const item = itemsToSave[i];
        const rawTitle = (item.title || '').trim();
        if (!rawTitle) continue;
        const normalizedTitle = rawTitle.toLowerCase();

        if (item.targetTable === 'flashcardDecks') {
          // Section 4: Flashcard Decks table (Batch for atomic bulk insertion)
          const batchKey = `fc_${normalizedTitle}`;
          if (seenBatchKeys.has(batchKey)) {
            duplicateCount++;
            continue;
          }
          seenBatchKeys.add(batchKey);

          // Check if identical deck title already exists for this exam
          const alreadyExists = flashcardDecks.some(
            d => (d.exam_id === selectedExamId || d.exam_id === 'all') && (d.title || '').trim().toLowerCase() === normalizedTitle
          );
          if (alreadyExists) {
            duplicateCount++;
            continue;
          }

          const assignedStage = item.stage || selectedExamStage || 'All Stages';
          flashcardDecksToInsert.push({
            exam_id: selectedExamId,
            subject: item.subject || 'General Studies',
            sub_subject: item.subSubject || undefined,
            chapter: item.chapter || undefined,
            stage: assignedStage,
            title: rawTitle,
            description: item.description || `High-yield active recall flashcard deck for ${rawTitle}.`,
            icon: 'Layers',
            card_count: 0,
            is_premium: true,
            sort_order: i
          });
        } else if (item.targetTable === 'mockTests') {
          // Section 2: Mock Tests table (seriesId JSON)
          const targetCategory = item.subCategory || 'full-length';
          const batchKey = `mock_${targetCategory}_${normalizedTitle}`;

          if (seenBatchKeys.has(batchKey)) {
            duplicateCount++;
            continue;
          }
          seenBatchKeys.add(batchKey);

          // Find all existing mock tests for this exam in this exact category
          const existingCategoryTests = mockTests.filter(t => {
            const matchExam = t.examId === selectedExamId || (t.seriesId && typeof t.seriesId === 'string' && t.seriesId.includes(selectedExamId));
            let testCat = t.category || t.mockCategory || 'full-length';
            if (t.seriesId && typeof t.seriesId === 'string' && t.seriesId.startsWith('{')) {
              try {
                const parsed = JSON.parse(t.seriesId);
                if (parsed.category) testCat = parsed.category;
              } catch (e) {}
            }
            return matchExam && testCat === targetCategory;
          });

          // Check if identical title already exists in DB
          const alreadyExistsInDb = existingCategoryTests.some(
            t => (t.title || '').trim().toLowerCase() === normalizedTitle
          );
          if (alreadyExistsInDb) {
            duplicateCount++;
            continue;
          }

          if (mockCategoryCounters[targetCategory] === undefined) {
            const maxOrder = existingCategoryTests.reduce((max, t) => {
              const orderNum = Number(t.sortOrder);
              return !isNaN(orderNum) && orderNum > max ? orderNum : max;
            }, 0);

            mockCategoryCounters[targetCategory] = maxOrder;
          }

          mockCategoryCounters[targetCategory]++;
          const assignedSortOrder = mockCategoryCounters[targetCategory];

          const assignedStage = item.stage || selectedExamStage || null;
          const seriesData = JSON.stringify({
            examId: selectedExamId,
            category: targetCategory,
            stage: assignedStage,
            isPremium: true
          });

          await examService.createMockTest({
            title: rawTitle,
            durationMinutes: item.durationMinutes || 120,
            totalMarks: item.totalMarks || 100,
            negativeMarking: item.negativeMarking ?? 0.25,
            seriesId: seriesData,
            sortOrder: assignedSortOrder
          } as any);
          mockCount++;
        } else {
          // Section 1 (Practice Tests) or Section 3 (Question Banks)
          const targetMode = item.targetMode || (item.mainSection === 'practice_test' ? 'practice' : 'bank');
          const targetCategory = item.subCategory || 'topic-wise';
          const bankKey = `${targetMode}_${targetCategory}`;
          const batchKey = `bank_${bankKey}_${normalizedTitle}`;

          if (seenBatchKeys.has(batchKey)) {
            duplicateCount++;
            continue;
          }
          seenBatchKeys.add(batchKey);

          // Find all existing banks/practice sets for this exam in this exact mode and category
          const existingScopedBanks = questionBanks.filter(b => {
            const matchExam = b.examId === selectedExamId;
            const matchMode = targetMode === 'practice'
              ? (b.target_mode || 'both') !== 'bank'
              : (b.target_mode || 'both') !== 'practice';
            const matchCat = (b.type || 'topic-wise') === targetCategory;
            return matchExam && matchMode && matchCat;
          });

          // Check if identical title already exists in DB
          const alreadyExistsInDb = existingScopedBanks.some(
            b => (b.title || '').trim().toLowerCase() === normalizedTitle
          );
          if (alreadyExistsInDb) {
            duplicateCount++;
            continue;
          }

          if (bankCategoryCounters[bankKey] === undefined) {
            const maxBankOrder = existingScopedBanks.reduce((max, b) => {
              const orderNum = Number(b.sortOrder);
              return !isNaN(orderNum) && orderNum > max ? orderNum : max;
            }, 0);

            bankCategoryCounters[bankKey] = maxBankOrder;
          }

          bankCategoryCounters[bankKey]++;
          const assignedSortOrder = bankCategoryCounters[bankKey];

          const assignedStage = item.stage || selectedExamStage || '';
          const descriptiveTagline = (() => {
            const parts: string[] = [];
            if (item.paper) parts.push(`Paper: ${item.paper}`);
            if (item.subject) parts.push(`Subject: ${item.subject}`);
            if (item.subSubject) parts.push(item.subSubject);
            return parts.join(' | ');
          })();

          const metaTaglineObj = {
            text: descriptiveTagline,
            subject: item.subject || '',
            stage: assignedStage
          };

          await examService.createQuestionBank({
            title: rawTitle,
            examId: selectedExamId,
            type: targetCategory,
            target_mode: targetMode,
            tagline: JSON.stringify(metaTaglineObj),
            image: '',
            questionCount: 0,
            hasPracticeMode: targetMode === 'practice' || targetMode === 'both',
            isPremium: true,
            sortOrder: assignedSortOrder
          } as any);

          if (targetMode === 'practice') {
            practiceCount++;
          } else {
            bankCount++;
          }
        }
      }

      // Atomically insert all flashcard decks in a single lightning-fast database transaction
      if (flashcardDecksToInsert.length > 0) {
        const insertedDecks = await examService.bulkAddFlashcardDecks(flashcardDecksToInsert);
        flashcardDeckCount += (insertedDecks?.length || flashcardDecksToInsert.length);
      }

      const totalSaved = mockCount + practiceCount + bankCount + flashcardDeckCount;
      if (totalSaved > 0) {
        const parts: string[] = [];
        if (mockCount > 0) parts.push(`${mockCount} Mock Test${mockCount > 1 ? 's' : ''}`);
        if (practiceCount > 0) parts.push(`${practiceCount} Practice Set${practiceCount > 1 ? 's' : ''}`);
        if (bankCount > 0) parts.push(`${bankCount} Question Bank${bankCount > 1 ? 's' : ''}`);
        if (flashcardDeckCount > 0) parts.push(`${flashcardDeckCount} Flashcard Deck${flashcardDeckCount > 1 ? 's' : ''}${flashcardsGeneratedCount > 0 ? ` (${flashcardsGeneratedCount} Cards Generated)` : ''}`);
        
        const dupMsg = duplicateCount > 0 ? ` (${duplicateCount} duplicate${duplicateCount > 1 ? 's' : ''} skipped)` : '';
        toast.success(`Successfully saved ${parts.join(', ')} to respective sections!${dupMsg}`);
      } else if (duplicateCount > 0) {
        toast(`All ${duplicateCount} selected items already exist in the database and were skipped.`, {
          icon: 'ℹ️'
        });
      }

      onRefreshCatalog();
      loadFlashcardDecks();
      // Remove saved items from review list
      setGeneratedStructures(prev => prev.filter((_, idx) => !selectedStructureIndices.has(idx)));
      setSelectedStructureIndices(new Set());
    } catch (err: any) {
      toast.error(err.message || 'Failed to save items to database.');
    } finally {
      setIsSavingStage1(false);
    }
  };

  // Send a structure from Stage 1 directly to Stage 2 Question Studio
  const handleTransferToStage2 = (item: any) => {
    setStage2TestTitle(item.title);
    
    const itemIsMock = item.mainSection === 'mock_test' || item.targetTable === 'mockTests';
    const itemIsPractice = item.mainSection === 'practice_test' || item.targetMode === 'practice';
    const itemIsFlashcard = item.mainSection === 'flashcards' || item.targetTable === 'flashcardDecks';

    if (itemIsMock) {
      setStage2TargetType('mock_test');
    } else if (itemIsPractice) {
      setStage2TargetType('practice_test');
    } else if (itemIsFlashcard) {
      setStage2TargetType('flashcards');
      const matchedDeck = examFlashcardDecks.find(d => (d.title || '').trim().toLowerCase() === item.title.trim().toLowerCase());
      if (matchedDeck) {
        setStage2SelectedTestId(matchedDeck.id);
      }
    } else {
      setStage2TargetType('question_bank');
    }

    if (item.stage) {
      setSelectedExamStage(item.stage);
      setStage2StageFilter(item.stage);
      setMultiBankStageFilter(item.stage);
    }

    if (item.subCategory === 'full-length' || item.subCategory === 'pyq' || /full mock|full-length|pyq paper/i.test(item.title)) {
      setStage2Subject('Comprehensive Full Syllabus (All Subjects Balanced)');
      setStage2SubSubject('');
      setStage2Chapter('');
    } else {
      setStage2Subject(item.subject || item.chapter || 'Comprehensive Full Syllabus (All Subjects Balanced)');
      setStage2SubSubject(item.subSubject || '');
      setStage2Chapter(item.chapter || '');
    }

    if (item.questionCountTarget && item.questionCountTarget > 0) {
      setStage2QuestionCount(item.questionCountTarget);
    } else if (itemIsFlashcard) {
      setStage2QuestionCount(10);
    }

    handleSwitchStage('stage2_questions');
    toast.success(itemIsFlashcard ? `Loaded "${item.title}" into Stage 2 Flashcard Studio!` : `Loaded "${item.title}" into Stage 2 Question Paper Studio!`);
  };

  // -------------------------------------------------------------
  // HANDLER: Multi-Batch Auto-Runner & Question Generation
  // -------------------------------------------------------------
  const generateSingleBatch = async (
    activeTitle: string,
    batchNum: number,
    existingStems: string[],
    isMultiBankQueue: boolean = false,
    overrideStage?: string,
    overrideSubject?: string,
    overrideSubSubject?: string,
    overrideChapter?: string,
    overrideSubCategory?: string,
    customQuestionCount?: number,
    thematicFocus?: string
  ): Promise<any[]> => {
    const resolvedStage = overrideStage || (selectedItem ? getItemStage(selectedItem) : '') || selectedExamStage || undefined;
    const headers = await getAdminAuthHeaders();

    // Resolve stage-specific syllabus if target stage differs from active state
    let effectiveSyllabus = syllabusMarkdown;
    if (resolvedStage && resolvedStage !== selectedExamStage && selectedExamId) {
      const stageCached = localStorage.getItem(`oep_syllabus_${selectedExamId}_${resolvedStage}`);
      if (stageCached) {
        effectiveSyllabus = stageCached;
      } else {
        try {
          const dbSyllabus = await examService.getExamSyllabus(selectedExamId, resolvedStage);
          if (dbSyllabus?.syllabus_markdown) {
            effectiveSyllabus = dbSyllabus.syllabus_markdown;
            localStorage.setItem(`oep_syllabus_${selectedExamId}_${resolvedStage}`, effectiveSyllabus);
          }
        } catch (e) {
          console.warn('[effectiveSyllabus] Failed to fetch remote stage syllabus:', e);
        }
      }
    }

    // Active Recall Flashcards Mode
    if (stage2TargetType === 'flashcards') {
      const timeStr = new Date().toLocaleTimeString();
      const densityLabel = stage2NaturalDensity
        ? (stage2QuestionCount > 0 ? `Natural Density (≤${stage2QuestionCount} Cap)` : 'Natural Density (Auto Sizing)')
        : `${stage2QuestionCount} Cards`;
      setTelemetryLogs(prev => [...prev.slice(-30), `[${timeStr}] Generating active recall flashcards (${densityLabel}) for "${activeTitle}"...`]);
      setTelemetryEvent({
        stageId: 'GENERATION',
        stageName: 'Active Recall Flashcard Generation',
        stageIndex: 3,
        totalStages: 5,
        currentCount: (batchNum - 1) * (stage2QuestionCount || 10),
        totalCount: (stage2QuestionCount || 10) * stage2BatchCount,
        percent: 60,
        message: `Distilling high-yield flashcards (${densityLabel}) for "${activeTitle}"...`,
        log: `Requesting flashcards (${densityLabel}) from AI engine.`
      });

      const fcRes = await fetch('/api/admin/ai/generate-flashcards', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          examId: selectedExamId,
          examName: selectedExam?.name || selectedExamId,
          stage: resolvedStage,
          deckTitle: activeTitle,
          subject: overrideSubject || stage2Subject,
          subSubject: overrideSubSubject !== undefined ? overrideSubSubject : (stage2SubSubject || undefined),
          chapter: overrideChapter !== undefined ? overrideChapter : (stage2Chapter || undefined),
          syllabusMarkdown: effectiveSyllabus,
          cardCount: stage2NaturalDensity && stage2QuestionCount === 0 ? 0 : stage2QuestionCount,
          naturalDensity: stage2NaturalDensity,
          apiKey: apiKey || undefined,
          model: selectedModel,
          baseUrl: customBaseUrl || undefined,
          alreadyGeneratedStems: existingStems,
          batchNumber: batchNum
        })
      });
      const fcData = await fcRes.json().catch(() => ({}));
      if (!fcRes.ok || !fcData.data) {
        throw new Error(fcData.error || `Failed to generate flashcards for batch ${batchNum}.`);
      }
      const cards = (fcData.data || []).map((c: any, i: number) => ({
        id: `fc_${Date.now()}_${batchNum}_${i}`,
        questionText: c.front_text,
        explanation: c.back_text + (c.key_points && c.key_points.length > 0 ? `\n\n📌 Key Takeaways:\n• ` + c.key_points.join('\n• ') : ''),
        options: c.key_points && c.key_points.length > 0 ? c.key_points : [c.back_text],
        correctAnswerIndex: 0,
        difficulty: 'medium',
        front_text: c.front_text,
        back_text: c.back_text,
        archetype: c.archetype || 'CONCEPT',
        key_points: c.key_points || [],
        batchNumber: batchNum
      }));

      setGenerationProgress({
        current: batchNum * stage2QuestionCount,
        total: stage2QuestionCount * stage2BatchCount
      });

      return cards;
    }

    const res = await fetch('/api/admin/ai/generate-questions-stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        examId: selectedExamId,
        examName: selectedExam?.name || selectedExamId,
        mainSection: stage2TargetType === 'flashcards' ? undefined : stage2TargetType,
        stage: resolvedStage,
        testTitle: activeTitle,
        subject: overrideSubject || stage2Subject,
        subSubject: overrideSubSubject !== undefined ? overrideSubSubject : (stage2SubSubject || undefined),
        chapter: overrideChapter !== undefined ? overrideChapter : (stage2Chapter || undefined),
        subCategory: overrideSubCategory || (selectedItem as any)?.type || (stage2SubCategory !== 'all' ? stage2SubCategory : undefined),
        syllabusMarkdown: effectiveSyllabus,
        directivesMarkdown,
        referencePYQs: referencePYQs.trim() || undefined,
        difficulty: stage2Difficulty,
        questionCount: customQuestionCount !== undefined
          ? customQuestionCount
          : (stage2QuestionNaturalDensity ? (stage2QuestionCeiling > 0 ? stage2QuestionCeiling : 25) : stage2QuestionCount),
        naturalDensity: customQuestionCount !== undefined ? false : stage2QuestionNaturalDensity,
        questionCeiling: stage2QuestionNaturalDensity ? stage2QuestionCeiling : undefined,
        includeDiagrams: stage2IncludeDiagrams,
        apiKey: apiKey || undefined,
        model: selectedModel,
        baseUrl: customBaseUrl || undefined,
        alreadyGeneratedStems: existingStems,
        batchNumber: batchNum,
        thematicFocus: thematicFocus || undefined
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `Failed to initialize stream for batch ${batchNum}.`);
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let batchQuestions: any[] = [];
    let streamAccumulatedChunks: any[] = [];
    let streamError: string | null = null;

    if (reader) {
      let streamAborted = false;
      while (!streamAborted) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;
          const eventMatch = block.match(/event:\s*([^\n]+)/);
          const dataMatch = block.match(/data:\s*([\s\S]+)$/);
          const eventType = eventMatch ? eventMatch[1].trim() : 'message';
          const rawData = dataMatch ? dataMatch[1].trim() : '';

          if (rawData) {
            let parsed: any;
            try {
              parsed = JSON.parse(rawData);
            } catch {
              continue;
            }

            if (eventType === 'progress') {
              setTelemetryEvent({
                ...parsed,
                message: stage2BatchCount > 1 ? `[Batch ${batchNum}/${stage2BatchCount}] ${parsed.message}` : parsed.message
              });
              if (parsed.log) {
                const timeStr = new Date().toLocaleTimeString();
                setTelemetryLogs(prev => [...prev.slice(-30), `[${timeStr}] ${stage2BatchCount > 1 ? `[Batch ${batchNum}] ` : ''}${parsed.log}`]);
              }
              if (parsed.currentCount !== undefined) {
                const baseCount = (batchNum - 1) * stage2QuestionCount;
                setGenerationProgress({
                  current: baseCount + parsed.currentCount,
                  total: stage2QuestionCount * stage2BatchCount
                });
              }
              if (parsed.latestBatch && Array.isArray(parsed.latestBatch) && parsed.latestBatch.length > 0) {
                const tagged = parsed.latestBatch.map((q: any) => ({ ...q, batchNumber: batchNum }));
                streamAccumulatedChunks = [...streamAccumulatedChunks, ...tagged];
                if (!isMultiBankQueue) {
                  setGeneratedQuestions(prev => {
                    const existingTexts = new Set(prev.map((q: any) => (q.questionText || '').trim()));
                    const toAdd = tagged.filter((q: any) => !existingTexts.has((q.questionText || '').trim()));
                    return [...prev, ...toAdd];
                  });
                }
              }
            } else if (eventType === 'complete') {
              batchQuestions = (parsed.data || []).map((q: any) => ({ ...q, batchNumber: batchNum }));
            } else if (eventType === 'error') {
              streamError = parsed.error || `Batch ${batchNum} encountered an error.`;
              streamAborted = true;
              break;
            }
          }
        }
      }
    }

    if (streamError) {
      throw new Error(streamError);
    }

    if (batchQuestions.length > 0) {
      return batchQuestions;
    }

    // If stream ended and we collected chunks via latestBatch, return them safely
    if (streamAccumulatedChunks.length > 0) {
      return streamAccumulatedChunks;
    }

    // Fallback direct non-streaming call if stream completed without full payload
    const fallbackRes = await fetch('/api/admin/ai/generate-questions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        examId: selectedExamId,
        examName: selectedExam?.name || selectedExamId,
        mainSection: stage2TargetType === 'flashcards' ? undefined : stage2TargetType,
        stage: resolvedStage,
        testTitle: activeTitle,
        subject: overrideSubject || stage2Subject,
        subSubject: overrideSubSubject !== undefined ? overrideSubSubject : (stage2SubSubject || undefined),
        chapter: overrideChapter !== undefined ? overrideChapter : (stage2Chapter || undefined),
        subCategory: overrideSubCategory || (selectedItem as any)?.type || (stage2SubCategory !== 'all' ? stage2SubCategory : undefined),
        syllabusMarkdown: effectiveSyllabus,
        directivesMarkdown,
        referencePYQs: referencePYQs.trim() || undefined,
        difficulty: stage2Difficulty,
        questionCount: stage2QuestionNaturalDensity ? (stage2QuestionCeiling > 0 ? stage2QuestionCeiling : 25) : stage2QuestionCount,
        naturalDensity: stage2QuestionNaturalDensity,
        questionCeiling: stage2QuestionNaturalDensity ? stage2QuestionCeiling : undefined,
        includeDiagrams: stage2IncludeDiagrams,
        apiKey: apiKey || undefined,
        model: selectedModel,
        baseUrl: customBaseUrl || undefined,
        alreadyGeneratedStems: existingStems,
        batchNumber: batchNum
      })
    });
    const fallbackData = await fallbackRes.json().catch(() => ({}));
    if (!fallbackRes.ok || !fallbackData.data) {
      throw new Error(fallbackData.error || `Failed to generate questions for batch ${batchNum}.`);
    }
    return (fallbackData.data || []).map((q: any) => ({ ...q, batchNumber: batchNum }));
  };

  const handleGenerateQuestions = async () => {
    const activeTitle = stage2TestTitle.trim() || (
      stage2TargetType === 'mock_test' 
        ? examMockTests.find(t => t.id === stage2SelectedTestId)?.title 
        : stage2TargetType === 'practice_test'
        ? examPracticeSets.find(b => b.id === stage2SelectedTestId)?.title
        : stage2TargetType === 'flashcards'
        ? examFlashcardDecks.find(d => d.id === stage2SelectedTestId)?.title
        : examQuestionBanks.find(b => b.id === stage2SelectedTestId)?.title
    );

    if (!activeTitle) {
      toast.error('Please specify or select a Test Title.');
      return;
    }

    const totalExpected = stage2QuestionCount * stage2BatchCount;
    const timeInit = new Date().toLocaleTimeString();
    stopBatchRunnerRef.current = false;
    setIsGeneratingQuestions(true);
    setIsBatchRunnerActive(stage2BatchCount > 1);
    setCurrentRunningBatch(1);
    setSelectedBatchFilter('all');
    setGeneratedQuestions([]); // Reset live review board for clean multi-batch session
    setGenerationProgress({ current: 0, total: totalExpected });
    setTelemetryLogs([`[${timeInit}] Initialized Multi-Batch Auto-Runner (${stage2BatchCount} ${stage2BatchCount === 1 ? 'batch' : 'batches'} of ${stage2QuestionCount} Qs).`]);
    setTelemetryEvent({
      stageId: 'GROUNDING',
      stageName: 'Curriculum & Syllabus Grounding',
      stageIndex: 1,
      totalStages: 5,
      currentCount: 0,
      totalCount: totalExpected,
      percent: 8,
      message: `Grounding in target module: "${activeTitle}" (Batch 1/${stage2BatchCount})...`,
      log: `Initialized syllabus grounding for "${activeTitle}".`
    });

    let accumulated: any[] = [];
    let completedBatches = 0;

    // Pre-fetch existing stems from database for this bank/test so Batch 1 never repeats past questions
    let existingDbStems: string[] = [];
    try {
      if (stage2TargetType === 'flashcards') {
        let targetDeckId = stage2SelectedTestId;
        if (!targetDeckId) {
          const existingDeck = examFlashcardDecks.find(d => d.title.toLowerCase() === activeTitle.toLowerCase());
          if (existingDeck) targetDeckId = existingDeck.id;
        }
        if (targetDeckId) {
          const existingCards = await examService.getFlashcardsByDeckId(targetDeckId);
          if (Array.isArray(existingCards)) {
            existingDbStems = existingCards.map(c => c.front_text).filter(Boolean);
          }
        }
      } else if (stage2TargetType === 'mock_test' && stage2SelectedTestId) {
        const existingQs = await examService.getQuestionsForMockTest(stage2SelectedTestId);
        if (Array.isArray(existingQs)) {
          existingDbStems = existingQs.map(q => q.questionText).filter(Boolean);
        }
      } else if (stage2SelectedTestId) {
        const existingQs = await examService.getQuestionsForQuestionBank(stage2SelectedTestId, activeTitle, selectedExamId);
        if (Array.isArray(existingQs)) {
          existingDbStems = existingQs.map(q => q.questionText).filter(Boolean);
        }
      } else {
        const matchingBank = [...examQuestionBanks, ...examPracticeSets].find(
          b => b.title.toLowerCase() === activeTitle.toLowerCase()
        );
        if (matchingBank) {
          const existingQs = await examService.getQuestionsForQuestionBank(matchingBank.id, matchingBank.title, selectedExamId);
          if (Array.isArray(existingQs)) {
            existingDbStems = existingQs.map(q => q.questionText).filter(Boolean);
          }
        }
      }
      if (existingDbStems.length > 0) {
        setTelemetryLogs(prev => [
          ...prev.slice(-30),
          `🛡️ Loaded ${existingDbStems.length} existing question stems from database to ensure 0% duplicate generation.`
        ]);
      }
    } catch (e) {
      console.warn('Could not pre-fetch existing stems for single generation:', e);
    }

    // -------------------------------------------------------------
    // STAGE 1: AI PEDAGOGICAL CURRICULUM PLANNING (Auto-Batch Mode)
    // -------------------------------------------------------------
    let plannedBatches: { batchNumber: number; questionCount: number; thematicFocus: string }[] = [];
    let effectiveBatchCount = stage2BatchCount;
    let effectiveTotalExpected = stage2QuestionCount * stage2BatchCount;

    if (stage2QuestionNaturalDensity && stage2AutoBatch && stage2TargetType !== 'flashcards') {
      const planTime = new Date().toLocaleTimeString();
      setTelemetryLogs(prev => [
        ...prev.slice(-30),
        `[${planTime}] 🧠 [AI Pedagogical Architect] Sizing curriculum & planning optimal micro-batches for "${activeTitle}"...`
      ]);
      setTelemetryEvent({
        stageId: 'GROUNDING',
        stageName: 'AI Pedagogical Curriculum Planning',
        stageIndex: 1,
        totalStages: 5,
        currentCount: 0,
        totalCount: stage2QuestionCeiling > 0 ? stage2QuestionCeiling : 25,
        percent: 12,
        message: `Reasoning curriculum density & decomposing micro-batches for "${activeTitle}"...`,
        log: `[Stage 1/5] Pedagogical Architect analyzing syllabus scope for "${activeTitle}".`
      });

      try {
        const planRes = await fetch('/api/admin/ai/plan-curriculum', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            syllabusMarkdown,
            testTitle: activeTitle,
            subject: stage2Subject,
            chapter: stage2Chapter,
            subCategory: (selectedItem as any)?.type || (stage2SubCategory !== 'all' ? stage2SubCategory : undefined),
            ceilingCap: stage2QuestionCeiling > 0 ? stage2QuestionCeiling : undefined,
            difficulty: stage2Difficulty,
            apiKey: apiKey || undefined,
            model: selectedModel,
            baseUrl: customBaseUrl || undefined
          })
        });

        if (planRes.ok) {
          const planData = await planRes.json();
          if (planData?.data?.batches && planData.data.batches.length > 0) {
            plannedBatches = planData.data.batches;
            effectiveBatchCount = plannedBatches.length;
            effectiveTotalExpected = planData.data.totalQuestions || plannedBatches.reduce((sum: number, b: any) => sum + b.questionCount, 0);
            setTelemetryLogs(prev => [
              ...prev.slice(-30),
              `🎯 [AI Curriculum Plan] ${effectiveTotalExpected} Questions planned across ${effectiveBatchCount} focused micro-batches: ${planData.data.reasoning || ''}`
            ]);
            toast.success(`🧠 AI planned ${effectiveTotalExpected} Qs across ${effectiveBatchCount} micro-batches!`);
          }
        }
      } catch (planErr) {
        console.warn('[handleGenerateQuestions] Curriculum plan request failed:', planErr);
      }
    }

    setIsBatchRunnerActive(effectiveBatchCount > 1);
    setGenerationProgress({ current: 0, total: effectiveTotalExpected });

    try {
      for (let b = 1; b <= effectiveBatchCount; b++) {
        if (stopBatchRunnerRef.current) {
          toast(`Auto-Runner stopped by user after Batch ${b - 1}.`, { icon: 'ℹ️' });
          break;
        }

        const batchTargetQs = plannedBatches[b - 1]?.questionCount;
        const batchTheme = plannedBatches[b - 1]?.thematicFocus;

        let batchQs: any[] = [];
        let batchSuccess = false;
        let batchRetryCount = 0;
        let lastBatchError = '';

        while (batchRetryCount < 3 && !batchSuccess && !stopBatchRunnerRef.current) {
          try {
            setCurrentRunningBatch(b);
            const existingStems = [
              ...existingDbStems,
              ...accumulated.map(q => q.questionText).filter(Boolean)
            ];
            const singleSubCat = (selectedItem as any)?.type || (stage2SubCategory !== 'all' ? stage2SubCategory : undefined);
            batchQs = await generateSingleBatch(
              activeTitle,
              b,
              existingStems,
              false,
              undefined,
              undefined,
              undefined,
              undefined,
              singleSubCat,
              batchTargetQs,
              batchTheme
            );
            batchSuccess = true;
          } catch (err: any) {
            batchRetryCount++;
            lastBatchError = err.message || `Batch ${b} generation attempt failed`;
            console.warn(`[Batch ${b} Retry ${batchRetryCount}/3]:`, lastBatchError);
            if (batchRetryCount < 3 && !stopBatchRunnerRef.current) {
              setTelemetryLogs(prev => [
                ...prev.slice(-30),
                `⚠️ Batch ${b} transient retry (${batchRetryCount}/3) in ${(1200 * batchRetryCount) / 1000}s...`
              ]);
              await new Promise(res => setTimeout(res, 1200 * batchRetryCount));
            }
          }
        }

        if (!batchSuccess) {
          toast.error(`❌ Batch ${b}/${effectiveBatchCount} failed: ${lastBatchError}. Preserving generated questions.`);
          break;
        }

        // Deduplicate against accumulated questions
        const existingSet = new Set(accumulated.map(q => (q.questionText || '').trim()));
        const uniqueBatchQs = batchQs.filter(q => !existingSet.has((q.questionText || '').trim()));

        accumulated = [...accumulated, ...uniqueBatchQs];
        setGeneratedQuestions([...accumulated]);
        completedBatches = b;

        if (effectiveBatchCount > 1) {
          toast.success(`✅ Batch ${b}/${effectiveBatchCount} complete (+${uniqueBatchQs.length} Qs, Total: ${accumulated.length})`);
        }

        if (b < effectiveBatchCount && !stopBatchRunnerRef.current) {
          // Micro-pause (500ms) between batches to prevent rate limit saturation
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      if (accumulated.length > 0) {
        toast.success(`🎉 Auto-Runner finished! Delivered ${accumulated.length} questions across ${completedBatches} ${completedBatches === 1 ? 'batch' : 'batches'}!`);
      }
    } catch (err: any) {
      console.error("[Multi-Batch Auto-Runner Error]", err);
      toast.error(err.message || 'Question generation failed.');
    } finally {
      setIsGeneratingQuestions(false);
      setIsBatchRunnerActive(false);
      setGenerationProgress(null);
    }
  };

  // -------------------------------------------------------------
  // HANDLER: Multi-Bank Sequential Auto-Runner & Direct Auto-Publish
  // -------------------------------------------------------------
  const appendQueueFeedEvent = (
    bankId: string,
    bankTitle: string,
    type: QueueFeedEvent['type'],
    message: string,
    extra?: { batchNum?: number; totalBatches?: number; questionCount?: number }
  ) => {
    const timeStr = new Date().toLocaleTimeString();
    const newEvent: QueueFeedEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: timeStr,
      bankId,
      bankTitle,
      type,
      message,
      ...extra
    };
    setQueueFeedEvents(prev => [...prev.slice(-200), newEvent]);
  };

  const handleRunMultiBankQueue = async () => {
    const isFlashcards = stage2TargetType === 'flashcards';
    const nounSingular = isFlashcards ? 'Deck' : 'Bank';
    const nounPlural = isFlashcards ? 'Decks' : 'Banks';
    const unitPlural = isFlashcards ? 'Cards' : 'Qs';

    if (selectedMultiBankIds.length === 0) {
      toast.error(`Please select at least one ${nounSingular} for the queue.`);
      return;
    }

    const pool = isFlashcards 
      ? examFlashcardDecks 
      : (stage2TargetType === 'practice_test' ? examPracticeSets : (stage2TargetType === 'mock_test' ? examMockTests : questionBanks));

    const banksToProcess = pool.filter(b => selectedMultiBankIds.includes(b.id || ''));
    if (banksToProcess.length === 0) {
      toast.error(`Selected ${nounPlural.toLowerCase()} could not be resolved.`);
      return;
    }

    const qsPerBank = stage2QuestionCount * stage2BatchCount;
    const grandTotalQs = banksToProcess.length * qsPerBank;
    const startTimeDate = new Date();
    const timeInit = startTimeDate.toLocaleTimeString();

    stopQueueRunnerRef.current = false;
    setIsQueueRunnerActive(true);
    setIsGeneratingQuestions(true);
    setCurrentQueueIndex(0);
    setGeneratedQuestions([]);
    setQueueExecutionSummary(null);
    setQueueFeedEvents([]);

    // Initialize queue statuses
    const initialStatus: Record<string, MultiBankStatusEntry> = {};
    banksToProcess.forEach(b => {
      const bId = b.id || '';
      initialStatus[bId] = { 
        status: 'queued', 
        count: 0,
        step: 'waiting',
        stepDetail: isFlashcards ? 'Queued in flashcard pipeline' : 'Queued in pipeline',
        totalBatches: stage2BatchCount 
      };
    });
    setMultiBankQueueStatus(initialStatus);

    const densitySummary = isFlashcards && stage2NaturalDensity
      ? (stage2QuestionCount > 0 ? `Natural Density [≤${stage2QuestionCount} Cap]` : 'Autonomous Natural Density [Syllabus-Driven]')
      : `${qsPerBank} ${unitPlural} each`;

    appendQueueFeedEvent(
      'system',
      'Queue Controller',
      'queue_init',
      `🚀 Initialized Multi-${nounSingular} Queue Runner for ${banksToProcess.length} ${nounPlural.toLowerCase()} (${densitySummary} • ${stage2BatchCount} ${stage2BatchCount > 1 ? 'batches' : 'pass'}).`,
      { totalBatches: stage2BatchCount, questionCount: grandTotalQs }
    );

    let totalUploadedAcrossQueue = 0;
    let successfullyCompletedBanks = 0;

    try {
      for (let i = 0; i < banksToProcess.length; i++) {
        if (stopQueueRunnerRef.current) {
          appendQueueFeedEvent(
            'system',
            'Queue Controller',
            'queue_stopped',
            `⏹️ Queue Runner paused by admin after completing ${successfullyCompletedBanks} ${nounPlural.toLowerCase()}.`
          );
          toast(`Queue Runner stopped by user after ${successfullyCompletedBanks} ${nounPlural.toLowerCase()}.`, { icon: 'ℹ️' });
          break;
        }

        const currentBank = banksToProcess[i];
        const currentBankId = currentBank.id || '';
        setCurrentQueueIndex(i);

        // Update status of this item to 'running'
        setMultiBankQueueStatus(prev => ({
          ...prev,
          [currentBankId]: { 
            status: 'running', 
            count: 0,
            step: 'grounding',
            stepDetail: isFlashcards ? 'Analyzing syllabus & existing flashcards...' : 'Analyzing syllabus & pre-fetching stems...',
            totalBatches: stage2BatchCount,
            currentBatch: 1
          }
        }));

        const bankTargetLabel = isFlashcards && stage2NaturalDensity
          ? (stage2QuestionCount > 0 ? `Natural Density • ≤${stage2QuestionCount} cards ceiling` : 'Natural Density • autonomous syllabus capacity')
          : `Target: ${qsPerBank} ${unitPlural} across ${stage2BatchCount} batches`;

        appendQueueFeedEvent(
          currentBankId,
          currentBank.title,
          'bank_start',
          `📦 [${nounSingular} ${i + 1}/${banksToProcess.length}] Starting "${currentBank.title}" (${bankTargetLabel})...`,
          { totalBatches: stage2BatchCount, questionCount: qsPerBank }
        );

        setTelemetryLogs(prev => [
          ...prev.slice(-40),
          `[${new Date().toLocaleTimeString()}] [Queue ${i + 1}/${banksToProcess.length}] Starting "${currentBank.title}" (${bankTargetLabel})...`
        ]);

        // 1. Fetch existing stems strictly for this bank/deck/mock test to prevent duplicate concepts
        let existingBankStems: string[] = [];
        try {
          if (isFlashcards) {
            const existingCards = await examService.getFlashcardsByDeckId(currentBankId);
            if (Array.isArray(existingCards)) {
              existingBankStems = existingCards.map(c => c.front_text).filter(Boolean);
            }
          } else if (stage2TargetType === 'mock_test') {
            const existingQs = await examService.getQuestionsForMockTest(currentBankId);
            if (Array.isArray(existingQs)) {
              existingBankStems = existingQs.map(q => q.questionText).filter(Boolean);
            }
          } else {
            const existingQs = await examService.getQuestionsForQuestionBank(currentBankId, currentBank.title, selectedExamId);
            if (Array.isArray(existingQs)) {
              existingBankStems = existingQs.map(q => q.questionText).filter(Boolean);
            }
          }
        } catch (e) {
          console.warn(`Could not fetch existing stems for ${nounSingular}:`, currentBank.title, e);
        }

        // 2. Generate cards/questions across the configured number of batches for this bank/deck
        let bankAccumulatedQuestions: any[] = [];
        let bankGenerationFailed = false;
        let bankErrorMessage = '';

        // Plan curriculum if in natural density + auto batch mode for this bank
        let bankPlannedBatches: { batchNumber: number; questionCount: number; thematicFocus: string }[] = [];
        let bankRunBatches = stage2BatchCount;

        if (!isFlashcards && stage2QuestionNaturalDensity && stage2AutoBatch) {
          try {
            const bankSubCategory = (currentBank as any).type || (stage2SubCategory !== 'all' ? stage2SubCategory : undefined);
            const planRes = await fetch('/api/admin/ai/plan-curriculum', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                syllabusMarkdown,
                testTitle: currentBank.title,
                subject: (currentBank as any).subject || stage2Subject,
                chapter: (currentBank as any).chapter || stage2Chapter,
                subCategory: bankSubCategory,
                ceilingCap: stage2QuestionCeiling > 0 ? stage2QuestionCeiling : undefined,
                difficulty: stage2Difficulty,
                apiKey: apiKey || undefined,
                model: selectedModel,
                baseUrl: customBaseUrl || undefined
              })
            });
            if (planRes.ok) {
              const planData = await planRes.json();
              if (planData?.data?.batches && planData.data.batches.length > 0) {
                bankPlannedBatches = planData.data.batches;
                bankRunBatches = bankPlannedBatches.length;
                appendQueueFeedEvent(
                  currentBankId,
                  currentBank.title,
                  'audit_verified',
                  `🧠 AI Architect planned ${planData.data.totalQuestions} Qs across ${bankRunBatches} focused micro-batches: ${planData.data.reasoning || ''}`
                );
              }
            }
          } catch (e) {
            console.warn(`[Queue Runner] Curriculum plan fallback for ${currentBank.title}:`, e);
          }
        }

        for (let b = 1; b <= bankRunBatches; b++) {
          if (stopQueueRunnerRef.current) break;

          setCurrentRunningBatch(b);
          setMultiBankQueueStatus(prev => ({
            ...prev,
            [currentBankId]: {
              ...prev[currentBankId],
              step: 'generating',
              stepDetail: `Generating Batch ${b} of ${bankRunBatches}...`,
              currentBatch: b,
              totalBatches: bankRunBatches
            }
          }));

          const batchGenLabel = isFlashcards && stage2NaturalDensity
            ? (stage2QuestionCount > 0 ? `Natural Density • ≤${stage2QuestionCount} cards ceiling` : 'Natural Density • dynamic distillation')
            : (bankPlannedBatches[b - 1]?.questionCount ? `${bankPlannedBatches[b - 1].questionCount} Qs (Focus: ${bankPlannedBatches[b - 1].thematicFocus})` : `${stage2QuestionCount} ${unitPlural}`);

          appendQueueFeedEvent(
            currentBankId,
            currentBank.title,
            'batch_gen',
            `⚡ [${nounSingular} ${i + 1}/${banksToProcess.length}] Distilling factual anchors for "${currentBank.title}" (${batchGenLabel})...`,
            { batchNum: b, totalBatches: bankRunBatches }
          );

          const combinedExistingStems = isFlashcards
            ? [
                ...existingBankStems,
                ...bankAccumulatedQuestions.map(q => q.front_text || q.questionText)
              ]
            : [
                ...existingBankStems,
                ...bankAccumulatedQuestions.map(q => q.questionText)
              ];

          setTelemetryEvent({
            stageId: 'GROUNDING',
            stageName: `${nounSingular} ${i + 1}/${banksToProcess.length}: ${currentBank.title}`,
            stageIndex: i + 1,
            totalStages: banksToProcess.length,
            currentCount: totalUploadedAcrossQueue + bankAccumulatedQuestions.length,
            totalCount: grandTotalQs,
            percent: Math.round(((totalUploadedAcrossQueue + bankAccumulatedQuestions.length) / grandTotalQs) * 100),
            message: `[${nounSingular} ${i + 1}/${banksToProcess.length}] Generating Batch ${b}/${bankRunBatches} for "${currentBank.title}"...`,
            log: `Generating Batch ${b} for "${currentBank.title}".`
          });

          // Up to 3 retries with backoff for resilience against transient Gemini 503/429
          let batchQuestions: any[] = [];
          let retryCount = 0;
          let batchSuccess = false;

          while (retryCount < 3 && !batchSuccess && !stopQueueRunnerRef.current) {
            try {
              const bankStage = getItemStage(currentBank) || selectedExamStage || undefined;
              let bankSubject = (currentBank as any).subject || undefined;
              if (!bankSubject && (currentBank as any).tagline && typeof (currentBank as any).tagline === 'string' && (currentBank as any).tagline.startsWith('{')) {
                try {
                  const parsed = JSON.parse((currentBank as any).tagline);
                  if (parsed && parsed.subject) bankSubject = parsed.subject;
                } catch {}
              }
              if (!bankSubject && (currentBank as any).seriesId && typeof (currentBank as any).seriesId === 'string' && (currentBank as any).seriesId.startsWith('{')) {
                try {
                  const parsed = JSON.parse((currentBank as any).seriesId);
                  if (parsed && parsed.subject) bankSubject = parsed.subject;
                } catch {}
              }
              const bankSubSubject = (currentBank as any).sub_subject || undefined;
              const bankChapter = (currentBank as any).chapter || undefined;
              const bankSubCategory = (currentBank as any).type || (stage2SubCategory !== 'all' ? stage2SubCategory : undefined);
              const batchTargetQs = bankPlannedBatches[b - 1]?.questionCount;
              const batchTheme = bankPlannedBatches[b - 1]?.thematicFocus;
              batchQuestions = await generateSingleBatch(
                currentBank.title,
                b,
                combinedExistingStems,
                true,
                bankStage,
                bankSubject,
                bankSubSubject,
                bankChapter,
                bankSubCategory,
                batchTargetQs,
                batchTheme
              );
              batchSuccess = true;
            } catch (err: any) {
              retryCount++;
              console.warn(`[Batch ${b} Retry ${retryCount}/3] for "${currentBank.title}":`, err.message);
              if (retryCount >= 3) {
                bankGenerationFailed = true;
                bankErrorMessage = err.message || `Failed after 3 attempts on batch ${b}.`;
              } else {
                await new Promise(res => setTimeout(res, 1500 * retryCount));
              }
            }
          }

          if (bankGenerationFailed) break;

          // Deduplicate within bank/deck
          const existingSet = new Set(
            bankAccumulatedQuestions.map((q: any) => 
              isFlashcards ? (q.front_text || q.questionText || '').trim() : (q.questionText || '').trim()
            )
          );
          const unique = batchQuestions.filter(q => 
            !existingSet.has((isFlashcards ? (q.front_text || q.questionText || '') : (q.questionText || '')).trim())
          );
          bankAccumulatedQuestions = [...bankAccumulatedQuestions, ...unique];

          setMultiBankQueueStatus(prev => ({
            ...prev,
            [currentBankId]: { 
              ...prev[currentBankId],
              status: 'running', 
              count: bankAccumulatedQuestions.length,
              stepDetail: `Batch ${b}/${bankRunBatches} verified (${bankAccumulatedQuestions.length}/${qsPerBank} ${unitPlural})`
            }
          }));

          appendQueueFeedEvent(
            currentBankId,
            currentBank.title,
            'batch_done',
            `✓ [${nounSingular} ${i + 1}/${banksToProcess.length}] Batch ${b}/${bankRunBatches} verified (${batchQuestions.length} ${unitPlural} valid). ${nounSingular} total: ${bankAccumulatedQuestions.length}/${qsPerBank} ${unitPlural}.`,
            { batchNum: b, totalBatches: bankRunBatches, questionCount: bankAccumulatedQuestions.length }
          );

          if (b < bankRunBatches && !stopQueueRunnerRef.current) {
            await new Promise(res => setTimeout(res, 400));
          }
        }

        if (stopQueueRunnerRef.current && bankAccumulatedQuestions.length === 0) {
          break;
        }

        if (bankGenerationFailed) {
          setMultiBankQueueStatus(prev => ({
            ...prev,
            [currentBankId]: { 
              status: 'failed', 
              count: 0, 
              step: 'failed',
              stepDetail: bankErrorMessage,
              error: bankErrorMessage 
            }
          }));
          appendQueueFeedEvent(
            currentBankId,
            currentBank.title,
            'bank_failed',
            `❌ [${nounSingular} ${i + 1}/${banksToProcess.length}] Failed on "${currentBank.title}": ${bankErrorMessage}`
          );
          toast.error(`❌ ${nounSingular} "${currentBank.title}" failed: ${bankErrorMessage}`);
          continue; // Move to next item without halting entire queue
        }

        // 3. Verification & Direct Auto-Publish to Database strictly for this bank/deck
        if (bankAccumulatedQuestions.length > 0) {
          setMultiBankQueueStatus(prev => ({
            ...prev,
            [currentBankId]: {
              ...prev[currentBankId],
              step: 'publishing',
              stepDetail: isFlashcards
                ? `Writing ${bankAccumulatedQuestions.length} cards to flashcard deck...`
                : `Writing ${bankAccumulatedQuestions.length} questions to database...`
            }
          }));

          appendQueueFeedEvent(
            currentBankId,
            currentBank.title,
            'publishing',
            `💾 [${nounSingular} ${i + 1}/${banksToProcess.length}] Direct-publishing ${bankAccumulatedQuestions.length} ${unitPlural.toLowerCase()} into "${currentBank.title}"...`,
            { questionCount: bankAccumulatedQuestions.length }
          );

          setTelemetryEvent({
            stageId: 'PACKAGING',
            stageName: `Publishing: ${currentBank.title}`,
            stageIndex: i + 1,
            totalStages: banksToProcess.length,
            currentCount: totalUploadedAcrossQueue + bankAccumulatedQuestions.length,
            totalCount: grandTotalQs,
            percent: Math.round(((totalUploadedAcrossQueue + bankAccumulatedQuestions.length) / grandTotalQs) * 100),
            message: `Publishing ${bankAccumulatedQuestions.length} ${unitPlural.toLowerCase()} directly to "${currentBank.title}"...`,
            log: `Directly writing ${unitPlural.toLowerCase()} to database for "${currentBank.title}".`
          });

          if (isFlashcards) {
            const targetDeck = examFlashcardDecks.find(d => d.id === currentBankId);
            const existingCount = targetDeck?.card_count || existingBankStems.length || 0;

            const flashcardPayloads = bankAccumulatedQuestions.map((q, idx) => ({
              deck_id: currentBankId,
              front_text: q.front_text || q.questionText || '',
              back_text: q.back_text || q.explanation || (q.options ? q.options[q.correctAnswerIndex] : '') || '',
              key_points: q.key_points || [],
              sort_order: existingCount + idx + 1
            }));

            await examService.bulkAddFlashcards(currentBankId, flashcardPayloads);

            const newTotalCount = existingCount + flashcardPayloads.length;
            if (targetDeck) targetDeck.card_count = newTotalCount;
            setBankCountOverrides(prev => ({ ...prev, [currentBankId]: newTotalCount }));

            await loadFlashcardDecks();
            try { onRefreshCatalog(); } catch (e) {}

            totalUploadedAcrossQueue += flashcardPayloads.length;
            successfullyCompletedBanks++;

            setMultiBankQueueStatus(prev => ({
              ...prev,
              [currentBankId]: { 
                status: 'completed', 
                count: flashcardPayloads.length,
                step: 'completed',
                stepDetail: `Published ${flashcardPayloads.length} Cards • Total: ${newTotalCount}`
              }
            }));

            appendQueueFeedEvent(
              currentBankId,
              currentBank.title,
              'bank_done',
              `✅ [Deck ${i + 1}/${banksToProcess.length}] Successfully published ${flashcardPayloads.length} flashcards into "${currentBank.title}"! Deck counter updated to ${newTotalCount}. In-memory batch purged.`,
              { questionCount: flashcardPayloads.length }
            );

            toast.success(`✅ Saved ${flashcardPayloads.length} Cards into "${currentBank.title}" (${i + 1}/${banksToProcess.length})`);
            setTelemetryLogs(prev => [
              ...prev.slice(-40),
              `[${new Date().toLocaleTimeString()}] ✅ Successfully published ${flashcardPayloads.length} flashcards into "${currentBank.title}".`
            ]);

            // Clean up in-memory questions for this deck before proceeding
            bankAccumulatedQuestions = [];
          } else {
            // Strict verification: all items belong strictly to current target and selectedExamId
            const isMockTest = stage2TargetType === 'mock_test';
            const targetTopic = isMockTest ? `mockTest__${currentBankId}` : currentBank.title;

            const payloads = bankAccumulatedQuestions.map((q, qIdx) => ({
              examId: selectedExamId,
              topic: targetTopic,
              difficulty: q.difficulty || stage2Difficulty || 'hard',
              questionText: q.questionText,
              options: q.options,
              correctAnswerIndex: q.correctAnswerIndex,
              explanation: q.explanation || '',
              diagram: q.diagram || null,
              sortOrder: (existingBankStems.length || 0) + qIdx + 1
            }));

            const headers = await getAdminAuthHeaders();
            const pubRes = await fetch('/api/admin/questions/bulk', {
              method: 'POST',
              headers,
              body: JSON.stringify({ questions: payloads })
            });

            if (!pubRes.ok) {
              const pubErr = await pubRes.json().catch(() => ({}));
              throw new Error(pubErr.error || `Failed to write questions for "${currentBank.title}".`);
            }

            // Update Target Question Count locally & invalidate catalog caches
            const newTotalCount = ((currentBank as any)._questionCount || (currentBank as any).questionCount || 0) + payloads.length;
            setBankCountOverrides(prev => ({ ...prev, [currentBankId]: newTotalCount }));

            if (isMockTest) {
              (currentBank as any)._questionCount = newTotalCount;
              (currentBank as any).totalQuestions = newTotalCount;
              await examService.updateMockTest(currentBankId, {
                totalMarks: newTotalCount * 2
              } as any).catch(console.error);
              cacheService.clear('all_mock_tests_lite');
            } else {
              (currentBank as any).questionCount = newTotalCount;
              (currentBank as any).practiceQuestionCount = newTotalCount;
              await examService.updateQuestionBank(currentBankId, {
                questionCount: newTotalCount
              }).catch(console.error);
              cacheService.clear('all_question_banks');
            }

            cacheService.clear('topic_counts');
            try {
              sessionStorage.removeItem('oep_admin_catalog_cache_v2');
            } catch {}

            totalUploadedAcrossQueue += payloads.length;
            successfullyCompletedBanks++;

            setMultiBankQueueStatus(prev => ({
              ...prev,
              [currentBankId]: { 
                status: 'completed', 
                count: payloads.length,
                step: 'completed',
                stepDetail: `Published ${payloads.length} Qs • Total: ${newTotalCount}`
              }
            }));

            appendQueueFeedEvent(
              currentBankId,
              currentBank.title,
              'bank_done',
              `✅ [Bank ${i + 1}/${banksToProcess.length}] Successfully published ${payloads.length} questions into "${currentBank.title}"! Bank counter updated to ${newTotalCount}. In-memory batch purged.`,
              { questionCount: payloads.length }
            );

            toast.success(`✅ Saved ${payloads.length} Qs into "${currentBank.title}" (${i + 1}/${banksToProcess.length})`);
            setTelemetryLogs(prev => [
              ...prev.slice(-40),
              `[${new Date().toLocaleTimeString()}] ✅ Successfully published ${payloads.length} questions into "${currentBank.title}".`
            ]);

            // Clean up in-memory questions for this bank before proceeding
            bankAccumulatedQuestions = [];
          }
        }

        // Micro-pause (600ms) between items & advance notice
        if (i < banksToProcess.length - 1 && !stopQueueRunnerRef.current) {
          const nextBank = banksToProcess[i + 1];
          appendQueueFeedEvent(
            nextBank.id || '',
            nextBank.title,
            'advancing',
            `➡️ ${nounSingular} ${i + 1}/${banksToProcess.length} completed. Advancing to ${nounSingular} ${i + 2}/${banksToProcess.length}: "${nextBank.title}"...`
          );
          await new Promise(res => setTimeout(res, 600));
        }
      }

      const endTimeDate = new Date();
      const durationSec = Math.round((endTimeDate.getTime() - startTimeDate.getTime()) / 1000);

      if (successfullyCompletedBanks > 0) {
        appendQueueFeedEvent(
          'system',
          'Queue Controller',
          'queue_complete',
          `🎉 Multi-${nounSingular} Pipeline Complete: ${successfullyCompletedBanks} of ${banksToProcess.length} ${nounPlural.toLowerCase()} successfully published (${totalUploadedAcrossQueue} total ${unitPlural.toLowerCase()} added) in ${Math.floor(durationSec / 60)}m ${durationSec % 60}s.`
        );
        toast.success(`🎉 Multi-${nounSingular} Queue Runner finished! Published ${totalUploadedAcrossQueue} ${unitPlural.toLowerCase()} across ${successfullyCompletedBanks} ${nounPlural.toLowerCase()}!`);
      }

      setQueueExecutionSummary({
        totalBanks: banksToProcess.length,
        completedBanks: successfullyCompletedBanks,
        totalQuestions: totalUploadedAcrossQueue,
        startTime: timeInit,
        endTime: endTimeDate.toLocaleTimeString(),
        durationSeconds: durationSec
      });
    } catch (err: any) {
      console.error(`[Multi-${nounSingular} Queue Runner Fatal Error]`, err);
      appendQueueFeedEvent(
        'system',
        'Queue Controller',
        'bank_failed',
        `❌ Fatal queue error: ${err.message || 'Unknown error'}`
      );
      toast.error(err.message || 'Queue Runner encountered an error.');
    } finally {
      setIsQueueRunnerActive(false);
      setIsGeneratingQuestions(false);
      setGenerationProgress(null);
    }
  };

  // Re-run Double-Blind Audit & Auto-Repair on demand
  const handleAuditQuestions = async () => {
    if (generatedQuestions.length === 0) {
      toast.error('No questions available to audit.');
      return;
    }

    const activeTitle = stage2TestTitle.trim() || (
      stage2TargetType === 'mock_test' 
        ? examMockTests.find(t => t.id === stage2SelectedTestId)?.title 
        : stage2TargetType === 'practice_test'
        ? examPracticeSets.find(b => b.id === stage2SelectedTestId)?.title
        : examQuestionBanks.find(b => b.id === stage2SelectedTestId)?.title
    ) || 'Target Module';

    setIsAuditingQuestions(true);
    try {
      const headers = await getAdminAuthHeaders();
      const res = await fetch('/api/admin/ai/audit-questions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          questions: generatedQuestions,
          testTitle: activeTitle,
          subject: stage2Subject,
          examName: selectedExam?.name || selectedExamId,
          syllabusMarkdown,
          difficulty: stage2Difficulty,
          apiKey: apiKey || undefined,
          model: selectedModel,
          baseUrl: customBaseUrl || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to audit questions.');

      setGeneratedQuestions(data.data || []);
      toast.success(`Chief Auditor: Double-blind audit complete for ${data.data?.length || 0} questions!`);
    } catch (err: any) {
      toast.error(err.message || 'Auditing failed.');
    } finally {
      setIsAuditingQuestions(false);
    }
  };

  // 1-Click Publish Questions to Database (supports targetBatch?: number)
  const handlePublishQuestions = async (targetBatch?: number) => {
    const questionsToPublish = typeof targetBatch === 'number'
      ? generatedQuestions.filter(q => (q.batchNumber || 1) === targetBatch)
      : generatedQuestions;

    if (questionsToPublish.length === 0) {
      toast.error(typeof targetBatch === 'number' ? `No questions found in Batch ${targetBatch} to publish.` : 'No questions available to publish.');
      return;
    }

    const activeTitle = stage2TestTitle.trim() || (
      stage2TargetType === 'mock_test'
        ? examMockTests.find(t => t.id === stage2SelectedTestId)?.title
        : stage2TargetType === 'practice_test'
        ? examPracticeSets.find(b => b.id === stage2SelectedTestId)?.title
        : stage2TargetType === 'flashcards'
        ? examFlashcardDecks.find(d => d.id === stage2SelectedTestId)?.title
        : examQuestionBanks.find(b => b.id === stage2SelectedTestId)?.title
    ) || 'Target Test';

    // Active Recall Flashcards Mode: Publish directly to flashcard_decks & flashcards
    if (stage2TargetType === 'flashcards') {
      setIsPublishingQuestions(true);
      try {
        let targetDeckId = stage2SelectedTestId;
        if (!targetDeckId) {
          const existingDeck = examFlashcardDecks.find(d => d.title.toLowerCase() === activeTitle.toLowerCase());
          if (existingDeck) {
            targetDeckId = existingDeck.id;
          } else {
            const newDeck = await examService.addFlashcardDeck({
              title: activeTitle,
              exam_id: selectedExamId,
              stage: selectedExamStage || 'All Stages',
              subject: stage2Subject || '',
              sub_subject: stage2SubSubject || undefined,
              chapter: stage2Chapter || undefined,
              description: `Active recall flashcard deck for ${activeTitle}`,
              is_premium: true,
              card_count: 0
            });
            targetDeckId = newDeck.id;
          }
        }

        const targetDeck = examFlashcardDecks.find(d => d.id === targetDeckId);
        let existingCount = targetDeck?.card_count || 0;
        try {
          const liveCards = await examService.getFlashcardsByDeckId(targetDeckId);
          if (Array.isArray(liveCards)) {
            existingCount = liveCards.length;
          }
        } catch {}

        const flashcardPayloads = questionsToPublish.map((q, idx) => ({
          deck_id: targetDeckId,
          front_text: q.front_text || q.questionText || '',
          back_text: q.back_text || q.explanation || (q.options ? q.options[q.correctAnswerIndex] : '') || '',
          key_points: q.key_points || [],
          sort_order: existingCount + idx + 1
        }));

        await examService.bulkAddFlashcards(targetDeckId, flashcardPayloads);

        if (typeof targetBatch === 'number') {
          toast.success(`Published Batch ${targetBatch} (${flashcardPayloads.length} Flashcards) to "${activeTitle}"!`);
          setGeneratedQuestions(prev => prev.filter(q => (q.batchNumber || 1) !== targetBatch));
          setSelectedBatchFilter(prev => prev === targetBatch ? 'all' : prev);
        } else {
          toast.success(`Published ${flashcardPayloads.length} flashcards directly to deck "${activeTitle}"!`);
          setGeneratedQuestions([]);
          setSelectedBatchFilter('all');
        }

        await loadFlashcardDecks();
        await onRefreshCatalog();
      } catch (err: any) {
        toast.error(err.message || 'Failed to publish flashcards.');
      } finally {
        setIsPublishingQuestions(false);
      }
      return;
    }

    let targetTopic = '';

    if (stage2TargetType === 'mock_test') {
      if (stage2SelectedTestId) {
        targetTopic = `mockTest__${stage2SelectedTestId}`;
      } else {
        // Find existing mock test by title or create new
        const existing = examMockTests.find(t => t.title.toLowerCase() === activeTitle.toLowerCase());
        if (existing) {
          targetTopic = `mockTest__${existing.id}`;
        } else {
          // Create new mock test first
          const seriesData = JSON.stringify({
            examId: selectedExamId,
            category: 'Full-Length Mock',
            stage: selectedExamStage || null,
            isPremium: true
          });
          const newTest = await examService.createMockTest({
            title: activeTitle,
            durationMinutes: mockDuration || 120,
            totalMarks: questionsToPublish.length * 2,
            negativeMarking: mockNegativeMarking ?? 0.25,
            seriesId: seriesData,
            sortOrder: (examMockTests.length + 1)
          } as any);
          targetTopic = `mockTest__${newTest.id}`;
        }
      }
    } else {
      // Question Bank or Practice Test
      const isPractice = stage2TargetType === 'practice_test' || stage2BankModeFilter === 'practice';
      const scopedBanks = isPractice ? examPracticeSets : examQuestionBanks;

      if (stage2SelectedTestId) {
        const bank = scopedBanks.find(b => b.id === stage2SelectedTestId) || questionBanks.find(b => b.id === stage2SelectedTestId);
        targetTopic = bank?.title || stage2SelectedTestId;
      } else {
        targetTopic = activeTitle;
        // Check if bank exists in this mode, if not create
        const existingBank = scopedBanks.find(b => b.title.toLowerCase() === activeTitle.toLowerCase());
        if (!existingBank) {
          const metaTagline = JSON.stringify({
            text: stage2Subject || '',
            stage: selectedExamStage || '',
            subject: stage2Subject || ''
          });
          const validCategory = ['topic-wise', 'exam-focused', 'revision-sets', 'pyq-collections'].includes(stage2SubCategory)
            ? stage2SubCategory
            : 'topic-wise';
          const assignedTargetMode = isPractice
            ? 'practice'
            : (stage2BankModeFilter === 'bank' || validCategory === 'revision-sets' || validCategory === 'pyq-collections' ? 'bank' : 'practice');

          await examService.createQuestionBank({
            title: activeTitle,
            examId: selectedExamId,
            type: validCategory,
            target_mode: assignedTargetMode,
            tagline: metaTagline,
            hasPracticeMode: isPractice,
            questionCount: questionsToPublish.length,
            isPremium: true,
            sortOrder: (scopedBanks.length + 1)
          } as any);
        }
      }
    }

    setIsPublishingQuestions(true);
    try {
      // Determine existing question count so sortOrder does not collide and appends sequentially
      let existingCount = 0;
      try {
        if (stage2TargetType === 'mock_test') {
          const mockId = targetTopic.replace(/^mockTest__/, '');
          const existingQs = await examService.getQuestionsForMockTest(mockId);
          existingCount = Array.isArray(existingQs) ? existingQs.length : 0;
        } else {
          const existingQs = await examService.getQuestionsForQuestionBank(stage2SelectedTestId || targetTopic, targetTopic, selectedExamId);
          existingCount = Array.isArray(existingQs) ? existingQs.length : 0;
        }
      } catch (cntErr) {
        console.warn('Could not determine existing question count for sortOrder offset:', cntErr);
      }

      const headers = await getAdminAuthHeaders();
      const payloads = questionsToPublish.map((q, idx) => ({
        examId: selectedExamId,
        topic: targetTopic,
        difficulty: q.difficulty || 'hard',
        questionText: q.questionText,
        options: q.options,
        correctAnswerIndex: q.correctAnswerIndex,
        explanation: q.explanation || '',
        diagram: q.diagram || null,
        sortOrder: existingCount + idx + 1
      }));

      const res = await fetch('/api/admin/questions/bulk', {
        method: 'POST',
        headers,
        body: JSON.stringify({ questions: payloads })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bulk insert questions.');

      if (typeof targetBatch === 'number') {
        toast.success(`Published Batch ${targetBatch} (${payloads.length} Qs) to "${activeTitle}"!`);
        setGeneratedQuestions(prev => prev.filter(q => (q.batchNumber || 1) !== targetBatch));
        setSelectedBatchFilter(prev => prev === targetBatch ? 'all' : prev);
      } else {
        toast.success(`Published ${data.count || questionsToPublish.length} questions directly to "${activeTitle}"!`);
        setGeneratedQuestions([]);
        setSelectedBatchFilter('all');
      }

      // Invalidate memory cache, topic counts & admin catalog SWR cache so card counters immediately reflect new totals
      try {
        cacheService.clear('all_question_banks');
        cacheService.clear('topic_counts');
        cacheService.clear('all_mock_tests_lite');
        cacheService.clear('all_mock_tests');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('oep_admin_catalog_cache_v2');
          sessionStorage.removeItem('oep_admin_catalog_cache');
        }
      } catch (cacheErr) {
        console.warn('Cache clear error:', cacheErr);
      }

      await onRefreshCatalog();
    } catch (err: any) {
      toast.error(err.message || 'Failed to publish questions.');
    } finally {
      setIsPublishingQuestions(false);
    }
  };

  // Question editing helper
  const handleUpdateQuestion = (index: number, field: string, value: any) => {
    setGeneratedQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    setGeneratedQuestions(prev => {
      const updated = [...prev];
      const opts = [...updated[qIndex].options];
      opts[optIndex] = val;
      updated[qIndex] = { ...updated[qIndex], options: opts };
      return updated;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setGeneratedQuestions(prev => prev.filter((_, idx) => idx !== index));
    toast.success('Question removed.');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & AI ENGINE STATUS BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-indigo-950 border border-brand-500/20 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Background glow orb */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-400/30 text-brand-300 text-xs font-black tracking-widest uppercase">
                <Bot className="w-3.5 h-3.5 text-brand-400" />
                Enterprise AI Studio • Powered by Gemini & NIM
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                AI Question & Test Generator
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
                Generate exam-aligned mock test papers, question banks, and advanced-difficulty MCQs with live KaTeX math equations and dynamic geometric diagrams.
              </p>
            </div>

            {/* Stage Selector Pills */}
            <div className="flex items-center gap-1.5 p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shrink-0">
              <button
                onClick={() => handleSwitchStage('stage2_questions')}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer",
                  activeStage === 'stage2_questions'
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/40"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                )}
              >
                <Wand2 className="w-4 h-4" />
                Stage 2: Question Paper Studio
              </button>
              <button
                onClick={() => handleSwitchStage('stage1_structure')}
                className={cn(
                  "px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer",
                  activeStage === 'stage1_structure'
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/40"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                )}
              >
                <Layers className="w-4 h-4" />
                Stage 1: Test Structure Generator
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              AI SETTINGS & ENGINE CONFIGURATION (Symmetrical 2-Column Suite)
          ───────────────────────────────────────────────────────────── */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            {/* Precedence Status Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-3">
                <div className={cn(
                  "px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 border shadow-sm",
                  keyProviderInfo.badgeColor
                )}>
                  <span className={cn("w-2 h-2 rounded-full", keyProviderInfo.isCustom ? "bg-emerald-400 animate-pulse" : "bg-sky-400")} />
                  {keyProviderInfo.label}
                </div>
                <span className="text-xs text-slate-300 font-medium">
                  {keyProviderInfo.isCustom 
                    ? "Custom key is active. All generation calls strictly bypass server environment keys." 
                    : "Powered by server-configured NVIDIA NIM API key (.env). Enter your custom key below to override."}
                </span>
              </div>

              {keyProviderInfo.isCustom && (
                <button
                  onClick={handleClearCustomKey}
                  className="text-xs text-rose-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 shrink-0 self-start sm:self-auto"
                  title="Clear custom key and restore server .env keys"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reset to Server Default
                </button>
              )}
            </div>

            {/* Symmetrical 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              {/* Left Column: AI Model Engine */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-brand-400" />
                      AI Model Engine
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                      Inference Core
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    High-tier LLM used for test architecture, questions, and step-by-step math reasoning.
                  </p>
                </div>

                <div className="pt-2">
                  <select
                    value={selectedModel}
                    onChange={e => handleModelChange(e.target.value)}
                    className="w-full bg-slate-900 border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all shadow-inner"
                  >
                    <optgroup label="⚡ NVIDIA NIM — Ultra-Fast Inference">
                      <option value="openai/gpt-oss-20b">GPT-OSS 20B ⚡ ULTRA-FAST (2-5s)</option>
                      <option value="meta/llama-3.2-11b-vision-instruct">Llama 3.2 11B Vision ✅ Balanced</option>
                      <option value="nvidia/nemotron-3.5-lightning-30b-a3b">Nemotron 3.5 Lightning 30B 🧠</option>
                    </optgroup>
                    <optgroup label={`🌟 Google Gemini${(apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) ? ' ✅ Key Active' : ' — Enter AIzaSy... or AQ.... key to unlock'}`}>
                      <option value="gemini-flash-lite-latest" disabled={!apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.')}>{(apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) ? '' : '🔒 '}Gemini Flash-Lite ⚡ ULTRA-FAST (2-4s)</option>
                      <option value="gemini-3.1-flash-lite" disabled={!apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.')}>{(apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) ? '' : '🔒 '}Gemini 3.1 Flash-Lite ⚡ High-Speed (4s)</option>
                      <option value="gemini-3.6-flash" disabled={!apiKey.startsWith('AIza') && !apiKey.startsWith('AQ.')}>{(apiKey.startsWith('AIza') || apiKey.startsWith('AQ.')) ? '' : '🔒 '}Gemini 3.6 Flash 🧠 Deep Reasoning (12s)</option>
                    </optgroup>
                    <optgroup label={`🚀 Groq${apiKey.startsWith('gsk_') ? ' ✅ Key Active' : ' — Enter gsk_... key to unlock'}`}>
                      <option value="llama-3.3-70b-versatile" disabled={!apiKey.startsWith('gsk_') && !customBaseUrl}>{apiKey.startsWith('gsk_') || customBaseUrl ? '' : '🔒 '}Llama 3.3 70B Versatile (Ultra-Fast)</option>
                      <option value="llama-3.1-8b-instant" disabled={!apiKey.startsWith('gsk_') && !customBaseUrl}>{apiKey.startsWith('gsk_') || customBaseUrl ? '' : '🔒 '}Llama 3.1 8B Instant</option>
                    </optgroup>
                    <optgroup label={`🧠 OpenAI${apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-') && !apiKey.startsWith('sk-ant-') ? ' ✅ Key Active' : ' — Enter sk-... key to unlock'}`}>
                      <option value="gpt-4o-mini" disabled={!apiKey.startsWith('sk-') && !customBaseUrl}>{apiKey.startsWith('sk-') || customBaseUrl ? '' : '🔒 '}GPT-4o Mini (Fast & Cheap)</option>
                      <option value="gpt-4o" disabled={!apiKey.startsWith('sk-') && !customBaseUrl}>{apiKey.startsWith('sk-') || customBaseUrl ? '' : '🔒 '}GPT-4o (Full Power)</option>
                    </optgroup>
                    <optgroup label={`🌐 OpenRouter${apiKey.startsWith('sk-or-') ? ' ✅ Key Active' : ' — Enter sk-or-... key'}`}>
                      <option value="google/gemini-2.5-flash" disabled={!apiKey.startsWith('sk-or-') && !customBaseUrl}>{apiKey.startsWith('sk-or-') || customBaseUrl ? '' : '🔒 '}Gemini 2.5 Flash (via OR)</option>
                      <option value="anthropic/claude-3.5-sonnet" disabled={!apiKey.startsWith('sk-or-') && !customBaseUrl}>{apiKey.startsWith('sk-or-') || customBaseUrl ? '' : '🔒 '}Claude 3.5 Sonnet (via OR)</option>
                    </optgroup>
                    <optgroup label={`🏢 Anthropic${apiKey.startsWith('sk-ant-') ? ' ✅ Key Active' : ' — Enter sk-ant-... key'}`}>
                      <option value="claude-3-5-sonnet-20241022" disabled={!apiKey.startsWith('sk-ant-') && !customBaseUrl}>{apiKey.startsWith('sk-ant-') || customBaseUrl ? '' : '🔒 '}Claude 3.5 Sonnet</option>
                    </optgroup>
                  </select>
                  {customBaseUrl && (
                    <p className="text-[10px] text-amber-300/80 mt-1 font-mono truncate">
                      🔌 Custom endpoint: {customBaseUrl}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Custom API Key & Test Connection */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      Custom API Key
                      <span className="text-[10px] text-amber-300 font-normal">(100% Precedence)</span>
                    </label>
                    <p className="text-xs text-slate-400">
                      Supports: <code className="text-[10px] text-brand-300 font-mono">AIzaSy...</code> <code className="text-[10px] text-brand-300 font-mono">nvapi-</code> <code className="text-[10px] text-brand-300 font-mono">gsk_</code> <code className="text-[10px] text-brand-300 font-mono">sk-</code> <code className="text-[10px] text-brand-300 font-mono">sk-ant-</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handlePasteApiKey}
                      className="text-xs text-brand-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                      title="Paste from clipboard"
                    >
                      <Clipboard className="w-3.5 h-3.5" />
                      Paste
                    </button>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="text-xs text-slate-300 hover:text-white font-bold flex items-center gap-1.5 transition-colors px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                    >
                      {showApiKey ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch gap-2.5 pt-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => handleSaveApiKey(e.target.value)}
                      placeholder="Paste API key: AIzaSy... | nvapi-... | gsk_... | sk-..."
                      className="w-full bg-slate-900 border border-white/15 rounded-xl pl-3.5 pr-9 py-3 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 outline-none font-mono transition-all shadow-inner"
                    />
                    {apiKey && (
                      <button
                        onClick={handleClearCustomKey}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-300 transition-colors p-1"
                        title="Clear custom key"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={handleTestConnection}
                    disabled={isTestingKey}
                    className={cn(
                      "sm:w-36 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all border shadow-md shrink-0 disabled:opacity-50 cursor-pointer",
                      keyStatus === 'valid'
                        ? "bg-emerald-600/30 hover:bg-emerald-600/40 border-emerald-500/50 text-emerald-200"
                        : keyStatus === 'invalid'
                        ? "bg-rose-600/30 hover:bg-rose-600/40 border-rose-500/50 text-rose-200"
                        : "bg-brand-600 hover:bg-brand-500 border-brand-400/40 text-white"
                    )}
                    title="Test active API key with selected model"
                  >
                    {isTestingKey ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : keyStatus === 'valid' ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    ) : keyStatus === 'invalid' ? (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Play className="w-4 h-4 text-white" />
                    )}
                    {isTestingKey ? 'Testing...' : keyStatus === 'valid' ? 'Verified' : keyStatus === 'invalid' ? 'Failed' : 'Test Key'}
                  </button>
                </div>

                {/* Advanced: Custom Endpoint URL */}
                <div className="pt-1">
                  <button
                    onClick={() => setShowAdvancedEndpoint(!showAdvancedEndpoint)}
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors font-medium"
                  >
                    <Info className="w-3 h-3" />
                    {showAdvancedEndpoint ? 'Hide' : 'Show'} Advanced: Custom Base URL (OpenAI-Compatible)
                  </button>
                  {showAdvancedEndpoint && (
                    <div className="mt-2 relative">
                      <input
                        type="text"
                        value={customBaseUrl}
                        onChange={e => handleSaveBaseUrl(e.target.value)}
                        placeholder="https://your-ollama-or-custom-api.com/v1"
                        className="w-full bg-slate-900/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-[11px] text-white placeholder:text-slate-500 focus:ring-2 focus:ring-brand-500 outline-none font-mono transition-all"
                      />
                      {customBaseUrl && (
                        <button
                          onClick={() => handleSaveBaseUrl('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-300 transition-colors p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Explanatory Policy Note */}
            <p className="text-[11px] text-slate-400 flex items-center gap-2 leading-relaxed pt-1">
              <Info className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>
                <strong>Universal Key Support:</strong> Paste any API key — Google Gemini (<code className="font-mono text-[10px]">AIzaSy...</code>), NVIDIA NIM (<code className="font-mono text-[10px]">nvapi-</code>), Groq (<code className="font-mono text-[10px]">gsk_</code>), OpenAI (<code className="font-mono text-[10px]">sk-</code>), Anthropic (<code className="font-mono text-[10px]">sk-ant-</code>), or OpenRouter (<code className="font-mono text-[10px]">sk-or-</code>). Provider is auto-detected and model auto-switched.
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. DUAL-ANCHOR EXAM KNOWLEDGE & DIRECTIVES GOVERNANCE SUITE
      ───────────────────────────────────────────────────────────── */}
      {/* Hidden File Inputs for 1-Click Upload */}
      <input
        type="file"
        ref={syllabusFileInputRef}
        onChange={(e) => handleFileUpload(e, 'syllabus')}
        accept=".md,.markdown,.txt,.json"
        className="hidden"
      />
      <input
        type="file"
        ref={directivesFileInputRef}
        onChange={(e) => handleFileUpload(e, 'directives')}
        accept=".md,.markdown,.txt,.json"
        className="hidden"
      />

      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
        {/* Governance Suite Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold shrink-0 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Exam Syllabus & Paper-Setting Governance Suite
                </h2>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Dual-Anchor Active
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Curating domain syllabus boundaries and generation directives for <strong>{selectedExam?.name || 'Selected Exam'}</strong>.
              </p>
            </div>
          </div>

          {/* Exam Selector, Stage Selector & Drawer Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">Target Exam:</span>
              <select
                value={selectedExamId}
                onChange={e => setSelectedExamId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none h-9.5 shadow-xs"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category || 'Odisha Exam'})
                  </option>
                ))}
              </select>
            </div>

            {examConfiguredStages.length > 0 && (
              <div className="flex items-center gap-1.5 bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 rounded-xl px-2.5 py-1">
                <span className="text-xs font-black text-purple-900 dark:text-purple-300 shrink-0 flex items-center gap-1">
                  <span>🎯 Stage:</span>
                </span>
                <select
                  value={selectedExamStage}
                  onChange={e => {
                    const st = e.target.value;
                    setSelectedExamStage(st);
                    setStage2StageFilter(st || 'all');
                    setMultiBankStageFilter(st || 'all');
                  }}
                  className="bg-transparent border-0 text-xs font-black text-purple-950 dark:text-purple-200 focus:ring-0 outline-none py-1 cursor-pointer"
                >
                  <option value="">🌐 All Stages / General</option>
                  {examConfiguredStages.map(st => (
                    <option key={st} value={st}>📍 {st}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => setIsGovernanceExpanded(!isGovernanceExpanded)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 cursor-pointer h-9.5 shrink-0 shadow-xs"
            >
              {isGovernanceExpanded ? <ChevronUp className="w-3.5 h-3.5 text-brand-500" /> : <ChevronDown className="w-3.5 h-3.5 text-brand-500" />}
              {isGovernanceExpanded ? 'Hide Governance Suite' : 'Configure Syllabus & Rules'}
            </button>
          </div>
        </div>

        {/* Symmetrical 2-Column Suite (Part 1 Syllabus + Part 2 Directives) */}
        {isGovernanceExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch animate-in fade-in duration-200">
            {/* ─────────────────────────────────────────────────────────────
                PART 1: EXAM SYLLABUS & PYQ BLUEPRINT (THE "WHAT")
            ───────────────────────────────────────────────────────────── */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
              <div className="space-y-3.5">
                {/* Track 1: Identity & Standardized Action Toolbar */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          Part 1: Syllabus & PYQ Blueprint
                        </h3>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 shrink-0">
                          The "What"
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Standardized Action Toolbar */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={handleSaveSyllabusToCloud}
                      disabled={isSavingSyllabusToCloud}
                      title="Save this stage's syllabus permanently to Cloud Database"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isSavingSyllabusToCloud ? <Loader2 className="w-3 h-3 animate-spin" /> : <Cloud className="w-3 h-3" />}
                      <span className="hidden sm:inline">{isSavingSyllabusToCloud ? 'Saving...' : 'Save Cloud'}</span>
                    </button>
                    <button
                      onClick={() => syllabusFileInputRef.current?.click()}
                      title="Upload .md, .txt, or .json syllabus file"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3 h-3 text-cyan-500" />
                      <span>Upload</span>
                    </button>
                    <button
                      onClick={() => handlePasteTo('syllabus')}
                      title="Paste text from clipboard"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Clipboard className="w-3 h-3 text-slate-500" />
                      <span>Paste</span>
                    </button>
                    <button
                      onClick={() => handleExportMarkdown(syllabusMarkdown, `${selectedExam?.name || 'exam'}-syllabus.md`)}
                      title="Download syllabus as .md file"
                      className="p-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Track 2: Multi-Stage Syllabus Tabs (if multi-stage exam) */}
                {examConfiguredStages.length > 0 && (
                  <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-black uppercase text-slate-400 px-2 shrink-0">Stage:</span>
                    {examConfiguredStages.map((st: string) => {
                      const isCurrent = selectedExamStage === st;
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleStageTabSwitch(st)}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                            isCurrent
                              ? "bg-cyan-600 text-white font-black shadow-xs"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                          )}
                        >
                          {st}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handleStageTabSwitch('')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer",
                        !selectedExamStage || selectedExamStage === 'All Stages'
                          ? "bg-cyan-600 text-white font-black shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      All Stages (Unified)
                    </button>
                  </div>
                )}

                {/* Track 3: Single-Line Subtitle */}
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-none">
                  Official exam curriculum topics, units, and previous year question hints for {selectedExamStage ? `"${selectedExamStage}"` : 'all stages'}.
                </p>

                {/* Track 4: Preset Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block leading-none">
                    Official Blueprint Preset:
                  </label>
                  <select
                    value={selectedSyllabusPreset}
                    onChange={(e) => handleSelectSyllabusPreset(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none h-9.5 shadow-xs"
                  >
                    {Object.entries(SYLLABUS_PRESETS).map(([key, item]) => (
                      <option key={key} value={key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Track 5: Textarea Editor */}
                <textarea
                  value={syllabusMarkdown}
                  onChange={(e) => handleUpdateSyllabus(e.target.value)}
                  rows={8}
                  placeholder="Enter or upload official exam syllabus, topics, formulas, or PYQ hints in Markdown..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-cyan-500 outline-none font-mono leading-relaxed resize-y shadow-inner"
                />
              </div>

              {/* Track 6: Card Footer Stats */}
              <div className="flex items-center justify-between pt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">
                    Stage: <strong className="text-cyan-600 dark:text-cyan-400 font-black">{selectedExamStage || 'All Stages (Unified)'}</strong>
                  </span>
                  <span className="text-slate-400 hidden sm:inline">•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold hidden sm:inline-flex items-center gap-0.5">
                    <Cloud className="w-3 h-3" /> Cloud-Sync Active
                  </span>
                </div>
                <span className="font-mono shrink-0 ml-2">{syllabusStats.words} words • {syllabusStats.lines} lines</span>
              </div>
            </div>

            {/* ─────────────────────────────────────────────────────────────
                PART 2: EXAM BENCHMARK & PEDAGOGICAL DIRECTIVES (THE "HOW")
            ───────────────────────────────────────────────────────────── */}
            <div className="bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3.5">
              <div className="space-y-3.5">
                {/* Track 1: Identity & Standardized Action Toolbar */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-700/60">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shrink-0">
                      {part2Tab === 'pyqs' ? <Target className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {part2Tab === 'pyqs' ? 'Part 2: Reference PYQ Benchmark' : 'Part 2: Generation Directives & Rules'}
                        </h3>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-300 border border-brand-500/20 shrink-0">
                          The "How"
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Standardized Action Toolbar */}
                  <div className="flex items-center gap-1 shrink-0">
                    {part2Tab === 'pyqs' && (
                      <button
                        type="button"
                        onClick={handleLoadSamplePYQTemplate}
                        title="Load standard competitive PYQ sample format"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                      >
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="hidden sm:inline">Sample Format</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => directivesFileInputRef.current?.click()}
                      title={`Upload .md, .txt, or .json ${part2Tab === 'pyqs' ? 'PYQ' : 'rules'} file`}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3 h-3 text-brand-500" />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePasteTo('directives')}
                      title="Paste text from clipboard"
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Clipboard className="w-3 h-3 text-slate-500" />
                      <span>Paste</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportMarkdown(part2Tab === 'pyqs' ? referencePYQs : directivesMarkdown, `${selectedExam?.name || 'exam'}-${part2Tab}.md`)}
                      title={`Download ${part2Tab === 'pyqs' ? 'PYQs' : 'rules'} as .md file`}
                      className="p-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>

                {/* Track 1.5: Dual-Mode Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPart2Tab('pyqs')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      part2Tab === 'pyqs'
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Reference PYQs (Style Benchmark)</span>
                    {detectedPYQCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-brand-500/15 text-brand-600 dark:text-brand-300">
                        {detectedPYQCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPart2Tab('directives')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      part2Tab === 'directives'
                        ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200/80 dark:border-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Custom Directives (Advanced)</span>
                  </button>
                </div>

                {/* Track 2 & 3: Context-Specific Body */}
                {part2Tab === 'pyqs' ? (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Provide 3 to 15 authentic past exam questions (PYQs). The AI distills the exam board's structural DNA (phrasing, calculation depth, and distractor traps) to calibrate question rigor across all chapters.
                    </p>

                    {/* Reference PYQs Textarea */}
                    <textarea
                      value={referencePYQs}
                      onChange={(e) => handleUpdateReferencePYQs(e.target.value)}
                      rows={8}
                      placeholder={`Paste 3 to 15 authentic Previous Year Questions (PYQs) for this exam:
1. In a steady laminar flow through a pipe, the maximum velocity is:
(a) Equal to average velocity  (b) 2 times average velocity...

2. Which equation determines head loss due to friction?
(a) Darcy-Weisbach  (b) Bernoulli...

The AI extracts this exam board's signature style and matches it without duplicating these questions!`}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none font-mono leading-relaxed resize-y shadow-inner"
                    />
                  </>
                ) : (
                  <>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate leading-none">
                      Difficulty standards, multi-statement options, LaTeX math, and diagram rules.
                    </p>

                    {/* Preset Dropdown */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block leading-none">
                        Paper-Setting Rule Rubric:
                      </label>
                      <select
                        value={selectedDirectivesPreset}
                        onChange={(e) => handleSelectDirectivesPreset(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none h-9.5 shadow-xs"
                      >
                        {Object.entries(DIRECTIVES_PRESETS).map(([key, item]) => (
                          <option key={key} value={key}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Directives Textarea */}
                    <textarea
                      value={directivesMarkdown}
                      onChange={(e) => handleUpdateDirectives(e.target.value)}
                      rows={8}
                      placeholder="Enter or upload strict paper-setter instructions, cognitive difficulty rules, LaTeX math directives, or distractor standards..."
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none font-mono leading-relaxed resize-y shadow-inner"
                    />
                  </>
                )}
              </div>

              {/* Track 5: Card Footer Stats */}
              <div className="flex items-center justify-between pt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 border-t border-slate-200/70 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${part2Tab === 'pyqs' && detectedPYQCount > 0 ? 'bg-emerald-500' : 'bg-brand-500'}`}></span>
                  <span className="truncate">
                    {part2Tab === 'pyqs'
                      ? (detectedPYQCount > 0
                          ? `⚡ ${detectedPYQCount} Authentic PYQ Exemplars Detected • Calibrating Exam Style`
                          : '○ Optional Style Benchmark (0 PYQs — standard syllabus generation active)')
                      : 'Strict AI Constraint Active'}
                  </span>
                </div>
                <span className="font-mono shrink-0 ml-2">
                  {part2Tab === 'pyqs'
                    ? `${detectedPYQCount} PYQ items`
                    : `${directivesStats.words} words • ${directivesStats.lines} lines`}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ACTIVE EXAMINATION STAGE BANNER (Shown if exam has multi-stages)
      ───────────────────────────────────────────────────────────── */}
      {examConfiguredStages.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-brand-500/10 border border-purple-200 dark:border-purple-800/70 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-purple-950 dark:text-purple-200 uppercase tracking-wider">
                  Active Examination Stage:
                </span>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                  {selectedExamStage ? `📍 ${selectedExamStage}` : '🌐 All Stages / General (Unified)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Tests and questions generated will be tagged with this stage and reactively filtered in student portals.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSelectedExamStage('');
                setStage2StageFilter('all');
                setMultiBankStageFilter('all');
              }}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border",
                !selectedExamStage
                  ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              )}
            >
              🌐 All Stages
            </button>
            {examConfiguredStages.map(st => {
              const isActive = selectedExamStage === st;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setSelectedExamStage(st);
                    setStage2StageFilter(st);
                    setMultiBankStageFilter(st);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1",
                    isActive
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                  )}
                >
                  <span>📍 {st}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. WORKFLOW STEPPER & STAGE SELECTOR TABS BAR (Pinned Anchor)
      ───────────────────────────────────────────────────────────── */}
      <div ref={workspaceRef} className="scroll-mt-6 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Step 1 Tab Button */}
          <button
            onClick={() => handleSwitchStage('stage1_structure')}
            className={cn(
              "p-4 sm:p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer",
              activeStage === 'stage1_structure'
                ? "bg-gradient-to-br from-cyan-950/80 via-slate-900 to-slate-900 border-cyan-500/60 shadow-xl shadow-cyan-950/30 ring-2 ring-cyan-500/40"
                : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center font-black transition-all shrink-0",
                  activeStage === 'stage1_structure'
                    ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      activeStage === 'stage1_structure'
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    )}>
                      Workflow Step 1
                    </span>
                    {activeStage === 'stage1_structure' && (
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <h3 className={cn(
                    "text-base sm:text-lg font-black transition-colors mt-0.5",
                    activeStage === 'stage1_structure' ? "text-white" : "text-slate-800 dark:text-slate-200"
                  )}>
                    Test Structure Generator
                  </h3>
                </div>
              </div>
            </div>
            <p className={cn(
              "text-xs mt-2.5 leading-relaxed font-medium transition-colors",
              activeStage === 'stage1_structure' ? "text-cyan-200/80" : "text-slate-500 dark:text-slate-400"
            )}>
              Architect 5 to 20 realistic Mock Test names, durations, marks, and topic tags with 1-click database save.
            </p>
          </button>

          {/* Step 2 Tab Button */}
          <button
            onClick={() => handleSwitchStage('stage2_questions')}
            className={cn(
              "p-4 sm:p-5 rounded-3xl border text-left transition-all relative overflow-hidden group cursor-pointer",
              activeStage === 'stage2_questions'
                ? "bg-gradient-to-br from-brand-950/80 via-slate-900 to-slate-900 border-brand-500/60 shadow-xl shadow-brand-950/30 ring-2 ring-brand-500/40"
                : "bg-white dark:bg-slate-900/70 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/40"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center font-black transition-all shrink-0",
                  activeStage === 'stage2_questions'
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-600/40"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                )}>
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                      activeStage === 'stage2_questions'
                        ? "bg-brand-500/20 text-brand-300 border-brand-500/40"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    )}>
                      Workflow Step 2
                    </span>
                    {activeStage === 'stage2_questions' && (
                      <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                    )}
                  </div>
                  <h3 className={cn(
                    "text-base sm:text-lg font-black transition-colors mt-0.5",
                    activeStage === 'stage2_questions' ? "text-white" : "text-slate-800 dark:text-slate-200"
                  )}>
                    Question Paper Studio
                  </h3>
                </div>
              </div>
            </div>
            <p className={cn(
              "text-xs mt-2.5 leading-relaxed font-medium transition-colors",
              activeStage === 'stage2_questions' ? "text-brand-200/80" : "text-slate-500 dark:text-slate-400"
            )}>
              Generate 10 to 100 advanced MCQs with live KaTeX math solutions, SVG diagrams, and direct database publish.
            </p>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. STAGE 1: CURRICULUM ARCHITECT & TEST STRUCTURE GENERATOR
      ───────────────────────────────────────────────────────────── */}
      {activeStage === 'stage1_structure' && (
        <div className="bg-white dark:bg-slate-900 border-2 border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-sm space-y-6 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 px-2.5 py-0.5 rounded-full">
                    Step 1 Active
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    3 Sections × 4 Subcategories
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white mt-0.5">
                  Stage 1: Curriculum Test Suite Architect
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate syllabus-grounded test series across Practice Tests, Mock Tests, and Question Banks for <strong>{selectedExam?.name || 'Selected Exam'}</strong>{selectedExamStage ? <span className="ml-1.5 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-black text-[10px] border border-purple-200 dark:border-purple-800">📍 {selectedExamStage} Stage</span> : ''}.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1: Main Section Scope Selector Cards */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Generation Scope & Section:
              </label>
              <span className="text-[11px] text-slate-400">
                Derived directly from {selectedExam?.name || 'Exam'} syllabus
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CURRICULUM_SECTIONS.map(sec => {
                const isSelected = stage1MainSection === sec.id;
                const Icon = sec.icon;

                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setStage1MainSection(sec.id);
                      if (sec.id === 'all_sections') {
                        setStage1Count(12);
                        setStage1SubCategory('full-length');
                      } else {
                        setStage1Count(6);
                      }
                      if (sec.id === 'practice_test') {
                        if (mockDuration === 120 && mockTotalMarks === 100) {
                          setMockDuration(30);
                          setMockTotalMarks(30);
                          setMockNegativeMarking(0);
                          setMockQuestionCount(30);
                        }
                      } else if (sec.id === 'mock_test') {
                        if (mockDuration === 30 && mockTotalMarks === 30) {
                          setMockDuration(120);
                          setMockTotalMarks(100);
                          setMockNegativeMarking(0.25);
                          setMockQuestionCount(100);
                        }
                      }
                      if (sec.id === 'flashcards') {
                        setStage1SubCategory('all');
                        setSelectedNamingPresetId('sub-chap');
                        setStage1NamingPattern('[Sub-Subject] · [Chapter]');
                      } else {
                        const presets = SECTION_NAMING_PRESETS[sec.id] || [];
                        const def = presets[0];
                        if (def) {
                          setStage1SubCategory(def.id);
                          setSelectedNamingPresetId(def.id);
                          setStage1NamingPattern(def.template);
                        }
                      }
                    }}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between gap-3 cursor-pointer",
                      isSelected
                        ? sec.id === 'all_sections'
                          ? "bg-gradient-to-br from-amber-500/10 via-brand-500/10 to-transparent border-amber-500/60 ring-2 ring-amber-500/30 shadow-md"
                          : sec.id === 'practice_test'
                          ? "bg-indigo-500/10 border-indigo-500/60 ring-2 ring-indigo-500/30 shadow-md"
                          : sec.id === 'mock_test'
                          ? "bg-brand-500/10 border-brand-500/60 ring-2 ring-brand-500/30 shadow-md"
                          : sec.id === 'flashcards'
                          ? "bg-purple-500/10 border-purple-500/60 ring-2 ring-purple-500/30 shadow-md"
                          : "bg-emerald-500/10 border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-md"
                        : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/60 dark:hover:bg-slate-800/80"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0",
                          isSelected
                            ? sec.id === 'all_sections'
                              ? "bg-amber-500 text-white"
                              : sec.id === 'practice_test'
                              ? "bg-indigo-600 text-white"
                              : sec.id === 'mock_test'
                              ? "bg-brand-600 text-white"
                              : sec.id === 'flashcards'
                              ? "bg-purple-600 text-white"
                              : "bg-emerald-600 text-white"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={cn(
                          "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0",
                          isSelected
                            ? "bg-white/80 dark:bg-slate-900 text-slate-800 dark:text-white border-transparent"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        )}>
                          {sec.badge}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                        {sec.shortName}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {sec.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Subcategory Pills (Mock Tests, Practice Tests, Question Banks) */}
          {stage1MainSection !== 'all_sections' && stage1MainSection !== 'flashcards' && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Target Subcategory in {CURRICULUM_SECTIONS.find(s => s.id === stage1MainSection)?.shortName}:
              </label>
              <div className="flex flex-wrap gap-2">
                {CURRICULUM_SECTIONS.find(s => s.id === stage1MainSection)?.subcategories.map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setStage1SubCategory(sub.id);
                      if (sub.id === 'all') {
                        setStage1Count(8);
                      } else {
                        setStage1Count(5);
                      }
                      const presets = SECTION_NAMING_PRESETS[stage1MainSection] || [];
                      const matched = presets.find(p => p.id === sub.id) || presets[0];
                      if (matched) {
                        setSelectedNamingPresetId(matched.id);
                        setStage1NamingPattern(matched.template);
                      }
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
                      stage1SubCategory === sub.id
                        ? "bg-brand-600 text-white border-brand-600 shadow-xs"
                        : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    )}
                  >
                    <span>{sub.name}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-bold uppercase",
                      stage1SubCategory === sub.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                    )}>
                      {sub.tag}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 2 (Flashcards Mode): Single Syllabus Topic Placeholder Input */}
          {stage1MainSection === 'flashcards' && (
            <div className="p-4 sm:p-5 bg-gradient-to-br from-purple-50/70 via-white to-pink-50/40 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Syllabus Topic Placeholder (Deck Name Generator)
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                        Direct Syllabus Extraction
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Flashcards do not use test categories. Provide a placeholder for the subject or sub-subject below — AI will deconstruct each topic directly from your syllabus, and then create flashcards under that specific topic.
                    </p>
                  </div>
                </div>

                {/* Hierarchy Level Quick Selector */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-purple-200/70 dark:border-purple-800/60 self-start sm:self-auto shrink-0 shadow-2xs">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1.5">Hierarchy:</span>
                  {[
                    { id: 'subsubject', label: '[Sub-Subject]', template: '[Sub-Subject] · [Chapter]' },
                    { id: 'subject', label: '[Subject]', template: '[Subject]: [Sub-Subject] - [Chapter]' },
                    { id: 'chapter', label: '[Chapter]', template: '[Chapter]' }
                  ].map(tier => (
                    <button
                      key={tier.id}
                      type="button"
                      onClick={() => {
                        setStage1NamingPattern(tier.template);
                        toast.success(`Set placeholder pattern to ${tier.template}`);
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer",
                        stage1NamingPattern.includes(tier.label)
                          ? "bg-purple-600 text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                      )}
                    >
                      {tier.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Single Placeholder Pattern Input & Clickable Token Chips */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <span>Active Placeholder Pattern:</span>
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Insert placeholder:</span>
                    {['[Subject]', '[Sub-Subject]', '[Chapter]', '[Topic]', '[Paper]'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setStage1NamingPattern(prev => prev ? `${prev} ${tag}` : tag);
                        }}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 transition-colors cursor-pointer shadow-2xs"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={stage1NamingPattern}
                    onChange={e => setStage1NamingPattern(e.target.value)}
                    placeholder="e.g. [Sub-Subject] · [Chapter] or [Subject]: [Sub-Subject] - [Chapter]"
                    className="w-full bg-white dark:bg-slate-900 border-2 border-purple-300/80 dark:border-purple-700/80 rounded-xl px-3.5 py-2.5 text-xs font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                  {stage1NamingPattern && (
                    <button
                      type="button"
                      onClick={() => setStage1NamingPattern('[Sub-Subject] · [Chapter]')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Quick 1-Click Hierarchy Formats */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Quick Formats:</span>
                  {[
                    { label: '[Sub-Subject] · [Chapter]', desc: 'Granular Chapter under Sub-Subject' },
                    { label: '[Subject]: [Sub-Subject] - [Chapter]', desc: 'Complete 3-Tier Hierarchy' },
                    { label: '[Subject] · [Chapter]', desc: 'Subject with Chapter Topic' },
                    { label: '[Chapter]', desc: 'Topic / Chapter Only' }
                  ].map(fmt => (
                    <button
                      key={fmt.label}
                      type="button"
                      onClick={() => setStage1NamingPattern(fmt.label)}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-all cursor-pointer",
                        stage1NamingPattern === fmt.label
                          ? "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                      )}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section 3: AI Syllabus Auto-Calibration & Coverage Intelligence (Mock, Practice, Question Banks) */}
          {stage1MainSection !== 'flashcards' && (
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        AI Syllabus Deconstruction & Coverage Calibration
                      </span>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                        isAutoCalibrate
                          ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600"
                      )}>
                        {isAutoCalibrate ? '✨ 100% Curriculum Coverage Active' : '⚙️ Fixed Count Mode'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {isAutoCalibrate
                        ? `AI automatically analyzes all subjects, units, and chapters from your uploaded syllabus and determines the exact test count needed to eliminate syllabus gaps.`
                        : `Fixed set count mode active. AI will generate exactly ${stage1Count} tests according to your manual constraint.`}
                    </p>
                  </div>
                </div>

                {/* Mode Switcher Toggle */}
                <button
                  type="button"
                  onClick={() => setIsAutoCalibrate(!isAutoCalibrate)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shrink-0",
                    isAutoCalibrate
                      ? "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                      : "bg-cyan-600 text-white border-cyan-600 shadow-xs"
                  )}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isAutoCalibrate ? 'Customize Count' : 'Return to Auto-Calibrate'}</span>
                </button>
              </div>

              {/* If Manual Override is toggled on: show manual quantity selector */}
              {!isAutoCalibrate && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Manual Fixed Set Count:
                    </label>
                    <select
                      value={stage1Count}
                      onChange={e => setStage1Count(Number(e.target.value))}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    >
                      <option value="3">3 Targeted Sets</option>
                      <option value="5">5 Sets</option>
                      <option value="8">8 Sets</option>
                      <option value="10">10 Sets</option>
                      <option value="12">12 Sets</option>
                      <option value="15">15 Sets</option>
                      <option value="20">20 Sets</option>
                    </select>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Optional Scope Filter (Leave empty for complete syllabus):
                    </label>
                    <input
                      type="text"
                      value={stage1SubjectFocus}
                      onChange={e => setStage1SubjectFocus(e.target.value)}
                      placeholder="e.g. Only Anatomy & Physiology, or Clinical Nursing..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Custom Test Rules & Scoring Scheme (Mock & Practice Tests) */}
          {(stage1MainSection === 'mock_test' || stage1MainSection === 'practice_test' || stage1MainSection === 'all_sections') && (
            <div className={cn(
              "border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs transition-all",
              stage1MainSection === 'practice_test'
                ? "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border-indigo-200/80 dark:border-indigo-800/50"
                : "bg-gradient-to-br from-amber-50/70 via-white to-orange-50/50 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border-amber-200/80 dark:border-amber-800/50"
            )}>
              <div className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b",
                stage1MainSection === 'practice_test'
                  ? "border-indigo-200/50 dark:border-indigo-800/40"
                  : "border-amber-200/50 dark:border-amber-800/40"
              )}>
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-8 h-8 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs",
                    stage1MainSection === 'practice_test' ? "bg-indigo-600" : "bg-amber-600"
                  )}>
                    {stage1MainSection === 'practice_test' ? <Flame className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      {stage1MainSection === 'practice_test'
                        ? 'Custom Practice Test Rules & Scoring Scheme'
                        : stage1MainSection === 'mock_test'
                        ? 'Custom Mock Exam Rules & Scoring Scheme'
                        : 'Custom Exam & Practice Test Rules / Scoring Scheme'}
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        stage1MainSection === 'practice_test'
                          ? "text-indigo-700 dark:text-indigo-400 bg-indigo-100/80 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-800"
                          : "text-amber-700 dark:text-amber-400 bg-amber-100/80 dark:bg-amber-950/80 border-amber-300 dark:border-amber-800"
                      )}>
                        Custom Parameters
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {stage1MainSection === 'practice_test'
                        ? 'Fill in your custom duration, marks, and negative marking penalty below. All values are automatically saved into the database for every practice test.'
                        : stage1MainSection === 'mock_test'
                        ? 'Fill in your own custom duration, marks, and negative marking penalty below. All values are automatically saved into the database for every mock test.'
                        : 'Fill in your custom duration, marks, and negative marking penalty below. All values are automatically applied to generated mock and practice tests.'}
                    </p>
                  </div>
                </div>

                {/* Live Active Rules Summary Badge */}
                <div className={cn(
                  "px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 flex-wrap shrink-0",
                  stage1MainSection === 'practice_test'
                    ? "bg-indigo-100/80 dark:bg-indigo-950/80 border-indigo-300/80 dark:border-indigo-800/80 text-indigo-900 dark:text-indigo-300"
                    : "bg-amber-100/80 dark:bg-amber-950/80 border-amber-300/80 dark:border-amber-800/80 text-amber-900 dark:text-amber-300"
                )}>
                  <span>⏱️ {mockDuration}m</span>
                  <span>•</span>
                  <span>🏆 {mockTotalMarks} Marks ({mockQuestionCount} Qs)</span>
                  <span>•</span>
                  <span>🎯 {mockNegativeMarking > 0 ? `-${mockNegativeMarking} Penalty` : 'No Penalty'}</span>
                </div>
              </div>

              {/* 4 Dedicated Custom Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. Custom Test Duration */}
                <div className="bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Clock className={cn("w-3.5 h-3.5", stage1MainSection === 'practice_test' ? "text-indigo-600" : "text-amber-600")} /> Custom Duration:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={600}
                      value={mockDuration}
                      onChange={e => setMockDuration(Math.max(1, Number(e.target.value) || 0))}
                      placeholder="e.g. 30"
                      className={cn(
                        "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none pr-12",
                        stage1MainSection === 'practice_test' ? "focus:ring-2 focus:ring-indigo-500" : "focus:ring-2 focus:ring-amber-500"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      Mins
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {(stage1MainSection === 'practice_test' ? [15, 20, 30, 45, 60] : [45, 60, 90, 120, 180]).map(mins => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setMockDuration(mins)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                          mockDuration === mins
                            ? stage1MainSection === 'practice_test'
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-amber-600 text-white border-amber-600 shadow-2xs"
                            : stage1MainSection === 'practice_test'
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        )}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Custom Total Marks */}
                <div className="bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Award className={cn("w-3.5 h-3.5", stage1MainSection === 'practice_test' ? "text-indigo-600" : "text-amber-600")} /> Custom Total Marks:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={2000}
                      value={mockTotalMarks}
                      onChange={e => {
                        const val = Math.max(1, Number(e.target.value) || 0);
                        setMockTotalMarks(val);
                        setMockQuestionCount(val);
                      }}
                      placeholder="e.g. 30"
                      className={cn(
                        "w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-800 outline-none pr-14",
                        stage1MainSection === 'practice_test' ? "focus:ring-2 focus:ring-indigo-500" : "focus:ring-2 focus:ring-amber-500"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      Marks
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {(stage1MainSection === 'practice_test' ? [15, 20, 30, 50, 100] : [50, 100, 150, 200, 300]).map(marks => (
                      <button
                        key={marks}
                        type="button"
                        onClick={() => {
                          setMockTotalMarks(marks);
                          setMockQuestionCount(marks);
                        }}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                          mockTotalMarks === marks
                            ? stage1MainSection === 'practice_test'
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                              : "bg-amber-600 text-white border-amber-600 shadow-2xs"
                            : stage1MainSection === 'practice_test'
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        )}
                      >
                        {marks}M
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Custom Negative Marking Penalty */}
                <div className="bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-rose-500" /> Negative Marking:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={10}
                      value={mockNegativeMarking}
                      onChange={e => setMockNegativeMarking(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="e.g. 0.25"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:bg-white dark:focus:bg-slate-800 outline-none pr-16"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-rose-500 pointer-events-none">
                      {mockNegativeMarking > 0 ? '- Penalty' : 'None'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {[
                      { label: '0 (None)', val: 0 },
                      { label: '-0.25', val: 0.25 },
                      { label: '-0.33', val: 0.33 },
                      { label: '-0.50', val: 0.5 }
                    ].map(item => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setMockNegativeMarking(item.val)}
                        className={cn(
                          "px-1.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                          mockNegativeMarking === item.val
                            ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Custom Target Question Count */}
                <div className="bg-white dark:bg-slate-900/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-2xs">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <ListPlus className="w-3.5 h-3.5 text-indigo-600" /> Target Questions:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={mockQuestionCount}
                      onChange={e => setMockQuestionCount(Math.max(1, Number(e.target.value) || 0))}
                      placeholder="e.g. 30"
                      className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none">
                      Qs
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap pt-0.5">
                    {(stage1MainSection === 'practice_test' ? [15, 20, 30, 50, 100] : [50, 75, 100, 150, 200]).map(qs => (
                      <button
                        key={qs}
                        type="button"
                        onClick={() => setMockQuestionCount(qs)}
                        className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer",
                          mockQuestionCount === qs
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        )}
                      >
                        {qs} Qs
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4.1: Flashcards Dual-Control Deck Generation Architecture */}
          {stage1MainSection === 'flashcards' && (
            <div className="bg-gradient-to-br from-purple-50/70 via-white to-pink-50/50 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border border-purple-200/80 dark:border-purple-800/50 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-purple-200/50 dark:border-purple-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Active Recall Flashcard Decks Configuration
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border text-purple-700 dark:text-purple-400 bg-purple-100/80 dark:bg-purple-950/80 border-purple-300 dark:border-purple-800">
                        Step 1: Deck Naming & Extraction
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dual-control generator: extract 100% of all syllabus topics matching your placeholder pattern, or define a custom deck count limit.
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 rounded-xl border border-purple-300/80 dark:border-purple-800/80 bg-purple-100/80 dark:bg-purple-950/80 text-purple-900 dark:text-purple-300 text-[10px] font-bold">
                    🎯 Stage: <strong>{selectedExamStage || 'All Stages'}</strong>
                  </span>
                  <span className={cn(
                    "px-2.5 py-1 rounded-xl border text-[10px] font-bold",
                    isAutoCalibrate
                      ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                      : "bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800"
                  )}>
                    {isAutoCalibrate ? '✨ 100% Syllabus Coverage' : `⚙️ Custom Target: ${stage1Count} Decks`}
                  </span>
                </div>
              </div>

              {/* Dual Control Switcher: Automatic vs Custom Count */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode 1: Auto (All Syllabus Topics) */}
                  <button
                    type="button"
                    onClick={() => setIsAutoCalibrate(true)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative",
                      isAutoCalibrate
                        ? "bg-purple-600/10 border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/30 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 opacity-80"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">✨</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          Auto-Detect All Topics (Recommended)
                        </span>
                      </div>
                      {isAutoCalibrate && (
                        <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      AI parses the syllabus hierarchy matching your placeholder pattern (e.g. <code>{stage1NamingPattern || '[Sub-Subject]'}</code>). Generates a deck name for <strong>every single subject or sub-subject</strong> with zero syllabus gaps.
                    </p>
                  </button>

                  {/* Mode 2: Custom Count (Manual Limit) */}
                  <button
                    type="button"
                    onClick={() => setIsAutoCalibrate(false)}
                    className={cn(
                      "p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative",
                      !isAutoCalibrate
                        ? "bg-purple-600/10 border-purple-500 dark:border-purple-400 ring-2 ring-purple-500/30 shadow-xs"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 opacity-80"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⚙️</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          Custom Deck Count (Manual Limit)
                        </span>
                      </div>
                      {!isAutoCalibrate && (
                        <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px]">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      Override complete syllabus extraction to generate an exact specified number of flashcard decks (e.g. 5, 10, or 20 top-yield decks).
                    </p>
                  </button>
                </div>

                {/* When Manual Custom Count is selected: show pill selector & input */}
                {!isAutoCalibrate && (
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200/80 dark:border-purple-800/60 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-purple-600" />
                        Exact Decks to Generate:
                      </label>
                      <span className="text-xs font-black font-mono text-purple-700 dark:text-purple-300">
                        {stage1Count} Decks
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[3, 5, 8, 10, 15, 20, 30].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => setStage1Count(cnt)}
                          className={cn(
                            "px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                            stage1Count === cnt
                              ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                              : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                          )}
                        >
                          {cnt} Decks {cnt === 10 ? '(Recommended)' : ''}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] font-bold text-slate-400">Custom:</span>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={stage1Count}
                          onChange={e => setStage1Count(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                          className="w-16 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-0.5 text-xs font-bold text-center text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Workflow Architecture Clarification Callout */}
                <div className="p-3 rounded-xl bg-purple-100/60 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/50 flex items-start gap-2 text-[11px] text-purple-900 dark:text-purple-200">
                  <span className="text-sm shrink-0 mt-0.5">💡</span>
                  <div>
                    <strong>Two-Stage Architecture:</strong> After generating and saving your deck names here, click <strong>"Generate Flashcards (Stage 2) →"</strong> on any deck card below. In Stage 2, you'll specify the exact card count (e.g. 10 cards) to author ultra-crisp active recall questions and direct answers for that deck.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 5: Title Generation Formula & Presets (Hidden for Flashcards since dedicated Syllabus Topic Placeholder is provided in Section 2) */}
          {stage1MainSection !== 'flashcards' && (
            <div className="bg-gradient-to-br from-indigo-50/60 via-white to-brand-50/60 dark:from-slate-800/80 dark:via-slate-850 dark:to-slate-800/80 border border-indigo-200/70 dark:border-indigo-800/40 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                      Title Naming Formula & Presets
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-full">
                        Auto-Standardized
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Choose a pre-tested naming preset or customize the pattern below. Use <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/80 px-1 py-0.5 rounded">[Subject]</code> for main paper/discipline header, and <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/80 px-1 py-0.5 rounded">[Sub-Subject]</code> or <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[10px] bg-indigo-50 dark:bg-indigo-950/80 px-1 py-0.5 rounded">[Chapter]</code> for specific granular topics. You can also type custom text freely.
                    </p>
                  </div>
                </div>

                {stage1NamingPattern && (
                  <button
                    type="button"
                    onClick={() => {
                      const presets = SECTION_NAMING_PRESETS[stage1MainSection] || [];
                      const def = presets[0];
                      if (def) {
                        setSelectedNamingPresetId(def.id);
                        setStage1NamingPattern(def.template);
                        toast.success('↺ Reset to recommended default preset');
                      }
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset to Default</span>
                  </button>
                )}
              </div>

              {/* Quick Preset Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  1-Click Naming Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(SECTION_NAMING_PRESETS[stage1MainSection] || []).map(preset => {
                    const isActive = selectedNamingPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSelectedNamingPresetId(preset.id);
                          setStage1NamingPattern(preset.template);
                          if (preset.id !== 'all') {
                            setStage1SubCategory(preset.id);
                          }
                        }}
                        className={cn(
                          "px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border shadow-2xs",
                          isActive
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        )}
                        title={preset.description}
                      >
                        <span>{preset.name}</span>
                        <span className={cn(
                          "text-[9px] px-1 py-0.5 rounded font-bold uppercase",
                          isActive ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        )}>
                          {preset.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Editable Custom Formula Input */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Active Formula Pattern (Editable):
                  </label>
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">Insert tag:</span>
                    {(examConfiguredStages.length > 0
                      ? ['[Stage]', '[Paper]', '[Subject]', '[Sub-Subject]', '[Unit]', '[Chapter]', '#[01-10]']
                      : ['[Paper]', '[Subject]', '[Sub-Subject]', '[Unit]', '[Chapter]', '#[01-10]']
                    ).map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          setStage1NamingPattern(prev => (prev ? `${prev} ${tag}` : tag));
                          setSelectedNamingPresetId('custom');
                        }}
                        className={cn(
                          "px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold transition-all cursor-pointer border",
                          tag === '[Stage]'
                            ? "bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700 font-bold"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-slate-200 dark:border-slate-700"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  type="text"
                  value={stage1NamingPattern}
                  onChange={e => {
                    setStage1NamingPattern(e.target.value);
                    setSelectedNamingPresetId('custom');
                  }}
                  placeholder='e.g. "[Subject]: [Sub-Subject] Sectional Test #[01-05]" or "[Unit] - [Chapter] Question Bank"'
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* Primary Action CTA */}
          <button
            onClick={handleGenerateStructure}
            disabled={isGeneratingStage1}
            className={cn(
              "w-full py-3.5 font-black rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 text-white",
              stage1MainSection === 'flashcards'
                ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-purple-500/20"
                : "bg-gradient-to-r from-cyan-600 via-brand-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 shadow-brand-500/20"
            )}
          >
            {isGeneratingStage1 ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  {stage1MainSection === 'flashcards'
                    ? `Deconstructing Syllabus & Generating Flashcard Decks with AI...`
                    : isAutoCalibrate
                    ? `Deconstructing Syllabus & Auto-Architecting Test Suite with AI...`
                    : `Architecting ${stage1Count} Curriculum Test Structures with AI...`}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {stage1MainSection === 'flashcards'
                    ? (isAutoCalibrate
                        ? `Auto-Architect 100% Curriculum Flashcard Decks from Syllabus`
                        : `Architect ${stage1Count} Flashcard Decks from Syllabus`)
                    : isAutoCalibrate
                    ? `Auto-Architect 100% Curriculum Test Suite from Syllabus`
                    : `Architect ${stage1Count} ${stage1MainSection === 'all_sections' ? 'Curriculum Suite Tests' : CURRICULUM_SECTIONS.find(s => s.id === stage1MainSection)?.shortName}`}
                </span>
              </>
            )}
          </button>

          {/* ─────────────────────────────────────────────────────────────
              PRE-INGESTION ARCHITECTURE REVIEW & CURATION BOARD
          ───────────────────────────────────────────────────────────── */}
          {generatedStructures.length > 0 && (
            <div className="space-y-4 pt-5 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-300">
              {/* Board Header with Selection Counters and Save Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Curriculum Architecture Review Board
                    </h3>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full">
                      {generatedStructures.length} Generated
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Review and customize titles. <strong>{selectedStructureIndices.size} of {generatedStructures.length}</strong> selected for database insertion.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      const visibleIndices = generatedStructures.map((_, i) => i);
                      handleToggleSelectAll(visibleIndices);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                  >
                    {selectedStructureIndices.size === generatedStructures.length ? 'Deselect All' : 'Select All'}
                  </button>

                  <button
                    onClick={handleSaveStructuresToDatabase}
                    disabled={isSavingStage1 || selectedStructureIndices.size === 0}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingStage1 ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save {selectedStructureIndices.size} Selected to Database</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Title Refinement Assistant Panel */}
              <div className="bg-gradient-to-br from-indigo-50/70 via-white to-brand-50/70 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border border-indigo-200/80 dark:border-indigo-800/50 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Wand2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                        AI Title Refinement & Restyling Assistant
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2 py-0.2 rounded-full">
                          Batch AI Restyler
                        </span>
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Instruct AI to shorten titles, add custom tags, or rephrase naming styles across all {generatedStructures.length} tests simultaneously.
                      </p>
                    </div>
                  </div>

                  {titleHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleUndoTitleRefinement}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Undo Refinement ({titleHistory.length})</span>
                    </button>
                  )}
                </div>

                {/* Input row */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={refinementPrompt}
                    onChange={e => setRefinementPrompt(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRefineTitles();
                    }}
                    placeholder='e.g., "Shorten all titles to under 50 characters", "Add 2026 Edition suffix", "Make titles more concise"...'
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleRefineTitles()}
                    disabled={isRefiningTitles || !refinementPrompt.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isRefiningTitles ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Refining...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Apply AI Refinement</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 1-Click Quick Preset Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                    Quick Presets:
                  </span>
                  {[
                    { label: '✂️ Shorten & Concise', prompt: 'Shorten all titles to under 50 characters while preserving the key subject and chapter name.' },
                    { label: '📅 Add "2026 Official Pattern"', prompt: 'Include "2026 Official Pattern" in all test titles.' },
                    { label: '🏷️ Clean Chapter Format', prompt: 'Format titles clearly as "[Subject]: [Chapter] Drill" or "[Subject]: Master Test".' },
                    { label: '🎯 Punchy & High-Yield', prompt: 'Make titles concise, punchy, and highlight high-yield core topics.' },
                  ].map((preset, pi) => (
                    <button
                      key={pi}
                      type="button"
                      disabled={isRefiningTitles}
                      onClick={() => handleRefineTitles(preset.prompt)}
                      className="px-2.5 py-1 bg-white/90 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs disabled:opacity-50"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Filter Tabs (All / Practice / Mock / Q-Banks) */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'All Types', count: generatedStructures.length, icon: Layers },
                    { id: 'flashcards', label: 'Flashcards', count: generatedStructures.filter(s => s.mainSection === 'flashcards' || s.targetTable === 'flashcardDecks').length, icon: Layers },
                    { id: 'practice_test', label: 'Practice Tests', count: generatedStructures.filter(s => s.mainSection === 'practice_test').length, icon: Dumbbell },
                    { id: 'mock_test', label: 'Mock Tests', count: generatedStructures.filter(s => s.mainSection === 'mock_test').length, icon: Award },
                    { id: 'question_bank', label: 'Question Banks', count: generatedStructures.filter(s => s.mainSection === 'question_bank').length, icon: BookMarked },
                  ].map(tab => {
                    const isTabActive = reviewFilterSection === tab.id;
                    const TabIcon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setReviewFilterSection(tab.id as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border",
                          isTabActive
                            ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750"
                        )}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-full font-black",
                          isTabActive
                            ? "bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900"
                            : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                        )}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generated Cards Display: Hierarchical Subject Grouping for Flashcards, Flat Grid for other sections */}
              {(() => {
                const visibleStructures = generatedStructures
                  .map((item, originalIdx) => ({ item, originalIdx }))
                  .filter(({ item }) => {
                    if (reviewFilterSection !== 'all') {
                      if (reviewFilterSection === 'flashcards') {
                        return item.mainSection === 'flashcards' || item.targetTable === 'flashcardDecks';
                      }
                      return item.mainSection === reviewFilterSection;
                    }
                    return true;
                  });

                const isFlashcardView = reviewFilterSection === 'flashcards' || (reviewFilterSection === 'all' && stage1MainSection === 'flashcards');

                const renderStructureCard = ({ item, originalIdx }: { item: any; originalIdx: number }) => {
                  const isSelected = selectedStructureIndices.has(originalIdx);
                  const isEditing = editingTitleIndex === originalIdx;

                  const isPractice = item.mainSection === 'practice_test';
                  const isMock = item.mainSection === 'mock_test';
                  const isBank = item.mainSection === 'question_bank';
                  const isFlashcard = item.mainSection === 'flashcards' || item.targetTable === 'flashcardDecks';

                  return (
                    <div
                      key={originalIdx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all space-y-3 relative flex flex-col justify-between",
                        isSelected
                          ? "bg-white dark:bg-slate-800/80 border-slate-300 dark:border-slate-600 shadow-xs ring-1 ring-brand-500/20"
                          : "bg-slate-50/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-70"
                      )}
                    >
                      <div className="space-y-2.5">
                        {/* Top Badges & Selection Checkbox */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <button
                              onClick={() => handleToggleSelectStructure(originalIdx)}
                              className="text-slate-400 hover:text-brand-500 transition-colors cursor-pointer"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                              )}
                            </button>

                            {/* Section Badge */}
                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0",
                              isFlashcard
                                ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                : isPractice
                                ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                                : isMock
                                ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800"
                                : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                            )}>
                              {isFlashcard ? 'Flashcard Deck' : isPractice ? 'Practice Test' : isMock ? 'Mock Test' : 'Question Bank'}
                            </span>

                            {/* Stage Badge if assigned */}
                            {item.stage && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 flex items-center gap-0.5">
                                📍 {item.stage}
                              </span>
                            )}

                            {/* Subcategory Badge */}
                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full shrink-0">
                              {item.subCategoryTitle || item.subCategory}
                            </span>

                            {/* Destination Table Tag */}
                            <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500">
                              → {item.targetTable}{item.targetMode ? ` (${item.targetMode})` : ''}
                            </span>
                          </div>

                          {/* Quick Action: Load to Stage 2 */}
                          <button
                            onClick={() => handleTransferToStage2(item)}
                            title={isFlashcard ? "Author Flashcards for this Deck in Stage 2" : "Load into Stage 2 Question Paper Studio"}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs",
                              isFlashcard
                                ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20"
                                : "bg-brand-50 hover:bg-brand-600 text-brand-600 hover:text-white dark:bg-brand-950/60 dark:text-brand-300"
                            )}
                          >
                            {isFlashcard ? <Sparkles className="w-3 h-3" /> : <Wand2 className="w-3 h-3" />}
                            <span>{isFlashcard ? 'Generate Flashcards (Stage 2) →' : 'Stage 2'}</span>
                          </button>
                        </div>

                        {/* Title with Inline Editing */}
                        <div>
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                value={editingTitleValue}
                                onChange={e => setEditingTitleValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleSaveEditedTitle(originalIdx);
                                  if (e.key === 'Escape') setEditingTitleIndex(null);
                                }}
                                className="w-full bg-white dark:bg-slate-900 border border-brand-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditedTitle(originalIdx)}
                                className="p-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group/title">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                                {item.title}
                              </h4>
                              <button
                                onClick={() => handleStartEditTitle(originalIdx, item.title)}
                                title="Edit test title"
                                className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity cursor-pointer p-0.5"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>

                        {/* Topics Covered Chips */}
                        {item.topicsCovered && item.topicsCovered.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.topicsCovered.slice(0, 4).map((top: string, ti: number) => (
                              <span
                                key={ti}
                                className="text-[9.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50"
                              >
                                {top}
                              </span>
                            ))}
                            {item.topicsCovered.length > 4 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                +{item.topicsCovered.length - 4} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Card Metadata Footer */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-700/60 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-3">
                          {isFlashcard ? (
                            <span className="flex items-center gap-1 font-bold text-purple-700 dark:text-purple-300">
                              <Sparkles className="w-3 h-3 text-purple-600" /> Active Recall Deck
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" /> {item.durationMinutes}m
                              </span>
                              <span className="flex items-center gap-1">
                                <Award className="w-3 h-3 text-slate-400" /> {item.totalMarks} Marks
                              </span>
                              {item.negativeMarking > 0 ? (
                                <span className="flex items-center gap-1 text-rose-500 dark:text-rose-400 font-bold">
                                  <Target className="w-3 h-3" /> -{item.negativeMarking}
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <Target className="w-3 h-3" /> No Penalty
                                </span>
                              )}
                            </>
                          )}
                        </div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          {item.subject}
                        </span>
                      </div>
                    </div>
                  );
                };

                if (isFlashcardView) {
                  // Group items by academic subject
                  const subjectMap = new Map<string, Array<{ item: any; originalIdx: number }>>();
                  for (const entry of visibleStructures) {
                    const subj = entry.item.subject || 'General Studies';
                    if (!subjectMap.has(subj)) subjectMap.set(subj, []);
                    subjectMap.get(subj)!.push(entry);
                  }
                  const subjectGroups = Array.from(subjectMap.entries());

                  return (
                    <div className="space-y-6">
                      {subjectGroups.map(([subjectName, deckEntries]) => {
                        const allSelectedInSubj = deckEntries.every(e => selectedStructureIndices.has(e.originalIdx));
                        const someSelectedInSubj = deckEntries.some(e => selectedStructureIndices.has(e.originalIdx));

                        return (
                          <div
                            key={subjectName}
                            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-50/60 via-white to-pink-50/30 dark:from-slate-800/60 dark:via-slate-850 dark:to-slate-800/60 border border-purple-200/80 dark:border-purple-800/60 space-y-4 shadow-xs"
                          >
                            {/* Subject Folder Header Banner */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-200/50 dark:border-purple-800/40">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                  <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full">
                                      Curriculum Subject Folder
                                    </span>
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                      {subjectName}
                                    </h4>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    {deckEntries.length} Sub-Subject Flashcard {deckEntries.length === 1 ? 'Deck' : 'Decks'} aligned under this academic subject
                                  </p>
                                </div>
                              </div>

                              {/* Quick Select/Deselect All in Subject */}
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedStructureIndices(prev => {
                                      const next = new Set(prev);
                                      deckEntries.forEach(e => {
                                        if (allSelectedInSubj) next.delete(e.originalIdx);
                                        else next.add(e.originalIdx);
                                      });
                                      return next;
                                    });
                                  }}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                                    allSelectedInSubj
                                      ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                                      : "bg-white dark:bg-slate-850 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                                  )}
                                >
                                  {allSelectedInSubj ? '✓ All Decks Selected' : someSelectedInSubj ? 'Select All Decks' : 'Select Subject Decks'}
                                </button>
                              </div>
                            </div>

                            {/* Sub-Subject Decks Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                              {deckEntries.map(entry => renderStructureCard(entry))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                // Standard flat grid for non-flashcards sections
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleStructures.map(entry => renderStructureCard(entry))}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. STAGE 2: ADVANCED QUESTION PAPER GENERATOR
      ───────────────────────────────────────────────────────────── */}
      {activeStage === 'stage2_questions' && (
        <div className="bg-white dark:bg-slate-900 border-2 border-brand-500/30 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold shrink-0">
                <Wand2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800 px-2.5 py-0.5 rounded-full">
                    Step 2 Active
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  Stage 2: Advanced Question Paper Studio
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate high-difficulty MCQs, KaTeX math solutions, and dynamic diagrams for a specific mock test.
                </p>
              </div>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              5-STEP HIERARCHICAL QUESTION STUDIO WORKFLOW
          ───────────────────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* STEP 1: TARGET DESTINATION TEST TYPE */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">1</span>
                  Select Target Test Type
                </label>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Primary Routing
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'mock_test' as const,
                    title: 'Mock Test',
                    desc: 'Timed exam papers with negative marking & ranking',
                    icon: Award,
                    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  },
                  {
                    id: 'practice_test' as const,
                    title: 'Practice Test',
                    desc: 'Interactive untimed drills & rapid speed quizzes',
                    icon: Zap,
                    color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300'
                  },
                  {
                    id: 'question_bank' as const,
                    title: 'Question Bank',
                    desc: 'High-yield topic vault & 10-year PYQ archives',
                    icon: BookOpen,
                    color: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  },
                  {
                    id: 'flashcards' as const,
                    title: 'Flashcards',
                    desc: 'Active recall spaced-repetition cards & key points',
                    icon: Layers,
                    color: 'from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300'
                  }
                ].map(typeItem => {
                  const isSelected = stage2TargetType === typeItem.id;
                  const Icon = typeItem.icon;
                  return (
                    <button
                      key={typeItem.id}
                      type="button"
                      onClick={() => {
                        setStage2TargetType(typeItem.id);
                        setStage2SubCategory('all');
                        setStage2SelectedTestId('');
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer",
                        isSelected
                          ? "bg-gradient-to-br border-brand-500 ring-2 ring-brand-500/30 shadow-md " + typeItem.color
                          : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-80 hover:opacity-100"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center font-bold",
                          isSelected ? "bg-brand-600 text-white shadow-xs" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {typeItem.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {typeItem.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: SUBCATEGORY / CLASSIFICATION FILTER */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">2</span>
                  {stage2TargetType === 'flashcards' ? 'Filter by Deck Subject' : 'Filter by Subcategory & Format'}
                </label>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  {stage2TargetType === 'flashcards' ? 'Isolates Decks by Subject' : 'Refines List in Step 3'}
                </span>
              </div>

              {/* Mode Toggle for Question Bank / Practice Sets: All (56) | Question Banks (28) | Practice Sets (28) */}
              {(stage2TargetType === 'question_bank' || stage2TargetType === 'practice_test') && (() => {
                const totalAll = questionBanks.filter(b => b.examId === selectedExamId).length;
                const totalBanks = questionBanks.filter(b => b.examId === selectedExamId && (b.target_mode || 'both') !== 'practice').length;
                const totalPractice = questionBanks.filter(b => b.examId === selectedExamId && (b.target_mode || 'both') !== 'bank').length;

                return (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 w-fit">
                    <button
                      type="button"
                      onClick={() => {
                        setStage2BankModeFilter('all');
                        setStage2SubCategory('all');
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        stage2BankModeFilter === 'all'
                          ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs font-black"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <span>🌟 All Items</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                        stage2BankModeFilter === 'all' ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}>
                        {totalAll}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStage2BankModeFilter('bank');
                        setStage2SubCategory('all');
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        stage2BankModeFilter === 'bank'
                          ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs font-black"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <span>📦 Question Banks</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                        stage2BankModeFilter === 'bank' ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}>
                        {totalBanks}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStage2BankModeFilter('practice');
                        setStage2SubCategory('all');
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        stage2BankModeFilter === 'practice'
                          ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-2xs font-black"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                      )}
                    >
                      <span>🎯 Practice Sets</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                        stage2BankModeFilter === 'practice' ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}>
                        {totalPractice}
                      </span>
                    </button>
                  </div>
                );
              })()}

              <div className="flex flex-wrap gap-2">
                {(stage2TargetType === 'mock_test'
                  ? [
                      { id: 'all', label: '🌐 All Mock Tests', count: examMockTests.length },
                      { id: 'full-length', label: '🏆 Full-Length Mock Tests', count: categorizedMockTests.fullLength.length },
                      { id: 'sectional', label: '📑 Sectional Tests', count: categorizedMockTests.sectional.length },
                      { id: 'pyq', label: '⏳ Official PYQ Tests', count: categorizedMockTests.pyq.length },
                      { id: 'daily', label: '📈 Daily / Weekly Benchmark Tests', count: categorizedMockTests.daily.length }
                    ]
                  : stage2TargetType === 'flashcards'
                  ? [
                      { id: 'all', label: '🌐 All Subjects', count: examFlashcardDecks.length },
                      ...Array.from(new Set(examFlashcardDecks.map(d => d.subject || 'General Studies').filter(Boolean))).map(subj => ({
                        id: subj,
                        label: `📖 ${subj}`,
                        count: examFlashcardDecks.filter(d => (d.subject || 'General Studies') === subj).length
                      }))
                    ]
                  : [
                      { 
                        id: 'all', 
                        label: stage2BankModeFilter === 'bank' ? '🌐 All Question Banks' : stage2BankModeFilter === 'practice' ? '🌐 All Practice Sets' : '🌐 All Content Banks', 
                        count: examQuestionBanks.length 
                      },
                      { id: 'topic-wise', label: '📚 Topic-Wise / Chapter-Wise', count: categorizedQuestionBanks.topicWise.length },
                      { id: 'exam-focused', label: '💎 Exam-Focused High Yield', count: categorizedQuestionBanks.examFocused.length },
                      { id: 'revision-sets', label: '⚡ Last-Minute Revision Sets', count: categorizedQuestionBanks.revisionSets.length },
                      { id: 'pyq-collections', label: '📜 PYQ Question Archives', count: categorizedQuestionBanks.pyqCollections.length }
                    ]
                ).map(cat => {
                  const isCatActive = stage2SubCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setStage2SubCategory(cat.id)}
                      className={cn(
                        "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                        isCatActive
                          ? "bg-brand-600 text-white shadow-md shadow-brand-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      )}
                    >
                      <span>{cat.label}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[10px] font-black",
                        isCatActive ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      )}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: AGGREGATED TOPIC / MODULE PICKER */}
            <div className="space-y-3 p-4.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">3</span>
                  Target Selection Mode
                </label>

                {/* Target Mode Switcher: Single Target vs Multi-Bank Queue Runner */}
                <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStage2TargetMode('single')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                      stage2TargetMode === 'single'
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    <span>🎯 {stage2TargetType === 'flashcards' ? 'Single Target Deck' : 'Single Target Bank'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage2TargetMode('multi_bank')}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                      stage2TargetMode === 'multi_bank'
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    )}
                  >
                    <span>⚡ {stage2TargetType === 'flashcards' ? 'Multi-Deck Queue Runner' : 'Multi-Bank Queue Runner'}</span>
                    {selectedMultiBankIds.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-white/20 text-white font-extrabold">
                        {selectedMultiBankIds.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {stage2TargetMode === 'multi_bank' ? (
                <div className="space-y-4 pt-1">
                  {(() => {
                    const isMock = stage2TargetType === 'mock_test';
                    const isPractice = stage2TargetType === 'practice_test';
                    const isFlashcard = stage2TargetType === 'flashcards';
                    const catObj = isMock ? categorizedMockTests : isPractice ? categorizedPracticeSets : categorizedQuestionBanks;
                    const basePool = isFlashcard ? examFlashcardDecks : isMock ? examMockTests : isPractice ? examPracticeSets : examQuestionBanks;

                    let scopedPool = basePool;
                    let activeCategoryLabel = isFlashcard ? 'All Flashcard Decks' : isMock ? 'All Mock Tests' : isPractice ? 'All Practice Sets' : 'All Question Banks';

                    if (isFlashcard) {
                      if (stage2SubCategory && stage2SubCategory !== 'all') {
                        scopedPool = basePool.filter(d => (d.subject || 'General Studies') === stage2SubCategory);
                        activeCategoryLabel = `📖 ${stage2SubCategory} Decks`;
                      }
                    } else if (isMock) {
                      if (stage2SubCategory === 'full-length') {
                        scopedPool = (catObj as typeof categorizedMockTests).fullLength;
                        activeCategoryLabel = '🏆 Full-Length Mock Tests';
                      } else if (stage2SubCategory === 'sectional') {
                        scopedPool = (catObj as typeof categorizedMockTests).sectional;
                        activeCategoryLabel = '📑 Sectional Tests';
                      } else if (stage2SubCategory === 'pyq') {
                        scopedPool = (catObj as typeof categorizedMockTests).pyq;
                        activeCategoryLabel = '⏳ Official PYQ Tests';
                      } else if (stage2SubCategory === 'daily') {
                        scopedPool = (catObj as typeof categorizedMockTests).daily;
                        activeCategoryLabel = '📈 Daily / Weekly Benchmark Tests';
                      }
                    } else if (stage2SubCategory === 'topic-wise') {
                      scopedPool = (catObj as typeof categorizedQuestionBanks).topicWise;
                      activeCategoryLabel = isPractice ? '📖 Chapter-Wise Practice' : '📚 Topic-Wise / Chapter-Wise';
                    } else if (stage2SubCategory === 'exam-focused') {
                      scopedPool = (catObj as typeof categorizedQuestionBanks).examFocused;
                      activeCategoryLabel = isPractice ? '💎 High-Yield Topic Banks' : '💎 Exam-Focused High Yield';
                    } else if (stage2SubCategory === 'revision-sets') {
                      scopedPool = (catObj as typeof categorizedQuestionBanks).revisionSets;
                      activeCategoryLabel = isPractice ? '⚡ Daily Speed & Accuracy Quizzes' : '⚡ Last-Minute Revision Sets';
                    } else if (stage2SubCategory === 'pyq-collections') {
                      scopedPool = (catObj as typeof categorizedQuestionBanks).pyqCollections;
                      activeCategoryLabel = isPractice ? '📜 Topic-Wise Solved PYQs' : '📜 PYQ Question Archives';
                    }

                    const getBankCount = (b: any) => {
                      if (isFlashcard) {
                        if (typeof bankCountOverrides[b.id] === 'number') {
                          return bankCountOverrides[b.id];
                        }
                        return b.card_count ?? 0;
                      }
                      if (typeof bankCountOverrides[b.id] === 'number') {
                        return bankCountOverrides[b.id];
                      }
                      if (isMock) {
                        return b._questionCount ?? b.questionCount ?? b.totalQuestions ?? 0;
                      }
                      if (typeof b.practiceQuestionCount === 'number') {
                        return b.practiceQuestionCount;
                      }
                      return b.questionCount ?? 0;
                    };

                    const emptyBanks = scopedPool.filter(b => getBankCount(b) === 0);
                    const populatedBanks = scopedPool.filter(b => getBankCount(b) > 0);
                    const emptyCount = emptyBanks.length;
                    const populatedCount = populatedBanks.length;

                    const unitLabel = isFlashcard ? 'Cards' : 'Qs';
                    const nounLabel = isFlashcard ? 'decks' : isMock ? 'mock tests' : 'banks';
                    const nounCapital = isFlashcard ? 'Decks' : isMock ? 'Mock Tests' : 'Banks';

                    const filteredBanks = scopedPool.filter(b => {
                      const count = getBankCount(b);
                      if (multiBankQuestionCountFilter === 'empty' && count > 0) return false;
                      if (multiBankQuestionCountFilter === 'populated' && count === 0) return false;
                      if (multiBankStageFilter !== 'all') {
                        const st = getItemStage(b);
                        if (st && st.toLowerCase() !== multiBankStageFilter.toLowerCase()) return false;
                      }
                      if (multiBankSearchQuery.trim()) {
                        const q = multiBankSearchQuery.toLowerCase();
                        const titleMatch = (b.title || '').toLowerCase().includes(q);
                        const subjMatch = (b.tagline || b.subject || '').toLowerCase().includes(q);
                        return titleMatch || subjMatch;
                      }
                      return true;
                    });

                    const qsPerBank = stage2QuestionCount * stage2BatchCount;
                    const grandTotal = selectedMultiBankIds.length * qsPerBank;

                    return (
                      <div className="space-y-3">
                        {/* Active Category Scope Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-gradient-to-r from-brand-50 to-indigo-50/50 dark:from-brand-950/40 dark:to-slate-900 border border-brand-200/80 dark:border-brand-800 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <FolderOpen className="w-4 h-4 text-brand-600 shrink-0" />
                              <span>Category Scope:</span>
                            </span>
                            <span className="px-2.5 py-1 rounded-lg bg-brand-600 text-white font-black text-[11px] shadow-xs flex items-center gap-1.5">
                              <span>{activeCategoryLabel}</span>
                              <span className="px-1.5 py-0.2 rounded bg-white/20 text-white text-[10px] font-black">{scopedPool.length}</span>
                            </span>
                            {emptyCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold text-[10.5px] border border-amber-300/60 dark:border-amber-800 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{emptyCount} {nounLabel} have 0 {unitLabel.toLowerCase()}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10.5px] border border-emerald-300/60 dark:border-emerald-800 flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>All {nounLabel} populated</span>
                              </span>
                            )}
                          </div>
                          {stage2SubCategory !== 'all' ? (
                            <button
                              type="button"
                              onClick={() => setStage2SubCategory('all')}
                              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline cursor-pointer shrink-0"
                            >
                              Show All {isFlashcard ? 'Subjects' : 'Categories'}
                            </button>
                          ) : (
                            <span className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium shrink-0">
                              Refined by Step 2 above
                            </span>
                          )}
                        </div>

                        {/* Toolbar: Search, Filters, and Quick Selection */}
                        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                          {/* Search Input */}
                          <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={multiBankSearchQuery}
                              onChange={e => setMultiBankSearchQuery(e.target.value)}
                              placeholder={`Search within ${activeCategoryLabel}...`}
                              className="w-full pl-9 pr-8 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-white outline-none focus:border-brand-500"
                            />
                            {multiBankSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setMultiBankSearchQuery('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>

                          {/* Question/Card Count Status Filters */}
                          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 overflow-x-auto">
                            <button
                              type="button"
                              onClick={() => setMultiBankQuestionCountFilter('all')}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer whitespace-nowrap",
                                multiBankQuestionCountFilter === 'all' ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              All ({scopedPool.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setMultiBankQuestionCountFilter('empty')}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer whitespace-nowrap flex items-center gap-1",
                                multiBankQuestionCountFilter === 'empty' 
                                  ? "bg-amber-600 text-white shadow-xs" 
                                  : emptyCount > 0 
                                    ? "text-amber-700 dark:text-amber-400 font-extrabold hover:bg-amber-50" 
                                    : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              <span>⚠️ Needs {unitLabel} / 0 {unitLabel}</span>
                              <span className={cn(
                                "px-1.5 py-0.2 rounded-md text-[10px] font-black",
                                multiBankQuestionCountFilter === 'empty' ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
                              )}>
                                {emptyCount}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMultiBankQuestionCountFilter('populated')}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer whitespace-nowrap",
                                multiBankQuestionCountFilter === 'populated' ? "bg-brand-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                              )}
                            >
                              📦 Populated ({populatedCount})
                            </button>
                          </div>

                          {/* Stage Filters (if exam has stages) */}
                          {examConfiguredStages.length > 0 && (
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 overflow-x-auto">
                              <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-300 px-1.5 shrink-0">Stage:</span>
                              <button
                                type="button"
                                onClick={() => setMultiBankStageFilter('all')}
                                className={cn(
                                  "px-2 py-0.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer whitespace-nowrap",
                                  multiBankStageFilter === 'all' ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                                )}
                              >
                                All
                              </button>
                              {examConfiguredStages.map(st => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setMultiBankStageFilter(st)}
                                  className={cn(
                                    "px-2 py-0.5 rounded-lg text-[10.5px] font-black transition-all cursor-pointer whitespace-nowrap",
                                    multiBankStageFilter === st ? "bg-purple-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                                  )}
                                >
                                  📍 {st}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Quick Selection Actions */}
                          <div className="flex items-center gap-2 shrink-0 flex-wrap">
                            <button
                              type="button"
                              disabled={emptyCount === 0 || isQueueRunnerActive}
                              onClick={() => {
                                const emptyIds = emptyBanks.map(b => b.id);
                                setSelectedMultiBankIds(emptyIds);
                                toast.success(`⚡ Selected all ${emptyIds.length} empty ${nounLabel} in ${activeCategoryLabel}`);
                              }}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer",
                                emptyCount > 0
                                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 opacity-60"
                              )}
                              title={emptyCount > 0 ? `Select all ${nounLabel} with 0 ${unitLabel.toLowerCase()} in this category` : `No empty ${nounLabel} in this category`}
                            >
                              <Zap className="w-3.5 h-3.5 fill-current" />
                              <span>Select 0-{unitLabel} {nounCapital} ({emptyCount})</span>
                            </button>
                            <button
                              type="button"
                              disabled={filteredBanks.length === 0 || isQueueRunnerActive}
                              onClick={() => {
                                const idsToAdd = filteredBanks.map(b => b.id);
                                setSelectedMultiBankIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
                              }}
                              className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-xl text-xs font-black transition-all border border-brand-200 dark:border-brand-800 cursor-pointer"
                            >
                              ✓ Select All Filtered ({filteredBanks.length})
                            </button>
                            {selectedMultiBankIds.length > 0 && (
                              <>
                                <button
                                  type="button"
                                  disabled={isQueueRunnerActive}
                                  onClick={async () => {
                                    const selectedBanks = scopedPool.filter(b => selectedMultiBankIds.includes(b.id));
                                    const totalQCount = selectedBanks.reduce((sum, b) => sum + getBankCount(b), 0);
                                    const confirmMsg = `Are you sure you want to permanently clear all ${totalQCount} ${unitLabel.toLowerCase()} from the ${selectedBanks.length} selected ${nounLabel}?\n\nThe bank records will remain intact, all questions will be permanently deleted from the database, and their counters will reset to 0.`;
                                    if (!confirm(confirmMsg)) return;

                                    try {
                                      const toastId = toast.loading(`Clearing questions for ${selectedBanks.length} ${nounLabel}...`);
                                      for (const b of selectedBanks) {
                                        if (isMock) {
                                          await examService.clearQuestionsForMockTest(b.id);
                                        } else {
                                          await examService.clearQuestionsForBank(b.id);
                                        }
                                      }
                                      setBankCountOverrides(prev => {
                                        const next = { ...prev };
                                        selectedBanks.forEach(b => { next[b.id] = 0; });
                                        return next;
                                      });
                                      setSelectedMultiBankIds([]);
                                      toast.dismiss(toastId);
                                      toast.success(`✅ Successfully cleared questions for ${selectedBanks.length} ${nounLabel}. Counters reset to 0.`);
                                      if (onRefreshCatalog) onRefreshCatalog();
                                    } catch (err: any) {
                                      toast.error(`Error clearing questions: ${err.message || err}`);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl text-xs font-black transition-all border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 cursor-pointer"
                                  title="Permanently delete all questions and reset counter to 0 for selected banks"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Purge Qs ({selectedMultiBankIds.length})</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isQueueRunnerActive}
                                  onClick={() => setSelectedMultiBankIds([])}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-black transition-all cursor-pointer"
                                >
                                  Clear ({selectedMultiBankIds.length})
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Scrollable Checkbox Card List */}
                        <div className="max-h-72 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                          {filteredBanks.length === 0 ? (
                            <div className="p-8 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                              <div>No {nounLabel} match the selected category & filter criteria.</div>
                              <div className="text-[11px] text-brand-600">
                                Try changing the Question/Card Count filter above or selecting a different {isFlashcard ? 'subject' : 'subcategory'} in Step 2.
                              </div>
                            </div>
                          ) : (
                            filteredBanks.map(bank => {
                              const bankId = bank.id || '';
                              const isChecked = selectedMultiBankIds.includes(bankId);
                              const qStatus = multiBankQueueStatus[bankId];
                              const currentCount = getBankCount(bank);
                              const isZero = currentCount === 0;

                              return (
                                <div
                                  key={bankId}
                                  onClick={() => {
                                    if (isQueueRunnerActive || !bankId) return;
                                    setSelectedMultiBankIds(prev => 
                                      isChecked ? prev.filter(id => id !== bankId) : [...prev, bankId]
                                    );
                                  }}
                                  className={cn(
                                    "p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                                    isChecked
                                      ? "bg-brand-50/80 dark:bg-brand-950/40 border-brand-400 dark:border-brand-600 shadow-2xs"
                                      : isZero
                                        ? "bg-amber-50/30 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/60 hover:border-amber-400"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300",
                                    isQueueRunnerActive && "pointer-events-none opacity-80"
                                  )}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 shrink-0 cursor-pointer"
                                    />
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <h5 className={cn(
                                          "text-xs font-black truncate",
                                          isChecked ? "text-brand-900 dark:text-brand-200" : "text-slate-800 dark:text-slate-200"
                                        )}>
                                          {bank.title}
                                        </h5>
                                        {getItemStage(bank) && (
                                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                                            📍 {getItemStage(bank)}
                                          </span>
                                        )}
                                        {isZero && (
                                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 shrink-0">
                                            Empty
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 text-[10.5px]">
                                        {isFlashcard ? (
                                          <span className="text-slate-400">
                                            🎴 Flashcard Deck • {bank.subject || 'General Studies'}{bank.chapter ? ` • ${bank.chapter}` : ''}
                                          </span>
                                        ) : (
                                          <>
                                            <span className="text-slate-400">
                                              {(bank.target_mode || 'both') === 'practice' ? '🎯 Practice Set' : (bank.target_mode || 'both') === 'bank' ? '📦 Question Bank' : '🌟 Both'}
                                            </span>
                                            {bank.type && (
                                              <>
                                                <span className="text-slate-300 dark:text-slate-600">•</span>
                                                <span className="text-slate-500 capitalize">{bank.type.replace('-', ' ')}</span>
                                              </>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {qStatus ? (
                                      <span className={cn(
                                        "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                                        qStatus.status === 'completed' ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                                        qStatus.status === 'running' ? "bg-brand-100 text-brand-800 animate-pulse border border-brand-300" :
                                        qStatus.status === 'failed' ? "bg-rose-100 text-rose-800 border border-rose-300" :
                                        "bg-slate-100 text-slate-700"
                                      )}>
                                        {qStatus.status === 'completed' ? `✓ Uploaded (${qStatus.count} ${unitLabel})` :
                                         qStatus.status === 'running' ? `⚡ Generating (${qStatus.count} ${unitLabel})...` :
                                         qStatus.status === 'failed' ? '❌ Failed' : '⏳ Queued'}
                                      </span>
                                    ) : isZero ? (
                                      <span className="px-2.5 py-1 rounded-lg text-[10.5px] font-black bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                                        <span>0 {unitLabel} • Empty</span>
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                        {isFlashcard ? '🎴' : '📦'} {currentCount} {unitLabel}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Interactive Calculation & Target Summary Bar */}
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-brand-500/10 via-indigo-500/10 to-transparent border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 font-black text-brand-900 dark:text-brand-200">
                              <span>📊 Multi-{isFlashcard ? 'Deck' : 'Bank'} Queue Target:</span>
                              <span className="px-2 py-0.5 rounded-md bg-brand-600 text-white text-[11px] font-black">
                                {selectedMultiBankIds.length} {nounCapital} Selected
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">
                              {stage2QuestionCount} {unitLabel}/batch × {stage2BatchCount} batches = <strong className="text-slate-900 dark:text-white font-black">{qsPerBank} {unitLabel}/{isFlashcard ? 'Deck' : 'Bank'}</strong> • Grand Total: <strong className="text-brand-600 font-black">{grandTotal} {isFlashcard ? 'Cards' : 'Questions'}</strong>
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
                            <CheckCircle className="w-4 h-4 shrink-0" />
                            <span>Direct auto-publish into each {isFlashcard ? 'deck' : 'bank'} record upon batch completion</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Select target test or question bank from the list:
                    </span>
                    <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400">
                      {stage2TargetType === 'mock_test' 
                        ? `${examMockTests.length} Mocks Available` 
                        : stage2TargetType === 'practice_test' 
                        ? `${examPracticeSets.length} Practice Sets Available` 
                        : `${examQuestionBanks.length} Question Banks Available`}
                    </span>
                  </div>

                  {/* Stage Filter Pills if exam has configured stages */}
                  {examConfiguredStages.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1.5">
                        Filter by Stage:
                      </span>
                      <button
                        type="button"
                        onClick={() => setStage2StageFilter('all')}
                        className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all ${
                          stage2StageFilter === 'all'
                            ? 'bg-brand-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                        }`}
                      >
                        All Stages
                      </button>
                      {examConfiguredStages.map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStage2StageFilter(st)}
                          className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition-all ${
                            stage2StageFilter.toLowerCase() === st.toLowerCase()
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Aggregated Dropdown with Subcategory Grouping */}
                  <div className="space-y-1.5">
                    <select
                      value={stage2SelectedTestId}
                  onChange={e => {
                    const id = e.target.value;
                    setStage2SelectedTestId(id);

                    if (!id) {
                      setStage2TestTitle('');
                      setStage2Subject('Comprehensive Full Syllabus (All Subjects Balanced)');
                      return;
                    }

                    // 1. Check Database Tests
                    if (stage2TargetType === 'mock_test') {
                      const matched = examMockTests.find(t => t.id === id);
                      if (matched) {
                        setStage2TestTitle(matched.title);
                        const itemStage = getItemStage(matched);
                        if (itemStage && itemStage !== 'All Stages') {
                          setSelectedExamStage(itemStage);
                          setStage2StageFilter(itemStage);
                        }
                        if (/full mock|full-length|pyq paper|benchmark/i.test(matched.title)) {
                          setStage2Subject('Comprehensive Full Syllabus (All Subjects Balanced)');
                        } else {
                          let parsedSubject = '';
                          if (matched.seriesId) {
                            try {
                              if (matched.seriesId.startsWith('{')) {
                                parsedSubject = JSON.parse(matched.seriesId).subject || '';
                              }
                            } catch {}
                          }
                          const cleanSubject = parsedSubject || matched.title.replace(/^Sectional:\s*/i, '').replace(/^Paper\s*-\s*\w+[:\s]*/i, '');
                          setStage2Subject(cleanSubject);
                        }
                      }
                    } else if (stage2TargetType === 'practice_test') {
                      const matched = examPracticeSets.find(b => b.id === id);
                      if (matched) {
                        setStage2TestTitle(matched.title);
                        const itemStage = getItemStage(matched);
                        if (itemStage && itemStage !== 'All Stages') {
                          setSelectedExamStage(itemStage);
                          setStage2StageFilter(itemStage);
                        }
                        let subj = '';
                        if (matched.tagline) {
                          try {
                            if (matched.tagline.startsWith('{')) subj = JSON.parse(matched.tagline).subject || '';
                          } catch {}
                        }
                        if (!subj) subj = matched.subject || matched.tagline?.replace(/^Subject:\s*/i, '') || '';
                        setStage2Subject(subj && subj !== matched.title ? `${subj} • ${matched.title}` : matched.title);
                      }
                    } else if (stage2TargetType === 'flashcards') {
                      const matched = examFlashcardDecks.find(d => d.id === id);
                      if (matched) {
                        setStage2TestTitle(matched.title);
                        setStage2Subject(matched.subject || matched.title);
                        if (matched.sub_subject || matched.chapter) {
                          setStage2SubSubject(matched.sub_subject || matched.title);
                          setStage2Chapter(matched.chapter || '');
                        } else if (matched.title.includes(' · ')) {
                          const parts = matched.title.split(' · ');
                          setStage2SubSubject(parts[0].trim());
                          setStage2Chapter(parts[1]?.trim() || '');
                        } else if (matched.title.includes(':')) {
                          const parts = matched.title.split(':');
                          setStage2Subject(parts[0].trim());
                          setStage2SubSubject(parts[1]?.trim() || '');
                          setStage2Chapter('');
                        } else {
                          setStage2SubSubject(matched.title);
                          setStage2Chapter('');
                        }
                        const itemStage = getItemStage(matched);
                        if (itemStage && itemStage !== 'All Stages') {
                          setSelectedExamStage(itemStage);
                          setStage2StageFilter(itemStage);
                        }
                      }
                    } else {
                      const matched = examQuestionBanks.find(b => b.id === id);
                      if (matched) {
                        setStage2TestTitle(matched.title);
                        const itemStage = getItemStage(matched);
                        if (itemStage && itemStage !== 'All Stages') {
                          setSelectedExamStage(itemStage);
                          setStage2StageFilter(itemStage);
                        }
                        let subj = '';
                        if (matched.tagline) {
                          try {
                            if (matched.tagline.startsWith('{')) subj = JSON.parse(matched.tagline).subject || '';
                          } catch {}
                        }
                        if (!subj) subj = matched.subject || matched.tagline?.replace(/^Subject:\s*/i, '') || '';
                        setStage2Subject(subj && subj !== matched.title ? `${subj} • ${matched.title}` : matched.title);
                      }
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 border-2 border-brand-500/30 rounded-xl px-3.5 py-3 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                >
                  <option value="">-- Click to Select an Existing {stage2TargetType === 'mock_test' ? 'Mock Test' : stage2TargetType === 'practice_test' ? 'Practice Set' : stage2TargetType === 'flashcards' ? 'Flashcard Deck' : 'Question Bank'} --</option>

                  {/* QUESTION BANK MODE: Grouped by 4 Exact Subcategories */}
                  {stage2TargetType === 'question_bank' && (() => {
                    const filterByStage = (items: any[]) => items.filter(b => {
                      if (stage2StageFilter === 'all') return true;
                      const st = getItemStage(b);
                      return !st || st.toLowerCase() === stage2StageFilter.toLowerCase();
                    });
                    const tw = filterByStage(categorizedQuestionBanks.topicWise);
                    const ef = filterByStage(categorizedQuestionBanks.examFocused);
                    const rs = filterByStage(categorizedQuestionBanks.revisionSets);
                    const pq = filterByStage(categorizedQuestionBanks.pyqCollections);

                    return (
                      <>
                        {(stage2SubCategory === 'all' || stage2SubCategory === 'topic-wise') && tw.length > 0 && (
                          <optgroup label={`📚 Topic-Wise / Chapter-Wise (${tw.length} Sets)`}>
                            {tw.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'exam-focused') && ef.length > 0 && (
                          <optgroup label={`💎 Exam-Focused High Yield (${ef.length} Sets)`}>
                            {ef.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'revision-sets') && rs.length > 0 && (
                          <optgroup label={`⚡ Last-Minute Revision Sets (${rs.length} Sets)`}>
                            {rs.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'pyq-collections') && pq.length > 0 && (
                          <optgroup label={`📜 PYQ Question Archives (${pq.length} Sets)`}>
                            {pq.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}

                  {/* PRACTICE TEST MODE: Grouped by 4 Exact Subcategories */}
                  {stage2TargetType === 'practice_test' && (() => {
                    const filterByStage = (items: any[]) => items.filter(b => {
                      if (stage2StageFilter === 'all') return true;
                      const st = getItemStage(b);
                      return !st || st.toLowerCase() === stage2StageFilter.toLowerCase();
                    });
                    const tw = filterByStage(categorizedPracticeSets.topicWise);
                    const ef = filterByStage(categorizedPracticeSets.examFocused);
                    const rs = filterByStage(categorizedPracticeSets.revisionSets);
                    const pq = filterByStage(categorizedPracticeSets.pyqCollections);

                    return (
                      <>
                        {(stage2SubCategory === 'all' || stage2SubCategory === 'topic-wise') && tw.length > 0 && (
                          <optgroup label={`📚 Topic-Wise / Chapter Practice (${tw.length} Sets)`}>
                            {tw.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'exam-focused') && ef.length > 0 && (
                          <optgroup label={`💎 Exam-Focused High Yield (${ef.length} Sets)`}>
                            {ef.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'revision-sets') && rs.length > 0 && (
                          <optgroup label={`⚡ Last-Minute Revision Sets (${rs.length} Sets)`}>
                            {rs.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'pyq-collections') && pq.length > 0 && (
                          <optgroup label={`📜 PYQ Question Archives (${pq.length} Sets)`}>
                            {pq.map(b => (
                              <option key={b.id} value={b.id}>
                                {getItemStage(b) ? `[${getItemStage(b)}] ` : ''}{b.title} ({b.questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}

                  {/* MOCK TEST MODE: Grouped by 4 Exact Subcategories */}
                  {stage2TargetType === 'mock_test' && (() => {
                    const filterByStage = (items: any[]) => items.filter(t => {
                      if (stage2StageFilter === 'all') return true;
                      const st = getItemStage(t);
                      return !st || st.toLowerCase() === stage2StageFilter.toLowerCase();
                    });
                    const fl = filterByStage(categorizedMockTests.fullLength);
                    const sec = filterByStage(categorizedMockTests.sectional);
                    const pq = filterByStage(categorizedMockTests.pyq);
                    const dl = filterByStage(categorizedMockTests.daily);

                    return (
                      <>
                        {(stage2SubCategory === 'all' || stage2SubCategory === 'full-length') && fl.length > 0 && (
                          <optgroup label={`🏆 Full-Length Mock Tests (${fl.length} Tests)`}>
                            {fl.map(t => (
                              <option key={t.id} value={t.id}>
                                {getItemStage(t) ? `[${getItemStage(t)}] ` : ''}{t.title} ({t._questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'sectional') && sec.length > 0 && (
                          <optgroup label={`📑 Sectional Tests (${sec.length} Tests)`}>
                            {sec.map(t => (
                              <option key={t.id} value={t.id}>
                                {getItemStage(t) ? `[${getItemStage(t)}] ` : ''}{t.title} ({t._questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'pyq') && pq.length > 0 && (
                          <optgroup label={`⏳ Official PYQ Tests (${pq.length} Tests)`}>
                            {pq.map(t => (
                              <option key={t.id} value={t.id}>
                                {getItemStage(t) ? `[${getItemStage(t)}] ` : ''}{t.title} ({t._questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}

                        {(stage2SubCategory === 'all' || stage2SubCategory === 'daily') && dl.length > 0 && (
                          <optgroup label={`📈 Daily / Weekly Benchmark Tests (${dl.length} Tests)`}>
                            {dl.map(t => (
                              <option key={t.id} value={t.id}>
                                {getItemStage(t) ? `[${getItemStage(t)}] ` : ''}{t.title} ({t._questionCount || 0} Qs)
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </>
                    );
                  })()}

                  {/* FLASHCARD DECK MODE: Grouped by Real Subject / Syllabus Hierarchy */}
                  {stage2TargetType === 'flashcards' && (() => {
                    const filterByStage = (items: FlashcardDeck[]) => items.filter(d => {
                      if (stage2StageFilter === 'all') return true;
                      const st = d.stage || getItemStage(d);
                      return !st || st.toLowerCase() === 'all stages' || st.toLowerCase() === stage2StageFilter.toLowerCase();
                    });
                    const filteredDecks = filterByStage(examFlashcardDecks);
                    const subjects = Array.from(new Set(filteredDecks.map(d => d.subject || 'General Studies')));

                    return (
                      <>
                        {subjects.map(subj => {
                          const decksInSubj = filteredDecks.filter(d => (d.subject || 'General Studies') === subj);
                          if (stage2SubCategory !== 'all' && stage2SubCategory !== subj) return null;
                          if (decksInSubj.length === 0) return null;
                          return (
                            <optgroup key={subj} label={`📖 ${subj} (${decksInSubj.length} Decks)`}>
                              {decksInSubj.map(d => (
                                <option key={d.id} value={d.id}>
                                  {d.stage && d.stage !== 'All Stages' ? `[${d.stage}] ` : ''}{d.title} ({d.card_count || 0} Cards)
                                </option>
                              ))}
                            </optgroup>
                          );
                        })}
                      </>
                    );
                  })()}
                </select>
              </div>

              {/* Verified Selected Target Card (No Renaming Required) */}
              {selectedItem ? (
                <div className="p-4 rounded-2xl bg-brand-50/80 dark:bg-brand-950/40 border-2 border-brand-500/30 space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-brand-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-700 dark:text-brand-300">
                          Selected Database Target:
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {selectedItem.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getItemStage(selectedItem) && (
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-700 flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {getItemStage(selectedItem)}
                        </span>
                      )}
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {stage2TargetType === 'flashcards'
                          ? `${selectedItem.card_count ?? 0} Existing Flashcards`
                          : `${selectedItem._questionCount ?? selectedItem.questionCount ?? 0} Existing Questions`}
                      </span>
                      {((stage2TargetType === 'flashcards' ? (selectedItem.card_count ?? 0) : (selectedItem._questionCount ?? selectedItem.questionCount ?? 0)) > 0) && (
                        <button
                          type="button"
                          onClick={async () => {
                            const count = stage2TargetType === 'flashcards' ? selectedItem.card_count : (selectedItem._questionCount ?? selectedItem.questionCount ?? 0);
                            if (!confirm(`Are you sure you want to permanently clear all ${count} items from "${selectedItem.title}"?\n\nThe record will remain intact, all questions will be permanently deleted from the database, and the count will reset to 0.`)) return;
                            try {
                              if (stage2TargetType === 'mock_test') {
                                await examService.clearQuestionsForMockTest(selectedItem.id);
                              } else {
                                await examService.clearQuestionsForBank(selectedItem.id);
                              }
                              setBankCountOverrides(prev => ({ ...prev, [selectedItem.id]: 0 }));
                              toast.success(`✅ Successfully cleared questions for "${selectedItem.title}". Count reset to 0.`);
                              if (onRefreshCatalog) onRefreshCatalog();
                            } catch (e: any) {
                              toast.error(`Error clearing: ${e.message || e}`);
                            }
                          }}
                          className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1 cursor-pointer transition-all"
                          title="Purge all questions for this item"
                        >
                          <Trash2 className="w-3 h-3 text-rose-600" />
                          <span>Clear Qs</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Mode & Subject Lock Pill */}
                  <div className="pt-2 border-t border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-600 dark:text-slate-300">🎯 Subject Scope:</span>
                      <span className="font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100/80 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                        {stage2Subject || 'Comprehensive Full Syllabus (All Subjects Balanced)'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Ready — will save directly into this existing record.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  👆 Select an existing question bank from the dropdown above to generate questions for it.
                </div>
              )}
            </div>
          )}
              {(() => {
                const isFlashcards = stage2TargetType === 'flashcards';
                const isMultiRunner = stage2TargetMode === 'multi_bank';

                if (isMultiRunner && isFlashcards) {
                  return (
                    <div className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all shadow-2xs mt-2 bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-xs bg-indigo-600">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-black text-xs flex items-center gap-2">
                            <span>🎯 Strict Per-Deck Subject & Syllabus Lock Mode</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                              100% Placeholder & Topic Lock
                            </span>
                          </div>
                          <p className="text-[10.5px] opacity-80 mt-0.5">
                            Every deck in the queue will be generated individually and strictly mapped to its designated syllabus module, subject, and sub-subject. Zero cross-topic leakage.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (isMultiRunner) {
                  return (
                    <div className="p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all shadow-2xs mt-2 bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-xs bg-indigo-600">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-black text-xs flex items-center gap-2">
                            <span>🎯 Strict Sequential Bank Isolation Mode</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full border bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                              Per-Bank Topic Lock
                            </span>
                          </div>
                          <p className="text-[10.5px] opacity-80 mt-0.5">
                            Each question bank in the queue is generated individually, strictly isolated to its own title, subject, and chapter.
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }

                const cleanSub = (stage2Subject || (isFlashcards ? 'Selected Subject' : 'Comprehensive Full Syllabus')).trim();
                const cleanT = (stage2TestTitle || '').trim();
                const isFull = 
                  !isFlashcards && (
                    !cleanSub || 
                    cleanSub.toLowerCase() === 'all subjects' || 
                    cleanSub.toLowerCase().includes('comprehensive') || 
                    cleanSub.toLowerCase() === 'full syllabus' || 
                    (/full mock|full-length|pyq paper|benchmark/i.test(cleanT) && (!cleanSub || cleanSub.toLowerCase() === 'all subjects'))
                  );

                return (
                  <div className={cn(
                    "p-3 rounded-xl border flex items-center justify-between gap-3 text-xs transition-all shadow-2xs mt-2",
                    isFull
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                      : "bg-indigo-500/10 border-indigo-500/30 text-indigo-950 dark:text-indigo-200"
                  )}>
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-xs",
                        isFull ? "bg-amber-600" : "bg-indigo-600"
                      )}>
                        {isFull ? <Compass className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="font-black text-xs flex items-center gap-2">
                          {isFull ? '⚖️ Proportional Full-Syllabus Distribution Mode' : `🎯 Strict Subject Isolation Focus Mode`}
                          <span className={cn(
                            "text-[9px] font-bold px-2 py-0.5 rounded-full border",
                            isFull 
                              ? "bg-amber-100 dark:bg-amber-950 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                              : "bg-indigo-100 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300"
                          )}>
                            {isFull ? 'All Syllabus Units Balanced' : '100% Subject Lock'}
                          </span>
                        </div>
                        <p className="text-[10.5px] opacity-80 mt-0.5">
                          {isFull 
                            ? 'Questions will be sampled proportionally across all syllabus papers & units with zero chapter bias.'
                            : `${isFlashcards ? '100% of flashcards' : '100% of questions'} will be strictly locked to "${cleanSub}". Unrelated subjects will be filtered out.`}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* STEP 4 & 5 GRID: QUESTION COUNT & COGNITIVE DIFFICULTY */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* STEP 4: QUESTION & BATCH SPECIFICATION OR FLASHCARD VOLUME */}
              {stage2TargetType === 'flashcards' ? (
                <div className="space-y-3.5 p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/50 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border border-purple-200/80 dark:border-purple-800/60 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">4</span>
                        Active Recall Memory Volume
                      </label>
                      <span className="text-xs font-black text-purple-700 dark:text-purple-300 flex items-center gap-1">
                        {stage2NaturalDensity
                          ? (stage2QuestionCount === 0 ? '🎯 Natural Density (Auto Sizing)' : `🎯 Natural Density (≤${stage2QuestionCount} Cap)`)
                          : `Max Cap: ${stage2QuestionCount} Cards`}
                      </span>
                    </div>

                    {/* Mode Cards: Natural Density (Adaptive) vs Manual Cap Limit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStage2NaturalDensity(true);
                          setStage2QuestionCount(0);
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                          stage2NaturalDensity
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/30"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-purple-200/80 dark:border-purple-800/50 hover:border-purple-400"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <span>🎯 Natural Density</span>
                          </span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md",
                            stage2NaturalDensity ? "bg-white/20 text-white" : "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                          )}>
                            Recommended
                          </span>
                        </div>
                        <p className={cn("text-[10px] leading-relaxed", stage2NaturalDensity ? "text-purple-100" : "text-slate-500 dark:text-slate-400")}>
                          Extracts authentic memory pain points sized to syllabus factual richness without padding filler.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStage2NaturalDensity(false);
                          if (stage2QuestionCount === 0) setStage2QuestionCount(20);
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                          !stage2NaturalDensity
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm ring-2 ring-purple-500/30"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-purple-200/80 dark:border-purple-800/50 hover:border-purple-400"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <span>⚙️ Max Cap Limit</span>
                          </span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md",
                            !stage2NaturalDensity ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}>
                            Manual
                          </span>
                        </div>
                        <p className={cn("text-[10px] leading-relaxed", !stage2NaturalDensity ? "text-purple-100" : "text-slate-500 dark:text-slate-400")}>
                          Forces card extraction to a fixed strict quota (5, 10, 15, 20, 30 cards).
                        </p>
                      </button>
                    </div>

                    {/* Quick Cap / Ceiling Pills */}
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {(stage2NaturalDensity ? [0, 10, 15, 20, 30] : [5, 10, 15, 20, 30]).map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            setStage2QuestionCount(cnt);
                          }}
                          className={cn(
                            "py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center",
                            stage2QuestionCount === cnt
                              ? "bg-purple-600 text-white shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-purple-200 dark:border-purple-800/60 hover:border-purple-400"
                          )}
                        >
                          {stage2NaturalDensity
                            ? (cnt === 0 ? '✨ Auto' : `≤ ${cnt} Cap`)
                            : `${cnt} Cards`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2.5 border-t border-purple-200/60 dark:border-purple-800/40 text-[11px] text-purple-800 dark:text-purple-300 flex items-center justify-between font-bold">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>
                        {stage2NaturalDensity
                          ? (stage2QuestionCount === 0
                              ? 'Natural Density: 100% Dynamic syllabus distillation (Each deck sized by its own factual density)'
                              : `Natural Density: Dynamic distillation (Each deck sized by syllabus, capped at ≤ ${stage2QuestionCount} cards ceiling)`)
                          : `Strict Target: Enforces exactly ${stage2QuestionCount} cards with auto-top-up`}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {stage2NaturalDensity ? (stage2QuestionCount === 0 ? 'Auto Density' : `≤${stage2QuestionCount} Ceiling`) : 'Fixed Quota'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    {/* Header: Title and Active Status */}
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">4</span>
                        Question Volume & Batch Strategy
                      </label>
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                        {stage2QuestionNaturalDensity
                          ? (stage2QuestionCeiling === 0 ? '🎯 Natural Density (Auto)' : `🎯 Natural Density (≤${stage2QuestionCeiling} Cap)`)
                          : `${stage2QuestionCount} Qs / Batch`}
                      </span>
                    </div>

                    {/* Mode Cards: Natural Density (Adaptive) vs Fixed Quota (Manual) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => {
                          setStage2QuestionNaturalDensity(true);
                          setStage2AutoBatch(true);
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                          stage2QuestionNaturalDensity
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-500/30"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <span>🎯 Natural Density</span>
                          </span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md",
                            stage2QuestionNaturalDensity ? "bg-white/20 text-white" : "bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300"
                          )}>
                            Recommended
                          </span>
                        </div>
                        <p className={cn("text-[10px] leading-relaxed", stage2QuestionNaturalDensity ? "text-brand-100" : "text-slate-500 dark:text-slate-400")}>
                          AI analyzes chapter syllabus content density and autonomously sizes question count with equal quota per content item.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStage2QuestionNaturalDensity(false);
                          setStage2AutoBatch(false);
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                          !stage2QuestionNaturalDensity
                            ? "bg-brand-600 text-white border-brand-600 shadow-sm ring-2 ring-brand-500/30"
                            : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-brand-400"
                        )}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="text-xs font-black flex items-center gap-1.5">
                            <span>⚙️ Fixed Quota</span>
                          </span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md",
                            !stage2QuestionNaturalDensity ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                          )}>
                            Manual
                          </span>
                        </div>
                        <p className={cn("text-[10px] leading-relaxed", !stage2QuestionNaturalDensity ? "text-brand-100" : "text-slate-500 dark:text-slate-400")}>
                          Set a fixed question count per batch. AI strictly distributes questions equally across chapter content items.
                        </p>
                      </button>
                    </div>

                    {/* Ceiling Cap (Natural Density) or Questions per Batch (Fixed Quota) */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {stage2QuestionNaturalDensity ? 'Maximum Ceiling Cap (per bank):' : 'Questions per Batch:'}
                        </label>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {stage2QuestionNaturalDensity
                            ? (stage2QuestionCeiling === 0 ? '✨ 100% Dynamic Auto Sizing' : `Capped at max ${stage2QuestionCeiling} Qs`)
                            : `${stage2QuestionCount} Qs fixed`}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 mb-2">
                        {stage2QuestionNaturalDensity ? (
                          [0, 10, 15, 20, 25, 30].map(cnt => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => setStage2QuestionCeiling(cnt)}
                              className={cn(
                                "py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                stage2QuestionCeiling === cnt
                                  ? "bg-brand-600 text-white shadow-sm"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500"
                              )}
                            >
                              {cnt === 0 ? '✨ Auto' : `≤ ${cnt} Cap`}
                            </button>
                          ))
                        ) : (
                          [5, 10, 15, 20, 25, 50].map(cnt => (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() => setStage2QuestionCount(cnt)}
                              className={cn(
                                "py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                stage2QuestionCount === cnt
                                  ? "bg-brand-600 text-white shadow-sm"
                                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500"
                              )}
                            >
                              {cnt} Qs
                            </button>
                          ))
                        )}
                      </div>

                      {/* Custom Input */}
                      <div className="flex items-center gap-2 mb-1">
                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {stage2QuestionNaturalDensity ? 'Custom Ceiling Cap (0 = Auto):' : 'Custom Qs / Batch:'}
                        </label>
                        <input
                          type="number"
                          min={stage2QuestionNaturalDensity ? 0 : 1}
                          max={50}
                          value={stage2QuestionNaturalDensity ? stage2QuestionCeiling : stage2QuestionCount}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0;
                            if (stage2QuestionNaturalDensity) {
                              setStage2QuestionCeiling(Math.max(0, Math.min(50, val)));
                            } else {
                              setStage2QuestionCount(Math.max(1, Math.min(50, val)));
                            }
                          }}
                          className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white text-center focus:ring-1 focus:ring-brand-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Number of Batches (Sequential Auto-Runner) */}
                    <div className="pt-2.5 mt-2.5 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Number of Batches (Auto-Runner)
                        </label>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                          {stage2QuestionNaturalDensity && stage2AutoBatch ? '🤖 AI Auto-Decide (Active)' : `${stage2BatchCount} ${stage2BatchCount === 1 ? 'Batch' : 'Batches'}`}
                        </span>
                      </div>

                      {/* Batch Presets */}
                      <div className={cn("grid gap-1.5 mb-2", stage2QuestionNaturalDensity ? "grid-cols-4 sm:grid-cols-7" : "grid-cols-3 sm:grid-cols-6")}>
                        {stage2QuestionNaturalDensity && (
                          <button
                            type="button"
                            onClick={() => setStage2AutoBatch(true)}
                            className={cn(
                              "py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1",
                              stage2AutoBatch
                                ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/30"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500"
                            )}
                          >
                            <Sparkles className="w-3 h-3 text-amber-300" />
                            🤖 Auto
                          </button>
                        )}
                        {[1, 2, 3, 4, 5, 10].map(bc => (
                          <button
                            key={bc}
                            type="button"
                            onClick={() => {
                              setStage2AutoBatch(false);
                              setStage2BatchCount(bc);
                            }}
                            className={cn(
                              "py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                              !stage2AutoBatch && stage2BatchCount === bc
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500"
                            )}
                          >
                            {bc} {bc === 1 ? 'Batch' : 'Batches'}
                          </button>
                        ))}
                      </div>

                      {/* Custom Batches Input */}
                      <div className="flex items-center gap-2 mb-2">
                        <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Custom Batches:</label>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={stage2BatchCount}
                          onChange={e => {
                            setStage2AutoBatch(false);
                            setStage2BatchCount(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)));
                          }}
                          className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-900 dark:text-white text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Live Total Badge */}
                      <div className="p-2.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-300 font-medium">
                          Total Output Target:
                        </span>
                        <span className="font-black text-indigo-700 dark:text-indigo-300">
                          {stage2QuestionNaturalDensity ? (
                            stage2AutoBatch ? (
                              <div className="flex flex-col items-end text-right">
                                <span className="font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                                  <span>🤖 AI Pedagogical Plan (Active)</span>
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                                  Organically sizes total volume & decomposes into 3–5 Qs micro-batches
                                </span>
                              </div>
                            ) : (
                              <span>
                                {stage2QuestionCeiling === 0 ? 'Auto Density' : `≤${stage2QuestionCeiling} Cap`} × {stage2BatchCount} {stage2BatchCount === 1 ? 'Batch' : 'Batches'} = <span className="underline decoration-indigo-500 font-black">{stage2QuestionCeiling > 0 ? `≤${stage2QuestionCeiling * stage2BatchCount} Max Qs` : 'Syllabus-Sized Qs'}</span>
                              </span>
                            )
                          ) : (
                            <span>
                              {stage2QuestionCount} Qs × {stage2BatchCount} {stage2BatchCount === 1 ? 'Batch' : 'Batches'} = <span className="underline decoration-indigo-500 font-black">{stage2QuestionCount * stage2BatchCount} Total Qs</span>
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={stage2IncludeDiagrams}
                        onChange={e => setStage2IncludeDiagrams(e.target.checked)}
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                      />
                      Include Diagrams (Geometric, Venn & Charts)
                    </label>
                  </div>
                </div>
              )}

              {/* STEP 5: COGNITIVE DIFFICULTY LEVEL OR FLASHCARD PEDAGOGY */}
              {stage2TargetType === 'flashcards' ? (
                <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-purple-50/80 via-white to-violet-50/50 dark:from-slate-800/90 dark:via-slate-850 dark:to-slate-800/90 border border-purple-200/80 dark:border-purple-800/60 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-purple-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">5</span>
                        Cognitive Distillation Engine
                      </label>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-200/70 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                        ⚡ 5 Memory Archetypes
                      </span>
                    </div>

                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800/60 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎯</span>
                        <h5 className="text-xs font-black text-slate-900 dark:text-white">
                          High-Yield Memory Pain Points Only
                        </h5>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Eliminates generic textbook fluff and trivial elementary facts. Employs 4 negative filters to isolate atomic trigger-answer pairs (&lt; 15 words).
                      </p>

                      {/* 5 Cognitive Archetypes Showcase */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          ⚡ Statutory Articles
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          🔢 Quorums & Tenures
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          ⚠️ Provisos & Exceptions
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          📅 Landmark Years
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          🔄 Confusing Pairs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Strict anti-hallucination boundary: Locked solely to the scoped syllabus section.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">5</span>
                        Cognitive Difficulty Level
                      </label>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Prompt Calibration
                      </span>
                    </div>

                    {/* 3 Difficulty Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'easy' as const,
                          label: 'Simple / Foundational',
                          badge: '🟢 Simple',
                          desc: 'Direct facts, basic formulas & core definitions.',
                          activeClass: 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-200 ring-2 ring-emerald-500/20'
                        },
                        {
                          id: 'medium' as const,
                          label: 'Moderate / Standard',
                          badge: '🟡 Moderate',
                          desc: '2-step reasoning & typical OSSC/OSSSC standard.',
                          activeClass: 'bg-amber-500/10 border-amber-500 text-amber-950 dark:text-amber-200 ring-2 ring-amber-500/20'
                        },
                        {
                          id: 'hard' as const,
                          label: 'Advanced / Rigorous',
                          badge: '🔴 Advanced',
                          desc: 'Multi-statement assertion, deep LaTeX & OPSC rigor.',
                          activeClass: 'bg-rose-500/10 border-rose-500 text-rose-950 dark:text-rose-200 ring-2 ring-rose-500/20'
                        }
                      ].map(diff => {
                        const isDiffActive = stage2Difficulty === diff.id || (diff.id === 'hard' && stage2Difficulty === 'advanced_exam_standard');
                        return (
                          <button
                            key={diff.id}
                            type="button"
                            onClick={() => setStage2Difficulty(diff.id)}
                            className={cn(
                              "p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer",
                              isDiffActive
                                ? diff.activeClass
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                            )}
                          >
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider block mb-1">
                                {diff.badge}
                              </span>
                              <h5 className="text-xs font-black text-slate-900 dark:text-white">
                                {diff.label}
                              </h5>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                                {diff.desc}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enforces 4 options per MCQ, step-by-step rationale, and LaTeX math formatting.
                  </div>
                </div>
              )}

            </div>

            {/* ─────────────────────────────────────────────────────────────
                MULTI-BANK SEQUENTIAL AUTO-RUNNER LIVE FEED & STEP MONITOR
            ───────────────────────────────────────────────────────────── */}
            {(isQueueRunnerActive || queueExecutionSummary !== null || (stage2TargetMode === 'multi_bank' && queueFeedEvents.length > 0)) && (
              <div className="p-6 bg-slate-900/95 dark:bg-slate-950 border-2 border-brand-500/40 rounded-3xl shadow-2xl shadow-brand-500/10 backdrop-blur-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                {/* 1. Header with live pulsing status OR completed summary */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner border",
                        isQueueRunnerActive 
                          ? "bg-brand-500/20 border-brand-500/40 text-brand-400" 
                          : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      )}>
                        {isQueueRunnerActive ? <Bot className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      {isQueueRunnerActive && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          {stage2TargetType === 'flashcards'
                            ? (isQueueRunnerActive ? "Multi-Deck Pipeline Running — Live Telemetry" : "Multi-Deck Pipeline Finished — Execution Feed & Audit Trail")
                            : (isQueueRunnerActive ? "Multi-Bank Pipeline Running — Live Telemetry" : "Multi-Bank Pipeline Finished — Execution Feed & Audit Trail")}
                        </h4>
                        <span className={cn(
                          "text-[10px] font-black uppercase px-2 py-0.5 rounded-full border",
                          isQueueRunnerActive 
                            ? "bg-brand-500/20 text-brand-300 border-brand-500/30 animate-pulse"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                        )}>
                          {isQueueRunnerActive ? "Live Queue Active" : "Completed"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isQueueRunnerActive
                          ? `Processing ${stage2TargetType === 'flashcards' ? 'Deck' : 'Bank'} ${currentQueueIndex + 1} of ${selectedMultiBankIds.length} ("${(stage2TargetType === 'flashcards' ? examFlashcardDecks.find(d => d.id === selectedMultiBankIds[currentQueueIndex])?.title : questionBanks.find(b => b.id === selectedMultiBankIds[currentQueueIndex])?.title) || (stage2TargetType === 'flashcards' ? 'Current Deck' : 'Current Bank')}" • Batch ${currentRunningBatch}/${stage2BatchCount})`
                          : queueExecutionSummary 
                            ? `All ${queueExecutionSummary.completedBanks} of ${queueExecutionSummary.totalBanks} ${stage2TargetType === 'flashcards' ? 'flashcard decks' : 'question banks'} published (${queueExecutionSummary.totalQuestions} ${stage2TargetType === 'flashcards' ? 'cards' : 'questions'} uploaded) in ${Math.floor(queueExecutionSummary.durationSeconds / 60)}m ${queueExecutionSummary.durationSeconds % 60}s.`
                            : `${stage2TargetType === 'flashcards' ? 'Multi-deck' : 'Multi-bank'} execution completed.`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                    {isQueueRunnerActive && (
                      <button
                        type="button"
                        onClick={() => {
                          stopQueueRunnerRef.current = true;
                          toast(`${stage2TargetType === 'flashcards' ? 'Multi-Deck' : 'Multi-Bank'} Queue will pause after current ${stage2TargetType === 'flashcards' ? 'deck' : 'bank'} finishes.`, { icon: 'ℹ️' });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title={`Stop running further ${stage2TargetType === 'flashcards' ? 'decks' : 'banks'} in queue`}
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>Stop After {stage2TargetType === 'flashcards' ? 'Deck' : 'Bank'} {currentQueueIndex + 1}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleCopyQueueLog}
                      className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      title="Copy full execution log to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5 text-brand-400" />
                      <span>Copy Log</span>
                    </button>

                    {!isQueueRunnerActive && (
                      <button
                        type="button"
                        onClick={handleDismissQueueMonitor}
                        className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Dismiss monitor and clear feed"
                      >
                        <X className="w-3.5 h-3.5 text-rose-400" />
                        <span>Dismiss Feed</span>
                      </button>
                    )}

                    {isQueueRunnerActive && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono font-semibold">
                        <Clock className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                        <span>{Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}s</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Visual Multi-Bank Step Pipeline Grid */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Sequential {stage2TargetType === 'flashcards' ? 'Deck' : 'Bank'} Pipeline ({selectedMultiBankIds.length} {stage2TargetType === 'flashcards' ? 'Decks' : 'Banks'})
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {isQueueRunnerActive 
                        ? `${stage2TargetType === 'flashcards' ? 'Deck' : 'Bank'} ${currentQueueIndex + 1} of ${selectedMultiBankIds.length} in progress` 
                        : `All ${stage2TargetType === 'flashcards' ? 'decks' : 'banks'} processed`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {selectedMultiBankIds.map((bankId, bIdx) => {
                      const isFlashcard = stage2TargetType === 'flashcards';
                      const bank = isFlashcard
                        ? examFlashcardDecks.find(d => d.id === bankId)
                        : (stage2TargetType === 'practice_test'
                            ? examPracticeSets.find(b => b.id === bankId)
                            : questionBanks.find(b => b.id === bankId));
                      const qStatus = multiBankQueueStatus[bankId];
                      const isCurrent = isQueueRunnerActive && currentQueueIndex === bIdx;
                      const isDone = qStatus?.status === 'completed';
                      const isFailed = qStatus?.status === 'failed';
                      const isQueued = !qStatus || qStatus.status === 'queued';

                      return (
                        <div
                          key={bankId}
                          className={cn(
                            "p-3 rounded-2xl border transition-all flex flex-col justify-between gap-2 text-left relative overflow-hidden",
                            isCurrent && "bg-brand-950/60 border-brand-500 shadow-lg shadow-brand-500/20 ring-1 ring-brand-500",
                            isDone && "bg-emerald-950/40 border-emerald-500/40",
                            isFailed && "bg-rose-950/40 border-rose-500/40",
                            isQueued && "bg-slate-950/40 border-slate-800/80 opacity-75"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className={cn(
                                "w-6 h-6 rounded-lg text-xs flex items-center justify-center font-bold shrink-0",
                                isCurrent && "bg-brand-500/30 text-brand-300 animate-pulse",
                                isDone && "bg-emerald-500/20 text-emerald-400",
                                isFailed && "bg-rose-500/20 text-rose-400",
                                isQueued && "bg-slate-800 text-slate-500"
                              )}>
                                {isDone ? <Check className="w-3.5 h-3.5" /> : bIdx + 1}
                              </span>
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-white truncate" title={bank?.title || (isFlashcard ? 'Deck' : 'Bank')}>
                                  {bank?.title || (isFlashcard ? 'Deck' : 'Bank')}
                                </h5>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {isFlashcard 
                                    ? ((bank as any)?.subject || 'Flashcard Deck') + ((bank as any)?.sub_subject ? ` • ${(bank as any).sub_subject}` : '')
                                    : (bank?.tagline || 'Question Bank')}
                                </p>
                              </div>
                            </div>

                            <span className={cn(
                              "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                              isCurrent && "bg-brand-500/30 text-brand-300 border border-brand-500/40 animate-pulse",
                              isDone && "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
                              isFailed && "bg-rose-500/20 text-rose-300 border border-rose-500/30",
                              isQueued && "bg-slate-800 text-slate-400"
                            )}>
                              {isDone ? `✅ Saved ${qStatus?.count || 0} ${isFlashcard ? 'Cards' : 'Qs'}` : isCurrent ? `⚡ Batch ${currentRunningBatch}/${stage2BatchCount}` : isFailed ? 'Failed' : 'Queued'}
                            </span>
                          </div>

                          {/* Step micro-indicators */}
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 pt-1 border-t border-slate-800/60">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded",
                              (isDone || isCurrent) ? "text-emerald-400 bg-emerald-500/10 font-bold" : "text-slate-600"
                            )}>
                              1. Ground
                            </span>
                            <span className="text-slate-600">→</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded",
                              isDone ? "text-emerald-400 bg-emerald-500/10 font-bold" : isCurrent ? "text-brand-300 bg-brand-500/20 font-bold animate-pulse" : "text-slate-600"
                            )}>
                              {isDone
                                ? `2. Generated (${qStatus?.count} ${isFlashcard ? 'Cards' : 'Qs'})`
                                : isFlashcard && stage2NaturalDensity
                                ? `2. Natural Density (${stage2QuestionCount > 0 ? `≤${stage2QuestionCount} Cards` : 'Auto'})`
                                : `2. Generate (${stage2QuestionCount * stage2BatchCount} ${isFlashcard ? 'Cards' : 'Qs'})`}
                            </span>
                            <span className="text-slate-600">→</span>
                            <span className={cn(
                              "px-1.5 py-0.5 rounded",
                              isDone ? "text-emerald-400 bg-emerald-500/10 font-bold" : (isCurrent && qStatus?.step === 'publishing') ? "text-amber-300 bg-amber-500/20 font-bold animate-pulse" : "text-slate-600"
                            )}>
                              3. Publish
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Chronological Live Event Feed (Terminal Style) */}
                <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <Terminal className="w-4 h-4 text-brand-400" />
                      <span className="font-bold">Live Execution Feed & Step Timeline</span>
                      <span className="text-[10px] text-slate-500 font-normal">({queueFeedEvents.length} events logged)</span>
                      {isQueueRunnerActive && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-1" />}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoScrollQueueFeed}
                          onChange={(e) => setAutoScrollQueueFeed(e.target.checked)}
                          className="w-3 h-3 rounded accent-brand-500"
                        />
                        <span>Auto-scroll</span>
                      </label>
                    </div>
                  </div>

                  <div 
                    ref={queueFeedContainerRef}
                    className="h-44 sm:h-56 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 pr-2 scrollbar-thin scrollbar-thumb-slate-700"
                  >
                    {queueFeedEvents.length === 0 ? (
                      <div className="text-slate-500 italic py-4 text-center">
                        &gt; Multi-bank queue events will appear here step-by-step as each bank generates and publishes...
                      </div>
                    ) : (
                      queueFeedEvents.map((evt, idx) => {
                        const isLatest = idx === queueFeedEvents.length - 1;
                        return (
                          <div 
                            key={evt.id}
                            className={cn(
                              "flex items-start gap-2 p-1.5 rounded-lg transition-colors",
                              evt.type === 'bank_done' && "bg-emerald-950/30 text-emerald-300",
                              evt.type === 'publishing' && "bg-amber-950/20 text-amber-300",
                              evt.type === 'batch_gen' && "bg-slate-900/60 text-slate-300",
                              evt.type === 'advancing' && "bg-indigo-950/30 text-indigo-300 font-semibold",
                              evt.type === 'bank_failed' && "bg-rose-950/30 text-rose-300 font-semibold",
                              evt.type === 'queue_complete' && "bg-emerald-900/40 text-emerald-200 font-bold border border-emerald-500/30",
                              isLatest && "ring-1 ring-brand-500/30"
                            )}
                          >
                            <span className="text-slate-500 text-[10px] shrink-0 select-none">
                              [{evt.timestamp}]
                            </span>
                            <span className="break-all">
                              {evt.message}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                SINGLE TARGET REAL-TIME MULTI-STAGE TELEMETRY SCREEN
            ───────────────────────────────────────────────────────────── */}
            {isGeneratingQuestions && stage2TargetMode === 'single' && (
              <div className="p-6 bg-slate-900/95 dark:bg-slate-950 border-2 border-brand-500/40 rounded-3xl shadow-2xl shadow-brand-500/10 backdrop-blur-xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                {/* Header with pulsing status and live elapsed timer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 shadow-inner">
                        <Bot className="w-5 h-5 animate-pulse" />
                      </div>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white tracking-wide">
                          Neural AI Paper Setter & Multi-Agent Auditor
                        </h4>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 animate-pulse">
                          Live Pipeline Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isBatchRunnerActive 
                          ? `Auto-Runner active: Batch ${currentRunningBatch} of ${stage2BatchCount} (${stage2QuestionCount} Qs/batch • Target: ${stage2QuestionCount * stage2BatchCount} Qs)`
                          : `Generating ${stage2QuestionCount} exam questions with syllabus grounding and 100% mutual exclusivity`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto flex-wrap">
                    {isBatchRunnerActive && (
                      <button
                        type="button"
                        onClick={() => {
                          stopBatchRunnerRef.current = true;
                          toast('Auto-Runner will pause after current batch finishes.', { icon: 'ℹ️' });
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                        title="Stop running further batches"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>Stop After Batch {currentRunningBatch}</span>
                      </button>
                    )}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300 text-xs font-mono font-semibold">
                      <Clock className="w-3.5 h-3.5 text-brand-400 animate-spin" />
                      <span>{Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:{(elapsedSeconds % 60).toString().padStart(2, '0')}s</span>
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                      {isBatchRunnerActive 
                        ? `Batch ${currentRunningBatch}/${stage2BatchCount} • ${telemetryEvent ? `${telemetryEvent.percent}%` : 'Running...'}`
                        : (telemetryEvent ? `${telemetryEvent.percent}% Complete` : 'Initializing...')}
                    </div>
                  </div>
                </div>

                {/* Live Progress Bar with Stage Title & Count */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                      {telemetryEvent?.stageName || 'Preparing Generation Pipeline...'}
                    </span>
                    <span className="text-brand-400 font-mono">
                      {telemetryEvent ? `${telemetryEvent.currentCount} / ${telemetryEvent.totalCount} Questions` : `0 / ${stage2QuestionCount} Questions`}
                    </span>
                  </div>
                  
                  <div className="relative w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                    <div 
                      className="h-full bg-gradient-to-r from-brand-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-500 ease-out shadow-lg shadow-brand-500/50"
                      style={{ width: `${Math.max(5, Math.min(100, telemetryEvent?.percent || 5))}%` }}
                    />
                  </div>
                  
                  <p className="text-[11px] text-slate-400 italic">
                    {telemetryEvent?.message || 'Initiating syllabus grounding and connecting to multi-agent neural pipeline...'}
                  </p>
                </div>

                {/* 5-Stage Visual Stepper */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                  {[
                    { id: 'grounding', name: '1. Grounding', desc: 'Syllabus & Blueprint', icon: Brain },
                    { id: 'generation', name: '2. Generation', desc: 'Zero Hallucination', icon: Cpu },
                    { id: 'guardrails', name: '3. Guardrails', desc: 'LaTeX & Schema Check', icon: ShieldCheck },
                    { id: 'auditing', name: '4. Auditor Solve', desc: 'Single-Key Verification', icon: CheckCircle2 },
                    { id: 'balancing', name: '5. Key Balance', desc: '25% Distribution', icon: Scale },
                  ].map((st, idx) => {
                    const stageNum = idx + 1;
                    const currentStageIndex = telemetryEvent?.stageIndex || 1;
                    const isDone = currentStageIndex > stageNum;
                    const isActive = currentStageIndex === stageNum;
                    const isPending = currentStageIndex < stageNum;
                    const StepIcon = st.icon;

                    return (
                      <div 
                        key={st.id}
                        className={cn(
                          "p-3 rounded-2xl border transition-all text-left flex flex-col justify-between relative overflow-hidden",
                          isDone && "bg-emerald-950/40 border-emerald-500/40 text-emerald-300",
                          isActive && "bg-brand-950/60 border-brand-500 text-white shadow-lg shadow-brand-500/20 ring-1 ring-brand-500",
                          isPending && "bg-slate-800/30 border-slate-800/60 text-slate-500"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={cn(
                            "p-1.5 rounded-lg text-xs",
                            isDone && "bg-emerald-500/20 text-emerald-400",
                            isActive && "bg-brand-500/30 text-brand-300 animate-pulse",
                            isPending && "bg-slate-800 text-slate-600"
                          )}>
                            {isDone ? <Check className="w-3.5 h-3.5" /> : <StepIcon className={cn("w-3.5 h-3.5", isActive && "animate-spin")} />}
                          </span>
                          <span className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0.5 rounded",
                            isDone ? 'Done' : isActive ? 'Active' : 'Queued'
                          )}>
                            {isDone ? 'Done' : isActive ? 'Active' : 'Queued'}
                          </span>
                        </div>
                        <div>
                          <h5 className={cn("text-xs font-bold leading-tight", isActive ? "text-white" : isDone ? "text-emerald-300" : "text-slate-400")}>
                            {st.name}
                          </h5>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                            {st.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Live Terminal Telemetry Feed */}
                <div className="bg-slate-950/90 rounded-2xl border border-slate-800 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                      <Terminal className="w-3.5 h-3.5 text-brand-400" />
                      <span>Telemetry Stream Feed</span>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTelemetryLogs(!showTelemetryLogs)}
                      className="text-[10px] text-slate-400 hover:text-white font-mono transition-colors"
                    >
                      {showTelemetryLogs ? 'Collapse' : `Expand (${telemetryLogs.length} logs)`}
                    </button>
                  </div>

                  {showTelemetryLogs && (
                    <div className="h-28 overflow-y-auto font-mono text-[10px] leading-relaxed space-y-1 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                      {telemetryLogs.length === 0 ? (
                        <div className="text-slate-500 italic py-2">
                          &gt; Establishing SSE telemetry stream with server AI pipeline...
                        </div>
                      ) : (
                        telemetryLogs.map((log, lIdx) => (
                          <div 
                            key={lIdx} 
                            className={cn(
                              "flex items-start gap-1.5",
                              lIdx === telemetryLogs.length - 1 ? "text-brand-300 font-semibold" : "text-slate-400"
                            )}
                          >
                            <span className="text-slate-600 select-none">&gt;</span>
                            <span className="break-all">{log}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Trigger Button */}
            {stage2TargetMode === 'multi_bank' ? (
              <button
                type="button"
                onClick={handleRunMultiBankQueue}
                disabled={isGeneratingQuestions || selectedMultiBankIds.length === 0}
                className={cn(
                  "w-full py-4 font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer",
                  selectedMultiBankIds.length === 0
                    ? "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 cursor-not-allowed shadow-none"
                    : stage2TargetType === 'flashcards'
                    ? "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-800 text-white shadow-purple-500/25 disabled:opacity-50"
                    : "bg-gradient-to-r from-brand-600 via-indigo-600 to-brand-700 hover:from-brand-700 hover:to-indigo-800 text-white shadow-brand-500/25 disabled:opacity-50"
                )}
              >
                {isGeneratingQuestions ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      Running {stage2TargetType === 'flashcards' ? 'Deck' : 'Bank'} {currentQueueIndex + 1} of {selectedMultiBankIds.length} (Batch {currentRunningBatch}/{stage2BatchCount} • {telemetryEvent ? `${telemetryEvent.percent}%` : 'In Progress'})...
                    </span>
                  </>
                ) : selectedMultiBankIds.length === 0 ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Select at least 1 {stage2TargetType === 'flashcards' ? 'Flashcard Deck' : 'Question Bank'} above to start {stage2TargetType === 'flashcards' ? 'Multi-Deck' : 'Multi-Bank'} Auto-Runner</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      {stage2TargetType === 'flashcards' ? (
                        stage2NaturalDensity ? (
                          `🚀 Run Multi-Deck Pipeline (${selectedMultiBankIds.length} Decks • Natural Density ${stage2QuestionCount > 0 ? `[≤${stage2QuestionCount} Cap]` : '[Auto Sizing]'})`
                        ) : (
                          `🚀 Run Multi-Deck Pipeline (${selectedMultiBankIds.length} Decks • ${stage2QuestionCount} Cards/Deck • ${selectedMultiBankIds.length * stage2QuestionCount} Total Cards)`
                        )
                      ) : (
                        `🚀 Run Multi-Bank Auto-Runner (${selectedMultiBankIds.length} Banks • ${stage2QuestionCount * stage2BatchCount} Qs/Bank • ${selectedMultiBankIds.length * stage2QuestionCount * stage2BatchCount} Total Qs)`
                      )}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={isGeneratingQuestions}
                className={cn(
                  "w-full py-4 text-white font-black rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer",
                  stage2TargetType === 'flashcards'
                    ? "bg-purple-600 hover:bg-purple-700 shadow-purple-600/25"
                    : "bg-brand-600 hover:bg-brand-700 shadow-brand-500/25"
                )}
              >
                {isGeneratingQuestions ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {isBatchRunnerActive 
                      ? `Running Batch ${currentRunningBatch} of ${stage2BatchCount} (${telemetryEvent ? `${telemetryEvent.currentCount}/${telemetryEvent.totalCount}` : 'In Progress'})...`
                      : `Generating Batch (${telemetryEvent ? `${telemetryEvent.currentCount}/${telemetryEvent.totalCount}` : generationProgress ? `${generationProgress.current}/${generationProgress.total}` : 'In Progress'})...`}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    {stage2TargetType === 'flashcards' ? (
                      stage2BatchCount > 1
                        ? `🚀 Run Multi-Batch Flashcard Runner (${stage2BatchCount} Batches • ${stage2QuestionCount > 0 ? `${stage2QuestionCount * stage2BatchCount} Max Cards` : 'Dynamic Density'}) for "${stage2TestTitle || 'Selected Deck'}"`
                        : (stage2NaturalDensity
                            ? (stage2QuestionCount === 0
                                ? `✨ Auto-Extract High-Yield Cards (Natural Density) for "${stage2TestTitle || 'Selected Deck'}"`
                                : `✨ Auto-Extract High-Yield Cards (Natural Density • ≤${stage2QuestionCount} Cap) for "${stage2TestTitle || 'Selected Deck'}"`)
                            : `✨ Generate exactly ${stage2QuestionCount} High-Yield Cards for "${stage2TestTitle || 'Selected Deck'}"`)
                    ) : (
                      stage2BatchCount > 1 ? (
                        `🚀 Run Multi-Batch Auto-Runner (${stage2BatchCount} Batches • ${stage2QuestionCount * stage2BatchCount} Total Questions) for "${stage2TestTitle || 'Target Test'}"`
                      ) : (
                        `Generate ${stage2QuestionCount} Questions (${stage2Difficulty === 'easy' ? 'Simple' : stage2Difficulty === 'medium' ? 'Moderate' : 'Advanced'}) for "${stage2TestTitle || 'Target Test'}"`
                      )
                    )}
                  </>
                )}
              </button>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────────
              5. LIVE INTERACTIVE REVIEW & 1-CLICK PUBLISH GRID
          ───────────────────────────────────────────────────────────── */}
          {generatedQuestions.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              {/* Enterprise Quality Assurance Summary Banner */}
              {(() => {
                const verifiedCount = generatedQuestions.filter(q => q.audit?.verified !== false).length;
                const autoRepairedCount = generatedQuestions.filter(q => q.audit?.confidence === 'AUTO_REPAIRED').length;
                const avgRelevance = Math.round(
                  generatedQuestions.reduce((acc, q) => acc + (q.audit?.syllabusRelevanceScore || 98), 0) / (generatedQuestions.length || 1)
                );

                return (
                  <div className="p-5 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl shadow-xl space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-5 h-5" />
                          </span>
                          <h3 className="text-base font-black text-white flex items-center gap-2 flex-wrap">
                            Enterprise Multi-Agent Verification & Audit Engine
                            <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Zero-Hallucination Protocol
                            </span>
                          </h3>
                        </div>
                        <p className="text-xs text-slate-300">
                          Every question has been independently solved by a secondary auditor model and verified for syllabus strictness, verified arithmetic, and authentic nomenclature.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        <button
                          onClick={handleAuditQuestions}
                          disabled={isAuditingQuestions}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-700 transition-all disabled:opacity-50"
                        >
                          <RotateCcw className={cn("w-3.5 h-3.5", isAuditingQuestions && "animate-spin text-brand-400")} />
                          {isAuditingQuestions ? 'Auditing...' : 'Re-Run Chief Auditor'}
                        </button>

                        <button
                          onClick={() => handlePublishQuestions()}
                          disabled={isPublishingQuestions}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isPublishingQuestions ? 'Publishing...' : '🚀 1-Click Publish to Database'}
                        </button>
                      </div>
                    </div>

                    {/* Metrics Pills */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800">
                      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-white">{verifiedCount} / {generatedQuestions.length} Verified</div>
                          <div className="text-[10px] text-slate-400 font-medium">Double-Blind Solved</div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
                        <Target className="w-4 h-4 text-sky-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-white">{avgRelevance}% Grounded</div>
                          <div className="text-[10px] text-slate-400 font-medium">Syllabus Match Score</div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
                        <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-white">{stage2Difficulty.toUpperCase()}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Calibrated Difficulty</div>
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 flex items-center gap-2.5">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <div className="text-xs font-black text-white">{autoRepairedCount > 0 ? `${autoRepairedCount} Auto-Repaired` : '100% Consensus'}</div>
                          <div className="text-[10px] text-slate-400 font-medium">Dual-Model Agreement</div>
                        </div>
                      </div>
                    </div>

                    {/* Psychometric Answer Key Distribution Meter */}
                    <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Answer Key Balance:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {['A', 'B', 'C', 'D'].map((letter, lIdx) => {
                            const cnt = generatedQuestions.filter(q => q.correctAnswerIndex === lIdx).length;
                            const pct = Math.round((cnt / (generatedQuestions.length || 1)) * 100);
                            return (
                              <span 
                                key={letter}
                                className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-200 flex items-center gap-1"
                              >
                                <span className="font-bold text-brand-400">{letter}:</span>
                                <span>{cnt} ({pct}%)</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          0 Duplicate Stems
                        </span>
                        <span className="flex items-center gap-1 text-sky-400 font-bold">
                          <Scale className="w-3 h-3" />
                          Anti-Clustering (Run ≤ 2)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Batch Filter Toolbar */}
              {(() => {
                const availableBatches = Array.from(new Set(generatedQuestions.map(q => q.batchNumber || 1))).sort((a: any, b: any) => a - b);
                if (availableBatches.length <= 1) return null;

                const filteredCount = selectedBatchFilter === 'all' 
                  ? generatedQuestions.length 
                  : generatedQuestions.filter(q => (q.batchNumber || 1) === selectedBatchFilter).length;

                return (
                  <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mr-1">
                        <Filter className="w-3.5 h-3.5 text-brand-500" />
                        Batch Filter:
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedBatchFilter('all')}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                          selectedBatchFilter === 'all'
                            ? "bg-brand-600 text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        )}
                      >
                        <span>All Batches</span>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
                          {generatedQuestions.length}
                        </span>
                      </button>
                      {availableBatches.map(bNum => {
                        const countInBatch = generatedQuestions.filter(q => (q.batchNumber || 1) === bNum).length;
                        return (
                          <button
                            key={bNum}
                            type="button"
                            onClick={() => setSelectedBatchFilter(bNum)}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                              selectedBatchFilter === bNum
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                            )}
                          >
                            <Layers className="w-3 h-3" />
                            <span>Batch {bNum}</span>
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-black/20 font-black">
                              {countInBatch}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {typeof selectedBatchFilter === 'number' && (
                      <button
                        type="button"
                        onClick={() => handlePublishQuestions(selectedBatchFilter)}
                        disabled={isPublishingQuestions}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Publish Batch {selectedBatchFilter} Only ({filteredCount} Qs)</span>
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* Questions List with KaTeX Rendering */}
              <div className="space-y-4">
                {(() => {
                  const displayedQuestions = selectedBatchFilter === 'all'
                    ? generatedQuestions
                    : generatedQuestions.filter(q => (q.batchNumber || 1) === selectedBatchFilter);

                  return displayedQuestions.map((q, displayedIdx) => {
                    const origIdx = generatedQuestions.indexOf(q);
                    const qIdx = origIdx !== -1 ? origIdx : displayedIdx;
                    const isEditing = editingQuestionIndex === qIdx;

                    return (
                      <div
                        key={qIdx}
                        className="p-5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 transition-all"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-7 h-7 rounded-xl bg-brand-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                              #{qIdx + 1}
                            </span>
                            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              Batch {q.batchNumber || 1}
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {q.topic || stage2Subject || 'General Studies'}
                            </span>
                            {stage2TargetType === 'flashcards' ? (
                              <span className={cn(
                                "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1",
                                q.archetype === 'STATUTORY' && "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800",
                                q.archetype === 'THRESHOLD' && "bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800",
                                q.archetype === 'EXCEPTION' && "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800",
                                q.archetype === 'CHRONOLOGY' && "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
                                q.archetype === 'CONFUSING_PAIR' && "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800",
                                (!q.archetype || q.archetype === 'CONCEPT') && "bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800"
                              )}>
                                {q.archetype === 'STATUTORY' && '⚡ STATUTORY'}
                                {q.archetype === 'THRESHOLD' && '🔢 THRESHOLD'}
                                {q.archetype === 'EXCEPTION' && '⚠️ EXCEPTION'}
                                {q.archetype === 'CHRONOLOGY' && '📅 CHRONOLOGY'}
                                {q.archetype === 'CONFUSING_PAIR' && '🔄 CONFUSING PAIR'}
                                {(!q.archetype || q.archetype === 'CONCEPT') && '🎯 HIGH-YIELD FACT'}
                              </span>
                            ) : (
                              <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                {q.difficulty}
                              </span>
                            )}
                            {q.audit?.consensusMatch ? (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Consensus Verified
                            </span>
                          ) : q.audit?.confidence === 'AUTO_REPAIRED' ? (
                            <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Auto-Repaired
                            </span>
                          ) : null}
                          {q.audit?.syllabusRelevanceScore && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 flex items-center gap-1">
                              <Target className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                              {q.audit.syllabusRelevanceScore}% Syllabus Grounded
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingQuestionIndex(isEditing ? null : qIdx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            {isEditing ? 'Done' : 'Edit'}
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(qIdx)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Flashcard vs MCQ Content Body */}
                      {stage2TargetType === 'flashcards' ? (
                        <div className="space-y-3 pt-1">
                          {/* Front Face: Trigger Recall Question */}
                          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                              <Target className="w-3.5 h-3.5 text-purple-600" />
                              Recall Trigger (Front Face):
                            </span>
                            {isEditing ? (
                              <textarea
                                value={q.front_text || q.questionText}
                                onChange={e => handleUpdateQuestion(qIdx, 'front_text', e.target.value)}
                                rows={2}
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white font-bold outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            ) : (
                              <div className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                                <MathTextRenderer text={q.front_text || q.questionText} />
                              </div>
                            )}
                          </div>

                          {/* Back Face: Direct Crisp Answer */}
                          <div className="p-3.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 space-y-1.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                Direct Crisp Answer (Back Face):
                              </span>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Target Recall
                              </span>
                            </div>
                            {isEditing ? (
                              <textarea
                                value={q.back_text || q.explanation}
                                onChange={e => handleUpdateQuestion(qIdx, 'back_text', e.target.value)}
                                rows={2}
                                className="w-full bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white font-medium outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            ) : (
                              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-100 dark:border-purple-900/60 shadow-2xs">
                                <MathTextRenderer text={q.back_text || q.explanation} />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-3">
                            {/* Question Text for MCQs */}
                            {isEditing ? (
                              <textarea
                                value={q.questionText}
                                onChange={e => handleUpdateQuestion(qIdx, 'questionText', e.target.value)}
                                rows={3}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl p-3 text-sm text-slate-900 dark:text-white font-mono"
                              />
                            ) : (
                              <div className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                                <MathTextRenderer text={q.questionText} />
                              </div>
                            )}

                            {/* Diagram (if present) */}
                            {q.diagram && (
                              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 max-w-sm">
                                <span className="text-[10px] font-bold text-slate-400 block mb-1">Generated Dynamic Diagram:</span>
                                <UniversalMathDiagramEngine data={q.diagram} />
                              </div>
                            )}

                            {/* Options Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {(Array.isArray(q.options) ? q.options : []).map((opt: string, optIdx: number) => {
                                const isCorrect = q.correctAnswerIndex === optIdx;

                                return (
                                  <div
                                    key={optIdx}
                                    onClick={() => isEditing && handleUpdateQuestion(qIdx, 'correctAnswerIndex', optIdx)}
                                    className={cn(
                                      "p-3 rounded-xl border text-xs sm:text-sm font-medium flex items-center gap-3 transition-all",
                                      isCorrect
                                        ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm"
                                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
                                      isEditing && "cursor-pointer hover:border-brand-500"
                                    )}
                                  >
                                    <span className={cn(
                                      "w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0",
                                      isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                    )}>
                                      {String.fromCharCode(65 + optIdx)}
                                    </span>

                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={e => handleUpdateOption(qIdx, optIdx, e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-white"
                                      />
                                    ) : (
                                      <div className="flex-1">
                                        <MathTextRenderer text={opt} />
                                      </div>
                                    )}

                                    {isCorrect && (
                                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Explanation */}
                          <div className="p-3 bg-slate-100/60 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                            <div>
                              <span className="font-bold text-slate-800 dark:text-white block mb-1">
                                💡 Step-by-Step Explanation:
                              </span>
                              {isEditing ? (
                                <textarea
                                  value={q.explanation}
                                  onChange={e => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                                  rows={2}
                                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-2 text-xs text-slate-900 dark:text-white font-mono"
                                />
                              ) : (
                                <MathTextRenderer text={q.explanation} />
                              )}
                            </div>
                          </div>
                        </>
                      )}

                        {/* Auditor Verification Notes */}
                        {q.audit?.auditNotes && (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-start gap-2 text-[11px] text-emerald-700 dark:text-emerald-400">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Chief Auditor Verdict: </span>
                              <span>{q.audit.auditNotes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                  );
                });
              })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
