import { useMemo } from 'react';
import { Task } from '@/types/task';
import { WeekSegmentTask } from './timelineUtils';
import { format } from 'date-fns';
import { getTaskDurationInMinutes, findTaskById, getTotalSubtaskCount } from '@/utils/taskUtils';
import { DEFAULT_TASK_COLOR } from '@/utils/colorConstants';

export const useTaskHelpers = (tasks: Task[]) => {
  const getTaskColor = (task: Task) => {
    return task.color || DEFAULT_TASK_COLOR;
  };

  const getSubtaskCount = (parentId: string): number => {
    const parentTask = findTaskById(tasks, parentId);
    return parentTask?.subTasks?.length || 0;
  };

  const getTotalSubtaskCountForParent = (parentId: string): number => {
    const parentTask = findTaskById(tasks, parentId);
    if (!parentTask) return 0;
    return getTotalSubtaskCount(parentTask);
  };

  const formatTaskTime = (task: WeekSegmentTask, isWeekSegment: boolean = false) => {
    if (!task.startTime || !task.endTime) return '';

    if (task.isWeekSegment && task.originalStartTime && task.originalEndTime) {
      const originalStart = new Date(task.originalStartTime);
      const originalEnd = new Date(task.originalEndTime);
      const startMonth = originalStart.getMonth();
      const endMonth = originalEnd.getMonth();
      const startYear = originalStart.getFullYear();
      const endYear = originalEnd.getFullYear();

      if (startMonth !== endMonth || startYear !== endYear) {
        const startMonthName = format(originalStart, 'MMMM');
        const endMonthName = format(originalEnd, 'MMMM');
        const yearSuffix = startYear !== endYear ? ` ${endYear}` : '';
        const startDateTime = `${format(originalStart, 'dd/MM/yyyy')} ${format(originalStart, 'h:mm a')}`;
        const endDateTime = `${format(originalEnd, 'dd/MM/yyyy')} ${format(originalEnd, 'h:mm a')}`;
        const monthRange = `${startMonthName} – ${endMonthName}${yearSuffix}`;
        
        return {
          displayText: `${startDateTime} – ${endDateTime} (${monthRange})`,
          isMultiMonth: true,
          isSegment: true
        };
      } else {
        const startTime = format(originalStart, 'h:mm a');
        const endTime = format(originalEnd, 'h:mm a');
        const startDate = format(originalStart, 'dd/MM/yyyy');
        const endDate = format(originalEnd, 'dd/MM/yyyy');
        
        return {
          timeRange: `${startTime} – ${endTime}`,
          dateRange: `${startDate} – ${endDate}`,
          isMultiWeek: true,
          isSegment: true
        };
      }
    }

    const start = new Date(task.startTime);
    const end = new Date(task.endTime);
    const startTime = format(start, 'h:mm a');
    const endTime = format(end, 'h:mm a');
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return `${startTime} – ${endTime}`;
    } else {
      const startDate = format(start, 'dd/MM/yyyy');
      const endDate = format(end, 'dd/MM/yyyy');
      return {
        time: `${startTime} – ${endTime}`,
        dates: `${startDate} – ${endDate}`
      };
    }
  };

  return {
    getTaskColor,
    getTaskDurationInMinutes,
    findTaskById,
    getSubtaskCount,
    getTotalSubtaskCount: getTotalSubtaskCountForParent,
    formatTaskTime
  };
};