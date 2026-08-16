import React, { useEffect, useRef } from 'react';

export const VectorCursorFollower: React.FC = () => {
  const followerRef = useRef<HTMLDivElement>(null);
  const targetPos = useRef({ x: -100, y: -100 });
  const currPos = useRef({ x: -100, y: -100 });
  const isHoveringRef = useRef(false);
  const isMouseDownRef = useRef(false);
  const animFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const updateScale = () => {
      if (!followerRef.current) return;
      const scale = isMouseDownRef.current ? 0.75 : isHoveringRef.current ? 1.45 : 1;
      followerRef.current.style.setProperty('--follower-scale', `${scale}`);
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };

      const target = e.target as HTMLElement | null;
      if (target) {
        const isInteractive = !!target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer, .group\\/card');
        if (isInteractive !== isHoveringRef.current) {
          isHoveringRef.current = isInteractive;
          if (followerRef.current) {
            followerRef.current.classList.toggle('is-hover-interactive', isInteractive);
          }
          updateScale();
        }
      }
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
      updateScale();
    };

    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      updateScale();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Direct GPU RAF lerp loop with ZERO React state updates
    const updateLoop = () => {
      if (typeof document !== 'undefined' && !document.body.classList.contains('is-scrolling')) {
        const dx = targetPos.current.x - currPos.current.x;
        const dy = targetPos.current.y - currPos.current.y;
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          currPos.current.x += dx * 0.18;
          currPos.current.y += dy * 0.18;
          if (followerRef.current) {
            followerRef.current.style.transform = `translate3d(${currPos.current.x}px, ${currPos.current.y}px, 0) translate(-50%, -50%) scale(var(--follower-scale, 1))`;
          }
        }
      }
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

  return (
    <div
      ref={followerRef}
      className="fixed top-0 left-0 pointer-events-none z-[9999] will-change-transform transition-transform duration-150 ease-out"
      style={{
        transform: 'translate3d(-100px, -100px, 0) translate(-50%, -50%) scale(1)'
      }}
    >
      {/* Precision Vector Cursor Ring Follower */}
      <div
        className="w-6 h-6 rounded-full border border-brand-400/50 dark:border-brand-300/40 bg-brand-500/5 transition-all duration-300 [.is-hover-interactive_&]:w-10 [.is-hover-interactive_&]:h-10 [.is-hover-interactive_&]:border-brand-500 [.is-hover-interactive_&]:bg-brand-500/15 [.is-hover-interactive_&]:shadow-[0_0_15px_rgba(37,99,235,0.4)]"
      />
      {/* Center Precision Pointer Dot */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-brand-500/70 transition-all duration-200 [.is-hover-interactive_&]:w-2 [.is-hover-interactive_&]:h-2 [.is-hover-interactive_&]:bg-brand-600 [.is-hover-interactive_&]:shadow-[0_0_8px_#2563EB]"
      />
    </div>
  );
};
