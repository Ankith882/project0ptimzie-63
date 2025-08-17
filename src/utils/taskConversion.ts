import { Task } from '@/types/task';
import { CalendarTask } from '@/components/calendar/CalendarTemplate';

/**
 * Centralized task conversion utilities
 * Consolidates all task conversion logic into a single location
 */

/**
 * Convert a Task to CalendarTask format
 */
export const convertTaskToCalendarTask = (task: Task): CalendarTask => {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    completed: task.completed,
    priority: task.priority,
    color: task.color,
    startTime: task.startTime ? new Date(task.startTime) : new Date(),
    endTime: task.endTime ? new Date(task.endTime) : new Date(),
    attachments: task.attachments,
    date: task.date,
    missionId: task.missionId,
    parentId: task.parentId,
    order: task.order,
    subTasks: task.subTasks.map(convertTaskToCalendarTask),
    isExpanded: task.isExpanded || false
  };
};

/**
 * Convert a CalendarTask back to Task format
 */
export const convertCalendarTaskToTask = (calendarTask: CalendarTask): Task => {
  return {
    ...calendarTask,
    categoryId: undefined,
    createdAt: new Date(),
    subTasks: calendarTask.subTasks.map(convertCalendarTaskToTask)
  };
};

/**
 * Separate tasks into scheduled and unscheduled groups
 */
export interface TaskSeparationResult {
  scheduledTasks: CalendarTask[];
  unscheduledTasks: CalendarTask[];
}

/**
 * Timeline specific separation result that keeps Tasks format for scheduled tasks
 */
export interface TimelineTaskSeparationResult {
  scheduledTasks: Task[];
  unscheduledTasks: CalendarTask[];
}

/**
 * Convert tasks and separate into scheduled/unscheduled groups
 * This replaces the duplicate logic found in TimelineTemplate and CalendarTemplate
 */
export const convertAndSeparateTasks = (tasks: Task[]): TaskSeparationResult => {
  const scheduled: CalendarTask[] = [];
  const unscheduled: CalendarTask[] = [];
  
  // Helper function to recursively add all subtasks to unscheduled list
  const addSubTasksToUnscheduled = (parentTask: CalendarTask) => {
    parentTask.subTasks.forEach(subTask => {
      unscheduled.push(subTask);
      addSubTasksToUnscheduled(subTask);
    });
  };
  
  // Process only top-level tasks (no parentId)
  tasks.filter(task => !task.parentId).forEach(task => {
    const calendarTask = convertTaskToCalendarTask(task);
    
    // Tasks with both start and end times are scheduled
    if (task.startTime && task.endTime) {
      scheduled.push(calendarTask);
    } else {
      // Tasks without timing are unscheduled
      unscheduled.push(calendarTask);
      // Add all subtasks recursively to unscheduled list
      addSubTasksToUnscheduled(calendarTask);
    }
  });
  
  return { 
    scheduledTasks: scheduled, 
    unscheduledTasks: unscheduled 
  };
};

/**
 * Alternative function for Timeline template that processes all tasks recursively
 */
export const convertTasksForTimeline = (tasks: Task[]): TimelineTaskSeparationResult => {
  const scheduled: Task[] = [];
  const unscheduled: CalendarTask[] = [];
  
  // Helper function to recursively add all subtasks to unscheduled list
  const addSubTasksToUnscheduled = (parentTask: Task) => {
    parentTask.subTasks?.forEach(subTask => {
      const subCalendarTask = convertTaskToCalendarTask(subTask);
      unscheduled.push(subCalendarTask);
      addSubTasksToUnscheduled(subTask);
    });
  };
  
  // Process all tasks recursively
  const processTask = (task: Task) => {
    // Tasks without start/end time are unscheduled
    if (!task.startTime || !task.endTime) {
      const calendarTask = convertTaskToCalendarTask(task);
      unscheduled.push(calendarTask);
      addSubTasksToUnscheduled(task);
    } else {
      scheduled.push(task);
    }
  };
  
  tasks.forEach(task => processTask(task));
  
  return { 
    scheduledTasks: scheduled, 
    unscheduledTasks: unscheduled 
  };
};