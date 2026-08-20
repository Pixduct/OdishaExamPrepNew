import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Printer, ArrowRight } from 'lucide-react';

interface PdfExportGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
}

export const PdfExportGuideModal: React.FC<PdfExportGuideModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Question Bank PDF"
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleProceed = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      try {
        localStorage.setItem('oep_seen_pdf_export_guide', 'true');
      } catch (e) {}
    }
    onConfirm();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-[#0B1528] rounded-3xl p-4 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-4 relative overflow-hidden"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 pr-8">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Save PDF Instructions</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">Quick setting in your browser print screen:</p>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-[#060B16] border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <span className="w-5.5 h-5.5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed min-w-0 flex-1">
                <span>Set <strong>Destination</strong> to:</span>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800 text-[11.5px]">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Save as PDF</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">⚡ Formatted for clean A4 print &amp; offline study.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="w-5.5 h-5.5 rounded-full bg-amber-500 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed min-w-0 flex-1">
                <span>Under <strong>Options</strong>, uncheck:</span>
                <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold border border-slate-300/60 dark:border-slate-700">
                  <span className="w-3 h-3 rounded-xs border-2 border-slate-400 dark:border-slate-500 inline-flex items-center justify-center shrink-0" />
                  <span>Headers and footers</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Removes browser URLs &amp; dates from printed pages.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="w-5.5 h-5.5 rounded-full bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed min-w-0 flex-1">
                <span>Click <strong className="text-emerald-600 dark:text-emerald-400">Save</strong></span>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">The PDF will download directly to your device storage.</p>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="pt-0.5">
            <label className="flex items-center gap-2 text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none font-medium">
              <input 
                type="checkbox" 
                checked={dontShowAgain} 
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600" 
              />
              <span>Don't show this guide again</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="w-20 sm:w-24 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="flex-1 py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs sm:text-sm font-black tracking-wide shadow-md shadow-blue-600/25 transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span>Open PDF Print Window</span>
              <ArrowRight className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PdfExportGuideModal;
