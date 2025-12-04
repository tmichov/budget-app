import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DatePickerProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (date: string) => void;
  label?: string;
}

export function DatePicker({ value, onChange, label }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    new Date(value || new Date().toISOString().split('T')[0])
  );

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;
  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectDate = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const isoDate = `${year}-${month}-${dayStr}`;
    onChange(isoDate);
    setIsOpen(false);
  };

  const displayDate = selectedDate
    ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Select date';

  const days = [];
  const totalCells = firstDayOfMonth(currentMonth) + daysInMonth(currentMonth);

  for (let i = 0; i < firstDayOfMonth(currentMonth); i++) {
    days.push(null);
  }

  for (let i = 1; i <= daysInMonth(currentMonth); i++) {
    days.push(i);
  }

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium mb-2 text-foreground">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-left"
      >
        {displayDate}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg z-50 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronLeft size={20} className="text-foreground" />
            </button>
            <h3 className="text-sm font-semibold text-foreground">{monthName}</h3>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <ChevronRight size={20} className="text-foreground" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-xs font-medium text-center text-text-secondary py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isSelected =
                day &&
                selectedDate &&
                day === selectedDate.getDate() &&
                currentMonth.getMonth() === selectedDate.getMonth() &&
                currentMonth.getFullYear() === selectedDate.getFullYear();

              const isToday =
                day &&
                new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear();

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => day && selectDate(day)}
                  disabled={!day}
                  className={`
                    py-2 text-sm rounded transition-colors
                    ${!day ? 'opacity-0 cursor-default' : ''}
                    ${isSelected
                      ? 'bg-primary text-white font-semibold'
                      : isToday
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-foreground hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-full mt-4 py-2 text-sm font-medium text-primary hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
