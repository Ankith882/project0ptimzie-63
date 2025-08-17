import { useState, useCallback } from 'react';
import { Task, TaskManagerState } from '@/types/task';
import { 
  generateTaskId, 
  updateTaskRecursively, 
  deleteTaskRecursively, 
  addSubTaskRecursively, 
  toggleTaskExpandedRecursively, 
  toggleTaskCompleteRecursively,
  expandParentTasksRecursively 
} from '@/utils/taskUtils';

const initialTasks: Task[] = [];

export const useTaskState = () => {
  const [state, setState] = useState<TaskManagerState>({
    tasks: initialTasks,
    selectedTask: null,
    showAddTask: false,
    editingTask: null,
    addingSubTaskParent: null,
    selectedDate: new Date()
  });

  // Core task operations
  const addTask = useCallback((taskData: Omit<Task, 'id' | 'subTasks' | 'isExpanded' | 'order'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateTaskId(),
      createdAt: taskData.createdAt || new Date(),
      subTasks: [],
      isExpanded: true,
      order: state.tasks.length,
      attachments: taskData.attachments || []
    };

    if (taskData.parentId) {
      setState(prev => ({
        ...prev,
        tasks: addSubTaskRecursively(prev.tasks, taskData.parentId!, newTask)
      }));
    } else {
      setState(prev => ({
        ...prev,
        tasks: [...prev.tasks, newTask]
      }));
    }

    setState(prev => ({ ...prev, selectedTask: newTask }));
    return newTask;
  }, [state.tasks]);

  const addSubTask = useCallback((parentId: string, taskData: Omit<Task, 'id' | 'subTasks' | 'isExpanded' | 'order' | 'parentId'>) => {
    const newTask: Task = {
      ...taskData,
      id: generateTaskId(),
      parentId,
      createdAt: taskData.createdAt || new Date(),
      subTasks: [],
      isExpanded: false,
      order: 0,
      attachments: taskData.attachments || []
    };

    setState(prev => ({
      ...prev,
      tasks: addSubTaskRecursively(prev.tasks, parentId, newTask)
    }));

    return newTask;
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setState(prev => {
      const updatedTasks = updateTaskRecursively(prev.tasks, taskId, updates);
      const updatedSelectedTask = prev.selectedTask?.id === taskId 
        ? { ...prev.selectedTask, ...updates } 
        : prev.selectedTask;
      
      return {
        ...prev,
        tasks: updatedTasks,
        selectedTask: updatedSelectedTask
      };
    });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: deleteTaskRecursively(prev.tasks, taskId),
      selectedTask: prev.selectedTask?.id === taskId ? null : prev.selectedTask
    }));
  }, []);

  const toggleTaskComplete = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: toggleTaskCompleteRecursively(prev.tasks, taskId)
    }));
  }, []);

  const toggleTaskExpanded = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: toggleTaskExpandedRecursively(prev.tasks, taskId)
    }));
  }, []);

  const expandParentTasks = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      tasks: expandParentTasksRecursively(prev.tasks, taskId)
    }));
  }, []);

  const deleteTasksByMissionIds = useCallback((missionIds: string[]) => {
    const deleteTasksByMissionRecursively = (taskList: Task[]): Task[] => {
      return taskList.filter(task => !missionIds.includes(task.missionId)).map(task => ({
        ...task,
        subTasks: deleteTasksByMissionRecursively(task.subTasks)
      }));
    };
    
    setState(prev => ({
      ...prev,
      tasks: deleteTasksByMissionRecursively(prev.tasks),
      selectedTask: prev.selectedTask && missionIds.includes(prev.selectedTask.missionId) ? null : prev.selectedTask
    }));
  }, []);

  // State management functions
  const setSelectedTask = useCallback((task: Task | null) => {
    setState(prev => ({ ...prev, selectedTask: task }));
  }, []);

  const setSelectedDate = useCallback((date: Date) => {
    setState(prev => ({ ...prev, selectedDate: date }));
  }, []);

  const setShowAddTask = useCallback((show: boolean) => {
    setState(prev => ({ ...prev, showAddTask: show }));
  }, []);

  const setEditingTask = useCallback((task: Task | null) => {
    setState(prev => ({ ...prev, editingTask: task }));
  }, []);

  const setAddingSubTaskParent = useCallback((parentId: string | null) => {
    setState(prev => ({ ...prev, addingSubTaskParent: parentId }));
  }, []);

  // Actions object for compatibility
  const actions = {
    addTask,
    addSubTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleTaskExpanded,
    setSelectedTask,
    setSelectedDate,
    expandParentTasks
  };

  return {
    // State
    tasks: state.tasks,
    selectedTask: state.selectedTask,
    showAddTask: state.showAddTask,
    editingTask: state.editingTask,
    addingSubTaskParent: state.addingSubTaskParent,
    selectedDate: state.selectedDate,
    
    // Actions for compatibility
    actions,
    
    // Core operations
    addTask,
    addSubTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    toggleTaskExpanded,
    expandParentTasks,
    deleteTasksByMissionIds,
    
    // State management
    setSelectedTask,
    setSelectedDate,
    setShowAddTask,
    setEditingTask,
    setAddingSubTaskParent
  };
};