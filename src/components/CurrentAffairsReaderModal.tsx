import React, { useState } from 'react';
import { X, Calendar, Share2, Award, BookOpen, CheckCircle, HelpCircle, ArrowLeft, Building2, Globe, MapPin, Sparkles } from 'lucide-react';
import { CurrentAffairsItem, getSmartRealImage } from '../services/currentAffairsService';
import { MathTextRenderer } from './MathTextRenderer';

interface Props {
  article: CurrentAffairsItem | null;
  onClose: () => void;
}

export const CurrentAffairsReaderModal: React.FC<Props> = ({ article, onClose }) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanations, setShowExplanations] = useState<Record<number, boolean>>({});

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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
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

        {/* Scrollable Reader Body */}
        <div className="overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-800">
          
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

          {/* Executive Exam Topic Header Banner (Image-Free Professional Design) */}
          <div className={`p-5 sm:p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-xs ${
            cat.includes('odisha')
              ? 'bg-gradient-to-r from-amber-700 via-amber-800 to-orange-950 text-amber-50 border border-amber-600/30'
              : cat.includes('world') || cat.includes('international')
              ? 'bg-gradient-to-r from-indigo-800 via-purple-900 to-slate-950 text-purple-50 border border-purple-600/30'
              : 'bg-gradient-to-r from-teal-800 via-emerald-900 to-slate-950 text-teal-600/30'
          }`}>
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />
            <div className="flex items-center justify-between relative z-10 mb-2">
              <span className="text-[11px] font-mono tracking-wider font-extrabold px-3 py-1 bg-white/10 backdrop-blur-md rounded-lg text-white border border-white/20 uppercase">
                {cat.includes('odisha') ? 'OPSC • OSSC • OSSSC RELEVANT' : cat.includes('world') ? 'INTERNATIONAL RELATIONS' : 'SSC • RRB • BANKING RELEVANT'}
              </span>
              <span className="text-xs font-bold text-white/80 hidden sm:inline-block">
                Official 360° Exam Intelligence
              </span>
            </div>
            <div className="relative z-10 space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                {cat.includes('odisha') ? 'Odisha State & Governance Comprehensive Briefing' : cat.includes('world') ? 'Global & International Affairs Briefing' : 'National & Central Government Briefing'}
              </h3>
              <p className="text-xs text-white/80 font-medium">
                Comprehensive background context, static GK pointers, key data tables, and 2 practice MCQs.
              </p>
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
          {article.mcqs && article.mcqs.length > 0 && (
            <div className="pt-6 border-t border-slate-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-emerald-600" /> Practice Exam Questions ({article.mcqs.length})
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Instant Self-Test
                </span>
              </div>

              <div className="space-y-4">
                {article.mcqs.map((mcq, idx) => {
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
          )}

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
