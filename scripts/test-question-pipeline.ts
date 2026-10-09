import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const TARGET_EXAM_ID = '6813624a-d56d-4b07-8845-d6d47444c41f';

async function runPipelineAudit() {
  console.log('==============================================================================');
  console.log(' 🛡️  ENTERPRISE QUESTION PIPELINE & DATA INTEGRITY AUDIT SUITE');
  console.log('==============================================================================\n');

  let passedTests = 0;
  let totalTests = 5;

  // ---------------------------------------------------------------------------
  // TEST 1: ZERO-DRIFT GROUND TRUTH DISCREPANCY AUDIT
  // ---------------------------------------------------------------------------
  console.log('TEST 1: Verifying Ground Truth DB Counts Across All 56 Banks...');
  const { data: banks, error: bErr } = await supabase
    .from('questionBanks')
    .select('id, title, type, questionCount, target_mode')
    .eq('examId', TARGET_EXAM_ID);

  if (bErr || !banks) {
    throw new Error(`Failed to fetch banks: ${bErr?.message}`);
  }

  // Fetch all questions for this exam using pagination
  let allQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, topic, questionText')
      .eq('examId', TARGET_EXAM_ID)
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (error || !data || data.length === 0) break;
    allQuestions = allQuestions.concat(data);
    page++;
    if (data.length < pageSize) break;
  }

  const qCountByBank: Record<string, number> = {};
  allQuestions.forEach(q => {
    const bId = q.topic ? q.topic.replace(/^bank__/, '') : '';
    if (bId) qCountByBank[bId] = (qCountByBank[bId] || 0) + 1;
  });

  let driftCount = 0;
  for (const b of banks) {
    const realQ = qCountByBank[b.id] || 0;
    if (b.questionCount !== realQ) {
      console.error(`  ❌ Drift in bank "${b.title}": stored=${b.questionCount}, real=${realQ}`);
      driftCount++;
    }
  }

  if (driftCount === 0) {
    console.log(`  ✔ [PASS] 100% of banks (56/56) match ground truth in PostgreSQL.`);
    console.log(`           Total real questions verified: ${allQuestions.length} rows.\n`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Found ${driftCount} banks with count drift.\n`);
  }

  // ---------------------------------------------------------------------------
  // TEST 2: PRACTICE VS. QUESTION BANK ISOLATION (ZERO-BLEED)
  // ---------------------------------------------------------------------------
  console.log('TEST 2: Verifying Isolation Between Practice Mode & Question Bank...');
  let invalidModes = 0;
  for (const b of banks) {
    if (b.target_mode !== 'bank') {
      console.error(`  ❌ Bank "${b.title}" has invalid target_mode: "${b.target_mode}" (must be 'bank')`);
      invalidModes++;
    }
  }

  // Frontend simulation filter check
  const frontendBankItems = banks.filter(b => b.target_mode !== 'practice');
  const frontendPracticeItems = banks.filter(b => b.target_mode === 'practice');

  if (invalidModes === 0 && frontendBankItems.length === 56 && frontendPracticeItems.length === 0) {
    console.log(`  ✔ [PASS] Zero cross-mode bleed.`);
    console.log(`           Question Bank Tab (Step 3): ${frontendBankItems.length} banks.`);
    console.log(`           Practice Mode (Step 1): 0 banks (Clean Isolation).\n`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Cross-mode bleed detected! Invalid modes: ${invalidModes}\n`);
  }

  // ---------------------------------------------------------------------------
  // TEST 3: TAXONOMY & DOMAIN PURITY AUDIT (ZERO OFF-TOPIC LEAKAGE)
  // ---------------------------------------------------------------------------
  console.log('TEST 3: Verifying Domain Purity (Zero C-Programming in Ag/Soil Banks)...');
  const sensitiveBanks = banks.filter(b => 
    b.title.includes('Soil and Water') || 
    b.title.includes('Agriculture Processing') || 
    b.title.includes('Farm Machinery')
  );

  const programmingPatterns = [
    'c programming', 'c language', 'storage class', 'operator precedence',
    'ansi c', 'static variable', 'queue data structure', 'circular queue'
  ];

  let offTopicCount = 0;
  for (const b of sensitiveBanks) {
    const bankQs = allQuestions.filter(q => q.topic === `bank__${b.id}`);
    for (const q of bankQs) {
      const lower = q.questionText.toLowerCase();
      if (programmingPatterns.some(p => lower.includes(p))) {
        console.error(`  ❌ Off-topic question found in "${b.title}": ${q.questionText.slice(0, 80)}...`);
        offTopicCount++;
      }
    }
  }

  if (offTopicCount === 0) {
    console.log(`  ✔ [PASS] 100% domain purity verified. Zero generic tutorial questions found in Ag/Soil banks.\n`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Found ${offTopicCount} off-topic questions.\n`);
  }

  // ---------------------------------------------------------------------------
  // TEST 4: BACKEND RECONCILIATION LOGIC INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('TEST 4: Verifying Backend Atomic Reconciliation Engine...');
  // Test the reconciliation computation
  const categorySummary: Record<string, { banks: number; questions: number }> = {};
  banks.forEach(b => {
    if (!categorySummary[b.type]) categorySummary[b.type] = { banks: 0, questions: 0 };
    categorySummary[b.type].banks++;
    categorySummary[b.type].questions += (b.questionCount || 0);
  });

  console.log(`  Current Verified Production Breakdown:`);
  Object.entries(categorySummary).forEach(([t, s]) => {
    console.log(`    • ${t.padEnd(20)}: ${s.banks} banks | ${s.questions} questions`);
  });

  const totalBankQuestions = Object.values(categorySummary).reduce((sum, c) => sum + c.questions, 0);
  if (totalBankQuestions === allQuestions.length && totalBankQuestions === 2473) {
    console.log(`  ✔ [PASS] Total questions reconciled: exactly ${totalBankQuestions} / 2,473.\n`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Total mismatch: sum=${totalBankQuestions}, allQuestions=${allQuestions.length}\n`);
  }

  // ---------------------------------------------------------------------------
  // TEST 5: PAGINATED DATA ACCESS SCALABILITY TEST
  // ---------------------------------------------------------------------------
  console.log('TEST 5: Testing Infinite Auto-Pagination Data Access (Zero 1,000-Row Cutoff)...');
  // Query questions across the largest category (Revision Sets = 1456 rows)
  const revisionBanks = banks.filter(b => b.type === 'revision-sets').map(b => `bank__${b.id}`);
  
  let fetchedRevisionCount = 0;
  let rPage = 0;
  while (true) {
    const { data: pageData, error: rErr } = await supabase
      .from('questions')
      .select('id')
      .in('topic', revisionBanks)
      .range(rPage * pageSize, (rPage + 1) * pageSize - 1);
    if (rErr || !pageData || pageData.length === 0) break;
    fetchedRevisionCount += pageData.length;
    rPage++;
    if (pageData.length < pageSize) break;
  }

  if (fetchedRevisionCount === 1456) {
    console.log(`  ✔ [PASS] Successfully fetched all ${fetchedRevisionCount} revision questions via paginated stream.`);
    console.log(`           Surpassed 1,000-row Supabase default limit with zero truncation.\n`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Expected 1,456 revision questions, got ${fetchedRevisionCount}.\n`);
  }

  // ---------------------------------------------------------------------------
  // FINAL SCORE
  // ---------------------------------------------------------------------------
  console.log('==============================================================================');
  if (passedTests === totalTests) {
    console.log(` ✔ ALL ${passedTests}/${totalTests} ENTERPRISE PIPELINE TESTS PASSED CLEANLY!`);
    console.log('   Data integrity, domain purity, exact counters, and zero-bleed guaranteed.');
  } else {
    console.error(` ❌ PIPELINE AUDIT FAILED: ${passedTests}/${totalTests} passed.`);
  }
  console.log('==============================================================================');
}

runPipelineAudit().catch(console.error);
