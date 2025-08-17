import { useState, useCallback, useMemo, useEffect } from 'react';
import Fuse from 'fuse.js';
import { SearchResult, SearchableItem, SearchFilter, SearchState } from '@/types/search';
import { Task } from '@/types/task';
import { getAllTasksRecursively } from '@/utils/taskUtils';

interface UseSearchProps {
  tasks: Task[];
  missions: any[];
  habits: any[];
  notes: any[];
  folders: any[];
  workspaces: any[];
}

export const useSearch = ({
  tasks,
  missions,
  habits,
  notes,
  folders,
  workspaces
}: UseSearchProps) => {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    filter: 'all',
    results: [],
    isSearching: false,
    isOpen: false
  });

  // Aggregate all searchable data
  const searchableData = useMemo(() => {
    const items: SearchableItem[] = [];
    
    // Helper function to get workspace name
    const getWorkspaceName = (workspaceId: string): string => {
      const workspace = workspaces.find(w => w.id === workspaceId);
      return workspace?.name || 'Unassigned';
    };

    // Add tasks
    const allTasks = getAllTasksRecursively(tasks);
    allTasks.forEach(task => {
      let workspaceName = 'Unassigned';
      if (task.missionId && task.missionId !== 'default') {
        const mission = missions.find(m => m.id === task.missionId);
        if (mission?.workspaceId) {
          workspaceName = getWorkspaceName(mission.workspaceId);
        }
      }

      items.push({
        id: task.id,
        title: task.title,
        description: task.description,
        category: workspaceName,
        priority: task.priority,
        type: 'task',
        parentId: task.parentId,
        missionId: task.missionId,
        createdAt: task.createdAt,
        isCompleted: task.completed,
        originalItem: task
      });
    });

    // Add missions
    missions.forEach(mission => {
      items.push({
        id: mission.id,
        title: mission.title,
        description: mission.description,
        category: getWorkspaceName(mission.workspaceId),
        type: 'mission',
        createdAt: mission.createdAt,
        originalItem: mission
      });
    });

    // Add habits
    habits.forEach(habit => {
      items.push({
        id: habit.id,
        title: habit.name,
        description: '',
        category: getWorkspaceName(habit.workspaceId),
        type: 'habit',
        createdAt: habit.createdAt,
        isCompleted: habit.isCompleted,
        originalItem: habit
      });
    });

    // Add notes
    notes.forEach(note => {
      const folder = folders.find(f => f.id === note.folderId);
      const workspaceName = folder ? getWorkspaceName(folder.workspaceId) : 'Unassigned';
      
      items.push({
        id: note.id,
        title: note.title,
        description: note.content,
        category: `${folder?.name || note.folderId} • ${workspaceName}`,
        type: 'note',
        createdAt: note.createdAt,
        originalItem: note
      });
    });

    return items;
  }, [tasks, missions, habits, notes, folders, workspaces]);

  // Configure Fuse.js
  const fuse = useMemo(() => {
    const options = {
      keys: [
        { name: 'title', weight: 0.7 },
        { name: 'description', weight: 0.3 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2
    };

    return new Fuse(searchableData, options);
  }, [searchableData]);

  // Perform search
  const performSearch = useCallback((query: string, filter: SearchFilter) => {
    if (!query.trim()) {
      setSearchState(prev => ({ ...prev, results: [], isSearching: false }));
      return;
    }

    setSearchState(prev => ({ ...prev, isSearching: true }));

    const searchResults = fuse.search(query);
    
    // Filter by type if not 'all'
    const filteredResults = searchResults.filter(result => {
      if (filter === 'all') return true;
      return result.item.type === filter;
    });

    // Convert to SearchResult format
    const results: SearchResult[] = filteredResults.map(result => {
      const item = result.item;
      const snippet = item.description 
        ? item.description.substring(0, 100) + (item.description.length > 100 ? '...' : '')
        : undefined;

      return {
        id: item.id,
        type: item.type,
        title: item.title,
        description: item.description,
        snippet,
        category: item.category,
        priority: item.priority,
        parentId: item.parentId,
        missionId: item.missionId,
        createdAt: item.createdAt,
        isCompleted: item.isCompleted,
        originalItem: item.originalItem
      };
    });

    setSearchState(prev => ({ 
      ...prev, 
      results: results.slice(0, 50),
      isSearching: false 
    }));
  }, [fuse]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(searchState.query, searchState.filter);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchState.query, searchState.filter, performSearch]);

  const setQuery = useCallback((query: string) => {
    setSearchState(prev => ({ ...prev, query }));
  }, []);

  const setFilter = useCallback((filter: SearchFilter) => {
    setSearchState(prev => ({ ...prev, filter }));
  }, []);

  const openSearch = useCallback(() => {
    setSearchState(prev => ({ ...prev, isOpen: true }));
  }, []);

  const closeSearch = useCallback(() => {
    setSearchState(prev => ({ 
      ...prev, 
      isOpen: false, 
      query: '', 
      results: [],
      filter: 'all'
    }));
  }, []);

  return {
    searchState,
    setQuery,
    setFilter,
    openSearch,
    closeSearch
  };
};