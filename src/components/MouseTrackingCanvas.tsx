import React, { useEffect, useState, useRef } from 'react';
import { useTheme } from '../lib/themeStore';

export const MouseTrackingCanvas: React.FC = () => {
  const [theme] = useTheme();
  const isDark = theme === 'dark';
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const targetPos = useRef({ x: -500, y: -500 });
  const isHoveredRef = useRef(false);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isHoveredRef.current) isHoveredRef.current = true;
    };

    const handleMouseLeave = () => {
      isHoveredRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Smooth lerp loop for 60fps fluid tracking
    const updateLoop = () => {
      setPos((prev) => {
        const dx = targetPos.current.x - prev.x;
        const dy = targetPos.current.y - prev.y;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return prev;
        return {
          x: prev.x + dx * 0.12,
          y: prev.y + dy * 0.12
        };
      });
      animFrameId.current = requestAnimationFrame(updateLoop);
    };

    animFrameId.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  if (pos.x === -500 && pos.y === -500) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* Dynamic Viewport Ambient Spotlight Orb */}
      <div
        className="absolute w-[600px] h-[600px] -ml-[300px] -mt-[300px] rounded-full transition-opacity duration-700 blur-[90px]"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          opacity: isDark ? 0.18 : 0.12,
          background: isDark
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, rgba(37, 99, 235, 0.2) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37, 99, 235, 0.3) 0%, rgba(129, 140, 248, 0.15) 45%, transparent 70%)'
        }}
      />
    </div>
  );
};
