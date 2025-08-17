import { Task } from '@/types/task';
import { getAllTasksRecursively, getTaskDurationInMinutes } from './taskUtils';
import { PRIORITY_COLORS } from './colorConstants';

export const calculateProgressForDate = (tasks: Task[], date: Date): number => {
  const dateString = date.toDateString();
  const tasksForDate = tasks.filter(task => 
    task.date.toDateString() === dateString
  );
  
  const allTasksForDate = getAllTasksRecursively(tasksForDate);
  if (allTasksForDate.length === 0) return 0;
  
  const completedTasks = allTasksForDate.filter(task => task.completed);
  return Math.round((completedTasks.length / allTasksForDate.length) * 100);
};

export const getTasksForDate = (tasks: Task[], date: Date, missionId?: string): Task[] => {
  const allTasks = getAllTasksRecursively(tasks);
  
  return allTasks.filter(task => {
    if (missionId && task.missionId !== missionId) return false;
    return task.date.toDateString() === date.toDateString();
  });
};

export const getTasksForDateRange = (tasks: Task[], startDate: Date, endDate: Date, missionId?: string): Task[] => {
  const allTasks = getAllTasksRecursively(tasks);
  
  return allTasks.filter(task => {
    if (missionId && task.missionId !== missionId) return false;
    const taskDate = task.startTime || task.date;
    return taskDate >= startDate && taskDate <= endDate;
  });
};

export const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.P7;
};

export const getTaskBackgroundColor = (task: Task, isSelected: boolean = false): string => {
  const opacity = isSelected ? '40' : '20';
  return `${task.color}${opacity}`;
};