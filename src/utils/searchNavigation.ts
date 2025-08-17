import { useCallback } from 'react';
import { SearchResult } from '@/types/search';

interface NavigationCallbacks {
  onNavigateToMissions: () => void;
  onNavigateToHabits: (view: 'active' | 'completed') => void;
  onNavigateToNotes: () => void;
  onSelectMission: (mission: any) => void;
  onSelectHabit: (habit: any) => void;
  onSelectFolder: (folder: any) => void;
  onHighlightMission: (id: string) => void;
  onHighlightHabit: (id: string) => void;
  onHighlightNote: (id: string) => void;
  onHighlightTask: (taskId: string) => void;
  onNavigateToDate: (date: Date) => void;
  onExpandParentTasks: (taskId: string) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onCloseSearch: () => void;
}

interface NavigationData {
  folders: any[];
  missions: any[];
  workspaces: any[];
  selectedWorkspaceId?: string;
}

export const useSearchNavigation = (
  callbacks: NavigationCallbacks,
  data: NavigationData
) => {
  const switchToItemWorkspace = useCallback((result: SearchResult) => {
    let targetWorkspaceId: string | undefined;

    switch (result.type) {
      case 'task': {
        if (result.missionId && result.missionId !== 'default') {
          const mission = data.missions.find(m => m.id === result.missionId);
          targetWorkspaceId = mission?.workspaceId;
        }
        break;
      }
      case 'mission': {
        targetWorkspaceId = result.originalItem.workspaceId;
        break;
      }
      case 'habit': {
        targetWorkspaceId = result.originalItem.workspaceId;
        break;
      }
      case 'note': {
        const folder = data.folders.find(f => f.id === result.originalItem.folderId);
        targetWorkspaceId = folder?.workspaceId;
        break;
      }
    }

    if (targetWorkspaceId && targetWorkspaceId !== data.selectedWorkspaceId) {
      callbacks.onSelectWorkspace(targetWorkspaceId);
      return true;
    }
    
    return false;
  }, [data, callbacks]);

  const navigateToResult = useCallback((result: SearchResult) => {
    callbacks.onCloseSearch();
    const workspaceSwitched = switchToItemWorkspace(result);
    const delay = workspaceSwitched ? 300 : 100;

    switch (result.type) {
      case 'task': {
        if (result.originalItem?.date) {
          setTimeout(() => {
            callbacks.onNavigateToDate(new Date(result.originalItem.date));
          }, delay);
        }
        
        if (result.missionId && result.missionId !== 'default') {
          const mission = data.missions.find(m => m.id === result.missionId);
          if (mission) {
            setTimeout(() => {
              callbacks.onNavigateToMissions();
              setTimeout(() => {
                callbacks.onSelectMission(mission);
                callbacks.onHighlightMission(mission.id);
                setTimeout(() => {
                  if (result.originalItem?.parentId) {
                    callbacks.onExpandParentTasks(result.originalItem.id);
                    setTimeout(() => {
                      callbacks.onHighlightTask(result.originalItem.id);
                    }, 500);
                  } else {
                    callbacks.onHighlightTask(result.originalItem.id);
                  }
                }, 200);
              }, 100);
            }, delay);
          }
        }
        break;
      }

      case 'mission': {
        setTimeout(() => {
          callbacks.onNavigateToMissions();
          setTimeout(() => {
            callbacks.onSelectMission(result.originalItem);
            callbacks.onHighlightMission(result.originalItem.id);
          }, 100);
        }, delay);
        break;
      }

      case 'habit': {
        const habit = result.originalItem;
        const view = habit.isCompleted ? 'completed' : 'active';
        
        setTimeout(() => {
          callbacks.onNavigateToHabits(view);
          setTimeout(() => {
            callbacks.onSelectHabit(habit);
            callbacks.onHighlightHabit(habit.id);
          }, 100);
        }, delay);
        break;
      }

      case 'note': {
        setTimeout(() => {
          callbacks.onNavigateToNotes();
          const folder = data.folders.find(f => f.id === result.originalItem.folderId);
          if (folder) {
            setTimeout(() => {
              callbacks.onSelectFolder(folder);
              setTimeout(() => {
                callbacks.onHighlightNote(result.originalItem.id);
              }, 100);
            }, 100);
          }
        }, delay);
        break;
      }
    }
  }, [callbacks, data, switchToItemWorkspace]);

  return { navigateToResult };
};