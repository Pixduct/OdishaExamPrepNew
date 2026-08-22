import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let isScrollingTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;

let lastWheelDeltaY = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('wheel', (e) => {
    lastWheelDeltaY = e.deltaY;
  }, { capture: true, passive: true });
}

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (lenisInstance) return lenisInstance;

  // Initialize Lenis Smooth Scroll Engine — 0ms Zero-Delay 120FPS Continuous Momentum Flow
  lenisInstance = new Lenis({
    lerp: 0.16,
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 0, // Keeps 0ms native touch latency on mobile/tablets
    allowNestedScroll: true,
    duration: 1.1,
  });

  // Apply root classes immediately for 0ms layout coordination
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('lenis', 'lenis-smooth');
  }

  // High performance RAF loop synced with display refresh rate (60Hz / 90Hz / 120Hz / 144Hz)
  function raf(time: number) {
    lenisInstance?.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  // Active Scroll Guard: Toggle 'is-scrolling' class to lock hover recalculations and repaints during scroll
  lenisInstance.on('scroll', () => {
    if (typeof window !== 'undefined' && window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
    if (typeof document !== 'undefined' && !document.body.classList.contains('is-scrolling')) {
      document.body.classList.add('is-scrolling');
    }

    if (isScrollingTimer) clearTimeout(isScrollingTimer);
    isScrollingTimer = setTimeout(() => {
      if (typeof document !== 'undefined') {
        document.body.classList.remove('is-scrolling');
      }
    }, 120);
  });

  // Watch document layout changes to dynamically resize scroll bounds instantly
  if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
    try {
      resizeObserver = new ResizeObserver(() => {
        lenisInstance?.resize();
      });
      if (document.body) {
        resizeObserver.observe(document.body);
      }
    } catch {
      // Graceful fallback if ResizeObserver is not supported
    }
  }

  return lenisInstance;
}

export function getLenis(): Lenis | null {
  if (!lenisInstance && typeof window !== 'undefined') {
    return initLenis();
  }
  return lenisInstance;
}

export function stopLenis() {
  if (lenisInstance) {
    lenisInstance.stop();
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove('is-scrolling');
  }
}

export function startLenis() {
  if (lenisInstance) {
    lenisInstance.start();
  }
}

export function destroyLenis() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove('is-scrolling');
    document.documentElement.classList.remove('lenis', 'lenis-stopped', 'lenis-smooth', 'lenis-scrolling');
  }
}


