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
  const hotspotRef   = useRef<HTMLDivElement>(null);
  const rimRef       = useRef<HTMLDivElement>(null);
  const isHovered    = useRef(false);

  const [theme] = useTheme();
  const isDark = theme === 'dark';

  // Ambient layer config  ─ large soft spread (physics: indirect bounce light)
  const ambientRadius  = isDark ? 520 : 460;
  const ambientAlpha   = isDark ? 0.60 : 0.28;

  // Specular hotspot config  ─ tight bright core (physics: direct point-light on glass)
  const hotAlpha  = isDark ? 0.40 : 0.45;

  // Rim border config  ─ glowing card edge
  const rimAlpha  = isDark ? 1.0 : 0.85;

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

    // ── Ambient Layer ──────────────────────────────────────────────
    if (ambientRef.current) {
      ambientRef.current.style.background =
        `radial-gradient(${ambientRadius}px circle at ${pctX.toFixed(1)}% ${pctY.toFixed(1)}%,` +
        ` ${withAlpha(glowColor, ambientAlpha)} 0%,` +
        ` ${withAlpha(glowColor, ambientAlpha * 0.45)} 45%,` +
        ` transparent 75%)`;
    }

    // ── Specular Hotspot ───────────────────────────────────────────
    if (hotspotRef.current) {
      hotspotRef.current.style.background =
        `radial-gradient(130px circle at ${pctX.toFixed(1)}% ${pctY.toFixed(1)}%,` +
        ` rgba(255,255,255,${hotAlpha}) 0%,` +
        ` ${withAlpha(glowColor, hotAlpha * 0.6)} 40%,` +
        ` transparent 70%)`;
    }

    // ── Rim Border Glow ────────────────────────────────────────────
    if (rimRef.current) {
      rimRef.current.style.background =
        `radial-gradient(220px circle at ${pctX.toFixed(1)}% ${pctY.toFixed(1)}%,` +
        ` ${withAlpha(glowColor, rimAlpha)},` +
        ` transparent 70%)`;
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
      // Fade in all layers at GPU speed (no React re-render)
      [ambientRef, hotspotRef, rimRef].forEach(r => {
        if (r.current) r.current.style.opacity = '1';
      });
      card.classList.add('is-card-hovered');
    }
  }, [isDark, glowColor, ambientRadius, ambientAlpha, hotAlpha, rimAlpha, enableTilt]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    isHovered.current = false;

    [ambientRef, hotspotRef, rimRef].forEach(r => {
      if (r.current) r.current.style.opacity = '0';
    });
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
      className={`relative isolate ${roundedClass} ${className} group/vector-card transition-transform duration-200 ease-out [.is-card-hovered_&]:[transform:perspective(1000px)_rotateX(var(--rotate-x,0deg))_rotateY(var(--rotate-y,0deg))_scale3d(1.015,1.015,1.015)]`}
    >
      {/* ── Layer A: Ambient spread  (z-0, behind content) ─────────── */}
      <div
        ref={ambientRef}
        style={{ ...layerBase, zIndex: 0, overflow: 'hidden' }}
      />

      {/* ── Layer B: Specular hot-spot  (z-0, behind content) ──────── */}
      <div
        ref={hotspotRef}
        style={{ ...layerBase, zIndex: 0, overflow: 'hidden' }}
      />

      {/* ── Layer C: Content  (z-10, always on top of light) ───────── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
        {children}
      </div>

      {/* ── Layer D: Rim border glow  (z-20, painted as 1-px inset border light) */}
      {/*    Technique: 1px inset box-shadow uses the radial gradient as its colour */}
      {/*    We paint it as a border-box background on a 1px-bordered div           */}
      <div
        ref={rimRef}
        style={{
          ...layerBase,
          zIndex:      20,
          padding:     '1px',
          background:  `radial-gradient(220px circle at 50% 50%, ${withAlpha(glowColor, rimAlpha)}, transparent 70%)`,
          WebkitMask:  'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
    </div>
  );
};
