import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Check, CheckCheck, Shuffle, X as XIcon } from 'lucide-react';
import { MathTextRenderer } from '../MathTextRenderer';
import UniversalMathDiagramEngine from '../UniversalMathDiagramEngine';
import type { Flashcard, UserCardProgress, SRSRating } from '../../lib/srsEngine';

interface FlashcardFlipCardProps {
  card: Flashcard;
  progress: UserCardProgress | null;
  isFlipped: boolean;
  onFlip: () => void;
  onRate: (rating: SRSRating) => void;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  trackLearning?: boolean;
  isShuffled?: boolean;
  onToggleShuffle?: () => void;
}

// Token interfaces for clean React-native parsing without KaTeX regex collisions
interface TextToken {
  type: 'text';
  content: string;
}

interface ClozeToken {
  type: 'cloze';
  clozeId: string;
  target: string;
}

type CardToken = TextToken | ClozeToken;

function tokenizeCardText(text: string): CardToken[] {
  if (!text) return [];
  const tokens: CardToken[] = [];
  const regex = /\{\{c(\d+)::(.*?)\}\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'text',
        content: text.slice(lastIndex, match.index),
      });
    }
    tokens.push({
      type: 'cloze',
      clozeId: match[1],
      target: match[2],
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }

  return tokens;
}

