/**
 * Headless Database Diagram & Visual Integrity Scanner
 * OdishaExamPrep — Enterprise Zero-Failure Architecture
 * 
 * Audits 100% of questions in Supabase PostgreSQL with diagrams.
 * Validates schema, finite bounds, mathematical consistency,
 * DOM instance ID isolation, and text-visual redundancy.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  resolveDiagramPlacements,
  validateAndHealDiagram,
  diagramValidator,
  KNOWN_DIAGRAM_TYPES
} from '../src/lib/diagramValidator.js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagramIntegrityAudit() {
  console.log('==============================================================================');
  console.log(' 🛡️  HEADLESS DATABASE DIAGRAM & VISUAL INTEGRITY SCANNER');
  console.log(' OdishaExamPrep — Enterprise Zero-Failure Automated Verification');
  console.log('==============================================================================\n');

  console.log('Scanning database for questions with diagram payloads...');

  // Auto-paginating fetch to retrieve all questions with diagrams
  let allDiagramQuestions: any[] = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('questions')
      .select('id, questionText, explanation, topic, examId, diagram')
      .not('diagram', 'is', null)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Database query error:', error.message);
      break;
    }

    if (!data || data.length === 0) break;
    allDiagramQuestions = allDiagramQuestions.concat(data);
    page++;
    if (data.length < pageSize) break;
  }

  console.log(`Found ${allDiagramQuestions.length} diagram questions across PostgreSQL ground truth.\n`);

  let validCount = 0;
  let healedCount = 0;
  let decoupledCount = 0;
  let errorCount = 0;
  const typeCounts: Record<string, number> = {};

  for (const q of allDiagramQuestions) {
    try {
      const { questionDiagram, explanationDiagram } = resolveDiagramPlacements(q);
      const targetDiagram = questionDiagram || explanationDiagram;

      if (!targetDiagram) {
        decoupledCount++;
        continue;
      }

      const primaryType = String(targetDiagram.type || 'unknown');
      typeCounts[primaryType] = (typeCounts[primaryType] || 0) + 1;

      // Run deep self-healing validator
      const healResult = validateAndHealDiagram(targetDiagram, q.questionText || '');

      if (!healResult.isValid && healResult.wasDecoupled) {
        decoupledCount++;
      } else if (healResult.healedReason) {
        healedCount++;
      } else {
        validCount++;
      }
    } catch (err: any) {
      console.error(`  ❌ Error processing question ID ${q.id}:`, err?.message);
      errorCount++;
    }
  }

  console.log('------------------------------------------------------------------------------');
  console.log(' AUDIT METRICS & VISUAL TAXONOMY REPORT');
  console.log('------------------------------------------------------------------------------');
  console.log(`Total Diagram Questions Scanned : ${allDiagramQuestions.length}`);
  console.log(`Pristine Valid Diagrams         : ${validCount}`);
  console.log(`Auto-Healed Diagrams            : ${healedCount}`);
  console.log(`Safely Decoupled Visuals        : ${decoupledCount}`);
  console.log(`Runtime Processing Errors       : ${errorCount}`);

  console.log('\nDiagram Types Represented:');
  for (const [t, count] of Object.entries(typeCounts)) {
    const isKnown = KNOWN_DIAGRAM_TYPES.has(t);
    console.log(`  - ${t.padEnd(20)} : ${count} questions ${isKnown ? '✔ [REGISTERED]' : '⚠️ [UNREGISTERED]'}`);
  }

  const healthScore = allDiagramQuestions.length > 0
    ? (((validCount + healedCount) / allDiagramQuestions.length) * 100).toFixed(1)
    : '100.0';

  console.log('\n==============================================================================');
  console.log(` 🏆 VISUAL INTEGRITY HEALTH SCORE: ${healthScore}%`);
  if (errorCount === 0) {
    console.log(' ✔ ZERO UNHANDLED RUNTIME ERRORS. System is completely resilient to corrupt visuals.');
  } else {
    console.log(` ⚠️ Found ${errorCount} unhandled errors. Investigation recommended.`);
  }
  console.log('==============================================================================');
}

runDiagramIntegrityAudit().catch(err => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
