import React, { useRef, useCallback } from 'react';
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
  roundedClass = 'rounded-3xl sm:rounded-[2.5rem]',
  enableTilt = true,
  onClick,
  style = {}
}) => {
  const cardRef      = useRef<HTMLDivElement>(null);
  const ambientRef   = useRef<HTMLDivElement>(null);
  const isHovered    = useRef(false);

  const [theme] = useTheme();
  const isDark = theme === 'dark';

  // Ambient layer config  ─ wide soft spread with bright cursor-center (physics: frosted glass backlit)
  const ambientRadius  = isDark ? 550 : 480;
  // Core stop (0%), mid-fade (40%), transparent edge (100%)
  const coreAlpha  = isDark ? 0.55 : 0.30;  // bright at exact cursor
  const midAlpha   = isDark ? 0.22 : 0.10;  // soft mid-ring

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    if (typeof document !== 'undefined' && document.body.classList.contains('is-scrolling')) return;

    const rect = card.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const pxX = e.clientX - rect.left;
    const pxY = e.clientY - rect.top;
    const pctX = Math.max(0, Math.min(100, (pxX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (pxY / rect.height) * 100));

    // ── Ambient + Cursor Warmth (single merged layer) ─────────────
    if (ambientRef.current) {
      ambientRef.current.style.background =
        `radial-gradient(${ambientRadius}px circle at ${pctX.toFixed(1)}% ${pctY.toFixed(1)}%,` +
        ` ${withAlpha(glowColor, coreAlpha)} 0%,` +
        ` ${withAlpha(glowColor, midAlpha)} 40%,` +
        ` transparent 72%)`;
    }

    // ── 3-D Tilt ──────────────────────────────────────────────────
    if (enableTilt && window.matchMedia('(pointer: fine)').matches) {
      const cX = rect.width  / 2;
      const cY = rect.height / 2;
      card.style.setProperty('--rotate-x', `${(((cY - pxY) / cY) * 3.5).toFixed(2)}deg`);
      card.style.setProperty('--rotate-y', `${(((pxX - cX) / cX) * 3.5).toFixed(2)}deg`);
    }

    if (!isHovered.current) {
      isHovered.current = true;
      if (ambientRef.current) ambientRef.current.style.opacity = '1';
      card.classList.add('is-card-hovered');
    }
  }, [isDark, glowColor, ambientRadius, coreAlpha, midAlpha, enableTilt]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    isHovered.current = false;

    if (ambientRef.current) ambientRef.current.style.opacity = '0';
    card.style.setProperty('--rotate-x', '0deg');
    card.style.setProperty('--rotate-y', '0deg');
    card.classList.remove('is-card-hovered');
  }, []);

  // Shared layer style ─ absolute fill, no pointer events, GPU-composited
  const layerBase: React.CSSProperties = {
    position:         'absolute',
    inset:            0,
    pointerEvents:    'none',
    opacity:          0,
    transition:       'opacity 200ms ease',
    willChange:       'opacity',
    borderRadius:     'inherit',
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective:          '1000px',
        transformStyle:       'preserve-3d',
        WebkitFontSmoothing:  'antialiased',
        MozOsxFontSmoothing:  'grayscale',
        willChange:           'transform',
        ...style
      }}
      className={`relative isolate ${roundedClass} ${className} group/vector-card transition-transform duration-200 ease-out [&.is-card-hovered]:[transform:perspective(1000px)_rotateX(var(--rotate-x,0deg))_rotateY(var(--rotate-y,0deg))_scale3d(1.015,1.015,1.015)]`}
    >
      {/* ── Layer A: Ambient + cursor warmth (z-0, behind content) ───── */}
      <div
        ref={ambientRef}
        style={{ ...layerBase, zIndex: 0, overflow: 'hidden' }}
      />

      {/* ── Layer C: Content  (z-10, always on top of light) ───────── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
        {children}
      </div>
    </div>
  );
};
