import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let isScrollingTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (lenisInstance) return lenisInstance;

  // Initialize Lenis Smooth Scroll Engine
  lenisInstance = new Lenis({
    duration: 0.6,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 1.1,
    touchMultiplier: 1.2,
  });

  // High performance RAF loop
  function raf(time: number) {
    lenisInstance?.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  // Active Scroll Guard: Toggle 'is-scrolling' class to lock hover recalculations and repaints during scroll
  lenisInstance.on('scroll', () => {
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

  return lenisInstance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
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
}
