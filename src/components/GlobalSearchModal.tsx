import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, BookOpen, FileText, Target, Award, ArrowRight, Sparkles, Clock, Lock } from 'lucide-react';
import { cn, getDirectImageUrl } from '../lib/utils';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: any[];
  mockTests: any[];
  dynamicQuestionBanks: Record<string, any[]>;
  onViewExam: (examId: string) => void;
  onLaunchMockTest: (test: any) => void;
  onLaunchBank: (bank: any) => void;
}

export const GlobalSearchModal = ({
  isOpen,
  onClose,
  exams = [],
  mockTests = [],
  dynamicQuestionBanks = {},
  onViewExam,
  onLaunchMockTest,
  onLaunchBank,
}: GlobalSearchModalProps) => {
  const [query, setQuery] = useState('');
  const [showAllExams, setShowAllExams] = useState(false);
  const [showAllMockTests, setShowAllMockTests] = useState(false);
  const [showAllPracticeSets, setShowAllPracticeSets] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowAllExams(false);
    setShowAllMockTests(false);
    setShowAllPracticeSets(false);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Helper to detect system config rows, URLs, or non-human-readable data
  const isUrlOrSystem = (val: any) => {
    if (!val || typeof val !== 'string') return false;
    const s = val.trim().toLowerCase();
    return (
      s.startsWith('http') ||
      s.includes('drive.google') ||
      s.includes('docs.google') ||
      s.startsWith('system_') ||
      s.includes('system_settings') ||
      s.endsWith('.pdf') ||
      s.endsWith('.png') ||
      s.endsWith('.jpg')
    );
  };

  // Filter out system config rows, URLs, and non-exam items
  const validExams = exams.filter(e => {
    if (!e) return false;
    if (e.category === 'blog' || e.category === 'system') return false;
    if (isUrlOrSystem(e.name) || isUrlOrSystem(e.title) || isUrlOrSystem(e.id) || isUrlOrSystem(e.description)) return false;
    const displayName = (e.name || e.title || '').trim();
    if (!displayName || isUrlOrSystem(displayName)) return false;
    return true;
  });

  const sortByLatest = (items: any[]) => {
    return [...items].sort((a, b) => {
      const dateA = a.created_at || a.createdAt || '';
      const dateB = b.created_at || b.createdAt || '';
      if (dateA && dateB) {
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      }
      return String(b.id || '').localeCompare(String(a.id || ''));
    });
  };

  const sortedExams = sortByLatest(validExams);
  const sortedMockTests = sortByLatest(mockTests);

  const filteredExams = q
    ? sortedExams.filter(e => {
        const name = (e.name || e.title || '').toLowerCase();
        const desc = (e.description || '').toLowerCase();
        return name.includes(q) || desc.includes(q);
      })
    : sortedExams;
  const matchingExams = showAllExams ? filteredExams : filteredExams.slice(0, 4);

  // Filter Mock Tests
  const filteredMockTests = q
    ? sortedMockTests.filter(t => (t.title || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
    : sortedMockTests;
  const matchingMockTests = showAllMockTests ? filteredMockTests : filteredMockTests.slice(0, 4);

  // Flatten all Question Banks
  const flatBanks = Object.values(dynamicQuestionBanks).flat();
  const sortedPracticeSets = sortByLatest(flatBanks.filter(b => b.target_mode !== 'bank'));

  // Filter Practice Sets
  const filteredPracticeSets = q
    ? sortedPracticeSets.filter(b => (b.title || '').toLowerCase().includes(q))
    : sortedPracticeSets;
  const matchingPracticeSets = showAllPracticeSets ? filteredPracticeSets : filteredPracticeSets.slice(0, 4);

  const totalResults = q
    ? filteredExams.length + filteredMockTests.length + filteredPracticeSets.length
    : 0;

  if (typeof document === 'undefined' || !isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-24 px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl bg-white/80 dark:bg-slate-900/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_25px_60px_-15px_rgba(12,35,64,0.18)] dark:shadow-slate-950/80 border border-white/60 dark:border-slate-700/60 overflow-hidden z-10 flex flex-col max-h-[80vh] premium-shadow"
        >
          {/* Top Search Input Bar */}
          <div className="p-4.5 sm:p-5.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3.5 bg-white/40 dark:bg-slate-800/40 focus-within:bg-white/70 dark:focus-within:bg-slate-800/70 focus-within:shadow-[inset_0_2px_4px_rgba(0,0,0,0.01)] transition-all duration-300 focus-within:ring-2 focus-within:ring-brand-500/8 focus-within:border-brand-500/20">
            <Search className="w-5.5 h-5.5 text-brand-600 dark:text-brand-400 shrink-0 filter drop-shadow-[0_0_8px_rgba(37,99,235,0.12)]" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search exams, mock tests, practice sets, question banks..."
              className="w-full bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-extrabold text-base sm:text-lg focus:outline-none tracking-tight"
            />
            {query ? (
              <button
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs font-black text-slate-400 bg-white/85 rounded-lg border border-slate-200 shadow-2xs">
              ESC
            </kbd>
          </div>

          {/* Search Results Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 premium-scrollbar scroll-smooth overscroll-contain [transform:translate3d(0,0,0)] [backface-visibility:hidden] [-webkit-overflow-scrolling:touch]">
            {q && totalResults === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-base">No results found for "{query}"</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Try searching for a subject like <strong>Pharmacology</strong>, <strong>General Studies</strong>, or exam name like <strong>OPSC</strong>.
                </p>
              </div>
            ) : (
              <>
                {/* Section 1: Exams */}
                {filteredExams.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 px-1">
                      <Award className="w-3.5 h-3.5 text-brand-600" /> Target Exams ({filteredExams.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchingExams.map((exam: any) => (
                        <div
                          key={exam.id}
                          onClick={() => {
                            onViewExam(exam.id);
                            onClose();
                          }}
                          className="p-3.5 bg-white/40 hover:bg-white border border-slate-200/50 hover:border-brand-300 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group card-lift hover:shadow-lg hover:shadow-brand-500/5"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {exam.icon && (exam.icon.startsWith('http') || exam.icon.startsWith('/')) ? (
                              <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/50">
                                <img
                                  src={getDirectImageUrl(exam.icon)}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  onError={(e: any) => {
                                    e.target.style.display = 'none';
                                    e.target.parentNode.textContent = '🏛️';
                                  }}
                                />
                              </div>
                            ) : (
                              <span className="text-xl shrink-0">{exam.icon || '🏛️'}</span>
                            )}
                            <div className="min-w-0">
                              <h6 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-brand-700 truncate">
                                {exam.name || exam.title || 'Target Exam'}
                              </h6>
                              <p className="text-[10px] text-slate-500 truncate">{exam.category || 'Target Exam'}</p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                        </div>
                      ))}
                    </div>
                    {filteredExams.length > 4 && (
                      <button
                        onClick={() => setShowAllExams(!showAllExams)}
                        className="mt-3 w-full py-2 bg-white/40 hover:bg-white border border-slate-200/50 hover:border-brand-300 rounded-2xl font-extrabold text-[11px] text-slate-500 hover:text-brand-600 transition-all duration-300 flex items-center justify-center gap-1.5 group cursor-pointer shadow-2xs hover:shadow-sm"
                      >
                        <span>{showAllExams ? 'Show Less' : `View All (${filteredExams.length})`}</span>
                        <ArrowRight className={cn("w-3.5 h-3.5 transform transition-transform text-slate-400 group-hover:text-brand-600", showAllExams ? "-rotate-90" : "rotate-90")} />
                      </button>
                    )}
                  </div>
                )}

                {/* Section 2: Mock Tests */}
                {filteredMockTests.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 px-1">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" /> Mock Tests ({filteredMockTests.length})
                    </h5>
                    <div className="space-y-2">
                      {matchingMockTests.map((test: any) => {
                        const isUpcoming = test.scheduled_at && new Date(test.scheduled_at).getTime() > Date.now();
                        return (
                          <div
                            key={test.id}
                            onClick={() => {
                              if (!isUpcoming) {
                                onLaunchMockTest(test);
                                onClose();
                              }
                            }}
                            className={cn(
                              "p-3.5 border rounded-2xl flex items-center justify-between gap-3 transition-all duration-300",
                              isUpcoming
                                ? "border-amber-100 bg-amber-50/20 cursor-not-allowed opacity-85"
                                : "border-slate-200/50 hover:border-indigo-300 hover:bg-white bg-white/40 cursor-pointer group card-lift hover:shadow-lg hover:shadow-indigo-500/5"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h6 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-indigo-700 truncate">
                                  {test.title}
                                </h6>
                                {isUpcoming ? (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded border border-amber-200">
                                    📅 Scheduled
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                                    Mock Test
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-semibold">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-400" /> {test.durationMinutes || 60} Mins</span>
                                <span>•</span>
                                <span>{test.questionsCount || test._questionCount || 0} Questions</span>
                              </div>
                            </div>
                            <button
                              disabled={isUpcoming}
                              className={cn(
                                "px-3.5 py-1.8 rounded-xl font-extrabold text-xs shrink-0 flex items-center gap-1 transition-all",
                                isUpcoming
                                  ? "bg-amber-50 text-amber-800 border border-amber-200/50"
                                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-md shadow-indigo-600/10"
                              )}
                            >
                              {isUpcoming ? <Lock className="w-3 h-3" /> : 'Start Test'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {filteredMockTests.length > 4 && (
                      <button
                        onClick={() => setShowAllMockTests(!showAllMockTests)}
                        className="mt-3 w-full py-2 bg-white/40 hover:bg-white border border-slate-200/50 hover:border-indigo-300 rounded-2xl font-extrabold text-[11px] text-slate-500 hover:text-indigo-600 transition-all duration-300 flex items-center justify-center gap-1.5 group cursor-pointer shadow-2xs hover:shadow-sm"
                      >
                        <span>{showAllMockTests ? 'Show Less' : `View All (${filteredMockTests.length})`}</span>
                        <ArrowRight className={cn("w-3.5 h-3.5 transform transition-transform text-slate-400 group-hover:text-indigo-600", showAllMockTests ? "-rotate-90" : "rotate-90")} />
                      </button>
                    )}
                  </div>
                )}

                {/* Section 3: Practice Sets */}
                {filteredPracticeSets.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5 px-1">
                      <Target className="w-3.5 h-3.5 text-emerald-600" /> Practice Sets ({filteredPracticeSets.length})
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {matchingPracticeSets.map((bank: any) => (
                        <div
                          key={bank.id}
                          onClick={() => {
                            onLaunchBank(bank);
                            onClose();
                          }}
                          className="p-3.5 bg-white/40 hover:bg-white border border-slate-200/50 hover:border-emerald-300 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between group card-lift hover:shadow-lg hover:shadow-emerald-500/5"
                        >
                          <div className="min-w-0">
                            <h6 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 truncate">
                              {bank.title}
                            </h6>
                            <p className="text-[10px] text-slate-500 font-semibold">{bank.questions || bank.questionCount || 0} Questions</p>
                          </div>
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-lg shrink-0 ml-2">
                            Practice
                          </span>
                        </div>
                      ))}
                    </div>
                    {filteredPracticeSets.length > 4 && (
                      <button
                        onClick={() => setShowAllPracticeSets(!showAllPracticeSets)}
                        className="mt-3 w-full py-2 bg-white/40 hover:bg-white border border-slate-200/50 hover:border-emerald-300 rounded-2xl font-extrabold text-[11px] text-slate-500 hover:text-emerald-600 transition-all duration-300 flex items-center justify-center gap-1.5 group cursor-pointer shadow-2xs hover:shadow-sm"
                      >
                        <span>{showAllPracticeSets ? 'Show Less' : `View All (${filteredPracticeSets.length})`}</span>
                        <ArrowRight className={cn("w-3.5 h-3.5 transform transition-transform text-slate-400 group-hover:text-emerald-600", showAllPracticeSets ? "-rotate-90" : "rotate-90")} />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom Keyboard Shortcuts Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-[11px] font-bold text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" /> OdishaExamPrep Spotlight Search
            </span>
            <div className="hidden sm:flex items-center gap-3">
              <span>Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">ESC</kbd> to exit</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
