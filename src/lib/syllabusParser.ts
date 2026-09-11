/**
 * Syllabus Hierarchy Parser & Dynamic Title Formatter
 * OdishaExamPrep AI Studio
 *
 * Reliably parses structured syllabi with:
 * - [Paper] (Official Paper / Tier e.g. "Paper - I", "Paper 1", "Paper - II (Technical)")
 * - [Subject] (Academic Discipline e.g. "Civil Engineering", "General Studies", "Fisheries Science")
 * - [Sub-Subject] / Unit / Section / Module (e.g. "Structural Engineering", "Modern History", "Unit 1")
 * - [Chapter] / Topic / Lesson (e.g. "Concrete Structures", "Indus Valley", "Thermodynamics")
 *
 * Guarantees:
 * 1. Discrete, isolated replacement for every placeholder (no Paper overwriting Subject or vice versa).
 * 2. Delimiter-aware removal of absent placeholders without dangling punctuation or duplicate text.
 * 3. 100% syllabus coverage with zero dropped chapters.
 */

export interface SyllabusHierarchyItem {
  paper?: string;
  subject: string;
  subSubject: string;
  chapter: string;
  placeholders?: Record<string, string>;
  rawLine?: string;
}

/**
 * Normalizes placeholder key for case-insensitive and punctuation-free lookup.
 * e.g. "[Sub-Subject]" -> "subsubject", "Sub Subject" -> "subsubject", "Unit" -> "unit"
 */
export function normalizeKey(key: string): string {
  return (key || '')
    .toLowerCase()
    .replace(/[\[\]]/g, '')
    .replace(/[\s\-_]/g, '')
    .trim();
}

