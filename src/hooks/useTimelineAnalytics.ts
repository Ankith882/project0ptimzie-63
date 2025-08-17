import { useMemo, useState } from 'react';
import { Task } from '@/types/task';
import { startOfWeek, endOfWeek, isWithinInterval, format, subDays, addDays } from 'date-fns';

export type TimeMode = 'daily' | 'weekly' | 'monthly';
export type ChartType = 'circular' | '3d-cylinder' | 'bubble';

export const useTimelineAnalytics = (tasks: Task[]) => {
  const [timeMode, setTimeMode] = useState<TimeMode>('weekly');
  const [selectedChart, setSelectedChart] = useState<ChartType>('circular');
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 30),
    end: new Date()
  });

  const analyticsData = useMemo(() => {
    // Helper function to calculate actual overlap duration in hours
    const calculateOverlapDuration = (task: Task, periodStart: Date, periodEnd: Date): number => {
      if (!task.startTime || !task.endTime) return 0;
      
      const taskStart = new Date(task.startTime);
      const taskEnd = new Date(task.endTime);
      
      // Check if task overlaps with period
      if (taskStart > periodEnd || taskEnd < periodStart) return 0;
      
      // Calculate the actual overlap period
      const overlapStart = new Date(Math.max(taskStart.getTime(), periodStart.getTime()));
      const overlapEnd = new Date(Math.min(taskEnd.getTime(), periodEnd.getTime()));
      
      // Return duration in hours
      return (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
    };

    // Calculate totals for the entire date range
    let totalHoursInRange = 0;
    let completedHoursInRange = 0;
    let pendingHoursInRange = 0;

    // Priority breakdown by actual time (in hours)
    const priorityBreakdown = {
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0,
      P5: 0,
      P6: 0,
      P7: 0,
    };

    // Calculate actual time spent for each task within the ENTIRE date range
    tasks.forEach(task => {
      const overlapHours = calculateOverlapDuration(task, dateRange.start, dateRange.end);
      if (overlapHours > 0) {
        totalHoursInRange += overlapHours;
        
        if (task.completed) {
          completedHoursInRange += overlapHours;
        } else {
          pendingHoursInRange += overlapHours;
        }
        
        // Add to priority breakdown by actual time
        if (task.priority && priorityBreakdown.hasOwnProperty(task.priority)) {
          priorityBreakdown[task.priority as keyof typeof priorityBreakdown] += overlapHours;
        }
      }
    });

    const timeBreakdown = [];
    if (timeMode === 'daily') {
      // Calculate number of days in the date range
      const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const daysToShow = Math.min(totalDays, 7); // Show max 7 days
      
      for (let i = 0; i < daysToShow; i++) {
        const dayStart = addDays(dateRange.start, i);
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999); // End of day
        
        // Calculate actual duration that falls within this specific day
        let completedHours = 0;
        let pendingHours = 0;
        let totalHours = 0;
        
        tasks.forEach(task => {
          const overlapHours = calculateOverlapDuration(task, dayStart, dayEnd);
          if (overlapHours > 0) {
            totalHours += overlapHours;
            if (task.completed) {
              completedHours += overlapHours;
            } else {
              pendingHours += overlapHours;
            }
          }
        });
        
        timeBreakdown.push({
          label: format(dayStart, 'MMM dd'),
          completed: Math.round(completedHours * 100) / 100,
          pending: Math.round(pendingHours * 100) / 100,
          total: Math.round(totalHours * 100) / 100
        });
      }
    } else if (timeMode === 'weekly') {
      // Calculate number of weeks to show based on date range
      const totalWeeks = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const weeksToShow = Math.min(totalWeeks, 4); // Show max 4 weeks
      
      for (let i = 0; i < weeksToShow; i++) {
        const weekStart = startOfWeek(addDays(dateRange.start, i * 7), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        
        // Calculate actual duration that falls within this week
        let completedHours = 0;
        let pendingHours = 0;
        let totalHours = 0;
        
        tasks.forEach(task => {
          const overlapHours = calculateOverlapDuration(task, weekStart, weekEnd);
          if (overlapHours > 0) {
            totalHours += overlapHours;
            if (task.completed) {
              completedHours += overlapHours;
            } else {
              pendingHours += overlapHours;
            }
          }
        });
        
        timeBreakdown.push({
          label: `Week ${i + 1}`,
          completed: Math.round(completedHours * 100) / 100,
          pending: Math.round(pendingHours * 100) / 100,
          total: Math.round(totalHours * 100) / 100
        });
      }
    } else if (timeMode === 'monthly') {
      // Add monthly breakdown
      const startMonth = new Date(dateRange.start.getFullYear(), dateRange.start.getMonth(), 1);
      const endMonth = new Date(dateRange.end.getFullYear(), dateRange.end.getMonth() + 1, 0);
      
      let currentMonth = new Date(startMonth);
      let monthIndex = 1;
      
      while (currentMonth <= endMonth && monthIndex <= 12) {
        const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        // Calculate actual duration that falls within this month
        let completedHours = 0;
        let pendingHours = 0;
        let totalHours = 0;
        
        tasks.forEach(task => {
          const overlapHours = calculateOverlapDuration(task, monthStart, monthEnd);
          if (overlapHours > 0) {
            totalHours += overlapHours;
            if (task.completed) {
              completedHours += overlapHours;
            } else {
              pendingHours += overlapHours;
            }
          }
        });
        
        timeBreakdown.push({
          label: format(monthStart, 'MMM yyyy'),
          completed: Math.round(completedHours * 100) / 100,
          pending: Math.round(pendingHours * 100) / 100,
          total: Math.round(totalHours * 100) / 100
        });
        
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        monthIndex++;
      }
    }

    return {
      total: Math.round(totalHoursInRange * 100) / 100, // Total hours instead of task count
      completed: Math.round(completedHoursInRange * 100) / 100, // Completed hours instead of task count
      pending: Math.round(pendingHoursInRange * 100) / 100, // Pending hours instead of task count
      completionRate: totalHoursInRange > 0 ? (completedHoursInRange / totalHoursInRange) * 100 : 0, // Completion rate by hours
      priorityBreakdown: {
        P1: Math.round(priorityBreakdown.P1 * 100) / 100,
        P2: Math.round(priorityBreakdown.P2 * 100) / 100,
        P3: Math.round(priorityBreakdown.P3 * 100) / 100,
        P4: Math.round(priorityBreakdown.P4 * 100) / 100,
        P5: Math.round(priorityBreakdown.P5 * 100) / 100,
        P6: Math.round(priorityBreakdown.P6 * 100) / 100,
        P7: Math.round(priorityBreakdown.P7 * 100) / 100,
      },
      timeBreakdown
    };
  }, [tasks, timeMode, dateRange]);

  return {
    analyticsData,
    timeMode,
    setTimeMode,
    selectedChart,
    setSelectedChart,
    dateRange,
    setDateRange
  };
};