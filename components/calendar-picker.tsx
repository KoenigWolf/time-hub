'use client';

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarDates, getMonthName, getDayNames } from '@/lib/calendar-utils';
import { CalendarDate } from '@/lib/types';

interface CalendarPickerProps {
  selectedDates: string[];
  onDateToggle: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

/** カレンダーの日付セル */
const CalendarDateCell = memo(function CalendarDateCell({
  calendarDate,
  onToggle,
  isDisabled,
}: {
  calendarDate: CalendarDate;
  onToggle: (date: string) => void;
  isDisabled: boolean;
}) {
  const handleClick = useCallback(() => {
    if (!isDisabled) {
      onToggle(calendarDate.date);
    }
  }, [calendarDate.date, onToggle, isDisabled]);

  const baseClasses = "w-10 h-10 text-sm transition-all duration-200 relative";
  const todayClasses = calendarDate.isToday ? "font-bold" : "";
  const selectedClasses = calendarDate.isSelected
    ? "bg-blue-600 text-white hover:bg-blue-700"
    : "hover:bg-blue-50";
  const currentMonthClasses = calendarDate.isCurrentMonth
    ? "text-gray-900"
    : "text-gray-300";
  const disabledClasses = isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      className={`${baseClasses} ${todayClasses} ${selectedClasses} ${currentMonthClasses} ${disabledClasses}`}
      aria-label={`${calendarDate.date}${calendarDate.isSelected ? '（選択済み）' : ''}`}
    >
      {new Date(calendarDate.date).getDate()}
      {calendarDate.isToday && (
        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
      )}
    </Button>
  );
});

/** カレンダーピッカー本体 */
export const CalendarPicker = memo(function CalendarPicker({
  selectedDates,
  onDateToggle,
  minDate,
  maxDate,
}: CalendarPickerProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDates = generateCalendarDates(year, month, selectedDates);
  const dayNames = getDayNames();

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  const isDateDisabled = useCallback((date: string) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }, [minDate, maxDate]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            aria-label="前の月"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg font-medium">
            {getMonthName(year, month)}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            aria-label="次の月"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1">
            {dayNames.map(day => (
              <div
                key={day}
                className="w-10 h-8 flex items-center justify-center text-sm font-medium text-gray-600"
              >
                {day}
              </div>
            ))}
          </div>

          {/* カレンダー本体 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDates.map(calendarDate => (
              <CalendarDateCell
                key={calendarDate.date}
                calendarDate={calendarDate}
                onToggle={onDateToggle}
                isDisabled={isDateDisabled(calendarDate.date)}
              />
            ))}
          </div>

          {/* 選択状況の表示 */}
          {selectedDates.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600 mb-2">
                選択済み: {selectedDates.length}日
              </p>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selectedDates.slice(0, 10).map(date => (
                  <span
                    key={date}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    {new Date(date).toLocaleDateString('ja-JP', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                ))}
                {selectedDates.length > 10 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    他{selectedDates.length - 10}日
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}); 