import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ScrollArea, Button } from '@/components/ui';
import { Task } from '@/types/task';
import { CalendarTask } from '../calendar/CalendarTemplate';
import { CategoryProvider } from '@/contexts/CategoryContext';
import { useCategoryManager } from '@/hooks/useCategoryContext';
import { useTimelineGrid } from '@/hooks/useTimelineGrid';
import { generateTimeMarkers } from '@/hooks/timelineUtils';
import { useTaskHelpers } from '@/hooks/useTaskHelpers';
import { convertTasksForTimeline } from '@/utils/taskConversion';
import { TimelineHeader } from './TimelineHeader';
import { UnifiedTimelineTaskBlock } from './UnifiedTimelineTaskBlock';
import { SubtaskDropdown } from './SubtaskDropdown';
import { DraggableMenuButton } from './DraggableMenuButton';
import { EnhancedAnalyticsPanel } from './EnhancedAnalyticsPanel';
import { CategoriesPanel } from './CategoriesPanel';
import { startOfWeek, isSameDay } from 'date-fns';
import { Settings } from 'lucide-react';

interface TimelineTemplateProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskMove: (taskId: string, newColumnId: string) => void;
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  onAddSubTask: (parentId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  isDarkMode: boolean;
  selectedDate?: Date;
}

export const TimelineTemplate: React.FC<TimelineTemplateProps> = (props) => {
  return (
    <CategoryProvider>
      <TimelineContent {...props} />
    </CategoryProvider>
  );
};

