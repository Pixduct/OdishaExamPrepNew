import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Plus, Search, Edit2, Trash2, BookOpen, Sparkles, 
  CheckCircle, ArrowLeft, Upload, Flame, Clock, Lightbulb, FileText, Check,
  Wand2, RotateCcw, CheckSquare, Square, Filter, Tag, ChevronDown, ChevronUp,
  RefreshCw, X, Sliders, HelpCircle, ArrowRight
} from 'lucide-react';
import { examService } from '../../lib/examService';
import type { FlashcardDeck, Flashcard } from '../../lib/srsEngine';
import { toast } from 'react-hot-toast';
import { cn } from '../../lib/utils';
import { SYLLABUS_PRESETS } from '../../lib/syllabusPresets';
import { parseSyllabusHierarchy, formatFlashcardDeckTitle } from '../../lib/syllabusParser';

export interface DeckCandidate {
  id: string;
  exam_id: string;
  subject: string;
  subSubject?: string;
  chapter?: string;
  stage: string;
  title: string;
  description: string;
  icon: string;
  is_premium: boolean;
  selected: boolean;
}

interface AdminFlashcardsManagerProps {
  exams: any[];
  isActive?: boolean;
}

export const AdminFlashcardsManager: React.FC<AdminFlashcardsManagerProps> = ({ exams, isActive }) => {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('all');

  // Auto-Architect from Syllabus Studio State
  const [showAutoArchitectModal, setShowAutoArchitectModal] = useState(false);
  const [autoExamId, setAutoExamId] = useState<string>('');
  const [autoStage, setAutoStage] = useState<string>('Prelims');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('opsc-app-law');
  const [syllabusMarkdown, setSyllabusMarkdown] = useState<string>(SYLLABUS_PRESETS['opsc-app-law']?.markdown || '');
  const [namingPattern, setNamingPattern] = useState<string>('[Subject]: [Sub-Subject] - [Chapter]');
  const [groupingMode, setGroupingMode] = useState<'subject' | 'subSubject'>('subject');
  const [candidates, setCandidates] = useState<DeckCandidate[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [filterCandidateSubject, setFilterCandidateSubject] = useState<string>('all');
  const [showSyllabusEditor, setShowSyllabusEditor] = useState(true);
  
  // Deck Modal (Create / Edit)
  const [showDeckModal, setShowDeckModal] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [deckForm, setDeckForm] = useState({
    exam_id: '',
    subject: 'General Studies',
    stage: 'All Stages',
    title: '',
    description: '',
    is_premium: false
  });

  // Card Management Sub-View
  const [activeDeckForCards, setActiveDeckForCards] = useState<FlashcardDeck | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  
  // Card Modal (Add / Edit)
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [cardForm, setCardForm] = useState({
    front_text: '',
    back_text: '',
    key_points: ''
  });

  // Bulk Import Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkJsonText, setBulkJsonText] = useState('');

  // Bulk Selection State for Decks
  const [selectedDeckIds, setSelectedDeckIds] = useState<Set<string>>(new Set<string>());
  const [isBulkDeletingDecks, setIsBulkDeletingDecks] = useState(false);
  const [showDeckBulkDeleteConfirm, setShowDeckBulkDeleteConfirm] = useState(false);

  // Bulk Selection State for Cards (in active deck)
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set<string>());
  const [isBulkDeletingCards, setIsBulkDeletingCards] = useState(false);
  const [showCardBulkDeleteConfirm, setShowCardBulkDeleteConfirm] = useState(false);

  // Load Decks
  const loadDecks = async () => {
    setLoading(true);
    try {
      const data = await examService.getAllFlashcardDecks(undefined, true);
      setDecks(data || []);
    } catch (e) {
      toast.error('Failed to load flashcard decks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDecks();
  }, []);

  // Reload decks whenever the flashcards tab becomes active
  useEffect(() => {
    if (isActive) {
      loadDecks();
    }
  }, [isActive]);

  // Load Cards for a Deck
  const loadCards = async (deckId: string) => {
    setLoadingCards(true);
    try {
      const data = await examService.getFlashcardsByDeckId(deckId);
      setCards(data || []);
    } catch (e) {
      toast.error('Failed to load cards for deck');
    } finally {
      setLoadingCards(false);
    }
  };

  // Open Manage Cards view
  const handleManageCards = (deck: FlashcardDeck) => {
    setActiveDeckForCards(deck);
    setSelectedCardIds(new Set());
    loadCards(deck.id);
  };

  // Save Deck (Create or Edit)
  const handleSaveDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckForm.title.trim() || !deckForm.exam_id) {
      toast.error('Please enter a title and select a target exam');
      return;
    }

    try {
      if (editingDeck) {
        await examService.updateFlashcardDeck(editingDeck.id, {
          title: deckForm.title.trim(),
          exam_id: deckForm.exam_id,
          subject: deckForm.subject.trim(),
          stage: deckForm.stage,
          description: deckForm.description.trim(),
          is_premium: deckForm.is_premium
        });
        toast.success('Deck updated successfully');
      } else {
        await examService.addFlashcardDeck({
          title: deckForm.title.trim(),
          exam_id: deckForm.exam_id,
          subject: deckForm.subject.trim(),
          stage: deckForm.stage,
          description: deckForm.description.trim(),
          is_premium: deckForm.is_premium,
          card_count: 0
        });
        toast.success('Deck created successfully');
      }
      setShowDeckModal(false);
      setEditingDeck(null);
      loadDecks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save deck');
    }
  };

  // Delete Deck
  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Are you sure you want to delete this deck and all its flashcards?')) return;
    try {
      await examService.deleteFlashcardDeck(deckId);
      setSelectedDeckIds(prev => {
        const next = new Set(prev);
        next.delete(deckId);
        return next;
      });
      toast.success('Deck deleted');
      loadDecks();
      if (activeDeckForCards?.id === deckId) {
        setActiveDeckForCards(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete deck');
    }
  };

  // Save Single Card (Create or Edit)
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDeckForCards) return;
    if (!cardForm.front_text.trim() || !cardForm.back_text.trim()) {
      toast.error('Both front and back text are required');
      return;
    }

    const keyPointsArray = cardForm.key_points
      .split('\n')
      .map(s => s.trim().replace(/^[-•*]\s*/, ''))
      .filter(Boolean);

    try {
      if (editingCard) {
        await examService.updateFlashcard(editingCard.id, {
          front_text: cardForm.front_text.trim(),
          back_text: cardForm.back_text.trim(),
          key_points: keyPointsArray
        });
        toast.success('Card updated successfully');
      } else {
        await examService.bulkAddFlashcards(activeDeckForCards.id, [{
          front_text: cardForm.front_text.trim(),
          back_text: cardForm.back_text.trim(),
          key_points: keyPointsArray,
          sort_order: cards.length
        }]);
        toast.success('Card added');
      }
      setShowCardModal(false);
      setEditingCard(null);
      setCardForm({ front_text: '', back_text: '', key_points: '' });
      loadCards(activeDeckForCards.id);
      loadDecks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save card');
    }
  };

  // Delete Single Card
  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Delete this card?')) return;
    if (!activeDeckForCards) return;
    try {
      await examService.deleteFlashcard(cardId, activeDeckForCards.id);
      setSelectedCardIds(prev => {
        const next = new Set(prev);
        next.delete(cardId);
        return next;
      });
      toast.success('Card deleted');
      loadCards(activeDeckForCards.id);
      loadDecks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete card');
    }
  };

  // Bulk Import Cards
  const handleBulkImport = async () => {
    if (!activeDeckForCards) return;
    if (!bulkJsonText.trim()) {
      toast.error('Please paste JSON card array');
      return;
    }

    try {
      const parsed = JSON.parse(bulkJsonText);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error('JSON must be an array of card objects');
      }

      const formatted = parsed.map((item: any, idx: number) => ({
        front_text: item.front_text || item.front || item.question || '',
        back_text: item.back_text || item.back || item.answer || '',
        key_points: Array.isArray(item.key_points) ? item.key_points : (item.points ? [item.points] : []),
        sort_order: idx
      })).filter(c => c.front_text && c.back_text);

      if (formatted.length === 0) {
        throw new Error('No valid cards found in JSON. Format: [{"front_text": "...", "back_text": "..."}]');
      }

      await examService.bulkAddFlashcards(activeDeckForCards.id, formatted);
      toast.success(`Successfully imported ${formatted.length} cards!`);
      setShowBulkModal(false);
      setBulkJsonText('');
      loadCards(activeDeckForCards.id);
      loadDecks();
    } catch (err: any) {
      toast.error(err.message || 'Invalid JSON format');
    }
  };



  // Formula Presets for Auto-Architect
  const FORMULA_PRESETS = [
    {
      id: 'full-3tier',
      name: '[Subject]: [Sub-Subject] - [Chapter]',
      desc: '3-tier hierarchy: Subject, Sub-Subject & Chapter',
      template: '[Subject]: [Sub-Subject] - [Chapter]'
    },
    {
      id: 'sub-chap',
      name: '[Sub-Subject] · [Chapter]',
      desc: 'Granular topic with sub-subject prefix',
      template: '[Sub-Subject] · [Chapter]'
    },
    {
      id: 'subj-chap',
      name: '[Subject] - [Chapter]',
      desc: 'Direct subject with chapter title',
      template: '[Subject] - [Chapter]'
    },
    {
      id: 'chap-only',
      name: '[Chapter] ([Sub-Subject])',
      desc: 'Focused chapter title with sub-subject parenthesized',
      template: '[Chapter] ([Sub-Subject])'
    }
  ];

  const PLACEHOLDER_TAGS = ['[Paper]', '[Subject]', '[Sub-Subject]', '[Unit]', '[Chapter]', '[Stage]'];

  // Candidate Filter & Counters
  const candidateSubjects = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach(c => {
      if (c.subject) set.add(c.subject);
    });
    return ['all', ...Array.from(set)];
  }, [candidates]);

  const filteredCandidates = useMemo(() => {
    if (filterCandidateSubject === 'all') return candidates;
    return candidates.filter(c => c.subject === filterCandidateSubject);
  }, [candidates, filterCandidateSubject]);

  const selectedCandidatesCount = useMemo(() => {
    return candidates.filter(c => c.selected).length;
  }, [candidates]);

  // Generate Candidates from Syllabus
  const handleGenerateCandidates = () => {
    if (!syllabusMarkdown.trim()) {
      toast.error('Please provide syllabus markdown or select a preset.');
      return;
    }
    setIsGenerating(true);
    try {
      const targetExamObj = exams.find(e => e.id === autoExamId);
      const hierarchy = parseSyllabusHierarchy(syllabusMarkdown, targetExamObj?.name || autoExamId);
      if (!hierarchy || hierarchy.length === 0) {
        toast.error('No structured chapters found in this syllabus. Check headings or format.');
        setIsGenerating(false);
        return;
      }

      const generated: DeckCandidate[] = hierarchy.map((item, idx) => {
        const parentSubject = (groupingMode === 'subSubject' && item.subSubject)
          ? item.subSubject
          : (item.subject || item.placeholders?.['broadsubject'] || 'General Studies');

        const title = formatFlashcardDeckTitle(
          namingPattern,
          item,
          idx,
          targetExamObj?.name || '',
          autoStage
        );

        const desc = item.chapter
          ? `High-yield flashcard active recall deck covering ${item.chapter} in ${item.subSubject || item.subject}.`
          : `Active recall study deck for ${title}.`;

        return {
          id: `candidate-${idx + 1}-${Date.now()}`,
          exam_id: autoExamId || exams[0]?.id || 'general',
          subject: parentSubject,
          subSubject: item.subSubject,
          chapter: item.chapter,
          stage: autoStage,
          title,
          description: desc,
          icon: 'Sparkles',
          is_premium: false,
          selected: true
        };
      });

      setCandidates(generated);
      setShowSyllabusEditor(false); // minimize syllabus editor so user can review generated table
      toast.success(`Generated ${generated.length} candidate decks from syllabus!`);
    } catch (err: any) {
      console.error('Generation error:', err);
      toast.error('Failed to parse syllabus: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Batch Save Candidates to Database
  const handleSaveCandidatesToDb = async () => {
    const selected = candidates.filter(c => c.selected);
    if (selected.length === 0) {
      toast.error('Please select at least one deck to save.');
      return;
    }

    setIsSavingBatch(true);
    try {
      const rows = selected.map((c, i) => ({
        exam_id: c.exam_id,
        subject: c.subject.trim() || 'General Studies',
        stage: c.stage || 'All Stages',
        title: c.title.trim(),
        description: c.description.trim(),
        icon: c.icon || 'Sparkles',
        card_count: 0,
        is_premium: c.is_premium || false,
        sort_order: i
      }));

      await examService.bulkAddFlashcardDecks(rows);
      toast.success(`Successfully created ${rows.length} flashcard decks for ${exams.find(e => e.id === autoExamId)?.name || 'exam'}!`);
      setShowAutoArchitectModal(false);
      setCandidates([]);
      loadDecks();
    } catch (err: any) {
      console.error('Batch save error:', err);
      toast.error(err.message || 'Failed to batch create decks');
    } finally {
      setIsSavingBatch(false);
    }
  };

  // Toggle all candidates
  const handleToggleAllCandidates = (selectAll: boolean) => {
    setCandidates(prev => prev.map(c => ({ ...c, selected: selectAll })));
  };

  // Update candidate item
  const handleUpdateCandidate = (id: string, updates: Partial<DeckCandidate>) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  // Delete candidate item
  const handleDeleteCandidate = (id: string) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
  };

  // Add custom candidate row
  const handleAddCustomCandidate = () => {
    const newCandidate: DeckCandidate = {
      id: `custom-${Date.now()}`,
      exam_id: autoExamId || exams[0]?.id || '',
      subject: filterCandidateSubject !== 'all' ? filterCandidateSubject : 'General Studies',
      stage: autoStage,
      title: 'New Deck Title',
      description: 'High-yield active recall flashcard deck.',
      icon: 'Sparkles',
      is_premium: false,
      selected: true
    };
    setCandidates(prev => [newCandidate, ...prev]);
  };

  // Filter Decks
  const filteredDecks = decks.filter(d => {
    const matchesSearch = !searchQuery || 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExam = selectedExamFilter === 'all' || d.exam_id === selectedExamFilter;
    return matchesSearch && matchesExam;
  });

  // Memoized selection statistics for decks
  const selectedDecksList = useMemo(() => {
    return decks.filter(d => selectedDeckIds.has(d.id));
  }, [decks, selectedDeckIds]);

  const selectedDecksCardCount = useMemo(() => {
    return selectedDecksList.reduce((acc, d) => acc + (d.card_count || 0), 0);
  }, [selectedDecksList]);

  // Deck bulk operations
  const toggleSelectDeck = (deckId: string) => {
    setSelectedDeckIds(prev => {
      const next = new Set(prev);
      if (next.has(deckId)) {
        next.delete(deckId);
      } else {
        next.add(deckId);
      }
      return next;
    });
  };

  const handleSelectAllFilteredDecks = () => {
    if (selectedDeckIds.size === filteredDecks.length && filteredDecks.length > 0) {
      setSelectedDeckIds(new Set());
    } else {
      setSelectedDeckIds(new Set(filteredDecks.map(d => d.id)));
    }
  };

  const handleClearSelectedDecks = () => {
    setSelectedDeckIds(new Set());
  };

  const handleBulkDeleteDecks = async () => {
    if (selectedDeckIds.size === 0) return;
    setIsBulkDeletingDecks(true);
    try {
      const idsToDelete: string[] = Array.from(selectedDeckIds);
      await examService.bulkDeleteFlashcardDecks(idsToDelete);
      toast.success(`Successfully deleted ${idsToDelete.length} deck${idsToDelete.length > 1 ? 's' : ''}`);
      setSelectedDeckIds(new Set<string>());
      setShowDeckBulkDeleteConfirm(false);
      loadDecks();
      if (activeDeckForCards && idsToDelete.includes(activeDeckForCards.id)) {
        setActiveDeckForCards(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete selected decks');
    } finally {
      setIsBulkDeletingDecks(false);
    }
  };

  // Card bulk operations (inside active deck)
  const toggleSelectCard = (cardId: string) => {
    setSelectedCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleSelectAllCards = () => {
    if (selectedCardIds.size === cards.length && cards.length > 0) {
      setSelectedCardIds(new Set<string>());
    } else {
      setSelectedCardIds(new Set(cards.map(c => c.id)));
    }
  };

  const handleBulkDeleteCards = async () => {
    if (!activeDeckForCards || selectedCardIds.size === 0) return;
    setIsBulkDeletingCards(true);
    try {
      const idsToDelete: string[] = Array.from(selectedCardIds);
      await examService.bulkDeleteFlashcards(idsToDelete, activeDeckForCards.id);
      toast.success(`Successfully deleted ${idsToDelete.length} card${idsToDelete.length > 1 ? 's' : ''}`);
      setSelectedCardIds(new Set<string>());
      setShowCardBulkDeleteConfirm(false);
      loadCards(activeDeckForCards.id);
      loadDecks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete selected cards');
    } finally {
      setIsBulkDeletingCards(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* View 1: Decks Management */}
      {!activeDeckForCards ? (
        <div className="space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-600" />
                Active Recall Flashcards Manager
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Create and organize spaced repetition flashcard decks for competitive exams.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  const initialExam = selectedExamFilter !== 'all' ? selectedExamFilter : (exams[0]?.id || '');
                  setAutoExamId(initialExam);
                  // Check if exam has a matching preset
                  const matchingPreset = Object.keys(SYLLABUS_PRESETS).find(k => k === initialExam || initialExam.includes(k));
                  if (matchingPreset && SYLLABUS_PRESETS[matchingPreset]) {
                    setSelectedPresetKey(matchingPreset);
                    setSyllabusMarkdown(SYLLABUS_PRESETS[matchingPreset].markdown);
                  }
                  setShowAutoArchitectModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs"
                title="Auto-Architect flashcard decks directly from syllabus using dynamic placeholders"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" /> Auto-Architect from Syllabus
              </button>

              <button
                onClick={() => {
                  setEditingDeck(null);
                  setDeckForm({
                    exam_id: selectedExamFilter !== 'all' ? selectedExamFilter : (exams[0]?.id || ''),
                    subject: 'General Studies',
                    stage: 'All Stages',
                    title: '',
                    description: '',
                    is_premium: false
                  });
                  setShowDeckModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-brand-600 hover:bg-brand-700 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Create Deck
              </button>

              <button
                onClick={() => loadDecks()}
                disabled={loading}
                title="Refresh flashcard decks from database"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-brand-600")} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Search & Exam Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search decks by title or subject..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-medium focus:outline-none focus:border-brand-500"
            >
              <option value="all">All Exams ({decks.length})</option>
              {exams.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {/* Bulk Selection Summary Bar (visible when decks exist) */}
          {!loading && filteredDecks.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFilteredDecks}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold text-slate-700 transition-all cursor-pointer"
                >
                  {selectedDeckIds.size === filteredDecks.length && filteredDecks.length > 0 ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                      <span>Deselect All ({filteredDecks.length})</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>Select All ({filteredDecks.length})</span>
                    </>
                  )}
                </button>
                {selectedDeckIds.size > 0 && (
                  <button
                    type="button"
                    onClick={handleClearSelectedDecks}
                    className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 cursor-pointer"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-medium">
                  {selectedDeckIds.size > 0 ? (
                    <strong className="text-brand-600 font-bold">{selectedDeckIds.size} of {filteredDecks.length} selected</strong>
                  ) : (
                    `Showing ${filteredDecks.length} decks`
                  )}
                </span>
                {selectedDeckIds.size > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowDeckBulkDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedDeckIds.size})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Decks Grid */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading flashcard decks...</div>
          ) : filteredDecks.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <Layers className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700">No Flashcard Decks Found</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Auto-generate decks from your syllabus hierarchy or manually create single decks.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    const initialExam = selectedExamFilter !== 'all' ? selectedExamFilter : (exams[0]?.id || '');
                    setAutoExamId(initialExam);
                    const matchingPreset = Object.keys(SYLLABUS_PRESETS).find(k => k === initialExam || initialExam.includes(k));
                    if (matchingPreset && SYLLABUS_PRESETS[matchingPreset]) {
                      setSelectedPresetKey(matchingPreset);
                      setSyllabusMarkdown(SYLLABUS_PRESETS[matchingPreset].markdown);
                    }
                    setShowAutoArchitectModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer shadow-2xs"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-600" /> Auto-Architect from Syllabus
                </button>
                <button
                  onClick={() => {
                    setEditingDeck(null);
                    setDeckForm({
                      exam_id: selectedExamFilter !== 'all' ? selectedExamFilter : (exams[0]?.id || ''),
                      subject: 'General Studies',
                      stage: 'All Stages',
                      title: '',
                      description: '',
                      is_premium: false
                    });
                    setShowDeckModal(true);
                  }}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-black bg-brand-600 text-white hover:bg-brand-700 cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1" /> Create Single Deck
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDecks.map(deck => {
                const examObj = exams.find(e => e.id === deck.exam_id);
                const isSelected = selectedDeckIds.has(deck.id);
                return (
                  <div
                    key={deck.id}
                    className={cn(
                      "p-5 rounded-2xl bg-white border shadow-xs flex flex-col justify-between hover:shadow-md transition-all relative group",
                      isSelected
                        ? "border-brand-500 bg-brand-50/15 ring-2 ring-brand-500/20"
                        : "border-slate-200"
                    )}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelectDeck(deck.id);
                            }}
                            className={cn(
                              "w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0",
                              isSelected
                                ? "bg-brand-600 border-brand-600 text-white shadow-2xs"
                                : "border-slate-300 bg-slate-50 hover:border-slate-400 text-transparent group-hover:border-slate-400"
                            )}
                            title={isSelected ? "Deselect deck" : "Select deck"}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-brand-50 text-brand-700 border border-brand-200">
                            {deck.subject}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {deck.card_count || 0} Cards
                        </span>
                      </div>

                      <h3 className="font-extrabold text-sm text-slate-900 line-clamp-1">
                        {deck.title}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {deck.description || 'No description provided.'}
                      </p>

                      <div className="text-[11px] font-medium text-slate-400">
                        Exam: <span className="text-slate-700 font-semibold">{examObj?.name || deck.exam_id}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
                      <button
                        onClick={() => handleManageCards(deck)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 hover:bg-brand-100 text-brand-700 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Manage Cards
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingDeck(deck);
                            setDeckForm({
                              exam_id: deck.exam_id,
                              subject: deck.subject,
                              stage: deck.stage || 'All Stages',
                              title: deck.title,
                              description: deck.description,
                              is_premium: deck.is_premium
                            });
                            setShowDeckModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                          title="Edit Deck"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeck(deck.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          title="Delete Deck"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Bulk Action Dock */}
          {selectedDeckIds.size > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700/80 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-500 text-white font-mono text-xs font-black flex items-center justify-center shadow-xs">
                  {selectedDeckIds.size}
                </span>
                <div className="text-xs">
                  <span className="font-extrabold text-white">
                    {selectedDeckIds.size} {selectedDeckIds.size === 1 ? 'Deck' : 'Decks'} Selected
                  </span>
                  <span className="text-slate-400 ml-1.5 font-medium">
                    ({selectedDecksCardCount} total cards)
                  </span>
                </div>
              </div>

              <div className="h-4 w-px bg-slate-700" />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllFilteredDecks}
                  className="px-2.5 py-1 text-xs text-slate-300 hover:text-white font-medium hover:underline cursor-pointer"
                >
                  {selectedDeckIds.size === filteredDecks.length ? 'Deselect All' : `Select All (${filteredDecks.length})`}
                </button>

                <button
                  type="button"
                  onClick={handleClearSelectedDecks}
                  className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 font-medium cursor-pointer"
                >
                  Clear
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeckBulkDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedDeckIds.size})</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* View 2: Cards inside a Selected Deck */
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveDeckForCards(null)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 cursor-pointer"
                title="Back to Decks"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <span>{activeDeckForCards.title}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ({cards.length} Cards)
                  </span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {activeDeckForCards.subject} • {activeDeckForCards.stage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedCardIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setShowCardBulkDeleteConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedCardIds.size})
                </button>
              )}
              <button
                onClick={() => setShowBulkModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" /> Bulk Import JSON
              </button>
              <button
                onClick={() => {
                  setEditingCard(null);
                  setCardForm({ front_text: '', back_text: '', key_points: '' });
                  setShowCardModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-brand-600 hover:bg-brand-700 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Card
              </button>
            </div>
          </div>

          {/* Cards List Table */}
          {loadingCards ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading deck cards...</div>
          ) : cards.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No Cards in this Deck Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Add single cards manually, bulk import JSON, or generate with AI Question Studio.
              </p>
              <button
                onClick={() => setShowCardModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 text-white hover:bg-brand-700"
              >
                Add First Card
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Card Bulk Selection Bar */}
              <div className="flex items-center justify-between px-3.5 py-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllCards}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    {selectedCardIds.size === cards.length && cards.length > 0 ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                        <span>Deselect All Cards</span>
                      </>
                    ) : (
                      <>
                        <Square className="w-3.5 h-3.5 text-slate-400" />
                        <span>Select All Cards ({cards.length})</span>
                      </>
                    )}
                  </button>

                  {selectedCardIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCardIds(new Set())}
                      className="text-slate-400 hover:text-slate-600 text-xs font-semibold px-2 py-1 cursor-pointer"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-medium">
                    {selectedCardIds.size > 0 ? (
                      <strong className="text-brand-600 font-bold">{selectedCardIds.size} of {cards.length} cards selected</strong>
                    ) : (
                      `Showing ${cards.length} cards`
                    )}
                  </span>
                  {selectedCardIds.size > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowCardBulkDeleteConfirm(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-white bg-rose-600 hover:bg-rose-700 transition-all cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Selected ({selectedCardIds.size})</span>
                    </button>
                  )}
                </div>
              </div>

              {cards.map((card, idx) => {
                const isCardSelected = selectedCardIds.has(card.id);
                return (
                  <div
                    key={card.id}
                    className={cn(
                      "p-4 rounded-xl bg-white border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-xs transition-all",
                      isCardSelected
                        ? "border-brand-500 bg-brand-50/15 ring-2 ring-brand-500/20"
                        : "border-slate-200"
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => toggleSelectCard(card.id)}
                        className={cn(
                          "w-5 h-5 rounded-md flex items-center justify-center border transition-all cursor-pointer shrink-0 mt-0.5",
                          isCardSelected
                            ? "bg-brand-600 border-brand-600 text-white shadow-2xs"
                            : "border-slate-300 bg-slate-50 hover:border-slate-400 text-transparent"
                        )}
                        title={isCardSelected ? "Deselect card" : "Select card"}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </button>
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-mono text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="text-sm font-bold text-slate-900">
                          {card.front_text}
                        </div>
                        <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded inline-block">
                          {card.back_text}
                        </div>
                        {card.key_points && card.key_points.length > 0 && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                            <Lightbulb className="w-3 h-3 text-amber-500" />
                            <span>{card.key_points.length} Key Points</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => {
                          setEditingCard(card);
                          setCardForm({
                            front_text: card.front_text,
                            back_text: card.back_text,
                            key_points: (card.key_points || []).join('\n')
                          });
                          setShowCardModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        title="Edit Card"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Delete Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL: BULK DELETE DECKS CONFIRMATION ==================== */}
      {showDeckBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete {selectedDeckIds.size} Flashcard {selectedDeckIds.size === 1 ? 'Deck' : 'Decks'}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  This will permanently delete the selected {selectedDeckIds.size} decks and all <strong className="text-slate-800 font-bold">{selectedDecksCardCount} cards</strong> inside them. This action cannot be undone.
                </p>
              </div>

              {/* Selected Decks Scrollable Preview */}
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50 p-2 space-y-1.5 text-xs">
                {selectedDecksList.map(deck => (
                  <div key={deck.id} className="p-2 bg-white rounded-lg border border-slate-100 flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-800 truncate">{deck.title}</p>
                      <p className="text-[10px] text-slate-400">{deck.subject} • {deck.stage}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500 shrink-0 px-1.5 py-0.5 bg-slate-100 rounded">
                      {deck.card_count || 0} cards
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isBulkDeletingDecks}
                  onClick={() => setShowDeckBulkDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBulkDeletingDecks}
                  onClick={handleBulkDeleteDecks}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all cursor-pointer shadow-sm shadow-rose-600/20 disabled:opacity-50"
                >
                  {isBulkDeletingDecks ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Decks...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete {selectedDeckIds.size} {selectedDeckIds.size === 1 ? 'Deck' : 'Decks'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: BULK DELETE CARDS CONFIRMATION ==================== */}
      {showCardBulkDeleteConfirm && activeDeckForCards && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete {selectedCardIds.size} {selectedCardIds.size === 1 ? 'Card' : 'Cards'}?
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  These {selectedCardIds.size} cards will be permanently removed from <strong className="text-slate-800 font-bold">{activeDeckForCards.title}</strong>. This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isBulkDeletingCards}
                  onClick={() => setShowCardBulkDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isBulkDeletingCards}
                  onClick={handleBulkDeleteCards}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 transition-all cursor-pointer shadow-sm shadow-rose-600/20 disabled:opacity-50"
                >
                  {isBulkDeletingCards ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Cards...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Yes, Delete {selectedCardIds.size} {selectedCardIds.size === 1 ? 'Card' : 'Cards'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: CREATE / EDIT DECK ==================== */}
      {showDeckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingDeck ? 'Edit Flashcard Deck' : 'Create New Flashcard Deck'}
              </h3>
              <button
                onClick={() => setShowDeckModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDeck} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  Target Exam *
                </label>
                <select
                  value={deckForm.exam_id}
                  onChange={(e) => setDeckForm({ ...deckForm, exam_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                >
                  <option value="">-- Select Target Exam --</option>
                  {exams.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  Subject / Category *
                </label>
                <input
                  type="text"
                  value={deckForm.subject}
                  onChange={(e) => setDeckForm({ ...deckForm, subject: e.target.value })}
                  placeholder="e.g. Odisha History, Indian Polity, Quantitative Aptitude"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  Deck Title *
                </label>
                <input
                  type="text"
                  value={deckForm.title}
                  onChange={(e) => setDeckForm({ ...deckForm, title: e.target.value })}
                  placeholder="e.g. Ancient & Medieval Dynasties of Odisha"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={deckForm.description}
                  onChange={(e) => setDeckForm({ ...deckForm, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description of what facts/formulas this deck covers..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium resize-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_premium_deck"
                  checked={deckForm.is_premium}
                  onChange={(e) => setDeckForm({ ...deckForm, is_premium: e.target.checked })}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="is_premium_deck" className="font-bold text-slate-700 cursor-pointer">
                  Require Premium Exam Pass (Locked for non-pass holders)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeckModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-black text-white bg-brand-600 hover:bg-brand-700 cursor-pointer"
                >
                  Save Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT CARD ==================== */}
      {showCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingCard ? 'Edit Flashcard' : `Add Flashcard to ${activeDeckForCards?.title}`}
              </h3>
              <button
                onClick={() => setShowCardModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  Front Side: Prompt / Question *
                </label>
                <textarea
                  value={cardForm.front_text}
                  onChange={(e) => setCardForm({ ...cardForm, front_text: e.target.value })}
                  rows={3}
                  placeholder="e.g. Which Article of the Constitution establishes the Finance Commission? (Use $...$ for LaTeX math)"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium resize-none"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  Back Side: Answer / Reveal *
                </label>
                <input
                  type="text"
                  value={cardForm.back_text}
                  onChange={(e) => setCardForm({ ...cardForm, back_text: e.target.value })}
                  placeholder="e.g. Article 280"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-black text-slate-700 uppercase tracking-wider mb-1">
                  Key Points / Mnemonic Takeaways (Optional, one per line)
                </label>
                <textarea
                  value={cardForm.key_points}
                  onChange={(e) => setCardForm({ ...cardForm, key_points: e.target.value })}
                  rows={3}
                  placeholder="• Appointed by the President every 5 years&#10;• Recommends distribution of tax revenues between Union and States"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-brand-500 font-medium resize-none font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCardModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-black text-white bg-brand-600 hover:bg-brand-700 cursor-pointer"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: BULK JSON IMPORT ==================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-brand-600" />
                Bulk Import Flashcards
              </h3>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 font-medium">
                Paste a JSON array of cards. Each card must have <code>front_text</code> and <code>back_text</code>:
              </p>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[10.5px] text-slate-700">
                {`[
  {
    "front_text": "Capital of ancient Kalinga under Kharavela?",
    "back_text": "Kalinganagara (near modern Bhubaneswar)",
    "key_points": ["Mentioned in Hathigumpha Inscription"]
  }
]`}
              </div>

              <textarea
                value={bulkJsonText}
                onChange={(e) => setBulkJsonText(e.target.value)}
                rows={8}
                placeholder="Paste JSON array here..."
                className="w-full p-3 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-brand-500 resize-none"
              />

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  className="px-5 py-2 rounded-xl font-black text-white bg-brand-600 hover:bg-brand-700 cursor-pointer"
                >
                  Import Cards
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: AUTO-ARCHITECT DECKS FROM SYLLABUS ==================== */}
      {showAutoArchitectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto flex flex-col max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:to-indigo-950/30 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                    Auto-Architect Flashcard Decks from Syllabus
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Parse curriculum hierarchy, select placeholder formulas, and batch-create active recall decks.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoArchitectModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs flex-1">
              
              {/* Section 1: Target Exam & Syllabus Preset Selector */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    1. Target Exam & Syllabus Source
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowSyllabusEditor(!showSyllabusEditor)}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showSyllabusEditor ? 'Collapse Syllabus' : 'Expand / Edit Syllabus'}
                    {showSyllabusEditor ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[10px]">
                      Target Exam *
                    </label>
                    <select
                      value={autoExamId}
                      onChange={(e) => {
                        const newExam = e.target.value;
                        setAutoExamId(newExam);
                        const match = Object.keys(SYLLABUS_PRESETS).find(k => k === newExam || newExam.includes(k));
                        if (match && SYLLABUS_PRESETS[match]) {
                          setSelectedPresetKey(match);
                          setSyllabusMarkdown(SYLLABUS_PRESETS[match].markdown);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">-- Select Exam --</option>
                      {exams.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[10px]">
                      Exam Stage *
                    </label>
                    <select
                      value={autoStage}
                      onChange={(e) => setAutoStage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-500"
                    >
                      <option value="All Stages">All Stages</option>
                      <option value="Prelims">Prelims</option>
                      <option value="Mains">Mains</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 text-[10px]">
                      Quick Syllabus Preset
                    </label>
                    <select
                      value={selectedPresetKey}
                      onChange={(e) => {
                        const k = e.target.value;
                        setSelectedPresetKey(k);
                        if (SYLLABUS_PRESETS[k]) {
                          setSyllabusMarkdown(SYLLABUS_PRESETS[k].markdown);
                          setShowSyllabusEditor(true);
                          toast.success(`Loaded "${SYLLABUS_PRESETS[k].label}"`);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-xs focus:outline-none focus:border-indigo-500"
                    >
                      {Object.entries(SYLLABUS_PRESETS).map(([key, item]) => (
                        <option key={key} value={key}>{item.label}</option>
                      ))}
                      <option value="custom">Custom Markdown (Type/Paste below)</option>
                    </select>
                  </div>
                </div>

                {showSyllabusEditor && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Paste or edit syllabus markdown hierarchy:</span>
                      <span className="font-mono text-[10px]">Supports # Paper, ## Subject, - Chapter / Topic</span>
                    </div>
                    <textarea
                      value={syllabusMarkdown}
                      onChange={(e) => {
                        setSyllabusMarkdown(e.target.value);
                        setSelectedPresetKey('custom');
                      }}
                      rows={6}
                      placeholder="e.g.&#10;# Paper 1: General Studies&#10;## Subject: Indian Polity&#10;- Chapter: Preamble & Fundamental Rights&#10;- Chapter: Directive Principles of State Policy"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
                    />
                  </div>
                )}
              </div>

              {/* Section 2: Placeholder Formula & Naming Patterns */}
              <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      2. Dynamic Deck Title Formula & Placeholders
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Select placeholders to build your standardized naming convention across all generated decks.
                    </p>
                  </div>

                  {/* Grouping Mode Pill */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                    <span className="text-[10px] font-bold text-slate-400 px-2">Group by:</span>
                    <button
                      type="button"
                      onClick={() => setGroupingMode('subject')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer",
                        groupingMode === 'subject'
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      [Subject]
                    </button>
                    <button
                      type="button"
                      onClick={() => setGroupingMode('subSubject')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all cursor-pointer",
                        groupingMode === 'subSubject'
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                      )}
                    >
                      [Sub-Subject]
                    </button>
                  </div>
                </div>

                {/* 1-Click Formula Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    1-Click Formula Presets:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {FORMULA_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setNamingPattern(preset.template);
                          toast.success(`Formula set to "${preset.name}"`);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs",
                          namingPattern === preset.template
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                        )}
                        title={preset.desc}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Placeholder Tag Buttons & Editable Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Active Formula (Click tags to insert):
                    </span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {PLACEHOLDER_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setNamingPattern((prev) => (prev ? `${prev} ${tag}` : tag))}
                          className="px-2 py-0.5 rounded-md font-mono text-[10px] font-bold bg-white dark:bg-slate-800 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                        >
                          + {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={namingPattern}
                      onChange={(e) => setNamingPattern(e.target.value)}
                      placeholder='e.g. "[Subject]: [Sub-Subject] - [Chapter]"'
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleGenerateCandidates}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer shrink-0 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                          <span>Auto-Generate Decks</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 3: Candidates Review & Refine Table */}
              {candidates.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <h4 className="font-black text-slate-900 dark:text-white text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-emerald-600" />
                        3. Review & Refine Generated Decks ({candidates.length} Total)
                      </h4>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-mono">
                        {selectedCandidatesCount} Selected
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Filter by Subject */}
                      {candidateSubjects.length > 2 && (
                        <select
                          value={filterCandidateSubject}
                          onChange={(e) => setFilterCandidateSubject(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 font-medium"
                        >
                          <option value="all">All Subjects ({candidates.length})</option>
                          {candidateSubjects.filter(s => s !== 'all').map(subj => (
                            <option key={subj} value={subj}>{subj}</option>
                          ))}
                        </select>
                      )}

                      <button
                        type="button"
                        onClick={() => handleToggleAllCandidates(selectedCandidatesCount !== candidates.length)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
                      >
                        {selectedCandidatesCount === candidates.length ? 'Deselect All' : 'Select All'}
                      </button>

                      <button
                        type="button"
                        onClick={handleAddCustomCandidate}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Custom Row
                      </button>
                    </div>
                  </div>

                  {/* Candidate Items List */}
                  <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                    {filteredCandidates.map((cand, idx) => (
                      <div
                        key={cand.id}
                        className={cn(
                          "p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3",
                          cand.selected
                            ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs"
                            : "bg-slate-50/70 dark:bg-slate-900/50 border-slate-200/50 dark:border-slate-800/50 opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-2.5 shrink-0">
                          <input
                            type="checkbox"
                            checked={cand.selected}
                            onChange={(e) => handleUpdateCandidate(cand.id, { selected: e.target.checked })}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                        </div>

                        {/* Subject Input */}
                        <div className="w-full sm:w-44 shrink-0">
                          <input
                            type="text"
                            value={cand.subject}
                            onChange={(e) => handleUpdateCandidate(cand.id, { subject: e.target.value })}
                            placeholder="Subject"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:border-indigo-500 outline-none"
                            title="Subject Category"
                          />
                        </div>

                        {/* Deck Title Input */}
                        <div className="flex-1 w-full min-w-0">
                          <input
                            type="text"
                            value={cand.title}
                            onChange={(e) => handleUpdateCandidate(cand.id, { title: e.target.value })}
                            placeholder="Deck Title"
                            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-extrabold bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                            title="Deck Title"
                          />
                        </div>

                        {/* Stage Dropdown */}
                        <div className="w-full sm:w-28 shrink-0">
                          <select
                            value={cand.stage}
                            onChange={(e) => handleUpdateCandidate(cand.id, { stage: e.target.value })}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:border-indigo-500 outline-none"
                          >
                            <option value="All Stages">All Stages</option>
                            <option value="Prelims">Prelims</option>
                            <option value="Mains">Mains</option>
                          </select>
                        </div>

                        {/* Delete candidate button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCandidate(cand.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0 self-end sm:self-center"
                          title="Remove Candidate"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                {candidates.length > 0 ? (
                  <span>Ready to save <strong className="text-slate-900 dark:text-white font-bold">{selectedCandidatesCount}</strong> decks to database.</span>
                ) : (
                  <span>Select exam, syllabus, and click "Auto-Generate Decks" to preview candidates.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAutoArchitectModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveCandidatesToDb}
                  disabled={selectedCandidatesCount === 0 || isSavingBatch}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingBatch ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Decks to Database...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save {selectedCandidatesCount} Decks</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
