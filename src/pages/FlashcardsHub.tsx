import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Layers, Sparkles, Search, BookOpen, Flame, Trophy, Play, CheckCircle2, 
  RotateCw, ArrowRight, Lock, Check, Clock, Filter, AlertCircle,
  ChevronRight, ArrowLeft, GraduationCap, FolderOpen, BookMarked
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageLayout from '../components/PageLayout';
import { FlashcardStudyModal } from '../components/flashcards/FlashcardStudyModal';
import { examService, isAuthenticExam } from '../lib/examService';
import { useAuth } from '../lib/AuthContext';
import type { FlashcardDeck, Flashcard, UserCardProgress } from '../lib/srsEngine';

export interface SubjectSummary {
  name: string;
  deckCount: number;
  cardCount: number;
  dueCount: number;
  masteredCount: number;
  decks: FlashcardDeck[];
}

export const FlashcardsHub: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Exams and Decks State
  const [exams, setExams] = useState<any[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // URL Context: selected exam & active subject & stage
  const queryExam = searchParams.get('exam');
  const querySubject = searchParams.get('subject');
  const queryStage = searchParams.get('stage');

  const [selectedExamId, setSelectedExamId] = useState<string>(() => {
    if (queryExam && queryExam !== 'all') return queryExam;
    try {
      const saved = sessionStorage.getItem('oep_selectedExam');
      if (saved) return saved;
    } catch (e) {}
    return 'all';
  });
  const [activeSubject, setActiveSubject] = useState<string | null>(querySubject || null);
  const [selectedStage, setSelectedStage] = useState<string>(queryStage || 'all');

  // Active study session modal
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [deckCards, setDeckCards] = useState<Flashcard[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, UserCardProgress>>({});
  const [isStudyModalOpen, setIsStudyModalOpen] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);

  // Sync state if URL query changes
  useEffect(() => {
    if (queryExam && queryExam !== selectedExamId) {
      setSelectedExamId(queryExam);
    }
  }, [queryExam]);

  useEffect(() => {
    setActiveSubject(querySubject || null);
  }, [querySubject]);

  useEffect(() => {
    setSelectedStage(queryStage || 'all');
  }, [queryStage]);

  // Load all exams, flashcard decks, and user progress
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [fetchedExams, allDecks, userProg] = await Promise.all([
          examService.getAllExams().catch(() => []),
          examService.getAllFlashcardDecks(),
          user?.id ? examService.getUserFlashcardProgress(user.id) : Promise.resolve({})
        ]);

        if (!isMounted) return;
        const validExams = (fetchedExams || []).filter(isAuthenticExam);
        setExams(validExams);

        // Resolve active exam: query param -> sessionStorage -> first authentic exam
        let effectiveExamId = queryExam;
        if (!effectiveExamId || effectiveExamId === 'all' || !validExams.some(e => e.id === effectiveExamId || e.name?.toLowerCase() === effectiveExamId?.toLowerCase())) {
          try {
            const saved = sessionStorage.getItem('oep_selectedExam');
            if (saved && validExams.some(e => e.id === saved || e.name?.toLowerCase() === saved?.toLowerCase())) {
              effectiveExamId = saved;
            } else if (validExams.length > 0) {
              effectiveExamId = validExams[0].id;
            }
          } catch (e) {
            if (validExams.length > 0) effectiveExamId = validExams[0].id;
          }
        }

        if (effectiveExamId && effectiveExamId !== 'all') {
          setSelectedExamId(effectiveExamId);
          if (!queryExam || queryExam === 'all') {
            const sp = new URLSearchParams(window.location.search);
            sp.set('exam', effectiveExamId);
            setSearchParams(sp, { replace: true });
          }
        }

        // Set real database decks only
        setDecks(allDecks || []);

        setProgressMap(userProg || {});
      } catch (err) {
        console.error("Failed to load flashcards hub data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => { isMounted = false; };
  }, [user]);

  // Handle exam change
  const handleSelectExam = (examId: string) => {
    setSelectedExamId(examId);
    setActiveSubject(null);
    setSelectedStage('all');
    const params = new URLSearchParams(searchParams);
    if (examId === 'all') {
      params.delete('exam');
    } else {
      params.set('exam', examId);
    }
    params.delete('subject');
    params.delete('stage');
    setSearchParams(params);
  };

  // Handle stage change
  const handleSelectStage = (stage: string) => {
    setSelectedStage(stage);
    setActiveSubject(null);
    const params = new URLSearchParams(searchParams);
    if (stage === 'all') {
      params.delete('stage');
    } else {
      params.set('stage', stage);
    }
    params.delete('subject');
    setSearchParams(params);
  };

  // Handle subject change
  const handleSelectSubject = (subjectName: string | null) => {
    setActiveSubject(subjectName);
    const params = new URLSearchParams(searchParams);
    if (subjectName) {
      params.set('subject', subjectName);
    } else {
      params.delete('subject');
    }
    setSearchParams(params);
  };

  // Current active exam object
  const currentExam = useMemo(() => {
    if (selectedExamId === 'all') return null;
    return exams.find(e => e.id === selectedExamId || e.name?.toLowerCase() === selectedExamId?.toLowerCase());
  }, [exams, selectedExamId]);

  // Available stages for the current exam or loaded decks
  const availableStages = useMemo(() => {
    if (selectedExamId === 'all') {
      const stageSet = new Set<string>();
      decks.forEach(d => {
        if (d.stage && d.stage !== 'All Stages') stageSet.add(d.stage);
      });
      return Array.from(stageSet);
    }
    if (currentExam && Array.isArray(currentExam.stages) && currentExam.stages.length > 0) {
      return currentExam.stages;
    }
    const stageSet = new Set<string>();
    decks.forEach(d => {
      if ((d.exam_id === selectedExamId || (currentExam && d.exam_id === currentExam.id)) && d.stage && d.stage !== 'All Stages') {
        stageSet.add(d.stage);
      }
    });
    return Array.from(stageSet);
  }, [currentExam, decks, selectedExamId]);

  // Decks filtered by current exam and stage
  const examScopedDecks = useMemo(() => {
    let list = decks;
    if (selectedExamId !== 'all') {
      list = decks.filter(d => {
        if (!d.exam_id) return true; // generic deck available to all
        return d.exam_id === selectedExamId || d.exam_id === 'opsc-aio' || (currentExam && d.exam_id === currentExam.id);
      });
    }
    if (selectedStage !== 'all') {
      list = list.filter(d => !d.stage || d.stage === 'All Stages' || d.stage.toLowerCase() === selectedStage.toLowerCase());
    }
    return list;
  }, [decks, selectedExamId, currentExam, selectedStage]);

  // Aggregate decks into Subjects
  const subjectSummaries = useMemo<SubjectSummary[]>(() => {
    const map = new Map<string, { decks: FlashcardDeck[]; cardCount: number }>();
    const now = new Date();

    examScopedDecks.forEach(deck => {
      const subject = deck.subject || 'General Studies';
      if (!map.has(subject)) {
        map.set(subject, { decks: [], cardCount: 0 });
      }
      const entry = map.get(subject)!;
      entry.decks.push(deck);
      entry.cardCount += (deck.card_count || 0);
    });

    const summaries: SubjectSummary[] = [];
    map.forEach((data, name) => {
      let dueCount = 0;
      let masteredCount = 0;

      data.decks.forEach(d => {
        Object.values(progressMap).forEach((prog: UserCardProgress) => {
          if (prog.deck_id === d.id) {
            if (prog.state === 'mastered') masteredCount++;
            if (prog.due_date && new Date(prog.due_date) <= now) {
              dueCount++;
            }
          }
        });
      });

      summaries.push({
        name,
        deckCount: data.decks.length,
        cardCount: data.cardCount,
        dueCount,
        masteredCount,
        decks: data.decks
      });
    });

    // Filter by search query if any
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return summaries.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.decks.some(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q))
      );
    }

    return summaries;
  }, [examScopedDecks, progressMap, searchQuery]);

  // Global counts for active exam context
  const globalStats = useMemo(() => {
    let totalCards = 0;
    let dueToday = 0;
    let mastered = 0;
    const now = new Date();

    examScopedDecks.forEach(d => {
      totalCards += (d.card_count || 0);
    });

    const deckIdSet = new Set(examScopedDecks.map(d => d.id));
    Object.values(progressMap).forEach((prog: UserCardProgress) => {
      if (deckIdSet.has(prog.deck_id)) {
        if (prog.state === 'mastered') mastered++;
        if (prog.due_date && new Date(prog.due_date) <= now) {
          dueToday++;
        }
      }
    });

    return { totalCards, dueToday, mastered };
  }, [examScopedDecks, progressMap]);

  // Current Subject Decks when in drill-down view
  const currentSubjectDecks = useMemo(() => {
    if (!activeSubject) return [];
    const subj = subjectSummaries.find(s => s.name.toLowerCase() === activeSubject.toLowerCase());
    return subj ? subj.decks : [];
  }, [activeSubject, subjectSummaries]);

  // Launch deck study session
  const handleStartStudy = async (deck: FlashcardDeck) => {
    setActiveDeck(deck);
    setLoadingCards(true);
    try {
      const cards = await examService.getFlashcardsByDeckId(deck.id);
      if (cards && cards.length > 0) {
        setDeckCards(cards);
        setIsStudyModalOpen(true);
      } else {
        toast('No flashcards found in this deck yet. Add cards in the Admin Panel.', {
          icon: 'ℹ️'
        });
      }
    } catch (err) {
      console.error("Failed to fetch deck cards:", err);
      toast.error('Failed to load flashcards for this deck.');
    } finally {
      setLoadingCards(false);
    }
  };

  // Launch Master Subject Study (combine all cards from subject decks)
  const handleStudyWholeSubject = async (subject: SubjectSummary) => {
    setLoadingCards(true);
    try {
      let combinedCards: Flashcard[] = [];
      for (const d of subject.decks) {
        const cards = await examService.getFlashcardsByDeckId(d.id).catch(() => []);
        combinedCards = [...combinedCards, ...cards];
      }

      if (combinedCards.length === 0) {
        toast('No flashcards found for this subject yet. Add cards in the Admin Panel.', {
          icon: 'ℹ️'
        });
        return;
      }

      const masterDeck: FlashcardDeck = {
        id: `master-subj-${subject.name}`,
        exam_id: selectedExamId,
        subject: subject.name,
        stage: 'All Stages',
        title: `${subject.name} (Complete Subject Review)`,
        description: `Comprehensive active recall session covering all ${subject.name} decks.`,
        icon: 'Sparkles',
        card_count: combinedCards.length,
        is_premium: false
      };

      setActiveDeck(masterDeck);
      setDeckCards(combinedCards);
      setIsStudyModalOpen(true);
    } catch (err) {
      console.error("Failed to compile subject cards:", err);
    } finally {
      setLoadingCards(false);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-10 space-y-5 sm:space-y-8">
        
        {/* ==================== EXECUTIVE NAVIGATION & STAGE BAR ==================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <Link
            to={selectedExamId && selectedExamId !== 'all' ? `/?exam=${selectedExamId}` : '/'}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors group cursor-pointer w-fit"
          >
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:border-brand-500/50 shadow-2xs transition-all">
              <ArrowLeft className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 group-hover:-translate-x-0.5 transition-transform" />
            </div>
            <span>
              Back to <span className="font-extrabold text-slate-900 dark:text-white">{currentExam?.name || 'Exam'} Dashboard</span>
            </span>
          </Link>

          {/* Stage Switcher (Only displayed if the active exam has multiple stages) */}
          {currentExam?.stages && currentExam.stages.length > 1 && !currentExam.stages.includes('Single Stage') && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 overflow-x-auto no-scrollbar w-fit">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400 px-2 flex items-center gap-1 shrink-0">
                <Filter className="w-3 h-3 text-purple-600 dark:text-purple-400" /> Stage:
              </span>
              <button
                type="button"
                onClick={() => handleSelectStage('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStage === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                All Stages
              </button>
              {currentExam.stages.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleSelectStage(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedStage.toLowerCase() === st.toLowerCase()
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ==================== 2. HERO / SMART SRS BANNER ==================== */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 sm:p-7 bg-gradient-to-br from-brand-950 via-slate-900 to-indigo-950 text-white border border-brand-500/20 shadow-xl">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-amber-500/15 text-amber-400 font-black text-[10px] sm:text-[11px] uppercase tracking-wider border border-amber-500/30">
                <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400" />
                Daily Memory Queue · Smart SRS
              </div>
              
              <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                {currentExam ? `${currentExam.name} Flashcards` : 'Odisha Exam Flashcards Hub'}
              </h1>
              
              <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed font-medium">
                {globalStats.dueToday > 0
                  ? `You have ${globalStats.dueToday} flashcards scheduled for review today. Review them to keep memory retention strong!`
                  : "Pick a subject below to train active recall with high-yield Odisha exam cards."}
              </p>
            </div>

            {/* Quick Stat Counter Cards */}
            <div className="flex items-center gap-2 sm:gap-6 bg-white/10 border border-white/15 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 backdrop-blur-md w-full md:w-auto justify-around md:justify-start">
              <div className="text-center px-1 sm:px-2">
                <div className="text-lg sm:text-2xl font-black font-mono text-white">
                  {subjectSummaries.length}
                </div>
                <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mt-0.5">
                  Subjects
                </div>
              </div>
              <div className="w-px h-7 sm:h-8 bg-white/20" />
              <div className="text-center px-1 sm:px-2">
                <div className="text-lg sm:text-2xl font-black font-mono text-brand-300">
                  {globalStats.totalCards > 0 ? globalStats.totalCards : '10+'}
                </div>
                <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mt-0.5">
                  Cards
                </div>
              </div>
              <div className="w-px h-7 sm:h-8 bg-white/20" />
              <div className="text-center px-1 sm:px-2">
                <div className="text-lg sm:text-2xl font-black font-mono text-emerald-400">
                  {globalStats.mastered}
                </div>
                <div className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mt-0.5">
                  Mastered
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== 3. SUBJECT-FIRST VIEW VS. SUBJECT DRILL-DOWN ==================== */}
        {!activeSubject ? (
          /* ================= LEVEL 2: SUBJECT CARDS GRID ================= */
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5 text-brand-600 dark:text-brand-400" />
                  Available Subjects
                </h2>
                <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                  Select a subject to explore its chapters and study cards
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search subjects or decks..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:outline-none focus:border-brand-500 shadow-2xs"
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse bg-slate-200 dark:bg-slate-800 h-40 rounded-2xl" />
                ))}
              </div>
            ) : subjectSummaries.length === 0 ? (
              <div className="text-center py-12 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <BookOpen className="w-9 h-9 text-slate-400 mx-auto mb-2" />
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                  {currentExam ? `No flashcard decks for ${currentExam.name} yet` : 'No flashcard decks found'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Real flashcard decks created in the Admin Panel for this exam will appear here automatically.
                </p>
                <Link
                  to={selectedExamId && selectedExamId !== 'all' ? `/?exam=${selectedExamId}` : '/'}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Return to Exam Dashboard
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
                {subjectSummaries.map((subject) => (
                  <div
                    key={subject.name}
                    onClick={() => handleSelectSubject(subject.name)}
                    className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs sm:shadow-xs hover:shadow-md dark:hover:border-brand-500/50 hover:border-brand-300 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <div className="space-y-2.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800">
                          {subject.deckCount} {subject.deckCount === 1 ? 'Deck' : 'Decks'}
                        </span>

                        {subject.dueCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 font-mono">
                            <Flame className="w-3 h-3 fill-amber-500" />
                            {subject.dueCount} Due
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 font-mono">
                            {subject.cardCount} Cards
                          </span>
                        )}
                      </div>

                      {/* Subject Name */}
                      <h3 className="font-bold sm:font-black text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {subject.name}
                      </h3>

                      {/* Topics Sample list */}
                      <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {subject.decks.map(d => d.title).join(', ')}
                      </p>
                    </div>

                    {/* Card Footer: Explore Arrow */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                        Explore Chapters
                      </span>
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-50 dark:group-hover:bg-brand-950/80 group-hover:text-brand-600 flex items-center justify-center transition-all">
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ================= LEVEL 3: SUBJECT DRILL-DOWN (TOPIC DECKS VIEW) ================= */
          <div className="space-y-4 sm:space-y-6">
            {/* Breadcrumb Back Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleSelectSubject(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-all cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to All Subjects
              </button>

              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono">
                {currentSubjectDecks.length} {currentSubjectDecks.length === 1 ? 'Deck' : 'Decks'}
              </span>
            </div>

            {/* Subject Focus Header Banner */}
            {(() => {
              const currentSubjObj = subjectSummaries.find(s => s.name.toLowerCase() === activeSubject.toLowerCase());
              if (!currentSubjObj) return null;

              return (
                <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800/90 dark:to-brand-950/40 border border-brand-200/80 dark:border-slate-700 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                      Active Subject
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
                      {currentSubjObj.name}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {currentSubjObj.cardCount} total flashcards across {currentSubjObj.deckCount} topic decks
                    </p>
                  </div>

                  {/* 1-Click Master Study for the whole subject */}
                  <button
                    type="button"
                    onClick={() => handleStudyWholeSubject(currentSubjObj)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-brand-500/25 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <Play className="w-3 h-3 fill-white" />
                    Study Entire Subject ({currentSubjObj.cardCount} Cards)
                  </button>
                </div>
              );
            })()}

            {/* Topic Decks Listing for this Subject */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
              {currentSubjectDecks.map((deck) => (
                <div
                  key={deck.id}
                  className="group relative flex flex-col justify-between p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all"
                >
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                        {deck.stage || 'All Stages'}
                      </span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-400 font-mono">
                        {deck.card_count || 0} Cards
                      </span>
                    </div>

                    <h4 className="font-bold sm:font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug group-hover:text-brand-600 transition-colors">
                      {deck.title}
                    </h4>

                    <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {deck.description || `High-yield flashcard deck covering core topics in ${deck.subject}.`}
                    </p>
                  </div>

                  <div className="pt-3 sm:pt-4 border-t border-slate-100 dark:border-slate-700/80 mt-3 sm:mt-4 flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-500" /> ~5 min
                    </span>

                    <button
                      type="button"
                      onClick={() => handleStartStudy(deck)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold sm:font-black bg-brand-600 hover:bg-brand-700 text-white shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white" />
                      Study Deck
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom clearance padding for floating AI companion button */}
        <div className="h-16 sm:h-8" />
      </div>

      {/* ==================== ACTIVE STUDY MODAL ==================== */}
      {activeDeck && (
        <FlashcardStudyModal
          isOpen={isStudyModalOpen}
          onClose={() => setIsStudyModalOpen(false)}
          deck={activeDeck}
          cards={deckCards}
          initialProgressMap={progressMap}
          onProgressUpdated={(deckId, updated) => {
            setProgressMap(prev => ({ ...prev, ...updated }));
          }}
        />
      )}
    </PageLayout>
  );
};
