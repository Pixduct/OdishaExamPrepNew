import React, { useEffect, useRef } from 'react';
import { useTheme } from '../lib/themeStore';

export const MouseTrackingCanvas: React.FC = () => {
  const [theme] = useTheme();
  const isDark = theme === 'dark';
  const orbRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -500, y: -500 });
  const currPos = useRef({ x: -500, y: -500 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Smooth lerp loop with ZERO React state re-renders (100% GPU accelerated translate3d)
    const updateLoop = () => {
      // Pause updates while user is actively scrolling for 120 FPS performance
      if (typeof document !== 'undefined' && !document.body.classList.contains('is-scrolling')) {
        const dx = targetPos.current.x - currPos.current.x;
        const dy = targetPos.current.y - currPos.current.y;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          currPos.current.x += dx * 0.12;
          currPos.current.y += dy * 0.12;
          if (orbRef.current) {
            orbRef.current.style.transform = `translate3d(${currPos.current.x}px, ${currPos.current.y}px, 0)`;
          }
        }
      }
      animFrameId.current = requestAnimationFrame(updateLoop);
    };

    animFrameId.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
      {/* GPU Accelerated Ambient Spotlight Orb */}
      <div
        ref={orbRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] -ml-[250px] -mt-[250px] rounded-full transition-opacity duration-700 blur-[75px] will-change-transform"
        style={{
          transform: 'translate3d(-500px, -500px, 0)',
          opacity: isDark ? 0.16 : 0.08,
          background: isDark
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(37, 99, 235, 0.18) 45%, transparent 70%)'
            : 'radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, rgba(99, 102, 241, 0.08) 45%, transparent 70%)'
        }}
      />
    </div>
  );
};
