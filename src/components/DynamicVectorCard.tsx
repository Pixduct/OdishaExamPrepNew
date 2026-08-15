import React, { useRef, useState } from 'react';

interface DynamicVectorCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  roundedClass?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const DynamicVectorCard: React.FC<DynamicVectorCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(37, 99, 235, 0.25)',
  roundedClass = 'rounded-3xl sm:rounded-[2.5rem]',
  onClick,
  style = {}
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50, pxX: 0, pxY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const pxX = e.clientX - rect.left;
    const pxY = e.clientY - rect.top;
    const posX = Math.max(0, Math.min(100, (pxX / rect.width) * 100));
    const posY = Math.max(0, Math.min(100, (pxY / rect.height) * 100));

    setCursorPos({ x: posX, y: posY, pxX, pxY });
    if (!isHovered) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        ...style
      }}
      className={`relative ${roundedClass} transition-all duration-300 ${className}`}
    >
      {/* 1. Base Children Content Layer */}
      {children}

      {/* 2. Dynamic Cursor Surface Light Spotlight Overlay (Placed ABOVE children at z-20 so it shines on top of card content) */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-20 overflow-hidden mix-blend-soft-light`}
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(380px circle at ${cursorPos.x}% ${cursorPos.y}%, ${glowColor}, transparent 75%)`
        }}
      />

      {/* 3. Subtle Ambient Light Flare Layer for Vibrant Color Pop */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-20 overflow-hidden opacity-30 dark:opacity-40`}
        style={{
          opacity: isHovered ? 0.35 : 0,
          background: `radial-gradient(280px circle at ${cursorPos.x}% ${cursorPos.y}%, ${glowColor}, transparent 70%)`
        }}
      />

      {/* 4. High-Precision Cursor Border Illumination Ring */}
      <div
        className={`pointer-events-none absolute -inset-[1.5px] ${roundedClass} transition-opacity duration-300 z-30`}
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(240px circle at ${cursorPos.x}% ${cursorPos.y}%, ${glowColor.replace(/[\d\.]+\)$/, '0.7)')}, transparent 80%) border-box`,
          WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1.5px'
        }}
      />
    </div>
  );
};
