import { Task } from '@/types/task';
import { WeekSegmentTask } from './timelineUtils';
import { startOfWeek, endOfWeek } from 'date-fns';

export const useTaskSplitting = (currentWeekStart: Date) => {
  const splitMultiWeekTasks = (task: Task): WeekSegmentTask[] => {
    if (!task.startTime || !task.endTime) return [task];
    
    const startDate = new Date(task.startTime);
    const endDate = new Date(task.endTime);
    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

    if (endDate < currentWeekStart || startDate > currentWeekEnd) {
      return [];
    }

    const startsBeforeWeek = startDate < currentWeekStart;
    const endsAfterWeek = endDate > currentWeekEnd;
    
    // Check if task spans across week boundaries regardless of duration
    const spansAcrossWeeks = startsBeforeWeek || endsAfterWeek;
    
    // Check if task spans multiple calendar days (even if less than 24 hours)
    const startDay = startDate.toDateString();
    const endDay = endDate.toDateString();
    const isMultiDay = startDay !== endDay;
    
    // Task needs splitting if it spans across weeks OR spans multiple days within current week
    const needsSplitting = spansAcrossWeeks || (isMultiDay && !spansAcrossWeeks);
    
    if (!needsSplitting) {
      return [task];
    }

    const clampedStartTime = startsBeforeWeek 
      ? new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate(), 0, 0, 0) 
      : startDate;
    const clampedEndTime = endsAfterWeek 
      ? new Date(currentWeekEnd.getFullYear(), currentWeekEnd.getMonth(), currentWeekEnd.getDate(), 23, 59, 59) 
      : endDate;

    const totalWeeksSpanned = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const isMultiWeek = totalWeeksSpanned > 1 || spansAcrossWeeks;
    const weekNumber = Math.floor((currentWeekStart.getTime() - startOfWeek(startDate, { weekStartsOn: 0 }).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const isLastWeekSegment = (!endsAfterWeek && isMultiWeek) || (spansAcrossWeeks && !endsAfterWeek);
    
    return [{
      ...task,
      startTime: clampedStartTime,
      endTime: clampedEndTime,
      isWeekSegment: isMultiWeek,
      originalStartTime: task.startTime,
      originalEndTime: task.endTime,
      weekNumber,
      totalWeeks: totalWeeksSpanned,
      isLastWeekSegment,
      weekSegmentId: isMultiWeek ? `${task.id}_week_${currentWeekStart.getTime()}` : task.id
    } as WeekSegmentTask];
  };

  return { splitMultiWeekTasks };
};