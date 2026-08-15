import React, { useRef, useState } from 'react';
import { motion, useSpring } from 'framer-motion';

interface DynamicVectorCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glowColor?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const DynamicVectorCard: React.FC<DynamicVectorCardProps> = ({
  children,
  className = '',
  maxTilt = 3.5,
  glowColor = 'rgba(255, 255, 255, 0.12)',
  onClick,
  style = {}
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });

  // Spring physics configuration tuned for butter-smooth movement & zero text blur
  const rotateX = useSpring(0, { stiffness: 260, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 260, damping: 24 });
  const scale = useSpring(1, { stiffness: 260, damping: 24 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    if (width === 0 || height === 0) return;

    // Mouse coordinates relative to card center (-0.5 to +0.5)
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;

    // Dynamic bi-directional tilt calculations:
    // Hovering RIGHT side (mouseX > 0) -> rotates Y POSITIVELY (+deg, right tilts forward)
    // Hovering LEFT side (mouseX < 0) -> rotates Y NEGATIVELY (-deg, left tilts forward)
    // Hovering TOP (mouseY < 0) -> rotates X POSITIVELY
    // Hovering BOTTOM (mouseY > 0) -> rotates X NEGATIVELY
    rotateX.set(-mouseY * maxTilt * 2);
    rotateY.set(mouseX * maxTilt * 2);
    scale.set(1.008);

    // Percentage coordinates for cursor reflection spotlight
    const posX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / width) * 100));
    const posY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / height) * 100));
    setCursorPos({ x: posX, y: posY });
    if (!isHovered) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
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
        rotateX,
        rotateY,
        scale,
        transformStyle: 'preserve-3d',
        perspective: 1200,
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        willChange: 'transform',
        ...style
      }}
      className={`relative transform-gpu transition-shadow duration-300 crisp-vector-card ${className}`}
    >
      {/* Dynamic Cursor Light Reflection Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-300 z-30"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(500px circle at ${cursorPos.x}% ${cursorPos.y}%, ${glowColor}, transparent 50%)`
        }}
      />
      {children}
    </motion.div>
  );
};
