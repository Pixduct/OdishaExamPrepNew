import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Layers, CheckCircle2, ChevronRight, ChevronDown, Sparkles, Target, Trophy } from 'lucide-react';
import { useActiveExamContext, CategorizedExams, buildCategorizedExamsFromDb } from '../lib/activeExamStore';
import { examService } from '../lib/examService';

interface ExamContextSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableExamsFromDb?: any[];
}

export const ExamContextSelectorModal: React.FC<ExamContextSelectorModalProps> = ({
  isOpen,
  onClose,
  availableExamsFromDb = []
}) => {
  const [context, changeExam] = useActiveExamContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [dbExams, setDbExams] = useState<any[]>(availableExamsFromDb);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (Array.isArray(availableExamsFromDb) && availableExamsFromDb.length > 0) {
      setDbExams(availableExamsFromDb);
    } else if (isOpen) {
      examService.getAllExams().then(res => {
        if (res && res.length > 0) setDbExams(res);
      }).catch(err => console.error("Error fetching exams for modal:", err));
    }
  }, [availableExamsFromDb, isOpen]);

  // Build categories strictly from live database exams
  const categories: CategorizedExams[] = useMemo(() => {
    return buildCategorizedExamsFromDb(dbExams);
  }, [dbExams]);

  // Expand all category trees by default when loaded
  useEffect(() => {
    if (categories.length > 0) {
      const state: Record<string, boolean> = {};
      categories.forEach(c => { state[c.categoryName] = true; });
      setExpandedCategories(state);
    }
  }, [categories]);

  // Enrolled / Pinned Recent Target Exams
  const enrolledExams = useMemo(() => {
    const list: any[] = [];
    categories.forEach(cat => {
      cat.exams.forEach(e => {
        if (e.isEnrolled || context.enrolledExamIds.includes(e.id)) {
          list.push(e);
        }
      });
    });
    return list.slice(0, 5);
  }, [categories, context.enrolledExamIds]);

  // Filtered categories based on quick search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    const query = searchQuery.toLowerCase().trim();
    return categories
      .map(cat => {
        const matchesCategory = cat.categoryName.toLowerCase().includes(query);
        const matchingExams = cat.exams.filter(
          e => e.name.toLowerCase().includes(query) || e.category.toLowerCase().includes(query)
        );

        if (matchesCategory || matchingExams.length > 0) {
          return {
            ...cat,
            exams: matchesCategory ? cat.exams : matchingExams
          };
        }
        return null;
      })
      .filter(Boolean) as CategorizedExams[];
  }, [categories, searchQuery]);

  const toggleCategory = (catName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleSelectExam = (id: string, name: string) => {
    changeExam(id, name);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] overflow-hidden flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        {/* Ambient Glassmorphic Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity pointer-events-auto z-[99998]"
        />

        {/* Executive 3D Vector Modal / Sliding Bottom Sheet Panel */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="w-full sm:max-w-xl md:max-w-2xl bg-slate-900 border border-blue-500/30 text-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl shadow-slate-950/60 overflow-hidden relative text-left flex flex-col max-h-[85vh] sm:max-h-[80vh] z-[99999] my-0 sm:my-auto pointer-events-auto group"
        >
          {/* Radial Grid & 3D Background Watermark */}
          <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none z-0" />
          <Target className="absolute -right-12 -bottom-12 w-72 h-72 opacity-10 stroke-[1.2] text-blue-300 pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:rotate-6 z-0" />

          {/* Top Drag Indicator for Mobile */}
          <div className="sm:hidden pt-3 pb-1 shrink-0 bg-slate-900/95 backdrop-blur-md relative z-10">
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto" />
          </div>

          {/* Sticky Header Section (Title + Subtitle + Close Button + Search Input) */}
          <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shrink-0">
            {/* Header Title Row */}
            <div className="p-4 sm:p-6 pb-2.5 sm:pb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shrink-0 shadow-md">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-xl font-black text-white tracking-tight leading-snug truncate uppercase">
                    Switch Target Exam Context
                  </h3>
                  <p className="text-[10px] sm:text-xs font-semibold text-amber-200/90 truncate">
                    <span className="sm:hidden">Filter Study Plan & Analytics by syllabus</span>
                    <span className="hidden sm:inline">Filter Study Plan, Analytics, and History by active syllabus</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all shrink-0 active:scale-95 cursor-pointer border border-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search Bar */}
            <div className="px-4 sm:px-6 pb-3.5 sm:pb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search exams, e.g., OSSC, Nursing..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 hover:bg-slate-950 focus:bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-semibold text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain space-y-4 sm:space-y-5 flex-1 premium-scrollbar max-h-[55vh] sm:max-h-[60vh] relative z-10">
            
            {/* Option 1: Global All Exams Combined Card */}
            <div>
              <button
                type="button"
                onClick={() => handleSelectExam('all', 'All Exams Combined')}
                className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.008] ${
                  context.activeExamId === 'all'
                    ? 'bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900 border-blue-400/80 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20 text-white'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                    context.activeExamId === 'all'
                      ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                      : 'bg-slate-800 border border-slate-700 text-slate-300'
                  }`}>
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="text-xs sm:text-sm font-black text-white truncate uppercase">All Exams Combined</span>
                      <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[9px] font-mono font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                        Aggregated View
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-300 mt-0.5 leading-snug truncate">
                      View total progress, overall accuracy, and combined history across all tests
                    </p>
                  </div>
                </div>

                {context.activeExamId === 'all' ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                )}
              </button>
            </div>

            {/* Option 2: Pinned Enrolled / Active Target Section */}
            {enrolledExams.length > 0 && !searchQuery && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-black uppercase tracking-wider text-amber-200/90 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Pinned Enrolled Targets
                  </h4>
                  <span className="text-[10px] font-bold font-mono text-slate-400">{enrolledExams.length} Active</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {enrolledExams.map(exam => {
                    const isSelected = context.activeExamId === exam.id;
                    return (
                      <button
                        type="button"
                        key={exam.id}
                        onClick={() => handleSelectExam(exam.id, exam.name)}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer hover:scale-[1.01] ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400/80 ring-2 ring-emerald-500/40 shadow-md text-white'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-white'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-black text-white truncate">
                            {exam.name}
                          </h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-semibold text-slate-300 truncate">
                              {exam.category}
                            </span>
                            {exam.readinessScore && (
                              <span className="text-[9px] font-mono font-black text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-1.5 py-0.5 rounded">
                                {exam.readinessScore}% Ready
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Option 3: Categorized Accordion / Tree List */}
            <div className="space-y-3">
              <h4 className="text-xs font-mono font-black uppercase tracking-wider text-amber-200/90 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-blue-400" />
                All Exam Syllabus Categories
              </h4>

              {filteredCategories.length === 0 ? (
                <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-xs font-bold text-slate-400">No exams matched your search "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="mt-2 text-xs font-black text-blue-400 hover:underline cursor-pointer"
                  >
                    Clear search filter
                  </button>
                </div>
              ) : (
                filteredCategories.map(cat => {
                  const isExpanded = searchQuery ? true : !!expandedCategories[cat.categoryName];

                  return (
                    <div
                      key={cat.categoryName}
                      className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/90 shadow-md"
                    >
                      {/* Category Header Bar */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat.categoryName)}
                        className="w-full p-3.5 bg-slate-950/80 hover:bg-slate-800/80 flex items-center justify-between gap-3 text-left transition-colors border-b border-slate-800/80 cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{cat.categoryIcon || '📚'}</span>
                          <span className="text-xs sm:text-sm font-black text-white">
                            {cat.categoryName}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-mono font-black text-amber-300">
                            {cat.exams.length}
                          </span>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {/* Category Exams List */}
                      {isExpanded && (
                        <div className="p-2 divide-y divide-slate-800/60">
                          {cat.exams.map(exam => {
                            const isSelected = context.activeExamId === exam.id;

                            return (
                              <button
                                type="button"
                                key={exam.id}
                                onClick={() => handleSelectExam(exam.id, exam.name)}
                                className={`w-full p-3 rounded-xl flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer hover:scale-[1.005] ${
                                  isSelected
                                    ? 'bg-blue-500/20 font-bold text-blue-300 border border-blue-400/40 shadow-xs'
                                    : 'hover:bg-slate-800/60 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                                    isSelected ? 'bg-blue-400 ring-2 ring-blue-300' : 'bg-slate-600'
                                  }`} />
                                  <span className="text-xs sm:text-sm font-extrabold truncate">
                                    {exam.name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {isSelected ? (
                                    <>
                                      <span className="hidden sm:inline-flex px-2.5 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-gradient-to-r from-brand-500 to-blue-600 text-white shadow-2xs items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-white" />
                                        Active Target
                                      </span>
                                      <CheckCircle2 className="sm:hidden w-4 h-4 text-blue-400 shrink-0" />
                                    </>
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* Sticky Bottom Footer */}
          <div className="sticky bottom-0 z-20 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 text-xs font-semibold text-slate-300 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="truncate text-[10px] sm:text-xs">
                Active: <strong className="text-white font-black">{context.activeExamName}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-500 via-blue-600 to-indigo-600 hover:from-brand-400 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all duration-200 shadow-md active:scale-95 shrink-0 cursor-pointer border-none"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
