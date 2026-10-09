/**
 * Pure TypeScript Diagram Validation & Normalization Engine
 * OdishaExamPrep — Enterprise AI & Math Diagram Pipeline
 * Zero React/DOM/CSS dependencies so this can safely run on server, worker, or client.
 */

export const KNOWN_DIAGRAM_TYPES = new Set([
  'circle', 'coordinate', 'plot', 'triangle', 'polygon', 'rectangle', 'geometry',
  'matrix', 'grid', 'distance', 'cone', 'probability', 'sequence', 'equation',
  'quadratic', 'sphereDivision', 'boatStream', 'ratio', 'statistics', 'profitLoss',
  'cylinder', 'numberTheory', 'square', 'rightTriangle', 'parallelogram', 'cube',
  'trapezium', 'semicircle', 'cuboid', 'equilateralTriangle', 'vector', 'universal', 'venn',
  // Advanced competitive exam graph, chart, and reasoning diagrams
  'barGraph', 'lineGraph', 'pieChart', 'histogram', 'scatterPlot', 'boxPlot',
  'seatingArrangement', 'directionDiagram', 'clock', 'calendar', 'cubeFolding',
  'mirrorImage', 'treeDiagram', 'probabilityTree', 'unitCircle', 'heightDistance',
  'parabola', 'hyperbola', 'functionPlot', 'vennDiagram',
  // Civil Engineering, General Engineering & Life Sciences diagrams
  'beam', 'sfdBmd', 'mohrCircle', 'soilPhase', 'stressStrain',
  'punnettSquare', 'trophicPyramid', 'enzymeKinetics',
  'circuit', 'logicGate', 'pvDiagram',
  // SVG and Universal Primitives
  'point', 'line', 'segment', 'ray', 'arc', 'ellipse', 'angle', 'text', 'area'
]);

