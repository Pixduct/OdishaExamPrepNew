/**
 * ==============================================================================
 * OdishaExamPrep Platform Invariant & Anti-Regression Verification Engine
 * ==============================================================================
 * This script runs in <200ms before builds or linting. It performs static,
 * deterministic checks to guarantee that foundational platform features
 * (bottom navigation, YouTube masterclass fallback, vector background canvas,
 * route parity, and core modals) are never accidentally deleted, broken, or hidden.
 *
 * If any AI assistant or developer introduces a regression, this script immediately
 * halts the build and prints an actionable, human-readable diagnostic banner
 * with the exact file, line number, and one-line fix instruction.
 * ==============================================================================
 */

import fs from 'node:fs';
import path from 'node:path';

// ANSI terminal color codes for clear, explainable diagnostic boxes
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

const ROOT_DIR = process.cwd();
const APP_TSX_PATH = path.join(ROOT_DIR, 'src', 'App.tsx');
const YOUTUBE_CAROUSEL_PATH = path.join(ROOT_DIR, 'src', 'components', 'YouTubeCarousel.tsx');
const ROUTES_CONFIG_PATH = path.join(ROOT_DIR, 'src', 'lib', 'routes-config.ts');

let totalChecks = 0;
let passedChecks = 0;

interface InvariantViolation {
  invariantId: number;
  title: string;
  category: string;
  filePath: string;
  line?: number;
  offendingCode?: string;
  reason: string;
  howToFix: string;
}

function printBanner() {
  console.log(`\n${CYAN}${BOLD}==============================================================================${RESET}`);
  console.log(`${CYAN}${BOLD} 🛡️  ODISHAEXAMPREP — PLATFORM INVARIANT & REGRESSION SCANNER${RESET}`);
  console.log(`${DIM} Enforcing 25 non-negotiable platform pillars & zero-blank fallback contracts...${RESET}`);
  console.log(`${CYAN}${BOLD}==============================================================================${RESET}\n`);
}

function reportViolationAndExit(v: InvariantViolation): never {
  console.error(`\n${RED}${BOLD}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}`);
  console.error(`${RED}${BOLD}║ 🛑 RESTRICTION TRIGGERED: AI ATTEMPTED TO BREAK A WORKING FEATURE             ║${RESET}`);
  console.error(`${RED}${BOLD}╠══════════════════════════════════════════════════════════════════════════════╣${RESET}`);
  console.error(`${RED}║ Invariant #${v.invariantId}: ${BOLD}${v.title}${RESET}`);
  console.error(`${RED}║ Category:     ${v.category}${RESET}`);
  console.error(`${RED}║ File:         ${CYAN}${v.filePath}${v.line ? ` (Line ${v.line})` : ''}${RESET}`);
  if (v.offendingCode) {
    console.error(`${RED}║ Offense:      ${YELLOW}${v.offendingCode.trim()}${RESET}`);
  }
  console.error(`${RED}║ Why:          ${v.reason}${RESET}`);
  console.error(`${RED}║ Fix:          ${GREEN}${BOLD}${v.howToFix}${RESET}`);
  console.error(`${RED}${BOLD}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}\n`);
  console.error(`${RED}Build halted to prevent regression. Fix the invariant above and re-run build.${RESET}\n`);
  process.exit(1);
}

function assertInvariant(
  id: number,
  title: string,
  category: string,
  condition: boolean,
  details: {
    filePath: string;
    line?: number;
    offendingCode?: string;
    reason: string;
    howToFix: string;
  }
) {
  totalChecks++;
  if (!condition) {
    reportViolationAndExit({
      invariantId: id,
      title,
      category,
      ...details,
    });
  }
  passedChecks++;
  console.log(` ${GREEN}✔${RESET} [${DIM}#${id.toString().padStart(2, '0')}${RESET}] ${BOLD}${title}${RESET}`);
}

