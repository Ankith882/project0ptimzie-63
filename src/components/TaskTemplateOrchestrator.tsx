import React from 'react';
import { Task, TaskTemplate } from '@/types/task';
import { KanbanTemplate } from './kanban/KanbanTemplate';
import { TimelineTemplate } from './timeline/TimelineTemplate';
import { CalendarTemplate, CalendarViewType } from './calendar/CalendarTemplate';
import { MatrixTemplate } from './matrix/MatrixTemplate';
import { TaskTemplate as TaskTemplateComponent } from './TaskTemplate';
import { NotesTemplate } from './notes/NotesTemplate';
import { DraggableAddButton } from './extra-panel/DraggableAddButton';

interface TaskTemplateOrchestratorProps {
  template: TaskTemplate;
  tasks: Task[];
  selectedTaskId: string | null;
  isDarkMode: boolean;
  selectedDate: Date;
  missionId: string;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskMove: (activeId: string, overId: string | null) => void;
  onAddTask: () => void;
  onTaskClick: (task: Task) => void;
  onAddSubTask: (parentId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onToggleComplete: (taskId: string) => void;
  onToggleExpanded: (taskId: string) => void;
  onDateSelect: (date: Date) => void;
  calendarView?: CalendarViewType;
  onCalendarViewChange?: (view: CalendarViewType) => void;
}

export const TaskTemplateOrchestrator: React.FC<TaskTemplateOrchestratorProps> = ({
  template,
  tasks,
  selectedTaskId,
  isDarkMode,
  selectedDate,
  missionId,
  onTaskUpdate,
  onTaskMove,
  onAddTask,
  onTaskClick,
  onAddSubTask,
  onDeleteTask,
  onEditTask,
  onToggleComplete,
  onToggleExpanded,
  onDateSelect,
  calendarView,
  onCalendarViewChange
}) => {
  const commonProps = {
    tasks,
    onTaskUpdate,
    onTaskMove,
    onAddTask,
    onTaskClick,
    onAddSubTask,
    onDeleteTask,
    onEditTask,
    isDarkMode
  };

  const renderTemplate = () => {
    switch (template) {
      case 'kanban':
        return (
          <div className="flex-1 overflow-hidden relative">
            <KanbanTemplate 
              key={`kanban-${missionId}-${selectedDate.toDateString()}`}
              {...commonProps} 
              missionId={missionId} 
              selectedDate={selectedDate} 
            />
            <DraggableAddButton onClick={onAddTask} isDarkMode={isDarkMode} />
          </div>
        );

      case 'timeline':
        return (
          <div className="flex-1 overflow-hidden relative">
            <TimelineTemplate 
              {...commonProps} 
              selectedDate={selectedDate}
            />
            <DraggableAddButton onClick={onAddTask} isDarkMode={isDarkMode} />
          </div>
        );

      case 'calendar':
        return (
          <div className="flex-1 overflow-hidden relative">
            <CalendarTemplate
              {...commonProps}
              missionId={missionId}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              currentView={calendarView}
              onViewChange={onCalendarViewChange}
            />
          </div>
        );

      case 'matrix':
        return (
          <div className="flex-1 overflow-hidden relative">
            <MatrixTemplate
              {...commonProps}
              onToggleComplete={onToggleComplete}
              missionId={missionId}
            />
          </div>
        );

      case 'task':
        return (
          <div className="flex-1 overflow-hidden relative">
            <TaskTemplateComponent
              {...commonProps}
              onToggleComplete={onToggleComplete}
              onToggleExpanded={onToggleExpanded}
            />
            <DraggableAddButton onClick={onAddTask} isDarkMode={isDarkMode} />
          </div>
        );

      case 'notes':
      default:
        return (
          <div className="flex-1 overflow-hidden relative">
            <NotesTemplate
              {...commonProps}
              selectedTaskId={selectedTaskId}
              onToggleExpanded={onToggleExpanded}
            />
          </div>
        );
    }
  };

  return renderTemplate();
};