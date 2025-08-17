import { useCallback } from 'react';
import { Task } from '@/types/task';
import { validateTaskTitle } from '@/utils/taskValidation';
import { toast } from 'sonner';

interface UseTaskActionsProps {
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  tasks: Task[];
}

export const useTaskActions = ({ updateTask, deleteTask, tasks }: UseTaskActionsProps) => {
  const handleTaskEdit = useCallback((task: Task) => {
    if (!validateTaskTitle(task.title)) {
      toast.error('Task title is required');
      return;
    }
    updateTask(task.id, task);
  }, [updateTask]);

  const handleTaskDelete = useCallback((taskId: string) => {
    deleteTask(taskId);
    toast.success('Task deleted successfully');
  }, [deleteTask]);

  const handleTaskMove = useCallback((taskId: string, newColumnId: string) => {
    // Handle task movement between different templates
    if (['urgent-important', 'not-urgent-important', 'urgent-unimportant', 'not-urgent-unimportant'].includes(newColumnId)) {
      updateTask(taskId, { quadrant: newColumnId });
    } else if (['todo', 'in-progress', 'completed'].includes(newColumnId)) {
      updateTask(taskId, { kanbanColumn: newColumnId });
    }
  }, [updateTask]);

  const handleTaskComplete = useCallback((taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updates: Partial<Task> = { completed: !task.completed };
      
      // Store/restore original column for Kanban
      if (!task.completed) {
        updates.originalKanbanColumn = task.originalKanbanColumn || task.kanbanColumn || 'todo';
      }
      
      updateTask(taskId, updates);
    }
  }, [tasks, updateTask]);

  return {
    handleTaskEdit,
    handleTaskDelete,
    handleTaskMove,
    handleTaskComplete
  };
};