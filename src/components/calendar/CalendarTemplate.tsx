import React, { useMemo, useState, useEffect } from 'react';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { DraggableAddButton } from '../extra-panel/DraggableAddButton';
import { OverlayDescriptionPanel } from '../OverlayDescriptionPanel';
import { Task as TaskManagerTask, TaskAttachment } from '@/types/task';
import { convertAndSeparateTasks, convertCalendarTaskToTask } from '@/utils/taskConversion';

export type CalendarViewType = 'day' | 'week' | 'month';

export interface CalendarTask {
  id: string;
  title: string;
  description: string;
  startTime?: Date;
  endTime?: Date;
  completed: boolean;
  priority: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | 'P6' | 'P7';
  color: string;
  date: Date;
  missionId: string;
  order: number;
  attachments?: TaskAttachment[];
  parentId?: string;
  subTasks: CalendarTask[];
  isExpanded: boolean;
}

interface CalendarTemplateProps {
  tasks: TaskManagerTask[];
  onTaskUpdate: (taskId: string, updates: Partial<TaskManagerTask>) => void;
  onTaskMove: (taskId: string, newParentId?: string) => void;
  onAddTask: () => void;
  onTaskClick: (task: TaskManagerTask) => void;
  onAddSubTask: (parentId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: TaskManagerTask) => void;
  isDarkMode: boolean;
  missionId?: string;
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  currentView?: CalendarViewType;
  onViewChange?: (view: CalendarViewType) => void;
}

export const CalendarTemplate: React.FC<CalendarTemplateProps> = ({
  tasks,
  onTaskUpdate,
  onTaskMove,
  onAddTask,
  onTaskClick,
  onAddSubTask,
  onDeleteTask,
  onEditTask,
  isDarkMode,
  missionId = "1",
  selectedDate,
  onDateSelect,
  currentView: externalCurrentView,
  onViewChange
}) => {
  const [internalCurrentView, setInternalCurrentView] = useState<CalendarViewType>('week');
  const currentView = externalCurrentView || internalCurrentView;
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [showDescriptionPanel, setShowDescriptionPanel] = useState(false);
  const [weekDaysCount, setWeekDaysCount] = useState(7);
  
  useEffect(() => {
    if (selectedDate) setCurrentDate(selectedDate);
  }, [selectedDate]);

  const { scheduledTasks: calendarTasks, unscheduledTasks } = useMemo(() => {
    return convertAndSeparateTasks(tasks);
  }, [tasks]);

  const handleTaskEdit = (task: CalendarTask) => {
    onEditTask(convertCalendarTaskToTask(task));
  };

  const handleTaskDelete = (taskId: string) => {
    onDeleteTask(taskId);
  };

  const handleTaskSelect = (task: CalendarTask) => {
    if (currentView === 'day' && task.description && task.description !== 'Click to add description...') {
      const isCurrentlySelected = selectedTask?.id === task.id && showDescriptionPanel;
      setShowDescriptionPanel(!isCurrentlySelected);
      setSelectedTask(isCurrentlySelected ? null : task);
    } else {
      setSelectedTask(task);
      setShowDescriptionPanel(false);
    }
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
    onDateSelect?.(date);
  };

  const handleViewChange = (view: CalendarViewType) => {
    if (onViewChange) onViewChange(view);
    else setInternalCurrentView(view);
  };

  const commonProps = {
    currentDate,
    tasks: calendarTasks,
    isDarkMode,
    onTaskUpdate,
    onTaskDelete: handleTaskDelete,
    onTaskSelect: handleTaskSelect,
    onTaskEdit: handleTaskEdit,
    onDateChange: handleDateChange,
    onAddSubTask: (task: CalendarTask) => onAddSubTask(task.id)
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'day':
        return <DayView {...commonProps} unscheduledTasks={unscheduledTasks} onUnscheduledTaskEdit={handleTaskEdit} onUnscheduledAddSubTask={(task: CalendarTask) => onAddSubTask(task.id)} />;
      case 'week':
        return <WeekView {...commonProps} daysCount={weekDaysCount} />;
      case 'month':
        return <MonthView {...commonProps} onViewChange={handleViewChange} />;
      default:
        return <WeekView {...commonProps} />;
    }
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'transparent', backdropFilter: 'none', filter: 'none' }}>
      {/* Header */}
      <div className="flex flex-row items-center justify-between p-2 sm:p-4 border-b border-white/20 gap-2 sm:gap-4" style={{ backgroundColor: 'transparent', backdropFilter: 'none', filter: 'none' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <h1 className="text-lg sm:text-2xl font-semibold text-foreground">
            {currentDate.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
              ...(currentView === 'day' && {
                day: 'numeric'
              })
            })}
          </h1>
          <div className="flex gap-1 sm:gap-2">
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - (currentView === 'day' ? 1 : currentView === 'week' ? 7 : 30))))} 
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              ←
            </button>
            <button 
              onClick={() => {
                const today = new Date();
                setCurrentDate(today);
                if (onDateSelect) {
                  onDateSelect(today);
                }
              }} 
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Today
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + (currentView === 'day' ? 1 : currentView === 'week' ? 7 : 30))))} 
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
            >
              →
            </button>
          </div>
        </div>
        
        {/* Days Input (only for Week View) */}
        {currentView === 'week' && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Days:</label>
            <input
              type="number"
              min="1"
              value={weekDaysCount || ''}
              onChange={(e) => setWeekDaysCount(e.target.value === '' ? 0 : parseInt(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              placeholder="7"
              className="w-16 px-2 py-1 text-sm bg-secondary border border-secondary-foreground/20 rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}
        
        {/* View Buttons */}
        <div className="flex bg-white/20 rounded-lg p-0.5 sm:p-1 w-full sm:w-auto">
          {(['month', 'week', 'day'] as CalendarViewType[]).map((view) => (
            <button
              key={view}
              onClick={() => handleViewChange(view)}
              className={`px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex-1 sm:flex-none ${
                currentView === view
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Calendar Content */}
      <div className="flex-1 overflow-hidden relative">
        {renderCurrentView()}
      </div>

      {/* Draggable Add Button */}
      <DraggableAddButton 
        onClick={onAddTask} 
        isDarkMode={isDarkMode} 
      />

      {/* Description Panel - Only for Day View */}
      {currentView === 'day' && (
        <OverlayDescriptionPanel 
          selectedTask={selectedTask} 
          isDarkMode={isDarkMode} 
          isVisible={showDescriptionPanel} 
          onClose={() => {
            setShowDescriptionPanel(false);
            setSelectedTask(null);
          }} 
          onDescriptionUpdate={(description, attachments, comments) => {
            if (!selectedTask) return;
            const updateData: any = { description };
            if (attachments?.length) {
              updateData.attachments = attachments.map(att => ({
                ...att,
                id: Date.now().toString() + Math.random()
              }));
            }
            if (comments) updateData.comments = comments;
            onTaskUpdate(selectedTask.id, updateData);
          }}
          onSettingsClick={() => {}} 
          onWorkspaceClick={() => {}} 
          onSignOut={() => {}} 
        />
      )}
    </div>
  );
};