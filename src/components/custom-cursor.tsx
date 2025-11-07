'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const target = e.target as HTMLElement;
      if (target.closest('a, button, .interactive-element')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div
      className={cn(
        'custom-cursor fixed top-0 left-0 pointer-events-none z-[9999]',
        isHovering && 'hover'
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
        <div className="cursor-dot"></div>
        <div className="cursor-circle"></div>
    </div>
  );
}
