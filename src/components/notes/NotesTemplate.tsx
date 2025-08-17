import React from 'react';
import { ScrollArea } from '@/components/ui';
import { TaskList } from '@/components/task/TaskList';
import { DraggableAddButton } from '@/components/extra-panel/DraggableAddButton';
import { TemplateProps } from '@/types/template';

export interface NotesTemplateProps extends TemplateProps {
  selectedTaskId?: string | null;
  onToggleExpanded: (taskId: string) => void;
}

export const NotesTemplate: React.FC<NotesTemplateProps> = ({
  tasks,
  selectedTaskId,
  isDarkMode,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onAddSubTask,
  onToggleExpanded,
  onTaskMove,
  onAddTask
}) => {
  return (
    <div className="h-full">
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="p-4 min-h-full relative">
          <TaskList
            tasks={tasks}
            selectedTaskId={selectedTaskId}
            isDarkMode={isDarkMode}
            template="notes"
            onTaskSelect={onTaskClick}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onAddSubTask={onAddSubTask}
            onToggleExpanded={onToggleExpanded}
            onTaskMove={onTaskMove}
          />
          <DraggableAddButton onClick={onAddTask} isDarkMode={isDarkMode} />
        </div>
      </ScrollArea>
    </div>
  );
};