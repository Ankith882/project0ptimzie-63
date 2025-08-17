// Centralized color definitions to eliminate duplication
export const PRESET_COLORS = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
  '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
  '#EC4899', '#F43F5E'
];

export const COLOR_PICKER_COLORS = [
  // Row 1 - Blacks and Grays
  '#000000', '#333333', '#666666', '#999999', '#CCCCCC',
  // Row 2 - Reds
  '#FF0000', '#FF6666', '#FF9999', '#FFCCCC', '#FFE6E6',
  // Row 3 - Oranges and Yellows
  '#FF8000', '#FFB366', '#FFD699', '#FFFF00', '#FFFF99',
  // Row 4 - Greens
  '#00FF00', '#66FF66', '#99FF99', '#CCFFCC',
  // Row 5 - Blues
  '#0000FF', '#6666FF', '#9999FF', '#CCCCFF',
  // Row 6 - Purples and Magentas
  '#800080', '#B366B3', '#D699D6', '#FF00FF', '#FF66FF'
];

export const PRIORITY_COLORS = {
  P1: 'bg-red-500',
  P2: 'bg-orange-500', 
  P3: 'bg-yellow-500',
  P4: 'bg-green-500',
  P5: 'bg-blue-500',
  P6: 'bg-purple-500',
  P7: 'bg-gray-500'
} as const;

export const DEFAULT_TASK_COLOR = '#3B82F6';
export const DEFAULT_SUBTASK_COLOR = '#10B981';