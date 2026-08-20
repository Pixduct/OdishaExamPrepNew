import React, { useRef, useCallback, useEffect } from 'react';
import { useTheme } from '../lib/themeStore';

interface DynamicVectorCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  roundedClass?: string;
  enableTilt?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

// Parses any rgba(...) string and returns it with a new alpha value
const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/, `${alpha})`);
  }
  if (color.startsWith('rgb')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  return `rgba(37, 99, 235, ${alpha})`;
};

export const DynamicVectorCard: React.FC<DynamicVectorCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(37, 99, 235, 0.25)',
  roundedClass = 'rounded-2xl sm:rounded-[2.5rem]',
  enableTilt = true,
  onClick,
  style = {}
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const ambientRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const isHovered = useRef(false);
  const rectRef = useRef<DOMRect | null>(null);
  const mousePosRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [theme] = useTheme();
  const isDark = theme === 'dark';

  // Ambient layer config ─ soft spread fading to 0% alpha well before card edge
  const ambientRadius = isDark ? 360 : 300;
  const coreAlpha = isDark ? 0.40 : 0.22;
  const midAlpha = isDark ? 0.12 : 0.06;

  const triggerShineSweep = useCallback(() => {
    const sh = shineRef.current;
    if (!sh) return;
    // Reset animation to allow replaying
    sh.style.animation = 'none';
    // Force reflow so the browser registers the reset
    void sh.getBoundingClientRect();
    // Trigger the sweep — identical timing to premium-shine-container::after
    sh.style.animation = 'shine-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
  }, []);

  // Frame update synced to display refresh rate (60Hz/120Hz/144Hz) with 0ms lag
  const updateCardState = useCallback(() => {
    rafIdRef.current = null;
    const card = cardRef.current;
    if (!card || !isHovered.current || !mousePosRef.current) return;

    const rect = rectRef.current || card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const pxX = mousePosRef.current.clientX - rect.left;
    const pxY = mousePosRef.current.clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, (pxX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (pxY / rect.height) * 100));

    // ── Ambient + Cursor Warmth (single merged layer) ─────────────
    if (ambientRef.current) {
      ambientRef.current.style.background =
        `radial-gradient(${ambientRadius}px circle at ${pctX.toFixed(1)}% ${pctY.toFixed(1)}%,` +
        ` ${withAlpha(glowColor, coreAlpha)} 0%,` +
        ` ${withAlpha(glowColor, midAlpha)} 30%,` +
        ` transparent 60%)`;
    }

    // ── 3-D Tilt: Instant 0ms synchronization ─────────────────────
    if (enableTilt && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches) {
      const cX = rect.width / 2;
      const cY = rect.height / 2;
      const rotX = (((cY - pxY) / cY) * 3.5).toFixed(2);
      const rotY = (((pxX - cX) / cX) * 3.5).toFixed(2);
      card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.015, 1.015, 1.015)`;
    } else {
      card.style.transform = `perspective(1000px) scale3d(1.015, 1.015, 1.015)`;
    }
  }, [ambientRadius, coreAlpha, midAlpha, glowColor, enableTilt]);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    if (typeof document !== 'undefined' && document.body.classList.contains('is-scrolling')) return;

    isHovered.current = true;
    rectRef.current = card.getBoundingClientRect();
    mousePosRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (ambientRef.current) {
      ambientRef.current.style.opacity = '1';
    }

    // Instant tracking: eliminate CSS transition delay so card tracks cursor with 0ms latency
    card.style.transition = 'none';

    // ── Premium Shine Sweep ── fires once per hover entry ────────
    triggerShineSweep();

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(updateCardState);
    }
  }, [triggerShineSweep, updateCardState]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof document !== 'undefined' && document.body.classList.contains('is-scrolling')) return;

    mousePosRef.current = { clientX: e.clientX, clientY: e.clientY };

    if (!isHovered.current) {
      handleMouseEnter(e);
      return;
    }

    const card = cardRef.current;
    if (card && card.style.transition !== 'none') {
      card.style.transition = 'none';
    }

    if (!rafIdRef.current) {
      rafIdRef.current = requestAnimationFrame(updateCardState);
    }
  }, [handleMouseEnter, updateCardState]);

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false;
    mousePosRef.current = null;
    rectRef.current = null;

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    const card = cardRef.current;
    if (!card) return;

    if (ambientRef.current) {
      ambientRef.current.style.opacity = '0';
    }

    // Buttery-smooth spring return to flat resting state on exit
    card.style.transition = 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease';
    card.style.transform = 'none';
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  // Shared layer style ─ absolute fill, no pointer events
  const layerBase: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: 0,
    transition: 'opacity 200ms ease',
    borderRadius: 'inherit',
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: 'none',
        transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        ...style
      }}
      className={`relative isolate overflow-hidden ${roundedClass} ${className} group/vector-card hover:will-change-transform`}
    >
      {/* ── Layer A: Ambient + cursor warmth (z-0, behind content) ───── */}
      <div
        ref={ambientRef}
        style={{ ...layerBase, zIndex: 0, overflow: 'hidden' }}
      />

      {/* ── Layer C: Content  (z-10, always on top of light) ───────── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', borderRadius: 'inherit' }}>
        {children}
      </div>

      {/* ── Layer D: Shine Sweep (z-20, fires once per hover, over content) ── */}
      <div
        ref={shineRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 20,
          borderRadius: 'inherit',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          transform: 'translateX(-200%) skewX(-30deg)',
        }}
      />
    </div>
  );
};
