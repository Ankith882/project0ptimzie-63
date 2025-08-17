import { Task } from '@/types/task';
import { startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

export interface TaskWithLevel extends Task {
  level: number;
}

export interface WeekSegmentTask extends Task {
  isWeekSegment?: boolean;
  originalStartTime?: Date | string;
  originalEndTime?: Date | string;
  weekNumber?: number;
  totalWeeks?: number;
  isLastWeekSegment?: boolean;
  weekSegmentId?: string;
}

export interface TaskBlock {
  task: WeekSegmentTask;
  left: number;
  width: number;
  dayIndex: number;
  top: number;
  height: number;
  isCurrentWeekPart?: boolean;
  originalTask?: Task;
  spannedDays?: number;
  endDayIndex?: number;
}

import { getTaskDurationInMinutes, findTaskById } from '@/utils/taskUtils';

export const getVisibleTasks = (allTasks: Task[]): TaskWithLevel[] => {
  const rootTasks = allTasks.filter(task => !task.parentId);
  return rootTasks.map(task => ({ ...task, level: 0 }));
};

export const generateTimeMarkers = (isZoomedIn: boolean, HOUR_WIDTH: number, MINUTE_WIDTH: number) => {
  const timeMarkers = [];
  if (isZoomedIn) {
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 10) {
        const totalMinutes = hour * 60 + minute;
        const timeLabel = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        timeMarkers.push({
          hour,
          minute,
          label: timeLabel,
          position: totalMinutes * MINUTE_WIDTH
        });
      }
    }
  } else {
    for (let hour = 0; hour < 24; hour += 4) {
      const timeLabel = hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`;
      timeMarkers.push({
        hour,
        label: timeLabel,
        position: hour * HOUR_WIDTH
      });
    }
  }
  return timeMarkers;
};