export function repairLatexBackslashes(str: string): string {
  let preCleaned = str
    .replace(/\x0c(rac|orall|rown|lat|otnote)(?![a-zA-Z])/g, '\\\\f$1')
    .replace(/\x08(eta|ar|ox|ullet|igcap|igcup|igsqcup|iguplus|igodot|mod|owtie)(?![a-zA-Z])/g, '\\\\b$1')
    .replace(/\x09(heta|imes|riangle|an|tilde|ext|tfrac|tau|o|op|hickspace|iny|today|binom|extbf|extit|exttt|extsf)(?![a-zA-Z])/g, '\\\\t$1')
    .replace(/\x0d(ight|ho|angle|ightarrow|ightharpoonup|ightharpoondown|brace|floor|ceil)(?![a-zA-Z])/g, '\\\\r$1')
    .replace(/\x0a(eq|earrow|abla|eg|ode)(?![a-zA-Z])/g, '\\\\n$1')
    .replace(/\x0b(ec)(?![a-zA-Z])/g, '\\\\v$1')
    .replace(/\\imes(?![a-zA-Z])/g, '\\\\times')
    .replace(/\\ext(?![a-zA-Z])/g, '\\\\text')
    .replace(/\\rac(?![a-zA-Z])/g, '\\\\frac')
    .replace(/\\ight(?![a-zA-Z])/g, '\\\\right')
    .replace(/\\heta(?![a-zA-Z])/g, '\\\\theta')
    .replace(/\\riangle(?![a-zA-Z])/g, '\\\\triangle');

  preCleaned = preCleaned.replace(/\\\\|\\([^bfnrtu"\\/])/g, (match, p1) => {
    return match === '\\\\' ? '\\\\' : '\\\\' + p1;
  });

  preCleaned = preCleaned.replace(/\\\\|\\u(?![0-9a-fA-F]{4})/g, (match) => {
    return match === '\\\\' ? '\\\\' : '\\\\u';
  });

  const latexCommands = 'theta|imes|riangle|an|tilde|text|tfrac|tau|to|top|thickspace|tiny|today|tbinom|textbf|textit|texttt|textsf|frac|forall|frown|flat|footnote|beta|bar|box|bullet|bigcap|bigcup|bigsqcup|biguplus|bigodot|bmod|bowtie|right|rho|rangle|rightarrow|Rightarrow|rightharpoonup|rightharpoondown|rbrace|rfloor|rceil|neq|nearrow|nabla|neg|node';
  const latexRegex = new RegExp(`\\\\\\\\|\\\\(${latexCommands})(?![a-zA-Z])`, 'g');
  preCleaned = preCleaned.replace(latexRegex, (match, p1) => {
    return match === '\\\\' ? '\\\\' : '\\\\' + p1;
  });

  preCleaned = preCleaned.replace(/\\\\|\\ne(?![a-zA-Z])/g, (match) => {
    return match === '\\\\' ? '\\\\' : '\\\\ne';
  });

  return preCleaned;
}

export function cleanJsonString(str: string): string {
  let cleaned = str.trim();
  
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n/, '').replace(/\n\s*```$/, '').trim();
  }

  if (!((cleaned.startsWith('{') && cleaned.endsWith('}')) || (cleaned.startsWith('[') && cleaned.endsWith(']')))) {
    return cleaned;
  }

  cleaned = repairLatexBackslashes(cleaned);

  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch (_) {}

  try {
    let repaired = cleaned
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/(?:\s*['"]?([a-zA-Z0-9_.-]+)['"]?\s*):/g, '"$1":')
      .replace(/:\s*'([^'\\]*(?:\\.[^'\\]*)*)'/g, ':"$1"')
      .replace(/,\s*([}\]])/g, '$1');

    repaired = repaired.replace(/\[\s*'([^']*)'\s*(?:,\s*'([^']*)'\s*)*\]/g, (match) => {
      return match.replace(/'/g, '"');
    });

    JSON.parse(repaired);
    return repaired;
  } catch (_) {}

  return cleaned;
}

export function tryParseJsonDiagram(text: string): any | null {
  const cleaned = cleanJsonString(text);
  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    try {
      const parsed = JSON.parse(cleaned);
      if (parsed && typeof parsed === 'object' && parsed.type) {
        if (KNOWN_DIAGRAM_TYPES.has(String(parsed.type))) {
          return parsed;
        }
      }
    } catch (_) {}
  }
  return null;
}

export function splitTextByJsonDiagrams(text: string): { type: 'text' | 'json'; content: string }[] {
  const result: { type: 'text' | 'json'; content: string }[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const openBrace = text.indexOf('{', currentIndex);
    if (openBrace === -1) {
      result.push({ type: 'text', content: text.substring(currentIndex) });
      break;
    }

    if (openBrace > currentIndex) {
      result.push({ type: 'text', content: text.substring(currentIndex, openBrace) });
    }

    let foundJson = false;
    for (let closeBrace = openBrace + 1; closeBrace < text.length; closeBrace++) {
      if (text[closeBrace] === '}') {
        const potentialJsonStr = text.substring(openBrace, closeBrace + 1);
        const parsed = tryParseJsonDiagram(potentialJsonStr);
        if (parsed) {
          result.push({ type: 'json', content: potentialJsonStr });
          currentIndex = closeBrace + 1;
          foundJson = true;
          break;
        }
      }
    }

    if (!foundJson) {
      result.push({ type: 'text', content: text.substring(openBrace, openBrace + 1) });
      currentIndex = openBrace + 1;
    }
  }

  return result;
}

export function extractEmbeddedDiagram(questionText: string): { cleanedText: string; diagram: any | null } {
  if (!questionText) return { cleanedText: '', diagram: null };
  
  let cleanedText = questionText;
  let diagram: any = null;

  // 1. Check for markdown code fenced JSON first (```json ... ```)
  const fencedRegex = /```(?:json)?\s*(\{\s*[\s\S]*?"type"\s*:[\s\S]*?\})\s*```/i;
  const match = cleanedText.match(fencedRegex);
  if (match && match[1]) {
    const parsed = tryParseJsonDiagram(match[1]);
    if (parsed) {
      diagram = parsed;
      cleanedText = cleanedText.replace(match[0], '').trim();
      return { cleanedText, diagram };
    }
  }

  // 2. Fall back to scanning braces
  const jsonSplits = splitTextByJsonDiagrams(cleanedText);
  let rebuiltText = '';
  
  for (const split of jsonSplits) {
    if (split.type === 'json') {
      const parsed = tryParseJsonDiagram(split.content);
      if (parsed) {
        diagram = parsed;
      } else {
        rebuiltText += split.content;
      }
    } else {
      rebuiltText += split.content;
    }
  }
  
  return {
    cleanedText: rebuiltText.replace(/```(?:json)?\s*```/g, '').trim(),
    diagram
  };
}

export function repairObjectStrings(val: any, visited = new WeakSet()): any {
  if (typeof val === 'string') {
    return val;
  }
  if (val && typeof val === 'object') {
    if (visited.has(val)) {
      return null;
    }
    visited.add(val);

    if (Array.isArray(val)) {
      return val.map(item => repairObjectStrings(item, visited));
    }
    const res: any = {};
    for (const k in val) {
      if (Object.prototype.hasOwnProperty.call(val, k)) {
        res[k] = repairObjectStrings(val[k], visited);
      }
    }
    return res;
  }
  return val;
}

export function computeChartBounds(clone: any): { xRange: [number, number]; yRange: [number, number] } {
  let minY = Infinity;
  let maxY = -Infinity;
  let minX = Infinity;
  let maxX = -Infinity;

  const inspectShape = (s: any) => {
    if (!s || typeof s !== 'object') return;
    
    // Check points
    if (Array.isArray(s.points) && s.points.length > 0) {
      s.points.forEach((p: any) => {
        const py = Number(Array.isArray(p) ? p[1] : p?.y);
        const px = Number(Array.isArray(p) ? p[0] : p?.x);
        if (!isNaN(py)) {
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        }
        if (!isNaN(px)) {
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
        }
      });
    }

    // Check boxPlot
    if (s.type === 'boxPlot') {
      const vals = [s.min, s.q1, s.median, s.q3, s.max].map(Number).filter(v => !isNaN(v));
      vals.forEach(v => {
        if (v < minX) minX = v;
        if (v > maxX) maxX = v;
      });
      minY = Math.min(minY, -3);
      maxY = Math.max(maxY, 3);
    }

    // Check directionDiagram steps
    if (s.type === 'directionDiagram' && Array.isArray(s.steps)) {
      let curX = 0;
      let curY = 0;
      minX = Math.min(minX, 0);
      maxX = Math.max(maxX, 0);
      minY = Math.min(minY, 0);
      maxY = Math.max(maxY, 0);
      
      s.steps.forEach((step: any) => {
        const d = Number(step.distance) || 2;
        const dir = String(step.direction || 'N').toUpperCase();
        let dx = 0;
        let dy = 0;
        switch (dir) {
          case 'N': dy = d; break;
          case 'S': dy = -d; break;
          case 'E': dx = d; break;
          case 'W': dx = -d; break;
          case 'NE': dx = d * 0.7; dy = d * 0.7; break;
          case 'NW': dx = -d * 0.7; dy = d * 0.7; break;
          case 'SE': dx = d * 0.7; dy = -d * 0.7; break;
          case 'SW': dx = -d * 0.7; dy = -d * 0.7; break;
        }
        curX += dx;
        curY += dy;
        if (curX < minX) minX = curX;
        if (curX > maxX) maxX = curX;
        if (curY < minY) minY = curY;
        if (curY > maxY) maxY = curY;
      });
    }
  };

  inspectShape(clone);
  if (Array.isArray(clone.shapes)) {
    clone.shapes.forEach(inspectShape);
  }

  // Derive robust Y Range
  let finalYRange: [number, number] = clone.yRange || [0, 100];
  if (minY !== Infinity && maxY !== -Infinity) {
    const lowY = minY < 0 ? Math.floor(minY * 1.15) : 0;
    const highY = maxY > 0 ? (maxY < 1 ? Number((maxY * 1.25).toFixed(2)) : Math.ceil(maxY * 1.15)) : 10;
    finalYRange = [lowY, Math.max(highY, lowY + 1)];
  }

  // Derive robust X Range
  let finalXRange: [number, number] = clone.xRange || [-0.5, 5.5];
  if (minX !== Infinity && maxX !== -Infinity) {
    const pad = Math.max(0.5, (maxX - minX) * 0.12);
    finalXRange = [minX - pad, maxX + pad];
  } else if (Array.isArray(clone.points) && clone.points.length > 0) {
    finalXRange = [-0.5, clone.points.length + 0.5];
  }

  return { xRange: finalXRange, yRange: finalYRange };
}

export function diagramValidator(diagram: any): any {
  if (!diagram || typeof diagram !== 'object') return null;
  
  const repaired = repairObjectStrings(diagram);
  let clone: any = { ...repaired };
  
  if (typeof clone.type !== 'string') {
    clone.type = String(clone.type || 'unknown');
  }

  if (!KNOWN_DIAGRAM_TYPES.has(clone.type)) {
    clone._unknownType = true;
  }

  if (clone.elements && !clone.shapes) {
    clone.shapes = clone.elements;
  }

  // Auto-wrap standalone shapes into UniversalMathDiagramEngine container
  if (clone.type !== 'universal' && clone.type !== 'vector' && (!clone.shapes || !Array.isArray(clone.shapes))) {
    const shapeType = clone.type;
    const isCoordinateChart = ['barGraph', 'lineGraph', 'histogram', 'scatterPlot', 'enzymeKinetics', 'stressStrain', 'pvDiagram'].includes(shapeType);
    const isCleanVisual = ['pieChart', 'vennDiagram', 'venn', 'clock', 'calendar', 'cubeFolding', 'seatingArrangement', 'punnettSquare', 'trophicPyramid', 'beam', 'sfdBmd', 'mohrCircle', 'soilPhase', 'circuit', 'logicGate'].includes(shapeType);
    const isDirection = shapeType === 'directionDiagram';
    const isReasoning = isCleanVisual || isDirection;

    const bounds = computeChartBounds(clone);
    
    clone = {
      type: 'universal',
      placement: clone.placement,
      width: clone.width || 600,
      height: clone.height || 360,
      xRange: clone.xRange || (isCleanVisual ? [-5, 5] : bounds.xRange),
      yRange: clone.yRange || (isCleanVisual ? [-5, 5] : bounds.yRange),
      grid: clone.grid !== undefined ? clone.grid : isCoordinateChart,
      xAxis: clone.xAxis !== undefined ? clone.xAxis : isCoordinateChart,
      yAxis: clone.yAxis !== undefined ? clone.yAxis : isCoordinateChart,
      xAxisLabel: clone.xAxisLabel,
      yAxisLabel: clone.yAxisLabel,
      shapes: [{ ...repaired, id: clone.id || `${shapeType}-1` }]
    };
  } else if (Array.isArray(clone.shapes) && clone.shapes.length > 0) {
    const isCleanVisual = clone.shapes.every((s: any) => ['pieChart', 'vennDiagram', 'venn', 'clock', 'calendar', 'cubeFolding', 'seatingArrangement', 'punnettSquare', 'trophicPyramid', 'beam', 'sfdBmd', 'mohrCircle', 'soilPhase', 'circuit', 'logicGate'].includes(s?.type));
    const bounds = computeChartBounds(clone);
    
    if (!clone.xRange || !Array.isArray(clone.xRange) || clone.xRange.length < 2) {
      clone.xRange = isCleanVisual ? [-5, 5] : bounds.xRange;
    }
    if (!clone.yRange || !Array.isArray(clone.yRange) || clone.yRange.length < 2 || (clone.yRange[0] === 0 && clone.yRange[1] === 100)) {
      clone.yRange = isCleanVisual ? [-5, 5] : bounds.yRange;
    }
    if (isCleanVisual) {
      if (clone.grid === undefined) clone.grid = false;
      if (clone.xAxis === undefined) clone.xAxis = false;
      if (clone.yAxis === undefined) clone.yAxis = false;
    }
  }

  // Final fallback to guarantee valid xRange and yRange are NEVER undefined, zero-width, or inverted
  if (!clone.xRange || !Array.isArray(clone.xRange) || clone.xRange.length < 2 || !Number.isFinite(clone.xRange[0]) || !Number.isFinite(clone.xRange[1])) {
    clone.xRange = [-5, 5];
  } else if (clone.xRange[0] >= clone.xRange[1]) {
    clone.xRange = [clone.xRange[0], clone.xRange[0] + 10];
  }

  if (!clone.yRange || !Array.isArray(clone.yRange) || clone.yRange.length < 2 || !Number.isFinite(clone.yRange[0]) || !Number.isFinite(clone.yRange[1])) {
    clone.yRange = [-5, 5];
  } else if (clone.yRange[0] >= clone.yRange[1]) {
    clone.yRange = [clone.yRange[0], clone.yRange[0] + 10];
  }

  if (Array.isArray(clone.shapes)) {
    clone.shapes = clone.shapes.map((s: any, idx: number) => ({
      ...s,
      id: s.id || `shape-${idx + 1}`
    }));
  }

  return clone;
}

export interface ResolvedDiagrams {
  questionDiagram: any | null;
  explanationDiagram: any | null;
}

/**
 * Classifies the pedagogical role of a diagram:
 * - 'stimulus': Unsolved problem data required in question stem (Bar/Line/Pie charts, initial seating, problem figure)
 * - 'derivation': Solution proof / vector trajectory / auxiliary construction meant for explanation drawer only
 * - 'neutral': Can function as either based on explicit context
 */
export function classifyDiagramPedagogicalRole(diagram: any): 'stimulus' | 'derivation' | 'neutral' {
  if (!diagram || typeof diagram !== 'object') return 'neutral';

  if (diagram.placement === 'explanation') return 'derivation';
  if (diagram.placement === 'question') return 'stimulus';

  const type = diagram.type;
  const shapes: any[] = Array.isArray(diagram.shapes) ? diagram.shapes : [];
  const allTypes = new Set([type, ...shapes.map((s: any) => s?.type).filter(Boolean)]);

  // Data charts are inherently problem stimuli
  if (
    allTypes.has('barGraph') ||
    allTypes.has('lineGraph') ||
    allTypes.has('pieChart') ||
    allTypes.has('histogram') ||
    allTypes.has('scatterPlot') ||
    allTypes.has('boxPlot') ||
    allTypes.has('table')
  ) {
    return 'stimulus';
  }

  // Direction movement trajectories with distance steps are solution proofs
  if (allTypes.has('directionDiagram')) {
    return 'derivation';
  }

  // Inspection of title/notes
  const textContext = `${diagram.title || ''} ${diagram.label || ''} ${diagram.description || ''}`.toLowerCase();
  if (/\b(proof|derivation|solution|trajectory|displacement path|answer)\b/i.test(textContext)) {
    return 'derivation';
  }
  if (/\b(stimulus|given data|problem figure|chart to analyze)\b/i.test(textContext)) {
    return 'stimulus';
  }

  return 'neutral';
}

/**
 * Computes a deterministic canonical fingerprint of a diagram's visual dataset.
 * Used to detect and decouple cross-question diagram bleed/copying.
 */
export function getDiagramFingerprint(diagram: any): string {
  if (!diagram || typeof diagram !== 'object') return '';

  const parts: string[] = [];
  const primaryType = diagram.type || 'unknown';
  parts.push(`type:${primaryType}`);

  const inspect = (s: any) => {
    if (!s || typeof s !== 'object') return;
    if (s.type) parts.push(`st:${s.type}`);
    if (Array.isArray(s.items)) parts.push(`items:${s.items.join(',')}`);
    if (Array.isArray(s.values)) parts.push(`vals:${s.values.map(Number).join(',')}`);
    if (Array.isArray(s.points)) {
      const pts = s.points.map((p: any) => {
        if (Array.isArray(p)) return `${p[0]},${p[1]}`;
        if (p && typeof p === 'object') return `${p.x},${p.y}${p.label ? `:${p.label}` : ''}`;
        return String(p);
      });
      parts.push(`pts:${pts.join('|')}`);
    }
    if (Array.isArray(s.steps)) {
      const steps = s.steps.map((st: any) => `${st.direction || ''}:${st.distance || ''}`);
      parts.push(`steps:${steps.join('|')}`);
    }
    if (Array.isArray(s.sets)) parts.push(`sets:${s.sets.join(',')}`);
  };

  inspect(diagram);
  if (Array.isArray(diagram.shapes)) {
    diagram.shapes.forEach(inspect);
  }

  return parts.join(';');
}

/**
 * Scopes all inner element IDs, markers, and gradients of a diagram to a unique question instance.
 * Eliminates DOM SVG ID collisions when multiple diagrams are rendered on the same viewport.
 */
export function scopeDiagramInstanceIds(diagram: any, uniquePrefix: string): any {
  if (!diagram || typeof diagram !== 'object') return diagram;

  const scoped = { ...diagram, instanceId: uniquePrefix };
  if (Array.isArray(scoped.shapes)) {
    scoped.shapes = scoped.shapes.map((s: any, idx: number) => {
      const shapeId = `diag_${uniquePrefix}_s${idx + 1}_${s.id || s.type || 'shape'}`;
      let sClone = { ...s, id: shapeId };

      // Re-scope url(#...) references in fill, stroke, markerStart, markerEnd, filter
      const reScopeUrl = (val: any) => {
        if (typeof val === 'string' && val.includes('url(#')) {
          return val.replace(/url\(#([^)]+)\)/g, `url(#diag_${uniquePrefix}_$1)`);
        }
        return val;
      };

      if (sClone.fill) sClone.fill = reScopeUrl(sClone.fill);
      if (sClone.stroke) sClone.stroke = reScopeUrl(sClone.stroke);
      if (sClone.markerStart) sClone.markerStart = reScopeUrl(sClone.markerStart);
      if (sClone.markerEnd) sClone.markerEnd = reScopeUrl(sClone.markerEnd);
      if (sClone.filter) sClone.filter = reScopeUrl(sClone.filter);

      return sClone;
    });
  }
  return scoped;
}

