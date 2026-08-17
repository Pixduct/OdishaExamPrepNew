import React, { useRef } from 'react';
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

export const DynamicVectorCard: React.FC<DynamicVectorCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(37, 99, 235, 0.25)',
  roundedClass = 'rounded-3xl sm:rounded-[2.5rem]',
  enableTilt = true,
  onClick,
  style = {}
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [theme] = useTheme();
  const isDark = theme === 'dark';

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || (typeof document !== 'undefined' && document.body.classList.contains('is-scrolling'))) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const pxX = e.clientX - rect.left;
    const pxY = e.clientY - rect.top;
    const posX = Math.max(0, Math.min(100, (pxX / rect.width) * 100));
    const posY = Math.max(0, Math.min(100, (pxY / rect.height) * 100));

    cardRef.current.style.setProperty('--mouse-x', `${posX.toFixed(1)}%`);
    cardRef.current.style.setProperty('--mouse-y', `${posY.toFixed(1)}%`);

    if (enableTilt && window.matchMedia('(pointer: fine)').matches) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = ((pxX - centerX) / centerX) * 3.5;
      const rotateX = ((centerY - pxY) / centerY) * 3.5;
      cardRef.current.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
      cardRef.current.style.setProperty('--rotate-y', `${rotateY.toFixed(2)}deg`);
    }

    if (!cardRef.current.classList.contains('is-card-hovered')) {
      cardRef.current.classList.add('is-card-hovered');
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.classList.remove('is-card-hovered');
      cardRef.current.style.setProperty('--rotate-x', '0deg');
      cardRef.current.style.setProperty('--rotate-y', '0deg');
    }
  };

  // Helper functions to guarantee valid RGBA opacities for light mode spotlight & border rings
  const getLightHalo = (color: string) => {
    if (color.includes('rgba')) {
      return color.replace(/[\d\.]+\)$/, '0.16)');
    }
    if (color.includes('rgb')) {
      return color.replace('rgb', 'rgba').replace(')', ', 0.16)');
    }
    return 'rgba(37, 99, 235, 0.16)';
  };

  const getBorderRing = (color: string, dark: boolean) => {
    if (color.includes('rgba')) {
      return color.replace(/[\d\.]+\)$/, dark ? '0.6)' : '0.45)');
    }
    return dark ? 'rgba(37, 99, 235, 0.6)' : 'rgba(37, 99, 235, 0.45)';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        willChange: 'transform',
        ...style
      }}
      className={`relative ${roundedClass} ${className} group/vector-card transition-transform duration-200 ease-out [.is-card-hovered_&]:[transform:perspective(1000px)_rotateX(var(--rotate-x,0deg))_rotateY(var(--rotate-y,0deg))_scale3d(1.015,1.015,1.015)]`}
    >
      {/* 1. Base Children Content Layer */}
      {children}

      {/* 2. Dynamic Cursor Surface Light Spotlight Overlay (z-20 pointer-events-none renders ON TOP of card surface) */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-20 overflow-hidden opacity-0 group-hover/vector-card:opacity-100`}
        style={{
          background: isDark
            ? `radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 75%)`
            : `radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${getLightHalo(glowColor)}, transparent 75%)`
        }}
      />

      {/* 3. Ambient Flare Layer */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-20 overflow-hidden opacity-0 group-hover/vector-card:opacity-40`}
        style={{
          background: isDark
            ? `radial-gradient(260px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 70%)`
            : `radial-gradient(260px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${getLightHalo(glowColor)}, transparent 70%)`
        }}
      />

      {/* 4. High-Precision Cursor Border Illumination Ring */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} border border-transparent transition-opacity duration-300 z-30 opacity-0 group-hover/vector-card:opacity-100`}
        style={{
          background: `radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${getBorderRing(glowColor, isDark)}, transparent 80%) border-box`
        }}
      />
    </div>
  );
};
