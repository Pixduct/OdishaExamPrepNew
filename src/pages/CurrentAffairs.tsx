import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { fetchCurrentAffairsDigests, CurrentAffairsItem, getSmartRealImage } from '../services/currentAffairsService';
import { CurrentAffairsReaderModal } from '../components/CurrentAffairsReaderModal';
import { Search, Calendar, MapPin, Building2, Globe, Sparkles, BookOpen, ArrowRight, Filter } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';

export const CurrentAffairsPage: React.FC = () => {
  const { t } = useLanguage();
  const [articles, setArticles] = useState<CurrentAffairsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<CurrentAffairsItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Drag-to-scroll refs for pill containers
  const timePresetScrollRef = React.useRef<HTMLDivElement>(null);
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const attachDrag = (el: HTMLDivElement | null) => {
      if (!el) return () => {};
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      let hasMoved = false;

      const onMouseDown = (e: MouseEvent) => {
        isDown = true;
        hasMoved = false;
        startX = e.pageX - el.offsetLeft;
        scrollLeft = el.scrollLeft;
      };
      const onMouseLeave = () => { isDown = false; };
      const onMouseUp = () => { isDown = false; };
      const onMouseMove = (e: MouseEvent) => {
        if (!isDown) return;
        const x = e.pageX - el.offsetLeft;
        const walk = (x - startX) * 1.3;
        if (Math.abs(walk) > 4) hasMoved = true;
        el.scrollLeft = scrollLeft - walk;
      };
      const onClickCapture = (e: MouseEvent) => {
        if (hasMoved) {
          e.stopPropagation();
          hasMoved = false;
        }
      };

      el.addEventListener('mousedown', onMouseDown);
      el.addEventListener('mouseleave', onMouseLeave);
      el.addEventListener('mouseup', onMouseUp);
      el.addEventListener('mousemove', onMouseMove);
      el.addEventListener('click', onClickCapture, true);

      return () => {
        el.removeEventListener('mousedown', onMouseDown);
        el.removeEventListener('mouseleave', onMouseLeave);
        el.removeEventListener('mouseup', onMouseUp);
        el.removeEventListener('mousemove', onMouseMove);
        el.removeEventListener('click', onClickCapture, true);
      };
    };

    const cleanup1 = attachDrag(timePresetScrollRef.current);
    const cleanup2 = attachDrag(categoryScrollRef.current);

    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);

  const handleWheelScroll = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      container.scrollLeft += e.deltaY;
    } else {
      container.scrollLeft += e.deltaX;
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchCurrentAffairsDigests();
      setArticles(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const categories = [
    { label: t('currentAffairs.categories.all', 'All Categories'), value: 'All', icon: Sparkles },
    { label: t('currentAffairs.categories.odisha', 'Odisha State'), value: 'Odisha', icon: MapPin },
    { label: t('currentAffairs.categories.national', 'India / National'), value: 'National', icon: Building2 },
    { label: t('currentAffairs.categories.world', 'World / International'), value: 'World', icon: Globe }
  ];

  const [timePreset, setTimePreset] = useState<string>('all');

  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === 'All' || art.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesQuery = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const artDateStr = art.event_date || (art.created_at ? art.created_at.substring(0, 10) : '');
    const artDate = artDateStr ? new Date(artDateStr) : null;
    const createdAtDateStr = art.created_at ? art.created_at.substring(0, 10) : '';

    const now = new Date();
    const todayStrUTC = now.toISOString().substring(0, 10);
    const todayStrLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    let matchesTimePreset = true;
    if (timePreset === 'today') {
      matchesTimePreset = (artDateStr === todayStrUTC || artDateStr === todayStrLocal || createdAtDateStr === todayStrUTC || createdAtDateStr === todayStrLocal);
    } else if (timePreset === '7days') {
      if (artDate) {
        const diffDays = (now.getTime() - artDate.getTime()) / (1000 * 3600 * 24);
        matchesTimePreset = diffDays >= 0 && diffDays <= 7;
      }
    } else if (timePreset === 'thisMonth') {
      if (artDate) {
        matchesTimePreset = artDate.getMonth() === now.getMonth() && artDate.getFullYear() === now.getFullYear();
      }
    } else if (timePreset === '3months') {
      if (artDate) {
        const diffDays = (now.getTime() - artDate.getTime()) / (1000 * 3600 * 24);
        matchesTimePreset = diffDays >= 0 && diffDays <= 90;
      }
    } else if (timePreset === '6months') {
      if (artDate) {
        const diffDays = (now.getTime() - artDate.getTime()) / (1000 * 3600 * 24);
        matchesTimePreset = diffDays >= 0 && diffDays <= 180;
      }
    }

    const matchesDateInput = selectedDate === '' || artDateStr === selectedDate || createdAtDateStr === selectedDate;

    return matchesCategory && matchesQuery && matchesTimePreset && matchesDateInput;
  });

  const timePresets = [
    { id: 'today', label: t('currentAffairs.timeFilters.today', "⚡ Today's News") },
    { id: '7days', label: t('currentAffairs.timeFilters.week', '📅 Last 7 Days') },
    { id: 'thisMonth', label: t('currentAffairs.timeFilters.month', '🗓️ This Month') },
    { id: '3months', label: t('currentAffairs.timeFilters.threeMonths', '📆 Last 3 Months') },
    { id: '6months', label: t('currentAffairs.timeFilters.sixMonths', '📊 Last 6 Months') },
    { id: 'all', label: t('currentAffairs.timeFilters.all', '📚 All Time Archives') },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#FBF9F6] dark:bg-[#060B16] py-4 sm:py-8 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8">

          {/* Hero Header Section */}
          <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 dark:from-[#0B1528] dark:via-[#081020] dark:to-[#060B16] border border-transparent dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-4 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl space-y-2 sm:space-y-4">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 bg-brand-500/20 border border-brand-400/30 rounded-full text-brand-300 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {t('currentAffairs.badge', 'OdishaExamPrep Daily Intelligence')}
              </div>
              <h1 className="text-xl sm:text-4xl md:text-5xl font-sans sm:font-serif font-black tracking-tight text-white leading-tight uppercase sm:normal-case">
                {t('currentAffairs.title', 'Daily 360° Current Affairs')}
              </h1>
              <p className="hidden sm:block text-slate-300 text-sm sm:text-base leading-relaxed">
                {t('currentAffairs.subtitle', 'Comprehensive, exam-focused daily digests for OPSC, OSSC CGL, OSSSC, SSC, Railway, and Banking exams. In-depth background context, static GK pointers, data tables, and practice MCQs.')}
              </p>
              <p className="block sm:hidden text-slate-300 text-xs leading-relaxed font-medium">
                {t('currentAffairs.subtitleMobile', 'Exam-focused daily digests, static GK pointers, data tables & practice MCQs for Odisha exams.')}
              </p>
            </div>

            {/* Date Calendar & Search Controls Bar */}
            <div className="mt-3.5 sm:mt-8 pt-3 sm:pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4 relative z-10">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-full sm:max-w-md">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search topic, scheme, or news..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-400 font-medium"
                />
              </div>

              {/* Date Filter & Multi-Period Time-Range Preset Toolbar (Single-row horizontal scroll on mobile with touch-pan & drag) */}
              <div 
                ref={timePresetScrollRef}
                onWheel={handleWheelScroll}
                className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-0.5 sm:pb-0 shrink-0 w-full sm:w-auto touch-pan-x overscroll-x-contain cursor-grab active:cursor-grabbing select-none"
              >
                {timePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setTimePreset(preset.id);
                      setSelectedDate('');
                    }}
                    className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-[10.5px] sm:text-xs font-black transition-all border shrink-0 whitespace-nowrap select-none cursor-pointer ${
                      timePreset === preset.id && selectedDate === ''
                        ? 'bg-brand-500 text-slate-950 border-brand-400 shadow-sm'
                        : 'bg-slate-800/90 dark:bg-slate-900/90 text-slate-300 border-slate-700/80 dark:border-slate-700 hover:bg-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                <div className="flex items-center gap-1 bg-slate-800/90 dark:bg-slate-900/90 border border-slate-700/80 dark:border-slate-700 rounded-xl px-2 sm:px-2.5 py-1.5 text-[10.5px] sm:text-xs text-white shrink-0">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-400 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => {
                      setSelectedDate(e.target.value);
                      setTimePreset('custom');
                    }}
                    className="bg-transparent text-white focus:outline-none text-[10.5px] sm:text-xs cursor-pointer"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Category Filter Pills */}
          <div 
            ref={categoryScrollRef}
            onWheel={handleWheelScroll}
            className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-2 no-scrollbar touch-pan-x overscroll-x-contain cursor-grab active:cursor-grabbing select-none -mx-3 px-3 sm:mx-0 sm:px-0"
          >
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-extrabold transition-all shrink-0 border select-none cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-[#2563eb] text-white border-slate-900 dark:border-[#2563eb] shadow-md'
                      : 'bg-white dark:bg-[#0B1528] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? 'text-brand-400 dark:text-white' : 'text-slate-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Current Affairs Articles Grid */}
          {loading ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{t('common.actions.loading', 'Loading daily 360° current affairs digests...')}</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto">
              <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800 dark:text-white">{t('currentAffairs.noArticlesFound', 'No Current Affairs Found')}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('currentAffairs.adjustFilter', 'Try adjusting your category filter, date, or search query.')}</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSelectedDate(''); setTimePreset('all'); }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {t('currentAffairs.resetFilters', 'Reset All Filters & View All Archives')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map(article => {
                const cat = article.category.toLowerCase();
                let categoryBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 font-black text-[10px] uppercase tracking-wider rounded-md">
                    {t('currentAffairs.categories.national', 'National')}
                  </span>
                );

                if (cat.includes('odisha')) {
                  categoryBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800 font-black text-[10px] uppercase tracking-wider rounded-md">
                      {t('currentAffairs.categories.odisha', 'Odisha State')}
                    </span>
                  );
                } else if (cat.includes('world') || cat.includes('international')) {
                  categoryBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800 font-black text-[10px] uppercase tracking-wider rounded-md">
                      {t('currentAffairs.categories.world', 'World')}
                    </span>
                  );
                }

                return (
                  <div
                    key={article.id}
                    className="bg-white dark:bg-[#0B1528] border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm dark:shadow-slate-950/60 hover:shadow-xl dark:hover:shadow-slate-950 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Card Header & Thumbnail */}
                    <div>
                      {/* Ultra-Professional Vector Exam Visual Banner */}
                      <div className={`h-36 relative p-5 flex flex-col justify-between overflow-hidden ${
                        cat.includes('odisha')
                          ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-950 text-amber-50'
                          : cat.includes('world') || cat.includes('international')
                          ? 'bg-gradient-to-br from-indigo-700 via-purple-800 to-slate-950 text-purple-50'
                          : 'bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-950 text-teal-50'
                      }`}>
                        {/* Background Decorative Graphic Grid Watermark */}
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
                        <div className="absolute -right-6 -bottom-6 opacity-15 pointer-events-none transform rotate-12 scale-150">
                          {cat.includes('odisha') ? (
                            <Building2 className="w-32 h-32 text-white" />
                          ) : cat.includes('world') || cat.includes('international') ? (
                            <Globe className="w-32 h-32 text-white" />
                          ) : (
                            <Sparkles className="w-32 h-32 text-white" />
                          )}
                        </div>

                        {/* Top Category Badge & Exam Target Tag */}
                        <div className="flex items-center justify-between z-10">
                          {categoryBadge}
                          <span className="text-[10px] font-mono tracking-wider font-extrabold px-2 py-0.5 bg-black/30 backdrop-blur-xs rounded-md text-white/90 border border-white/10 uppercase">
                            {cat.includes('odisha') ? 'OPSC • OSSC • OSSSC' : cat.includes('world') ? 'GLOBAL DIGEST' : 'SSC • RRB • BANKING'}
                          </span>
                        </div>

                        {/* Banner Central Topic Icon & Category Label */}
                        <div className="z-10 flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xs">
                            {cat.includes('odisha') ? (
                              <Building2 className="w-5 h-5 text-amber-200" />
                            ) : cat.includes('world') || cat.includes('international') ? (
                              <Globe className="w-5 h-5 text-purple-200" />
                            ) : (
                              <Sparkles className="w-5 h-5 text-teal-200" />
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-black uppercase tracking-widest text-white/80">
                              {cat.includes('odisha') ? 'Odisha State Exam Affairs' : cat.includes('world') ? 'International & World News' : 'National Current Affairs'}
                            </p>
                            <p className="text-[10px] font-semibold text-white/60">
                              360° Exam Background & MCQs
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 sm:p-6 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>{article.event_date || 'August 14, 2026'}</span>
                        </div>

                        <h3 className="text-base font-serif font-black text-slate-900 dark:text-white leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed line-clamp-3 font-medium">
                          {article.summary.replace(/•/g, '').trim()}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="p-4 sm:p-6 pt-0">
                      <button
                        onClick={() => setActiveArticle(article)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 sm:bg-slate-50 dark:sm:bg-[#060B16] text-white sm:text-slate-700 dark:sm:text-slate-200 sm:group-hover:bg-blue-600 sm:group-hover:text-white border border-blue-500/30 sm:border-slate-200/80 dark:sm:border-slate-800 sm:group-hover:border-blue-600 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 sm:shadow-2xs cursor-pointer active:scale-95"
                      >
                        {t('currentAffairs.readFullAnalysis', 'Read 360° Digest')} <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </div>

      {/* Reader Modal */}
      {activeArticle && (
        <CurrentAffairsReaderModal
          article={activeArticle}
          onClose={() => setActiveArticle(null)}
        />
      )}
    </PageLayout>
  );
};
