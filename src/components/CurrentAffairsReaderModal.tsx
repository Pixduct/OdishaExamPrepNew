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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-600 font-extrabold text-xs uppercase tracking-wider rounded-full">
          <MapPin className="w-3.5 h-3.5 text-amber-500" />
          Odisha State CA
        </span>
      );
    } else if (c.includes('world') || c.includes('international')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-600 font-extrabold text-xs uppercase tracking-wider rounded-full">
          <Globe className="w-3.5 h-3.5 text-purple-500" />
          World / International CA
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-extrabold text-xs uppercase tracking-wider rounded-full">
          <Building2 className="w-3.5 h-3.5 text-emerald-500" />
          India / National CA
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] sm:max-h-[92vh] flex flex-col overflow-hidden my-auto transform-gpu">
        
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between shrink-0 z-20">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Current Affairs
          </button>
          
          <div className="flex items-center gap-3">
            {getCategoryBadge(article.category)}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-200/60 hover:bg-rose-500 hover:text-white text-slate-600 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Reader Body with Hardware-Accelerated Momentum Scrolling */}
        <div className="overflow-y-auto overscroll-contain p-5 sm:p-8 space-y-6 text-slate-800 scroll-smooth [will-change:transform] [webkit-overflow-scrolling:touch]" data-lenis-prevent>
          
          {/* Article Title */}
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-slate-900 leading-snug">
            {article.title}
          </h1>

          {/* Date & Source Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 pb-4 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-500" />
              {article.event_date || 'August 14, 2026'}
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              Source: <span className="text-slate-700 font-bold">{article.sources || 'PIB / Official Press'}</span>
            </span>
          </div>

          {/* Student Community & Channel Promotion Hub Banner */}
          <div className={`rounded-2xl p-5 sm:p-6 text-white border shadow-lg relative overflow-hidden ${
            cat.includes('odisha')
              ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-orange-950 border-amber-500/40'
              : cat.includes('world') || cat.includes('international')
              ? 'bg-gradient-to-r from-indigo-800 via-purple-900 to-slate-950 border-purple-500/40'
              : 'bg-gradient-to-r from-teal-800 via-emerald-900 to-slate-950 border-teal-500/40'
          }`}>
            <div className={`absolute -right-8 -bottom-8 w-48 h-48 rounded-full blur-2xl pointer-events-none ${
              cat.includes('odisha') ? 'bg-amber-500/20' : cat.includes('world') ? 'bg-purple-500/20' : 'bg-teal-500/20'
            }`} />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1 max-w-lg">
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider border ${
                  cat.includes('odisha')
                    ? 'bg-amber-400/20 text-amber-200 border-amber-400/40'
                    : cat.includes('world') || cat.includes('international')
                    ? 'bg-purple-400/20 text-purple-200 border-purple-400/40'
                    : 'bg-teal-400/20 text-teal-200 border-teal-400/40'
                }`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  {cat.includes('odisha') ? 'Odisha State Exam Community' : cat.includes('world') || cat.includes('international') ? 'International Relations Community' : 'National Exam Community'}
                </div>
                <h3 className="text-base sm:text-lg font-serif font-black text-white leading-tight">
                  Daily Current Affairs PDFs & Video Class Alerts
                </h3>
                <p className="text-xs text-white/80 font-medium leading-relaxed">
                  {cat.includes('odisha')
                    ? 'Join 25,000+ OPSC, OSSC CGL & OSSSC aspirants getting instant PDF notes, daily quizzes & free YouTube classes.'
                    : cat.includes('world') || cat.includes('international')
                    ? 'Join UPSC & OPSC Civil Services aspirants getting global affairs PDF notes, daily quizzes & free YouTube classes.'
                    : 'Join SSC CGL, Railway RRB & Banking aspirants getting instant PDF notes, daily quizzes & free YouTube classes.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <a
                  href="https://t.me/OdishaExamPrep365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  Join Telegram
                </a>

                <a
                  href="https://www.youtube.com/@OdishaExamPrep365"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 group"
                >
                  <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
                  Watch YouTube
                </a>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-all flex items-center gap-1.5 backdrop-blur-xs"
                  title="Print or Save PDF Note"
                >
                  <Printer className="w-3.5 h-3.5" /> Print PDF
                </button>
              </div>
            </div>
          </div>

          {/* 3-Bullet Executive Summary Box */}
          {article.summary && (
            <div className="bg-gradient-to-br from-brand-50/80 to-indigo-50/50 border border-brand-200/80 rounded-2xl p-5 sm:p-6 shadow-xs">
              <h3 className="text-sm font-black text-brand-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-brand-600" /> Executive 360° Summary
              </h3>
              <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line font-medium">
                {article.summary}
              </div>
            </div>
          )}

          {/* Full Background Context */}
          <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed text-sm sm:text-base">
            <div dangerouslySetInnerHTML={{ __html: article.full_context }} />
          </div>

          {/* Static GK & Exam Relevance Callout Card */}
          {article.static_gk_pointers && (
            <div dangerouslySetInnerHTML={{ __html: article.static_gk_pointers }} />
          )}

          {/* Key Data Table */}
          {article.data_table_html && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-xs">
              <div dangerouslySetInnerHTML={{ __html: article.data_table_html }} />
            </div>
          )}

          {/* Practice MCQs Section */}
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
              <div className="pt-6 border-t border-slate-200/80 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-emerald-600" /> Practice Exam Questions ({activeMcqs.length})
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Instant Self-Test
                  </span>
                </div>

                <div className="space-y-4">
                  {activeMcqs.map((mcq, idx) => {
                    const userAns = selectedAnswers[idx];
                    const isAnswered = showExplanations[idx];

                    return (
                      <div key={idx} className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                        <p className="font-extrabold text-slate-900 text-sm sm:text-base">
                          Q{idx + 1}. <MathTextRenderer text={mcq.question} />
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {mcq.options.map((opt, optIdx) => {
                            const letter = String.fromCharCode(65 + optIdx);
                            const isSelected = userAns === letter;
                            const isCorrect = mcq.correct_answer === letter;

                            let btnStyle = "bg-white border-slate-200 text-slate-700 hover:border-brand-400 hover:bg-brand-50/50";

                            if (isAnswered) {
                              if (isCorrect) {
                                btnStyle = "bg-emerald-500 text-white border-emerald-600 shadow-sm font-bold";
                              } else if (isSelected && !isCorrect) {
                                btnStyle = "bg-rose-500 text-white border-rose-600 font-bold";
                              } else {
                                btnStyle = "bg-slate-100 text-slate-400 border-slate-200 opacity-60";
                              }
                            }

                            return (
                              <button
                                key={optIdx}
                                onClick={() => handleSelectOption(idx, letter)}
                                className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {isAnswered && isCorrect && <CheckCircle className="w-4 h-4 shrink-0 text-white" />}
                              </button>
                            );
                          })}
                        </div>

                        {isAnswered && (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs sm:text-sm font-medium space-y-1 animate-fadeIn">
                            <p className="font-bold text-emerald-700">✓ Correct Answer: Option {mcq.correct_answer}</p>
                            <p className="text-slate-700">{mcq.explanation}</p>
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
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <span className="text-xs font-semibold text-slate-500">
            OdishaExamPrep 360° Daily Current Affairs
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <Share2 className="w-3.5 h-3.5" /> Share Article
          </button>
        </div>

      </div>
    </div>
  );
};
