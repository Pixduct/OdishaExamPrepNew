import React from 'react';
import {
  Droplets,
  Waves,
  Filter,
  Recycle,
  Wind,
  Mountain,
  Layers,
  Route,
  Milestone,
  Boxes,
  Building,
  Compass,
  Crosshair,
  Hammer,
  HardHat,
  Cpu,
  Zap,
  Flame,
  Gauge,
  Wrench,
  Settings,
  Factory,
  Laptop,
  Code,
  Database,
  Network,
  Activity,
  HeartPulse,
  Scale,
  Landmark,
  Sprout,
  Trees,
  Receipt,
  TrendingUp,
  Globe,
  PieChart,
  Calculator,
  Target,
  Award,
  BookOpen,
  FileText,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  Atom,
  FlaskConical,
  Dna,
  Languages,
  Radio,
  MapPin,
  Building2,
  LucideIcon
} from 'lucide-react';

export type PatternType = 
  | 'hydro-waves' 
  | 'sanitary-flow' 
  | 'blueprint-grid' 
  | 'topographic' 
  | 'circuit-matrix' 
  | 'orbital-rings' 
  | 'hex-mesh' 
  | 'heritage-arch' 
  | 'dot-matrix';

export interface VectorThemeConfig {
  gradient: string;
  badgeBg: string;
  badgeText: string;
  examTag: string;
  pattern: PatternType;
  MainIcon: LucideIcon;
  WatermarkIcon: LucideIcon;
  accentGlowColor: string;
}

/**
 * Procedural SVG Texture Overlays tailored for academic & engineering disciplines
 */
export const VectorCoverTextureOverlay: React.FC<{ pattern?: PatternType; className?: string }> = ({ 
  pattern = 'blueprint-grid', 
  className = "absolute inset-0 pointer-events-none opacity-15 select-none" 
}) => {
  switch (pattern) {
    case 'hydro-waves':
      return (
        <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hydro-pattern" width="60" height="24" patternUnits="userSpaceOnUse">
              <path d="M 0 12 Q 15 4 30 12 T 60 12" fill="none" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.6" />
              <path d="M 0 20 Q 15 12 30 20 T 60 20" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hydro-pattern)" />
        </svg>
      );

    case 'sanitary-flow':
      return (
        <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="sanitary-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.5" />
              <path d="M 0 20 H 40 M 20 0 V 40" stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sanitary-pattern)" />
        </svg>
      );

    case 'circuit-matrix':
      return (
        <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit-pattern" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 0 24 H 16 L 24 16 H 48 M 24 16 V 0 M 24 32 V 48" fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.5" />
              <circle cx="16" cy="24" r="2.5" fill="currentColor" fillOpacity="0.6" />
              <circle cx="36" cy="16" r="2" fill="currentColor" fillOpacity="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
        </svg>
      );

    case 'topographic':
      return (
        <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="topo-pattern" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 0 40 C 20 20, 60 60, 80 40 M 0 60 C 30 40, 50 80, 80 60 M 0 20 C 30 0, 50 40, 80 20" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo-pattern)" />
        </svg>
      );

    case 'hex-mesh':
      return (
        <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hex-pattern" width="32" height="55.4" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
              <path d="M 16 0 L 32 9.2 L 32 27.7 L 16 36.9 L 0 27.7 L 0 9.2 Z M 0 55.4 L 16 46.2 L 32 55.4" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity="0.45" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hex-pattern)" />
        </svg>
      );

    case 'orbital-rings':
      return (
        <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="orbit-pattern" width="64" height="64" patternUnits="userSpaceOnUse">
              <ellipse cx="32" cy="32" rx="26" ry="12" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(30 32 32)" strokeOpacity="0.4" />
              <ellipse cx="32" cy="32" rx="26" ry="12" fill="none" stroke="currentColor" strokeWidth="1" transform="rotate(-30 32 32)" strokeOpacity="0.3" />
              <circle cx="32" cy="32" r="3" fill="currentColor" fillOpacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#orbit-pattern)" />
        </svg>
      );

    case 'heritage-arch':
      return (
        <svg className={className} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="arch-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 0 40 V 15 A 20 20 0 0 1 40 15 V 40 M 20 0 V 10" fill="none" stroke="currentColor" strokeWidth="1.1" strokeOpacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#arch-pattern)" />
        </svg>
      );

    case 'blueprint-grid':
    default:
      return (
        <div className="absolute inset-0 opacity-12 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none" />
      );
  }
};

