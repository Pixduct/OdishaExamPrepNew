import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Calendar, ChevronRight, Search, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { examService, Exam } from '../lib/examService';
import { getDirectImageUrl } from '../lib/utils';
import { fadeSlideDown, fadeSlideUp, durations } from '../lib/animations';
import PageLayout from '../components/PageLayout';

// Helpers for Reading Time and Snippet extraction
export const calculateReadingTime = (htmlContent: string): number => {
  const text = (htmlContent || '').replace(/<[^>]*>/g, '');
  const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, Math.round(words / 200));
};

export const getSnippet = (htmlContent: string, maxLength = 120): string => {
  const text = (htmlContent || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ');
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

export const getBlogCategory = (blog: Exam): string => {
  const text = ((blog.name || '') + ' ' + (blog.keywords || '') + ' ' + (blog.metaDescription || '')).toLowerCase();
  if (text.includes('strategy') || text.includes('how to') || text.includes('tips') || text.includes('crack') || text.includes('guide')) {
    return 'Exam Strategy';
  }
  if (text.includes('notification') || text.includes('admit') || text.includes('date') || text.includes('announce') || text.includes('job') || text.includes('recruitment')) {
    return 'Notifications';
  }
  if (text.includes('current') || text.includes('affairs') || text.includes('news') || text.includes('daily') || text.includes('monthly')) {
    return 'Current Affairs';
  }
  if (text.includes('syllabus') || text.includes('prep') || text.includes('subject') || text.includes('math') || text.includes('gs') || text.includes('history')) {
    return 'Subject Prep';
  }
  return 'Latest Updates';
};

const CATEGORIES = ['All', 'Exam Strategy', 'Notifications', 'Current Affairs', 'Subject Prep', 'Latest Updates'];

export default function BlogList() {
  const [blogs, setBlogs] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const exams = await examService.getAllExams();
        const blogItems = exams.filter(e => e.category === 'blog');
        
        // Sort blogs by date descending, fallback to creation
        const sortedBlogs = [...blogItems].sort((a, b) => {
          const dateA = a.examDate ? new Date(a.examDate).getTime() : 0;
          const dateB = b.examDate ? new Date(b.examDate).getTime() : 0;
          return dateB - dateA;
        });
        
        setBlogs(sortedBlogs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  // SEO Optimization for Blog Home page
  useEffect(() => {
    const seoTitle = 'OEP Knowledge Base & Prep Blog | OdishaExamPrep';
    const seoDesc = 'Expert strategy guides, syllabus breakdowns, recruitment updates, current affairs, and comprehensive preparation strategies for OPSC, OSSC, and OSSSC aspirants in Odisha.';
    document.title = seoTitle;

    // Inject/Update Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const createdMetaDesc = !metaDesc;
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const prevDesc = metaDesc.getAttribute('content');
    metaDesc.setAttribute('content', seoDesc);

    // Inject/Update Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    const createdMetaKeywords = !metaKeywords;
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    const prevKeywords = metaKeywords.getAttribute('content');
    metaKeywords.setAttribute('content', 'odisha exam preparation, opsc cse blog, ossc cgl tips, osssc ri amin prep, current affairs odisha, exam syllabus, how to crack opsc');

    // Inject/Update Open Graph Tags
    const ogTags = [
      { property: 'og:title', content: seoTitle },
      { property: 'og:description', content: seoDesc },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: window.location.href },
    ];
    const createdOgTags: HTMLMetaElement[] = [];
    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.property);
        document.head.appendChild(el);
        createdOgTags.push(el as HTMLMetaElement);
      }
      el.setAttribute('content', tag.content);
    });

    return () => {
      document.title = 'OdishaExamPrep';
      if (createdMetaDesc && metaDesc) metaDesc.remove();
      else if (metaDesc && prevDesc) metaDesc.setAttribute('content', prevDesc);

      if (createdMetaKeywords && metaKeywords) metaKeywords.remove();
      else if (metaKeywords && prevKeywords) metaKeywords.setAttribute('content', prevKeywords);

      createdOgTags.forEach(el => el.remove());
    };
  }, []);

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.name.toLowerCase().includes(search.toLowerCase()) || 
                          (blog.keywords || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || getBlogCategory(blog) === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Extract featured post (newest post when there's no active search/category filter)
  const isSearchActive = search.trim() !== '';
  const isCategoryFilterActive = selectedCategory !== 'All';
  const showFeaturedSection = !isSearchActive && !isCategoryFilterActive && filteredBlogs.length > 0;
  
  const featuredBlog = showFeaturedSection ? filteredBlogs[0] : null;
  const gridBlogs = showFeaturedSection ? filteredBlogs.slice(1) : filteredBlogs;

  return (
    <PageLayout backTo={{ path: '/', label: 'Back to Home' }}>
      <div className="py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10 sm:space-y-16">
        
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto">
          <motion.div 
            {...fadeSlideDown} 
            transition={{ ...fadeSlideDown.transition, duration: durations.slow }} 
            className="w-12 h-12 sm:w-20 sm:h-20 bg-brand-100/80 dark:bg-blue-950/60 backdrop-blur rounded-2xl sm:rounded-[2rem] flex items-center justify-center mx-auto mb-3 sm:mb-6 shadow-sm border border-brand-200/50 dark:border-blue-800/40"
          >
            <BookOpen className="w-6 h-6 sm:w-10 sm:h-10 text-brand-600 dark:text-blue-400 animate-pulse" />
          </motion.div>
          <motion.h1 
            {...fadeSlideDown} 
            transition={{ ...fadeSlideDown.transition, duration: durations.slow, delay: 0.1 }} 
            className="text-2xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight uppercase sm:normal-case"
          >
            OEP <span className="premium-text-gradient">Knowledge Base</span>
          </motion.h1>
          <motion.p 
            {...fadeSlideDown} 
            transition={{ ...fadeSlideDown.transition, duration: durations.slow, delay: 0.2 }} 
            className="text-xs sm:text-base md:text-lg text-slate-500 dark:text-slate-400 font-semibold leading-relaxed"
          >
            Latest insights, detailed exam strategies, recruitment schedules, and study material designed for Odisha excellence.
          </motion.p>
        </div>

        {/* Search and Categories controls */}
        <motion.div 
          {...fadeSlideDown} 
          transition={{ ...fadeSlideDown.transition, duration: durations.slow, delay: 0.3 }} 
          className="space-y-4 sm:space-y-6 max-w-4xl mx-auto"
        >
          {/* Search bar */}
          <div className="relative max-w-xl mx-auto shadow-sm hover:shadow-md transition-shadow duration-350 rounded-2xl">
            <div className="absolute inset-y-0 left-0 pl-3.5 sm:pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search articles, keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-4 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl bg-white dark:bg-[#0B1528] focus:border-brand-500 dark:focus:border-blue-500 focus:ring-0 outline-none transition-all font-bold text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400"
            />
          </div>

          {/* Category Tabs */}
          <div 
            onWheel={(e) => {
              const container = e.currentTarget;
              const isAtRightEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 2;
              const isAtLeftEnd = container.scrollLeft <= 2;
              if ((e.deltaY > 0 && !isAtRightEnd) || (e.deltaY < 0 && !isAtLeftEnd)) {
                container.scrollLeft += e.deltaY * 0.85;
              }
            }}
            className="flex justify-start sm:justify-center overflow-x-auto no-scrollbar py-1 sm:py-2 gap-1.5 sm:gap-2 scroll-smooth -mx-4 px-4 sm:mx-0 sm:px-0"
          >
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-full font-black text-xs sm:text-sm transition-all duration-300 border select-none cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-brand-600 dark:bg-blue-600 text-white border-brand-600 dark:border-blue-600 shadow-md shadow-brand-200/50 dark:shadow-blue-900/30'
                    : 'bg-white dark:bg-[#0B1528] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white shadow-xs'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-brand-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredBlogs.length === 0 ? (
          /* Empty state */
          <motion.div 
            {...fadeSlideUp}
            className="text-center py-16 sm:py-20 text-slate-500 dark:text-slate-400 bg-white dark:bg-[#0B1528] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 max-w-2xl mx-auto shadow-sm space-y-4 p-6 sm:p-8"
          >
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white">No articles found</h3>
            <p className="text-xs sm:text-sm text-slate-400 font-bold max-w-md mx-auto">We couldn't find any articles matching your search filters. Try selecting another category or typing another keyword.</p>
            <button 
              onClick={() => { setSearch(''); setSelectedCategory('All'); }}
              className="mt-2 px-4 py-2 bg-brand-50 dark:bg-blue-950/60 hover:bg-brand-100 text-brand-700 dark:text-blue-300 font-black text-xs sm:text-sm rounded-xl transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          /* Main Blog Content */
          <div className="space-y-8 sm:space-y-12">
            
            {/* Featured Post (Latest) */}
            {featuredBlog && (
              <motion.div 
                {...fadeSlideUp}
                transition={{ duration: durations.slow }}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-600/5 to-indigo-600/5 dark:from-blue-600/10 dark:to-indigo-600/10 rounded-2xl sm:rounded-[2.5rem] blur-2xl -z-10 group-hover:opacity-100 transition-opacity" />
                <Link 
                  to={`/blog/${featuredBlog.id}`} 
                  className="flex flex-col lg:flex-row bg-white dark:bg-[#0B1528] rounded-2xl sm:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-350"
                >
                  {/* Featured Image Banner */}
                  <div className="w-full lg:w-[50%] h-48 sm:h-72 lg:h-auto bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 relative overflow-hidden shrink-0">
                    {featuredBlog.icon ? (
                      <img 
                        src={getDirectImageUrl(featuredBlog.icon)} 
                        alt={featuredBlog.name} 
                        loading="eager"
                        onError={(e) => {
                          // Fallback to elegant gradient banner if image fails
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                        className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
                      />
                    ) : null}
                    
                    {/* Vector fallback graphic */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center p-6 text-white text-center pointer-events-none -z-0">
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />
                      <BookOpen className="w-12 h-12 text-brand-300/40 mb-2" />
                      <p className="text-xs font-black tracking-widest uppercase text-white/50">{getBlogCategory(featuredBlog)}</p>
                    </div>

                    {/* Category Overlay */}
                    <div className="absolute top-3 left-3 sm:top-5 sm:left-5 bg-brand-600 dark:bg-blue-600 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-md z-10">
                      Featured • {getBlogCategory(featuredBlog)}
                    </div>
                  </div>

                  {/* Featured Content details */}
                  <div className="p-4 sm:p-8 md:p-10 lg:w-[50%] flex flex-col justify-between space-y-4 sm:space-y-6">
                    <div className="space-y-2.5 sm:space-y-4">
                      {/* Meta information */}
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-brand-500 dark:text-blue-400" />
                          <span>{featuredBlog.examDate ? new Date(featuredBlog.examDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recent'}</span>
                        </div>
                        <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{calculateReadingTime(featuredBlog.description)} min read</span>
                        </div>
                      </div>

                      {/* Title */}
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight font-serif line-clamp-2">
                        {featuredBlog.name}
                      </h2>

                      {/* Excerpt */}
                      <p className="text-xs sm:text-base text-slate-500 dark:text-slate-300 font-medium sm:font-semibold leading-relaxed line-clamp-3">
                        {getSnippet(featuredBlog.description, 180)}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-1.5 text-brand-600 dark:text-blue-400 font-black text-xs sm:text-sm group-hover:gap-2.5 transition-all">
                      Read Full Strategy <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Standard Grid of articles */}
            {gridBlogs.length > 0 && (
              <div className="space-y-4 sm:space-y-8">
                {showFeaturedSection && (
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                    Latest Articles
                  </h3>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                  {gridBlogs.map((blog, idx) => {
                    const category = getBlogCategory(blog);
                    const readTime = calculateReadingTime(blog.description);
                    const excerpt = getSnippet(blog.description, 95);

                    return (
                      <motion.div
                        key={blog.id}
                        {...fadeSlideUp}
                        transition={{ duration: durations.slow, delay: (idx % 6) * 0.1 }}
                        className="flex"
                      >
                        <Link 
                          to={`/blog/${blog.id}`} 
                          className="group flex flex-col bg-white dark:bg-[#0B1528] rounded-2xl sm:rounded-[2rem] overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm dark:shadow-slate-950/50 hover:shadow-xl dark:hover:shadow-slate-950 transition-all duration-350 w-full justify-between"
                        >
                          {/* Card Image Banner */}
                          <div className="h-40 sm:h-52 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 overflow-hidden relative shrink-0">
                            {blog.icon ? (
                              <img 
                                src={getDirectImageUrl(blog.icon)} 
                                alt={blog.name} 
                                loading="lazy" 
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                                className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" 
                              />
                            ) : null}

                            {/* Vector Graphic Fallback */}
                            <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-white text-center pointer-events-none -z-0">
                              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:10px_10px]" />
                              <BookOpen className="w-8 h-8 text-brand-300/40 mb-1" />
                              <p className="text-[10px] font-black tracking-widest uppercase text-white/50">{category}</p>
                            </div>

                            {/* Tags overlay */}
                            <div className="absolute top-3 left-3 bg-white/95 dark:bg-[#060B16]/90 backdrop-blur px-2.5 py-1 rounded-lg flex items-center shadow-xs border border-transparent dark:border-slate-800 z-10">
                              <span className="text-[9.5px] sm:text-[10px] font-black text-brand-700 dark:text-blue-400 uppercase tracking-wider">{category}</span>
                            </div>
                          </div>

                          {/* Card Content details */}
                          <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-2">
                              {/* Metadata */}
                              <div className="flex items-center gap-2.5 text-[10.5px] sm:text-[11px] font-bold text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  <span>{blog.examDate ? new Date(blog.examDate).toLocaleDateString() : 'Recent'}</span>
                                </div>
                                <div className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span>{readTime} min read</span>
                                </div>
                              </div>

                              {/* Title */}
                              <h4 className="text-sm sm:text-lg font-serif font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-blue-400 transition-colors leading-snug line-clamp-2">
                                {blog.name}
                              </h4>

                              {/* Excerpt */}
                              <p className="text-xs text-slate-500 dark:text-slate-300 font-medium leading-relaxed line-clamp-2 sm:line-clamp-3">
                                {excerpt}
                              </p>
                            </div>

                            {/* Link */}
                            <div className="pt-2 flex items-center gap-1 text-xs font-black text-brand-600 dark:text-blue-400 group-hover:gap-2 transition-all">
                              Read Strategy <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
