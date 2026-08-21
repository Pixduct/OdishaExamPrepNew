import React, { useState, useEffect } from 'react';
import { X, Calendar, Share2, Award, BookOpen, CheckCircle, HelpCircle, ArrowLeft, Building2, Globe, MapPin, Sparkles, Send, Play, Printer, ExternalLink } from 'lucide-react';
import { CurrentAffairsItem, getSmartRealImage } from '../services/currentAffairsService';
import { MathTextRenderer } from './MathTextRenderer';

interface Props {
  article: CurrentAffairsItem | null;
  onClose: () => void;
}

export const CurrentAffairsReaderModal: React.FC<Props> = ({ article, onClose }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Lock background body scroll when modal is open to eliminate scroll lag & jitter
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!article) return null;

  const cat = (article.category || '').toLowerCase();

  const handleSelectOption = (mcqIdx: number, optionLetter: string) => {
    setSelectedAnswers(prev => ({ ...prev, [mcqIdx]: optionLetter }));
    setShowExplanations(prev => ({ ...prev, [mcqIdx]: true }));
  };

  const getCategoryBadge = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('odisha')) {
      return (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-md sm:rounded-full whitespace-nowrap">
          <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
          <span className="hidden sm:inline">Odisha State CA</span>
          <span className="sm:hidden">Odisha CA</span>
        </span>
      );
    } else if (c.includes('world') || c.includes('international')) {
      return (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-md sm:rounded-full whitespace-nowrap">
          <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-500 shrink-0" />
          <span className="hidden sm:inline">World / International CA</span>
          <span className="sm:hidden">World CA</span>
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-md sm:rounded-full whitespace-nowrap">
          <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
          <span className="hidden sm:inline">India / National CA</span>
          <span className="sm:hidden">National CA</span>
        </span>
      );
    }
  };

  const sanitizeArticleHtml = (htmlStr: string) => {
    if (!htmlStr) return '';
    return htmlStr
      .replace(/style="[^"]*"/gi, '')
      .replace(/style='[^']*'/gi, '')
      .replace(/\b(bg-white|bg-slate-50|bg-slate-100|bg-slate-200|bg-indigo-50|bg-blue-50|bg-amber-50|bg-emerald-50|bg-purple-50)\b/gi, 'bg-slate-50 dark:bg-[#0B1528]')
      .replace(/\b(border-slate-200|border-slate-100|border-indigo-200|border-blue-200|border-amber-200|border-emerald-200|border-purple-200)\b/gi, 'border-slate-200 dark:border-slate-800')
      .replace(/\b(text-slate-900|text-slate-800|text-slate-700|text-indigo-900|text-amber-900|text-purple-900|text-emerald-900)\b/gi, 'text-slate-800 dark:text-slate-200');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 flex items-center justify-center p-0 sm:p-4 animate-fadeIn backdrop-blur-xs">
      <div className="bg-white dark:bg-[#0B1528] border-0 sm:border border-slate-200/90 dark:border-slate-800 rounded-none sm:rounded-3xl shadow-2xl w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden transform-gpu">
        
        {/* Modal Top Header Bar */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-[#060B16]/95 flex items-center justify-between shrink-0 z-20 backdrop-blur-md">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-black sm:font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer py-1"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Back to Current Affairs</span>
            <span className="sm:hidden text-xs">Back</span>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {getCategoryBadge(article.category)}
            <button
              onClick={onClose}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl bg-slate-200/60 dark:bg-slate-800 hover:bg-rose-500 dark:hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Body with Hardware-Accelerated Momentum Scrolling */}
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-8 space-y-4 sm:space-y-6 text-slate-800 dark:text-slate-200 scroll-smooth [will-change:transform] [webkit-overflow-scrolling:touch]" data-lenis-prevent>
          
          {/* Article Title */}
          <h1 className="text-lg sm:text-3xl font-sans sm:font-serif font-black text-slate-900 dark:text-white leading-snug tracking-tight">
            {article.title}
          </h1>

          {/* Date & Source Metadata */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-500 dark:text-brand-400 shrink-0" />
              {article.event_date || 'August 14, 2026'}
            </span>
            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500">
              Source: <span className="text-slate-700 dark:text-slate-300 font-bold">{article.sources || 'PIB / Official Press'}</span>
            </span>
          </div>

          {/* 1. Executive 360° Summary Box (Directly at top for fast reading) */}
          {article.summary && (
            <div className="bg-gradient-to-br from-brand-50/80 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 border border-brand-200/80 dark:border-blue-900/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xs">
              <h3 className="text-xs sm:text-sm font-black text-brand-700 dark:text-blue-400 uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-600 dark:text-blue-400 shrink-0" /> Executive 360° Summary
              </h3>
              <div className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {article.summary}
              </div>
            </div>
          )}

          {/* 2. Full Background Context */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed text-xs sm:text-base">
            <div dangerouslySetInnerHTML={{ __html: sanitizeArticleHtml(article.full_context) }} />
          </div>

          {/* 3. Static GK & Exam Relevance Callout Card */}
          {article.static_gk_pointers && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-indigo-50/70 dark:from-[#0B1528] dark:to-[#060B16] border border-blue-200/80 dark:border-blue-900/50 shadow-xs relative overflow-hidden my-4 text-slate-800 dark:text-slate-200">
              <div 
                className="static-gk-content" 
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeArticleHtml(article.static_gk_pointers)
                }} 
              />
            </div>
          )}

          {/* 4. Key Data Table */}
          {article.data_table_html && (
            <div className="overflow-x-auto rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs my-4 bg-white dark:bg-[#0B1528]">
              <div 
                className="ca-data-table" 
                dangerouslySetInnerHTML={{ 
                  __html: sanitizeArticleHtml(article.data_table_html)
                }} 
              />
            </div>
          )}

          {/* 5. Student Community & Channel Promotion Hub Banner */}
          <div className={`rounded-2xl p-3.5 sm:p-5 text-white border shadow-md relative overflow-hidden ${
            cat.includes('odisha')
              ? 'bg-gradient-to-r from-amber-900 via-amber-950 to-orange-950 border-amber-500/40'
              : cat.includes('world') || cat.includes('international')
              ? 'bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-950 border-purple-500/40'
              : 'bg-gradient-to-r from-teal-950 via-emerald-900 to-slate-950 border-teal-500/40'
          }`}>
            <div className={`absolute -right-8 -bottom-8 w-48 h-48 rounded-full blur-2xl pointer-events-none ${
              cat.includes('odisha') ? 'bg-amber-500/20' : cat.includes('world') ? 'bg-purple-500/20' : 'bg-teal-500/20'
            }`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 relative z-10">
              <div className="space-y-1.5 max-w-lg">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black uppercase tracking-wider border ${
                  cat.includes('odisha')
                    ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                    : cat.includes('world') || cat.includes('international')
                    ? 'bg-purple-400/20 text-purple-200 border-purple-400/40'
                    : 'bg-teal-400/20 text-teal-200 border-teal-400/40'
                }`}>
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>{cat.includes('odisha') ? 'Odisha State Exam Community' : cat.includes('world') || cat.includes('international') ? 'International Relations Community' : 'National Exam Community'}</span>
                </div>
                <h3 className="text-sm sm:text-lg font-black text-white leading-tight tracking-tight">
                  Daily Current Affairs PDFs &amp; Video Class Alerts
                </h3>
                <p className="text-[11px] sm:text-xs text-white/85 font-medium leading-relaxed">
                  {cat.includes('odisha')
                    ? 'Join 25,000+ OPSC, OSSC CGL & OSSSC aspirants getting instant PDF notes, daily quizzes & free YouTube classes.'
                    : cat.includes('world') || cat.includes('international')
                    ? 'Join UPSC & OPSC Civil Services aspirants getting global affairs PDF notes, daily quizzes & free YouTube classes.'
                    : 'Join SSC CGL, Railway RRB & Banking aspirants getting instant PDF notes, daily quizzes & free YouTube classes.'}
                </p>
              </div>

              <div className="grid grid-cols-3 sm:flex items-center gap-2 sm:gap-2.5 shrink-0 pt-1 sm:pt-0">
                <a
                  href="https://t.me/OdishaExamPrep365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-sky-500 hover:bg-sky-400 active:scale-95 text-white font-extrabold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform shrink-0" />
                  <span>Telegram</span>
                </a>

                <a
                  href="https://www.youtube.com/@OdishaExamPrep365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-extrabold text-[11px] sm:text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 group cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white group-hover:scale-110 transition-transform shrink-0" />
                  <span>YouTube</span>
                </a>

                <button
                  onClick={() => window.print()}
                  className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white font-extrabold text-[11px] sm:text-xs rounded-xl border border-white/20 transition-all flex items-center justify-center gap-1.5 backdrop-blur-xs cursor-pointer shadow-xs"
                  title="Print or Save PDF Note"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* 6. Practice MCQs Section */}
          {(() => {
            const activeMcqs = (article.mcqs && article.mcqs.length > 0)
              ? article.mcqs
              : [
                  {
                    question: `Regarding "${article.title}", which of the following statements is correct?`,
                    options: [
                      `A) It directly impacts ${article.category} regional affairs and competitive exam syllabus.`,
                      `B) It is strictly an internal administrative memo with no public exam relevance.`,
                      `C) It was issued by an overseas judicial body without Indian consent.`,
                      `D) None of the above.`
                    ],
                    correct_answer: 'A',
                    explanation: `Option A is correct. This key development forms an integral part of ${article.category} current affairs for OPSC, OSSC, SSC, and Banking competitive examinations.`
                  },
                  {
                    question: `What is the primary focus of the news topic: "${article.title}"?`,
                    options: [
                      `A) ${article.summary ? article.summary.replace(/•/g, '').trim().slice(0, 90) + '...' : article.title}`,
                      `B) Implementation of an obsolete 19th century colonial directive.`,
                      `C) Complete suspension of regional competitive examinations.`,
                      `D) Unrelated international climate negotiations.`
                    ],
                    correct_answer: 'A',
                    explanation: `Option A accurately summarizes the core objective of this current affairs development as detailed in the official report.`
                  }
                ];

            return (
              <div className="pt-4 sm:pt-6 border-t border-slate-200/80 dark:border-slate-800 space-y-4 sm:space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Practice Questions ({activeMcqs.length})
                  </h3>
                  <span className="text-[10px] sm:text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                    Self-Test
                  </span>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {activeMcqs.map((mcq, idx) => {
                    const userAns = selectedAnswers[idx];
                    const isAnswered = showExplanations[idx];

                    return (
                      <div key={idx} className="bg-slate-50/80 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4">
                        <p className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-base leading-relaxed">
                          Q{idx + 1}. <MathTextRenderer text={mcq.question} />
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                          {mcq.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isSelected = userAns === letter;
                            const isCorrect = mcq.correct_answer === letter;

                            let btnStyle = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-brand-400 dark:hover:border-blue-500 hover:bg-brand-50/50 dark:hover:bg-slate-800/80";

                            if (isAnswered) {
                              if (isCorrect) {
                                btnStyle = "bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold";
                              } else if (isSelected && !isCorrect) {
                                btnStyle = "bg-rose-500 text-white border-rose-600 font-bold";
                              } else {
                                btnStyle = "bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800/60 opacity-60";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(idx, letter)}
                                className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border text-left text-[11px] sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isAnswered && isCorrect && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-white" />}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200 text-[11px] sm:text-sm font-medium space-y-1 animate-fadeIn">
                            <p className="font-bold text-emerald-700 dark:text-emerald-300">✓ Correct Answer: Option {mcq.correct_answer}</p>
                            <p className="text-slate-700 dark:text-slate-300">{mcq.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        </div>

        {/* Footer Action Bar */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/95 dark:bg-[#060B16]/95 flex items-center justify-between shrink-0">
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[180px] sm:max-w-none">
            OdishaExamPrep 360° Daily CA
          </span>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: article.title, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Article
          </button>
        </div>

      </div>
    </div>
  );
};