/**
 * Safely extracts human-friendly tagline text from JSON or string format
 */
export const getBankDisplayTagline = (tagline: any, defaultText: string = 'Comprehensive'): string => {
  if (!tagline) return defaultText;
  if (typeof tagline === 'string') {
    if (tagline.startsWith('{')) {
      try {
        const parsed = JSON.parse(tagline);
        return parsed.text || parsed.subject || defaultText;
      } catch (e) {
        return tagline;
      }
    }
    return tagline;
  }
  return defaultText;
};

/**
 * Highly dynamic, 35+ discipline classifier and artwork theme generator
 */
export const getQuestionBankVectorTheme = (itemInput: any = {}, fallbackExamName: string = ''): VectorThemeConfig => {
  let title = '';
  let category = '';
  let explicitSubject = '';
  let examId = '';

  if (typeof itemInput === 'string') {
    title = itemInput;
    category = fallbackExamName || '';
  } else if (itemInput && typeof itemInput === 'object') {
    title = itemInput.title || '';
    category = itemInput.category || '';
    examId = itemInput.examId || '';

    if (itemInput.tagline && typeof itemInput.tagline === 'string') {
      try {
        const parsed = JSON.parse(itemInput.tagline);
        if (parsed?.subject && typeof parsed.subject === 'string') {
          explicitSubject = parsed.subject.trim();
        }
      } catch (e) {
        if (!itemInput.tagline.startsWith('{')) {
          explicitSubject = itemInput.tagline.trim();
        }
      }
    }
  }

  // Resolve dynamic exam name tag
  let resolvedExamTag = '';
  if (fallbackExamName && fallbackExamName.trim()) {
    resolvedExamTag = fallbackExamName.trim().toUpperCase();
  } else if (examId) {
    resolvedExamTag = String(examId).replace(/-/g, ' ').toUpperCase();
  } else {
    resolvedExamTag = 'ALL ODISHA & CENTRAL GOVT EXAMS';
  }

  const t = (title + ' ' + (explicitSubject || '') + ' ' + (category || '')).toLowerCase();

  // ==========================================
  // 1. WATER & SANITARY / ENVIRONMENTAL
  // ==========================================

  // 1.1 Wastewater & Sewerage Engineering
  if (
    t.includes('wastewater') || t.includes('waste water') || t.includes('sewage') ||
    t.includes('sewer') || t.includes('sludge') || t.includes('effluent') ||
    t.includes('activated sludge') || t.includes('septic') || t.includes('oxidation pond') ||
    t.includes('trickling filter') || t.includes('sanitary eng')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-emerald-50',
      badgeBg: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'WASTEWATER & SANITARY ENG',
      examTag: resolvedExamTag,
      pattern: 'sanitary-flow',
      MainIcon: Recycle,
      WatermarkIcon: Filter,
      accentGlowColor: 'rgba(16, 185, 129, 0.25)',
    };
  }

  // 1.2 Water Supply & Treatment Engineering
  if (
    t.includes('water supply') || t.includes('water treatment') || t.includes('water demand') ||
    t.includes('filtration') || t.includes('sedimentation') || t.includes('coagulation') ||
    t.includes('disinfection') || t.includes('chlorination') || t.includes('water distribution') ||
    t.includes('water resources') || t.includes('potable water')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-cyan-900 via-sky-950 to-slate-950 text-cyan-50',
      badgeBg: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'WATER SUPPLY & HYDRAULICS',
      examTag: resolvedExamTag,
      pattern: 'hydro-waves',
      MainIcon: Droplets,
      WatermarkIcon: Waves,
      accentGlowColor: 'rgba(6, 182, 212, 0.25)',
    };
  }

  // 1.3 Environmental & Pollution Control
  if (
    t.includes('pollution') || t.includes('air pollution') || t.includes('noise pollution') ||
    t.includes('solid waste') || t.includes('eia') || t.includes('environmental impact') ||
    t.includes('hazardous waste') || t.includes('greenhouse') || t.includes('particulate')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-teal-900 via-slate-900 to-emerald-950 text-teal-50',
      badgeBg: 'bg-teal-400/20 text-teal-200 border-teal-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'ENVIRONMENTAL ENGINEERING',
      examTag: resolvedExamTag,
      pattern: 'sanitary-flow',
      MainIcon: Wind,
      WatermarkIcon: ShieldCheck,
      accentGlowColor: 'rgba(20, 184, 166, 0.25)',
    };
  }

  // 1.4 Hydrology & Irrigation Engineering
  if (
    t.includes('irrigation') || t.includes('hydrology') || t.includes('dam') ||
    t.includes('spillway') || t.includes('canal') || t.includes('cross drainage') ||
    t.includes('hydrograph') || t.includes('run off') || t.includes('catchment') ||
    t.includes('weir') || t.includes('barrage')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-blue-900 via-cyan-950 to-slate-950 text-blue-50',
      badgeBg: 'bg-blue-400/20 text-blue-200 border-blue-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'IRRIGATION & HYDROLOGY',
      examTag: resolvedExamTag,
      pattern: 'hydro-waves',
      MainIcon: Waves,
      WatermarkIcon: Droplets,
      accentGlowColor: 'rgba(59, 130, 246, 0.25)',
    };
  }

  // ==========================================
  // 2. CIVIL & STRUCTURAL ENGINEERING
  // ==========================================

  // 2.1 Fluid Mechanics & Open Channel Flow
  if (
    t.includes('fluid') || t.includes('bernoulli') || t.includes('pipe flow') ||
    t.includes('laminar') || t.includes('turbulent') || t.includes('boundary layer') ||
    t.includes('buoyancy') || t.includes('venturimeter') || t.includes('orifice') ||
    t.includes('notches') || t.includes('open channel') || t.includes('hydraulic jump')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-sky-900 via-indigo-950 to-slate-950 text-sky-50',
      badgeBg: 'bg-sky-400/20 text-sky-200 border-sky-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'FLUID MECHANICS & HYDRAULICS',
      examTag: resolvedExamTag,
      pattern: 'hydro-waves',
      MainIcon: Waves,
      WatermarkIcon: Activity,
      accentGlowColor: 'rgba(14, 165, 233, 0.25)',
    };
  }

  // 2.2 Geotechnical & Soil / Foundation Engineering
  if (
    t.includes('soil') || t.includes('foundation') || t.includes('geotechnical') ||
    t.includes('bearing capacity') || t.includes('consolidation') || t.includes('compaction') ||
    t.includes('shear strength') || t.includes('earth pressure') || t.includes('pile') ||
    t.includes('terzaghi') || t.includes('atterberg') || t.includes('permeability')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-amber-950 via-stone-900 to-slate-950 text-amber-50',
      badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'GEOTECHNICAL & FOUNDATION',
      examTag: resolvedExamTag,
      pattern: 'topographic',
      MainIcon: Mountain,
      WatermarkIcon: Layers,
      accentGlowColor: 'rgba(217, 119, 6, 0.25)',
    };
  }

  // 2.3 Highway, Transportation & Pavement Engineering
  if (
    t.includes('highway') || t.includes('transportation') || t.includes('pavement') ||
    t.includes('traffic') || t.includes('cbr') || t.includes('bitumen') ||
    t.includes('geometric design') || t.includes('sight distance') || t.includes('super elevation') ||
    t.includes('railway') || t.includes('airport')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-indigo-50',
      badgeBg: 'bg-indigo-400/20 text-indigo-200 border-indigo-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'HIGHWAY & TRANSPORTATION ENG',
      examTag: resolvedExamTag,
      pattern: 'blueprint-grid',
      MainIcon: Route,
      WatermarkIcon: Milestone,
      accentGlowColor: 'rgba(99, 102, 241, 0.25)',
    };
  }

  // 2.4 Concrete Technology & RCC Structures
  if (
    t.includes('concrete') || t.includes('rcc') || t.includes('reinforced concrete') ||
    t.includes('pre-stressed') || t.includes('prestressed') || t.includes('mix design') ||
    t.includes('slump') || t.includes('curing') || t.includes('admixture') ||
    t.includes('is 456') || t.includes('beam design') || t.includes('slab') || t.includes('column')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-blue-50',
      badgeBg: 'bg-blue-400/20 text-blue-200 border-blue-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'RCC & CONCRETE STRUCTURES',
      examTag: resolvedExamTag,
      pattern: 'blueprint-grid',
      MainIcon: Boxes,
      WatermarkIcon: Building,
      accentGlowColor: 'rgba(59, 130, 246, 0.25)',
    };
  }

  // 2.5 Building Materials & Construction Management
  if (
    t.includes('building material') || t.includes('construction') || t.includes('brick') ||
    t.includes('timber') || t.includes('cement') || t.includes('lime') ||
    t.includes('mortar') || t.includes('aggregate') || t.includes('estimation') ||
    t.includes('costing') || t.includes('valuation') || t.includes('cpm') || t.includes('pert')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-stone-800 via-amber-950 to-slate-950 text-amber-50',
      badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'BUILDING MATERIALS & CONST',
      examTag: resolvedExamTag,
      pattern: 'blueprint-grid',
      MainIcon: Hammer,
      WatermarkIcon: Building2,
      accentGlowColor: 'rgba(245, 158, 11, 0.25)',
    };
  }

  // 2.6 Surveying, Leveling & Geomatics
  if (
    t.includes('survey') || t.includes('leveling') || t.includes('theodolite') ||
    t.includes('contour') || t.includes('compass survey') || t.includes('plane table') ||
    t.includes('triangulation') || t.includes('tachometry') || t.includes('gis') ||
    t.includes('gps') || t.includes('photogrammetry') || t.includes('remote sensing')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-teal-900 via-cyan-950 to-slate-950 text-teal-50',
      badgeBg: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'SURVEYING & GEOMATICS',
      examTag: resolvedExamTag,
      pattern: 'topographic',
      MainIcon: Compass,
      WatermarkIcon: Crosshair,
      accentGlowColor: 'rgba(20, 184, 166, 0.25)',
    };
  }

  // 2.7 Structural Analysis & Strength of Materials / Steel
  if (
    t.includes('structure') || t.includes('structural analysis') || t.includes('som') ||
    t.includes('strength of material') || t.includes('mechanics of solids') || t.includes('steel') ||
    t.includes('truss') || t.includes('moment distribution') || t.includes('slope deflection') ||
    t.includes('bending moment') || t.includes('shear force') || t.includes('deflection')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950 text-blue-50',
      badgeBg: 'bg-blue-400/20 text-blue-200 border-blue-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'STRUCTURAL ANALYSIS & SOM',
      examTag: resolvedExamTag,
      pattern: 'blueprint-grid',
      MainIcon: HardHat,
      WatermarkIcon: Building2,
      accentGlowColor: 'rgba(37, 99, 235, 0.25)',
    };
  }

  // ==========================================
  // 3. MECHANICAL & ELECTRICAL ENGINEERING
  // ==========================================

  // 3.1 Mechanical, Thermal & Automotive
  if (
    t.includes('mechanic') || t.includes('thermo') || t.includes('manufacturing') ||
    t.includes('tom') || t.includes('machine design') || t.includes('automobile') ||
    t.includes('ic engine') || t.includes('refrigeration') || t.includes('cad') ||
    t.includes('cam') || t.includes('welding') || t.includes('workshop') ||
    t.includes('fluid machinery') || t.includes('power plant') || t.includes('heat transfer')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-amber-900 via-slate-900 to-stone-950 text-amber-50',
      badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'MECHANICAL ENGINEERING',
      examTag: resolvedExamTag,
      pattern: 'blueprint-grid',
      MainIcon: Wrench,
      WatermarkIcon: Settings,
      accentGlowColor: 'rgba(245, 158, 11, 0.25)',
    };
  }

  // 3.2 Electrical & Power Systems
  if (
    t.includes('electric') || t.includes('circuit') || t.includes('power system') ||
    t.includes('electromagnet') || t.includes('transformer') || t.includes('generator') ||
    t.includes('motor') || t.includes('control system') || t.includes('switchgear')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-amber-800 via-yellow-950 to-slate-950 text-yellow-50',
      badgeBg: 'bg-yellow-400/20 text-yellow-200 border-yellow-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'ELECTRICAL ENGINEERING',
      examTag: resolvedExamTag,
      pattern: 'circuit-matrix',
      MainIcon: Zap,
      WatermarkIcon: Cpu,
      accentGlowColor: 'rgba(234, 179, 8, 0.25)',
    };
  }

  // 3.3 Electronics, VLSI & Microprocessors
  if (
    t.includes('electron') || t.includes('analog') || t.includes('digital electronics') ||
    t.includes('microprocessor') || t.includes('signal') || t.includes('semiconductor') ||
    t.includes('vlsi') || t.includes('sensor') || t.includes('communication eng')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-cyan-900 via-slate-900 to-indigo-950 text-cyan-50',
      badgeBg: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'ELECTRONICS & COMMUNICATION',
      examTag: resolvedExamTag,
      pattern: 'circuit-matrix',
      MainIcon: Cpu,
      WatermarkIcon: Radio,
      accentGlowColor: 'rgba(6, 182, 212, 0.25)',
    };
  }

  // ==========================================
  // 4. COMPUTER SCIENCE & IT
  // ==========================================
  if (
    t.includes('comput') || t.includes('code') || t.includes('tech') || t.includes('data') ||
    t.includes('cyber') || t.includes('it ') || t.includes('software') || t.includes('program') ||
    t.includes('network') || t.includes('excel') || t.includes('dbms') || t.includes('sql') ||
    t.includes('operating system') || t.includes('hardware') || t.includes('internet')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-cyan-800 via-blue-900 to-slate-950 text-cyan-50',
      badgeBg: 'bg-cyan-400/20 text-cyan-200 border-cyan-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'COMPUTER KNOWLEDGE & IT',
      examTag: resolvedExamTag,
      pattern: 'circuit-matrix',
      MainIcon: Code,
      WatermarkIcon: Laptop,
      accentGlowColor: 'rgba(14, 165, 233, 0.25)',
    };
  }

  // ==========================================
  // 5. MEDICAL, HEALTHCARE & PHARMACY
  // ==========================================
  if (
    t.includes('anatom') || t.includes('nurs') || t.includes('health') || t.includes('medic') ||
    t.includes('pharm') || t.includes('biolog') || t.includes('pathol') || t.includes('doctor') ||
    t.includes('physiol') || t.includes('pediatr') || t.includes('microbio') || t.includes('surgery') ||
    t.includes('pharmacology') || t.includes('obstetric') || t.includes('community health')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-950 text-teal-50',
      badgeBg: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'HEALTHCARE & NURSING SPECIAL',
      examTag: resolvedExamTag,
      pattern: 'hex-mesh',
      MainIcon: Activity,
      WatermarkIcon: HeartPulse,
      accentGlowColor: 'rgba(16, 185, 129, 0.25)',
    };
  }

  // ==========================================
  // 6. LAW, JUDICIARY & CONSTITUTION
  // ==========================================
  if (
    t.includes('polity') || t.includes('constitution') || t.includes('law') ||
    t.includes('judiciary') || t.includes('court') || t.includes('amendment') ||
    t.includes('parliament') || t.includes('crpc') || t.includes('ipc') ||
    t.includes('cpc') || t.includes('evidence act')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-amber-800 via-yellow-950 to-slate-950 text-amber-50',
      badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'INDIAN POLITY & CONSTITUTION',
      examTag: resolvedExamTag,
      pattern: 'heritage-arch',
      MainIcon: Scale,
      WatermarkIcon: Landmark,
      accentGlowColor: 'rgba(245, 158, 11, 0.25)',
    };
  }

  // ==========================================
  // 7. ODISHA GK & STATE AFFAIRS
  // ==========================================
  if (
    t.includes('odisha') || t.includes('opsc') || t.includes('ossc') || t.includes('osssc') ||
    t.includes('kalinga') || t.includes('utkal') || t.includes('puri') || t.includes('bhubaneswar') ||
    t.includes('cuttack') || t.includes('jagannath') || t.includes('odisha history') || t.includes('odisha geography')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-amber-700 via-amber-800 to-orange-950 text-amber-50',
      badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'ODISHA GK & GOVERNANCE',
      examTag: resolvedExamTag,
      pattern: 'heritage-arch',
      MainIcon: MapPin,
      WatermarkIcon: Building2,
      accentGlowColor: 'rgba(234, 88, 12, 0.25)',
    };
  }

  // ==========================================
  // 8. QUANTITATIVE APTITUDE & MATH
  // ==========================================
  if (
    t.includes('math') || t.includes('aptitud') || t.includes('quant') || t.includes('arithmet') ||
    t.includes('algebr') || t.includes('geomet') || t.includes('calculus') || t.includes('number system') ||
    t.includes('percentage') || t.includes('ratio') || t.includes('trigonometr') || t.includes('mensuration')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-800 via-purple-900 to-slate-950 text-purple-50',
      badgeBg: 'bg-purple-400/20 text-purple-200 border-purple-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'QUANTITATIVE APTITUDE',
      examTag: resolvedExamTag,
      pattern: 'dot-matrix',
      MainIcon: PieChart,
      WatermarkIcon: Calculator,
      accentGlowColor: 'rgba(168, 85, 247, 0.25)',
    };
  }

  // ==========================================
  // 9. REASONING & MENTAL ABILITY
  // ==========================================
  if (
    t.includes('reason') || t.includes('logic') || t.includes('analytical') || t.includes('puzzle') ||
    t.includes('syllogism') || t.includes('seating') || t.includes('mental ability') || t.includes('analogy') ||
    t.includes('blood relation') || t.includes('direction') || t.includes('coding decoding')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-purple-800 via-violet-950 to-slate-950 text-purple-50',
      badgeBg: 'bg-purple-400/20 text-purple-200 border-purple-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'REASONING & MENTAL ABILITY',
      examTag: resolvedExamTag,
      pattern: 'dot-matrix',
      MainIcon: Target,
      WatermarkIcon: Zap,
      accentGlowColor: 'rgba(147, 51, 234, 0.25)',
    };
  }

  // ==========================================
  // 10. ODIA & ENGLISH LANGUAGES
  // ==========================================
  if (t.includes('odia') || t.includes('sahitya') || t.includes('vyakaran') || t.includes('bhasa') || t.includes('shabda')) {
    return {
      gradient: 'bg-gradient-to-br from-orange-700 via-amber-900 to-slate-950 text-orange-50',
      badgeBg: 'bg-orange-400/20 text-orange-200 border-orange-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'ODIA LANGUAGE & VYAKARAN',
      examTag: resolvedExamTag,
      pattern: 'heritage-arch',
      MainIcon: Award,
      WatermarkIcon: BookOpen,
      accentGlowColor: 'rgba(234, 88, 12, 0.25)',
    };
  }

  if (t.includes('english') || t.includes('grammar') || t.includes('vocab') || t.includes('comprehension') || t.includes('synonym') || t.includes('antonym') || t.includes('idiom')) {
    return {
      gradient: 'bg-gradient-to-br from-blue-800 via-indigo-950 to-slate-950 text-blue-50',
      badgeBg: 'bg-blue-400/20 text-blue-200 border-blue-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'ENGLISH LANGUAGE & COMPREHENSION',
      examTag: resolvedExamTag,
      pattern: 'blueprint-grid',
      MainIcon: FileText,
      WatermarkIcon: Languages,
      accentGlowColor: 'rgba(37, 99, 235, 0.25)',
    };
  }

  // ==========================================
  // 11. HISTORY, GEOGRAPHY, ECONOMY, SCIENCE
  // ==========================================
  if (t.includes('histor') || t.includes('ancient') || t.includes('medieval') || t.includes('modern') || t.includes('freedom') || t.includes('heritage') || t.includes('culture') || t.includes('national movement')) {
    return {
      gradient: 'bg-gradient-to-br from-orange-800 via-amber-950 to-slate-950 text-orange-50',
      badgeBg: 'bg-orange-400/20 text-orange-200 border-orange-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'INDIAN HISTORY & HERITAGE',
      examTag: resolvedExamTag,
      pattern: 'heritage-arch',
      MainIcon: Compass,
      WatermarkIcon: Landmark,
      accentGlowColor: 'rgba(249, 115, 22, 0.25)',
    };
  }

  if (t.includes('geograph') || t.includes('environment') || t.includes('ecolog') || t.includes('climate') || t.includes('river') || t.includes('forest') || t.includes('ocean') || t.includes('wildlife') || t.includes('national park')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-800 via-teal-950 to-slate-950 text-emerald-50',
      badgeBg: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'GEOGRAPHY & ENVIRONMENT',
      examTag: resolvedExamTag,
      pattern: 'topographic',
      MainIcon: Globe,
      WatermarkIcon: Compass,
      accentGlowColor: 'rgba(16, 185, 129, 0.25)',
    };
  }

  if (t.includes('econom') || t.includes('finance') || t.includes('banking') || t.includes('rbi') || t.includes('budget') || t.includes('gdp') || t.includes('market') || t.includes('commerce') || t.includes('accountancy') || t.includes('audit')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-700 via-slate-900 to-slate-950 text-emerald-50',
      badgeBg: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'INDIAN ECONOMY & COMMERCE',
      examTag: resolvedExamTag,
      pattern: 'dot-matrix',
      MainIcon: Receipt,
      WatermarkIcon: TrendingUp,
      accentGlowColor: 'rgba(16, 185, 129, 0.25)',
    };
  }

  if (t.includes('agri') || t.includes('crop') || t.includes('horticult') || t.includes('farming') || t.includes('agronomy') || t.includes('soil science')) {
    return {
      gradient: 'bg-gradient-to-br from-emerald-800 via-green-950 to-slate-950 text-emerald-50',
      badgeBg: 'bg-emerald-400/20 text-emerald-200 border-emerald-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'AGRICULTURE & ALLIED SCIENCES',
      examTag: resolvedExamTag,
      pattern: 'topographic',
      MainIcon: Sprout,
      WatermarkIcon: Trees,
      accentGlowColor: 'rgba(34, 197, 94, 0.25)',
    };
  }

  if (t.includes('science') || t.includes('physic') || t.includes('chemistr') || t.includes('space') || t.includes('isro') || t.includes('drdo') || t.includes('atom') || t.includes('inventions')) {
    return {
      gradient: 'bg-gradient-to-br from-violet-800 via-indigo-950 to-slate-950 text-violet-50',
      badgeBg: 'bg-violet-400/20 text-violet-200 border-violet-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'GENERAL SCIENCE & TECH',
      examTag: resolvedExamTag,
      pattern: 'orbital-rings',
      MainIcon: Atom,
      WatermarkIcon: Sparkles,
      accentGlowColor: 'rgba(139, 92, 246, 0.25)',
    };
  }

  if (
    (t.includes('police') || t.includes('sub inspector') || t.includes('constable') || t.includes('defence') || t.includes('army') || t.includes('navy') || t.includes('airforce') || t.includes('nda') || t.includes('cds')) &&
    !t.includes('mechanic') && !t.includes('civil') && !t.includes('engineering')
  ) {
    return {
      gradient: 'bg-gradient-to-br from-slate-800 via-amber-950 to-slate-950 text-amber-50',
      badgeBg: 'bg-amber-400/20 text-amber-200 border-amber-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'DEFENCE & POLICE EXAMS',
      examTag: resolvedExamTag,
      pattern: 'blueprint-grid',
      MainIcon: ShieldCheck,
      WatermarkIcon: Target,
      accentGlowColor: 'rgba(217, 119, 6, 0.25)',
    };
  }

  if (t.includes('teach') || t.includes('pedagog') || t.includes('otet') || t.includes('osstet') || t.includes('ctet') || t.includes('b.ed') || t.includes('tgt') || t.includes('pgt')) {
    return {
      gradient: 'bg-gradient-to-br from-indigo-700 via-blue-900 to-slate-950 text-indigo-50',
      badgeBg: 'bg-indigo-400/20 text-indigo-200 border-indigo-400/40',
      badgeText: explicitSubject ? explicitSubject.toUpperCase() : 'TEACHING & PEDAGOGY',
      examTag: resolvedExamTag,
      pattern: 'dot-matrix',
      MainIcon: BookOpen,
      WatermarkIcon: GraduationCap,
      accentGlowColor: 'rgba(99, 102, 241, 0.25)',
    };
  }

  // ==========================================
  // 12. DYNAMIC TITLECASED SMART FALLBACK
  // ==========================================
  const fallbackBadge = explicitSubject 
    ? explicitSubject.toUpperCase() 
    : (title ? title.trim().toUpperCase() : 'COMPREHENSIVE PRACTICE');

  return {
    gradient: 'bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-indigo-50',
    badgeBg: 'bg-indigo-400/20 text-indigo-200 border-indigo-400/40',
    badgeText: fallbackBadge,
    examTag: resolvedExamTag,
    pattern: 'blueprint-grid',
    MainIcon: Sparkles,
    WatermarkIcon: BookOpen,
    accentGlowColor: 'rgba(99, 102, 241, 0.25)',
  };
};
