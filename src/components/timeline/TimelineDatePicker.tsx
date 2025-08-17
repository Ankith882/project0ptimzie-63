import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { EnhancedDatePicker } from '@/components/extra-panel/EnhancedDatePicker';
import { cn } from '@/lib/utils';

interface TimelineDatePickerProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  timeMode: string;
  className?: string;
}

export const TimelineDatePicker: React.FC<TimelineDatePickerProps> = ({
  selectedDate,
  onDateSelect,
  timeMode,
  className
}) => {
  const [currentDate, setCurrentDate] = useState(selectedDate);

  const getDisplayText = () => {
    switch (timeMode) {
      case 'weekly': {
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
      case 'monthly':
        return format(selectedDate, 'MMMM yyyy');
      case 'yearly':
        return format(selectedDate, 'yyyy');
      default:
        return format(selectedDate, 'PPP');
    }
  };

  const handleDateChange = (date: Date) => {
    let adjustedDate = date;
    
    // Adjust date based on time mode
    switch (timeMode) {
      case 'weekly':
        // For weekly, we want the start of the selected week
        adjustedDate = startOfWeek(date, { weekStartsOn: 0 });
        break;
      case 'monthly':
        // For monthly, we want the start of the selected month
        adjustedDate = startOfMonth(date);
        break;
      case 'yearly':
        // For yearly, we want the start of the selected year
        adjustedDate = startOfYear(date);
        break;
    }
    
    setCurrentDate(adjustedDate);
    onDateSelect(adjustedDate);
  };


  return (
    <div className={cn("flex items-center gap-1", className)}>
      <EnhancedDatePicker
        selectedDate={currentDate}
        onDateSelect={handleDateChange}
        isDarkMode={false}
        selectedTemplate={timeMode}
        viewMode={timeMode === 'weekly' ? 'week' : timeMode === 'monthly' ? 'month' : timeMode === 'yearly' ? 'year' : 'month'}
      />
    </div>
  );
};