/**
 * Canonical JSONB Packaging for Single and Dual Visuals
 * Guarantees zero data loss when questions are persisted into the single PostgreSQL `diagram` column.
 * - Single Question Visual -> diagram with placement: 'question'
 * - Single Explanation Visual -> diagram with placement: 'explanation'
 * - Both Visuals Present -> composite container with { type: 'composite', questionDiagram, explanationDiagram }
 * - No Visuals -> null
 */
export function packageDiagramsForStorage(diagram?: any, explanationDiagram?: any): any | null {
  const hasQ = diagram && typeof diagram === 'object' && Object.keys(diagram).length > 0;
  const hasE = explanationDiagram && typeof explanationDiagram === 'object' && Object.keys(explanationDiagram).length > 0;

  if (!hasQ && !hasE) return null;

  // If diagram is already a composite container, preserve it
  if (hasQ && (diagram.type === 'composite' || (diagram.questionDiagram && diagram.explanationDiagram))) {
    return diagram;
  }

  if (hasQ && !hasE) {
    const qObj = { ...diagram };
    if (!qObj.placement) qObj.placement = 'question';
    return qObj;
  }

  if (!hasQ && hasE) {
    const eObj = { ...explanationDiagram };
    eObj.placement = 'explanation';
    return eObj;
  }

  // Both exist: bundle into canonical composite container
  return {
    type: 'composite',
    questionDiagram: { ...diagram, placement: 'question' },
    explanationDiagram: { ...explanationDiagram, placement: 'explanation' }
  };
}

