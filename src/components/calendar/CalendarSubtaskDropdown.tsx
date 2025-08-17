import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, Move, X } from 'lucide-react';
import { CalendarTask } from './CalendarTemplate';
import { UnifiedTaskDropdown } from '../shared/UnifiedTaskDropdown';
import { formatTaskTime } from '@/utils/calendarUtils';

interface CalendarSubtaskDropdownProps {
  task: CalendarTask;
  isExpanded: boolean;
  onTaskClick: (task: CalendarTask) => void;
  onToggleExpansion: (taskId: string) => void;
  onEditTask: (task: CalendarTask) => void;
  onAddSubTask: (task: CalendarTask) => void;
  onDeleteTask: (taskId: string) => void;
  position: {
    top: string;
    left: string;
    width: string;
  };
}

export const CalendarSubtaskDropdown: React.FC<CalendarSubtaskDropdownProps> = ({
  task,
  isExpanded,
  onTaskClick,
  onToggleExpansion,
  onEditTask,
  onAddSubTask,
  onDeleteTask,
  position
}) => {
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dropdownPos, setDropdownPos] = useState(() => {
    // Initialize in the middle left corner of the screen
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    return { 
      x: Math.max(20, screenWidth * 0.15), // 15% from left edge
      y: Math.max(20, screenHeight * 0.3)  // 30% from top
    };
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setIsDragging(true);
    setDragStart({ x: clientX - dropdownPos.x, y: clientY - dropdownPos.y });
  };

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    setDropdownPos({
      x: Math.max(10, Math.min(clientX - dragStart.x, window.innerWidth - 360)),
      y: Math.max(10, Math.min(clientY - dragStart.y, window.innerHeight - 310))
    });
  };

  const handleDragEnd = () => setIsDragging(false);

  useEffect(() => {
    if (!isDragging) return;
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    document.body.style.overflow = 'hidden';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.documentElement.style.touchAction = 'none';
    
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.documentElement.style.touchAction = '';
    };
  }, [isDragging, dragStart]);

  if (!isExpanded || !task.subTasks || task.subTasks.length === 0) {
    return null;
  }

  const toggleSubtaskExpansion = (subtaskId: string) => {
    setExpandedSubtasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subtaskId)) {
        newSet.delete(subtaskId);
      } else {
        newSet.add(subtaskId);
      }
      return newSet;
    });
  };

  const getTotalSubtaskCount = (subtasks: CalendarTask[]): number => {
    let count = subtasks.length;
    subtasks.forEach(subtask => {
      if (subtask.subTasks && subtask.subTasks.length > 0) {
        count += getTotalSubtaskCount(subtask.subTasks);
      }
    });
    return count;
  };

  const renderSubtaskHierarchy = (subtasks: CalendarTask[], level: number = 0): React.ReactNode => {
    return subtasks.map((subTask) => {
      const hasSubtasks = subTask.subTasks && subTask.subTasks.length > 0;
      const isSubtaskExpanded = expandedSubtasks.has(subTask.id);
      const indentationPx = level * 16;
      const subtaskCount = hasSubtasks ? getTotalSubtaskCount(subTask.subTasks!) : 0;

      return (
        <div key={subTask.id} className="space-y-1">
          <div
            className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/10 border border-white/10 backdrop-blur-sm group"
            style={{ 
              marginLeft: `${indentationPx}px`,
              position: 'relative',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              borderLeft: `3px solid ${subTask.color}`,
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick(subTask);
            }}
          >
            {/* Hierarchy lines for visual connection */}
            {level > 0 && (
              <>
                <div 
                  className="absolute border-l border-border"
                  style={{
                    left: `${-8 - (level - 1) * 16}px`,
                    top: '0px',
                    height: '100%',
                    width: '1px'
                  }}
                />
                <div 
                  className="absolute border-t border-border"
                  style={{
                    left: `${-8 - (level - 1) * 16}px`,
                    top: '50%',
                    width: '8px',
                    height: '1px'
                  }}
                />
              </>
            )}

            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Expansion toggle for subtasks */}
              {hasSubtasks && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSubtaskExpansion(subTask.id);
                  }}
                  className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-lg bg-secondary/50 hover:bg-secondary transition-all duration-200 border border-border backdrop-blur-sm"
                >
                  {isSubtaskExpanded ? (
                    <ChevronDown className="w-3 h-3 text-foreground" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-foreground" />
                  )}
                </button>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-foreground/90 truncate">
                    {subTask.title}
                  </div>
                  {hasSubtasks && (
                    <span className="text-xs bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-foreground/80 px-2 py-0.5 rounded-full font-medium border border-border backdrop-blur-sm">
                      {subtaskCount}
                    </span>
                  )}
                </div>
                
                {/* Show time range if available */}
                {subTask.startTime && subTask.endTime && (
                  <div className="text-xs text-muted-foreground font-mono">
                    {formatTaskTime(subTask.startTime)} – {formatTaskTime(subTask.endTime)}
                  </div>
                )}
                
                {/* Show description if available */}
                {subTask.description && subTask.description !== 'Click to add description...' && (
                  <div className="text-xs text-muted-foreground/70 truncate mt-1 max-h-4 overflow-hidden">
                    {subTask.description.length > 60 ? `${subTask.description.substring(0, 60)}...` : subTask.description}
                  </div>
                )}
              </div>
            </div>

            {/* Dropdown menu for subtask actions */}
            <UnifiedTaskDropdown
              task={subTask}
              onEdit={(task) => task && onEditTask(task)}
              onDelete={(taskId) => onDeleteTask(taskId)}
              onAddSubTask={(parentId) => onAddSubTask(subTask)}
              showAddSubTask={true}
              variant="calendar"
              triggerClassName="flex-shrink-0 p-1.5 rounded-lg opacity-70 hover:opacity-100 transition-all duration-200 hover:bg-secondary/20 border border-border backdrop-blur-sm"
            />
          </div>

          {/* Recursive rendering of nested subtasks - INFINITE DEPTH */}
          {hasSubtasks && isSubtaskExpanded && (
            <div className="space-y-1">
              {renderSubtaskHierarchy(subTask.subTasks!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const totalSubtasks = getTotalSubtaskCount(task.subTasks);

  return createPortal(
    <div
      ref={containerRef}
      className={`fixed z-[100] rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl shadow-black/20 animate-fade-in select-none ${
        isDragging ? 'cursor-grabbing' : ''
      }`}
      style={{
        left: `${dropdownPos.x}px`,
        top: `${dropdownPos.y}px`,
        width: 350,
        maxHeight: '300px'
      }}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
    >
      {/* Draggable Header */}
      <div 
        className="drag-handle flex items-center justify-between p-3 border-b border-white/10 cursor-grab active:cursor-grabbing rounded-t-2xl"
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-foreground/60" />
          <span className="text-xs text-foreground/80 font-medium">
            Drag to move
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpansion(task.id);
            }}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Close dropdown"
          >
            <X className="w-3 h-3 text-foreground/60" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm font-semibold text-foreground mb-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 shadow-sm"></div>
            <span className="text-foreground/90">Sub-tasks for "{task.title}"</span>
          </div>
          <span className="text-xs bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-foreground/90 px-3 py-1 rounded-full font-medium border border-border backdrop-blur-sm">
            {totalSubtasks} total
          </span>
        </div>
        <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/20 scrollbar-track-transparent pr-2">
          {renderSubtaskHierarchy(task.subTasks)}
        </div>
      </div>
    </div>,
    document.body
  );
};