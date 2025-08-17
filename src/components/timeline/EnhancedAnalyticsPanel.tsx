import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { BarChart3, X, ChevronDown, ChevronRight, TrendingUp } from 'lucide-react';
import { Task } from '@/types/task';
import { useCategoryManager } from '@/hooks/useCategoryContext';
import { EnhancedDatePicker } from '@/components/extra-panel/EnhancedDatePicker';
import { CircularChart } from './CircularChart';
import { CylinderChart } from './CylinderChart';
import { HighchartsBubbleChart } from './HighchartsBubbleChart';
import { DraggableFooterControls } from './DraggableFooterControls';
import { DraggableSummaryPanel } from './DraggableSummaryPanel';
import { DraggableCategoryPanel } from './DraggableCategoryPanel';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from 'date-fns';
import { AnalyticsData } from '@/types/analytics';
interface EnhancedAnalyticsPanelProps {
  tasks: Task[];
  isDarkMode: boolean;
  onClose?: () => void;
}
type ChartType = 'circular' | '3d-cylinder' | 'bubble';
type TimeMode = 'weekly' | 'monthly' | 'yearly' | 'custom' | 'selected';
const TIME_MODE_OPTIONS = [{
  value: 'weekly',
  label: 'Weekly'
}, {
  value: 'monthly',
  label: 'Monthly'
}, {
  value: 'yearly',
  label: 'Yearly'
}, {
  value: 'custom',
  label: 'Custom Dates'
}, {
  value: 'selected',
  label: 'Selected Dates'
}] as const;
export const EnhancedAnalyticsPanel: React.FC<EnhancedAnalyticsPanelProps> = ({
  tasks,
  isDarkMode,
  onClose
}) => {
  const {
    categories,
    getCategoryById
  } = useCategoryManager();
  const [chartType, setChartType] = useState<ChartType>('circular');
  const [timeMode, setTimeMode] = useState<TimeMode>('weekly');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [hierarchyStack, setHierarchyStack] = useState<string[]>([]);
  const [showDetails, setShowDetails] = useState(true);

  // Utility functions
  const getDateRange = () => {
    const baseDate = selectedDates[0] || new Date();
    switch (timeMode) {
      case 'weekly':
        return {
          start: startOfWeek(baseDate, { weekStartsOn: 0 }),
          end: endOfWeek(baseDate, { weekStartsOn: 0 })
        };
      case 'monthly':
        return {
          start: startOfMonth(baseDate),
          end: endOfMonth(baseDate)
        };
      case 'yearly':
        return {
          start: startOfYear(baseDate),
          end: endOfYear(baseDate)
        };
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate
        };
      case 'selected':
        if (selectedDates.length === 0) return {
          start: new Date(0),
          end: new Date()
        };
        const sorted = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
        return {
          start: sorted[0],
          end: sorted[sorted.length - 1]
        };
      default:
        return {
          start: new Date(0),
          end: new Date()
        };
    }
  };

  // Simplified analytics data
  const analyticsData = useMemo(() => {
    const dateRange = getDateRange();
    const currentLevelCategoryId = hierarchyStack[hierarchyStack.length - 1] || null;

    // Helper: overlap in minutes between two intervals
    const getOverlapMinutes = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) => {
      const start = Math.max(aStart.getTime(), bStart.getTime());
      const end = Math.min(aEnd.getTime(), bEnd.getTime());
      return Math.max(0, Math.floor((end - start) / 60000));
    };

    // Helper: minutes a task overlaps with current selection
    const getTaskOverlapMinutes = (taskStart: Date, taskEnd: Date): number => {
      if (timeMode === 'selected' && selectedDates.length > 0) {
        // Sum overlap across selected individual days
        return selectedDates.reduce((sum, d) => {
          const dayStart = startOfDay(d);
          const dayEnd = endOfDay(d);
          return sum + getOverlapMinutes(taskStart, taskEnd, dayStart, dayEnd);
        }, 0);
      }
      return getOverlapMinutes(taskStart, taskEnd, dateRange.start, dateRange.end);
    };

    // Get all tasks including subtasks
    const getAllTasks = (taskList: Task[]): Task[] => {
      const result: Task[] = [];
      const addTask = (task: Task) => {
        result.push(task);
        task.subTasks?.forEach(addTask);
      };
      taskList.forEach(addTask);
      return result;
    };
    const allTasks = getAllTasks(tasks);

    // Grouping target categories for current hierarchy level
    const targetCategoryIds = currentLevelCategoryId
      ? getCategoryById(currentLevelCategoryId)?.subCategories.map(sub => sub.id) || []
      : categories.map(cat => cat.id);

    const categoryMap = new Map<string, AnalyticsData>();

    allTasks.forEach(task => {
      if (!task.startTime || !task.endTime || !task.categoryId || task.categoryId === 'no-category') return;
      const taskStart = new Date(task.startTime);
      const taskEnd = new Date(task.endTime);

      const overlapMinutes = getTaskOverlapMinutes(taskStart, taskEnd);
      if (overlapMinutes <= 0) return; // ignore tasks with no overlap in the selection

      // Resolve target category for current level
      let targetCategoryId = task.categoryId!;
      if (currentLevelCategoryId) {
        const currentLevelCategory = getCategoryById(currentLevelCategoryId);
        if (!currentLevelCategory) return;
        const isDirect = currentLevelCategory.subCategories.some(sub => sub.id === targetCategoryId);
        if (!isDirect) {
          // bubble up to the direct child of current level
          const findInNested = (root: any): string | null => {
            if (root.id === targetCategoryId) return root.id;
            for (const nested of root.subCategories || []) {
              const found = findInNested(nested);
              if (found) return found;
            }
            return null;
          };
          let resolved: string | null = null;
          for (const sub of currentLevelCategory.subCategories) {
            const found = findInNested(sub);
            if (found) {
              resolved = sub.id;
              break;
            }
          }
          if (resolved) targetCategoryId = resolved; else return;
        }
      } else {
        // Find top-level category for arbitrary depth
        const findTopLevel = (catId: string): string => {
          for (const topCat of categories) {
            if (topCat.id === catId) return catId;
            const search = (subs: any[]): string | null => {
              for (const s of subs) {
                if (s.id === catId) return topCat.id;
                const r = search(s.subCategories || []);
                if (r) return r;
              }
              return null;
            };
            const res = search(topCat.subCategories);
            if (res) return res;
          }
          return catId;
        };
        targetCategoryId = findTopLevel(targetCategoryId);
      }

      if (!targetCategoryIds.includes(targetCategoryId)) return;
      const targetCategory = getCategoryById(targetCategoryId);
      if (!targetCategory) return;

      if (!categoryMap.has(targetCategoryId)) {
        categoryMap.set(targetCategoryId, {
          categoryId: targetCategoryId,
          categoryTitle: targetCategory.title,
          categoryColor: targetCategory.color,
          totalDuration: 0,
          taskCount: 0,
          tasks: [],
          hasSubcategories: targetCategory.subCategories.length > 0,
          parentId: undefined,
          level: hierarchyStack.length
        });
      }

      const entry = categoryMap.get(targetCategoryId)!;
      entry.totalDuration += overlapMinutes; // accumulate ONLY overlapped minutes
      entry.taskCount += 1; // count task once per category when it has any overlap
      entry.tasks!.push(task);
    });

    return Array.from(categoryMap.values())
      .filter(d => d.totalDuration > 0)
      .sort((a, b) => a.categoryTitle.localeCompare(b.categoryTitle));
  }, [tasks, categories, timeMode, customStartDate, customEndDate, selectedDates, hierarchyStack, getCategoryById]);

  // Event handlers (memoized to prevent infinite re-renders)
  const handleCategoryDoubleClick = useCallback((categoryId: string) => {
    const categoryData = analyticsData.find(data => data.categoryId === categoryId);
    if (categoryData?.hasSubcategories) {
      setHierarchyStack(prev => [...prev, categoryId]);
    }
  }, [analyticsData]);
  const handleNavigateBack = () => {
    setHierarchyStack(prev => prev.slice(0, -1));
  };
  const handleNavigateToRoot = () => {
    setHierarchyStack([]);
  };
  const removeDateAtIndex = (index: number) => {
    setSelectedDates(dates => dates.filter((_, i) => i !== index));
  };
  const addSelectedDate = (date: Date) => {
    setSelectedDates(dates => {
      if (dates.some(d => d.toDateString() === date.toDateString())) return dates;
      return [...dates, date];
    });
  };

  // Breadcrumbs
  const breadcrumbs = useMemo(() => {
    const crumbs = [{
      id: '',
      title: 'All Categories'
    }];
    hierarchyStack.forEach(categoryId => {
      const category = getCategoryById(categoryId);
      if (category) crumbs.push({
        id: categoryId,
        title: category.title
      });
    });
    return crumbs;
  }, [hierarchyStack, getCategoryById]);

  // Memoized chart props to prevent infinite re-renders
  const chartProps = useMemo(() => ({
    data: analyticsData,
    onCategoryDoubleClick: handleCategoryDoubleClick
  }), [analyticsData, handleCategoryDoubleClick]);

  // Chart renderer
  const renderChart = () => {
    if (analyticsData.length === 0) {
      return <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          
          <p>No data available for the selected period</p>
          
        </div>;
    }
    switch (chartType) {
      case 'circular':
        return <CircularChart {...chartProps} />;
      case '3d-cylinder':
        return <CylinderChart {...chartProps} />;
      case 'bubble':
        return <HighchartsBubbleChart {...chartProps} expandedCategories={{}} />;
      default:
        return <CircularChart {...chartProps} />;
    }
  };
  const totalTime = useMemo(() => analyticsData.reduce((sum, item) => sum + item.totalDuration, 0), [analyticsData]);
  const totalTasks = useMemo(() => analyticsData.reduce((sum, item) => sum + item.taskCount, 0), [analyticsData]);
  return <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50">
      <DraggableFooterControls 
        chartType={chartType} 
        onChartTypeChange={type => setChartType(type as ChartType)} 
        timeMode={timeMode} 
        onTimeModeChange={mode => setTimeMode(mode as TimeMode)} 
        showDetails={showDetails} 
        onToggleDetails={() => setShowDetails(!showDetails)} 
        isDarkMode={isDarkMode}
        selectedDate={selectedDates[0] || new Date()}
        onDateSelect={(date) => {
          if (timeMode === 'weekly') {
            const weekStart = startOfWeek(date, { weekStartsOn: 0 });
            setSelectedDates([weekStart]);
          } else if (timeMode === 'monthly') {
            const monthStart = startOfMonth(date);
            setSelectedDates([monthStart]);
          } else if (timeMode === 'yearly') {
            const yearStart = startOfYear(date);
            setSelectedDates([yearStart]);
          }
        }}
      />

      <Card className="w-full h-full bg-background/95 backdrop-blur-xl border-0 shadow-none rounded-none overflow-hidden">
        <CardHeader className="pb-1 px-4 py-2 bg-white/5 dark:bg-black/10 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2 text-base font-medium text-foreground/90">
                <div className="p-1 bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm rounded-lg border border-primary/30">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Enhanced Task Analytics
              </CardTitle>
              
              <div className="flex items-center gap-1">
                {breadcrumbs.map((breadcrumb, index) => <div key={breadcrumb.id || 'root'} className="flex items-center gap-1">
                    {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/60" />}
                    <Button variant={index === breadcrumbs.length - 1 ? "default" : "ghost"} size="sm" onClick={() => {
                  if (index === 0) handleNavigateToRoot();else if (index < breadcrumbs.length - 1) setHierarchyStack(prev => prev.slice(0, index));
                }} className="h-6 px-2 text-xs text-foreground bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg">
                      {breadcrumb.title}
                    </Button>
                  </div>)}
                
                {hierarchyStack.length > 0 && <Button variant="outline" size="sm" onClick={handleNavigateBack} className="h-6 w-6 p-0 ml-2 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg" title="Go back">
                    <ChevronDown className="h-3 w-3 rotate-90" />
                  </Button>}
              </div>
            </div>
            {onClose && <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0 bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg">
                <X className="h-3 w-3" />
              </Button>}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 h-full">
          {timeMode === 'custom' && <div className="absolute top-16 left-4 right-4 z-10 flex gap-3 p-3 bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div>
                <label className="text-xs text-muted-foreground/80 mb-1 block font-medium">Start Date</label>
                <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                  <EnhancedDatePicker selectedDate={customStartDate} onDateSelect={setCustomStartDate} isDarkMode={isDarkMode} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreference/80 mb-1 block font-medium">End Date</label>
                <div className="bg-white/10 dark:bg-black/20 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                  <EnhancedDatePicker selectedDate={customEndDate} onDateSelect={setCustomEndDate} isDarkMode={isDarkMode} />
                </div>
              </div>
            </div>}

          {timeMode === 'selected' && <div className="absolute top-16 left-4 right-4 z-10 p-3 bg-white/5 dark:bg-black/10 backdrop-blur-sm rounded-xl border border-white/20">
              <label className="text-xs text-muted-foreground/80 mb-2 block font-medium">Select Individual Dates</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {selectedDates.map((date, index) => <div key={index} className="flex items-center gap-1 bg-primary/10 backdrop-blur-sm text-primary px-2 py-1 rounded-lg text-xs font-medium border border-primary/20">
                    {format(date, 'MMM dd')}
                    <Button variant="ghost" size="sm" className="h-4 w-4 p-0" onClick={() => removeDateAtIndex(index)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>)}
              </div>
              <EnhancedDatePicker selectedDate={new Date()} onDateSelect={addSelectedDate} isDarkMode={isDarkMode} />
            </div>}

          <div className="flex-1 h-full w-full">
            {renderChart()}
          </div>
        </CardContent>
      </Card>

      {showDetails && <>
          <DraggableSummaryPanel totalTime={totalTime} totalTasks={totalTasks} totalCategories={analyticsData.length} isDarkMode={isDarkMode} />
          <DraggableCategoryPanel analyticsData={analyticsData} onCategoryDoubleClick={handleCategoryDoubleClick} isDarkMode={isDarkMode} />
        </>}
    </div>;
};