function runVerification() {
  printBanner();

  if (!fs.existsSync(APP_TSX_PATH)) {
    console.error(`${RED}Error: Cannot find src/App.tsx at ${APP_TSX_PATH}${RESET}`);
    process.exit(1);
  }

  const appTsxContent = fs.readFileSync(APP_TSX_PATH, 'utf-8');
  const appTsxLines = appTsxContent.split('\n');

  const youtubeContent = fs.existsSync(YOUTUBE_CAROUSEL_PATH) 
    ? fs.readFileSync(YOUTUBE_CAROUSEL_PATH, 'utf-8') 
    : '';
  const youtubeLines = youtubeContent.split('\n');

  // ============================================================================
  // CATEGORY A: NAVIGATION & SHELL VISIBILITY
  // ============================================================================

  // 1. Bottom Nav Universal Visibility (No uninstructed md:hidden on motion.nav bottom dock)
  let bottomNavHasResponsiveHide = false;
  let bottomNavLine = 0;
  let bottomNavSnippet = '';

  for (let i = 0; i < appTsxLines.length; i++) {
    const line = appTsxLines[i];
    if (line.includes('<motion.nav')) {
      // Collect the entire tag up to the closing '>'
      let tagBlock = '';
      for (let j = i; j < Math.min(i + 20, appTsxLines.length); j++) {
        tagBlock += ' ' + appTsxLines[j];
        if (appTsxLines[j].includes('>')) break;
      }
      if (tagBlock.includes('fixed bottom-0') || tagBlock.includes('rounded-t-[2rem]')) {
        if (/\b(md:hidden|lg:hidden|sm:hidden)\b/.test(tagBlock)) {
          bottomNavHasResponsiveHide = true;
          bottomNavLine = i + 1;
          bottomNavSnippet = tagBlock.trim().slice(0, 120);
          break;
        }
      }
    }
  }

  assertInvariant(
    1,
    'Bottom Navigation Universal Visibility (Desktop & Mobile)',
    'Navigation & Shell',
    !bottomNavHasResponsiveHide,
    {
      filePath: 'src/App.tsx',
      line: bottomNavLine,
      offendingCode: bottomNavSnippet,
      reason: "Hiding the bottom dock on desktop (>=768px) cuts off desktop users from primary tabs (Home, Study Plan, AI Mentor).",
      howToFix: "Remove 'md:hidden', 'lg:hidden', or 'sm:hidden' from the <motion.nav> className.",
    }
  );

  // 2. 6 Core Primary Tabs Present in Bottom Nav
  const hasHomeTab = appTsxContent.includes("nav.home") || appTsxContent.includes("LayoutDashboard");
  const hasStudyPlanTab = appTsxContent.includes("nav.studyPlan") || (appTsxContent.includes("Target") && appTsxContent.includes("'courses'"));
  const hasAnalyticsTab = appTsxContent.includes("nav.analytics") || appTsxContent.includes("BarChart3");
  const hasHistoryTab = appTsxContent.includes("nav.history") || appTsxContent.includes("History");
  const hasLibraryTab = appTsxContent.includes("nav.library") || appTsxContent.includes("BookMarked");
  const hasAiMentorTab = appTsxContent.includes("nav.aiMentor") || appTsxContent.includes("Sparkles");

  assertInvariant(
    2,
    'All 6 Core Primary Tabs Defined in Bottom Nav Dock',
    'Navigation & Shell',
    hasHomeTab && hasStudyPlanTab && hasAnalyticsTab && hasHistoryTab && hasLibraryTab && hasAiMentorTab,
    {
      filePath: 'src/App.tsx',
      reason: 'All 6 primary tabs (Home, Study Plan, Analytics, History, Library, AI Mentor) must remain in the bottom dock.',
      howToFix: 'Ensure all 6 tab buttons are present inside <motion.nav> in src/App.tsx.',
    }
  );

  // 3. Collapsible Chevron Minimize & Restore Controls Present
  const hasMinimizeBtn = appTsxContent.includes('setIsBottomNavVisible(false)');
  const hasRestoreBtn = appTsxContent.includes('setIsBottomNavVisible(true)');

  assertInvariant(
    3,
    'Collapsible Navigation Toggle & Restore Trigger Tabs',
    'Navigation & Shell',
    hasMinimizeBtn && hasRestoreBtn,
    {
      filePath: 'src/App.tsx',
      reason: 'Users must be able to minimize and restore the bottom dock smoothly with ChevronDown/ChevronUp.',
      howToFix: 'Ensure setIsBottomNavVisible(false) and setIsBottomNavVisible(true) controls are preserved in src/App.tsx.',
    }
  );

  // 4. Main Viewport Dynamic Clearance Padding
  const hasDynamicMainPadding = appTsxContent.includes('isBottomNavVisible') && (appTsxContent.includes('pb-20') || appTsxContent.includes('pb-24') || appTsxContent.includes('pb-28'));

  assertInvariant(
    4,
    'Main Viewport Dynamic Bottom Clearance Padding',
    'Navigation & Shell',
    hasDynamicMainPadding,
    {
      filePath: 'src/App.tsx',
      reason: 'Without dynamic bottom padding, the fixed bottom dock will occlude the lower content of the main dashboard.',
      howToFix: "Use `isBottomNavVisible ? 'pb-20 sm:pb-24 lg:pb-28' : 'pb-6 sm:pb-12 lg:pb-16'` on <main>.",
    }
  );

  // 5. Top Navbar Brand Identity
  const hasBrandLogo = appTsxContent.includes('Odisha') && appTsxContent.includes('Exam') && appTsxContent.includes('Prep');

  assertInvariant(
    5,
    'Top Navbar Brand Identity & Logo Mark',
    'Navigation & Shell',
    hasBrandLogo,
    {
      filePath: 'src/App.tsx',
      reason: 'The official OdishaExamPrep brand identity and header must remain intact.',
      howToFix: 'Verify the Navbar component renders the official BookOpen logo and OdishaExamPrep wordmark.',
    }
  );

  // 6. Top Navbar Desktop Quick Links (Current Affairs & Blog)
  const hasCurrentAffairsNav = appTsxContent.includes("to=\"/current-affairs\"") || appTsxContent.includes("nav.currentAffairs");
  const hasBlogNav = appTsxContent.includes("to=\"/blog\"") || appTsxContent.includes("nav.blog");

  assertInvariant(
    6,
    'Top Navbar Direct Links (Current Affairs & Blog)',
    'Navigation & Shell',
    hasCurrentAffairsNav && hasBlogNav,
    {
      filePath: 'src/App.tsx',
      reason: 'Authenticated and guest users must have direct links to Current Affairs and Blog in the top header.',
      howToFix: 'Ensure Link to /current-affairs and /blog are rendered in the desktop nav bar.',
    }
  );

  // 7. Header Utility Matrix (Search, Notifications, Streak, Language, Theme)
  const hasSearchBtn = appTsxContent.includes('setIsSearchModalOpen');
  const hasNotificationCenter = appTsxContent.includes('<NotificationCenter');
  const hasStreakTrigger = appTsxContent.includes('setIsStreakModalOpen');
  const hasThemeToggle = appTsxContent.includes('<ThemeToggle');
  const hasLangToggle = appTsxContent.includes('<LanguageToggle');

  assertInvariant(
    7,
    'Header Utility Matrix (Search, Notifications, Streak, Theme, Lang)',
    'Navigation & Shell',
    hasSearchBtn && hasNotificationCenter && hasStreakTrigger && hasThemeToggle && hasLangToggle,
    {
      filePath: 'src/App.tsx',
      reason: 'The header utility cluster must provide instant access to Search, Notifications, Streak, Theme, and Language.',
      howToFix: 'Keep NotificationCenter, ThemeToggle, LanguageToggle, and streak triggers mounted in Navbar.',
    }
  );

  // 8. Mobile Navigation Drawer Matrix
  const hasMobileMenuDrawer = appTsxContent.includes('mobileMenuOpen') && appTsxContent.includes('setMobileMenuOpen');

  assertInvariant(
    8,
    'Mobile Navigation Drawer with Staggered Links',
    'Navigation & Shell',
    hasMobileMenuDrawer,
    {
      filePath: 'src/App.tsx',
      reason: 'Mobile viewports require the animated drawer menu for navigation, video tutorials, and support.',
      howToFix: 'Preserve mobileMenuOpen state and the AnimatePresence drawer in Navbar.',
    }
  );

  // ============================================================================
  // CATEGORY B: CANVAS & VECTOR BACKGROUND CONTINUITY
  // ============================================================================

  // 9. Full-Screen Vector Canvas Dot Grid Present in Dashboard
  const hasVectorCanvasGrid = appTsxContent.includes('radial-gradient(#cbd5e1_1.2px,transparent_1.2px)') || appTsxContent.includes('radial-gradient(#94a3b8_1.2px,transparent_1.2px)');

  assertInvariant(
    9,
    'Vector Canvas Dot Grid Matrix Overlay ([radial-gradient])',
    'Vector Canvas & Visuals',
    hasVectorCanvasGrid,
    {
      filePath: 'src/App.tsx',
      reason: 'The signature academic vector canvas grid is an essential design token that must be visible on the dashboard.',
      howToFix: 'Ensure bg-[radial-gradient(#cbd5e1_1.2px,transparent_1.2px)] is mounted on both landing and dashboard layouts.',
    }
  );

  // 10. Ambient HSL Glow Orbs Mounted
  const hasAmbientOrbs = appTsxContent.includes('bg-brand-300/20') && appTsxContent.includes('blur-3xl');

  assertInvariant(
    10,
    'Dual Ambient HSL Glow Lighting Orbs (blur-3xl)',
    'Vector Canvas & Visuals',
    hasAmbientOrbs,
    {
      filePath: 'src/App.tsx',
      reason: 'Ambient glow lighting orbs establish the platform visual depth and dark-mode lighting hierarchy.',
      howToFix: 'Keep the fixed top-20 and bottom-20 blur-3xl glow orbs mounted in the background container.',
    }
  );

  // 11. Floating Academic Study Watermarks Present
  const hasWatermarks = appTsxContent.includes('GraduationCap') && appTsxContent.includes('Compass') && (appTsxContent.includes('opacity-[0.08]') || appTsxContent.includes('opacity-[0.03]'));

  assertInvariant(
    11,
    'Floating Academic Study Vector Watermarks',
    'Vector Canvas & Visuals',
    hasWatermarks,
    {
      filePath: 'src/App.tsx',
      reason: 'Watermark study icons (GraduationCap, Compass, BookOpen, Award) establish academic immersion.',
      howToFix: 'Preserve the fixed pointer-events-none watermark icons container in App.tsx.',
    }
  );

  // 12. Hardware Mouse Tracking & Vector Cursor Follower
  const hasMouseTracking = appTsxContent.includes('<MouseTrackingCanvas') && appTsxContent.includes('<VectorCursorFollower');

  assertInvariant(
    12,
    'Hardware-Accelerated Mouse Spotlight & Vector Cursor Follower',
    'Vector Canvas & Visuals',
    hasMouseTracking,
    {
      filePath: 'src/App.tsx',
      reason: 'Interactive mouse tracking provides the dynamic spotlight glow that follows the user cursor.',
      howToFix: 'Mount <MouseTrackingCanvas /> and <VectorCursorFollower /> in the main authenticated container.',
    }
  );

  // ============================================================================
  // CATEGORY C: DEFENSIVE COMPONENT FALLBACKS (ZERO-BLANK GUARANTEE)
  // ============================================================================

  // 13. YouTube Carousel Curated Video Fallback Defined
  const hasFallbackIds = youtubeContent.includes('DEFAULT_FALLBACK_VIDEO_IDS') && youtubeContent.includes('jNQXAC9IVRw');

  assertInvariant(
    13,
    'YouTube Carousel Curated Video Fallback Guarantee',
    'Defensive Architecture',
    hasFallbackIds,
    {
      filePath: 'src/components/YouTubeCarousel.tsx',
      reason: 'If the database settings record is empty, YouTubeCarousel must fall back to curated videos rather than disappearing.',
      howToFix: "Define DEFAULT_FALLBACK_VIDEO_IDS = ['jNQXAC9IVRw', 'dQw4w9WgXcQ', 'EngW7tCbLHY'] and fallback when videoIds is empty.",
    }
  );

  // 14. YouTube Carousel Mounted in Dashboard Home View
  const hasCarouselInHome = appTsxContent.includes('<YouTubeCarousel');

  assertInvariant(
    14,
    'YouTube Carousel Mounted in Authenticated Home Dashboard',
    'Defensive Architecture',
    hasCarouselInHome,
    {
      filePath: 'src/App.tsx',
      reason: 'The masterclass video carousel must remain mounted above the Admin Control Center on the Home dashboard.',
      howToFix: 'Ensure <YouTubeCarousel videoIds={...} /> is called inside DashboardContent when !selectedExam.',
    }
  );

  // 15. YouTube Carousel Infinite Scroll Physics (Tripled Array)
  const hasTripledArray = youtubeContent.includes('[...sourceVideos, ...sourceVideos, ...sourceVideos]');

  assertInvariant(
    15,
    'YouTube Carousel Infinite Loop Auto-Scroll Physics',
    'Defensive Architecture',
    hasTripledArray,
    {
      filePath: 'src/components/YouTubeCarousel.tsx',
      reason: 'The infinite scroll loop requires a tripled card array with modulo wrap to prevent jump cuts during drag/auto-scroll.',
      howToFix: 'Ensure items = [...sourceVideos, ...sourceVideos, ...sourceVideos] is used in YouTubeCarousel.tsx.',
    }
  );

  // 16. Dynamic Video Title Resolution via NoEmbed
  const hasNoEmbedQuery = youtubeContent.includes('noembed.com/embed');

  assertInvariant(
    16,
    'Dynamic YouTube Title Ingestion via NoEmbed API',
    'Defensive Architecture',
    hasNoEmbedQuery,
    {
      filePath: 'src/components/YouTubeCarousel.tsx',
      reason: 'Authentic titles must be resolved dynamically so custom admin video IDs automatically display proper names.',
      howToFix: 'Preserve the fetch(noembed.com/embed?url=...) hook in YouTubeCarousel.tsx.',
    }
  );

  // ============================================================================
  // CATEGORY D: ROUTE COVERAGE & MODAL ACCESSIBILITY
  // ============================================================================

  // 17. Core Route Completeness
  const hasAdminRoute = appTsxContent.includes('ROUTE_PATHS.ADMIN') || appTsxContent.includes('path="/admin"');
  const hasExamDetailRoute = appTsxContent.includes('ROUTE_PATHS.EXAM_DETAIL') || appTsxContent.includes('path="/exams/:id"');
  const hasBlogRoute = appTsxContent.includes('ROUTE_PATHS.BLOG') || appTsxContent.includes('path="/blog"');
  const hasCurrentAffairsRoute = appTsxContent.includes('ROUTE_PATHS.CURRENT_AFFAIRS') || appTsxContent.includes('path="/current-affairs"');
  const hasFlashcardsRoute = appTsxContent.includes('ROUTE_PATHS.FLASHCARDS') || appTsxContent.includes('path="/flashcards"');
  const hasPrivacyRoute = appTsxContent.includes('ROUTE_PATHS.PRIVACY_POLICY') || appTsxContent.includes('path="/privacy-policy"');
  const hasTermsRoute = appTsxContent.includes('ROUTE_PATHS.TERMS_OF_SERVICE') || appTsxContent.includes('path="/terms-of-service"');
  const hasRefundRoute = appTsxContent.includes('ROUTE_PATHS.REFUND_POLICY') || appTsxContent.includes('path="/refund-policy"');

  assertInvariant(
    17,
    '100% Core Route Mapping in AnimatedRoutes',
    'Route Integrity',
    hasAdminRoute && hasExamDetailRoute && hasBlogRoute && hasCurrentAffairsRoute && hasFlashcardsRoute && hasPrivacyRoute && hasTermsRoute && hasRefundRoute,
    {
      filePath: 'src/App.tsx',
      reason: 'All platform routes must have an active matching <Route> in <AnimatedRoutes>.',
      howToFix: 'Verify all ROUTE_PATHS constants from routes-config.ts are mapped to their respective page components.',
    }
  );

  // 18. Global Search Keyboard Shortcut Listener (Ctrl+K / ⌘K)
  const hasGlobalSearchShortcut = appTsxContent.includes('key.toLowerCase() === \'k\'');

  assertInvariant(
    18,
    'Global Search Keyboard Shortcut Listener (Ctrl+K / ⌘K)',
    'Global Modals',
    hasGlobalSearchShortcut,
    {
      filePath: 'src/App.tsx',
      reason: 'Users rely on Ctrl+K / Cmd+K to quickly search exams, mock tests, and questions from anywhere.',
      howToFix: 'Keep the window.addEventListener(\'keydown\') listener for Ctrl+K in Navbar in App.tsx.',
    }
  );

  // 19. Daily Streak State Engine & Modal Trigger
  const hasStreakEngine = appTsxContent.includes('getStreakState') && appTsxContent.includes('oep-open-streak-modal');

  assertInvariant(
    19,
    'Daily Preparation Streak Manager & Modal Trigger',
    'Global Modals',
    hasStreakEngine,
    {
      filePath: 'src/App.tsx',
      reason: 'The daily streak engine motivates daily candidate study and provides gamified progress rewards.',
      howToFix: 'Preserve getStreakState and the oep-open-streak-modal event listener in App.tsx.',
    }
  );

  // 20. Sticky AI Companion Mounted on Content Routes
  const hasStickyCompanion = appTsxContent.includes('<StickyAICompanion');

  assertInvariant(
    20,
    'Sticky AI Companion Floating Widget',
    'Global Modals',
    hasStickyCompanion,
    {
      filePath: 'src/App.tsx',
      reason: 'Candidates require immediate access to the AI Mentor companion across all learning pages.',
      howToFix: 'Mount <StickyAICompanion isBottomNavVisible={...} /> in App.tsx outside of admin routes.',
    }
  );

  // 21. WhatsApp Direct Support Trigger
  const hasWhatsAppSupport = appTsxContent.includes('<WhatsAppButton');

  assertInvariant(
    21,
    'WhatsApp Direct Candidate Support Floating Action Button',
    'Global Modals',
    hasWhatsAppSupport,
    {
      filePath: 'src/App.tsx',
      reason: 'Direct WhatsApp support is required for instant candidate help, payment issues, and queries.',
      howToFix: 'Keep <WhatsAppButton /> mounted in App.tsx outside of admin routes.',
    }
  );

  // 22. Push Notification Permission Engine
  const hasPushNotificationEngine = appTsxContent.includes('<PushPermissionPrompt');

  assertInvariant(
    22,
    'Web Push Notification Permission Prompt Engine',
    'Service Architecture',
    hasPushNotificationEngine,
    {
      filePath: 'src/App.tsx',
      reason: 'Push notifications alert candidates about breaking exam dates, admit cards, and daily current affairs.',
      howToFix: 'Keep <PushPermissionPrompt userId={user.id} /> mounted for authenticated users.',
    }
  );

  // 23. Candidate Data Reset & Password Recovery Modal
  const hasResetModal = appTsxContent.includes('showResetModal') && appTsxContent.includes('Create New Password');

  assertInvariant(
    23,
    'Password Reset & Account Security Modal',
    'Security & Auth',
    hasResetModal,
    {
      filePath: 'src/App.tsx',
      reason: 'Candidates must be able to securely update their passwords and recover accounts.',
      howToFix: 'Preserve showResetModal and the password update form in App.tsx.',
    }
  );

  // 24. Legal Compliance Pages Render PageLayout with Return Navigation
  const privacyContent = fs.existsSync(path.join(ROOT_DIR, 'src', 'PrivacyPolicy.tsx'))
    ? fs.readFileSync(path.join(ROOT_DIR, 'src', 'PrivacyPolicy.tsx'), 'utf-8')
    : '';
  const hasLegalPageLayout = privacyContent.includes('<PageLayout');

  assertInvariant(
    24,
    'Statutory Legal Pages Layout Conformance (PageLayout)',
    'Compliance & Shell',
    hasLegalPageLayout,
    {
      filePath: 'src/PrivacyPolicy.tsx',
      reason: 'Privacy policy, terms of service, and refund policy must wrap inside PageLayout with return navigation.',
      howToFix: 'Ensure PrivacyPolicy, TermsOfService, and RefundPolicy wrap content in <PageLayout backTo={{...}}>.',
    }
  );

  // 25. High-Precision Virtual Office Shortcut (Ctrl+Alt+O)
  const hasVirtualOfficeShortcut = appTsxContent.includes('virtual-office.html');

  assertInvariant(
    25,
    'Virtual Office Operations Deck Launcher (Ctrl+Alt+O)',
    'Operations & Tools',
    hasVirtualOfficeShortcut,
    {
      filePath: 'src/App.tsx',
      reason: 'Administrators require quick access to the 3D autonomous automation simulation deck.',
      howToFix: 'Preserve the Ctrl+Alt+O shortcut opening /virtual-office.html in App.tsx.',
    }
  );

  // Summary
  console.log(`\n${GREEN}${BOLD}==============================================================================${RESET}`);
  console.log(`${GREEN}${BOLD} ✔ ALL ${passedChecks}/${totalChecks} PLATFORM INVARIANTS VERIFIED CLEANLY (${(process.uptime() * 1000).toFixed(0)}ms)${RESET}`);
  console.log(`${DIM} Zero regressions detected. All navigation, fallbacks, and layouts are intact.${RESET}`);
  console.log(`${GREEN}${BOLD}==============================================================================${RESET}\n`);
}

runVerification();
