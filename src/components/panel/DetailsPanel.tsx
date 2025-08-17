import React from 'react';
import { Task } from '@/types/task';
import { TaskManagerSimplified as TaskManager } from '@/components/TaskManagerSimplified';
import { HabitDetails } from '@/components/habit/HabitDetails';
import { QuickNotesList } from '@/components/quicknotes/QuickNotesList';
interface DetailsPanelProps {
  isDarkMode: boolean;
  showMissions: boolean;
  showHabitTracker: boolean;
  showQuickNotes: boolean;
  selectedMission: any;
  selectedHabit: any;
  selectedFolder: any;
  taskState: any;
  updateMission: (id: string, updates: any) => void;
  currentFolderNotes: any[];
  highlightedNoteId?: string;
  addNote: (noteData: any) => any;
  updateNote: (id: string, updates: any) => void;
  deleteNote: (id: string) => void;
  updateHabitDay: (habitId: string, date: string, status: 'completed' | 'missed' | null) => void;
  addHabitNote: (habitId: string, date: string, note: string) => void;
  markHabitCompleted: (id: string) => void;
  markHabitIncomplete: (id: string) => void;
  getHabitDayStatus: (habitId: string, date: string) => 'completed' | 'missed' | null;
  getMonthStats: (habitId: string, year: number, month: number) => {
    completed: number;
    missed: number;
  };
}
export const DetailsPanel: React.FC<DetailsPanelProps> = ({
  isDarkMode,
  showMissions,
  showHabitTracker,
  showQuickNotes,
  selectedMission,
  selectedHabit,
  selectedFolder,
  taskState,
  updateMission,
  currentFolderNotes,
  highlightedNoteId,
  addNote,
  updateNote,
  deleteNote,
  updateHabitDay,
  addHabitNote,
  markHabitCompleted,
  markHabitIncomplete,
  getHabitDayStatus,
  getMonthStats
}) => {
  const renderMissionDetails = () => {
    if (!selectedMission?.id) {
      return null;
    }
    return <div className="h-full">
        <TaskManager selectedMission={selectedMission} isDarkMode={isDarkMode} onUpdateMission={updateMission} taskState={taskState} />
      </div>;
  };
  if (showQuickNotes) {
    return selectedFolder ? <QuickNotesList folder={selectedFolder} notes={currentFolderNotes} isDarkMode={isDarkMode} highlightedNoteId={highlightedNoteId} onAddNote={() => {
      addNote({
        title: '',
        content: '<p>Start writing your note...</p>',
        color: '#3B82F6',
        folderId: selectedFolder.id
      });
    }} onUpdateNote={updateNote} onDeleteNote={deleteNote} /> : null;
  }
  if (showHabitTracker) {
    return selectedHabit ? <HabitDetails habit={selectedHabit} isDarkMode={isDarkMode} onUpdateDay={(date, status) => updateHabitDay(selectedHabit.id, date, status)} onAddNote={(date, note) => addHabitNote(selectedHabit.id, date, note)} onMarkCompleted={markHabitCompleted} onReactivateHabit={markHabitIncomplete} getHabitDayStatus={getHabitDayStatus} getMonthStats={getMonthStats} /> : null;
  }
  if (showMissions) {
    return renderMissionDetails();
  }
  return null;
};