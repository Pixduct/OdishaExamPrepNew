import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

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
  glowColor = 'rgba(255, 255, 255, 0.12)',
  onClick,
  style = {}
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });

  // Smooth 2D hardware elevation springs (prevents 3D perspective text rasterization blur)
  const translateY = useSpring(0, { stiffness: 300, damping: 25 });
  const scale = useSpring(1, { stiffness: 300, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    // Smooth tactile lift
    translateY.set(-4);
    scale.set(1.006);

    // Percentage coordinates for cursor reflection spotlight
    const posX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / width) * 100));
    const posY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / height) * 100));
    setCursorPos({ x: posX, y: posY });
    if (!isHovered) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    translateY.set(0);
    scale.set(1);
    setIsHovered(false);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        y: translateY,
        scale,
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        willChange: 'transform',
        ...style
      }}
      className={`relative transform-gpu transition-shadow duration-300 crisp-vector-card ${className}`}
    >
      {/* Dynamic Cursor Light Reflection Spotlight (Follows mouse dynamically across left & right) */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-30 overflow-hidden"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(600px circle at ${cursorPos.x}% ${cursorPos.y}%, ${glowColor}, transparent 60%)`
        }}
      />
      {children}
    </motion.div>
  );
};
