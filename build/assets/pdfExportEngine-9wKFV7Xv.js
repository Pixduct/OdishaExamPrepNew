import{k as A}from"./vendor-katex-BkGmXwAI.js";import{Q as I}from"./vendor-core-DwVPQc1P.js";function b(o){if(!o)return"";let t=o.replace(/\$\$([\s\S]*?)\$\$/g,(i,r)=>{try{return A.renderToString(r.trim(),{displayMode:!0,throwOnError:!1})}catch{return`$$${r}$$`}});return t=t.replace(/\$([^\$\n]+?)\$/g,(i,r)=>{try{return A.renderToString(r.trim(),{displayMode:!1,throwOnError:!1})}catch{return`$${r}$`}}),I.sanitize(t,{ADD_TAGS:["span","div","p","br","strong","em","sub","sup","table","tr","td","th","tbody","thead","svg","path","g","rect","line"],ADD_ATTR:["class","style","aria-hidden","viewBox","d","fill","stroke","stroke-width","stroke-linecap","stroke-linejoin","width","height","rx","transform","x1","y1","x2","y2"]})}function $(o){if(o==null||o==="")return"-";if(typeof o=="number")return["A","B","C","D","E"][o]||`(${o+1})`;const t=String(o).trim().toUpperCase();if(["A","B","C","D","E"].includes(t))return t;const i=parseInt(t,10);return!isNaN(i)&&i>=0&&i<=4&&["A","B","C","D","E"][i]||t}async function F(o){var k;const{title:t,subtitle:i,subject:r,examName:u,questions:s}=o,w=u?u.toUpperCase():"ODISHA STATE EXAMS",z=i||r||"Official Practice Question Bank & Solution Booklet",E=new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}),l=`${(t||"Question Bank").trim().replace(/[/\\?%*:|"<>]/g," ").replace(/\s+/g," ")} - OdishaExamPrep`,P=document.title;document.title=l,setTimeout(()=>{try{document.title=P}catch{}},12e3);const S=s.some(e=>e.correctAnswerIndex!==void 0||e.answer!==void 0),T=s.map((e,a)=>{const g=a+1,x=e.questionText||e.question||"",d=b(x),c=e.correctAnswerIndex!==void 0?e.correctAnswerIndex:typeof e.answer=="number"?e.answer:void 0,f=$(e.correctAnswerIndex!==void 0?e.correctAnswerIndex:e.answer),m=(e.options||[]).map((M,h)=>{const O=["A","B","C","D","E"][h]||`(${h+1})`,C=b(M);return`
        <div class="option-item ${c!==void 0&&c===h?"option-correct":""}">
          <span class="option-letter">${O}</span>
          <span class="option-text">${C}</span>
        </div>
      `}).join(""),j=e.explanation?`
      <div class="explanation-box">
        <div class="explanation-title">💡 Explanation / Solution:</div>
        <div class="explanation-content">${b(e.explanation)}</div>
      </div>
    `:"";return`
      <div class="question-card" id="q-${g}">
        <div class="question-header">
          <span class="question-badge">Q.${g}</span>
          <div class="question-text">${d}</div>
        </div>
        <div class="options-grid">
          ${m}
        </div>
        ${f!=="-"?`
          <div class="answer-tag">
            <strong>Correct Answer:</strong> Option (${f})
          </div>
        `:""}
        ${j}
      </div>
    `}).join("");let v="";if(S){const e=[];for(let a=0;a<s.length;a+=5){const x=s.slice(a,a+5).map((d,c)=>{const f=a+c+1,m=$(d.correctAnswerIndex!==void 0?d.correctAnswerIndex:d.answer);return`
          <div class="key-cell">
            <span class="key-qno">Q.${f}</span>
            <span class="key-ans">${m}</span>
          </div>
        `}).join("");e.push(`<div class="key-row">${x}</div>`)}v=`
      <div class="page-break"></div>
      <div class="answer-key-section">
        <div class="section-divider-title">
          <span>OFFICIAL ANSWER KEY SUMMARY</span>
        </div>
        <div class="key-grid">
          ${e.join("")}
        </div>
      </div>
    `}const y=`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${l}</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css" crossorigin="anonymous">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 14mm 14mm 14mm 14mm;
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
          font-size: 9.5pt;
          line-height: 1.5;
        }

        .print-document-wrapper {
          width: 100%;
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
          opacity: 0.038;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 550px;
          user-select: none;
        }

        .watermark-logo-box {
          width: 96px;
          height: 96px;
          background: #1e3a8a;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
        }

        .watermark-name {
          font-size: 32pt;
          font-weight: 900;
          color: #1e3a8a;
          letter-spacing: 3px;
          text-transform: uppercase;
        }

        .watermark-sub {
          font-size: 13pt;
          font-weight: 800;
          color: #2563eb;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 2px;
        }

        /* ── Master Print Layout Structure ── */
        table.print-layout-table {
          width: 100%;
          border-collapse: collapse;
          border: none;
        }

        table.print-layout-table > thead {
          display: table-header-group;
        }

        table.print-layout-table > tfoot {
          display: table-footer-group;
        }

        table.print-layout-table > tbody {
          display: table-row-group;
        }

        /* ── Running Page Header (Repeats at top of EVERY page) ── */
        .running-header-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          margin-bottom: 12px;
          border-bottom: 1.5px solid #cbd5e1;
          font-size: 8pt;
          color: #64748b;
          font-weight: 700;
        }

        .running-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .running-logo-badge {
          width: 18px;
          height: 18px;
          background: #2563eb;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .running-logo {
          font-size: 8.5pt;
          font-weight: 900;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          line-height: 1;
          display: inline-flex;
          align-items: center;
        }

        .running-logo span {
          color: #2563eb;
        }

        .running-badge {
          background: #eff6ff;
          color: #1d4ed8;
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 7.5pt;
          font-weight: 800;
          text-transform: uppercase;
          border: 1px solid #bfdbfe;
          display: inline-flex;
          align-items: center;
          line-height: 1;
        }

        .running-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          text-align: right;
        }

        .running-topic {
          color: #334155;
          max-width: 250px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .running-portal-url {
          color: #2563eb;
          text-decoration: none;
        }

        /* ── Running Page Footer (Repeats at bottom of EVERY page) ── */
        .running-footer-box {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          margin-top: 14px;
          border-top: 1.5px solid #e2e8f0;
          font-size: 7.5pt;
          color: #64748b;
          font-weight: 600;
        }

        .running-footer-box a {
          color: #2563eb;
          text-decoration: none;
          font-weight: 800;
        }

        /* ── Page 1 Executive Hero Header Banner ── */
        .hero-banner {
          border-bottom: 2.5px solid #2563eb;
          padding-bottom: 12px;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hero-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-logo-badge {
          width: 40px;
          height: 40px;
          background: #2563eb;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 3px 8px rgba(37, 99, 235, 0.25);
        }

        .brand-titles {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .brand-titles h1 {
          font-size: 16pt;
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
          letter-spacing: 0.8px;
          line-height: 1;
        }

        .hero-meta {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .exam-badge {
          display: inline-block;
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 8pt;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 3px;
        }

        .hero-date {
          font-size: 7.5pt;
          color: #64748b;
          font-weight: 600;
        }

        /* ── Title Card ── */
        .title-card {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-left: 4.5px solid #2563eb;
          padding: 12px 16px;
          border-radius: 10px;
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
          margin-top: 3px;
        }

        .qcount-chip {
          background: #2563eb;
          color: #ffffff;
          font-size: 8.5pt;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 20px;
          white-space: nowrap;
          box-shadow: 0 1px 3px rgba(37, 99, 235, 0.25);
        }

        /* ── Question Cards (Polished & Spacious) ── */
        .questions-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .question-card {
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          border-radius: 10px;
          padding: 13px 15px;
          page-break-inside: avoid;
          break-inside: avoid;
          position: relative;
          margin-bottom: 2px;
        }

        .question-header {
          display: flex;
          gap: 9px;
          align-items: flex-start;
          margin-bottom: 9px;
        }

        .question-badge {
          background: #f1f5f9;
          color: #1e293b;
          font-size: 8.5pt;
          font-weight: 900;
          padding: 2px 7px;
          border-radius: 5px;
          border: 1px solid #cbd5e1;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .question-text {
          font-size: 9.5pt;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.48;
          flex-grow: 1;
        }

        .options-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 7px 14px;
          margin-left: 32px;
          margin-top: 4px;
          margin-bottom: 6px;
        }

        @media screen and (max-width: 600px) {
          .options-grid {
            grid-template-columns: 1fr;
          }
        }

        .option-item {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          font-size: 8.5pt;
          color: #334155;
          line-height: 1.38;
          padding: 3px 6px;
          border-radius: 6px;
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
          min-width: 16px;
        }

        .option-item.option-correct .option-letter {
          color: #059669;
        }

        .option-text {
          font-weight: 500;
        }

        .answer-tag {
          margin-left: 32px;
          margin-top: 7px;
          font-size: 8pt;
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          padding: 2.5px 9px;
          border-radius: 5px;
          display: inline-block;
        }

        .explanation-box {
          margin-left: 32px;
          margin-top: 9px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-left: 3.5px solid #059669;
          padding: 7px 12px;
          border-radius: 6px;
          font-size: 8.5pt;
          color: #334155;
          line-height: 1.45;
        }

        .explanation-title {
          font-weight: 900;
          color: #047857;
          margin-bottom: 3px;
          font-size: 7.5pt;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* ── Answer Key Summary Grid ── */
        .page-break {
          page-break-before: always;
          break-before: page;
        }

        .answer-key-section {
          margin-top: 22px;
          padding-top: 10px;
        }

        .section-divider-title {
          text-align: center;
          border-bottom: 2.5px solid #0f172a;
          line-height: 0.1em;
          margin: 22px 0 18px;
        }

        .section-divider-title span {
          background: #ffffff;
          padding: 0 16px;
          font-size: 11pt;
          font-weight: 900;
          color: #0f172a;
          letter-spacing: 1.2px;
        }

        .key-grid {
          display: flex;
          flex-direction: column;
          gap: 7px;
          max-width: 620px;
          margin: 0 auto;
        }

        .key-row {
          display: flex;
          gap: 8px;
          justify-content: space-between;
        }

        .key-cell {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 8.5pt;
        }

        .key-qno {
          font-weight: 800;
          color: #475569;
        }

        .key-ans {
          font-weight: 900;
          color: #1d4ed8;
          background: #dbeafe;
          padding: 1.5px 7px;
          border-radius: 4px;
        }

        /* ── Promotional Interactive Footer Card ── */
        .promotional-footer-card {
          margin-top: 28px;
          padding: 16px 18px;
          background: #f8fafc;
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          page-break-inside: avoid;
          break-inside: avoid;
        }

        .promo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .promo-badge {
          background: #eff6ff;
          color: #1d4ed8;
          border: 1px solid #bfdbfe;
          font-size: 7.5pt;
          font-weight: 800;
          padding: 3px 9px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .promo-links-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }

        .promo-link-pill {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 9px 12px;
          background: #ffffff;
          border: 1.5px solid #cbd5e1;
          border-radius: 9px;
          text-decoration: none;
          color: #0f172a;
          position: relative;
          z-index: 20;
          pointer-events: auto;
          transition: all 0.2s;
        }

        .promo-icon {
          font-size: 16pt;
        }

        .promo-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .promo-info strong {
          font-size: 8pt;
          color: #0f172a;
          font-weight: 800;
          line-height: 1.2;
        }

        .promo-info span {
          font-size: 7pt;
          color: #2563eb;
          font-weight: 700;
          text-decoration: underline;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .promo-footer-bar {
          text-align: center;
          font-size: 7.5pt;
          font-weight: 700;
          color: #475569;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="print-document-wrapper">
        <!-- Repeating Background Watermark (Every Page) -->
        <div class="page-watermark">
          <div class="watermark-logo-box">
            <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
            </svg>
          </div>
          <div class="watermark-name">ODISHAEXAMPREP</div>
          <div class="watermark-sub">WWW.ODISHAEXAMPREP.IN</div>
        </div>

        <!-- Master Layout Table (Enables Native Repeating Headers & Footers on Every Printed Page) -->
        <table class="print-layout-table">
          <thead>
            <tr>
              <td>
                <div class="running-header-box">
                  <div class="running-header-left">
                    <div class="running-logo-badge">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                      </svg>
                    </div>
                    <span class="running-logo">ODISHAEXAM<span>PREP</span></span>
                    <span class="running-badge">${w}</span>
                  </div>
                  <div class="running-header-right">
                    <span class="running-topic">${t}</span>
                    <span>•</span>
                    <a href="https://www.odishaexamprep.in" target="_blank" class="running-portal-url">www.odishaexamprep.in</a>
                  </div>
                </div>
              </td>
            </tr>
          </thead>

          <tfoot>
            <tr>
              <td>
                <div class="running-footer-box">
                  <span>Official Study Material — <a href="https://www.odishaexamprep.in" target="_blank">OdishaExamPrep.in</a></span>
                  <span>Dedicated to Odisha Competitive Exam Aspirants</span>
                  <span>Visit: <a href="https://www.odishaexamprep.in" target="_blank">www.odishaexamprep.in</a></span>
                </div>
              </td>
            </tr>
          </tfoot>

          <tbody>
            <tr>
              <td>
                <!-- Page 1 Hero Header Banner -->
                <div class="hero-banner">
                  <div class="hero-brand">
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
                  <div class="hero-meta">
                    <div class="exam-badge">${w}</div>
                    <div class="hero-date">Generated: ${E}</div>
                  </div>
                </div>

                <!-- Title Block -->
                <div class="title-card">
                  <div>
                    <h2>${t}</h2>
                    <p>${z}</p>
                  </div>
                  <div class="qcount-chip">${s.length} Questions</div>
                </div>

                <!-- Questions List -->
                <div class="questions-container">
                  ${T}
                </div>

                <!-- Optional Answer Key Summary Appendix -->
                ${v}

                <!-- Promotional Interactive Footer Card -->
                <div class="promotional-footer-card">
                  <div class="promo-header">
                    <div class="promo-brand" style="display: flex; align-items: center; gap: 10px;">
                      <div style="width: 32px; height: 32px; background: #2563eb; border-radius: 7px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 style="font-size: 12pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; line-height: 1.1; margin-bottom: 2px;">ODISHAEXAM<span style="color: #2563eb;">PREP</span></h3>
                        <p style="font-size: 7.5pt; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Odisha's Premier Competitive Exam Preparation Platform</p>
                      </div>
                    </div>
                    <div class="promo-badge">Official Study Material</div>
                  </div>

                  <div class="promo-links-grid">
                    <a href="https://www.odishaexamprep.in" target="_blank" rel="noopener noreferrer" class="promo-link-pill">
                      <span class="promo-icon">🌐</span>
                      <div class="promo-info">
                        <strong>Official Web Portal</strong>
                        <span>https://www.odishaexamprep.in</span>
                      </div>
                    </a>

                    <a href="https://t.me/odishaexamprep" target="_blank" rel="noopener noreferrer" class="promo-link-pill">
                      <span class="promo-icon">📱</span>
                      <div class="promo-info">
                        <strong>Telegram Channel</strong>
                        <span>https://t.me/odishaexamprep</span>
                      </div>
                    </a>

                    <a href="https://www.youtube.com/@OdishaExamPrep" target="_blank" rel="noopener noreferrer" class="promo-link-pill">
                      <span class="promo-icon">📺</span>
                      <div class="promo-info">
                        <strong>YouTube Classes</strong>
                        <span>https://youtube.com/@OdishaExamPrep</span>
                      </div>
                    </a>
                  </div>

                  <div class="promo-footer-bar">
                    ✨ Full Mock Tests • Subject-Wise Practice • Previous Year Questions (PYQ) • Daily Odisha Current Affairs
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <script>
        // Instant trigger as soon as resources and KaTeX styles are ready
        if (document.readyState === 'complete') {
          window.focus();
          window.print();
        } else {
          window.addEventListener('load', function() {
            window.focus();
            window.print();
          });
        }
      <\/script>
    </body>
    </html>
  `,n=document.createElement("iframe");n.style.position="fixed",n.style.right="0",n.style.bottom="0",n.style.width="0",n.style.height="0",n.style.border="0",document.body.appendChild(n);const p=(k=n.contentWindow)==null?void 0:k.document;if(p)return p.title=l,p.open(),p.write(y),p.close(),setTimeout(()=>{try{document.body.removeChild(n)}catch{}},6e4),!0;{const e=window.open("","_blank");return e?(e.document.title=l,e.document.write(y),e.document.close(),!0):!1}}export{F as exportQuestionBankToPdf};