/**
 * Resolves pedagogical diagram placement with intelligent disambiguation:
 * - questionDiagram: Stimulus visual rendered in question stem (above options)
 * - explanationDiagram: Solution derivation visual rendered in explanation drawer
 * Seamlessly unpacks standalone diagrams, explanation-routed diagrams, and composite dual-visual containers.
 * Auto-corrects mislabeled placement when stem explicitly requires visual stimulus.
 */
export function resolveDiagramPlacements(q: {
  diagram?: any;
  explanationDiagram?: any;
  questionText?: string;
  explanation?: string;
  id?: string;
}): ResolvedDiagrams {
  if (!q) return { questionDiagram: null, explanationDiagram: null };

  let qDiagram: any = null;
  let expDiagram: any = null;

  let rawDiag = q.diagram;
  if (typeof rawDiag === 'string' && rawDiag.trim().startsWith('{')) {
    rawDiag = tryParseJsonDiagram(rawDiag);
  }
  let rawExp = q.explanationDiagram;
  if (typeof rawExp === 'string' && rawExp.trim().startsWith('{')) {
    rawExp = tryParseJsonDiagram(rawExp);
  }

  // 1. Direct explanationDiagram assignment if provided
  if (rawExp && typeof rawExp === 'object') {
    expDiagram = diagramValidator(rawExp);
  }

  // 2. Inspect q.diagram (handles standalone diagrams and composite containers)
  if (rawDiag && typeof rawDiag === 'object') {
    // 2a. Check if diagram is a composite container holding both visuals
    if (rawDiag.type === 'composite' || rawDiag.questionDiagram || rawDiag.explanationDiagram) {
      if (rawDiag.questionDiagram && !qDiagram) {
        qDiagram = diagramValidator(rawDiag.questionDiagram);
      }
      if (rawDiag.explanationDiagram && !expDiagram) {
        expDiagram = diagramValidator(rawDiag.explanationDiagram);
      }
    } else if (rawDiag.placement === 'explanation') {
      // 2b. Standalone diagram routed explicitly to explanation
      if (!expDiagram) {
        expDiagram = diagramValidator(rawDiag);
      }
    } else {
      // 2c. Standalone question stimulus diagram
      if (!qDiagram) {
        qDiagram = diagramValidator(rawDiag);
      }
    }
  }

  // 3. Check if explanation contains embedded JSON diagram
  if (!expDiagram && q.explanation && typeof q.explanation === 'string' && /\{[\s\S]*"type"[\s\S]*\}/.test(q.explanation)) {
    const extracted = extractEmbeddedDiagram(q.explanation);
    if (extracted.diagram) {
      expDiagram = diagramValidator(extracted.diagram);
    }
  }

  // 4. Check if questionText contains embedded JSON diagram
  if (!qDiagram && q.questionText && typeof q.questionText === 'string' && /\{[\s\S]*"type"[\s\S]*\}/.test(q.questionText)) {
    const extracted = extractEmbeddedDiagram(q.questionText);
    if (extracted.diagram) {
      if (extracted.diagram.placement === 'explanation') {
        if (!expDiagram) expDiagram = diagramValidator(extracted.diagram);
      } else {
        qDiagram = diagramValidator(extracted.diagram);
      }
    }
  }

  // 5. Intelligent Disambiguation & Role Validation:
  // Case A: Stem explicitly demands a visual stimulus, but qDiagram is null while expDiagram holds a data chart
  const stemDemandsVisual = Boolean(q.questionText && /\b(refer\s+to|referring\s+to|study\s+the|in\s+the\s+given|from\s+the\s+(?:given\s+)?(?:figure|diagram|graph|chart)|based\s+on\s+the\s+(?:given\s+)?(?:figure|diagram|graph|chart)|shown\s+(?:in\s+the\s+figure|below|above)|(?:given|following)\s+(?:figure|diagram|graph|chart|table|bar|line|pie))\b/i.test(q.questionText));
  if (!qDiagram && expDiagram && stemDemandsVisual) {
    const expRole = classifyDiagramPedagogicalRole(expDiagram);
    if (expRole === 'stimulus' || expRole === 'neutral') {
      // Auto-promote stimulus to questionDiagram so student can solve the problem
      qDiagram = { ...expDiagram, placement: 'question' };
      expDiagram = null;
    }
  }

  // Case B: Direction Sense or derivation proof placed in question stimulus where text is purely verbal
  if (qDiagram && !expDiagram) {
    const qRole = classifyDiagramPedagogicalRole(qDiagram);
    const isVerbalProblemWithoutStimulusRef = q.questionText && !stemDemandsVisual;
    if (qRole === 'derivation' && isVerbalProblemWithoutStimulusRef) {
      // Auto-move derivation proof to explanation to protect question from revealing answer
      expDiagram = { ...qDiagram, placement: 'explanation' };
      qDiagram = null;
    }
  }

  // Case C: Identical duplicate in both slots
  if (qDiagram && expDiagram) {
    const fpQ = getDiagramFingerprint(qDiagram);
    const fpE = getDiagramFingerprint(expDiagram);
    if (fpQ && fpQ === fpE) {
      // Identical visual repeated in both question and explanation
      // If stem is verbal, keep only in explanation. Otherwise keep in question.
      if (stemDemandsVisual) {
        expDiagram = null;
      } else {
        qDiagram = null;
      }
    }
  }

  // 6. Instance Scoping: Guarantee unique DOM IDs if question ID exists
  if (q.id) {
    const cleanId = String(q.id).replace(/[^a-zA-Z0-9_]/g, '');
    if (qDiagram) qDiagram = scopeDiagramInstanceIds(qDiagram, `${cleanId}_q`);
    if (expDiagram) expDiagram = scopeDiagramInstanceIds(expDiagram, `${cleanId}_e`);
  }

  return {
    questionDiagram: qDiagram,
    explanationDiagram: expDiagram
  };
}

