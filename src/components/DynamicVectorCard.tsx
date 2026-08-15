import React, { useRef, useState } from 'react';

interface DynamicVectorCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const DynamicVectorCard: React.FC<DynamicVectorCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(255, 255, 255, 0.14)',
  onClick,
  style = {}
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    // Exact percentage coordinates for real-time cursor reflection spotlight (left & right sides)
    const posX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / width) * 100));
    const posY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / height) * 100));
    setCursorPos({ x: posX, y: posY });
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
      className={`relative transition-all duration-300 ${className}`}
    >
      {/* Dynamic Cursor Light Reflection Spotlight (Tracks mouse coordinates in 1:1 crisp native resolution) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-30 overflow-hidden"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${cursorPos.x}% ${cursorPos.y}%, ${glowColor}, transparent 60%)`
        }}
      />
      {children}
    </div>
  );
};
