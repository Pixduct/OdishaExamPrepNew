import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let isScrollingTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;

let lastWheelDeltaY = 0;

if (typeof window !== 'undefined') {
  window.addEventListener('wheel', (e) => {
    lastWheelDeltaY = e.deltaY;
  }, { capture: true, passive: true });
}

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (lenisInstance) return lenisInstance;

  // Initialize Lenis Smooth Scroll Engine — Antigravity Micro-Distance Continuous Flow Engine
  lenisInstance = new Lenis({
    lerp: 0.18,
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 0,
    allowNestedScroll: true,
  });

  // High performance RAF loop
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
    }, 150);
  });

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      if (window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY);
      }
    }, { passive: true });
  }

  return lenisInstance;
}

export function getLenis(): Lenis | null {
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
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove('is-scrolling');
    document.documentElement.classList.remove('lenis', 'lenis-stopped', 'lenis-smooth', 'lenis-scrolling');
  }
}