/**
 * High-precision compact number formatter for graph axes, tags, and measurements.
 * Preserves clean integers, prevents left-canvas margin slicing, and handles Indian (L/Cr) & SI (k/M) scales.
 */
export function formatCompactNumber(val: number, unit: string = ''): string {
  if (!Number.isFinite(val)) return '0' + unit;
  if (Math.abs(val) < 0.00001) return '0' + unit;
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  const trimmedUnit = unit.trim();
  const lowerUnit = trimmedUnit.toLowerCase();

  // Determine if unit is an explicit SI engineering/physical unit
  const isEngineeringUnit = /^(?:pa|mpa|kpa|gpa|n|kn|mn|m|mm|cm|km|j|kj|mj|w|kw|mw|v|kv|a|ma|ka|hz|khz|mhz|ghz|kg|g|mg|s|ms|rad|deg|°)/i.test(lowerUnit);

  // Check if unit already specifies Cr, L, or k to prevent duplicate suffixes (e.g. "2.5Cr Cr")
  const unitHasCr = lowerUnit === 'cr' || lowerUnit === 'crore' || lowerUnit === 'crores';
  const unitHasL = lowerUnit === 'l' || lowerUnit === 'lakh' || lowerUnit === 'lakhs';
  const unitHasK = lowerUnit === 'k';

  // Clean integers under 10,000 stay intact
  if (abs < 10000 && Number.isInteger(val)) {
    return `${sign}${abs}${unit}`;
  }
  // Decimals under 1
  if (abs < 1) {
    return `${sign}${parseFloat(abs.toFixed(3))}${unit}`;
  }

  // 1. SI Engineering Mode: Standard metric multipliers (k, M, G)
  if (isEngineeringUnit) {
    if (abs >= 1000000000) {
      const g = abs / 1000000000;
      const formatted = g >= 10 ? Math.round(g) : parseFloat(g.toFixed(1));
      return `${sign}${formatted}G${unit}`;
    }
    if (abs >= 1000000) {
      const m = abs / 1000000;
      const formatted = m >= 10 ? Math.round(m) : parseFloat(m.toFixed(1));
      return `${sign}${formatted}M${unit}`;
    }
    if (abs >= 1000) {
      const k = abs / 1000;
      const formatted = k >= 100 ? Math.round(k) : parseFloat(k.toFixed(1));
      return `${sign}${formatted}k${unit}`;
    }
    return `${sign}${parseFloat(abs.toFixed(2))}${unit}`;
  }

  // 2. Demographic / Indian Currency & Statistics Mode: Lakhs & Crores
  if (abs >= 10000000) {
    const cr = abs / 10000000;
    const formatted = cr >= 10 ? Math.round(cr) : parseFloat(cr.toFixed(1));
    if (unitHasCr) {
      return `${sign}${formatted}Cr`;
    }
    return `${sign}${formatted}Cr${unit}`;
  }
  if (abs >= 100000) {
    const l = abs / 100000;
    const formatted = l >= 10 ? Math.round(l) : parseFloat(l.toFixed(1));
    if (unitHasL) {
      return `${sign}${formatted}L`;
    }
    return `${sign}${formatted}L${unit}`;
  }
  if (abs >= 10000) {
    const k = abs / 1000;
    const formatted = k >= 100 ? Math.round(k) : parseFloat(k.toFixed(1));
    if (unitHasK) {
      return `${sign}${formatted}k`;
    }
    return `${sign}${formatted}k${unit}`;
  }
  return `${sign}${parseFloat(abs.toFixed(2))}${unit}`;
}

