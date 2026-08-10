import React, { useState, useMemo, useEffect } from 'react';
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

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] overflow-y-auto no-scrollbar">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity"
        />

        {/* Modal Outer Layout Container */}
        <div className="min-h-screen flex items-end sm:items-center justify-center p-0 sm:p-4 text-center">
          {/* Modal / Bottom Sheet Panel */}
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="w-full sm:max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[2.25rem] border-t sm:border border-slate-200 shadow-2xl overflow-hidden relative text-left flex flex-col max-h-[85vh] sm:max-h-[80vh] z-10"
          >
            {/* Top Drag Pill for Mobile */}
            <div className="sm:hidden w-12 h-1.5 bg-slate-200 rounded-full mx-auto my-3 shrink-0" />

            {/* Header */}
            <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600 shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                    Switch Target Exam Context
                  </h3>
                  <p className="text-xs font-semibold text-slate-500">
                    Filter Study Plan, Analytics, and History by active syllabus
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Search Input Control */}
            <div className="p-4 sm:p-5 pb-3 bg-slate-50/70 border-b border-slate-100 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search exams, e.g., OSSC, Nursing, Police, Civil Services..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200/90 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar space-y-6 flex-1">
              
              {/* Option 1: Global All Exams Combined Card */}
              <div>
                <button
                  onClick={() => handleSelectExam('all', 'All Exams Combined')}
                  className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between gap-4 ${
                    context.activeExamId === 'all'
                      ? 'bg-brand-50/80 border-brand-300 shadow-md shadow-brand-500/10 ring-2 ring-brand-500/20'
                      : 'bg-gradient-to-r from-slate-50 to-indigo-50/30 border-slate-200/80 hover:border-brand-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      context.activeExamId === 'all'
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                        : 'bg-white border border-slate-200 text-slate-700'
                    }`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">All Exams Combined</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-brand-100 text-brand-700">
                          Aggregated View
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        View total progress, overall accuracy, and combined history across all tests
                      </p>
                    </div>
                  </div>

                  {context.activeExamId === 'all' ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-600 shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
              </div>

              {/* Option 2: Pinned Enrolled / Active Target Section */}
              {enrolledExams.length > 0 && !searchQuery && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Pinned Enrolled Targets
                    </h4>
                    <span className="text-[10px] font-bold text-slate-400">{enrolledExams.length} Active</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {enrolledExams.map(exam => {
                      const isSelected = context.activeExamId === exam.id;
                      return (
                        <button
                          key={exam.id}
                          onClick={() => handleSelectExam(exam.id, exam.name)}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
                              : 'bg-white border-slate-200/80 hover:border-brand-200 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <h5 className="text-xs font-extrabold text-slate-900 truncate">
                              {exam.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-semibold text-slate-500 truncate">
                                {exam.category}
                              </span>
                              {exam.readinessScore && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  {exam.readinessScore}% Ready
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Option 3: Categorized Accordion / Tree List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-brand-600" />
                  All Exam Syllabus Categories
                </h4>

                {filteredCategories.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-bold text-slate-500">No exams matched your search "{searchQuery}"</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-2 text-xs font-black text-brand-600 hover:underline"
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
                        className="border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs"
                      >
                        {/* Category Header Bar */}
                        <button
                          onClick={() => toggleCategory(cat.categoryName)}
                          className="w-full p-3.5 bg-slate-50/80 hover:bg-slate-100/70 flex items-center justify-between gap-3 text-left transition-colors border-b border-slate-100"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{cat.categoryIcon || '📂'}</span>
                            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {cat.categoryName}
                            </span>
                            <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
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
                          <div className="p-2 divide-y divide-slate-100">
                            {cat.exams.map(exam => {
                              const isSelected = context.activeExamId === exam.id;

                              return (
                                <button
                                  key={exam.id}
                                  onClick={() => handleSelectExam(exam.id, exam.name)}
                                  className={`w-full p-3 rounded-xl flex items-center justify-between gap-3 text-left transition-all ${
                                    isSelected
                                      ? 'bg-brand-50/90 font-bold text-brand-700'
                                      : 'hover:bg-slate-50 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                      isSelected ? 'bg-brand-600' : 'bg-slate-300'
                                    }`} />
                                    <span className="text-xs sm:text-sm font-bold truncate">
                                      {exam.name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {isSelected ? (
                                      <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-brand-600 text-white">
                                        Active Target
                                      </span>
                                    ) : (
                                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
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

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 shrink-0">
              <span>Active: <strong className="text-slate-800">{context.activeExamName}</strong></span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