const TimelineContent: React.FC<TimelineTemplateProps> = (props) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const dateToUse = props.selectedDate || new Date();
    return startOfWeek(dateToUse, { weekStartsOn: 0 });
  });
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [menuMode, setMenuMode] = useState<'analytics' | 'categories'>('analytics');
  const [showPanel, setShowPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { categories } = useCategoryManager();

  const { scheduledTasks, unscheduledTasks } = useMemo(() => {
    return convertTasksForTimeline(props.tasks);
  }, [props.tasks, categories]);

  const { 
    weekDates, 
    taskBlocks, 
    DAY_WIDTH, 
    HOUR_WIDTH, 
    MINUTE_WIDTH, 
    TASK_HEIGHT 
  } = useTimelineGrid(scheduledTasks, currentWeekStart, isZoomedIn);

  const { getSubtaskCount, getTotalSubtaskCount } = useTaskHelpers(scheduledTasks);

  const handleTaskEdit = (task: CalendarTask) => {
    const originalTask = props.tasks.find(t => t.id === task.id);
    if (originalTask) {
      props.onEditTask(originalTask);
    }
  };

  const handleAddSubTask = (task: CalendarTask) => {
    props.onAddSubTask(task.id);
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

  const getUnscheduledTasksForDate = (date: Date): CalendarTask[] => {
    return unscheduledTasks.filter(task => {
      const taskDate = new Date(task.date);
      return isSameDay(taskDate, date);
    });
  };

  const handleTimeBlockDoubleClick = (date: Date, hour: number) => {
    const newZoomState = !isZoomedIn;
    setIsZoomedIn(newZoomState);

    setTimeout(() => {
      if (!scrollRef.current) return;
      const dayIndex = weekDates.findIndex(d => isSameDay(d, date));
      if (dayIndex === -1) return;

      const hourWidth = newZoomState ? 240 : 40;
      const minuteWidth = newZoomState ? 4 : 0;
      const timePosition = newZoomState ? hour * 60 * minuteWidth : hour * hourWidth;
      const dayWidth = hourWidth * 24;
      const scrollLeft = dayIndex * dayWidth + timePosition - scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollLeft = Math.max(0, scrollLeft);
    }, 200);
  };

  const handleModeChange = (mode: 'analytics' | 'categories') => {
    setMenuMode(mode);
    setShowPanel(true);
  };

  // Effect to handle selectedDate changes
  useEffect(() => {
    if (props.selectedDate) {
      const selectedWeekStart = startOfWeek(props.selectedDate, { weekStartsOn: 0 });

      if (selectedWeekStart.getTime() !== currentWeekStart.getTime()) {
        setCurrentWeekStart(selectedWeekStart);
      }

      setTimeout(() => {
        const dayIndex = weekDates.findIndex(d => isSameDay(d, props.selectedDate!));
        if (dayIndex !== -1 && scrollRef.current) {
          const dayPosition = dayIndex * DAY_WIDTH + DAY_WIDTH / 2;
          const scrollLeft = dayPosition - scrollRef.current.clientWidth / 2;
          scrollRef.current.scrollLeft = Math.max(0, scrollLeft);
        }
      }, 100);
    }
  }, [props.selectedDate, currentWeekStart, weekDates, DAY_WIDTH]);

  const timeMarkers = generateTimeMarkers(isZoomedIn, HOUR_WIDTH, MINUTE_WIDTH);

  return (
    <>
      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="min-h-full flex flex-col">
          <div className="flex-1 overflow-hidden">
            <div 
              ref={scrollRef} 
              className="h-full overflow-x-auto overflow-y-auto" 
              style={{ scrollBehavior: 'smooth' }}
            >
              <div style={{ minWidth: `${weekDates.length * DAY_WIDTH}px` }}>
                <TimelineHeader
                  weekDates={weekDates}
                  selectedDate={props.selectedDate}
                  isZoomedIn={isZoomedIn}
                  timeMarkers={timeMarkers}
                  dayWidth={DAY_WIDTH}
                  hourWidth={HOUR_WIDTH}
                  minuteWidth={MINUTE_WIDTH}
                  unscheduledTasks={unscheduledTasks}
                  onUnscheduledTaskEdit={handleTaskEdit}
                  onUnscheduledTaskDelete={props.onDeleteTask}
                  onUnscheduledAddSubTask={handleAddSubTask}
                  onTimeBlockDoubleClick={handleTimeBlockDoubleClick}
                  getUnscheduledTasksForDate={getUnscheduledTasksForDate}
                />

                <div className="relative" style={{ height: '600px' }}>
                  {/* Background grid */}
                  <div className="absolute inset-0">
                    {weekDates.map((_, index) => (
                      <div 
                        key={index} 
                        className="absolute top-0 bottom-0 border-r border-transparent" 
                        style={{
                          left: `${index * DAY_WIDTH}px`,
                          width: `${DAY_WIDTH}px`
                        }}
                      >
                        {Array.from({ length: 24 }, (_, hour) => (
                          <div 
                            key={hour} 
                            className="absolute top-0 bottom-0 border-r border-border/10" 
                            style={{ left: `${hour * HOUR_WIDTH}px` }} 
                          />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Task blocks */}
                  {taskBlocks.map((block) => {
                    const subtaskCount = getSubtaskCount(block.task.id);
                    const isExpanded = expandedTasks.has(block.task.id);

                    return (
                      <UnifiedTimelineTaskBlock
                        key={block.task.id}
                        block={block}
                        level={0}
                        dayWidth={DAY_WIDTH}
                        isExpanded={isExpanded}
                        subtaskCount={subtaskCount}
                        tasks={scheduledTasks}
                        onTaskClick={props.onTaskClick}
                        onToggleExpansion={toggleTaskExpansion}
                        onEditTask={props.onEditTask}
                        onAddSubTask={props.onAddSubTask}
                        onDeleteTask={props.onDeleteTask}
                      />
                    );
                  })}

                  {/* Subtask dropdowns */}
                  {taskBlocks.map((block) => (
                    <SubtaskDropdown
                      key={`subtasks-${block.task.id}`}
                      block={block}
                      tasks={scheduledTasks}
                      expandedTasks={expandedTasks}
                      currentWeekStart={currentWeekStart}
                      dayWidth={DAY_WIDTH}
                      taskHeight={TASK_HEIGHT}
                      onTaskClick={props.onTaskClick}
                      onToggleExpansion={toggleTaskExpansion}
                      onEditTask={props.onEditTask}
                      onAddSubTask={props.onAddSubTask}
                      onDeleteTask={props.onDeleteTask}
                      getTotalSubtaskCount={getTotalSubtaskCount}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {!showPanel && (
        <DraggableMenuButton
          onModeChange={handleModeChange}
          currentMode={menuMode}
          isDarkMode={props.isDarkMode}
        />
      )}
      
      {showPanel && menuMode === 'analytics' && (
        <EnhancedAnalyticsPanel
          tasks={props.tasks}
          isDarkMode={props.isDarkMode}
          onClose={() => setShowPanel(false)}
        />
      )}
      
      {showPanel && menuMode === 'categories' && (
        <CategoriesPanel
          isDarkMode={props.isDarkMode}
          onClose={() => setShowPanel(false)}
        />
      )}
    </>
  );
};