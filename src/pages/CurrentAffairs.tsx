import React, { useState, useEffect } from 'react';
import PageLayout from '../components/PageLayout';
import { fetchCurrentAffairsDigests, CurrentAffairsItem, getSmartRealImage } from '../services/currentAffairsService';
import { CurrentAffairsReaderModal } from '../components/CurrentAffairsReaderModal';
import { Search, Calendar, MapPin, Building2, Globe, Sparkles, BookOpen, ArrowRight, Filter } from 'lucide-react';

export const CurrentAffairsPage: React.FC = () => {
  const [articles, setArticles] = useState<CurrentAffairsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeArticle, setActiveArticle] = useState<CurrentAffairsItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
    { label: 'All Categories', value: 'All', icon: Sparkles },
    { label: 'Odisha State', value: 'Odisha', icon: MapPin },
    { label: 'India / National', value: 'National', icon: Building2 },
    { label: 'World / International', value: 'World', icon: Globe }
  ];

  const [timePreset, setTimePreset] = useState<string>('all');

  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === 'All' || art.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesQuery = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());

    const artDateStr = art.event_date || (art.created_at ? art.created_at.substring(0, 10) : '');
    const artDate = artDateStr ? new Date(artDateStr) : null;
    const now = new Date();
    const todayStr = now.toISOString().substring(0, 10);
    const createdAtDateStr = art.created_at ? art.created_at.substring(0, 10) : '';

    let matchesTimePreset = true;
    if (timePreset === 'today') {
      matchesTimePreset = artDateStr === todayStr || createdAtDateStr === todayStr;
    } else if (timePreset === '7days') {
      if (artDate) {
        const diffMs = now.getTime() - artDate.getTime();
        matchesTimePreset = diffMs <= 7 * 86400 * 1000 && diffMs >= 0;
      }
    } else if (timePreset === 'thisMonth') {
      if (artDate) {
        matchesTimePreset = artDate.getFullYear() === now.getFullYear() && artDate.getMonth() === now.getMonth();
      }
    } else if (timePreset === '3months') {
      if (artDate) {
        const diffMs = now.getTime() - artDate.getTime();
        matchesTimePreset = diffMs <= 90 * 86400 * 1000 && diffMs >= 0;
      }
    } else if (timePreset === '6months') {
      if (artDate) {
        const diffMs = now.getTime() - artDate.getTime();
        matchesTimePreset = diffMs <= 180 * 86400 * 1000 && diffMs >= 0;
      }
    }

    const matchesDateInput = selectedDate === '' || (artDateStr && artDateStr.includes(selectedDate));

    return matchesCategory && matchesQuery && matchesTimePreset && matchesDateInput;
  });

  const timePresets = [
    { id: 'today', label: "⚡ Today's News" },
    { id: '7days', label: '📅 Last 7 Days' },
    { id: 'thisMonth', label: '🗓️ This Month' },
    { id: '3months', label: '📆 Last 3 Months' },
    { id: '6months', label: '📊 Last 6 Months' },
    { id: 'all', label: '📚 All Time Archives' },
  ];

  return (
    <PageLayout>
      <div className="min-h-screen bg-[#FBF9F6] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Hero Header Section */}
          <div className="bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/20 border border-brand-400/30 rounded-full text-brand-300 text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> OdishaExamPrep Daily Intelligence
              </div>
              <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-white leading-tight">
                Daily 360° Current Affairs
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Comprehensive, exam-focused daily digests for OPSC, OSSC CGL, OSSSC, SSC, Railway, and Banking exams. In-depth background context, static GK pointers, data tables, and practice MCQs.
              </p>
            </div>

            {/* Date Calendar & Search Controls Bar */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 relative z-10">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search topic, scheme, or news..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-brand-400"
                />
              </div>

              {/* Date Filter & Multi-Period Time-Range Preset Toolbar */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {timePresets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setTimePreset(preset.id);
                      setSelectedDate('');
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-black transition-all border shrink-0 ${
                      timePreset === preset.id && selectedDate === ''
                        ? 'bg-brand-500 text-slate-950 border-brand-400 shadow-sm'
                        : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}

                <div className="flex items-center gap-1 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white">
                  <Calendar className="w-3.5 h-3.5 text-brand-400" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={e => {
                      setSelectedDate(e.target.value);
                      setTimePreset('custom');
                    }}
                    className="bg-transparent text-white focus:outline-none text-xs"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Category Filter Pills */}
          <div 
            onWheel={(e) => {
              const container = e.currentTarget;
              const isAtRightEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
              const isAtLeftEnd = container.scrollLeft <= 2;
              if ((e.deltaY > 0 && !isAtRightEnd) || (e.deltaY < 0 && !isAtLeftEnd)) {
                container.scrollLeft += e.deltaY * 0.85;
              }
            }}
            className="flex items-center gap-2 overflow-x-auto overscroll-contain touch-pan-x pb-2 no-scrollbar"
          >
            {categories.map((cat, idx) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200/80 hover:bg-slate-100/80 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-400' : 'text-slate-400'}`} />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Current Affairs Articles Grid */}
          {loading ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Loading daily 360° current affairs digests...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-3 max-w-md mx-auto">
              <Filter className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">No Current Affairs Found</h3>
              <p className="text-xs text-slate-500">Try adjusting your category filter, date, or search query.</p>
              <button
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSelectedDate(''); setTimePreset('all'); }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Reset All Filters & View All Archives
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map(article => {
                const cat = article.category.toLowerCase();
                let categoryBadge = (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-black text-[10px] uppercase tracking-wider rounded-md">
                    National
                  </span>
                );

                if (cat.includes('odisha')) {
                  categoryBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 font-black text-[10px] uppercase tracking-wider rounded-md">
                      Odisha State
                    </span>
                  );
                } else if (cat.includes('world') || cat.includes('international')) {
                  categoryBadge = (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 border border-purple-200/60 font-black text-[10px] uppercase tracking-wider rounded-md">
                      World
                    </span>
                  );
                }

                return (
                  <div
                    key={article.id}
                    className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
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

                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-brand-500" />
                          <span>{article.event_date || 'August 14, 2026'}</span>
                        </div>

                        <h3 className="text-base font-serif font-black text-slate-900 leading-snug group-hover:text-brand-600 transition-colors line-clamp-2">
                          {article.title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 font-medium">
                          {article.summary.replace(/•/g, '').trim()}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="p-6 pt-0">
                      <button
                        onClick={() => setActiveArticle(article)}
                        className="w-full py-2.5 px-4 bg-slate-50 group-hover:bg-brand-600 group-hover:text-white border border-slate-200/80 group-hover:border-brand-600 text-slate-700 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        Read 360° Digest <ArrowRight className="w-3.5 h-3.5" />
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
