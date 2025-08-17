import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';

interface DraggableAddButtonProps {
  onClick: () => void;
  isDarkMode: boolean;
}

export const DraggableAddButton: React.FC<DraggableAddButtonProps> = ({ onClick, isDarkMode }) => {
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [touchHandled, setTouchHandled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize position based on screen size and Details Panel location
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      // Mobile: Details Panel takes full width, position in its footer
      setPosition({
        x: 16,
        y: window.innerHeight - 120 // Above mobile navigation
      });
    } else {
      // Desktop: Details Panel is the rightmost panel (approximately 65% of width)
      const leftSidebarWidth = window.innerWidth * 0.1; // 10% for left sidebar
      const listPanelWidth = window.innerWidth * 0.25;   // 25% for list panel
      const detailsPanelStart = leftSidebarWidth + listPanelWidth;
      
      setPosition({
        x: detailsPanelStart + 20, // 20px from Details Panel left edge
        y: window.innerHeight - 80 // Footer area
      });
    }
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setPosition({ x: clientX - 28, y: clientY - 28 });
  };

  const handleEnd = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const deltaX = Math.abs(clientX - dragStart.x);
    const deltaY = Math.abs(clientY - dragStart.y);
    
    if (deltaX < 5 && deltaY < 5) {
      onClick();
    }
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Prevent mouse events if touch was recently handled
    if (touchHandled) {
      setTouchHandled(false);
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    handleStart(e.clientX, e.clientY);
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTouchHandled(true);
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  // Global event listeners
  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onMouseUp = (e: MouseEvent) => handleEnd(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const touch = e.changedTouches[0];
      handleEnd(touch.clientX, touch.clientY);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-40">
      <Button
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`
          fixed w-14 h-14 rounded-full shadow-lg transition-all pointer-events-auto
          ${isDragging ? 'scale-110 shadow-2xl' : 'hover:scale-105'}
          bg-cyan-mist/20 border border-cyan-mist/40 text-charcoal
          hover:bg-cyan-mist/30 hover:border-cyan-mist/60
          cursor-${isDragging ? 'grabbing' : 'grab'}
        `}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: isDragging ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  );
};