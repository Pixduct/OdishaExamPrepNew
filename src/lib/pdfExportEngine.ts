import katex from 'katex';
import DOMPurify from 'dompurify';

export interface QuestionBankExportData {
  title: string;
  subtitle?: string;
  subject?: string;
  examName?: string;
  totalQuestions: number;
  questions: Array<{
    id?: string | number;
    questionText?: string;
    question?: string;
    options: string[];
    correctAnswerIndex?: number;
    answer?: number | string;
    explanation?: string;
    diagram?: any;
  }>;
}

/**
 * Parses inline ($...$) and display ($$...$$) LaTeX formulas into sanitized HTML for PDF rendering
 */
function renderMathForPdf(text: string): string {
  if (!text) return '';

  // Replace block math $$...$$
  let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `$$${math}$$`;
    }
  });

  // Replace inline math $...$
  processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `$${math}$`;
    }
  });

  return DOMPurify.sanitize(processed, {
    ADD_TAGS: ['span', 'div', 'p', 'br', 'strong', 'em', 'sub', 'sup', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'svg', 'path', 'g', 'rect', 'line'],
    ADD_ATTR: ['class', 'style', 'aria-hidden', 'viewBox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'width', 'height', 'rx', 'transform', 'x1', 'y1', 'x2', 'y2']
  });
}

function resolveAnswerLetter(val: number | string | undefined): string {
  if (val === undefined || val === null || val === '') return '-';
  if (typeof val === 'number') {
    return ['A', 'B', 'C', 'D', 'E'][val] || `(${val + 1})`;
  }
  const str = String(val).trim().toUpperCase();
  if (['A', 'B', 'C', 'D', 'E'].includes(str)) return str;
  const num = parseInt(str, 10);
  if (!isNaN(num) && num >= 0 && num <= 4) {
    return ['A', 'B', 'C', 'D', 'E'][num] || str;
  }
  return str;
}

/**
 * Exports and prints a Question Bank directly to PDF via styled browser print engine
 */
