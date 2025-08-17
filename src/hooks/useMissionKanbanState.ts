import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/types/task';
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns';

interface KanbanColumn {
  id: string;
  name: string;
  color: string;
  noteContent?: string;
  isNoteMode?: boolean;
}

interface TaskColumnMapping {
  [taskId: string]: string;
}

interface GridConfig {
  columns: number;
  rows: number;
  kanbanColumns: KanbanColumn[];
}

interface MissionDateKanbanConfig {
  [missionId: string]: {
    [dateKey: string]: GridConfig;
  };
}

const MISSION_DATE_KANBAN_STORAGE_KEY = 'mission-date-kanban-configs';

const loadMissionDateKanbanConfigs = (): MissionDateKanbanConfig => {
  try {
    const saved = localStorage.getItem(MISSION_DATE_KANBAN_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const saveMissionDateKanbanConfigs = (configs: MissionDateKanbanConfig) => {
  try {
    localStorage.setItem(MISSION_DATE_KANBAN_STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // Silent fail for localStorage issues
  }
};

const getDateKey = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

const hasTasksOnDate = (tasks: Task[], date: Date): boolean => {
  const targetDate = startOfDay(date);
  return tasks.some(task => {
    const taskDate = startOfDay(new Date(task.date));
    return taskDate.getTime() === targetDate.getTime();
  });
};

const getDefaultGridConfig = (): GridConfig => ({
  columns: 3,
  rows: 1,
  kanbanColumns: [
    { id: 'todo', name: 'To Do', color: '#3B82F6' },
    { id: 'in-progress', name: 'In Progress', color: '#F59E0B' },
    { id: 'completed', name: 'Completed', color: '#10B981' }
  ]
});

export const useMissionKanbanState = (tasks: Task[], missionId: string, selectedDate: Date) => {
  // Load all mission+date kanban configs
  const [missionDateConfigs, setMissionDateConfigs] = useState<MissionDateKanbanConfig>(() => 
    loadMissionDateKanbanConfigs()
  );

  const currentDateKey = getDateKey(selectedDate);

  // Get current mission+date config or default
  const [gridConfig, setGridConfig] = useState<GridConfig>(() => {
    return missionDateConfigs[missionId]?.[currentDateKey] || getDefaultGridConfig();
  });

  const [columns, setColumns] = useState<KanbanColumn[]>(gridConfig.kanbanColumns);
  
  const [taskColumnMapping, setTaskColumnMapping] = useState<TaskColumnMapping>(() => {
    const mapping: TaskColumnMapping = {};
    const firstColumnId = gridConfig.kanbanColumns[0]?.id || 'todo';
    
    tasks.forEach(task => {
      if (task.completed) {
        mapping[task.id] = 'completed';
      } else if (task.kanbanColumn && gridConfig.kanbanColumns.find(col => col.id === task.kanbanColumn)) {
        mapping[task.id] = task.kanbanColumn;
      } else {
        mapping[task.id] = firstColumnId;
      }
    });
    return mapping;
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showOverlayPanel, setShowOverlayPanel] = useState(false);
  const [draggableTaskId, setDraggableTaskId] = useState<string | null>(null);

  // Update grid config when mission or date changes
  useEffect(() => {
    const dateConfig = missionDateConfigs[missionId]?.[currentDateKey] || getDefaultGridConfig();
    setGridConfig(dateConfig);
    setColumns(dateConfig.kanbanColumns);
  }, [missionId, currentDateKey]);

  // Save mission+date specific config whenever columns change (but not on initial load)
  useEffect(() => {
    // Skip initial render to prevent infinite loops
    if (columns.length === 0) return;
    
    const newConfig: GridConfig = {
      columns: gridConfig.columns,
      rows: gridConfig.rows,
      kanbanColumns: columns
    };
    
    setMissionDateConfigs(prev => {
      const newConfigs = {
        ...prev,
        [missionId]: {
          ...prev[missionId],
          [currentDateKey]: newConfig
        }
      };
      saveMissionDateKanbanConfigs(newConfigs);
      return newConfigs;
    });
  }, [columns, gridConfig.columns, gridConfig.rows, missionId, currentDateKey]);

  // Sync task column mapping whenever tasks or columns change
  useEffect(() => {
    const newMapping = { ...taskColumnMapping };
    let hasChanges = false;
    const firstColumnId = columns[0]?.id || 'todo';
    
    tasks.forEach(task => {
      // For new tasks that don't have a mapping yet
      if (!newMapping[task.id]) {
        if (task.completed) {
          newMapping[task.id] = 'completed';
        } else if (task.kanbanColumn && columns.find(col => col.id === task.kanbanColumn)) {
          newMapping[task.id] = task.kanbanColumn;
        } else {
          newMapping[task.id] = firstColumnId;
        }
        hasChanges = true;
      }
      // For existing tasks, handle completion state changes
      else if (task.completed && newMapping[task.id] !== 'completed') {
        newMapping[task.id] = 'completed';
        hasChanges = true;
      } else if (!task.completed && newMapping[task.id] === 'completed') {
        const originalColumn = task.originalKanbanColumn && columns.find(col => col.id === task.originalKanbanColumn) 
          ? task.originalKanbanColumn 
          : firstColumnId;
        newMapping[task.id] = originalColumn;
        hasChanges = true;
      }
    });
    
    // Remove mappings for tasks that no longer exist
    const existingTaskIds = new Set(tasks.map(task => task.id));
    Object.keys(newMapping).forEach(taskId => {
      if (!existingTaskIds.has(taskId)) {
        delete newMapping[taskId];
        hasChanges = true;
      }
    });
    
    if (hasChanges) {
      setTaskColumnMapping(newMapping);
    }
  }, [tasks, columns]); // Removed taskColumnMapping from dependencies to prevent infinite loops

  const handleColumnUpdate = useCallback((columnId: string, updates: Partial<KanbanColumn>) => {
    setColumns(prev => {
      const updated = prev.map(col => col.id === columnId ? { ...col, ...updates } : col);
      return updated;
    });
  }, []);

  const handleColumnDelete = useCallback((columnId: string) => {
    if (columnId === 'completed') return;
    
    setColumns(prev => {
      const updated = prev.filter(col => col.id !== columnId);
      
      // Move tasks from deleted column to first available column
      const firstColumnId = updated[0]?.id;
      if (firstColumnId) {
        setTaskColumnMapping(prevMapping => {
          const newMapping = { ...prevMapping };
          Object.keys(newMapping).forEach(taskId => {
            if (newMapping[taskId] === columnId) {
              newMapping[taskId] = firstColumnId;
            }
          });
          return newMapping;
        });
      }
      
      return updated;
    });
  }, []);

  const createGrid = useCallback((gridColumns: number, gridRows: number, currentTasks: Task[]) => {
    const totalColumns = gridColumns * gridRows;
    const newColumns: KanbanColumn[] = [];
    
    for (let i = 0; i < totalColumns - 1; i++) {
      newColumns.push({
        id: `column-${currentDateKey}-${i}`,
        name: `Column ${i + 1}`,
        color: '#3B82F6'
      });
    }
    
    // Always add completed column at the end
    newColumns.push({
      id: 'completed',
      name: 'Completed',
      color: '#10B981'
    });
    
    setColumns(newColumns);
    
    // Update grid config for this mission+date
    const newConfig: GridConfig = {
      columns: gridColumns,
      rows: gridRows,
      kanbanColumns: newColumns
    };
    setGridConfig(newConfig);
    
    // Apply to future dates that have no tasks
    const updatedConfigs = { ...missionDateConfigs };
    if (!updatedConfigs[missionId]) {
      updatedConfigs[missionId] = {};
    }
    
    // Set current date
    updatedConfigs[missionId][currentDateKey] = newConfig;
    
    // Apply to future dates without tasks
    const currentDate = startOfDay(selectedDate);
    const existingDates = Object.keys(updatedConfigs[missionId] || {});
    
    existingDates.forEach(dateKey => {
      try {
        const date = parseISO(dateKey + 'T00:00:00');
        if (isAfter(date, currentDate) && !hasTasksOnDate(currentTasks, date)) {
          updatedConfigs[missionId][dateKey] = newConfig;
        }
      } catch (e) {
        // Skip invalid date keys
      }
    });
    
    setMissionDateConfigs(updatedConfigs);
    saveMissionDateKanbanConfigs(updatedConfigs);
    
    // Update task mapping - ensure completed tasks stay in completed, others go to first column
    const newMapping = { ...taskColumnMapping };
    const firstColumnId = newColumns[0]?.id;
    
    currentTasks.forEach(task => {
      if (task.completed) {
        newMapping[task.id] = 'completed';
      } else if (!newColumns.find(col => col.id === newMapping[task.id]) || newMapping[task.id] === 'completed') {
        newMapping[task.id] = firstColumnId || 'column-0';
      }
    });
    
    setTaskColumnMapping(newMapping);
  }, [taskColumnMapping, missionDateConfigs, missionId, currentDateKey, selectedDate]);

  const handleTaskClick = useCallback((task: Task) => {
    // Task click handler - can be customized
  }, []);

  const handleTaskLowerPortionClick = useCallback((task: Task) => {
    if (task.description && task.description !== 'Click to add description...') {
      if (selectedTask?.id === task.id && showOverlayPanel) {
        setShowOverlayPanel(false);
        setSelectedTask(null);
      } else {
        setSelectedTask(task);
        setShowOverlayPanel(true);
      }
    }
  }, [selectedTask, showOverlayPanel]);

  const handleTaskDoubleClick = useCallback((task: Task) => {
    setDraggableTaskId(prev => prev === task.id ? null : task.id);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setShowOverlayPanel(false);
    setSelectedTask(null);
  }, []);

  return {
    columns,
    taskColumnMapping,
    selectedTask,
    showOverlayPanel,
    draggableTaskId,
    gridConfig,
    setTaskColumnMapping,
    setDraggableTaskId,
    handleColumnUpdate,
    handleColumnDelete,
    createGrid,
    handleTaskClick,
    handleTaskLowerPortionClick,
    handleTaskDoubleClick,
    handleCloseOverlay,
    setSelectedTask
  };
};