export const FlashcardFlipCard: React.FC<FlashcardFlipCardProps> = ({
  card,
  progress,
  isFlipped,
  onFlip,
  onRate,
  onSwipeRight,
  onSwipeLeft,
  trackLearning = true,
  isShuffled = false,
  onToggleShuffle,
}) => {
  // Framer Motion gesture drag hooks for fluid Gemini swipe-to-grade
  const dragX = useMotionValue(0);
  const cardRotate = useTransform(dragX, [-200, 200], [-8, 8]);
  const rightOpacity = useTransform(dragX, [20, 80], [0, 1]);
  const leftOpacity = useTransform(dragX, [-20, -80], [0, 1]);

  // Handle Cloze Deletions on front side: native React tokens ensure zero KaTeX regex collisions or orphaned spans
  const renderFrontText = (text: string) => {
    const tokens = tokenizeCardText(text);

    return (
      <div className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100 leading-relaxed tracking-tight text-center [text-wrap:balance]">
        {tokens.map((token, idx) => {
          if (token.type === 'text') {
            return (
              <span key={idx} className="inline align-baseline">
                <MathTextRenderer
                  text={token.content}
                  className="inline font-semibold text-slate-800 dark:text-slate-100"
                />
              </span>
            );
          }
          return (
            <span
              key={idx}
              className="inline-flex items-center justify-center align-middle px-3 py-1 mx-1.5 rounded-xl text-xs sm:text-sm font-black font-mono tracking-wider bg-brand-50 text-brand-700 border-2 border-brand-300/90 dark:bg-brand-950/80 dark:text-brand-300 dark:border-brand-700 shadow-2xs select-none"
              title="Cloze blank"
            >
              [ ... ]
            </span>
          );
        })}
      </div>
    );
  };

  // Unified Cloze Answer Context: eliminates redundant duplication on the back face with pure React tokens
  const renderUnifiedAnswer = () => {
    const hasCloze = /\{\{c\d+::(.*?)\}\}/.test(card.front_text);

    if (hasCloze) {
      const tokens = tokenizeCardText(card.front_text);

      return (
        <div className="w-full max-w-md mx-auto text-center [text-wrap:balance]">
          <div className="text-base sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
            {tokens.map((token, idx) => {
              if (token.type === 'text') {
                return (
                  <span key={idx} className="inline align-baseline">
                    <MathTextRenderer text={token.content} className="inline" />
                  </span>
                );
              }

              // Cloze target: show revealed answer seamlessly
              let answerToShow = card.back_text;
              if (idx > 0 && tokens[idx - 1].type === 'text') {
                const prevText = (tokens[idx - 1] as TextToken).content.trim();
                const lastWordMatch = prevText.match(/(\b\w+\b)$/);
                if (lastWordMatch) {
                  const lastWord = lastWordMatch[1];
                  const re = new RegExp(`^${lastWord}\\s+`, 'i');
                  if (re.test(answerToShow)) {
                    answerToShow = answerToShow.replace(re, '');
                  }
                }
              }

              return (
                <span
                  key={idx}
                  className="inline-flex items-center align-baseline px-3 py-1 mx-1.5 rounded-xl font-extrabold text-base sm:text-xl bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs"
                >
                  <MathTextRenderer text={answerToShow} className="inline font-extrabold" />
                </span>
              );
            })}
          </div>
        </div>
      );
    }

    // Standard Q&A Card (Non-Cloze) — Pure Centered Answer Canvas
    return (
      <div className="w-full max-w-md mx-auto text-center [text-wrap:balance]">
        <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
          <MathTextRenderer text={card.back_text} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto select-none" style={{ perspective: '1200px' }}>
      {/* Draggable Framer Motion Card Shell (Swipe Right = Correct, Swipe Left = Wrong) */}
      <motion.div
        drag={trackLearning ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        style={{
          x: dragX,
          rotate: cardRotate,
          transformStyle: 'preserve-3d',
        }}
        onDragEnd={(_e, info) => {
          if (trackLearning) {
            if (info.offset.x > 80 && onSwipeRight) {
              onSwipeRight();
            } else if (info.offset.x < -80 && onSwipeLeft) {
              onSwipeLeft();
            }
          }
        }}
        onClick={() => {
          // If tap was not a drag, toggle card flip
          if (Math.abs(dragX.get()) < 5) {
            onFlip();
          }
        }}
        whileTap={{ scale: 0.985 }}
        className="relative w-full h-[370px] xs:h-[390px] sm:h-[480px] cursor-pointer"
      >
        {/* Swipe Direction Indicators (Gemini Green Check & Red Cross Overlay) */}
        {trackLearning && (
          <>
            <motion.div
              style={{ opacity: rightOpacity }}
              className="absolute -top-3 right-6 z-30 pointer-events-none bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Got it!
            </motion.div>
            <motion.div
              style={{ opacity: leftOpacity }}
              className="absolute -top-3 left-6 z-30 pointer-events-none bg-rose-500 text-white font-black text-xs px-3.5 py-1.5 rounded-full shadow-lg flex items-center gap-1.5"
            >
              <XIcon className="w-4 h-4" /> Try again
            </motion.div>
          </>
        )}

        {/* Pure 3D Flipping Canvas (Smooth GPU-accelerated rotation in true 3D space) */}
        <motion.div
          className="relative w-full h-full"
          style={{
            transformStyle: 'preserve-3d',
          }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        >
          {/* ==================== FRONT FACE (QUESTION) ==================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[28px] sm:rounded-[32px] p-6 xs:p-8 sm:p-12 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow duration-300 ${
              isFlipped ? 'pointer-events-none' : 'pointer-events-auto'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              WebkitTransform: 'rotateY(0deg)',
            }}
          >
            {/* Pure Center: Question Prompt */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center my-auto text-center w-full px-2 sm:px-4">
              <div className="w-full max-w-lg mx-auto">
                {renderFrontText(card.front_text)}
              </div>

              {/* Optional Diagram */}
              {card.diagram && (
                <div className="mt-4 max-h-36 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-2 bg-white/70 dark:bg-slate-950/40 w-full max-w-md mx-auto">
                  <UniversalMathDiagramEngine data={card.diagram} />
                </div>
              )}
            </div>

            {/* Bottom-Right Gemini Shuffle Button (Front Face) */}
            {onToggleShuffle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShuffle();
                }}
                style={{
                  transform: 'translateZ(30px)',
                  WebkitTransform: 'translateZ(30px)',
                }}
                className={`absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center cursor-pointer pointer-events-auto transition-all duration-200 active:scale-95 ${
                  isShuffled
                    ? 'bg-brand-600 text-white border-brand-700 shadow-md shadow-brand-500/30 dark:bg-brand-500 dark:border-brand-400'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300/80 dark:border-slate-600 shadow-xs hover:shadow-sm'
                }`}
                title={isShuffled ? 'Shuffle is ON (Click to turn off)' : 'Shuffle cards'}
                aria-label="Toggle shuffle cards"
              >
                <Shuffle className={`w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] transition-transform duration-200 ${isShuffled ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
              </button>
            )}
          </div>

          {/* ==================== BACK FACE (ANSWER) ==================== */}
          <div
            className={`absolute inset-0 w-full h-full rounded-[28px] sm:rounded-[32px] p-6 xs:p-8 sm:p-12 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-md transition-shadow duration-300 ${
              isFlipped ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              WebkitTransform: 'rotateY(180deg)',
            }}
          >
            {/* Subtle Top-Center Answer Indicator */}
            <div className="absolute top-4 sm:top-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700/60 border border-slate-300/60 dark:border-slate-600/60 text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-bold tracking-wider uppercase select-none pointer-events-none">
              <CheckCheck className="w-3 h-3 text-slate-400 dark:text-slate-500 stroke-[2.5]" />
              <span>Answer</span>
            </div>

            {/* Pure Center: Ultra-Clean Gemini Answer Display */}
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center my-auto text-center w-full px-2 sm:px-4">
              {renderUnifiedAnswer()}
            </div>

            {/* Bottom-Right Gemini Shuffle Button (Back Face) */}
            {onToggleShuffle && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleShuffle();
                }}
                style={{
                  transform: 'translateZ(30px)',
                  WebkitTransform: 'translateZ(30px)',
                }}
                className={`absolute bottom-3.5 right-3.5 sm:bottom-4 sm:right-4 z-30 w-9 h-9 sm:w-10 sm:h-10 rounded-xl border flex items-center justify-center cursor-pointer pointer-events-auto transition-all duration-200 active:scale-95 ${
                  isShuffled
                    ? 'bg-brand-600 text-white border-brand-700 shadow-md shadow-brand-500/30 dark:bg-brand-500 dark:border-brand-400'
                    : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300/80 dark:border-slate-600 shadow-xs hover:shadow-sm'
                }`}
                title={isShuffled ? 'Shuffle is ON (Click to turn off)' : 'Shuffle cards'}
                aria-label="Toggle shuffle cards"
              >
                <Shuffle className={`w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.2] transition-transform duration-200 ${isShuffled ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`} />
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

