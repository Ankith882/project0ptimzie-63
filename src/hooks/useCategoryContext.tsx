import { useCategoryContext } from '@/contexts/CategoryContext';

// Re-export for convenience and backwards compatibility
export const useCategoryManager = useCategoryContext;
export type { Category } from '@/contexts/CategoryContext';