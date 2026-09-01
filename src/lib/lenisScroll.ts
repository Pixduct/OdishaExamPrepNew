import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let isScrollingTimer: ReturnType<typeof setTimeout> | null = null;
let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let globalScrollHandler: (() => void) | null = null;

let lastWheelDeltaY = 0;

export function markScrolling() {
  if (typeof document === 'undefined') return;
  if (!document.body.classList.contains('is-scrolling')) {
    document.body.classList.add('is-scrolling');
  }
  if (isScrollingTimer) clearTimeout(isScrollingTimer);
  isScrollingTimer = setTimeout(() => {
    if (typeof document !== 'undefined') {
      document.body.classList.remove('is-scrolling');
    }
  }, 100);
}

if (typeof window !== 'undefined') {
  window.addEventListener('wheel', (e) => {
    lastWheelDeltaY = e.deltaY;
  }, { capture: true, passive: true });
}

export function initLenis(): Lenis | null {
  if (typeof window === 'undefined') return null;
  if (lenisInstance) return lenisInstance;

  // On touch/mobile devices, rely 100% on native OS compositor hardware momentum scrolling (60–120Hz)
  const isTouch = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;
  if (isTouch) {
    return null;
  }

  // Initialize Lenis Smooth Scroll Engine strictly for desktop/laptop mouse wheel momentum
  lenisInstance = new Lenis({
    lerp: 0.16,
    smoothWheel: true,
    wheelMultiplier: 1.0,
    touchMultiplier: 0,
    allowNestedScroll: true,
    duration: 1.1,
  });

  // Apply root classes immediately on desktop
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('lenis', 'lenis-smooth');
  }

  // High performance RAF loop synced with display refresh rate on desktop
  function raf(time: number) {
    lenisInstance?.raf(time);
    rafId = requestAnimationFrame(raf);
  }
  rafId = requestAnimationFrame(raf);

  // Active Scroll Guard on Lenis Engine (desktop mouse wheel only)
  lenisInstance.on('scroll', () => {
    if (typeof window !== 'undefined' && window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
    markScrolling();
  });

  // Watch document layout changes on desktop
  if (typeof window !== 'undefined' && typeof ResizeObserver !== 'undefined') {
    try {
      resizeObserver = new ResizeObserver(() => {
        lenisInstance?.resize();
      });
      if (document.body) {
        resizeObserver.observe(document.body);
      }
    } catch {
      // Graceful fallback
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
  if (globalScrollHandler && typeof window !== 'undefined') {
    window.removeEventListener('scroll', globalScrollHandler, true);
    window.removeEventListener('touchmove', globalScrollHandler, true);
    globalScrollHandler = null;
  }
  if (isScrollingTimer) {
    clearTimeout(isScrollingTimer);
    isScrollingTimer = null;
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


