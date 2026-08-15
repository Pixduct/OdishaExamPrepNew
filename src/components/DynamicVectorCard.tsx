import React, { useRef, useState } from 'react';

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
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const pxX = e.clientX - rect.left;
    const pxY = e.clientY - rect.top;
    const posX = Math.max(0, Math.min(100, (pxX / rect.width) * 100));
    const posY = Math.max(0, Math.min(100, (pxY / rect.height) * 100));

    setCursorPos({ x: posX, y: posY });

    if (enableTilt && window.matchMedia('(pointer: fine)').matches) {
      // Calculate subtle 3D tilt based on cursor distance from center (-3deg to +3deg max for ultra-subtle premium feel)
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateY = ((pxX - centerX) / centerX) * 3.5;
      const rotateX = ((centerY - pxY) / centerY) * 3.5;
      setTilt({ rotateX, rotateY });
    }

    if (!isHovered) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
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
        transform: isHovered && enableTilt
          ? `perspective(1000px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.015, 1.015, 1.015)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.15s ease-out' : 'transform 0.5s ease-out',
        ...style
      }}
      className={`relative ${roundedClass} ${className}`}
    >
      {/* 1. Base Children Content Layer */}
      {children}

      {/* 2. Dynamic Cursor Surface Light Spotlight Overlay */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-20 overflow-hidden mix-blend-soft-light`}
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(380px circle at ${cursorPos.x}% ${cursorPos.y}%, ${glowColor}, transparent 75%)`
        }}
      />

      {/* 3. Subtle Ambient Light Flare Layer */}
      <div
        className={`pointer-events-none absolute inset-0 ${roundedClass} transition-opacity duration-300 z-20 overflow-hidden`}
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