export async function exportQuestionBankToPdf(data: QuestionBankExportData): Promise<boolean> {
  const { title, subtitle, subject, examName, questions } = data;
  const examLabel = examName ? examName.toUpperCase() : 'ODISHA STATE EXAMS';
  const subLabel = subtitle || subject || 'Official Practice Question Bank & Solution Booklet';
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  // Clean filename for automatic save dialogue pre-population
  const cleanTitle = (title || 'Question Bank').trim().replace(/[/\\?%*:|"<>]/g, ' ').replace(/\s+/g, ' ');
  const safeFilename = `${cleanTitle} - OdishaExamPrep`;

  // Temporarily set active browser tab title so Chromium auto-fills the Save dialog filename
  const originalDocTitle = document.title;
  document.title = safeFilename;
  setTimeout(() => {
    try {
      document.title = originalDocTitle;
    } catch (e) {}
  }, 12000);

  const hasAnyAnswers = questions.some(q => q.correctAnswerIndex !== undefined || q.answer !== undefined);

  // Build Questions HTML
  const questionsHtml = questions.map((q, idx) => {
    const qNum = idx + 1;
    const rawText = q.questionText || q.question || '';
    const qTextHtml = renderMathForPdf(rawText);
    const ansIdx = q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : (typeof q.answer === 'number' ? q.answer : undefined);
    const ansLetter = resolveAnswerLetter(q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer);

    const optionsHtml = (q.options || []).map((opt, oIdx) => {
      const optLetter = ['A', 'B', 'C', 'D', 'E'][oIdx] || `(${oIdx + 1})`;
      const optHtml = renderMathForPdf(opt);
      const isCorrect = ansIdx !== undefined && ansIdx === oIdx;

      return `
        <div class="option-item ${isCorrect ? 'option-correct' : ''}">
          <span class="option-letter">${optLetter}</span>
          <span class="option-text">${optHtml}</span>
        </div>
      `;
    }).join('');

    const explanationHtml = q.explanation ? `
      <div class="explanation-box">
        <div class="explanation-title">💡 Explanation / Solution:</div>
        <div class="explanation-content">${renderMathForPdf(q.explanation)}</div>
      </div>
    ` : '';

    return `
      <div class="question-card" id="q-${qNum}">
        <div class="question-header">
          <span class="question-badge">Q.${qNum}</span>
          <div class="question-text">${qTextHtml}</div>
        </div>
        <div class="options-grid">
          ${optionsHtml}
        </div>
        ${ansLetter !== '-' ? `
          <div class="answer-tag">
            <strong>Correct Answer:</strong> Option (${ansLetter})
          </div>
        ` : ''}
        ${explanationHtml}
      </div>
    `;
  }).join('');

  // Build Answer Key Table if answers exist
  let answerKeyTableHtml = '';
  if (hasAnyAnswers) {
    const rows = [];
    for (let i = 0; i < questions.length; i += 5) {
      const chunk = questions.slice(i, i + 5);
      const cells = chunk.map((q, cIdx) => {
        const qNo = i + cIdx + 1;
        const ans = resolveAnswerLetter(q.correctAnswerIndex !== undefined ? q.correctAnswerIndex : q.answer);
        return `
          <div class="key-cell">
            <span class="key-qno">Q.${qNo}</span>
            <span class="key-ans">${ans}</span>
          </div>
        `;
      }).join('');
      rows.push(`<div class="key-row">${cells}</div>`);
    }

    answerKeyTableHtml = `
      <div class="page-break"></div>
      <div class="answer-key-section">
        <div class="section-divider-title">
          <span>OFFICIAL ANSWER KEY SUMMARY</span>
        </div>
        <div class="key-grid">
          ${rows.join('')}
        </div>
      </div>
    `;
  }

  const printDocumentHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${safeFilename}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css" crossorigin="anonymous">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        html, body {
          width: 100%;
          margin: 0;
          padding: 0;
          background: #ffffff;
          color: #0f172a;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 9pt;
          line-height: 1.5;
        }

        .print-document-wrapper {
          width: 100%;
          max-width: 100%;
          padding: 14mm 15mm;
          position: relative;
        }

        /* ── Repeating Background Watermark on Every Page ── */
        .page-watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          z-index: -999;
          pointer-events: none;
          opacity: 0.032;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 500px;
          user-select: none;
        }

        .watermark-logo-box {
          width: 80px;
          height: 80px;
          background: #1e3a8a;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .watermark-name {
          font-size: 28pt;
          font-weight: 900;
          color: #1e3a8a;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .watermark-sub {
          font-size: 11pt;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* ── Master Document Header ── */
        .master-header {
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 14px 18px;
          margin-bottom: 16px;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-section {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo-badge {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #1e3a8a, #2563eb);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
        }

        .brand-titles h1 {
          font-size: 15pt;
          font-weight: 900;
          color: #1e3a8a;
          letter-spacing: -0.2px;
          text-transform: uppercase;
          line-height: 1.1;
          margin-bottom: 2px;
        }

        .brand-titles h1 span {
          color: #2563eb;
        }

        .brand-tagline {
          font-size: 7.5pt;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
        }

        .header-meta {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 3px;
        }

        .exam-badge {
          display: inline-block;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 8pt;
          font-weight: 800;
          padding: 2.5px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .doc-date {
          font-size: 7.5pt;
          color: #64748b;
          font-weight: 600;
        }

        /* ── Topic Title Card ── */
        .title-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 4px solid #2563eb;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .title-card h2 {
          font-size: 13pt;
          font-weight: 900;
          color: #0f172a;
          line-height: 1.2;
        }

        .title-card p {
          font-size: 8.5pt;
          color: #475569;
          font-weight: 600;
          margin-top: 2px;
        }

        .qcount-chip {
          background: #2563eb;
          color: #ffffff;
          font-size: 8pt;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 16px;
          white-space: nowrap;
        }

        /* ── Questions List ── */
        .questions-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .question-card {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          border-radius: 8px;
          padding: 12px 16px;
          page-break-inside: avoid;
          break-inside: avoid;
          position: relative;
        }

        .question-header {
          display: flex;
          gap: 8px;
          align-items: flex-start;
          margin-bottom: 8px;
        }

        .question-badge {
          background: #f1f5f9;
          color: #1e293b;
          font-size: 8pt;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #cbd5e1;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .question-text {
          font-size: 9.5pt;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.45;
          flex-grow: 1;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
          margin-top: 6px;
          margin-bottom: 6px;
        }

        .option-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 8.5pt;
          color: #334155;
          line-height: 1.35;
          padding: 3.5px 7px;
          border-radius: 5px;
          background: #fafafa;
          border: 1px solid #f1f5f9;
        }

        .option-item.option-correct {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #065f46;
          font-weight: 700;
        }

        .option-letter {
          font-weight: 900;
          color: #2563eb;
          flex-shrink: 0;
          min-width: 15px;
        }

        .option-item.option-correct .option-letter {
          color: #059669;
        }

        .option-text {
          font-weight: 500;
        }

        .answer-tag {
          margin-top: 6px;
          font-size: 7.5pt;
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
        }

        .explanation-box {
          margin-top: 6px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3px solid #10b981;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 8pt;
          color: #334155;
        }

        .explanation-title {
          font-weight: 800;
          color: #047857;
          text-transform: uppercase;
          font-size: 7pt;
          margin-bottom: 2px;
        }

        .explanation-content {
          line-height: 1.4;
        }

        /* ── Answer Key Summary Table ── */
        .page-break {
          page-break-before: always;
          break-before: page;
        }

        .answer-key-section {
          margin-top: 20px;
          padding: 16px;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .section-divider-title {
          text-align: center;
          font-size: 11pt;
          font-weight: 900;
          color: #1e3a8a;
          letter-spacing: 1px;
          margin-bottom: 14px;
          text-transform: uppercase;
        }

        .key-grid {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .key-row {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 6px;
        }

        .key-cell {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8.5pt;
        }

        .key-qno {
          font-weight: 800;
          color: #64748b;
        }

        .key-ans {
          font-weight: 900;
          color: #2563eb;
          background: #eff6ff;
          padding: 1px 6px;
          border-radius: 4px;
          border: 1px solid #bfdbfe;
        }

        /* ── Promotional Footer Card ── */
        .promotional-footer-card {
          margin-top: 20px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px 20px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .promo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .promo-badge {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 7.5pt;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .promo-links-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 12px;
        }

        .promo-link-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          text-decoration: none;
          color: inherit;
        }

        .promo-icon {
          font-size: 12pt;
        }

        .promo-info strong {
          display: block;
          font-size: 8pt;
          color: #0f172a;
        }

        .promo-info span {
          display: block;
          font-size: 6.5pt;
          color: #2563eb;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .promo-footer-bar {
          text-align: center;
          font-size: 7pt;
          font-weight: 700;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;
        }
      </style>
    </head>
    <body>
      <!-- Repeating Watermark on all pages -->
      <div class="page-watermark">
        <div class="watermark-logo-box">
          <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
        </div>
        <div class="watermark-name">OdishaExamPrep</div>
        <div class="watermark-sub">Official Study Booklet</div>
      </div>

      <div class="print-document-wrapper">
        <!-- Master Header Banner -->
        <div class="master-header">
          <div class="brand-section">
            <div class="brand-logo-badge">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
              </svg>
            </div>
            <div class="brand-titles">
              <h1>ODISHAEXAM<span>PREP</span></h1>
              <div class="brand-tagline">OFFICIAL EXAM PRACTICE &amp; QUESTION BANK PORTAL</div>
            </div>
          </div>
          <div class="header-meta">
            <div class="exam-badge">${examLabel}</div>
            <div class="doc-date">Generated: ${dateStr}</div>
          </div>
        </div>

        <!-- Title Block -->
        <div class="title-card">
          <div>
            <h2>${title}</h2>
            <p>${subLabel}</p>
          </div>
          <div class="qcount-chip">${questions.length} Questions</div>
        </div>

        <!-- Questions List -->
        <div class="questions-container">
          ${questionsHtml}
        </div>

        <!-- Optional Answer Key Summary Appendix -->
        ${answerKeyTableHtml}

        <!-- Promotional Footer Card -->
        <div class="promotional-footer-card">
          <div class="promo-header">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; background: #2563eb; border-radius: 7px; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <div>
                <h3 style="font-size: 11.5pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; line-height: 1.1; margin-bottom: 2px;">ODISHAEXAM<span style="color: #2563eb;">PREP</span></h3>
                <p style="font-size: 7pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Odisha's Premier Competitive Exam Preparation Platform</p>
              </div>
            </div>
            <div class="promo-badge">Official Study Material</div>
          </div>

          <div class="promo-links-grid">
            <a href="https://www.odishaexamprep.in" target="_blank" class="promo-link-pill">
              <span class="promo-icon">🌐</span>
              <div class="promo-info">
                <strong>Web Portal</strong>
                <span>odishaexamprep.in</span>
              </div>
            </a>

            <a href="https://t.me/odishaexamprep" target="_blank" class="promo-link-pill">
              <span class="promo-icon">📱</span>
              <div class="promo-info">
                <strong>Telegram</strong>
                <span>t.me/odishaexamprep</span>
              </div>
            </a>

            <a href="https://www.youtube.com/@OdishaExamPrep" target="_blank" class="promo-link-pill">
              <span class="promo-icon">📺</span>
              <div class="promo-info">
                <strong>YouTube</strong>
                <span>@OdishaExamPrep</span>
              </div>
            </a>
          </div>

          <div class="promo-footer-bar">
            ✨ Full Mock Tests • Subject-Wise Practice • Previous Year Questions (PYQ)
          </div>
        </div>
      </div>

      <script>
        async function triggerDocumentPrint() {
          try {
            if (document.fonts) {
              await document.fonts.ready;
            }
          } catch (e) {}
          setTimeout(function() {
            window.focus();
            window.print();
          }, 300);
        }

        if (document.readyState === 'complete') {
          triggerDocumentPrint();
        } else {
          window.addEventListener('load', triggerDocumentPrint);
        }
      </script>
    </body>
    </html>
  `;

  // Open in a new visible tab — gives a clean, full-screen print preview
  const win = window.open('', '_blank');
  if (win) {
    win.document.open();
    win.document.write(printDocumentHtml);
    win.document.close();
    return true;
  }
  return false;
}
