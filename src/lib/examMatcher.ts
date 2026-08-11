/**
 * examMatcher.ts — Shared utility for matching stored activities to an active exam context.
 *
 * Problem: Activities logged before Aug 2026 only stored metadata.examName
 * (e.g. "OSSSC Nursing Officer") but NOT metadata.examId. The active exam
 * context uses a Supabase UUID as activeExamId. Raw string comparison always
 * fails → activities disappear when switching from All Exams to a specific exam.
 *
 * Solution: Build a normalised token set from BOTH examId AND examName of
 * the active context, then test every metadata field of the stored activity
 * using keyword-group inclusion — not exact-string equality.
 */

const normalise = (s: string): string => (s || '').toLowerCase().replace(/[\s\-_]+/g, '');

const EXAM_KEYWORD_GROUPS: Array<{ keywords: string[]; aliases: string[] }> = [
  { keywords: ['nursing', 'ossscnursingofficer', 'nursingofficer', 'anm', 'gnm', 'staffnurse'], aliases: ['nursing', 'nursingofficer', 'ossscnursing'] },
  { keywords: ['ctsre', 'osscctsre', 'technicalservice'], aliases: ['ctsre', 'technical'] },
  { keywords: ['osssc', 'osssccoordinator', 'ossscward'], aliases: ['osssc'] },
  { keywords: ['ossccgl', 'cgl'], aliases: ['ossccgl', 'cgl'] },
  { keywords: ['opsc', 'ocs', 'civilservice'], aliases: ['opsc', 'civilservices'] },
  { keywords: ['police', 'constable', 'odishapolice'], aliases: ['police', 'constable'] },
  { keywords: ['bed', 'beded', 'tet'], aliases: ['bed', 'tet', 'teaching'] },
];

const sameKeywordGroup = (a: string, b: string): boolean => {
  for (const group of EXAM_KEYWORD_GROUPS) {
    const aIn = group.keywords.some(k => a.includes(k)) || group.aliases.some(k => a.includes(k));
    const bIn = group.keywords.some(k => b.includes(k)) || group.aliases.some(k => b.includes(k));
    if (aIn && bIn) return true;
  }
  return false;
};

export const activityMatchesExam = (activity: any, examId: string, examName: string): boolean => {
  if (!activity) return false;
  if (!examId || examId === 'all') return true;

  const actExamId   = normalise(activity.metadata?.examId   || '');
  const actExamName = normalise(activity.metadata?.examName  || '');
  const actCategory = normalise(activity.metadata?.testCategory || '');
  const actTitle    = normalise(activity.title || '');

  const normId   = normalise(examId);
  const normName = normalise(examName);

  // 1) Direct UUID match — reliable for activities logged after the fix
  if (actExamId && actExamId === normId) return true;

  // 2) Name-based match — reliable for activities logged before the fix
  if (actExamName && normName) {
    const firstWord = normalise(examName.split(' ')[0]);
    if (firstWord.length > 3 && actExamName.includes(firstWord) && sameKeywordGroup(normName, actExamName)) return true;
  }

  // 3) Keyword-group fallback — handles slug examIds vs name-based activity data
  const combined    = `${normId} ${normName}`;
  const actCombined = `${actExamId} ${actExamName} ${actCategory} ${actTitle}`;

  for (const group of EXAM_KEYWORD_GROUPS) {
    const contextIn  = group.keywords.some(k => combined.includes(k))    || group.aliases.some(k => combined.includes(k));
    const activityIn = group.keywords.some(k => actCombined.includes(k)) || group.aliases.some(k => actCombined.includes(k));
    if (contextIn && activityIn) return true;
  }

  // 4) Legacy generic includes — backward compat with odd slugs
  if (normId.length > 3 && actExamName && (actExamName.includes(normId) || normId.includes(actExamName))) return true;
  if (normName.length > 3 && actExamName && (actExamName.includes(normName) || normName.includes(actExamName))) return true;

  return false;
};
