import { useState, useCallback, useRef } from 'react';

// Simple floating panel state
export const useFloatingPanel = () => {
  const [state, setState] = useState({
    isNotesMode: false,
    showCompleted: false,
    showHoldTasks: false,
    notes: ''
  });

  const toggleMode = useCallback((mode: 'notes' | 'completed' | 'hold') => {
    setState(prev => ({
      ...prev,
      isNotesMode: mode === 'notes',
      showCompleted: mode === 'completed',
      showHoldTasks: mode === 'hold'
    }));
  }, []);

  const updateNotes = useCallback((notes: string) => {
    setState(prev => ({ ...prev, notes }));
  }, []);

  return { ...state, toggleMode, updateNotes };
};

// Simple full screen logic
export const useFullScreen = () => {
  const [fullScreenStates, setFullScreenStates] = useState({
    taskList: false,
    details: false,
    description: false
  });

  const enterFullScreen = useCallback((panel: 'taskList' | 'details' | 'description') => {
    setFullScreenStates(prev => ({ ...prev, [panel]: true }));
  }, []);

  const exitFullScreen = useCallback(() => {
    setFullScreenStates({ taskList: false, details: false, description: false });
  }, []);

  return { fullScreenStates, enterFullScreen, exitFullScreen };
};

// Simple chart base
export const useChartBase = () => {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<any>(null);

  const disposeChart = useCallback(() => {
    if (rootRef.current) {
      rootRef.current.dispose();
      rootRef.current = null;
    }
  }, []);

  const initializeRoot = useCallback((am5: any, am5themes_Animated: any) => {
    if (!chartRef.current) return null;
    
    disposeChart();
    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);
    return root;
  }, [disposeChart]);

  return { chartRef, rootRef, disposeChart, initializeRoot };
};