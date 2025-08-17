import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface Category {
  id: string;
  title: string;
  description?: string;
  color: string;
  createdAt: Date;
  parentId?: string;
  subCategories: Category[];
  isExpanded: boolean;
  order: number;
}

interface CategoryContextType {
  categories: Category[];
  addCategory: (categoryData: Omit<Category, 'id' | 'createdAt' | 'subCategories' | 'isExpanded' | 'order'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => Category | null;
  toggleCategoryExpanded: (id: string) => void;
  refreshCategories: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

const STORAGE_KEY = 'task-categories';
const CATEGORY_CHANGE_EVENT = 'categoryChange';

// Global event emitter for category changes
const eventTarget = new EventTarget();

const loadCategoriesFromStorage = (): Category[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored).map((cat: any) => ({
      ...cat,
      createdAt: new Date(cat.createdAt),
      subCategories: cat.subCategories || [],
      isExpanded: cat.isExpanded ?? true,
      order: cat.order ?? 0
    })) : [];
  } catch (error) {
    return [];
  }
};

const saveCategoriestoStorage = (categories: Category[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    // Emit global event for category changes
    eventTarget.dispatchEvent(new CustomEvent(CATEGORY_CHANGE_EVENT, { detail: categories }));
  } catch (error) {
    // Error saving categories to storage
  }
};

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(() => loadCategoriesFromStorage());

  // Listen for category changes from other instances
  useEffect(() => {
    const handleCategoryChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedCategories = customEvent.detail;
      setCategories(updatedCategories);
    };

    eventTarget.addEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
    
    return () => {
      eventTarget.removeEventListener(CATEGORY_CHANGE_EVENT, handleCategoryChange);
    };
  }, []);

  // Save to localStorage whenever categories change
  useEffect(() => {
    saveCategoriestoStorage(categories);
  }, [categories]);

  const addCategory = useCallback((categoryData: Omit<Category, 'id' | 'createdAt' | 'subCategories' | 'isExpanded' | 'order'>) => {
    const newCategory: Category = {
      id: Date.now().toString(),
      createdAt: new Date(),
      subCategories: [],
      isExpanded: true,
      order: categories.length,
      ...categoryData
    };

    if (categoryData.parentId) {
      const addSubCategoryRecursively = (categoryList: Category[], parentId: string): Category[] => {
        return categoryList.map(category => {
          if (category.id === parentId) {
            return { ...category, subCategories: [...category.subCategories, newCategory] };
          }
          return { ...category, subCategories: addSubCategoryRecursively(category.subCategories, parentId) };
        });
      };
      setCategories(prev => addSubCategoryRecursively(prev, categoryData.parentId!));
    } else {
      setCategories(prev => [...prev, newCategory]);
    }
  }, [categories.length]);

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const updateCategoryRecursively = (categoryList: Category[]): Category[] => {
      return categoryList.map(category => {
        if (category.id === id) {
          return { ...category, ...updates };
        }
        return { ...category, subCategories: updateCategoryRecursively(category.subCategories) };
      });
    };
    setCategories(prev => updateCategoryRecursively(prev));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    const deleteCategoryRecursively = (categoryList: Category[]): Category[] => {
      return categoryList.filter(category => category.id !== id).map(category => ({
        ...category,
        subCategories: deleteCategoryRecursively(category.subCategories)
      }));
    };
    setCategories(prev => deleteCategoryRecursively(prev));
  }, []);

  const getCategoryById = useCallback((id: string): Category | null => {
    const findCategoryRecursively = (categoryList: Category[]): Category | null => {
      for (const category of categoryList) {
        if (category.id === id) return category;
        const found = findCategoryRecursively(category.subCategories);
        if (found) return found;
      }
      return null;
    };
    return findCategoryRecursively(categories);
  }, [categories]);

  const toggleCategoryExpanded = useCallback((id: string) => {
    const toggleRecursively = (categoryList: Category[]): Category[] => {
      return categoryList.map(category => {
        if (category.id === id) {
          return { ...category, isExpanded: !category.isExpanded };
        }
        return { ...category, subCategories: toggleRecursively(category.subCategories) };
      });
    };
    setCategories(prev => toggleRecursively(prev));
  }, []);

  const refreshCategories = useCallback(() => {
    const freshCategories = loadCategoriesFromStorage();
    setCategories(freshCategories);
  }, []);

  const value = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    toggleCategoryExpanded,
    refreshCategories
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
};