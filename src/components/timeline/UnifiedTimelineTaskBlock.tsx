import React, { useMemo, useCallback, memo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import { Task } from '@/types/task';
import { TaskBlock as TaskBlockType } from '@/hooks/timelineUtils';
import { useCategoryManager } from '@/hooks/useCategoryContext';
import { useTaskHelpers } from '@/hooks/useTaskHelpers';
import { TimelineTaskDropdown } from './TimelineTaskDropdown';

interface UnifiedTimelineTaskBlockProps {
  block: TaskBlockType;
  level: number;
  dayWidth: number;
  isExpanded: boolean;
  subtaskCount: number;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onToggleExpansion: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onAddSubTask: (parentId: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const UnifiedTimelineTaskBlock = memo<UnifiedTimelineTaskBlockProps>(({
  block,
  level,
  dayWidth,
  isExpanded,
  subtaskCount,
  tasks,
  onTaskClick,
  onToggleExpansion,
  onEditTask,
  onAddSubTask,
  onDeleteTask
}) => {
  const { getCategoryById, categories } = useCategoryManager();
  const { getTaskColor, formatTaskTime, getTaskDurationInMinutes } = useTaskHelpers(tasks);
  
  const { task, left, width, dayIndex, top } = block;
  const durationMinutes = getTaskDurationInMinutes(task);
  const taskTime = formatTaskTime(task, task.isWeekSegment || false);
  const taskColor = getTaskColor(task);
  
  const category = useMemo(() => {
    return task.categoryId && task.categoryId !== 'no-category' ? getCategoryById(task.categoryId) : null;
  }, [task.categoryId, categories, getCategoryById]);

  const getTaskForAction = useCallback(() => 
    task.isWeekSegment ? tasks.find(t => t.id === task.id.split('_week_')[0]) || task : task,
    [task, tasks]
  );

  const handleTaskClick = useCallback(() => onTaskClick(getTaskForAction()), [onTaskClick, getTaskForAction]);
  const handleEditTask = useCallback(() => onEditTask(getTaskForAction()), [onEditTask, getTaskForAction]);
  const handleAddSubTask = useCallback(() => onAddSubTask(task.id), [onAddSubTask, task.id]);
  const handleDeleteTask = useCallback(() => onDeleteTask(task.id), [onDeleteTask, task.id]);
  
  const handleToggleExpansion = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpansion(task.id);
  }, [onToggleExpansion, task.id]);

  const baseStyle = {
    left: `${dayIndex * dayWidth + left + level * 20}px`,
    top: `${top}px`,
    width: `${width - level * 20}px`,
    height: `${block.height}px`,
    zIndex: 5 + level,
    opacity: level > 0 ? 0.95 : 1,
    transition: 'left 0.2s ease, width 0.2s ease, transform 0.2s ease'
  };

  const showDropdown = !task.isWeekSegment || task.isLastWeekSegment;

  // Shared components
  const ExpandButton = ({ isCompact = false }) => {
    if (subtaskCount === 0) return null;
    const compactClasses = isCompact 
      ? "bg-muted/80 text-muted-foreground hover:bg-muted border-muted-foreground/20" 
      : "text-white hover:bg-white/20 bg-white/10 border border-white/20";
    
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleToggleExpansion} 
        className={`p-0 h-4 w-4 ml-1 flex-shrink-0 ${compactClasses}`}
      >
        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
      </Button>
    );
  };

  const SubtaskBadge = ({ isCompact = false }) => {
    if (subtaskCount === 0) return null;
    const compactClasses = isCompact ? "bg-muted/80 text-muted-foreground" : "bg-white/30 text-white";
    
    return (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 flex-shrink-0 font-bold ${compactClasses}`}>
        {subtaskCount}
      </span>
    );
  };

  const CategoryBadge = () => {
    if (!category) return null;
    return (
      <span 
        className="text-xs px-1.5 py-0.5 rounded text-white font-bold ml-1 flex-shrink-0" 
        style={{
          backgroundColor: category.color,
          textShadow: '0 1px 2px rgba(0,0,0,0.5)'
        }}
      >
        {category.title}
      </span>
    );
  };

  const TimeDisplay = () => {
    if (typeof taskTime === 'string') {
      return <div className="text-xs text-white/90 font-medium drop-shadow-sm">{taskTime}</div>;
    }
    
    if (taskTime.isMultiMonth) {
      return <div className="text-xs text-white/90 font-medium drop-shadow-sm">{taskTime.displayText}</div>;
    }
    
    if (taskTime.isMultiWeek) {
      return (
        <div className="text-xs text-white/90 font-medium drop-shadow-sm">
          <div>{taskTime.timeRange}</div>
          <div className="text-white/75">{taskTime.dateRange}</div>
        </div>
      );
    }
    
    if (taskTime.dates) {
      return (
        <div className="text-xs text-white/90 font-medium drop-shadow-sm">
          <div>{taskTime.time}</div>
          <div className="text-white/75">{taskTime.dates}</div>
        </div>
      );
    }
    
    return <div className="text-xs text-white/90 font-medium drop-shadow-sm">{taskTime.time}</div>;
  };

  // Dot variant for very short tasks (< 30 minutes)
  if (durationMinutes < 30) {
    return (
      <div 
        className="absolute cursor-pointer hover:opacity-80 transition-opacity group flex items-start gap-2" 
        style={baseStyle} 
        onClick={handleTaskClick}
      >
        {level > 0 && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center">
            <div className="w-4 h-px bg-muted-foreground/30" />
            <div className="w-px h-4 bg-muted-foreground/30" />
          </div>
        )}
        
        <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: taskColor }} />
        
        <div className="text-xs flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 flex-shrink-0">
              <ExpandButton isCompact />
              <SubtaskBadge isCompact />
            </div>
            <div className="flex items-center min-w-0 flex-1">
              <span className="truncate text-xs font-medium">{task.title}</span>
              <CategoryBadge />
            </div>
          </div>
          <div className="text-xs opacity-75 mt-1">
            {typeof taskTime === 'string' ? taskTime : taskTime.time}
          </div>
        </div>
        
        {showDropdown && (
          <TimelineTaskDropdown 
            task={task}
            onEdit={handleEditTask}
            onAddSubTask={handleAddSubTask}
            onDelete={handleDeleteTask}
            isCompact
          />
        )}
      </div>
    );
  }

  // Line variant for medium duration tasks (30-60 minutes)
  if (durationMinutes >= 30 && durationMinutes <= 60) {
    return (
      <div 
        className="absolute cursor-pointer hover:opacity-80 transition-opacity group flex items-start gap-2" 
        style={baseStyle} 
        onClick={handleTaskClick}
      >
        {level > 0 && (
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center">
            <div className="w-4 h-px bg-muted-foreground/30" />
            <div className="w-px h-4 bg-muted-foreground/30" />
          </div>
        )}
        
        <div className="w-1 h-full rounded-full flex-shrink-0" style={{ backgroundColor: taskColor }} />
        
        <div className="text-xs flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 flex-shrink-0">
              <ExpandButton isCompact />
              <SubtaskBadge isCompact />
            </div>
            <div className="flex items-center min-w-0 flex-1">
              <span className="truncate text-xs font-medium">{task.title}</span>
              <CategoryBadge />
            </div>
          </div>
          <div className="text-xs opacity-75 mt-1">
            {typeof taskTime === 'string' ? taskTime : taskTime.time}
          </div>
        </div>
        
        {showDropdown && (
          <TimelineTaskDropdown 
            task={task}
            onEdit={handleEditTask}
            onAddSubTask={handleAddSubTask}
            onDelete={handleDeleteTask}
            isCompact
          />
        )}
      </div>
    );
  }

  // Full block variant for longer tasks (> 60 minutes)
  return (
    <div 
      className="absolute rounded-lg p-2 cursor-pointer shadow-lg border border-white/20 transition-all hover:shadow-xl hover:scale-[1.02] group overflow-hidden" 
      style={{
        ...baseStyle,
        background: `linear-gradient(135deg, ${taskColor}90 0%, ${taskColor}95 50%, ${taskColor} 100%)`,
        backdropFilter: 'none',
        boxShadow: `0 4px 16px 0 ${taskColor}40, inset 0 1px 0 0 rgba(255, 255, 255, 0.15)`,
        color: 'white'
      }}
      onClick={handleTaskClick}
    >
      {level > 0 && (
        <>
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 flex items-center">
            <div className="w-4 h-px bg-white/30" />
            <div className="w-px h-4 bg-white/30" />
          </div>
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/10 rounded-l-lg" style={{ marginLeft: '-3px' }} />
        </>
      )}
      
      {showDropdown && (
        <div className="absolute top-1 right-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <TimelineTaskDropdown 
            task={task}
            onEdit={handleEditTask}
            onAddSubTask={handleAddSubTask}
            onDelete={handleDeleteTask}
          />
        </div>
      )}
      
      <div className="relative z-10 flex flex-col justify-center h-full">
        <div className="flex items-center justify-between mb-1 pr-6">
          <div className="flex items-center min-w-0 flex-1">
            <span className="truncate text-xs font-bold text-white drop-shadow-sm">{task.title}</span>
            <ExpandButton />
            <SubtaskBadge />
          </div>
          <div className="flex items-center gap-1">
            <CategoryBadge />
          </div>
        </div>
        
        <TimeDisplay />
      </div>
      
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-lg" />
    </div>
  );
});

UnifiedTimelineTaskBlock.displayName = 'UnifiedTimelineTaskBlock';