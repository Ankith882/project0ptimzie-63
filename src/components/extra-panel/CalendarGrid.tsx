import React from 'react';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getProgressColor } from '@/utils/progressColors';

interface CalendarGridProps {
  pickerViewMode: 'days' | 'months' | 'years';
  setPickerViewMode: (mode: 'days' | 'months' | 'years') => void;
  currentYear: number;
  currentMonth: number;
  setCurrentYear: (year: number) => void;
  setCurrentMonth: (month: number) => void;
  selectedDate: Date;
  handleDateClick: (day: number) => void;
  getTasksForDay: (day: number) => any[];
  dateColors: {[key: string]: string};
  selectedTemplate: string;
  handleLongPress: (day: number) => void;
  clearLongPress: () => void;
  cellSize: number;
  gapSize: number;
  isMobile: boolean;
  handleNavigation: (direction: 'prev' | 'next') => void;
  viewMode?: string;
  onMonthSelect?: (month: number) => void;
  onYearSelect?: (year: number) => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const YEARS = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  pickerViewMode,
  setPickerViewMode,
  currentYear,
  currentMonth,
  setCurrentYear,
  setCurrentMonth,
  selectedDate,
  handleDateClick,
  getTasksForDay,
  dateColors,
  selectedTemplate,
  handleLongPress,
  clearLongPress,
  cellSize,
  gapSize,
  isMobile,
  handleNavigation,
  viewMode,
  onMonthSelect,
  onYearSelect
}) => {
  const renderDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const elements = [];

    // Empty cells for start of month
    for (let i = 0; i < firstDay; i++) {
      elements.push(<div key={`empty-${i}`} style={{ width: cellSize, height: cellSize }} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const isSelected = selectedDate.toDateString() === dayDate.toDateString();
      const tasks = getTasksForDay(day);
      const hasTasks = tasks.length > 0;
      const isCurrentOrPast = dayDate <= new Date();
      
      let progressPercentage = 0;
      if (hasTasks) {
        const completed = tasks.filter(task => task.completed).length;
        progressPercentage = Math.round((completed / tasks.length) * 100);
      }
      
      const dateKey = dayDate.toISOString().split('T')[0];
      const dotColor = dateColors[dateKey] || '#00FF00';

      elements.push(
        <div key={day} className="relative flex items-center justify-center" style={{ width: cellSize, height: cellSize }}>
          {hasTasks && selectedTemplate === 'task' && isCurrentOrPast && (
            <div 
              className="absolute inset-0 rounded-full overflow-hidden border border-white/20"
              style={{ width: cellSize, height: cellSize }}
            >
              <div 
                className="absolute bottom-0 left-0 right-0 transition-all duration-300"
                style={{ 
                  height: `${Math.max(progressPercentage, 8)}%`,
                  backgroundColor: getProgressColor(progressPercentage),
                  opacity: 0.85
                }}
              />
            </div>
          )}
          
          <button
            onClick={() => handleDateClick(day)}
            onMouseDown={() => handleLongPress(day)}
            onMouseUp={clearLongPress}
            onMouseLeave={clearLongPress}
            onTouchStart={() => handleLongPress(day)}
            onTouchEnd={clearLongPress}
            className={`rounded-full font-medium transition-all flex items-center justify-center relative z-10 ${
              isSelected ? 'bg-blue-500 text-white' : 
              hasTasks ? 'text-white font-bold hover:bg-accent/20' : 'text-foreground hover:bg-accent'
            } ${hasTasks && selectedTemplate === 'task' ? 'bg-transparent' : ''}`}
            style={{ 
              width: cellSize, 
              height: cellSize,
              fontSize: `${isMobile ? 12 : 14}px`,
              textShadow: hasTasks && selectedTemplate === 'task' && isCurrentOrPast ? '0 1px 2px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            {day}
          </button>
          
          {hasTasks && selectedTemplate !== 'task' && (
            <div 
              className="absolute left-1/2 transform -translate-x-1/2 rounded-full z-20"
              style={{ 
                backgroundColor: dotColor,
                bottom: '3px',
                width: isMobile ? '5px' : '8px',
                height: isMobile ? '5px' : '8px'
              }}
            />
          )}
        </div>
      );
    }

    return elements;
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <Button variant="ghost" size="sm" onClick={() => handleNavigation('prev')} className="hover:bg-accent">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <button
          onClick={() => {
            if (pickerViewMode === 'days') setPickerViewMode('months');
            else if (pickerViewMode === 'months') setPickerViewMode('years');
          }}
          className="font-medium text-foreground hover:underline"
        >
          {pickerViewMode === 'days' && `${MONTH_NAMES[currentMonth]} ${currentYear}`}
          {pickerViewMode === 'months' && currentYear}
          {pickerViewMode === 'years' && 'Select Year'}
        </button>

        <Button variant="ghost" size="sm" onClick={() => handleNavigation('next')} className="hover:bg-accent">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto">
        {pickerViewMode === 'days' && (
          <div>
            <div className="grid grid-cols-7 mb-3" style={{ gap: `${gapSize}px` }}>
              {DAYS.map(day => (
                <div 
                  key={day}
                  className="text-center text-xs font-semibold text-muted-foreground flex items-center justify-center"
                  style={{ width: cellSize, height: 20 }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7" style={{ gap: `${gapSize}px` }}>
              {renderDays()}
            </div>
          </div>
        )}

        {pickerViewMode === 'months' && (
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {MONTHS.map((month, index) => (
              <button
                key={month}
                onClick={() => { 
                  setCurrentMonth(index); 
                  // If in month view mode, close the picker instead of navigating to days
                  if (viewMode === 'month' && onMonthSelect) {
                    onMonthSelect(index);
                  } else {
                    setPickerViewMode('days');
                  }
                }}
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  currentMonth === index ? 'bg-primary/20' : ''
                } text-foreground`}
              >
                {month}
              </button>
            ))}
          </div>
        )}

        {pickerViewMode === 'years' && (
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
            {YEARS.map(year => (
              <button
                key={year}
                onClick={() => { 
                  setCurrentYear(year); 
                  // If in month view mode, navigate to months for selection
                  if (viewMode === 'month') {
                    setPickerViewMode('months');
                  } else if (onYearSelect) {
                    // For other modes with onYearSelect, close the picker
                    onYearSelect(year);
                  } else {
                    setPickerViewMode('months');
                  }
                }}
                className={`p-2 rounded text-sm hover:bg-accent transition-colors ${
                  currentYear === year ? 'bg-primary/20' : ''
                } text-foreground`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};