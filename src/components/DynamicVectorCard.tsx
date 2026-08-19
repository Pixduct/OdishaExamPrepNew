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
  roundedClass = 'rounded-3xl sm:rounded-[2.5rem]',
  enableTilt = true,
  onClick,
  style = {}
}) => {
  const cardRef      = useRef<HTMLDivElement>(null);
  const ambientRef   = useRef<HTMLDivElement>(null);
  const shineRef     = useRef<HTMLDivElement>(null);

  const isHovered    = useRef(false);
  const boundsRef    = useRef<{ left: number; top: number; width: number; height: number } | null>(null);
  const rafId        = useRef<number | null>(null);

  // Target physics values (set instantly on mouse events with 0 layout reflows)
  const targetX       = useRef(0);
  const targetY       = useRef(0);
  const targetScale   = useRef(1);
  const targetOpacity = useRef(0);
  const targetPctX    = useRef(50);
  const targetPctY    = useRef(50);

  // Current interpolated values (smoothly updated at 120 FPS via RAF lerp)
  const currX         = useRef(0);
  const currY         = useRef(0);
  const currScale     = useRef(1);
  const currOpacity   = useRef(0);
  const currPctX      = useRef(50);
  const currPctY      = useRef(50);

  const [theme] = useTheme();
  const isDark = theme === 'dark';

  // Ambient layer config ─ soft spread fading to 0% alpha well before card edge
  const ambientRadius = isDark ? 360 : 300;
  const coreAlpha     = isDark ? 0.40 : 0.22;
  const midAlpha      = isDark ? 0.12 : 0.06;
  const colorCore     = withAlpha(glowColor, coreAlpha);
  const colorMid      = withAlpha(glowColor, midAlpha);

  const triggerShineSweep = useCallback(() => {
    const sh = shineRef.current;
    if (!sh) return;
    sh.style.animation = 'none';
    requestAnimationFrame(() => {
      if (shineRef.current) {
        shineRef.current.style.animation = 'shine-sweep 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
      }
    });
  }, []);

  // 120 FPS Physics Render Loop (Zero React State re-renders, 100% GPU compositor)
  const renderFrame = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    // Skip frame processing while actively scrolling to protect scroll performance
    if (typeof document !== 'undefined' && document.body.classList.contains('is-scrolling')) {
      rafId.current = requestAnimationFrame(renderFrame);
      return;
    }

    // High-performance spring lerp constant for 120 FPS (0.18 = ultra-responsive, silky smooth)
    const LERP = 0.18;

    currX.current       += (targetX.current - currX.current) * LERP;
    currY.current       += (targetY.current - currY.current) * LERP;
    currScale.current   += (targetScale.current - currScale.current) * LERP;
    currOpacity.current += (targetOpacity.current - currOpacity.current) * LERP;
    currPctX.current    += (targetPctX.current - currPctX.current) * LERP;
    currPctY.current    += (targetPctY.current - currPctY.current) * LERP;

    // Apply hardware-accelerated 3D transform directly to GPU layer
    card.style.transform = `perspective(1000px) rotateX(${currX.current.toFixed(2)}deg) rotateY(${currY.current.toFixed(2)}deg) scale3d(${currScale.current.toFixed(4)}, ${currScale.current.toFixed(4)}, ${currScale.current.toFixed(4)}) translateZ(0)`;

    // Update ambient glow layer with interpolated coordinates
    if (ambientRef.current) {
      ambientRef.current.style.opacity = `${currOpacity.current.toFixed(3)}`;
      ambientRef.current.style.background =
        `radial-gradient(${ambientRadius}px circle at ${currPctX.current.toFixed(1)}% ${currPctY.current.toFixed(1)}%,` +
        ` ${colorCore} 0%,` +
        ` ${colorMid} 30%,` +
        ` transparent 60%)`;
    }

    // Check if animation has settled back to rest state when not hovered
    if (!isHovered.current) {
      const isSettled =
        Math.abs(currX.current) < 0.02 &&
        Math.abs(currY.current) < 0.02 &&
        Math.abs(currScale.current - 1) < 0.001 &&
        currOpacity.current < 0.01;

      if (isSettled) {
        card.style.transform = '';
        if (ambientRef.current) {
          ambientRef.current.style.opacity = '0';
        }
        rafId.current = null;
        return; // Loop stops cleanly when settled
      }
    }

    rafId.current = requestAnimationFrame(renderFrame);
  }, [ambientRadius, colorCore, colorMid]);

  const startLoop = useCallback(() => {
    if (!rafId.current) {
      rafId.current = requestAnimationFrame(renderFrame);
    }
  }, [renderFrame]);

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    boundsRef.current = {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
    };
    isHovered.current = true;
    targetScale.current = 1.015;
    targetOpacity.current = 1;
    triggerShineSweep();
    startLoop();
  }, [triggerShineSweep, startLoop]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    if (typeof document !== 'undefined' && document.body.classList.contains('is-scrolling')) return;

    if (!boundsRef.current) {
      const rect = card.getBoundingClientRect();
      boundsRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
    }

    const bounds = boundsRef.current;
    if (bounds.width === 0 || bounds.height === 0) return;

    const pxX = e.clientX - bounds.left;
    const pxY = e.clientY - bounds.top;
    const pctX = Math.max(0, Math.min(100, (pxX / bounds.width) * 100));
    const pctY = Math.max(0, Math.min(100, (pxY / bounds.height) * 100));

    targetPctX.current = pctX;
    targetPctY.current = pctY;

    if (enableTilt && (typeof window === 'undefined' || window.matchMedia('(pointer: fine)').matches)) {
      const cX = bounds.width / 2;
      const cY = bounds.height / 2;
      targetX.current = ((cY - pxY) / cY) * 3.5;
      targetY.current = ((pxX - cX) / cX) * 3.5;
    }

    if (!isHovered.current) {
      isHovered.current = true;
      targetScale.current = 1.015;
      targetOpacity.current = 1;
      triggerShineSweep();
    }

    startLoop();
  }, [enableTilt, triggerShineSweep, startLoop]);

  const handleMouseLeave = useCallback(() => {
    isHovered.current = false;
    boundsRef.current = null;
    targetX.current = 0;
    targetY.current = 0;
    targetScale.current = 1;
    targetOpacity.current = 0;
    startLoop();
  }, [startLoop]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const layerBase: React.CSSProperties = {
    position:      'absolute',
    inset:         0,
    pointerEvents: 'none',
    opacity:       0,
    borderRadius:  'inherit',
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective:         '1000px',
        transformStyle:      'preserve-3d',
        willChange:          'transform',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        ...style
      }}
      className={`relative isolate overflow-hidden ${roundedClass} ${className} group/vector-card`}
    >
      {/* ── Layer A: Ambient + cursor warmth (z-0, behind content) ───── */}
      <div
        ref={ambientRef}
        style={{ ...layerBase, zIndex: 0, overflow: 'hidden' }}
      />

      {/* ── Layer C: Content (z-10, always on top of light) ────────── */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%' }}>
        {children}
      </div>

      {/* ── Layer D: Shine Sweep (z-20, fires once per hover, over content) ── */}
      <div
        ref={shineRef}
        style={{
          position:      'absolute',
          inset:         0,
          pointerEvents: 'none',
          zIndex:        20,
          borderRadius:  'inherit',
          background:    'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)',
          transform:     'translateX(-200%) skewX(-30deg)',
        }}
      />
    </div>
  );
};
