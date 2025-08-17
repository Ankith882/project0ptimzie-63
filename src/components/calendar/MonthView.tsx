import React, { useState } from 'react';
import { CalendarTask } from './CalendarTemplate';
import { TaskRenderer } from './TaskRenderer';
import { CalendarSubtaskDropdown } from './CalendarSubtaskDropdown';
import { useCalendar } from '@/hooks/useCalendar';
import { isToday } from '@/utils/calendarUtils';
import { ScrollArea, Button } from '@/components/ui';
import { X } from 'lucide-react';

interface MonthViewProps {
  currentDate: Date;
  tasks: CalendarTask[];
  isDarkMode: boolean;
  onTaskUpdate: (taskId: string, updates: Partial<CalendarTask>) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskSelect: (task: CalendarTask) => void;
  onTaskEdit: (task: CalendarTask) => void;
  onDateChange: (date: Date) => void;
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  onAddSubTask?: (parentTask: CalendarTask) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  tasks,
  isDarkMode,
  onTaskUpdate,
  onTaskDelete,
  onTaskSelect,
  onTaskEdit,
  onDateChange,
  onViewChange,
  onAddSubTask
}) => {
  const [selectedDayTasks, setSelectedDayTasks] = useState<{ date: Date; tasks: CalendarTask[] } | null>(null);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);

  const {
    expandedTasks,
    handleTaskDrag,
    createDropHandler,
    toggleTaskExpansion,
  } = useCalendar({ tasks, currentDate, currentView: 'month' });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const currentMonth = currentDate.getMonth();

  // Month grid generation
  const monthStart = (() => {
    const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    start.setDate(start.getDate() - start.getDay());
    return start;
  })();
  
  const monthDays = Array.from({ length: 42 }, (_, i) => {
    const day = new Date(monthStart);
    day.setDate(monthStart.getDate() + i);
    return day;
  });

  // Task filtering
  const getTasksForDay = (day: Date) => {
    const dayStart = new Date(day).setHours(0, 0, 0, 0);
    const dayEnd = new Date(day).setHours(23, 59, 59, 999);
    
    return tasks
      .filter(task => {
        const taskStart = new Date(task.startTime).getTime();
        const taskEnd = new Date(task.endTime).getTime();
        return taskStart <= dayEnd && taskEnd >= dayStart && !task.parentId;
      })
      .sort((a, b) => {
        const aMultiDay = a.startTime.toDateString() !== a.endTime.toDateString();
        const bMultiDay = b.startTime.toDateString() !== b.endTime.toDateString();
        return aMultiDay === bMultiDay ? 0 : aMultiDay ? -1 : 1;
      });
  };

  const getVisibleTasksForDay = (day: Date) => getTasksForDay(day).slice(0, 4);
  const getMoreTasksCount = (day: Date) => Math.max(0, getTasksForDay(day).length - 4);
  const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth;

  const handleDayClick = (day: Date) => {
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      onDateChange(day);
      onViewChange?.('day');
    } else {
      setClickTimeout(setTimeout(() => {
        setClickTimeout(null);
        const dayTasks = getTasksForDay(day);
        if (dayTasks.length > 4) {
          setSelectedDayTasks({ date: day, tasks: dayTasks });
        }
      }, 300));
    }
  };

  const getModalTasks = () => {
    if (!selectedDayTasks) return [];
    return getTasksForDay(selectedDayTasks.date);
  };

  const handleDrop = createDropHandler(onTaskUpdate);

  // Use TaskRenderer for month view - same as Week and Day views
  const renderTaskInMonth = (task: CalendarTask, currentDay: Date) => {
    return (
      <div key={`task-group-${task.id}`} className="pointer-events-auto">
        <TaskRenderer
          task={task}
          mode="month"
          currentDay={currentDay}
          hasSubtasks={task.subTasks.length > 0}
          subtaskCount={task.subTasks.length}
          isExpanded={expandedTasks.has(task.id)}
          onTaskSelect={onTaskSelect}
          onTaskEdit={onTaskEdit}
          onTaskDelete={onTaskDelete}
          onAddSubTask={onAddSubTask}
          onToggleExpansion={toggleTaskExpansion}
          onDragStart={handleTaskDrag}
          showAddSubTask={true}
        />
      
        {/* Subtask Dropdown - Only show if expanded */}
        {expandedTasks.has(task.id) && (
          <div className="absolute top-full left-0 z-50 mt-1">
            <CalendarSubtaskDropdown
              task={task}
              isExpanded={expandedTasks.has(task.id)}
              onTaskClick={onTaskSelect}
              onToggleExpansion={toggleTaskExpansion}
              onEditTask={onTaskEdit}
              onAddSubTask={onAddSubTask || (() => {})}
              onDeleteTask={onTaskDelete}
              position={{ top: '0px', left: '0px', width: '280px' }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderTaskInModal = (task: CalendarTask) => (
    <div key={`modal-task-${task.id}`} className="relative">
      <TaskRenderer
        task={task}
        mode="modal"
        hasSubtasks={task.subTasks.length > 0}
        subtaskCount={task.subTasks.length}
        isExpanded={expandedTasks.has(task.id)}
        onTaskSelect={(task) => {
          onTaskSelect(task);
          setSelectedDayTasks(null);
        }}
        onTaskEdit={onTaskEdit}
        onTaskDelete={onTaskDelete}
        onToggleExpansion={toggleTaskExpansion}
      />
      
      {expandedTasks.has(task.id) && (
        <CalendarSubtaskDropdown
          task={task}
          isExpanded={expandedTasks.has(task.id)}
          onTaskClick={(subTask) => {
            onTaskSelect(subTask);
            setSelectedDayTasks(null);
          }}
          onToggleExpansion={toggleTaskExpansion}
          onEditTask={onTaskEdit}
          onAddSubTask={onAddSubTask || (() => {})}
          onDeleteTask={onTaskDelete}
          position={{ top: '100%', left: '0px', width: '400px' }}
        />
      )}
    </div>
  );

  return (
    <ScrollArea className="h-[calc(100vh-4rem)]">
      <div className="p-4 min-h-full relative" style={{ backgroundColor: 'transparent', backdropFilter: 'none', filter: 'none' }}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="grid grid-cols-7 border-b-2 border-foreground/30">
            {dayNames.map(day => (
              <div key={day} className="p-1 sm:p-3 text-center font-medium border-r-2 border-foreground/30 text-xs sm:text-sm">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 flex-1">
            {monthDays.map(day => {
              const dayTasks = getVisibleTasksForDay(day);
              const moreCount = getMoreTasksCount(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`border-r-2 border-b-2 border-foreground/20 p-1 sm:p-2 min-h-[120px] sm:min-h-[180px] cursor-pointer transition-colors hover:bg-muted/50 relative ${
                    !isCurrentMonth(day) ? 'bg-muted/20 text-muted-foreground opacity-50' : ''
                  } ${isToday(day) ? 'bg-primary/10 ring-2 ring-primary/50' : ''}`}
                  onClick={() => handleDayClick(day)}
                  onDrop={handleDrop(day, 0, 0)}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${isToday(day) ? 'text-primary' : ''}`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
                    {dayTasks.map((task, index) => (
                      <div key={`${day.toISOString()}-${task.id}-${index}`} className="relative w-full overflow-hidden">
                        {renderTaskInMonth(task, day)}
                      </div>
                    ))}
                    
                    {moreCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDayTasks({ date: day, tasks: getTasksForDay(day) });
                        }}
                        className="text-xs text-primary hover:text-primary/80 font-medium w-full text-left px-1 py-0.5 sm:py-1 rounded hover:bg-muted/30 transition-colors"
                      >
                        +{moreCount} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal for day tasks */}
        {selectedDayTasks && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-medium text-foreground">
                  Tasks for {selectedDayTasks.date.toLocaleDateString()}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedDayTasks(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 space-y-2 overflow-y-auto max-h-[60vh]">
                {getModalTasks().map(task => renderTaskInModal(task))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};