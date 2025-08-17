import React, { useState, useRef, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui';
import { Minimize2, Maximize2, GripHorizontal } from 'lucide-react';

interface FloatingTaskProgressProps {
  progress: number;
  progressColor: string;
  isDarkMode: boolean;
}

export const FloatingTaskProgress: React.FC<FloatingTaskProgressProps> = ({
  progress,
  progressColor,
  isDarkMode
}) => {
  const isMobile = window.innerWidth < 768;
  const [position, setPosition] = useState({
    x: isMobile ? window.innerWidth - 296 : window.innerWidth - 320,
    y: isMobile ? window.innerHeight - 120 : window.innerHeight - 150
  });
  const [size, setSize] = useState({
    width: isMobile ? 280 : 300,
    height: isMobile ? 80 : 100
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setIsDragging(true);
      setDragOffset({ x: clientX - rect.left, y: clientY - rect.top });
    }
  };

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setResizeStart({ x: clientX, y: clientY, width: size.width, height: size.height });
  };

  const constrainToViewport = (x: number, y: number, width: number, height: number) => {
    const margin = isMobile ? 16 : 8;
    return {
      x: Math.max(margin, Math.min(x, window.innerWidth - width - margin)),
      y: Math.max(margin, Math.min(y, window.innerHeight - height - margin))
    };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (isDragging) {
      const newPos = constrainToViewport(
        clientX - dragOffset.x,
        clientY - dragOffset.y,
        isMinimized ? (isMobile ? 40 : 48) : size.width,
        isMinimized ? (isMobile ? 40 : 48) : size.height
      );
      setPosition(newPos);
    } else if (isResizing) {
      const deltaX = clientX - resizeStart.x;
      const deltaY = clientY - resizeStart.y;
      const minWidth = isMobile ? 160 : 200;
      const minHeight = isMobile ? 60 : 80;
      
      let newSize = { ...size };
      let newPos = { ...position };

      switch (resizeHandle) {
        case 'se':
          newSize.width = Math.max(minWidth, resizeStart.width + deltaX);
          newSize.height = Math.max(minHeight, resizeStart.height + deltaY);
          break;
        case 'sw':
          newSize.width = Math.max(minWidth, resizeStart.width - deltaX);
          newSize.height = Math.max(minHeight, resizeStart.height + deltaY);
          newPos.x = position.x + (resizeStart.width - newSize.width);
          break;
        case 'ne':
          newSize.width = Math.max(minWidth, resizeStart.width + deltaX);
          newSize.height = Math.max(minHeight, resizeStart.height - deltaY);
          newPos.y = position.y + (resizeStart.height - newSize.height);
          break;
        case 'nw':
          newSize.width = Math.max(minWidth, resizeStart.width - deltaX);
          newSize.height = Math.max(minHeight, resizeStart.height - deltaY);
          newPos.x = position.x + (resizeStart.width - newSize.width);
          newPos.y = position.y + (resizeStart.height - newSize.height);
          break;
      }

      setSize(newSize);
      setPosition(newPos);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  // Event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      handleDragStart(e.clientX, e.clientY);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      e.stopPropagation();
      const touch = e.touches[0];
      handleDragStart(touch.clientX, touch.clientY);
    }
  };

  // Global event listeners
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.body.style.cursor = isDragging ? 'grabbing' : 'resizing';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.overflow = '';
      document.documentElement.style.touchAction = '';
    };
  }, [isDragging, isResizing, dragOffset, resizeStart, resizeHandle, position, size]);

  const currentSize = isMinimized 
    ? { width: isMobile ? 40 : 48, height: isMobile ? 40 : 48 }
    : size;
  
  return (
    <div
      ref={containerRef}
      className={`fixed z-50 transition-all duration-300 ${isDragging || isResizing ? 'transition-none scale-105' : ''}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${currentSize.width}px`,
        height: `${currentSize.height}px`,
        boxShadow: '0 10px 30px hsl(var(--primary) / 0.2), 0 0 0 1px hsl(var(--border))'
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
    >
      <div className={`relative h-full rounded-xl border bg-transparent ${
        isDarkMode ? 'border-white/10 shadow-black/20' : 'border-white/30 shadow-black/10'
      } ${isDragging || isResizing ? 'ring-2 ring-white/30' : ''}`}>
        
        {isMinimized ? (
          <div className="p-3 flex items-center justify-center h-full">
            <Button variant="ghost" size="sm" onClick={() => setIsMinimized(false)} className="w-6 h-6 p-0">
              <Maximize2 className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 pb-2">
              <div className="flex items-center gap-2">
                <div className="drag-handle cursor-grab p-1 rounded hover:bg-muted/50">
                  <GripHorizontal className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Task Progress</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">{progress}%</span>
                <Button variant="ghost" size="sm" onClick={() => setIsMinimized(true)} className="w-6 h-6 p-0">
                  <Minimize2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="px-3 pb-3 flex-1 flex items-center">
              <Progress 
                value={progress} 
                className="w-full h-3 bg-muted rounded-full"
                indicatorColor={progressColor}
              />
            </div>

            {/* Enhanced Resize Handles for Touch */}
            {['nw', 'ne', 'sw', 'se'].map(handle => (
              <div 
                key={handle}
                className={`absolute ${isMobile ? 'w-6 h-6' : 'w-4 h-4'} cursor-${handle}-resize opacity-0 hover:opacity-100 transition-all duration-200 ${
                  handle === 'nw' ? 'top-0 left-0' :
                  handle === 'ne' ? 'top-0 right-0' :
                  handle === 'sw' ? 'bottom-0 left-0' : 'bottom-0 right-0'
                } ${isResizing && resizeHandle === handle ? 'opacity-100 scale-110' : ''}`}
                onMouseDown={(e) => handleResizeStart(e, handle)}
                onTouchStart={(e) => handleResizeStart(e, handle)}
                style={{ 
                  background: isResizing && resizeHandle === handle 
                    ? 'radial-gradient(circle, hsl(var(--primary)) 40%, transparent 70%)' 
                    : 'radial-gradient(circle, hsl(var(--primary)) 30%, transparent 70%)',
                  touchAction: 'none'
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};