export interface HealedDiagramResult {
  healedDiagram: any | null;
  cleanQuestionText: string;
  wasDecoupled: boolean;
  isValid: boolean;
  healedReason?: string;
}

/**
 * Strips dangling visual directives (e.g. "refer to the given figure", "as shown below")
 * from question stems when a corrupted diagram is decoupled.
 * Transforms stem into an authentic, 100% self-contained verbal problem.
 */
export function sanitizeDecoupledQuestionText(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // 1. Strip standard exam anchor directives (Headers & Prefixes)
  cleaned = cleaned.replace(/^Directions(?:\s*\([^\)]+\))?:\s*(?:Refer\s+to|Study|Consider)[^\n]*\n/i, '');
  cleaned = cleaned.replace(/^Directions(?:\s*\([^\)]+\))?:\s*Refer\s+to\s+(?:the\s+)?(?:given\s+)?(?:[a-zA-Z\s]+)?(?:figure|diagram|graph|chart|table|sketch)[,\s]*(?:to\s+answer\s+the\s+question:?|and\s+answer\s+the\s+following:?)?[:\.\s]*/i, '');
  cleaned = cleaned.replace(/^(?:Refer\s+to|Referring\s+to|Study\s+the|Based\s+on\s+the)\s+(?:the\s+)?(?:given\s+)?(?:[a-zA-Z\s]+)?(?:figure|diagram|graph|chart|table|sketch|drawing)[,\s]*(?:to\s+answer\s+the\s+question:?|and\s+answer\s+the\s+following:?)?\s*/i, '');
  cleaned = cleaned.replace(/^Consider\s+the\s+(?:following|given|attached|schematic)\s+(?:figure|diagram|graph|chart|sketch|drawing)[:,\s]*/i, '');
  cleaned = cleaned.replace(/^(?:from|in)\s+the\s+(?:schematic\s+)?(?:figure|diagram|graph|chart|sketch)\s+(?:given\s+)?(?:alongside|below|above)[,\s]*/i, '');

  // 2. Strip dangling leading "to " if stripped directive left an infinitive (e.g. "Refer to chart to determine..." -> "determine...")
  cleaned = cleaned.replace(/^to\s+/i, '');

  // 3. Strip inline and trailing figure references (mid-sentence & tail)
  cleaned = cleaned.replace(/(?:^|,\s*)(?:as\s+)?shown\s+in\s+(?:the\s+)?(?:given\s+)?(?:[a-zA-Z\s]+)?(?:figure|diagram|graph|chart|circuit|sketch|below|above)[,\.]?\s*/gi, (match) => {
    return match.startsWith(',') ? '. ' : '';
  });
  cleaned = cleaned.replace(/\s*\([^\)]*(?:figure|diagram|graph|chart|shown below|shown above|see diagram)[^\)]*\)/gi, '');
  cleaned = cleaned.replace(/\bin\s+the\s+(?:given|adjoining|adjacent)\s+figure\b/gi, 'in the given problem');
  cleaned = cleaned.replace(/\bfrom\s+the\s+given\s+(?:figure|diagram|graph|chart)\b/gi, 'from the given data');

  // 4. Clean trailing, double spaces, and stranded period punctuation
  cleaned = cleaned.replace(/\s+\./g, '.');
  cleaned = cleaned.replace(/^\s*[\.,:;]\s*/, '');
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  // 5. Capitalize first character if lowercase
  if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
    if (!cleaned.startsWith('in the given problem')) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }

  return cleaned;
}

