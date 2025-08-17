import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button, Card, CardContent } from '@/components/ui';
import { Calendar, GripVertical } from 'lucide-react';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { format } from 'date-fns';
import { CalendarGrid } from './CalendarGrid';

interface EnhancedDatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  isDarkMode: boolean;
  tasksData?: any[];
  dateColors?: {[key: string]: string};
  getTasksForDate?: (date: Date) => any[];
  selectedTemplate?: string;
  onDateColorChange?: (dateKey: string, color: string) => void;
  viewMode?: 'day' | 'week' | 'month' | 'year';
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const EnhancedDatePicker: React.FC<EnhancedDatePickerProps> = ({
  selectedDate,
  onDateSelect,
  isDarkMode,
  tasksData = [],
  dateColors = {},
  getTasksForDate,
  selectedTemplate = 'task',
  onDateColorChange,
  viewMode = 'day'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Set initial picker view mode based on viewMode
  const getInitialPickerViewMode = () => {
    switch (viewMode) {
      case 'month':
        return 'months';
      case 'year':
        return 'years';
      default:
        return 'days';
    }
  };
  
  const [pickerViewMode, setPickerViewMode] = useState<'days' | 'months' | 'years'>(getInitialPickerViewMode());
  const [currentYear, setCurrentYear] = useState(selectedDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(selectedDate.getMonth());
  const isMobile = window.innerWidth < 768;
  const [dimensions, setDimensions] = useState({ 
    width: isMobile ? Math.min(320, window.innerWidth - 32) : 400, 
    height: isMobile ? Math.min(400, window.innerHeight - 100) : 480 
  });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerDate, setColorPickerDate] = useState<Date | null>(null);
  const [selectedDotColor, setSelectedDotColor] = useState('#00FF00');
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const cellSize = isMobile ? 28 : 40;
  const gapSize = isMobile ? 1 : 2;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    // Reset picker view mode when opening based on viewMode
    if (!isOpen) {
      setPickerViewMode(getInitialPickerViewMode());
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowColorPicker(false);
    setColorPickerDate(null);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentYear, currentMonth, day);
    onDateSelect(newDate);
    handleClose();
  };

  const handleMonthSelect = (month: number) => {
    const newDate = new Date(currentYear, month, 1);
    onDateSelect(newDate);
    handleClose();
  };

  const handleYearSelect = (year: number) => {
    const newDate = new Date(year, selectedDate.getMonth(), 1);
    onDateSelect(newDate);
    handleClose();
  };

  const handleNavigation = (direction: 'prev' | 'next') => {
    if (pickerViewMode === 'days') {
      const newMonth = direction === 'prev' ? currentMonth - 1 : currentMonth + 1;
      if (newMonth < 0) {
        setCurrentMonth(11);
        setCurrentYear(currentYear - 1);
      } else if (newMonth > 11) {
        setCurrentMonth(0);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(newMonth);
      }
    } else if (pickerViewMode === 'months') {
      setCurrentYear(currentYear + (direction === 'prev' ? -1 : 1));
    }
  };

  // Function to get smart display text based on view mode
  const getDisplayText = () => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      
      case 'week': {
        // Calculate week of the month (1st, 2nd, 3rd, 4th week) - same logic as LiveTaskCounter
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const weekOfMonth = Math.ceil((selectedDate.getDate() + firstDayOfMonth.getDay()) / 7);
        const getOrdinal = (n: number) => {
          const s = ['th', 'st', 'nd', 'rd'];
          const v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        return `${getOrdinal(weekOfMonth)} Week`;
      }
      
      case 'month':
        return MONTH_NAMES[selectedDate.getMonth()];
      
      case 'year':
        return selectedDate.getFullYear().toString();
      
      default:
        return format(selectedDate, 'MMMM d, yyyy');
    }
  };

  const getTasksForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    if (getTasksForDate) return getTasksForDate(date);
    return tasksData.filter(task => {
      const taskDate = task.startTime || task.date;
      return taskDate && taskDate.toDateString() === date.toDateString();
    });
  };

  const handleLongPress = (day: number) => {
    const timer = setTimeout(() => {
      const tasks = getTasksForDay(day);
      if (tasks.length > 0) {
        const date = new Date(currentYear, currentMonth, day);
        setColorPickerDate(date);
        const dateKey = date.toISOString().split('T')[0];
        setSelectedDotColor(dateColors[dateKey] || '#00FF00');
        setShowColorPicker(true);
      }
    }, 800);
    setLongPressTimer(timer);
  };

  const clearLongPress = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Position popup near button
  useEffect(() => {
    if (!isOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const { innerWidth: vw, innerHeight: vh } = window;
    
    let x = rect.right + 8;
    let y = rect.top;
    
    // Better mobile positioning
    if (isMobile) {
      // Center horizontally on mobile, leave some margin
      x = (vw - dimensions.width) / 2;
      x = Math.max(16, Math.min(x, vw - dimensions.width - 16));
      
      // Position below button or center vertically if not enough space
      if (rect.bottom + dimensions.height + 16 > vh) {
        y = (vh - dimensions.height) / 2;
      } else {
        y = rect.bottom + 8;
      }
      y = Math.max(16, Math.min(y, vh - dimensions.height - 16));
    } else {
      // Desktop positioning
      if (x + dimensions.width > vw) x = rect.left - dimensions.width - 8;
      if (y + dimensions.height > vh) y = vh - dimensions.height - 8;
      
      x = Math.max(8, x);
      y = Math.max(8, y);
    }
    
    setPosition({ x, y });
  }, [isOpen, dimensions, isMobile]);

  // Handle resize with enhanced touch support
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (popupRef.current) {
        const rect = popupRef.current.getBoundingClientRect();
        const minWidth = isMobile ? 280 : 320;
        const minHeight = isMobile ? 320 : 360;
        const maxWidth = Math.min(window.innerWidth - 32, isMobile ? 400 : 600);
        const maxHeight = Math.min(window.innerHeight - 100, isMobile ? 500 : 700);
        
        setDimensions({
          width: Math.max(minWidth, Math.min(maxWidth, e.clientX - rect.left)),
          height: Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top))
        });
      }
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (popupRef.current && e.touches[0]) {
        const rect = popupRef.current.getBoundingClientRect();
        const touch = e.touches[0];
        const minWidth = isMobile ? 280 : 320;
        const minHeight = isMobile ? 320 : 360;
        const maxWidth = Math.min(window.innerWidth - 32, isMobile ? 400 : 600);
        const maxHeight = Math.min(window.innerHeight - 100, isMobile ? 500 : 700);
        
        setDimensions({
          width: Math.max(minWidth, Math.min(maxWidth, touch.clientX - rect.left)),
          height: Math.max(minHeight, Math.min(maxHeight, touch.clientY - rect.top))
        });
      }
    };
    
    const handleEnd = () => setIsResizing(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    
    // Prevent scrolling and selection during resize
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.overflow = '';
      document.documentElement.style.touchAction = '';
    };
  }, [isResizing, isMobile]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (showColorPicker || 
          (popupRef.current?.contains(target)) || 
          (buttonRef.current?.contains(target))) return;
      handleClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, showColorPicker]);


  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        type="button"
        variant="ghost"
        onClick={handleToggle}
        onMouseDown={(e) => e.stopPropagation()}
        className="h-7 px-2 py-1 text-xs font-medium bg-background/5 hover:bg-background/10 border border-border/10 hover:border-border/20 backdrop-blur-sm transition-all duration-200 rounded-lg min-w-fit"
      >
        <Calendar className="h-3 w-3 mr-1.5 opacity-70" />
        <span className="whitespace-nowrap">{getDisplayText()}</span>
      </Button>

      {isOpen && createPortal(
        <>
          <div 
            className="fixed inset-0 z-[99] backdrop-blur-sm bg-black/20 dark:bg-black/40"
            onClick={handleClose}
          />
          <div
            ref={popupRef}
            className="fixed z-[100] pointer-events-auto"
            style={{ left: position.x, top: position.y, width: dimensions.width, height: dimensions.height }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Card className="bg-white/10 dark:bg-black/10 backdrop-blur-xl border-white/20 dark:border-white/10 h-full flex flex-col shadow-2xl">
              <CardContent className="p-6 flex-1 flex flex-col overflow-hidden bg-transparent">
                <CalendarGrid
                  pickerViewMode={pickerViewMode}
                  setPickerViewMode={setPickerViewMode}
                  currentYear={currentYear}
                  currentMonth={currentMonth}
                  setCurrentYear={setCurrentYear}
                  setCurrentMonth={setCurrentMonth}
                  selectedDate={selectedDate}
                  handleDateClick={handleDateClick}
                  getTasksForDay={getTasksForDay}
                  dateColors={dateColors}
                  selectedTemplate={selectedTemplate}
                  handleLongPress={handleLongPress}
                  clearLongPress={clearLongPress}
                  cellSize={cellSize}
                  gapSize={gapSize}
                  isMobile={isMobile}
                  handleNavigation={handleNavigation}
                  viewMode={viewMode}
                  onMonthSelect={handleMonthSelect}
                  onYearSelect={handleYearSelect}
                />

                {/* Enhanced Resize Handle for Touch */}
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 cursor-nw-resize flex items-center justify-center hover:bg-accent rounded-tl transition-all duration-200 group"
                  onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                  onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); setIsResizing(true); }}
                  style={{ 
                    background: isResizing ? 'hsl(var(--primary) / 0.2)' : 'transparent',
                    touchAction: 'none'
                  }}
                >
                  <GripVertical className={`h-4 w-4 text-muted-foreground rotate-45 transition-all duration-200 ${
                    isResizing ? 'text-primary scale-110' : 'group-hover:text-foreground'
                  }`} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Color Picker Modal */}
          {showColorPicker && (
            <div 
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
            >
              <div onClick={(e) => e.stopPropagation()}>
                <ColorPicker
                  selectedColor={selectedDotColor}
                  onColorSelect={setSelectedDotColor}
                  onApply={() => {
                    if (colorPickerDate && onDateColorChange) {
                      const dateKey = colorPickerDate.toISOString().split('T')[0];
                      onDateColorChange(dateKey, selectedDotColor);
                    }
                    setShowColorPicker(false);
                    setColorPickerDate(null);
                  }}
                  onClose={() => { setShowColorPicker(false); setColorPickerDate(null); }}
                  className="max-w-sm"
                />
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </div>
  );
};