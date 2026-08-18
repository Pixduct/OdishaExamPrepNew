import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle2, Sparkles, Printer } from 'lucide-react';

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
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200/90 dark:border-slate-800 space-y-5 relative"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Save PDF Instructions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quick setting in your browser print screen:</p>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3.5">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-brand-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Set <strong>Destination</strong> to:
                <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold border border-brand-300 dark:border-brand-700 text-xs">
                  <Printer className="w-3.5 h-3.5" />
                  <span>Save as PDF</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">⚡ Auto-names your file and saves instantly in &lt; 1s!</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Under <strong>Options</strong>, uncheck:
                <div className="mt-1 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold border border-slate-300/60 dark:border-slate-600">
                  <span className="w-3.5 h-3.5 rounded-sm border-2 border-slate-400 dark:border-slate-500 inline-flex items-center justify-center shrink-0" />
                  <span>Headers and footers</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Removes browser URL &amp; date from the printed PDF.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-black flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                Click <strong className="text-emerald-600 dark:text-emerald-400">Save</strong>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">The PDF will download directly to your device.</p>
              </div>
            </div>
          </div>

          {/* Checkbox */}
          <div className="flex items-center justify-between pt-0.5">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox" 
                checked={dontShowAgain} 
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer" 
              />
              <span>Don't show this guide again</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProceed}
              className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-black tracking-wide shadow-md shadow-brand-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Open PDF Window</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PdfExportGuideModal;
