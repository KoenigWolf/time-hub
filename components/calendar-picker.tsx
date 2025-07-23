'use client';

/**
 * CalendarPicker
 * - 多言語化・アクセシビリティ・スケーラビリティ・再利用性・保守性等に配慮したカレンダーピッカー
 * - 将来的な拡張や他国カレンダー対応も意識
 */

import { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { generateCalendarDates, getMonthName, getDayNames } from '@/lib/calendar-utils';
import { CalendarDate } from '@/lib/types';

// --- 国際化定義 ---
type Lang = 'ja' | 'en';

const I18N = {
  ja: {
    prevMonth: '前の月',
    nextMonth: '次の月',
    selected: '選択済み',
    selectedLabel: (n: number) => `選択済み: ${n}日`,
    otherDays: (n: number) => `他${n}日`,
    months: [
      '1月', '2月', '3月', '4月', '5月', '6月',
      '7月', '8月', '9月', '10月', '11月', '12月',
    ],
    weekdays: ['日', '月', '火', '水', '木', '金', '土'],
    formatDate: (date: string) =>
      new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
  },
  en: {
    prevMonth: 'Previous',
    nextMonth: 'Next',
    selected: 'Selected',
    selectedLabel: (n: number) => `Selected: ${n} day${n > 1 ? 's' : ''}`,
    otherDays: (n: number) => `+${n} more`,
    months: [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ],
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    formatDate: (date: string) =>
      new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  },
} as const;

// --- props型定義（拡張性・テスト容易性） ---
export interface CalendarPickerProps {
  selectedDates: string[];
  onDateToggle: (date: string) => void;
  minDate?: string;
  maxDate?: string;
  language?: Lang;
  getMonthLabel?: (year: number, month: number, language?: Lang) => string;
  getDayNames?: (language?: Lang) => string[];
}

/**
 * CalendarDateCell
 * - 単一日セルのUI（アクセシビリティ・責務分離・再利用性）
 */
const CalendarDateCell = memo(function CalendarDateCell({
  calendarDate,
  onToggle,
  isDisabled,
  language = 'ja',
}: {
  calendarDate: CalendarDate;
  onToggle: (date: string) => void;
  isDisabled: boolean;
  language?: Lang;
}) {
  const t = I18N[language];

  const handleClick = useCallback(() => {
    if (!isDisabled) onToggle(calendarDate.date);
  }, [isDisabled, onToggle, calendarDate.date]);

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
      aria-label={
        `${t.formatDate(calendarDate.date)}${calendarDate.isSelected ? `（${t.selected}）` : ''}`
      }
    >
      {new Date(calendarDate.date).getDate()}
      {calendarDate.isToday && (
        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
      )}
    </Button>
  );
});

/**
 * SelectedDatesList
 * - 選択済み日リストのUI（国際化・拡張性・責務分離）
 */
const SelectedDatesList = memo(function SelectedDatesList({
  selectedDates,
  language = 'ja',
}: {
  selectedDates: string[];
  language?: Lang;
}) {
  const t = I18N[language];

  if (selectedDates.length === 0) return null;

  return (
    <div className="pt-3 border-t border-gray-100">
      <p className="text-sm text-gray-600 mb-2">
        {t.selectedLabel(selectedDates.length)}
      </p>
      <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
        {selectedDates.slice(0, 10).map(date => (
          <span
            key={date}
            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
          >
            {t.formatDate(date)}
          </span>
        ))}
        {selectedDates.length > 10 && (
          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
            {t.otherDays(selectedDates.length - 10)}
          </span>
        )}
      </div>
    </div>
  );
});

/**
 * CalendarPicker
 * - カレンダーUI本体
 * - 全観点に配慮し、アクセシビリティ・国際化・型安全・再利用性重視
 */
export const CalendarPicker = memo(function CalendarPicker({
  selectedDates,
  onDateToggle,
  minDate,
  maxDate,
  language = 'ja',
  getMonthLabel,
  getDayNames: getDayNamesOverride,
}: CalendarPickerProps) {
  // 現在表示している月
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // カレンダー表示用日付配列・曜日名
  const calendarDates = generateCalendarDates(year, month, selectedDates);
  const t = I18N[language];

  const monthLabel =
    getMonthLabel?.(year, month, language) ?? `${t.months[month]} ${year}`;
  const dayNames = getDayNamesOverride?.(language) ?? t.weekdays;

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
          <Button variant="ghost" size="sm" onClick={handlePrevMonth} aria-label={t.prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg font-medium">{monthLabel}</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleNextMonth} aria-label={t.nextMonth}>
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
                aria-label={day}
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
                language={language}
              />
            ))}
          </div>
          {/* 選択済み日リスト */}
          <SelectedDatesList selectedDates={selectedDates} language={language} />
        </div>
      </CardContent>
    </Card>
  );
});
