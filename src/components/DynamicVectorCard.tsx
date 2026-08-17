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

  // Derive light mode low-opacity halo and border ring matching card theme color
  const lightColorHalo = glowColor.replace(/[\d\.]+\)$/, '0.07)');
  const lightBorderRing = glowColor.replace(/[\d\.]+\)$/, '0.35)');

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
      {/* 1. Dynamic Cursor Surface Light Spotlight Overlay (Layered behind z-10 children) */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-0 overflow-hidden opacity-0 group-hover/vector-card:opacity-100`}
        style={{
          background: isDark
            ? `radial-gradient(360px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 75%)`
            : `radial-gradient(320px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.90) 0%, ${lightColorHalo} 55%, transparent 80%)`
        }}
      />

      {/* 2. Ambient Flare Layer */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-0 overflow-hidden opacity-0 group-hover/vector-card:opacity-30`}
        style={{
          background: isDark
            ? `radial-gradient(260px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor}, transparent 70%)`
            : `radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${lightColorHalo}, transparent 70%)`
        }}
      />

      {/* 3. High-Precision Cursor Border Illumination Ring */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} border border-transparent transition-opacity duration-300 z-0 opacity-0 group-hover/vector-card:opacity-100`}
        style={{
          background: isDark
            ? `radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${glowColor.replace(/[\d\.]+\)$/, '0.6)')}, transparent 80%) border-box`
            : `radial-gradient(240px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${lightBorderRing}, transparent 80%) border-box`
        }}
      />

      {/* 4. Base Children Content Layer (z-10 guarantees dark text stays 100% crisp & un-shadowed in Light Mode) */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