/**
 * Enterprise Zero-Failure Autonomous Self-Healing & Decoupling Gatekeeper
 * 
 * Deeply validates diagram schema across all known technical & quantitative domains.
 * - Auto-heals missing categories, stringified values, missing bounds, and out-of-range positions.
 * - If diagram is fundamentally corrupt beyond healing (e.g. empty dataset, non-finite values),
 *   it triggers AUTONOMOUS PEDAGOGICAL DECOUPLING: strips diagram to null and heals question stem
 *   so the candidate receives an authentic, solvable verbal MCQ.
 */
export function validateAndHealDiagram(diagram: any, questionText: string = ''): HealedDiagramResult {
  if (!diagram || typeof diagram !== 'object') {
    return {
      healedDiagram: null,
      cleanQuestionText: questionText,
      wasDecoupled: false,
      isValid: true
    };
  }

  // Handle composite containers (both questionDiagram and explanationDiagram)
  if (diagram.type === 'composite' || (diagram.questionDiagram && diagram.explanationDiagram)) {
    const healedQ = diagram.questionDiagram ? validateAndHealDiagram(diagram.questionDiagram, questionText) : { healedDiagram: null, cleanQuestionText: questionText, wasDecoupled: false, isValid: true };
    const healedE = diagram.explanationDiagram ? validateAndHealDiagram(diagram.explanationDiagram, questionText) : { healedDiagram: null, cleanQuestionText: questionText, wasDecoupled: false, isValid: true };

    if (!healedQ.healedDiagram && !healedE.healedDiagram) {
      return {
        healedDiagram: null,
        cleanQuestionText: sanitizeDecoupledQuestionText(questionText),
        wasDecoupled: true,
        isValid: false,
        healedReason: 'Both composite visuals were corrupt and decoupled'
      };
    }

    return {
      healedDiagram: packageDiagramsForStorage(healedQ.healedDiagram, healedE.healedDiagram),
      cleanQuestionText: healedQ.healedDiagram ? questionText : sanitizeDecoupledQuestionText(questionText),
      wasDecoupled: healedQ.wasDecoupled || healedE.wasDecoupled,
      isValid: true
    };
  }

  // 1. Initial Normalization & String Cleanup
  const normalized = diagramValidator(diagram);
  if (!normalized) {
    return {
      healedDiagram: null,
      cleanQuestionText: sanitizeDecoupledQuestionText(questionText),
      wasDecoupled: true,
      isValid: false,
      healedReason: 'Failed base diagram normalization'
    };
  }

  // 2. Unpack primary shape
  const shapes: any[] = Array.isArray(normalized.shapes) ? normalized.shapes : [normalized];
  if (shapes.length === 0) {
    return {
      healedDiagram: null,
      cleanQuestionText: sanitizeDecoupledQuestionText(questionText),
      wasDecoupled: true,
      isValid: false,
      healedReason: 'Zero shapes defined'
    };
  }

  const primaryShape = shapes[0] || {};
  const primaryType = String(primaryShape.type || normalized.type || 'unknown');

  // Verify that either the original diagram type or at least one shape inside is a recognized valid type
  const rawType = String(diagram?.type || '');
  const hasRecognizedShape = shapes.some((s: any) => KNOWN_DIAGRAM_TYPES.has(String(s?.type || '')) && s?.type !== 'universal' && s?.type !== 'vector');
  const isOriginalTypeKnown = KNOWN_DIAGRAM_TYPES.has(rawType) && rawType !== 'universal' && rawType !== 'vector';
  const isRawUniversalWithShapes = (rawType === 'universal' || rawType === 'vector') && hasRecognizedShape;

  if (!hasRecognizedShape && !isOriginalTypeKnown && !isRawUniversalWithShapes) {
    return {
      healedDiagram: null,
      cleanQuestionText: sanitizeDecoupledQuestionText(questionText),
      wasDecoupled: true,
      isValid: false,
      healedReason: `Unrecognized diagram type: ${primaryType}`
    };
  }

  let healedClone: any;
  try {
    healedClone = JSON.parse(JSON.stringify(normalized));
  } catch (_) {
    healedClone = { ...normalized };
  }
  let targetShape = healedClone.shapes && healedClone.shapes[0] ? healedClone.shapes[0] : healedClone;

  // 3. Domain-Specific Self-Healing & Validation

  // A. Bar Graphs, Histograms & Pie Charts
  if (['barGraph', 'pieChart', 'histogram'].includes(primaryType)) {
    let items = Array.isArray(targetShape.items) ? targetShape.items : (Array.isArray(healedClone.items) ? healedClone.items : []);
    let values = Array.isArray(targetShape.values) ? targetShape.values : (Array.isArray(healedClone.values) ? healedClone.values : []);

    // Sanitize values to numbers (treat null, undefined, boolean as non-numbers, positive for pie)
    const cleanValues = values.map((v: any) => {
      if (v === null || v === undefined || typeof v === 'boolean') return NaN;
      const num = Number(v);
      if (!Number.isFinite(num)) return NaN;
      return primaryType === 'pieChart' ? Math.abs(num) : num;
    }).filter((v: number) => !isNaN(v) && (primaryType === 'pieChart' ? v > 0 : true));

    // If completely missing values, unhealable -> decouple
    if (cleanValues.length === 0) {
      return {
        healedDiagram: null,
        cleanQuestionText: sanitizeDecoupledQuestionText(questionText),
        wasDecoupled: true,
        isValid: false,
        healedReason: 'Bar/Pie chart has zero valid numeric values'
      };
    }

    // Auto-heal missing category items
    if (items.length < cleanValues.length) {
      items = cleanValues.map((_: any, idx: number) => items[idx] || `Item ${String.fromCharCode(65 + idx)}`);
    }

    targetShape.items = items;
    targetShape.values = cleanValues;
    healedClone.items = items;
    healedClone.values = cleanValues;
  }

  // B. Line Graphs & Scatter Plots
  if (['lineGraph', 'scatterPlot', 'curve'].includes(primaryType)) {
    let points = Array.isArray(targetShape.points) ? targetShape.points : (Array.isArray(healedClone.points) ? healedClone.points : []);
    const cleanPoints = points.map((p: any) => {
      if (Array.isArray(p)) {
        const x = Number(p[0]);
        const y = Number(p[1]);
        return (Number.isFinite(x) && Number.isFinite(y)) ? [x, y] : null;
      }
      if (p && typeof p === 'object') {
        const x = Number(p.x);
        const y = Number(p.y);
        return (Number.isFinite(x) && Number.isFinite(y)) ? { ...p, x, y } : null;
      }
      return null;
    }).filter(Boolean);

    if (cleanPoints.length < 2) {
      return {
        healedDiagram: null,
        cleanQuestionText: sanitizeDecoupledQuestionText(questionText),
        wasDecoupled: true,
        isValid: false,
        healedReason: 'Line graph requires at least 2 valid coordinate points'
      };
    }

    targetShape.points = cleanPoints;
    healedClone.points = cleanPoints;
  }

  // C. Structural Beams & SFD/BMD
  if (['beam', 'sfdBmd'].includes(primaryType)) {
    let span = Number(targetShape.span || healedClone.span);
    if (!Number.isFinite(span) || span <= 0) {
      span = 6; // Standard 6-meter span default
    }
    targetShape.span = span;
    healedClone.span = span;

    // Self-heal supports if missing
    if (!Array.isArray(targetShape.supports) || targetShape.supports.length === 0) {
      targetShape.supports = [
        { type: 'pin', position: 0 },
        { type: 'roller', position: span }
      ];
    } else {
      // Clamp support positions within span
      targetShape.supports = targetShape.supports.map((s: any) => ({
        ...s,
        position: Math.max(0, Math.min(span, Number(s.position) || 0))
      }));
    }

    // Clamp loads within span and guarantee array type
    if (!Array.isArray(targetShape.loads)) {
      targetShape.loads = [];
    } else {
      targetShape.loads = targetShape.loads.map((l: any) => {
        if (!l || typeof l !== 'object') return null;
        if (l.type === 'udl') {
          const st = Math.max(0, Math.min(span, Number(l.start) || 0));
          const en = Math.max(st, Math.min(span, Number(l.end) || span));
          return { ...l, start: st, end: en, magnitude: Number(l.magnitude) || 10 };
        }
        return {
          ...l,
          position: Math.max(0, Math.min(span, Number(l.position) || 0)),
          magnitude: Number(l.magnitude) || 20
        };
      }).filter(Boolean);
    }
    healedClone.loads = targetShape.loads;
  }

  // D. Mohr's Circle of Stress
  if (primaryType === 'mohrCircle') {
    targetShape.sigmaX = Number.isFinite(Number(targetShape.sigmaX)) ? Number(targetShape.sigmaX) : 40;
    targetShape.sigmaY = Number.isFinite(Number(targetShape.sigmaY)) ? Number(targetShape.sigmaY) : 20;
    targetShape.tauXY = Number.isFinite(Number(targetShape.tauXY)) ? Number(targetShape.tauXY) : 0;
  }

  // E. Punnett Square
  if (primaryType === 'punnettSquare') {
    let fg = Array.isArray(targetShape.femaleGametes) ? targetShape.femaleGametes : ['A', 'a'];
    let mg = Array.isArray(targetShape.maleGametes) ? targetShape.maleGametes : ['A', 'a'];
    let cells = Array.isArray(targetShape.cells) ? targetShape.cells : [];

    // Auto-heal cells if missing
    if (cells.length !== fg.length * mg.length) {
      cells = [];
      for (const f of fg) {
        for (const m of mg) {
          cells.push(`${f}${m}`);
        }
      }
    }

    targetShape.femaleGametes = fg;
    targetShape.maleGametes = mg;
    targetShape.cells = cells;
  }

  // F. Trophic Pyramid
  if (primaryType === 'trophicPyramid') {
    let tiers = Array.isArray(targetShape.tiers) ? targetShape.tiers : [];
    if (tiers.length === 0) {
      tiers = [
        { level: 'Apex Predators', value: 10, unit: 'kcal' },
        { level: 'Secondary Consumers', value: 100, unit: 'kcal' },
        { level: 'Primary Consumers', value: 1000, unit: 'kcal' },
        { level: 'Primary Producers', value: 10000, unit: 'kcal' }
      ];
    }
    targetShape.tiers = tiers;
  }

  // Final verification through diagramValidator to guarantee container and bounds
  const finalized = diagramValidator(healedClone);
  return {
    healedDiagram: finalized,
    cleanQuestionText: questionText,
    wasDecoupled: false,
    isValid: true
  };
}



