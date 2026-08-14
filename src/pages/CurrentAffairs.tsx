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

  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === 'All' || art.category.toLowerCase().includes(selectedCategory.toLowerCase());
    const matchesQuery = searchQuery === '' || 
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      art.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = selectedDate === '' || (art.event_date && art.event_date.includes(selectedDate));
    return matchesCategory && matchesQuery && matchesDate;
  });

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

              {/* Date Filter */}
              <div className="flex items-center gap-2 shrink-0">
                <Calendar className="w-4 h-4 text-brand-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-brand-400"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="text-xs text-brand-400 hover:underline font-bold"
                  >
                    Reset Date
                  </button>
                )}
              </div>

            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                onClick={() => { setSelectedCategory('All'); setSearchQuery(''); setSelectedDate(''); }}
                className="px-4 py-2 bg-brand-600 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Reset All Filters
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
                      {article.image_url && (
                        <div className="h-44 overflow-hidden relative border-b border-slate-100 bg-slate-100">
                          <img
                            src={getSmartRealImage(article.title, article.category, article.image_url)}
                            alt={article.title}
                            onError={(e) => {
                              e.currentTarget.src = getSmartRealImage(article.title, article.category);
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-3 left-3 z-10">
                            {categoryBadge}
                          </div>
                        </div>
                      )}

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
