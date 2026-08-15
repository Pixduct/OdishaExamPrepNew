import React, { useEffect, useState, useRef } from 'react';

export const VectorCursorFollower: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHoveringInteractive, setIsHoveringInteractive] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const targetPos = useRef({ x: -100, y: -100 });
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    // Only show custom follower ring on desktop fine-pointer devices
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };

      // Detect if cursor is over interactive elements
      const target = e.target as HTMLElement | null;
      if (target) {
        const interactive = target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer, .group\\/card');
        setIsHoveringInteractive(!!interactive);
      }
    };

    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Smooth spring lerp loop
    const updateLoop = () => {
      setPos((prev) => {
        const dx = targetPos.current.x - prev.x;
        const dy = targetPos.current.y - prev.y;
        if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return prev;
        return {
          x: prev.x + dx * 0.18,
          y: prev.y + dy * 0.18
        };
      });
      animFrameId.current = requestAnimationFrame(updateLoop);
    };

    animFrameId.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  if (pos.x === -100 && pos.y === -100) return null;

  return (
    <div
      className="fixed pointer-events-none z-[9999] transition-transform duration-150 ease-out"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translate(-50%, -50%) scale(${isMouseDown ? 0.75 : isHoveringInteractive ? 1.45 : 1})`
      }}
    >
      {/* Precision Vector Cursor Ring Follower */}
      <div
        className={`rounded-full border transition-all duration-300 ${
          isHoveringInteractive
            ? 'w-10 h-10 border-brand-500 bg-brand-500/15 shadow-[0_0_15px_rgba(37,99,235,0.4)] backdrop-blur-[1px]'
            : 'w-6 h-6 border-brand-400/50 dark:border-brand-300/40 bg-brand-500/5'
        }`}
      />
      {/* Center Precision Pointer Dot */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-200 ${
          isHoveringInteractive
            ? 'w-2 h-2 bg-brand-600 shadow-[0_0_8px_#2563EB]'
            : 'w-1.5 h-1.5 bg-brand-500/70'
        }`}
      />
    </div>
  );
};