export function stripMarkdownWrapper(str: string): string {
  if (!str) return '';
  return str
    .replace(/^[*_~`#]+\s*/, '')
    .replace(/\s*[*_~`]+$/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

/**
 * Recognizes non-academic structural headings that should never be emitted as test cards or subjects
 * e.g. "Subsubjects", "Examination Syllabus Structure", "Table of Contents", "Overview"
 */
export function isStructuralMetaText(str: string): boolean {
  if (!str) return false;
  const l = str.toLowerCase().replace(/[*_#\-:]/g, '').trim();
  return (
    l === 'subsubjects' ||
    l === 'sub-subjects' ||
    l === 'sub subjects' ||
    l === 'chapters' ||
    l === 'topics' ||
    l === 'units' ||
    l === 'sections' ||
    l === 'modules' ||
    l === 'syllabus structure' ||
    l === 'examination syllabus structure' ||
    l === 'exam syllabus structure' ||
    l === 'examination structure' ||
    l === 'table of contents' ||
    l === 'index' ||
    l === 'overview' ||
    l === 'course outline' ||
    l.endsWith('syllabus structure') ||
    l.endsWith('examination syllabus') ||
    l.endsWith('examination - syllabus') ||
    l.endsWith('examination — syllabus')
  );
}

/**
 * Recognizes top-level document headings or exam titles e.g. "# OPSC Assistant Agriculture Engineer Examination - Syllabus"
 */
export function isDocumentTitleOrExamHeader(str: string, examName: string = ''): boolean {
  if (!str) return false;
  const l = str.toLowerCase().replace(/[*_#\-:]/g, '').trim();
  const examNorm = (examName || '').toLowerCase().replace(/[*_#\-:]/g, '').trim();
  if (examNorm && (l === examNorm || l.includes(examNorm) || examNorm.includes(l))) return true;
  if (l.endsWith('syllabus') || l.includes('examination - syllabus') || l.includes('examination — syllabus')) return true;
  return false;
}

/**
 * Checks if a line is a bold sub-subject or module header (e.g. "*Computer Programming and Data Structures**" or "**Applied Electronics**")
 */
export function isSubSubjectHeader(trimmed: string, inSubsubjectsSection: boolean = false): boolean {
  if (!trimmed) return false;
  // Strip list bullet / number prefix e.g. "1. **Computer Programming...**" -> "**Computer Programming...**"
  const strippedPrefix = trimmed.replace(/^(?:[\*\-•]|\d+[\.\)])\s+/, '').trim();
  const isBold = (/^[*_]{1,2}[^*_]+[*_]{1,2}$/.test(strippedPrefix) || /^\*\*[^*]+\*\*$/.test(strippedPrefix) || /^\*[^*]+\*\*$/.test(strippedPrefix)) && !strippedPrefix.includes(':');
  const clean = stripMarkdownWrapper(strippedPrefix);

  if (isStructuralMetaText(clean)) return false;

  // If inside a Subsubjects section, any bold line, numbered bold line, or heading level 3/4 is a subsubject
  if (inSubsubjectsSection && (isBold || trimmed.startsWith('###') || trimmed.startsWith('####') || (/^\d+[\.\)]\s+/.test(trimmed) && isBold))) {
    return clean.length > 2 && clean.length < 80;
  }

  // Otherwise, if bold and looks like a title (short, no commas or sentence periods)
  if (isBold && clean.length > 2 && clean.length < 80 && !clean.includes(',') && !clean.includes(';')) {
    return true;
  }

  return false;
}

/**
 * Strips markdown formatting, numbering prefixes, list bullets, redundant tag labels, and bounding punctuation.
 * For Paper, official numbers (e.g. "Paper - I", "Paper 1") are preserved.
 */
export function cleanTitleText(str: string, isPaper: boolean = false): string {
  if (!str) return '';
  let cleaned = str
    .replace(/^#+\s*/, '')
    .replace(/^[\*\-•]\s*/, '')
    .replace(/^\d+[\.\)\-]\s*/, '')
    .replace(/^[*_~`]+|[*_~`]+$/g, '');

  if (!isPaper) {
    // Strip redundant leading label words e.g. "Chapter 1:", "Unit II -", "Topic 3:" ONLY when followed by colon/delimiter
    cleaned = cleaned.replace(/^(?:Chapter|Topic|Lesson|Unit|Section|Module|Part)\s*(?:[\dIVX]+|\s*[-–—]\s*[\dIVX]+)?[:\s\-–—]+/i, '');
  }

  return cleaned
    .replace(/^\[(?:[A-Za-z0-9_\- ]+)\][:\s]*/i, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^[:\-–—|/•\s]+|[:\-–—|/•\s]+$/g, '')
    .replace(/^[*_~`]+|[*_~`]+$/g, '')
    .trim();
}

/**
 * Splits a line or segment into { tag, val } for explicit Tag: Value or [Tag]: Value syntax.
 * Automatically handles markdown formatting like **Subject: General Engineering** or **Subject**: General Engineering.
 */
export function splitTagAndValue(str: string): { tag: string; val: string } | null {
  const unbolded = stripMarkdownWrapper(str);

  // 1. Bracket tag: [Tag Name]: Value or [Tag Name] - Value
  const bracketMatch = unbolded.match(/^(?:#+\s*)?\[([^\]]+)\]\s*[:\-–—]?\s*(.+)$/);
  if (bracketMatch) {
    return { tag: bracketMatch[1].trim(), val: bracketMatch[2].trim() };
  }
  // 2. Colon tag: Tag Name: Value
  const colonMatch = unbolded.match(/^(?:#+\s*)?([A-Za-z0-9_\- ]+?)\s*:\s*(.+)$/);
  if (colonMatch) {
    return { tag: colonMatch[1].trim(), val: colonMatch[2].trim() };
  }
  return null;
}

/**
 * Checks if a normalized tag is a leaf entity that emits a test item.
 */
export function isLeafTag(normTag: string): boolean {
  return ['chapter', 'topic', 'lesson'].includes(normTag);
}

/**
 * Extracts structured hierarchy items and dynamic placeholders from syllabus markdown.
 * Supports:
 * 1. Discrete explicit tags: Paper:, Subject:, Sub-Subject:, Unit:, Section:, Chapter:, etc.
 * 2. Bracketed placeholder tags: [Paper]:, [Subject]:, [Sub-Subject]:, [Unit]:, [Chapter]:, etc.
 * 3. Multi-tag lines: "Paper: Paper 1 | Subject: General Studies | Chapter: Freedom Movement"
 * 4. Compound headers: "Paper 1: General Studies"
 * 5. Markdown headings (# Paper/Subject, ## Sub-Subject/Unit, ### Chapter/Topic, bullets)
 */
export function parseSyllabusHierarchy(markdown: string, examName?: string): SyllabusHierarchyItem[] {
  if (!markdown || !markdown.trim()) return [];

  const lines = markdown.split(/\r?\n/);
  const items: SyllabusHierarchyItem[] = [];
  const seenSignatures = new Set<string>();

  let currentPaper = '';
  let currentBroadSubject = '';
  let currentSubject = '';
  let currentSubSubject = '';
  let currentScope: Record<string, string> = {};
  let inSubsubjectsSection = false;

  const isNoise = (str: string): boolean => {
    const l = str.toLowerCase();
    return (
      l.startsWith('note:') ||
      l.startsWith('instructions:') ||
      l.startsWith('marking scheme:') ||
      l.startsWith('duration:') ||
      l.startsWith('total marks:') ||
      l.startsWith('http://') ||
      l.startsWith('https://')
    );
  };

  const emitItem = (chapterVal: string, rawLine: string) => {
    const cleanChap = cleanTitleText(chapterVal);
    if (!cleanChap || cleanChap.length < 2 || isStructuralMetaText(cleanChap) || isDocumentTitleOrExamHeader(cleanChap, examName)) {
      return;
    }

    const pap = currentPaper || currentScope['paper'] || '';
    const subj = currentSubject || currentScope['subject'] || currentBroadSubject || currentScope['discipline'] || '';
    const subSubj = currentSubSubject || currentScope['subsubject'] || currentScope['unit'] || currentScope['section'] || '';

    const sig = `${pap}::${subj}::${subSubj}::${cleanChap}`.toLowerCase();
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      items.push({
        paper: pap,
        subject: subj,
        subSubject: subSubj,
        chapter: cleanChap,
        placeholders: {
          ...currentScope,
          ...(pap ? { paper: pap } : {}),
          ...(subj ? { subject: subj } : {}),
          ...(subSubj ? { subsubject: subSubj } : {}),
          ...(currentBroadSubject ? { broadSubject: currentBroadSubject, paperSubject: currentBroadSubject } : {}),
          chapter: cleanChap,
          topic: cleanChap,
          lesson: cleanChap
        },
        rawLine
      });
    }
  };

  const processSegment = (seg: string, rawLine: string) => {
    const trimmed = seg.trim();
    if (!trimmed || isNoise(trimmed)) return;

    // Check if entering a Subsubjects / Units section
    const cleanNorm = stripMarkdownWrapper(trimmed).toLowerCase().replace(/[*_#\-:]/g, '').trim();
    if (cleanNorm === 'subsubjects' || cleanNorm === 'sub-subjects' || cleanNorm === 'sub subjects' || cleanNorm === 'units') {
      inSubsubjectsSection = true;
      return;
    }

    // Ignore structural meta headers (e.g. "## Examination Syllabus Structure")
    if (isStructuralMetaText(trimmed)) return;

    // Ignore top-level document title (e.g. "# OPSC Assistant Agriculture Engineer Examination - Syllabus")
    if (isDocumentTitleOrExamHeader(trimmed, examName) && trimmed.startsWith('#')) return;

    // Check if line represents a Paper header regardless of heading level e.g. "### Paper 1", "**Paper 1**", "Paper - I"
    const barePaperMatch = stripMarkdownWrapper(trimmed).match(/^Paper(?:\s*-\s*[IVX\d]+|\s+[IVX\d]+)$/i);
    if (barePaperMatch) {
      currentPaper = cleanTitleText(barePaperMatch[0], true);
      currentScope = { paper: currentPaper };
      currentBroadSubject = '';
      currentSubject = '';
      currentSubSubject = '';
      inSubsubjectsSection = false;
      return;
    }

    // ── A. Check for explicit Tag: Value or [Tag]: Value
    const tagMatch = splitTagAndValue(trimmed);
    if (tagMatch) {
      const { tag, val } = tagMatch;
      const normTag = normalizeKey(tag);

      // Special check: "Paper 1: General Studies" -> tag is Paper 1, val is General Studies
      const isCompoundPaper = /^paper(?:\s*-\s*[IVX\d]+|\s+[IVX\d]+)$/i.test(tag);
      if (isCompoundPaper && val && !val.toLowerCase().startsWith('chapter') && !val.toLowerCase().startsWith('topic')) {
        currentPaper = cleanTitleText(tag, true);
        currentScope = { paper: currentPaper };
        const cleanSubj = val.replace(/^(?:Subject|Discipline)[:\s\-–—]+/i, '').trim();
        if (cleanSubj) {
          currentBroadSubject = cleanTitleText(cleanSubj);
          currentSubject = currentBroadSubject;
          currentScope['subject'] = currentSubject;
          currentScope['broadSubject'] = currentBroadSubject;
          currentSubSubject = '';
        }
        inSubsubjectsSection = false;
        return;
      }

      // Check if tag is leaf (chapter/topic/lesson)
      if (isLeafTag(normTag)) {
        const cleanVal = cleanTitleText(val);
        if (cleanVal.length > 1) {
          emitItem(cleanVal, rawLine);
        }
        return;
      }

      // Scope-level tags
      const cleanVal = cleanTitleText(val, normTag === 'paper');
      if (normTag === 'paper') {
        currentPaper = cleanVal;
        currentBroadSubject = '';
        currentSubject = '';
        currentSubSubject = '';
        currentScope = { paper: cleanVal };
        inSubsubjectsSection = false;
      } else if (normTag === 'subject' || normTag === 'discipline') {
        currentBroadSubject = cleanVal;
        currentSubject = cleanVal;
        currentSubSubject = '';
        currentScope = currentPaper ? { paper: currentPaper, subject: cleanVal } : { subject: cleanVal };
        inSubsubjectsSection = false;
      } else if (normTag === 'subsubject' || normTag === 'unit' || normTag === 'section' || normTag === 'module') {
        currentSubSubject = cleanVal;
        currentScope[normTag] = cleanVal;
        currentScope['subsubject'] = cleanVal;
        if (!currentSubject) {
          currentSubject = cleanVal;
          currentScope['subject'] = cleanVal;
        }
      } else {
        currentScope[normTag] = cleanVal;
      }
      return;
    }

    // Bare "Paper - I" or "Paper 1"
    if (/^(?:#\s+)?Paper(?:\s*-\s*[IVX\d]+|\s+[IVX\d]+)$/i.test(trimmed)) {
      currentPaper = cleanTitleText(trimmed, true);
      currentBroadSubject = '';
      currentSubject = '';
      currentSubSubject = '';
      currentScope = { paper: currentPaper };
      inSubsubjectsSection = false;
      return;
    }

    // ── B. Sub-Subject or Module Header Detection (e.g. *Computer Programming and Data Structures**)
    if (isSubSubjectHeader(trimmed, inSubsubjectsSection)) {
      const detectedSub = cleanTitleText(trimmed);
      if (detectedSub.length > 2) {
        currentSubSubject = detectedSub;
        currentScope['subsubject'] = detectedSub;
        if (!currentSubject) {
          currentSubject = detectedSub;
          currentScope['subject'] = detectedSub;
        }
        return;
      }
    }

    // ── C. Markdown Headings fallback
    if (trimmed.startsWith('# ')) {
      const heading = cleanTitleText(trimmed.replace(/^#\s+/, ''));
      if (heading.length > 1 && !isDocumentTitleOrExamHeader(heading, examName) && !isStructuralMetaText(heading)) {
        if (/^paper(?:\s*-\s*[IVX\d]+|\s+[IVX\d]+)/i.test(heading)) {
          currentPaper = heading;
          currentBroadSubject = '';
          currentSubject = '';
          currentSubSubject = '';
          currentScope = { paper: heading };
        } else {
          currentBroadSubject = heading;
          currentSubject = heading;
          currentSubSubject = '';
          currentScope = currentPaper ? { paper: currentPaper, subject: heading } : { subject: heading };
        }
        inSubsubjectsSection = false;
      }
      return;
    }

    if (trimmed.startsWith('## ')) {
      const heading = cleanTitleText(trimmed.replace(/^##\s+/, ''));
      if (heading.length > 1 && !isStructuralMetaText(heading)) {
        if (/^paper(?:\s*-\s*[IVX\d]+|\s+[IVX\d]+)/i.test(heading)) {
          currentPaper = heading;
          currentBroadSubject = '';
          currentSubject = '';
          currentSubSubject = '';
          currentScope = { paper: heading };
          inSubsubjectsSection = false;
        } else {
          currentSubSubject = heading;
          currentScope['subsubject'] = heading;
          if (!currentSubject) {
            currentSubject = heading;
            currentScope['subject'] = heading;
          }
        }
      }
      return;
    }

    if (trimmed.startsWith('### ') || trimmed.startsWith('#### ') || /^(?:[\*\-•]|\d+[\.\)])\s+/.test(trimmed)) {
      const text = cleanTitleText(trimmed.replace(/^(?:###+\s+|[\*\-•]\s+|\d+[\.\)]\s+)/, ''));
      if (text.length > 1 && text.length < 120 && !isNoise(text) && !isStructuralMetaText(text) && !isDocumentTitleOrExamHeader(text, examName)) {
        emitItem(text, rawLine);
      }
      return;
    }

    // Plain line as chapter fallback if within an active scope
    if (trimmed.length > 2 && trimmed.length < 120 && (currentSubject || currentSubSubject || currentBroadSubject || currentPaper)) {
      const text = cleanTitleText(trimmed);
      if (text.length > 1 && !isNoise(text) && !isStructuralMetaText(text) && !isDocumentTitleOrExamHeader(text, examName)) {
        emitItem(text, rawLine);
      }
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || isNoise(trimmed)) continue;

    // Support multi-tag lines separated by pipe | or semicolon ;
    const segments = trimmed.split(/\s*[|;]\s*/);
    if (segments.length > 1) {
      for (const seg of segments) {
        processSegment(seg, trimmed);
      }
    } else {
      processSegment(trimmed, trimmed);
    }
  }

  return items;
}

/**
 * Determines the granularity tier requested by a naming formula pattern.
 * If the formula explicitly references leaf chapters/topics, returns 'chapter'.
 * If the formula references sub-subjects, units, sections, or modules, returns 'subsubject'.
 * If the formula references subjects or disciplines, returns 'subject'.
 * If the formula references papers or tiers, returns 'paper'.
 * Defaults to 'chapter' for granular test/bank creation.
 */
export function determinePlaceholderTier(formula: string): 'paper' | 'subject' | 'subsubject' | 'chapter' {
  const norm = (formula || '').toLowerCase();
  if (/\[(?:chapter|topic|lesson)\]/i.test(norm)) {
    return 'chapter';
  }
  if (/\[(?:sub[\s\-_]?subject|unit|section|module)\]/i.test(norm)) {
    return 'subsubject';
  }
  if (/\[(?:subject|discipline)\]/i.test(norm)) {
    return 'subject';
  }
  if (/\[(?:paper|tier)\]/i.test(norm)) {
    return 'paper';
  }
  return 'chapter';
}

/**
 * Applies a naming pattern template to a hierarchy item with STRICT PLACEHOLDER ISOLATION:
 * - Scans any bracketed token [Placeholder] in the formula.
 * - Strictly substitutes ONLY that authentic value defined for that placeholder.
 * - ZERO cross-tier fallback borrowing (e.g. [Subject] never borrows Sub-Subject; [Sub-Subject] never borrows Subject).
 * - Delimiter-aware removal of absent placeholders without dangling punctuation or duplicate text.
 * - Replaces sequential numbering tokens #[01-10], #01.
 * - Deduplicates adjacent identical tokens.
 */
export function applyNamingPattern(
  pattern: string,
  item: SyllabusHierarchyItem,
  index: number,
  examName?: string
): string {
  let title = (pattern || '').trim();
  if (!title) {
    title = item.chapter ? `${item.chapter} Drill #[01-10]` : `Practice Test #[01-10]`;
  }

  const exam = (examName || '').trim();

  // 1. Replace [Exam] / [Exam Name]
  if (/\[Exam(?: Name)?\]/i.test(title)) {
    title = title.replace(/\[Exam(?: Name)?\]/gi, () => exam || 'Exam');
  }

  // 2. Replace Sequential Numbering Tokens FIRST (e.g. #[01-10], #[01-99], #01)
  // so bracketed number ranges like [01-10] are converted before generic placeholder scanning
  const padNum = String(index + 1).padStart(2, '0');
  if (/#\[01-\d+\]/i.test(title)) {
    title = title.replace(/#\[01-\d+\]/i, () => `#${padNum}`);
  } else if (/#\d+/i.test(title)) {
    title = title.replace(/#\d+/i, () => `#${padNum}`);
  }

  // 3. Scan all [Placeholder] tokens in formula pattern
  const placeholderMatches = Array.from(title.matchAll(/\[([A-Za-z0-9_\- ]+)\]/g));

  for (const match of placeholderMatches) {
    const rawTag = match[1];
    const fullTag = match[0];
    const normKey = normalizeKey(rawTag);

    // Skip sequential numbering tokens if any remains
    if (normKey.startsWith('#') || /^\d+-\d+$/.test(normKey)) continue;

    // STRICT LOOKUP:
    // Only return the authentic value for this placeholder from item.placeholders or canonical fields.
    // ZERO cross-tier fallback: [Subject] returns strictly Subject, [Sub-Subject] returns strictly Sub-Subject.
    let val: string | undefined;
    if (item.placeholders && item.placeholders[normKey]) {
      val = item.placeholders[normKey];
    } else if (normKey === 'paper') {
      val = item.paper;
    } else if (normKey === 'subject' || normKey === 'discipline') {
      val = item.subject;
    } else if (normKey === 'subsubject') {
      val = item.subSubject;
    } else if (normKey === 'broadsubject' || normKey === 'papersubject') {
      val = item.placeholders?.['broadsubject'] || item.placeholders?.['papersubject'] || item.paper;
    } else if (normKey === 'chapter' || normKey === 'topic' || normKey === 'lesson') {
      val = item.chapter;
    }

    const cleanVal = cleanTitleText(val || '', normKey === 'paper');

    if (cleanVal && cleanVal.toLowerCase() !== exam.toLowerCase()) {
      // Replace with strictly that placeholder's value! Use callback to prevent $ capture token corruption
      title = title.replace(fullTag, () => cleanVal);
    } else {
      // Delimiter-aware removal of absent placeholder
      const escaped = fullTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      title = title
        .replace(new RegExp(`[:\\-–—|/•]\\s*${escaped}\\s*[:\\-–—|/•]`, 'gi'), ' - ')
        .replace(new RegExp(`${escaped}\\s*[:\\-–—|/•]\\s*`, 'gi'), '')
        .replace(new RegExp(`\\s*[:\\-–—|/•]\\s*${escaped}`, 'gi'), '')
        .replace(new RegExp(escaped, 'gi'), '');
    }
  }

  // 4. Punctuation & Whitespace Normalization
  title = title
    .replace(/\s*:\s*[-–—]\s*/g, ' - ')
    .replace(/\s*[-–—]\s*:\s*/g, ': ')
    .replace(/\s*[-–—]\s*[-–—]\s*/g, ' - ')
    .replace(/\s*[:\-–—|/•]\s*[:\-–—|/•]\s*/g, ' - ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[:\-–—|/•\s]+|[:\-–—|/•\s]+$/g, '')
    .trim();

  // 5. Prevent duplicate adjacent words e.g. "GS - GS" -> "GS"
  const parts = title.split(/\s*[-–—|:]\s*/);
  if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
    title = parts[0];
  }

  // Guard against complete vacancy
  if (!title) {
    const fallbackName = item.chapter || item.subject || 'Curriculum Module';
    title = `${fallbackName} Practice Set #${padNum}`;
  }

  return title;
}
