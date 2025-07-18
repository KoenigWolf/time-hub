'use client';

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarDates, getMonthName, getDayNames } from '@/lib/calendar-utils';
import { CalendarDate } from '@/lib/types';

// カレンダーのprops型（拡張性のためexport）
export interface CalendarPickerProps {
  selectedDates: string[];
  onDateToggle: (date: string) => void;
  minDate?: string;
  maxDate?: string;
}

// カレンダー日付セル（小コンポーネントで責務分割・再利用性向上）
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
    if (!isDisabled) onToggle(calendarDate.date);
  }, [isDisabled, onToggle, calendarDate.date]);

  // クラス名生成
  const className =
    "w-10 h-10 text-sm transition-all duration-200 relative " +
    (calendarDate.isToday ? "font-bold " : "") +
    (calendarDate.isSelected ? "bg-blue-600 text-white hover:bg-blue-700 " : "hover:bg-blue-50 ") +
    (calendarDate.isCurrentMonth ? "text-gray-900 " : "text-gray-300 ") +
    (isDisabled ? "opacity-50 cursor-not-allowed " : "cursor-pointer ");

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isDisabled}
      className={className}
      aria-label={`${calendarDate.date}${calendarDate.isSelected ? '（選択済み）' : ''}`}
    >
      {new Date(calendarDate.date).getDate()}
      {calendarDate.isToday && (
        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
      )}
    </Button>
  );
});

// 選択済み日リスト表示（コンポーネント化で可読性・再利用性向上）
const SelectedDatesList = memo(function SelectedDatesList({
  selectedDates,
}: {
  selectedDates: string[];
}) {
  if (selectedDates.length === 0) return null;

  return (
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
  );
});

// カレンダーピッカー本体
export const CalendarPicker = memo(function CalendarPicker({
  selectedDates,
  onDateToggle,
  minDate,
  maxDate,
}: CalendarPickerProps) {
  // 現在表示している月
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // カレンダー表示用日付配列・曜日名
  const calendarDates = generateCalendarDates(year, month, selectedDates);
  const dayNames = getDayNames();

  // 前月・次月ボタンハンドラ
  const handlePrevMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }, []);
  const handleNextMonth = useCallback(() => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }, []);

  // 日付の選択可否判定
  const isDateDisabled = useCallback((date: string) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  }, [minDate, maxDate]);

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} aria-label="前の月">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg font-medium">
            {getMonthName(year, month)}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} aria-label="次の月">
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
          {/* 選択済み日リスト */}
          <SelectedDatesList selectedDates={selectedDates} />
        </div>
      </CardContent>
    </Card>
  );
});
