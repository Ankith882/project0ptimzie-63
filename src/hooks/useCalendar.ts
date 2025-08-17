import { useState, useMemo, useCallback } from 'react';
import { CalendarTask } from '@/components/calendar/CalendarTemplate';
import { 
  getTasksForDay, 
  getUnscheduledTasksForDay, 
  calculateOverlappingTasks,
  getWeekStart,
  getMonthStart,
  generateWeekDays,
  generateMonthDays,
  generateHours,
  getTaskDurationMinutes,
  isMultiDay,
  getTaskColor
} from '@/utils/calendarUtils';

export type CalendarViewType = 'day' | 'week' | 'month';

interface UseCalendarProps {
  tasks: CalendarTask[];
  unscheduledTasks?: CalendarTask[];
  currentDate: Date;
  currentView?: CalendarViewType;
  daysCount?: number;
}

export const useCalendar = ({ 
  tasks, 
  unscheduledTasks = [], 
  currentDate,
  currentView = 'week',
  daysCount = 7
}: UseCalendarProps) => {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [draggedTask, setDraggedTask] = useState<CalendarTask | null>(null);
  
  // Generate time periods
  const hours = useMemo(() => generateHours(), []);
  const weekStart = useMemo(() => getWeekStart(currentDate), [currentDate]);
  const weekDays = useMemo(() => generateWeekDays(weekStart), [weekStart]);
  const monthStart = useMemo(() => getMonthStart(currentDate), [currentDate]);
  const monthDays = useMemo(() => generateMonthDays(monthStart), [monthStart]);
  
  // Task utilities
  const hasSubtasks = (taskId: string): boolean => {
    return tasks.some(task => task.parentId === taskId);
  };

  const getSubtasks = (parentId: string): CalendarTask[] => {
    return tasks.filter(task => task.parentId === parentId);
  };

  const getSubtaskCount = (parentId: string): number => {
    return tasks.filter(task => task.parentId === parentId).length;
  };

  const isExpanded = (taskId: string): boolean => {
    return expandedTasks.has(taskId);
  };

  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };
  
  // Day view specific logic
  const dayTasks = useMemo(() => getTasksForDay(tasks, currentDate), [tasks, currentDate]);
  const dayUnscheduledTasks = useMemo(() => 
    getUnscheduledTasksForDay(unscheduledTasks, currentDate), 
    [unscheduledTasks, currentDate]
  );
  
  // Calculate overlapping tasks for current day
  const dayOverlappingGroups = useMemo(() => {
    const rootTasks = dayTasks.filter(task => !task.parentId);
    return calculateOverlappingTasks(rootTasks);
  }, [dayTasks]);
  
  // Week view logic with custom day count
  const customWeekDays = useMemo(() => {
    if (currentView === 'week') {
      return Array.from({ length: daysCount }, (_, i) => {
        const day = new Date(currentDate);
        day.setDate(currentDate.getDate() + i);
        day.setHours(0, 0, 0, 0);
        return day;
      });
    }
    return weekDays;
  }, [currentDate, daysCount, currentView, weekDays]);

  const weekTasksByDay = useMemo(() => {
    const daysToUse = currentView === 'week' ? customWeekDays : weekDays;
    return daysToUse.map(day => ({
      day,
      tasks: getTasksForDay(tasks, day).filter(task => !task.parentId),
      overlappingGroups: calculateOverlappingTasks(
        getTasksForDay(tasks, day).filter(task => !task.parentId)
      )
    }));
  }, [customWeekDays, weekDays, tasks, currentView]);
  
  // Month view logic
  const monthTasksByDay = useMemo(() => {
    return monthDays.map(day => ({
      day,
      tasks: getTasksForDay(tasks, day).filter(task => !task.parentId),
      visibleTasks: getTasksForDay(tasks, day).filter(task => !task.parentId).slice(0, 4),
      moreCount: Math.max(0, getTasksForDay(tasks, day).filter(task => !task.parentId).length - 4)
    }));
  }, [monthDays, tasks]);
  
  // Drag and drop logic
  const handleTaskDragStart = (task: CalendarTask, event: React.DragEvent) => {
    setDraggedTask(task);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', task.id);
  };
  
  const handleDrop = (
    targetDate: Date, 
    hour?: number, 
    minute?: number, 
    onTaskUpdate?: (taskId: string, updates: Partial<CalendarTask>) => void
  ) => {
    return (event: React.DragEvent) => {
      event.preventDefault();
      if (draggedTask && onTaskUpdate) {
        const duration = draggedTask.endTime.getTime() - draggedTask.startTime.getTime();
        const newStartTime = new Date(targetDate);
        
        if (hour !== undefined && minute !== undefined) {
          newStartTime.setHours(hour, minute, 0, 0);
        } else {
          newStartTime.setHours(draggedTask.startTime.getHours(), draggedTask.startTime.getMinutes(), 0, 0);
        }
        
        const newEndTime = new Date(newStartTime.getTime() + duration);
        
        // Validate subtask constraints
        if (draggedTask.parentId) {
          const parentTask = tasks.find(t => t.id === draggedTask.parentId);
          if (parentTask) {
            if (newStartTime < parentTask.startTime || newEndTime > parentTask.endTime) {
              alert('Subtask time must be within parent task time range');
              return;
            }
          }
        }
        
        onTaskUpdate(draggedTask.id, {
          startTime: newStartTime,
          endTime: newEndTime
        });
        setDraggedTask(null);
      }
    };
  };
  
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleTaskDrag = (task: CalendarTask) => {
    return (event: React.DragEvent) => handleTaskDragStart(task, event);
  };

  const createDropHandler = (onTaskUpdate?: (taskId: string, updates: Partial<CalendarTask>) => void) => {
    return (targetDate: Date, hour?: number, minute?: number) => {
      return handleDrop(targetDate, hour, minute, onTaskUpdate);
    };
  };
  
  return {
    // Time periods
    hours,
    weekDays: currentView === 'week' ? customWeekDays : weekDays,
    monthDays,
    
    // Task data
    dayTasks,
    dayUnscheduledTasks,
    dayOverlappingGroups,
    weekTasksByDay,
    monthTasksByDay,
    
    // Task utilities
    expandedTasks,
    hasSubtasks,
    getSubtasks,
    getSubtaskCount,
    getTaskDurationMinutes: (task: CalendarTask) => getTaskDurationMinutes(task),
    isMultiDay: (task: CalendarTask) => isMultiDay(task),
    getTaskColor: (task: CalendarTask) => getTaskColor(task),
    toggleTaskExpansion,
    isExpanded,
    
    // Drag and drop
    draggedTask,
    handleTaskDragStart,
    handleDrop,
    handleDragOver,
    handleTaskDrag,
    createDropHandler
  };
};